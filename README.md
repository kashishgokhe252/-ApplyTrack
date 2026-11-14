\# ApplyTrack – Smart Job Application Tracker



ApplyTrack is a full-stack web application designed to help students and job seekers manage their job applications, monitor application progress, and improve their resumes through intelligent skill matching.



\## 🚀 Features



\- \*\*User Authentication:\*\* Secure signup and login using JWT and bcrypt password hashing.

\- \*\*Dashboard:\*\* View application statistics and track job application progress.

\- \*\*Application Management:\*\* Add, edit, delete, search, and filter job applications.

\- \*\*Kanban Board:\*\* Organize applications according to their current status.

\- \*\*Analytics Dashboard:\*\* Visualize application statistics and monthly trends.

\- \*\*AI Resume Matcher:\*\* Upload a PDF resume and compare its skills with a job description.

\- \*\*ATS Resume Analysis:\*\* Get an ATS-style score, matched skills, missing skills, and improvement suggestions.

\- \*\*Profile Management:\*\* Update profile information and change account password.

\- \*\*Data Isolation:\*\* Each user can access only their own application records.



\## 🛠️ Tech Stack



\### Frontend

\- React.js

\- Vite

\- CSS

\- Recharts



\### Backend

\- Node.js

\- Express.js

\- MySQL

\- JWT Authentication

\- bcryptjs

\- Multer

\- pdf-parse



\## 📁 Project Structure



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



\## ⚙️ Installation \& Setup



\### 1. Clone the Repository



```bash

git clone https://github.com/kashishgokhe252/-ApplyTrack.git

cd -ApplyTrack

```



\### 2. Backend Setup



```bash

cd backend

npm install

```



Create a `.env` file inside the backend folder using `.env.example` as a reference.



Configure your local MySQL credentials and a strong JWT secret.



Start the backend:



```bash

npm start

```



\### 3. Frontend Setup



Open another terminal:



```bash

cd frontend

npm install

npm run dev

```



Open the local URL displayed by Vite in your browser.



\## 🗄️ Database Setup



1\. Install and start MySQL.

2\. Create a database named `applytrack\_db`.

3\. Configure your database credentials in `backend/.env`.

4\. Create the required tables according to the SQL queries used by the backend.



\## 🔐 Security



\- Passwords are hashed using bcryptjs.

\- JWT is used for authentication.

\- Protected API routes verify user identity.

\- User-specific application data is isolated.

\- Environment variables are excluded from version control.



\## 🔮 Future Improvements



\- Cloud deployment

\- Email notifications for application follow-ups

\- Advanced resume analysis

\- More job-market insights



\## 👩‍💻 Author



\*\*Kashish Gokhe\*\*



B.Tech Computer Science Engineering Student



GitHub: \[kashishgokhe252](https://github.com/kashishgokhe252)



\---



\*ApplyTrack – Organize your applications. Track your progress. Move closer to your career goals.\*

