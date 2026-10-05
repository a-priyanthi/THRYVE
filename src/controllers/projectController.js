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
    
    const activeTeam = db.prepare('SELECT id FROM teams ORDER BY id DESC LIMIT 1').get();
    const teamId = (activeTeam && activeTeam.id) ? activeTeam.id : 1;

    const projResult = db.prepare(`
      INSERT INTO projects (team_id, name, description, member_count, progress)
      VALUES (?, ?, ?, ?, 0)
    `).run(teamId, name || 'New Project', description || '', parseInt(memberCount) || 4);
    
    const projectId = Number(projResult.lastInsertRowid);

    // Save or update members
    const validMembers = [];
    if (Array.isArray(members)) {
      members.forEach((m, idx) => {
        if (!m || !m.name || !m.name.trim()) return;
        const cleanName = m.name.trim();
        const memberEmail = (m.email && m.email.trim()) 
          ? m.email.trim() 
          : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member' + (idx + 1)}@team.demo`;
        
        validMembers.push({ ...m, name: cleanName, email: memberEmail });
        
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(memberEmail);
        if (!existing) {
          db.prepare(`
            INSERT INTO users (team_id, name, email, password, role, title, bio, skills, status, is_lead)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
          `).run(teamId, cleanName, memberEmail, 'welcome123', 'Member', idx === 0 ? 'TEAM LEAD' : 'MEMBER', m.bio || m.description || '', m.skills || '', idx === 0 ? 1 : 0);
        }
      });
    }

    // AI generated initial roles based strictly on provided members
    const roles = recommendRoles(validMembers);
    if (roles && roles.length) {
      roles.forEach(r => {
        if (r && r.name && r.role) {
          db.prepare('UPDATE users SET role = ? WHERE name = ? AND team_id = ?').run(r.role, r.name, teamId);
        }
      });
    }

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
    const projectId = req.params.id;
    const project = projectId ? db.prepare('SELECT team_id FROM projects WHERE id = ?').get(projectId) : null;
    const teamId = project ? project.team_id : null;
    let users;
    if (teamId) {
      users = db.prepare("SELECT id, name, email, role, title, bio, skills, progress, is_lead FROM users WHERE team_id = ? AND status = 'active'").all(teamId);
    } else {
      users = db.prepare("SELECT id, name, email, role, title, bio, skills, progress, is_lead FROM users WHERE status = 'active'").all();
    }
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

/**
 * 14. Add New Member to Existing Project (Instant / Anytime)
 */
function addProjectMember(req, res, next) {
  try {
    const projectId = req.params.id;
    const { name, email, bio, skills, role, title } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Member name is required.' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const teamId = project ? project.team_id : 1;

    let existing = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) : null;
    let userId;
    let assignedRole = role || 'Member';

    if (existing) {
      userId = existing.id;
      db.prepare(`
        UPDATE users 
        SET team_id = ?, bio = COALESCE(?, bio), skills = COALESCE(?, skills), role = COALESCE(?, role), status = 'active'
        WHERE id = ?
      `).run(teamId, bio || null, skills || null, role || null, userId);
      assignedRole = existing.role || assignedRole;
    } else {
      const generatedEmail = email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member' + Date.now()}@team.demo`;
      const result = db.prepare(`
        INSERT INTO users (team_id, name, email, password, role, title, bio, skills, status, is_lead, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0)
      `).run(teamId, name.trim(), generatedEmail, 'welcome123', assignedRole, title || 'MEMBER', bio || '', skills || '');
      userId = Number(result.lastInsertRowid);
    }

    // AI recommendation if generic role
    if (!role || role === 'Member' || role === 'Pending Role') {
      const aiSuggestions = recommendRoles([{ name: name.trim(), bio: bio || '', skills: skills || '' }]);
      if (aiSuggestions && aiSuggestions.length) {
        assignedRole = aiSuggestions[0].role;
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(assignedRole, userId);
      }
    }

    // Update project member_count if actual users exceeds it
    const activeMembersCount = db.prepare("SELECT count(*) as c FROM users WHERE team_id = ? AND status = 'active'").get(teamId).c;
    if (project && activeMembersCount > project.member_count) {
      db.prepare('UPDATE projects SET member_count = ? WHERE id = ?').run(activeMembersCount, projectId);
    }

    res.status(201).json({
      success: true,
      message: `Member ${name} added to project!`,
      member: { id: userId, name: name.trim(), role: assignedRole, team_id: teamId }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
  getProjectMembers,
  updateMemberRoleAndWork,
  addProjectMember
};
