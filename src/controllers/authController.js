const { db } = require('../config/db');
const { generateToken, verifyPassword, hashPassword } = require('../middleware/auth');

/**
 * 1. Team Login
 */
async function teamLogin(req, res, next) {
  try {
    const { email, password, teamId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const team = db.prepare('SELECT * FROM teams WHERE email = ?').get(email);
    if (!team) {
      return res.status(401).json({ error: 'Invalid team email or password.' });
    }

    const isMatch = await verifyPassword(password, team.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid team email or password.' });
    }

    const projects = db.prepare('SELECT * FROM projects WHERE team_id = ?').all(team.id);
    const users = db.prepare('SELECT id, name, email, role, title, status FROM users WHERE team_id = ?').all(team.id);

    const token = generateToken({ id: team.id, email: team.email, role: 'team_lead', type: 'team' });

    res.json({
      success: true,
      token,
      team: { id: team.id, name: team.name, email: team.email, lead_name: team.lead_name },
      projects,
      users
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Team Signup
 */
async function teamSignup(req, res, next) {
  try {
    const { name, email, password, leadName, userCount } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const existing = db.prepare('SELECT id FROM teams WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Team email already registered.' });
    }

    const hashedPassword = await hashPassword(password || 'demo1234');

    const result = db.prepare(`
      INSERT INTO teams (name, email, password, lead_name, user_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(name || 'New Team', email, hashedPassword, leadName || 'Lead', parseInt(userCount) || 4);

    const teamId = Number(result.lastInsertRowid);

    // Create lead user
    db.prepare(`
      INSERT INTO users (team_id, name, email, password, role, title, bio, skills, is_lead, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(teamId, leadName || 'Lead', email, hashedPassword, 'Lead', 'TEAM LEAD', 'Team creator and project lead', 'Leadership', 1, 'active');

    // Create initial project
    const projResult = db.prepare(`
      INSERT INTO projects (team_id, name, description, member_count, progress)
      VALUES (?, ?, ?, ?, ?)
    `).run(teamId, (name || 'New') + ' Workspace', 'Collaborative project workspace', parseInt(userCount) || 4, 0);

    const token = generateToken({ id: teamId, email, role: 'team_lead', type: 'team' });

    res.status(201).json({
      success: true,
      token,
      teamId,
      projectId: Number(projResult.lastInsertRowid),
      message: 'Team successfully created.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Member Login
 */
async function memberLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid member email or password.' });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid member email or password.' });
    }

    if (user.status === 'pending_approval') {
      return res.status(403).json({ error: 'Your account is currently waiting for Team Lead approval.' });
    }

    const token = generateToken({ id: user.id, email: user.email, is_lead: Boolean(user.is_lead), type: 'member' });

    res.json({
      success: true,
      token,
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
  } catch (err) {
    next(err);
  }
}

/**
 * 4. User Signup (Invite / Registration to approval queue)
 */
async function userSignup(req, res, next) {
  try {
    const { email, name, description, skills, learningStyle } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User email already exists.' });
    }

    const tempPassword = 'thryve' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await hashPassword(tempPassword);

    const targetTeam = req.body.teamId ? db.prepare('SELECT id FROM teams WHERE id = ?').get(req.body.teamId) : db.prepare('SELECT id FROM teams ORDER BY id ASC LIMIT 1').get();
    const targetTeamId = targetTeam ? targetTeam.id : 1;
    const targetProj = req.body.projectId ? db.prepare('SELECT id FROM projects WHERE id = ?').get(req.body.projectId) : db.prepare('SELECT id FROM projects WHERE team_id = ? ORDER BY id ASC LIMIT 1').get(targetTeamId);
    const targetProjId = targetProj ? targetProj.id : 1;

    db.prepare(`
      INSERT INTO users (team_id, name, email, password, role, title, bio, skills, learning_style, status, is_lead, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetTeamId, name || 'New Member', email, hashedPassword, 'Pending Role', 'MEMBER', description || '', skills || '', learningStyle || 'Hands-on', 'pending_approval', 0, 0);

    // Add to requests queue
    db.prepare(`
      INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(targetProjId, name || 'New Member', 'Lead', `${name || 'New Member'} (${email})`, description || 'New user signup request', 'user_add', 'pending');

    res.status(201).json({
      success: true,
      message: 'Invitation sent. Temporary password generated and team lead notified.',
      tempPassword
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. User Delete Request
 */
async function deleteUserRequest(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    const targetProj = db.prepare('SELECT id FROM projects WHERE team_id = ? ORDER BY id ASC LIMIT 1').get(user.team_id || 1);
    const targetProjId = targetProj ? targetProj.id : 1;

    db.prepare(`
      INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(targetProjId, name || user.name, 'Lead', `${name || user.name} (${email})`, 'Double-confirmed member deletion request', 'user_delete', 'pending');

    res.json({
      success: true,
      message: 'Deletion request sent to Team Lead for approval.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. Update Profile
 */
async function updateProfile(req, res, next) {
  try {
    const { email, name, bio, skills } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile.' });
    }

    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), skills = COALESCE(?, skills)
      WHERE email = ?
    `).run(name, bio, skills, email);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. Change Password
 */
async function changePassword(req, res, next) {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const hashedNew = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedNew, email);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. Reset All Data for Fresh First-Time Experience
 */
function resetAllData(req, res, next) {
  try {
    const { resetDatabase } = require('../config/seed');
    resetDatabase();
    res.json({ success: true, message: 'All data cleared. Database is 100% clean and ready for fresh usage.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 9. Re-seed Demo Scenario (StudySync 57h Sprint)
 */
function seedDemoData(req, res, next) {
  try {
    const { resetDatabase, seedDatabase } = require('../config/seed');
    resetDatabase();
    seedDatabase(true);
    res.json({ success: true, message: 'StudySync 57-hour sprint demo scenario loaded successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 10. Forgot Password / Password Reset
 */
async function forgotPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const team = db.prepare('SELECT id, name, email FROM teams WHERE email = ?').get(email);
    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);

    if (!team && !user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      if (team) {
        db.prepare('UPDATE teams SET password = ? WHERE id = ?').run(hashedPassword, team.id);
      }
      if (user) {
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
      }
      return res.json({ success: true, message: `Password reset successfully for ${email}. You can now log in!` });
    }

    res.json({
      success: true,
      accountType: team ? 'team' : 'member',
      name: team ? team.name : user.name,
      message: `Account verified for ${team ? team.name : user.name}. You may now enter your new password.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  teamLogin,
  teamSignup,
  memberLogin,
  userSignup,
  deleteUserRequest,
  updateProfile,
  changePassword,
  resetAllData,
  seedDemoData,
  forgotPassword
};
