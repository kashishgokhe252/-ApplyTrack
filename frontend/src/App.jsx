import Auth from "./Auth";
import { useState, useEffect } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";

const API_URL = "http://localhost:5000/api/applications";
const RESUME_API = "http://localhost:5000/api/resume/analyze";

const INITIAL_FORM = {
  company: "",
  role: "",
  location: "",
  date: "",
  status: "Applied",
  next_step: "",
  follow_up_date: "",
  notes: "",
};

const STATUSES = [
  "Applied",
  "Assessment",
  "Interview",
  "Selected",
  "Rejected",
];

// =====================================
// DASHBOARD
// =====================================

function Dashboard({ token, user, onLogout, onUserUpdate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [draggedOverColumn, setDraggedOverColumn] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  // =====================================
  // PROFILE MANAGEMENT
  // =====================================

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("");

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMessage("Name and email are required.");
      setProfileMessageType("error");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profileForm.name,
            email: profileForm.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed.");
      }

      onUserUpdate(data.user);

      setIsEditingProfile(false);
      setProfileMessage("Profile updated successfully!");
      setProfileMessageType("success");
    } catch (err) {
      setProfileMessage(err.message);
      setProfileMessageType("error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });

    setIsEditingProfile(false);
    setProfileMessage("");
  };

  // =====================================
  // CHANGE PASSWORD MANAGEMENT
  // =====================================

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("");

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage("Please fill in all password fields.");
      setPasswordMessageType("error");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      setPasswordMessageType("error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      setPasswordMessageType("error");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage("Password changed successfully!");
      setPasswordMessageType("success");
    } catch (err) {
      setPasswordMessage(err.message);
      setPasswordMessageType("error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // =====================================
  // RESUME MATCHER
  // =====================================

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // =====================================
  // SIDEBAR NAVIGATION
  // =====================================

  const goToSection = (section) => {
    setActiveSection(section);

    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =====================================
  // FETCH APPLICATIONS
  // =====================================

  const fetchJobs = async () => {
    try {
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Unable to fetch applications");
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // =====================================
  // FORM HANDLING
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
  };

  // =====================================
  // ADD OR UPDATE APPLICATION
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      resetForm();
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // EDIT APPLICATION
  // =====================================

  const handleEdit = (job) => {
    setForm({
      company: job.company || "",
      role: job.role || "",
      location: job.location || "",
      date: job.date
        ? String(job.date).slice(0, 10)
        : "",
      status: job.status || "Applied",
      next_step: job.next_step || "",
      follow_up_date: job.follow_up_date
        ? String(job.follow_up_date).slice(0, 10)
        : "",
      notes: job.notes || "",
    });

    setEditingId(job.id);
    goToSection("applications");
  };

  // =====================================
  // DELETE APPLICATION
  // =====================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Delete failed");
      }

      if (editingId === id) {
        resetForm();
      }

      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // UPDATE APPLICATION STATUS
  // =====================================

  const handleStatusChange = async (job, newStatus) => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company: job.company || "",
          role: job.role || "",
          location: job.location || "",
          date: job.date
            ? String(job.date).slice(0, 10)
            : "",
          status: newStatus,
          next_step: job.next_step || "",
          follow_up_date: job.follow_up_date
            ? String(job.follow_up_date).slice(0, 10)
            : "",
          notes: job.notes || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Status update failed");
      }

      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // DRAG AND DROP
  // =====================================

  const handleDragStart = (e, job) => {
    e.dataTransfer.setData("jobId", String(job.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    const jobId = Number(e.dataTransfer.getData("jobId"));

    const job = jobs.find(
      (item) => Number(item.id) === jobId
    );

    setDraggedOverColumn("");

    if (job && job.status !== newStatus) {
      await handleStatusChange(job, newStatus);
    }
  };

  // =====================================
  // RESUME SKILL MATCHER
  // =====================================

  const handleResumeSubmit = async (e) => {
    e.preventDefault();

    if (!resumeFile) {
      setResumeMessage("Please upload your resume PDF.");
      return;
    }

    if (!jobDescription.trim()) {
      setResumeMessage("Please enter a job description.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResumeMessage("Analyzing your resume...");
      setResumeAnalysis(null);

      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch(RESUME_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed");
      }

      if (!data.analysis) {
        throw new Error("Analysis data was not received from backend.");
      }

      setResumeAnalysis(data);
      setResumeMessage("Resume analysis completed successfully!");
    } catch (err) {
      setResumeMessage(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =====================================
  // STATISTICS
  // =====================================

  const total = jobs.length;

  const applied = jobs.filter(
    (j) => j.status === "Applied"
  ).length;

  const assessment = jobs.filter(
    (j) => j.status === "Assessment"
  ).length;

  const interview = jobs.filter(
    (j) => j.status === "Interview"
  ).length;

  const selected = jobs.filter(
    (j) => j.status === "Selected"
  ).length;

  const rejected = jobs.filter(
    (j) => j.status === "Rejected"
  ).length;

  // =====================================
  // CHART DATA
  // =====================================

  const chartData = [
    { name: "Applied", value: applied },
    { name: "Assessment", value: assessment },
    { name: "Interview", value: interview },
    { name: "Selected", value: selected },
    { name: "Rejected", value: rejected },
  ];

  const COLORS = [
    "#7666ed",
    "#38a3d1",
    "#f5b942",
    "#28b879",
    "#ed6464",
  ];

  const monthlyData = Object.values(
    jobs.reduce((acc, job) => {
      const month = job.date
        ? String(job.date).slice(0, 7)
        : "Unknown";

      if (!acc[month]) {
        acc[month] = {
          month,
          applications: 0,
        };
      }

      acc[month].applications++;

      return acc;
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month));

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.company || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (job.role || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || job.status === filter;

    return matchesSearch && matchesFilter;
  });

  // =====================================
  // FOLLOW-UP REMINDERS
  // =====================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingFollowUps = jobs.filter((job) => {
    if (!job.follow_up_date) return false;

    const followUp = new Date(
      `${String(job.follow_up_date).slice(0, 10)}T00:00:00`
    );

    return (
      !Number.isNaN(followUp.getTime()) &&
      followUp <= today
    );
  });

  // =====================================
  // RESUME ANALYSIS DATA
  // =====================================

  const analysis = resumeAnalysis?.analysis;

  const matchedSkills = analysis?.matchedSkills || [];
  const missingSkills = analysis?.missingSkills || [];
  const resumeSkills = analysis?.resumeSkills || [];
  const suggestions = analysis?.suggestions || [];

  const requiredSkills =
    Array.isArray(analysis?.requiredSkills) &&
    analysis.requiredSkills.length > 0
      ? analysis.requiredSkills
      : [...new Set([...matchedSkills, ...missingSkills])];

  // =====================================
  // SKILL GUIDANCE
  // =====================================

  const skillGuidance = {
    mysql: {
      priority: "High",
      reason: "Learn relational database design, queries, joins and CRUD operations.",
      project: "Build a Student Management System using MySQL.",
    },

    sql: {
      priority: "High",
      reason: "Practice SELECT, WHERE, GROUP BY, JOIN, subqueries and aggregate functions.",
      project: "Create a database project with 3–4 related tables and useful reports.",
    },

    dsa: {
      priority: "High",
      reason: "Practice arrays, strings, searching, sorting, linked lists, stacks and queues.",
      project: "Solve beginner-to-intermediate DSA problems and document your solutions.",
    },

    oops: {
      priority: "High",
      reason: "Revise classes, objects, inheritance, polymorphism, abstraction and encapsulation.",
      project: "Build a Java-based Library or Student Management application using OOP.",
    },

    "rest api": {
      priority: "High",
      reason: "Understand HTTP methods, status codes, request/response and API testing.",
      project: "Create a REST API with Express.js for managing applications or students.",
    },

    git: {
      priority: "Medium",
      reason: "Practice repositories, commits, branches, merges and pull requests.",
      project: "Upload one existing project to GitHub with a clear README.",
    },
  };

  const getSkillGuidance = (skill) => {
    const key = String(skill).toLowerCase().trim();

    return (
      skillGuidance[key] || {
        priority: "Medium",
        reason: `Build practical knowledge of ${skill} and add evidence of it to your resume.`,
        project: `Create a small project that demonstrates ${skill}.`,
      }
    );
  };

  // =====================================
  // ATS SCORE
  // =====================================

  const atsScore =
    analysis?.atsScore ??
    analysis?.ats?.score ??
    null;

  const rawAtsChecks =
    analysis?.atsChecks ??
    analysis?.ats?.checks ??
    [];

  const atsChecks = Array.isArray(rawAtsChecks)
    ? rawAtsChecks
    : Object.entries(rawAtsChecks).map(([name, value]) => {
        if (typeof value === "object" && value !== null) {
          return { name, ...value };
        }

        return {
          name,
          passed: Boolean(value),
        };
      });

  const isCheckPassed = (check) => {
    if (typeof check === "boolean") return check;
    if (typeof check === "string") return false;

    return (
      check?.passed ??
      check?.success ??
      check?.isValid ??
      (check?.status === "passed")
    );
  };

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">
        <h2>
          ApplyTrack<span>.</span>
        </h2>

        <p className="menu-title">MENU</p>

        <div
          className={`menu ${activeSection === "dashboard" ? "active" : ""}`}
          onClick={() => goToSection("dashboard")}
        >
          ▦ Dashboard
        </div>

        <div
          className={`menu ${activeSection === "applications" ? "active" : ""}`}
          onClick={() => goToSection("applications")}
        >
          ▤ Applications
        </div>

        <div
          className={`menu ${activeSection === "analytics" ? "active" : ""}`}
          onClick={() => goToSection("analytics")}
        >
          ◉ Analytics
        </div>

        <div
          className={`menu ${activeSection === "settings" ? "active" : ""}`}
          onClick={() => goToSection("settings")}
        >
          ⚙ Settings
        </div>

        <div className="sidebar-bottom">
          <h3>Apply Smart!</h3>
          <p>Track your journey towards your dream job.</p>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}

      <main className="main" id="dashboard">

        {/* TOPBAR */}

        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Track your job search journey.</p>
          </div>

          <div className="topbar-actions">
            <span className="user-name">
              {user?.name || user?.email}
            </span>

            <div className="profile">
              {(user?.name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {error && (
          <p style={{ color: "red", marginBottom: "15px" }}>
            {error}
          </p>
        )}

        {/* FOLLOW-UP REMINDERS */}

        {upcomingFollowUps.length > 0 && (
          <section
            style={{
              background: "#fff8e8",
              border: "1px solid #f2d69a",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#946200" }}>
              Follow-up Reminders ({upcomingFollowUps.length})
            </h3>

            {upcomingFollowUps.map((job) => (
              <p key={job.id} style={{ marginBottom: "8px" }}>
                <strong>{job.company}</strong> — {job.role}
                {" | "}
                Follow-up: {String(job.follow_up_date).slice(0, 10)}
                {" "}
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(job)}
                >
                  View / Edit
                </button>
              </p>
            ))}
          </section>
        )}

        {/* STATISTICS */}

        <section className="stats">
          <div className="stat-card">
            <p>Total Applications</p>
            <h2>{total}</h2>
          </div>

          <div className="stat-card">
            <p>Applied</p>
            <h2>{applied}</h2>
          </div>

          <div className="stat-card">
            <p>Assessments</p>
            <h2>{assessment}</h2>
          </div>

          <div className="stat-card">
            <p>Interviews</p>
            <h2>{interview}</h2>
          </div>

          <div className="stat-card">
            <p>Selected</p>
            <h2>{selected}</h2>
          </div>

          <div className="stat-card">
            <p>Rejected</p>
            <h2>{rejected}</h2>
          </div>
        </section>

        {/* ANALYTICS */}

        <section className="analytics" id="analytics">

          <div className="chart-card">
            <h2>Application Status Distribution</h2>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Monthly Applications</h2>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="applications"
                  fill="#7666ed"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </section>

        {/* KANBAN APPLICATION PIPELINE */}

        <section className="kanban-section">
          <div className="kanban-header">
            <div>
              <h2>Application Pipeline</h2>
              <p>Drag and drop your applications to update their status.</p>
            </div>

            <span className="kanban-total">
              {jobs.length} Applications
            </span>
          </div>

          <div className="kanban-board">
            {STATUSES.map((status) => {
              const columnJobs = jobs.filter(
                (job) => job.status === status
              );

              return (
                <div
                  className={`kanban-column ${
                    draggedOverColumn === status ? "drag-over" : ""
                  }`}
                  key={status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDraggedOverColumn(status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDraggedOverColumn("");
                    }
                  }}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="kanban-column-header">
                    <h3>{status}</h3>
                    <span>{columnJobs.length}</span>
                  </div>

                  <div className="kanban-cards">
                    {columnJobs.length > 0 ? (
                      columnJobs.map((job) => (
                        <div
                          className="kanban-card"
                          key={job.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job)}
                          onDragEnd={() => setDraggedOverColumn("")}
                        >
                          <h4>{job.company}</h4>

                          <p className="kanban-role">{job.role}</p>

                          <p className="kanban-detail">
                            📍 {job.location || "Location not added"}
                          </p>

                          {job.next_step && (
                            <p className="kanban-detail">
                              <strong>Next:</strong> {job.next_step}
                            </p>
                          )}

                          {job.follow_up_date && (
                            <p className="kanban-detail">
                              <strong>Follow-up:</strong>{" "}
                              {String(job.follow_up_date).slice(0, 10)}
                            </p>
                          )}

                          <label>Change Status</label>

                          <select
                            value={job.status}
                            onChange={(e) =>
                              handleStatusChange(job, e.target.value)
                            }
                          >
                            {STATUSES.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>

                          <button
                            className="kanban-edit-btn"
                            onClick={() => handleEdit(job)}
                          >
                            Edit Details
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="kanban-empty">
                        No applications yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI RESUME MATCHER */}

        <section className="resume-matcher">
          <div className="resume-header">
            <h2>AI Resume Matcher</h2>
            <p>
              Compare your resume with job requirements
              and discover your skill gaps.
            </p>
          </div>

          <form onSubmit={handleResumeSubmit}>
            <label>Upload Your Resume (PDF)</label>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setResumeFile(e.target.files[0] || null);
                setResumeMessage("");
                setResumeAnalysis(null);
              }}
              required
            />

            <label>Paste Job Description</label>

            <textarea
              placeholder="Paste the complete job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows="6"
              required
            />

            <button
              type="submit"
              className="add-btn"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
            </button>

            {resumeMessage && (
              <p
                style={{
                  marginTop: "12px",
                  color: resumeAnalysis ? "#15945b" : "#555",
                  fontWeight: "500",
                }}
              >
                {resumeMessage}
              </p>
            )}
          </form>

          {/* MATCHING RESULTS */}

          {resumeAnalysis && analysis && (
            <div className="matching-results">
              <h2>Resume Analysis Results</h2>

              {/* MATCH SCORE */}

              <div className="match-score-card">
                <div>
                  <p>Resume Match Score</p>
                  <h1>{analysis.score}%</h1>
                  <p>
                    {analysis.totalMatchedSkills} out of{" "}
                    {analysis.totalRequiredSkills} required skills matched
                  </p>
                </div>

                <div
                  className="score-circle"
                  style={{
                    background: `conic-gradient(#28b879 ${analysis.score * 3.6}deg, #e8e8ef 0deg)`,
                  }}
                >
                  <div className="score-inner">
                    {analysis.score}%
                  </div>
                </div>
              </div>

              {/* ATS COMPATIBILITY */}

              <div
                className="ats-section"
                style={{
                  marginTop: "24px",
                  padding: "22px",
                  background: "#ffffff",
                  border: "1px solid #e8e8ef",
                  borderRadius: "14px",
                }}
              >
                <h2 style={{ marginTop: 0 }}>
                  ATS Compatibility Check
                </h2>

                <p style={{ color: "#777", marginBottom: "20px" }}>
                  Basic resume checks for important information and sections.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "22px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "125px",
                      height: "125px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      background:
                        atsScore !== null
                          ? `conic-gradient(#7666ed ${Number(atsScore) * 3.6}deg, #e8e8ef 0deg)`
                          : "#e8e8ef",
                    }}
                  >
                    <div
                      style={{
                        width: "98px",
                        height: "98px",
                        borderRadius: "50%",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      }}
                    >
                      <strong style={{ fontSize: "25px", color: "#292344" }}>
                        {atsScore !== null ? `${atsScore}%` : "N/A"}
                      </strong>
                      <small style={{ color: "#777" }}>ATS Score</small>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <h3 style={{ margin: "0 0 8px" }}>
                      Resume Readiness
                    </h3>

                    <p style={{ color: "#666", margin: 0 }}>
                      {atsScore === null
                        ? "ATS score was not provided by the backend."
                        : Number(atsScore) >= 80
                        ? "Your resume passed most of the basic checks."
                        : Number(atsScore) >= 50
                        ? "Your resume can be improved by fixing some checks."
                        : "Your resume needs improvements in its basic sections."}
                    </p>
                  </div>
                </div>

                <h3 style={{ marginTop: "25px" }}>ATS Checks</h3>

                {atsChecks.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {atsChecks.map((check, index) => {
                      const passed = isCheckPassed(check);

                      const checkName =
                        typeof check === "string"
                          ? check
                          : check.label ||
                            check.name ||
                            check.title ||
                            check.check ||
                            `Check ${index + 1}`;

                      const checkMessage =
                        typeof check === "object"
                          ? check.message ||
                            check.description ||
                            (passed ? "Check passed" : "Needs improvement")
                          : "Needs improvement";

                      return (
                        <div
                          key={`${checkName}-${index}`}
                          style={{
                            padding: "14px",
                            borderRadius: "10px",
                            border: `1px solid ${passed ? "#b9e8d0" : "#f2caca"}`,
                            background: passed ? "#f0fbf5" : "#fff5f5",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontWeight: "600",
                              color: passed ? "#16834d" : "#c04444",
                            }}
                          >
                            <span>{passed ? "✓" : "!"}</span>
                            <span>{checkName}</span>
                          </div>

                          <p
                            style={{
                              margin: "7px 0 0",
                              color: "#666",
                              fontSize: "13px",
                            }}
                          >
                            {checkMessage}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#888" }}>
                    No ATS check details were received. Check the backend response.
                  </p>
                )}
              </div>

              {/* MATCHED AND MISSING SKILLS */}

              <div className="skills-grid">
                <div className="skill-card matched-card">
                  <h3>Matched Skills ({matchedSkills.length})</h3>

                  {matchedSkills.length > 0 ? (
                    <div className="skill-list">
                      {matchedSkills.map((skill) => (
                        <span key={skill} className="skill-tag matched">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No matching skills found.</p>
                  )}
                </div>

                <div className="skill-card missing-card">
                  <h3>Missing Skills ({missingSkills.length})</h3>

                  {missingSkills.length > 0 ? (
                    <div className="skill-list">
                      {missingSkills.map((skill) => (
                        <span key={skill} className="skill-tag missing">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No missing skills found.</p>
                  )}
                </div>
              </div>

              {/* SKILL MATCH DETAILS */}

              <div
                className="skill-card"
                style={{
                  marginTop: "20px",
                  padding: "22px",
                  background: "#fff",
                  border: "1px solid #e8e8ef",
                  borderRadius: "14px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Skill Match Details</h3>

                <p style={{ color: "#777", marginTop: "-4px" }}>
                  A skill-by-skill view of how your resume matches this job description.
                </p>

                {requiredSkills.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {requiredSkills.map((skill) => {
                      const isMatched = matchedSkills.some(
                        (item) =>
                          String(item).toLowerCase() ===
                          String(skill).toLowerCase()
                      );

                      const guidance = getSkillGuidance(skill);

                      return (
                        <div
                          key={skill}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                            padding: "12px 14px",
                            border: "1px solid #ececf2",
                            borderRadius: "10px",
                            background: isMatched ? "#f2fbf6" : "#fff8f2",
                          }}
                        >
                          <div>
                            <strong>{skill}</strong>

                            {!isMatched && (
                              <span
                                style={{
                                  marginLeft: "9px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color:
                                    guidance.priority === "High"
                                      ? "#b45309"
                                      : "#64748b",
                                }}
                              >
                                {guidance.priority} Priority
                              </span>
                            )}
                          </div>

                          <span
                            style={{
                              color: isMatched ? "#16834d" : "#c05a22",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {isMatched ? "✓ Matched" : "+ Missing"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>No required skills were received from the backend.</p>
                )}
              </div>

              {/* SMART IMPROVEMENT PLAN */}

              <div
                className="suggestion-card"
                style={{
                  marginTop: "20px",
                  padding: "22px",
                  background: "#fff",
                  border: "1px solid #e8e8ef",
                  borderRadius: "14px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Smart Improvement Plan</h3>

                <p style={{ color: "#777" }}>
                  Practical next steps based on the skills missing from this job description.
                </p>

                {missingSkills.length > 0 ? (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {missingSkills.map((skill) => {
                      const guidance = getSkillGuidance(skill);

                      return (
                        <div
                          key={skill}
                          style={{
                            padding: "15px",
                            borderRadius: "10px",
                            background: "#f8f8fc",
                            border: "1px solid #ececf2",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong>{skill}</strong>

                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color:
                                  guidance.priority === "High"
                                    ? "#b45309"
                                    : "#64748b",
                              }}
                            >
                              {guidance.priority} Priority
                            </span>
                          </div>

                          <p style={{ margin: "9px 0 5px", color: "#555" }}>
                            <strong>What to learn:</strong> {guidance.reason}
                          </p>

                          <p style={{ margin: 0, color: "#555" }}>
                            <strong>Practice idea:</strong> {guidance.project}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Great! All required skills were matched in your resume.</p>
                )}
              </div>

              {/* ALL RESUME SKILLS */}

              <div className="skill-card">
                <h3>Skills Found in Your Resume</h3>

                <div className="skill-list">
                  {resumeSkills.length > 0 ? (
                    resumeSkills.map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p>No recognized skills found in resume.</p>
                  )}
                </div>
              </div>

              {/* SUGGESTIONS */}

              <div className="suggestion-card">
                <h3>Improvement Suggestions</h3>

                {suggestions.length > 0 ? (
                  <ul>
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Great! All listed job skills were found in your resume.
                  </p>
                )}
              </div>

              {/* EXTRACTED TEXT */}

              <details className="extracted-text">
                <summary>View Extracted Resume Text</summary>
                <pre>{resumeAnalysis.resumeText}</pre>
              </details>

              <p className="matcher-note">
                Note: Resume Match Score is based on keyword matching.
                ATS Score is based on basic resume checks. Neither score
                guarantees selection or represents a certified ATS evaluation.
              </p>
            </div>
          )}
        </section>

        {/* APPLICATION FORM AND TABLE */}

        <section className="content" id="applications">

          <div className="form-section">
            <h2>
              {editingId ? "Edit Application" : "Add New Application"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                name="company"
                placeholder="Company Name"
                value={form.company}
                onChange={handleChange}
                required
              />

              <input
                name="role"
                placeholder="Job Role"
                value={form.role}
                onChange={handleChange}
                required
              />

              <input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
              />

              <label>Application Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label>Application Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <label>Next Step</label>

              <input
                name="next_step"
                placeholder="Example: Prepare for technical interview"
                value={form.next_step}
                onChange={handleChange}
              />

              <label>Follow-up Date</label>

              <input
                type="date"
                name="follow_up_date"
                value={form.follow_up_date}
                onChange={handleChange}
              />

              <label>Notes</label>

              <textarea
                name="notes"
                placeholder="Add interview details, recruiter contact or other notes..."
                value={form.notes}
                onChange={handleChange}
                rows="3"
              />

              <button type="submit" className="add-btn">
                {editingId ? "Update Application" : "+ Add Application"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* JOB APPLICATION TABLE */}

          <div className="table-section">
            <h2>Job Applications</h2>

            <div className="filters">
              <input
                placeholder="Search company or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Next Step</th>
                    <th>Follow-up</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9">Loading applications...</td>
                    </tr>
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.company}</td>
                        <td>{job.role}</td>
                        <td>{job.location || "-"}</td>
                        <td>{job.date || "-"}</td>

                        <td>
                          <span
                            className={`status ${(job.status || "applied").toLowerCase()}`}
                          >
                            {job.status}
                          </span>
                        </td>

                        <td>{job.next_step || "-"}</td>

                        <td>
                          {job.follow_up_date
                            ? String(job.follow_up_date).slice(0, 10)
                            : "-"}
                        </td>

                        <td>
                          <span title={job.notes || ""}>
                            {job.notes
                              ? job.notes.length > 35
                                ? `${job.notes.slice(0, 35)}...`
                                : job.notes
                              : "-"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(job)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(job.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No applications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SETTINGS SECTION */}

        <section
          id="settings"
          className="settings-section"
          style={{
            padding: "25px",
            marginTop: "25px",
            background: "#fff",
            borderRadius: "15px",
            scrollMarginTop: "25px",
          }}
        >
          <h2>Settings</h2>
          <p>Manage your ApplyTrack account and preferences.</p>

          {/* PROFILE INFORMATION */}

          <div className="settings-card">
            <h3>Profile Information</h3>

            {!isEditingProfile ? (
              <>
                <p>
                  <strong>Name:</strong> {user?.name || "User"}
                </p>

                <p>
                  <strong>Email:</strong> {user?.email || "Not available"}
                </p>

                <button
                  className="edit-btn"
                  onClick={() => {
                    setProfileMessage("");
                    setIsEditingProfile(true);
                  }}
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleProfileSave}>
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  maxLength={100}
                  required
                />

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  maxLength={255}
                  required
                />

                <button
                  type="submit"
                  className="add-btn"
                  disabled={profileLoading}
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleProfileCancel}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </form>
            )}

            {profileMessage && (
              <p
                style={{
                  marginTop: "12px",
                  color:
                    profileMessageType === "success"
                      ? "#15945b"
                      : "#dc2626",
                  fontWeight: "500",
                }}
              >
                {profileMessage}
              </p>
            )}
          </div>

          {/* CHANGE PASSWORD */}

          <div className="settings-card">
            <h3>Change Password</h3>

            <p>
              Update your account password using your current password.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <label>Current Password</label>

              <input
                type="password"
                name="currentPassword"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />

              <label>New Password</label>

              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password (minimum 8 characters)"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                required
              />

              <label>Confirm New Password</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="submit"
                className="add-btn"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>

            {passwordMessage && (
              <p
                style={{
                  marginTop: "12px",
                  color:
                    passwordMessageType === "success"
                      ? "#15945b"
                      : "#dc2626",
                  fontWeight: "500",
                }}
              >
                {passwordMessage}
              </p>
            )}
          </div>

          {/* ACCOUNT */}

          <div className="settings-card">
            <h3>Account</h3>
            <p>Your ApplyTrack account is currently active.</p>

            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>

          {/* ABOUT */}

          <div className="settings-card">
            <h3>About ApplyTrack</h3>
            <p>
              Track applications, monitor progress and improve your resume.
            </p>
            <p>Version 1.0</p>
          </div>
        </section>

      </main>
    </div>
  );
}

// =====================================
// MAIN APP - AUTHENTICATION WRAPPER
// =====================================

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("applytrack_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("applytrack_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem("applytrack_token", newToken);
    localStorage.setItem("applytrack_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);

    localStorage.setItem(
      "applytrack_user",
      JSON.stringify(updatedUser)
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("applytrack_token");
    localStorage.removeItem("applytrack_user");

    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Dashboard
      token={token}
      user={user}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  );
}

export default App;