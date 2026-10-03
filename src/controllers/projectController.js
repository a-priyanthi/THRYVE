const { db } = require('../config/db');
const { recommendRoles } = require('../services/aiIntelligenceService');

/**
 * 10. List Projects
 */
function listProjects(req, res, next) {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

/**
 * 11. Create Project with Member Setup & Trigger AI Roles
 */
function createProject(req, res, next) {
  try {
    const { name, description, memberCount, members } = req.body;
    
    const projResult = db.prepare(`
      INSERT INTO projects (team_id, name, description, member_count, progress)
      VALUES (?, ?, ?, ?, 0)
    `).run(1, name || 'New Project', description || '', parseInt(memberCount) || 4);
    
    const projectId = Number(projResult.lastInsertRowid);

    // Save or update members
    if (Array.isArray(members)) {
      members.forEach((m, idx) => {
        if (!m.email) return;
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(m.email);
        if (!existing) {
          db.prepare(`
            INSERT INTO users (team_id, name, email, password, role, title, bio, skills, is_lead)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(1, m.name, m.email, 'demo1234', 'Member', idx === 0 ? 'TEAM LEAD' : 'MEMBER', m.description || '', m.skills || '', idx === 0 ? 1 : 0);
        }
      });
    }

    // AI generated initial roles
    const roles = recommendRoles(members && members.length ? members : [
      { name: 'Priya', skills: 'Python, AI, Backend, Leadership' },
      { name: 'Arun', skills: 'Frontend, React, UI, JavaScript' },
      { name: 'Meena', skills: 'Database, SQL, Analytics, Python' },
      { name: 'Vishal', skills: 'Testing, DevOps, Documentation, Git' }
    ]);

    res.status(201).json({
      success: true,
      projectId,
      roles,
      message: 'Project created and AI initial roles generated.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 12. Get Project Members
 */
function getProjectMembers(req, res, next) {
  try {
    const users = db.prepare('SELECT id, name, email, role, title, bio, skills, progress, is_lead FROM users WHERE status = "active"').all();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

/**
 * 13. Save Manual Work / Role Override
 */
function updateMemberRoleAndWork(req, res, next) {
  try {
    const { memberName, role, work } = req.body;
    const projectId = req.params.id;

    if (role && memberName) {
      db.prepare('UPDATE users SET role = ? WHERE name = ?').run(role, memberName);
    }
    if (work && memberName) {
      db.prepare(`
        INSERT INTO tasks (project_id, sprint_num, title, member_name, status, est_hours, act_hours)
        VALUES (?, 1, ?, ?, 'pending', 2.0, 0.0)
      `).run(projectId, work, memberName);
    }
    res.json({ success: true, message: 'Role and work assignment updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
  getProjectMembers,
  updateMemberRoleAndWork
};
