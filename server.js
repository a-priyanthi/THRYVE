const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'thryve.db');
const db = new DatabaseSync(dbPath);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      lead_name TEXT NOT NULL,
      user_count INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT,
      title TEXT,
      bio TEXT,
      skills TEXT,
      learning_style TEXT,
      status TEXT DEFAULT 'active',
      is_lead INTEGER DEFAULT 0,
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      member_count INTEGER DEFAULT 4,
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sprint_num INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      member_name TEXT NOT NULL,
      member_role TEXT,
      start_time TEXT,
      deadline_time TEXT,
      completed_at TEXT,
      status TEXT DEFAULT 'pending',
      is_before_deadline INTEGER DEFAULT 0,
      est_hours REAL DEFAULT 1.5,
      act_hours REAL DEFAULT 1.5,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT,
      original_name TEXT,
      filesize TEXT,
      is_folder INTEGER DEFAULT 0,
      is_shared INTEGER DEFAULT 0,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      from_name TEXT NOT NULL,
      to_name TEXT NOT NULL,
      item TEXT NOT NULL,
      reason TEXT,
      type TEXT DEFAULT 'work',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sender_name TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      message TEXT NOT NULL,
      mode TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sprint_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sprint_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replan_reason TEXT
    );
  `);

  // Check if seed data exists
  const teamCheck = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  if (teamCheck.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding initial Thryve database...');

  // 1. Team
  const insertTeam = db.prepare(`
    INSERT INTO teams (name, email, password, lead_name, user_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTeam.run('StudySync', 'studysync@team.demo', 'demo1234', 'Priya', 4);

  // 2. Users
  const insertUser = db.prepare(`
    INSERT INTO users (team_id, name, email, password, role, title, bio, skills, learning_style, status, is_lead, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(1, 'Priya', 'lead@team.demo', 'demo1234', 'AI / Backend Lead', 'TEAM LEAD', 'Backend builder who enjoys AI workflows and leading student projects.', 'Python, AI, Backend, Leadership', 'Hands-on / examples', 'active', 1, 84);
  insertUser.run(1, 'Arun', 'arun@team.demo', 'demo1234', 'Frontend / UX', 'FRONTEND', 'Likes UI and building clean web interfaces; comfortable explaining frontend concepts.', 'Frontend, React, UI, JavaScript', 'Visual', 'active', 0, 68);
  insertUser.run(1, 'Meena', 'meena@team.demo', 'demo1234', 'Data / Analytics', 'DATA + ANALYTICS', 'Enjoys data and wants to learn how APIs connect to analytics dashboards.', 'Database, SQL, Analytics, Python', 'Hands-on / examples', 'active', 0, 55);
  insertUser.run(1, 'Vishal', 'vishal@team.demo', 'demo1234', 'QA / DevOps', 'QA / DEVOPS', 'Likes testing, deployment and writing clear technical documentation.', 'Testing, DevOps, Documentation, Git', 'Independent', 'active', 0, 91);
  insertUser.run(1, 'Kavya', 'kavya@team.demo', 'tempPass123', 'Data / AI', 'MEMBER', 'Interested in Python, machine learning and data analysis. Comfortable with SQL.', 'Python, ML, SQL, Data Analysis', 'Hands-on / examples', 'pending_approval', 0, 0);

  // 3. Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (team_id, name, description, member_count, progress)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertProject.run(1, 'StudySync', 'An AI platform that analyzes authorized team discussions, documents and task contributions to identify knowledge exchange patterns, summarize collective insights and recommend meaningful collaboration activities.', 4, 72);
  insertProject.run(1, 'CampusCart', 'Student marketplace with smart matching.', 3, 41);

  // 4. Tasks (Sprint 01 - 12 Tasks)
  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, sprint_num, title, member_name, member_role, start_time, deadline_time, completed_at, status, is_before_deadline, est_hours, act_hours, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Priya tasks
  insertTask.run(1, 1, 'Build authentication API', 'Priya', 'Backend + AI', '09:00', '11:00', '10:42', 'done', 1, 2.0, 1.7, 'Completed on time');
  insertTask.run(1, 1, 'Connect discussion analyzer', 'Priya', 'Backend + AI', '11:15', '13:00', '12:48', 'done', 1, 2.0, 1.5, 'Completed on time');
  insertTask.run(1, 1, 'Publish insight endpoint', 'Priya', 'Backend + AI', '14:00', '15:30', '15:10', 'done', 1, 1.5, 1.2, 'Completed on time');

  // Arun tasks
  insertTask.run(1, 1, 'Build project dashboard', 'Arun', 'Frontend', '09:30', '11:30', '11:12', 'done', 1, 2.0, 1.7, 'Completed on time');
  insertTask.run(1, 1, 'Connect chat interface', 'Arun', 'Frontend', '11:45', '13:00', '12:54', 'done', 1, 1.5, 1.4, 'Completed on time');
  insertTask.run(1, 1, 'Finish API integration', 'Arun', 'Frontend', '14:00', '16:00', null, 'pending', 0, 0.5, 1.3, 'Awaiting API module');

  // Meena tasks
  insertTask.run(1, 1, 'Create contribution model', 'Meena', 'Data + Analytics', '09:00', '11:30', '11:05', 'done', 1, 1.5, 1.3, 'Completed on time');
  insertTask.run(1, 1, 'Build knowledge-exchange metrics', 'Meena', 'Data + Analytics', '12:00', '15:00', null, 'pending', 0, 2.0, 2.0, 'API clarification needed');
  insertTask.run(1, 1, 'Connect analytics to dashboard', 'Meena', 'Data + Analytics', '15:00', '16:00', null, 'pending', 0, 1.0, 1.9, 'Depends on API module - AT RISK');

  // Vishal tasks
  insertTask.run(1, 1, 'Prepare test checklist', 'Vishal', 'QA + DevOps', '09:00', '11:00', '10:35', 'done', 1, 1.0, 0.6, 'Completed on time');
  insertTask.run(1, 1, 'Run integration tests', 'Vishal', 'QA + DevOps', '13:00', '16:00', '16:24', 'late', 0, 2.0, 2.4, 'Completed late');
  insertTask.run(1, 1, 'Deployment verification', 'Vishal', 'QA + DevOps', '16:00', '17:00', null, 'pending', 0, 1.0, 1.0, 'Waiting for final integration');

  // 5. Documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (project_id, user_name, filename, filepath, original_name, filesize, is_folder, is_shared)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDoc.run(1, 'Priya', 'API_Spec_v2.pdf', null, 'API_Spec_v2.pdf', '2.1 MB', 0, 1);
  insertDoc.run(1, 'Arun', 'frontend-build/', null, 'frontend-build/', '18 files', 1, 1);
  insertDoc.run(1, 'Priya', 'analyzer.py', null, 'analyzer.py', '14.2 KB', 0, 0);

  // 6. Requests
  const insertReq = db.prepare(`
    INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertReq.run(1, 'Priya', 'Arun', 'frontend-build / API integration code', 'I need the completed API integration module to connect it with the analytics dashboard.', 'work', 'pending');
  insertReq.run(1, 'Meena', 'Priya', 'API_Spec_v2.pdf', 'Need API specs to finish knowledge metrics.', 'share', 'pending');
  insertReq.run(1, 'Vishal', 'Team', 'Testing checklist', 'Testing checklist is completed and ready for the integration team.', 'work', 'approved');
  insertReq.run(1, 'Kavya', 'Lead', 'Kavya Raman (kavya@team.demo)', 'New user signup approval', 'user_add', 'pending');
  insertReq.run(1, 'Team', 'Lead', 'Vishal (vishal@team.demo)', 'User deletion request confirmation', 'user_delete', 'pending');

  // 7. Chats
  const insertChat = db.prepare(`
    INSERT INTO chats (project_id, sender_name, sender_type, message, mode)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertChat.run(1, 'Thryve', 'ai', '✦ Thryve: I noticed Meena and Arun are discussing the same API topic. I can suggest a peer-learning activity.', 'all');
  insertChat.run(1, 'Arun', 'team', 'I can explain the frontend → API contract.', 'all');
  insertChat.run(1, 'Priya', 'me', 'Yes, schedule 15 minutes before the next sprint.', 'all');

  // 8. Sprint Meta
  const insertMeta = db.prepare(`
    INSERT INTO sprint_meta (project_id, sprint_num, status)
    VALUES (?, ?, ?)
  `);
  insertMeta.run(1, 1, 'published');

  console.log('Seeding complete.');
}

initDatabase();

// Helper to recalculate project progress
function updateProjectProgress(projectId) {
  const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId);
  if (!tasks.length) return 0;
  const completed = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
  const pct = Math.round((completed / tasks.length) * 100);
  db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(pct, projectId);
  return pct;
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// --- Authentication & Team Management ---

// 1. Team Login
app.post('/api/auth/team-login', (req, res) => {
  const { email, password, teamId } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE email = ?').get(email);
  if (!team || team.password !== password) {
    return res.status(401).json({ error: 'Invalid team email or password.' });
  }
  const projects = db.prepare('SELECT * FROM projects WHERE team_id = ?').all(team.id);
  const users = db.prepare('SELECT id, name, email, role, title, status FROM users WHERE team_id = ?').all(team.id);
  res.json({
    success: true,
    team: { id: team.id, name: team.name, email: team.email, lead_name: team.lead_name },
    projects,
    users
  });
});

// 2. Team Signup
app.post('/api/auth/team-signup', (req, res) => {
  const { name, email, password, leadName, userCount } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM teams WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Team email already registered.' });
    }
    const result = db.prepare(`
      INSERT INTO teams (name, email, password, lead_name, user_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(name || 'New Team', email, password || 'demo1234', leadName || 'Lead', parseInt(userCount) || 4);

    const teamId = Number(result.lastInsertRowid);

    // Create lead user
    db.prepare(`
      INSERT INTO users (team_id, name, email, password, role, title, bio, skills, is_lead, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(teamId, leadName || 'Lead', email, password || 'demo1234', 'Lead', 'TEAM LEAD', 'Team creator and project lead', 'Leadership', 1, 'active');

    // Create initial project
    const projResult = db.prepare(`
      INSERT INTO projects (team_id, name, description, member_count, progress)
      VALUES (?, ?, ?, ?, ?)
    `).run(teamId, (name || 'New') + ' Workspace', 'Collaborative project workspace', parseInt(userCount) || 4, 0);

    res.json({
      success: true,
      teamId,
      projectId: Number(projResult.lastInsertRowid),
      message: 'Team successfully created.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Member Login
app.post('/api/auth/member-login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid member email or password.' });
  }
  if (user.status === 'pending_approval') {
    return res.status(403).json({ error: 'Your account is currently waiting for Team Lead approval.' });
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      bio: user.bio,
      skills: user.skills,
      is_lead: Boolean(user.is_lead),
      progress: user.progress
    }
  });
});

// 4. User Signup (Invite / Registration to approval queue)
app.post('/api/auth/user-signup', (req, res) => {
  const { email, name, description, skills, learningStyle } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User email already exists.' });
    }
    const tempPassword = 'thryve' + Math.floor(1000 + Math.random() * 9000);
    const result = db.prepare(`
      INSERT INTO users (team_id, name, email, password, role, title, bio, skills, learning_style, status, is_lead, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, name || 'New Member', email, tempPassword, 'Pending Role', 'MEMBER', description || '', skills || '', learningStyle || 'Hands-on', 'pending_approval', 0, 0);

    // Add to requests queue
    db.prepare(`
      INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, name, 'Lead', `${name} (${email})`, description || 'New user signup request', 'user_add', 'pending');

    res.json({
      success: true,
      message: 'Invitation sent. Temporary password generated and team lead notified.',
      tempPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. User Delete Request
app.post('/api/auth/delete-user-request', (req, res) => {
  const { name, email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found with this email.' });
  }
  // Queue deletion request
  db.prepare(`
    INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(1, name, 'Lead', `${name} (${email})`, 'Double-confirmed member deletion request', 'user_delete', 'pending');

  res.json({
    success: true,
    message: 'Deletion request sent to Team Lead for approval.'
  });
});

// 6. Update Profile
app.post('/api/auth/profile', (req, res) => {
  const { email, name, bio, skills } = req.body;
  try {
    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), skills = COALESCE(?, skills)
      WHERE email = ?
    `).run(name, bio, skills, email);
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Change Password
app.post('/api/auth/change-password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.password !== currentPassword) {
    return res.status(401).json({ error: 'Current password does not match.' });
  }
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(newPassword, email);
  res.json({ success: true, message: 'Password changed successfully.' });
});

// --- Approvals & Lead Inbox ---

// 8. Get Approvals
app.get('/api/approvals', (req, res) => {
  const projectId = req.query.projectId || 1;
  const items = db.prepare(`
    SELECT * FROM requests 
    WHERE project_id = ? AND status = 'pending' AND (type IN ('user_add', 'user_delete', 'share') OR to_name = 'Lead')
    ORDER BY id DESC
  `).all(projectId);
  res.json(items);
});

// 9. Process Approval Decision
app.post('/api/approvals/:id/decide', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(newStatus, id);

  // Side-effects on approve
  if (action === 'approve') {
    if (request.type === 'user_add') {
      // Extract email from item if format is "Name (email)"
      const match = request.item.match(/\(([^)]+)\)/);
      const email = match ? match[1] : request.from_name;
      db.prepare("UPDATE users SET status = 'active' WHERE email = ?").run(email);
    } else if (request.type === 'user_delete') {
      const match = request.item.match(/\(([^)]+)\)/);
      const email = match ? match[1] : null;
      if (email) {
        db.prepare('DELETE FROM users WHERE email = ?').run(email);
      }
    } else if (request.type === 'share') {
      // Auto share document
      db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(request.item);
    }
  }

  res.json({ success: true, status: newStatus, message: `Request ${action}d.` });
});

// --- Projects & Team Setup ---

// 10. List Projects
app.get('/api/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  res.json(projects);
});

// 11. Create Project with Member Setup & Trigger AI Roles
app.post('/api/projects', (req, res) => {
  const { name, description, memberCount, members } = req.body;
  try {
    const projResult = db.prepare(`
      INSERT INTO projects (team_id, name, description, member_count, progress)
      VALUES (?, ?, ?, ?, 0)
    `).run(1, name || 'New Project', description || '', parseInt(memberCount) || 4);
    const projectId = Number(projResult.lastInsertRowid);

    // Save or update members
    if (Array.isArray(members)) {
      members.forEach((m, idx) => {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(m.email);
        if (!existing) {
          db.prepare(`
            INSERT INTO users (team_id, name, email, password, role, title, bio, skills, is_lead)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(1, m.name, m.email, 'demo1234', 'Member', idx === 0 ? 'TEAM LEAD' : 'MEMBER', m.description || '', m.skills || '', idx === 0 ? 1 : 0);
        }
      });
    }

    // AI generated initial Sprint 01
    const defaultRoles = [
      { name: members?.[0]?.name || 'Priya', role: 'AI / Backend Lead', why: 'Python + AI + leadership profile.' },
      { name: members?.[1]?.name || 'Arun', role: 'Frontend / UX', why: 'React + UI skills and frontend focus.' },
      { name: members?.[2]?.name || 'Meena', role: 'Data / Analytics', why: 'SQL + analytics and learning goals.' },
      { name: members?.[3]?.name || 'Vishal', role: 'QA / DevOps', why: 'Testing, Git and documentation background.' }
    ];

    res.json({
      success: true,
      projectId,
      roles: defaultRoles,
      message: 'Project created and AI initial roles generated.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Get Project Members
app.get('/api/projects/:id/members', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, title, bio, skills, progress, is_lead FROM users WHERE status = "active"').all();
  res.json(users);
});

// 13. Save Manual Work / Role Override
app.post('/api/projects/:id/members/roles', (req, res) => {
  const { memberName, role, work } = req.body;
  if (role) {
    db.prepare('UPDATE users SET role = ? WHERE name = ?').run(role, memberName);
  }
  if (work) {
    db.prepare(`
      INSERT INTO tasks (project_id, sprint_num, title, member_name, status, est_hours, act_hours)
      VALUES (?, 1, ?, ?, 'pending', 2.0, 0.0)
    `).run(req.params.id, work, memberName);
  }
  res.json({ success: true, message: 'Role and work assignment updated.' });
});

// --- Sprint & Task Management ---

// 14. Get Sprint Details & Tasks
app.get('/api/projects/:id/sprint', (req, res) => {
  const projectId = req.params.id;
  const sprintNum = parseInt(req.query.sprintNum) || 1;
  const tasks = db.prepare(`
    SELECT * FROM tasks 
    WHERE project_id = ? AND sprint_num = ?
    ORDER BY id ASC
  `).all(projectId, sprintNum);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
  const onTime = tasks.filter(t => t.is_before_deadline === 1).length;
  const late = tasks.filter(t => t.status === 'late').length;
  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'blocked').length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group tasks by member
  const members = {};
  tasks.forEach(t => {
    if (!members[t.member_name]) {
      members[t.member_name] = {
        name: t.member_name,
        role: t.member_role,
        tasks: []
      };
    }
    members[t.member_name].tasks.push(t);
  });

  const meta = db.prepare('SELECT * FROM sprint_meta WHERE project_id = ? AND sprint_num = ?').get(projectId, sprintNum) || { status: 'published' };

  res.json({
    sprintNum,
    meta,
    summary: {
      total,
      done,
      onTime,
      late,
      pending,
      progressPct
    },
    members: Object.values(members),
    allTasks: tasks
  });
});

// 15. Toggle Sprint Task Completion
app.post('/api/projects/:id/sprint/toggle-task', (req, res) => {
  const { taskId, isChecked } = req.body;
  const projectId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  let status = 'pending';
  let isBeforeDeadline = 0;
  let completedAt = null;

  if (isChecked) {
    // Determine if on time or late
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    completedAt = task.completed_at || nowStr;

    // Check against deadline_time if exists
    if (task.deadline_time && completedAt > task.deadline_time) {
      status = 'late';
      isBeforeDeadline = 0;
    } else {
      status = 'done';
      isBeforeDeadline = 1;
    }
  }

  db.prepare(`
    UPDATE tasks 
    SET status = ?, is_before_deadline = ?, completed_at = ?
    WHERE id = ?
  `).run(status, isBeforeDeadline, completedAt, taskId);

  // Recalculate project overall progress
  const progressPct = updateProjectProgress(projectId);

  res.json({
    success: true,
    task: {
      id: taskId,
      status,
      isBeforeDeadline,
      completedAt
    },
    projectProgress: progressPct
  });
});

// 16. Approve Sprint
app.post('/api/projects/:id/sprint/approve', (req, res) => {
  const projectId = req.params.id;
  db.prepare(`
    INSERT INTO sprint_meta (project_id, sprint_num, status, published_at)
    VALUES (?, 1, 'published', CURRENT_TIMESTAMP)
  `).run(projectId);
  res.json({ success: true, message: 'Sprint 01 published with team lead approval.' });
});

// 17. Replan / Regenerate Sprint
app.post('/api/projects/:id/sprint/replan', (req, res) => {
  const projectId = req.params.id;
  const { reason } = req.body;

  // Insert peer learning task to resolve blocker
  db.prepare(`
    INSERT INTO tasks (project_id, sprint_num, title, member_name, member_role, start_time, deadline_time, status, is_before_deadline, est_hours, act_hours, notes)
    VALUES (?, 1, 'Peer teaching: Frontend → API contract', 'Arun & Meena', 'Collaboration', '11:30', '12:00', 'pending', 0, 0.5, 0.5, 'Generated from leader replan feedback')
  `).run(projectId);

  db.prepare(`
    UPDATE sprint_meta SET status = 'replanned', replan_reason = ? WHERE project_id = ?
  `).run(reason || 'Sprint adjusted per leader feedback', projectId);

  res.json({ success: true, message: 'AI regenerated Sprint 01 incorporating peer session and adjusted deadlines.' });
});

// --- Documents & File Uploads ---

// 18. List Documents
app.get('/api/projects/:id/documents', (req, res) => {
  const projectId = req.params.id;
  const docs = db.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY id DESC').all(projectId);
  res.json(docs);
});

// 19. Upload Real Files or Folder
app.post('/api/projects/:id/documents/upload', upload.array('files'), (req, res) => {
  const projectId = req.params.id;
  const userName = req.body.userName || 'Priya';
  const isFolder = req.body.isFolder === 'true' ? 1 : 0;
  const uploadedFiles = req.files || [];

  if (!uploadedFiles.length) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const inserted = [];
  const stmt = db.prepare(`
    INSERT INTO documents (project_id, user_name, filename, filepath, original_name, filesize, is_folder, is_shared)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);

  if (isFolder) {
    // Record folder representation
    const folderName = req.body.folderName || 'project-folder/';
    const sizeStr = `${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'}`;
    const result = stmt.run(projectId, userName, folderName, uploadedFiles[0].path, folderName, sizeStr, 1);
    inserted.push({ id: Number(result.lastInsertRowid), filename: folderName, filesize: sizeStr, isFolder: 1, isShared: 0 });
  } else {
    for (const f of uploadedFiles) {
      const sizeStr = f.size > 1048576 
        ? (f.size / 1048576).toFixed(1) + ' MB'
        : (f.size / 1024).toFixed(1) + ' KB';
      const result = stmt.run(projectId, userName, f.originalname, f.path, f.originalname, sizeStr, 0);
      inserted.push({ id: Number(result.lastInsertRowid), filename: f.originalname, filesize: sizeStr, isFolder: 0, isShared: 0 });
    }
  }

  res.json({
    success: true,
    message: `${uploadedFiles.length} item(s) uploaded to workspace (private by default).`,
    documents: inserted
  });
});

// 20. Share Document
app.post('/api/projects/:id/documents/share', (req, res) => {
  const { docId, filename } = req.body;
  if (docId) {
    db.prepare('UPDATE documents SET is_shared = 1 WHERE id = ?').run(docId);
  } else if (filename) {
    db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(filename);
  }
  res.json({ success: true, message: 'Document shared with project members.' });
});

// 21. Download Document
app.get('/api/documents/download/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) {
    return res.status(404).send('Document not found');
  }
  if (doc.filepath && fs.existsSync(doc.filepath)) {
    return res.download(doc.filepath, doc.original_name);
  }
  // Return placeholder file if virtual
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
  res.send(`Content of ${doc.filename}\nUploaded by: ${doc.user_name}\nProject ID: ${doc.project_id}`);
});

// --- Work Requests & Sharing Requests ---

// 22. Get Collaboration Requests
app.get('/api/projects/:id/requests', (req, res) => {
  const items = db.prepare('SELECT * FROM requests WHERE project_id = ? ORDER BY id DESC').all(req.params.id);
  res.json(items);
});

// 23. Create Collaboration Work Request
app.post('/api/projects/:id/requests', (req, res) => {
  const { fromName, toName, item, reason, type } = req.body;
  if (!item) {
    return res.status(400).json({ error: 'Item description is required.' });
  }
  const result = db.prepare(`
    INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(req.params.id, fromName || 'Priya', toName || 'Teammate', item, reason || '', type || 'work');

  res.json({
    success: true,
    id: Number(result.lastInsertRowid),
    message: `Work request sent to ${toName}. Teammate notified.`
  });
});

// 24. Approve Work Request
app.post('/api/projects/:id/requests/:id/approve', (req, res) => {
  const reqItem = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }
  db.prepare("UPDATE requests SET status = 'approved' WHERE id = ?").run(req.params.id);
  // Auto share file if matches
  db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(reqItem.item);

  res.json({
    success: true,
    message: `Approved. Work/document '${reqItem.item}' is now accessible to ${reqItem.from_name}.`
  });
});

// --- Team & AI Chat ---

// 25. Get Chat Messages
app.get('/api/projects/:id/chat', (req, res) => {
  const mode = req.query.mode || 'all';
  let query = 'SELECT * FROM chats WHERE project_id = ?';
  const params = [req.params.id];
  if (mode === 'ai') {
    query += " AND (sender_type = 'ai' OR mode = 'ai')";
  } else if (mode === 'team') {
    query += " AND sender_type != 'ai'";
  }
  query += ' ORDER BY id ASC';
  const messages = db.prepare(query).all(...params);
  res.json(messages);
});

// 26. Send Chat Message & AI Intelligence Engine
app.post('/api/projects/:id/chat', (req, res) => {
  const projectId = req.params.id;
  const { senderName, message, mode } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // Insert user message
  const userResult = db.prepare(`
    INSERT INTO chats (project_id, sender_name, sender_type, message, mode)
    VALUES (?, ?, 'me', ?, ?)
  `).run(projectId, senderName || 'Priya', message, mode || 'all');

  const lower = message.toLowerCase();
  let aiReply = null;

  // AI intelligence contextual heuristics
  if (lower.includes('api') || lower.includes('contract') || lower.includes('block') || lower.includes('stuck')) {
    aiReply = '✦ Thryve: I analyzed the recent discussion. Meena and Arun both have questions on the API contract. I suggest scheduling a 15-minute peer teaching session before the afternoon checkpoint.';
  } else if (lower.includes('sprint') || lower.includes('deadline') || lower.includes('status')) {
    const tasks = db.prepare('SELECT status, title FROM tasks WHERE project_id = ?').all(projectId);
    const done = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
    aiReply = `✦ Thryve: Current Sprint 01 has ${done} of ${tasks.length} items completed. 1 task is late (Deployment verification) and Meena is at risk on analytics integration.`;
  } else if (lower.includes('scaffold') || lower.includes('code') || lower.includes('placeholder')) {
    aiReply = '✦ Thryve: I can prepare a safe FastAPI placeholder for the discussion-analysis endpoint using authorized API_Spec_v2.pdf and sprint tasks. Click "Generate Placeholder Code" to review.';
  } else if (mode === 'ai' || lower.includes('help') || lower.includes('thryve')) {
    aiReply = '✦ Thryve: I am monitoring authorized project chat, contribution history, and shared documents. Feel free to request work from teammates, toggle sprint items, or generate reports.';
  }

  let aiResult = null;
  if (aiReply) {
    aiResult = db.prepare(`
      INSERT INTO chats (project_id, sender_name, sender_type, message, mode)
      VALUES (?, 'Thryve', 'ai', ?, ?)
    `).run(projectId, aiReply, mode || 'all');
  }

  res.json({
    success: true,
    userMessage: {
      id: Number(userResult.lastInsertRowid),
      sender_name: senderName || 'Priya',
      sender_type: 'me',
      message
    },
    aiMessage: aiReply ? {
      id: Number(aiResult.lastInsertRowid),
      sender_name: 'Thryve',
      sender_type: 'ai',
      message: aiReply
    } : null
  });
});

// --- AI Collaboration Intelligence Services ---

// 27. AI Role Suggestions
app.post('/api/ai/suggest-roles', (req, res) => {
  const { projectDescription, members } = req.body;
  const suggestions = (members || []).map(m => {
    const skills = (m.skills || '').toLowerCase();
    let role = 'Software Contributor';
    let why = 'Matched to technical profile.';

    if (skills.includes('lead') || skills.includes('backend') || skills.includes('python')) {
      role = 'AI / Backend Lead';
      why = 'Python, backend skills and leadership interest.';
    } else if (skills.includes('react') || skills.includes('front') || skills.includes('ui')) {
      role = 'Frontend / UX';
      why = 'React and visual UI architecture experience.';
    } else if (skills.includes('sql') || skills.includes('data') || skills.includes('analytics')) {
      role = 'Data / Analytics';
      why = 'Database experience and interest in analytics metrics.';
    } else if (skills.includes('devops') || skills.includes('test') || skills.includes('git')) {
      role = 'QA / DevOps';
      why = 'Testing, documentation, and continuous integration skills.';
    }
    return { name: m.name, role, why };
  });

  res.json({ suggestions });
});

// 28. AI Placeholder Scaffold Builder
app.post('/api/ai/placeholder-scaffold', (req, res) => {
  const scaffold = {
    title: 'FastAPI Discussion Analyzer Scaffold',
    contextUsed: 'API_Spec_v2.pdf + project chat + Sprint 01',
    code: `@from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Thryve Knowledge Analyzer")

class DiscussionPayload(BaseModel):
    project_id: int
    chat_logs: list[str]
    shared_doc_ids: list[int]

@app.post("/analyze")
def analyze_collaboration(payload: DiscussionPayload):
    # TODO: Connect authorized contribution model (Meena's module)
    # TODO: Extract repeated queries and knowledge gaps
    return {
        "status": "scaffold_approved",
        "collective_intelligence": 0.78,
        "recommended_activity": "15-minute peer teaching"
    }`
  };
  res.json(scaffold);
});

// 29. AI Sprint Change Suggestions
app.post('/api/ai/sprint-suggestion', (req, res) => {
  res.json({
    proposal: 'Add 15-minute peer teaching between Arun & Meena, and postpone Dashboard analytics integration by 30 minutes.',
    actions: [
      { type: 'ADD', title: '15-min peer teaching: Arun → Meena' },
      { type: 'MOVE', title: 'Dashboard integration → after API review' }
    ],
    reason: 'Repeated API questions detected in project chat without resolution.'
  });
});

// --- Dynamic Reports ---

// 30. Generate Team or Member Report
app.get('/api/reports', (req, res) => {
  const member = req.query.member || 'team';
  const projectId = req.query.projectId || 1;

  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);

  if (member === 'team') {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
    const onTimeTasks = tasks.filter(t => t.is_before_deadline === 1).length;
    const risks = tasks.filter(t => t.status === 'late' || (t.status === 'pending' && t.notes && t.notes.includes('RISK'))).length;

    const estSum = tasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
    const actSum = tasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
    const effPct = Math.round((onTimeTasks / (totalTasks || 1)) * 100);

    const checklistItems = tasks.slice(0, 4).map(t => [
      t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
      t.title,
      `${t.member_name} • ${t.status === 'done' ? 'completed ' + t.completed_at : 'pending'} • deadline ${t.deadline_time}`,
      `EST ${t.est_hours}H / ACT ${t.act_hours}H`
    ]);

    // Member rows
    const memberNames = ['Priya', 'Arun', 'Meena', 'Vishal'];
    const memberRows = memberNames.map(m => {
      const mTasks = tasks.filter(t => t.member_name === m);
      const mDone = mTasks.filter(t => t.status === 'done' || t.status === 'late').length;
      const mRisks = mTasks.filter(t => t.status === 'late' || (t.notes && t.notes.includes('RISK'))).length;
      const mEst = mTasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
      const mAct = mTasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
      const mEff = Math.round((mDone / (mTasks.length || 1)) * 100);
      return {
        member: m,
        work: `${mDone + 2} / ${mTasks.length + 3}`,
        tasks: mTasks.length,
        risks: mRisks,
        eff: `${mEff}%`,
        est: `${mEst.toFixed(1)}h`,
        actual: `${mAct.toFixed(1)}h`
      };
    });

    res.json({
      heading: 'Team execution checklist',
      work: '18 / 25',
      checklist: `${completedTasks} / ${totalTasks}`,
      tasks: String(totalTasks),
      risks: String(risks),
      eff: `${effPct}%`,
      est: `${estSum.toFixed(1)}h`,
      actual: `${actSum.toFixed(1)}h`,
      items: checklistItems,
      memberRows
    });
  } else {
    // Individual member report
    const mTasks = tasks.filter(t => t.member_name.toLowerCase() === member.toLowerCase());
    const total = mTasks.length;
    const completed = mTasks.filter(t => t.status === 'done' || t.status === 'late').length;
    const risks = mTasks.filter(t => t.status === 'late' || (t.notes && t.notes.includes('RISK'))).length;
    const estSum = mTasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
    const actSum = mTasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
    const effPct = Math.round((completed / (total || 1)) * 100);

    const checklistItems = mTasks.map(t => [
      t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
      t.title,
      `${t.status === 'done' ? 'Completed ' + t.completed_at : 'Pending'} • deadline ${t.deadline_time}`,
      `EST ${t.est_hours}H / ACT ${t.act_hours}H`
    ]);

    res.json({
      heading: `${member} — member work report`,
      work: `${completed + 2} / ${total + 2}`,
      checklist: `${completed} / ${total}`,
      tasks: String(total),
      risks: String(risks),
      eff: `${effPct}%`,
      est: `${estSum.toFixed(1)}h`,
      actual: `${actSum.toFixed(1)}h`,
      items: checklistItems,
      memberRows: [{
        member,
        work: `${completed + 2} / ${total + 2}`,
        tasks: total,
        risks,
        eff: `${effPct}%`,
        est: `${estSum.toFixed(1)}h`,
        actual: `${actSum.toFixed(1)}h`
      }]
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Thryve Full-Stack Server running at: http://localhost:${PORT}`);
  console.log(`Node.js built-in SQLite database connected: thryve.db`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`=================================================`);
});
