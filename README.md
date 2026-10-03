# Thryve — AI Collaborative Learning Intelligence Full-Stack Platform

A full-stack, neo-brutalist web application designed for student engineering teams to make collaborative thinking, discussions, documents, task contributions, and AI-driven insights visible and actionable.

---

## ⚡ Tech Stack & Architecture

- **Front-end**: Pure Neo-Brutalist HTML5 / CSS3 / JavaScript (vanilla) with responsive grid layouts, stickers, badges, and modals matching the design specification.
- **Back-end Server**: Modular Node.js / Express REST API with MVC layered architecture.
  - **Controllers**: Isolated route logic for Auth, Projects, Sprints, Approvals, Documents, Requests, Chat, AI, and Reports.
  - **Services**: AI contextual heuristics, sprint optimization, and metrics computation.
  - **Middleware**: JWT authentication, Multer file upload handling, and centralized error handling.
  - **Security**: Password hashing with `bcryptjs`, JWT token signing with `jsonwebtoken`, and `.env` configuration with `dotenv`.
- **Database**: Node.js built-in `node:sqlite` (`DatabaseSync`) — zero external native build dependencies, instant boot, and persistent storage in `thryve.db`.
- **File Uploads**: `multer` handling real multi-file and folder uploads into the `uploads/` directory with file-download serving.
- **Intelligence Engine**: Real-time contextual AI analysis generating role assignments, code scaffolds, peer-learning interventions, and deadline risk detection.

---

## 📂 Project Structure

```
thryve/
├── public/
│   └── index.html               # Complete Neo-Brutalist frontend UI & client logic
├── src/
│   ├── app.js                   # Express application setup, middleware, static files
│   ├── config/
│   │   ├── index.js             # Environment variables & runtime constants
│   │   ├── db.js                # SQLite connection & schema initialization
│   │   └── seed.js              # Idempotent demo database seeder
│   ├── controllers/
│   │   ├── authController.js    # Team/Member signup, login, profile, password
│   │   ├── projectController.js # Projects & team member assignments
│   │   ├── sprintController.js  # Sprints, task toggling, deadline calculations
│   │   ├── approvalController.js# Approval queue processing & decisions
│   │   ├── documentController.js# File/folder upload, sharing, downloads
│   │   ├── requestController.js # Collaboration work & resource requests
│   │   ├── chatController.js    # Real-time discussion & AI responses
│   │   ├── aiController.js      # Role suggestions, scaffolds, sprint proposals
│   │   └── reportController.js  # Team & individual execution metrics
│   ├── middleware/
│   │   ├── auth.js              # JWT generation, token verification, bcrypt hashing
│   │   ├── upload.js            # Multer disk storage and limits
│   │   └── errorHandler.js      # Centralized 404 & exception handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── approvalRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── reportRoutes.js
│   │   └── index.js             # Main router aggregator mounted at /api
│   └── services/
│       ├── aiIntelligenceService.js # Contextual heuristics & AI recommendations
│       └── metricsService.js        # Sprint metrics & progress calculations
├── uploads/                     # Storage folder for uploaded project files
├── server.js                    # Server entry point
├── .env.example                 # Environment configuration template
├── package.json
└── README.md
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Server
```bash
npm start
```
Or for auto-reloading development mode:
```bash
npm run dev
```

The application will launch on:
```
http://localhost:3000
```

---

## 🔑 Available Default Credentials

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

## 📡 REST API Endpoints

### Health & Auth
- `GET /api/health`: Service health check.
- `POST /api/auth/team-login`: Authenticate team and return active projects.
- `POST /api/auth/team-signup`: Create new team, team lead, and workspace.
- `POST /api/auth/member-login`: Authenticate individual team members.
- `POST /api/auth/user-signup`: Request member account creation (queued for approval).
- `POST /api/auth/profile`: Update user profile details.
- `POST /api/auth/change-password`: Update member password.

### Projects & Team Setup
- `GET /api/projects`: List all projects.
- `POST /api/projects`: Create project with member setups & trigger AI role suggestions.
- `GET /api/projects/:id/members`: List active team members.
- `POST /api/projects/:id/members/roles`: Update member role or assign custom work.

### Sprint & Task Tracking
- `GET /api/projects/:id/sprint`: Get live tasks, completion counts, and on-time/late calculations.
- `POST /api/projects/:id/sprint/toggle-task`: Toggle task completion state and compute on-time/late status.
- `POST /api/projects/:id/sprint/approve`: Team lead publishing gate.
- `POST /api/projects/:id/sprint/replan`: AI regenerates sprint with peer sessions based on leader feedback.

### Approvals Queue
- `GET /api/approvals`: Retrieve pending requests (signups, deletions, document shares).
- `POST /api/approvals/:id/decide`: Approve or reject requests with automatic state side effects.

### Documents & File Uploads
- `GET /api/projects/:id/documents`: List project files and folders.
- `POST /api/projects/:id/documents/upload`: Multi-file and folder upload.
- `POST /api/projects/:id/documents/share`: Share document with project.
- `GET /api/documents/download/:id`: Download or preview uploaded assets.

### Collaboration Requests & Inbox
- `GET /api/projects/:id/requests`: List team collaboration requests.
- `POST /api/projects/:id/requests`: Send request for code or documents.
- `POST /api/projects/:id/requests/:id/approve`: Approve request and auto-share asset.

### AI Discussions & Intelligence
- `GET /api/projects/:id/chat`: Retrieve messages filtered by mode (`all`, `team`, `ai`).
- `POST /api/projects/:id/chat`: Send message; triggers contextual AI interventions.
- `POST /api/ai/suggest-roles`: AI skillset-to-role matching.
- `POST /api/ai/placeholder-scaffold`: Generate grounded FastAPI / API code scaffolds.
- `POST /api/ai/sprint-suggestion`: Recommend sprint adjustments to resolve blockers.

### Dynamic Reports
- `GET /api/reports`: Real-time report computation comparing estimated vs. actual hours, efficiency percentage, and risk items for team or individual members.
