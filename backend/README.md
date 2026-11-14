# ApplyTrack – Smart Job Application Tracker

ApplyTrack is a full-stack web application designed to help students and job seekers manage their job applications, track application progress, and analyze resumes using AI-inspired skill matching.

## Features

- **User Authentication:** Secure signup and login using JWT and bcrypt password hashing.
- **Dashboard:** View application statistics and track job application progress.
- **Application Management:** Add, edit, delete, search, and filter job applications.
- **Kanban Board:** Organize applications according to their current status.
- **Analytics:** Visualize application statistics and monthly trends.
- **AI Resume Matcher:** Upload a PDF resume and compare its skills with a job description.
- **ATS Analysis:** Get an ATS-style score, matched skills, missing skills, and improvement suggestions.
- **Profile Management:** Update profile information and change account password.
- **Data Isolation:** Each user can access only their own application records.

## Tech Stack

### Frontend
- React.js
- Vite
- CSS
- Recharts

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs
- Multer
- pdf-parse

## Project Structure

```text
ApplyTrack/
├── Backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ApplyTrack
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside the Backend folder using `.env.example` as a reference.

Configure your local MySQL database credentials and a strong JWT secret.

Start the backend:

```bash
npm start
```

### 3. Frontend Setup

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Database

Create a MySQL database named `applytrack_db`.

The required tables must be created according to the database queries used by the backend.

## Security

- Passwords are hashed using bcryptjs.
- JWT is used for authentication.
- Protected API routes verify user identity.
- User-specific application data is isolated.
- Environment variables are excluded from version control.

## Future Improvements

- Cloud deployment
- Email notifications for follow-ups
- Advanced resume analysis
- More job-market insights

## Author

**Kashish Gokhe**

B.Tech Computer Science Engineering Student

---

*ApplyTrack – Organize your applications. Track your progress. Move closer to your career goals.*