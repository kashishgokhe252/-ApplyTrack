const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Please set a strong JWT_SECRET (at least 32 characters) in .env");
}

app.use(cors());
app.use(express.json());

// =====================================
// MYSQL DATABASE CONNECTION
// =====================================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =====================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Please login first."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        req.user = user;
        next();
    });
};

// =====================================
// DATABASE HEALTH CHECK
// =====================================

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "ApplyTrack backend and database connected"
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            success: false,
            error: "Database connection failed"
        });
    }
});

// =====================================
// USER SIGNUP API
// =====================================

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        if (name.trim().length > 100 || normalizedEmail.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Name or email is too long"
            });
        }

        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword]
        );

        const token = jwt.sign(
            {
                id: result.insertId,
                email: normalizedEmail
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail
            }
        });

    } catch (error) {
        console.error("Signup Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to create account"
        });
    }
});

// =====================================
// USER LOGIN API
// =====================================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            `SELECT id, name, email, password
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to login"
        });
    }
});


// =====================================
// GET USER PROFILE API
// =====================================

app.get("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Profile fetch error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch profile"
        });
    }
});

// =====================================
// UPDATE USER PROFILE API
// =====================================

app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            !name.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length > 100 || cleanEmail.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Name or email is too long"
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [cleanEmail, req.user.id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        const [result] = await db.query(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            [cleanName, cleanEmail, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: req.user.id,
                name: cleanName,
                email: cleanEmail
            }
        });

    } catch (error) {
        console.error("Profile update error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
});



// =====================================
// CHANGE PASSWORD API
// =====================================

app.put("/api/auth/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate inputs
        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Both passwords are required"
            });
        }

        // New password validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters"
            });
        }

        // bcrypt supports passwords up to 72 bytes
        if (Buffer.byteLength(newPassword, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "New password is too long"
            });
        }

        // Get current user's password
        const [users] = await db.query(
            "SELECT password FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Prevent reusing the same password
        const isSamePassword = await bcrypt.compare(
            newPassword,
            users[0].password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different"
            });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to change password"
        });
    }
});


// =====================================
// JOB APPLICATION CRUD APIs
// =====================================

// GET ALL APPLICATIONS

app.get("/api/applications", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                id,
                company,
                role,
                location,
                DATE_FORMAT(application_date, '%Y-%m-%d') AS date,
                status,
                next_step,
                DATE_FORMAT(follow_up_date, '%Y-%m-%d') AS follow_up_date,
                notes,
                updated_at
             FROM applications
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.user.id]
        );

        res.json(rows);

    } catch (error) {
        console.error("Fetch error:", error.message);

        res.status(500).json({
            error: "Unable to fetch applications"
        });
    }
});

// ADD APPLICATION

