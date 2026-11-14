# ApplyTrack – Smart Job Application Tracker

A full-stack web application that helps students and job seekers organize job applications, track their progress, and improve their resumes through skill matching and ATS-style analysis.

## Overview

ApplyTrack provides a centralized dashboard to manage job applications and monitor the recruitment journey. Users can securely create accounts, manage applications, visualize progress, and compare their resumes against job descriptions.

## Features

- **User Authentication:** Secure signup and login using JWT and bcrypt password hashing.
- **Dashboard:** View application statistics and track application progress.
- **Application Management:** Add, edit, delete, search, and filter job applications.
- **Kanban Board:** Organize applications based on their current status.
- **Analytics Dashboard:** Visualize application statistics and monthly trends.
- **Resume Matcher:** Upload a PDF resume and compare its skills with a job description.
- **ATS Resume Analysis:** Get an ATS-style score, matched skills, missing skills, and improvement suggestions.
- **Profile Management:** Update profile information and change account password.
- **Data Isolation:** Each user can access only their own application records.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT, bcryptjs |
| Data Visualization | Recharts |
| Resume Processing | Multer, pdf-parse |
| Version Control | Git, GitHub |

## Project Structure

```text
ApplyTrack/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Auth.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kashishgokhe252/-ApplyTrack.git
cd -ApplyTrack
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder using `.env.example` as a reference.

Configure the following environment variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=applytrack_db
DB_PORT=3306
JWT_SECRET=your_strong_secret_key
```

Start the backend:

```bash
npm start
```

The backend runs on `http://localhost:5000`.

### 3. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE applytrack_db;
```

Create the required `users` and `
