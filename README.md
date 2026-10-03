# Thryve — AI Collaborative Learning Intelligence Full-Stack Platform

A full-stack, neo-brutalist web application designed for student engineering teams to make collaborative thinking, discussions, documents, task contributions, and AI-driven insights visible and actionable.

---

## ⚡ Tech Stack & Architecture

- **Front-end**: Pure Neo-Brutalist HTML5 / CSS3 / JavaScript (vanilla) with responsive grid layouts, stickers, badges, and modals matching the exact design specification.
- **Back-end Server**: Node.js v26 + Express REST API.
- **Database**: Node.js built-in `node:sqlite` (SQLite synchronous database) — zero external native build dependencies, instant boot, and persistent storage in `thryve.db`.
- **File Uploads**: `multer` handling real multi-file and folder uploads into the `uploads/` directory with file-download serving.
- **Intelligence Engine**: Real-time contextual AI analysis generating role assignments, code scaffolds, peer-learning interventions, and deadline risk detection.

---

## 🚀 Running the Application

### 1. Start Server
From the project directory:
```bash
node server.js
```
The application will launch on:
```
http://localhost:3000
```

### 2. Available Default Credentials
- **Team Login**:
  - Team Email: `studysync@team.demo`
  - Team ID: `STUDY-01`
  - Password: `demo1234`
- **Member Login**:
  - Priya (Team Lead): `lead@team.demo` / `demo1234`
  - Arun (Frontend): `arun@team.demo` / `demo1234`
  - Meena (Data/Analytics): `meena@team.demo` / `demo1234`
  - Vishal (QA/DevOps): `vishal@team.demo` / `demo1234`

---

## 📂 Key Features & API Endpoints

### 1. Team & Project Management
- `POST /api/auth/team-login`: Authenticates team and returns active projects.
- `POST /api/auth/team-signup`: Creates a new team, team lead, and workspace.
- `POST /api/projects`: Creates a project with team member specifications and triggers AI role analysis.

### 2. Approval Queue & User Lifecycle
- `GET /api/approvals`: Retrieves pending requests for new users, user deletions, and document shares.
- `POST /api/approvals/:id/decide`: Approves or denies requests with automatic side effects (e.g. activating a new user or auto-sharing requested files).

### 3. Sprint & Deadline Tracking
- `GET /api/projects/:id/sprint`: Provides live tasks, completion counts, and on-time/late calculations.
- `POST /api/projects/:id/sprint/toggle-task`: Toggles task state and computes whether the task was finished **BEFORE DEADLINE** or **LATE**.
- `POST /api/projects/:id/sprint/approve`: Team lead publishing gate.
- `POST /api/projects/:id/sprint/replan`: AI regenerates the sprint with peer-learning sessions based on leader feedback.

### 4. Real File & Folder Uploads
- `POST /api/projects/:id/documents/upload`: Uploads individual files or an entire folder hierarchy. Uploads start as private and can be shared with the project.
- `GET /api/documents/download/:id`: Downloads or previews uploaded project assets.

### 5. Collaboration Requests & Inbox
- `POST /api/projects/:id/requests`: Targeted requests between teammates for finished code modules or documents.
- `POST /api/projects/:id/requests/:id/approve`: Grants instant access to requested materials.

### 6. Interactive AI Collaboration Chat
- `POST /api/projects/:id/chat`: Context-aware chat assistant that monitors discussion topics, identifies knowledge gaps (e.g. API contracts), and suggests peer teaching.

### 7. Dynamic Reports & PDF Print
- `GET /api/reports`: Real-time report computation comparing estimated hours against actual hours, work completed, efficiency percentage, and risk items.
- Built-in `@media print` stylesheet for clean PDF export.