app.post("/api/applications", authenticateToken, async (req, res) => {
    try {
        const {
            company,
            role,
            location,
            date,
            status,
            next_step,
            follow_up_date,
            notes
        } = req.body;

        if (
            typeof company !== "string" ||
            typeof role !== "string" ||
            typeof date !== "string" ||
            typeof status !== "string" ||
            !company.trim() ||
            !role.trim() ||
            !date.trim() ||
            !status.trim()
        ) {
            return res.status(400).json({
                error: "Please fill all required fields"
            });
        }

        const [result] = await db.query(
            `INSERT INTO applications
            (
                company,
                role,
                location,
                application_date,
                status,
                next_step,
                follow_up_date,
                notes,
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company.trim(),
                role.trim(),
                typeof location === "string" ? location.trim() : "",
                date,
                status.trim(),
                typeof next_step === "string" ? next_step.trim() : null,
                follow_up_date || null,
                typeof notes === "string" ? notes.trim() : null,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Application added successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Add error:", error.message);

        res.status(500).json({
            error: "Unable to add application"
        });
    }
});

// UPDATE APPLICATION

app.put("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
        const applicationId = Number(req.params.id);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return res.status(400).json({
                error: "Invalid application ID"
            });
        }

        const {
            company,
            role,
            location,
            date,
            status,
            next_step,
            follow_up_date,
            notes
        } = req.body;

        if (
            typeof company !== "string" ||
            typeof role !== "string" ||
            typeof date !== "string" ||
            typeof status !== "string" ||
            !company.trim() ||
            !role.trim() ||
            !date.trim() ||
            !status.trim()
        ) {
            return res.status(400).json({
                error: "Please fill all required fields"
            });
        }

        const [result] = await db.query(
            `UPDATE applications
             SET company = ?,
                 role = ?,
                 location = ?,
                 application_date = ?,
                 status = ?,
                 next_step = ?,
                 follow_up_date = ?,
                 notes = ?
             WHERE id = ? AND user_id = ?`,
            [
                company.trim(),
                role.trim(),
                typeof location === "string" ? location.trim() : "",
                date,
                status.trim(),
                typeof next_step === "string" ? next_step.trim() : null,
                follow_up_date || null,
                typeof notes === "string" ? notes.trim() : null,
                applicationId,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.json({
            success: true,
            message: "Application updated successfully"
        });

    } catch (error) {
        console.error("Update error:", error.message);

        res.status(500).json({
            error: "Unable to update application"
        });
    }
});

// DELETE APPLICATION

app.delete("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
        const applicationId = Number(req.params.id);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return res.status(400).json({
                error: "Invalid application ID"
            });
        }

        const [result] = await db.query(
            `DELETE FROM applications
             WHERE id = ? AND user_id = ?`,
            [applicationId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.json({
            success: true,
            message: "Application deleted successfully"
        });

    } catch (error) {
        console.error("Delete error:", error.message);

        res.status(500).json({
            error: "Unable to delete application"
        });
    }
});

// =====================================
// PDF UPLOAD CONFIGURATION
// =====================================

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (
            file.mimetype !== "application/pdf" ||
            !file.originalname.toLowerCase().endsWith(".pdf")
        ) {
            return cb(new Error("Only PDF resume files are allowed"));
        }

        cb(null, true);
    }
});

// =====================================
// SMART SKILL DATABASE
// =====================================

const skillDatabase = {
    "HTML": ["html", "html5", "hypertext markup language"],
    "CSS": ["css", "css3", "cascading style sheets"],
    "JavaScript": ["javascript", "java script", "js", "ecmascript"],
    "React.js": ["react", "react.js", "reactjs"],
    "Node.js": ["node", "node.js", "nodejs"],
    "Express.js": ["express", "express.js", "expressjs"],
    "MySQL": ["mysql", "my sql"],
    "MongoDB": ["mongodb", "mongo db"],
    "SQL": ["sql", "structured query language"],
    "Python": ["python", "python programming"],
    "Java": ["java", "core java", "java programming"],
    "C": ["c language", "programming in c"],
    "C++": ["c++", "cpp", "cplusplus"],
    "C#": ["c#", "c sharp"],
    "PHP": ["php"],
    "DSA": [
        "dsa",
        "data structures and algorithms",
        "data structure and algorithms",
        "data structures",
        "data structure",
        "algorithms"
    ],
    "OOPs": [
        "oops",
        "oop",
        "object oriented programming",
        "object-oriented programming",
        "object oriented programming system",
        "object oriented concepts"
    ],
    "Git": ["git", "git version control", "version control using git"],
    "GitHub": ["github", "git hub"],
    "REST API": [
        "rest api",
        "restful api",
        "rest apis",
        "restful apis",
        "restful services",
        "representational state transfer"
    ],
    "Bootstrap": ["bootstrap", "bootstrap css"],
    "Tailwind CSS": ["tailwind", "tailwind css"],
    "TypeScript": ["typescript", "type script"],
    "Angular": ["angular", "angularjs"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Spring Boot": ["spring boot", "springboot"],
    "PostgreSQL": ["postgresql", "postgres"],
    "Firebase": ["firebase"],
    "AWS": ["aws", "amazon web services"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Machine Learning": ["machine learning", "ml"],
    "Artificial Intelligence": ["artificial intelligence", "ai"],
    "Deep Learning": ["deep learning"],
    "Data Science": ["data science"],
    "NumPy": ["numpy"],
    "Pandas": ["pandas"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Linux": ["linux"],
    "Networking": [
        "computer networks",
        "computer networking",
        "networking"
    ],
    "Cybersecurity": ["cybersecurity", "cyber security"],
    "Figma": ["figma"],
    "Agile": ["agile", "agile methodology"],
    "Problem Solving": ["problem solving", "problem-solving"]
};

// =====================================
// TEXT NORMALIZATION
// =====================================

function normalizeText(text) {
    return String(text)
        .toLowerCase()
        .replace(/[\u2010-\u2015]/g, "-")
        .replace(/[^\w+#.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// =====================================
// SAFE KEYWORD MATCHING
// =====================================

function containsSkill(text, keyword) {
    const escaped = keyword
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(
        `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
        "i"
    );

    return regex.test(text);
}

// =====================================
// SMART SKILL EXTRACTION
// =====================================

function extractSkills(text) {
    const normalizedText = normalizeText(text);

    const foundSkills = [];
    const skillDetails = [];

    for (const [canonicalSkill, aliases] of Object.entries(skillDatabase)) {
        const matchedAlias = aliases.find(alias => {
            return containsSkill(
                normalizedText,
                normalizeText(alias)
            );
        });

        if (matchedAlias) {
            foundSkills.push(canonicalSkill);

            skillDetails.push({
                skill: canonicalSkill,
                matchedAlias
            });
        }
    }

    return {
        skills: foundSkills,
        details: skillDetails
    };
}

// =====================================
// SMART SKILL COMPARISON
// =====================================

function compareSkills(resumeSkills, requiredSkills) {
    const resumeSet = new Set(resumeSkills);
    const requiredSet = new Set(requiredSkills);

    const matchedSkills = [];
    const missingSkills = [];

    for (const skill of requiredSet) {
        if (resumeSet.has(skill)) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    }

    const score = requiredSet.size === 0
        ? 0
        : Math.round(
            (matchedSkills.length / requiredSet.size) * 100
        );

    return {
        score,
        matchedSkills,
        missingSkills,
        totalMatchedSkills: matchedSkills.length,
        totalRequiredSkills: requiredSet.size
    };
}

// =====================================
// ATS READINESS CHECK
// =====================================

function analyzeATS(resumeText) {
    const checks = [
        {
            name: "Resume text extraction",
            passed: resumeText.length >= 300,
            message: resumeText.length >= 300
                ? "Resume text extracted successfully."
                : "Add more readable text to your resume."
        },
        {
            name: "Email address",
            passed: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resumeText),
            message: "Add a valid email address to your resume."
        },
        {
            name: "Phone number",
            passed: /(?:\+?\d[\d\s()-]{8,}\d)/.test(resumeText),
            message: "Add a contact phone number."
        },
        {
            name: "Education section",
            passed: /\b(education|qualification|academic)\b/i.test(resumeText),
            message: "Add a clearly labelled Education section."
        },
        {
            name: "Skills section",
            passed: /\b(skills|technical skills|technologies)\b/i.test(resumeText),
            message: "Add a clearly labelled Skills section."
        },
        {
            name: "Experience or projects section",
            passed: /\b(experience|internship|projects|work history)\b/i.test(resumeText),
            message: "Add an Experience or Projects section."
        }
    ];

    const passed = checks.filter(check => check.passed).length;

    return {
        score: Math.round((passed / checks.length) * 100),
        passedChecks: passed,
        totalChecks: checks.length,
        checks
    };
}

// =====================================
// IMPROVEMENT SUGGESTIONS
// =====================================

function generateSuggestions(missingSkills, ats, resumeSkills) {
    const suggestions = [];

    if (missingSkills.length > 0) {
        suggestions.push(
            `Consider learning and demonstrating these job-required skills: ${missingSkills.join(", ")}.`
        );
    }

    if (ats.score < 100) {
        const failedChecks = ats.checks
            .filter(check => !check.passed)
            .map(check => check.name);

        suggestions.push(
            `Review these resume sections: ${failedChecks.join(", ")}.`
        );
    }

    if (resumeSkills.length < 5) {
        suggestions.push(
            "Add more relevant technical skills that you genuinely know."
        );
    }

    if (resumeSkills.length > 0) {
        suggestions.push(
            "Add practical projects demonstrating your technical skills."
        );
    }

    if (suggestions.length === 0) {
        suggestions.push(
            "Your resume covers the detected job requirements. Keep your projects and experience updated."
        );
    }

    return suggestions;
}

// =====================================
// RESUME ANALYZER API
// =====================================

app.post(
    "/api/resume/analyze",
    authenticateToken,
    upload.single("resume"),
    async (req, res) => {
        let parser;

        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload a PDF resume"
                });
            }

            const { jobDescription } = req.body;

            if (
                typeof jobDescription !== "string" ||
                !jobDescription.trim()
            ) {
                return res.status(400).json({
                    error: "Please enter a job description"
                });
            }

            // Validate PDF signature

            const pdfSignature = req.file.buffer
                .subarray(0, 5)
                .toString();

            if (pdfSignature !== "%PDF-") {
                return res.status(400).json({
                    error: "Invalid PDF file"
                });
            }

            // Extract PDF text

            parser = new PDFParse({
                data: req.file.buffer
            });

            const pdfResult = await parser.getText();
            const resumeText = pdfResult.text || "";

            if (resumeText.trim().length < 50) {
                return res.status(400).json({
                    error: "Could not extract enough text. Please upload a text-based PDF resume."
                });
            }

            // Extract resume skills

            const resumeResult = extractSkills(resumeText);

            // Extract job description skills

            const jobResult = extractSkills(jobDescription);

            const resumeSkills = resumeResult.skills;
            const requiredSkills = jobResult.skills;

            if (requiredSkills.length === 0) {
                return res.status(400).json({
                    error: "No recognized technical skills found in the job description. Please add relevant skills."
                });
            }

            // Compare skills

            const comparison = compareSkills(
                resumeSkills,
                requiredSkills
            );

            const {
                score,
                matchedSkills,
                missingSkills,
                totalMatchedSkills,
                totalRequiredSkills
            } = comparison;

            // ATS analysis

            const ats = analyzeATS(resumeText);

            // Suggestions

            const suggestions = generateSuggestions(
                missingSkills,
                ats,
                resumeSkills
            );

            // Final response

            res.json({
                success: true,
                resumeText,
                jobDescription,
                pages: pdfResult.total || pdfResult.pages?.length || 0,

                analysis: {
                    score,
                    totalMatchedSkills,
                    totalRequiredSkills,
                    matchedSkills,
                    missingSkills,
                    resumeSkills,
                    requiredSkills,
                    resumeSkillDetails: resumeResult.details,
                    requiredSkillDetails: jobResult.details,
                    atsScore: ats.score,
                    atsChecks: ats.checks,
                    suggestions
                }
            });

        } catch (error) {
            console.error("Resume Analysis Error:", error);

            res.status(500).json({
                error: "Resume analysis failed. Please try again."
            });

        } finally {
            if (parser) {
                try {
                    await parser.destroy();
                } catch (error) {
                    console.error(
                        "PDF parser cleanup error:",
                        error.message
                    );
                }
            }
        }
    }
);

// =====================================
// MULTER ERROR HANDLING
// =====================================

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            error: error.code === "LIMIT_FILE_SIZE"
                ? "Resume PDF must be smaller than 5MB"
                : error.message
        });
    }

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    next();
});

// =====================================
// UNKNOWN ROUTE HANDLER
// =====================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, async () => {
    console.log(`ApplyTrack server running on port ${PORT}`);

    try {
        await db.query("SELECT 1");
        console.log("MySQL database connected successfully");
    } catch (error) {
        console.error("MySQL connection error:", error.message);
    }
});