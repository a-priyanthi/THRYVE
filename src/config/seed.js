const { db } = require('./db');

/**
 * Reset database: clears all tables so a new user/team starts completely fresh
 */
function resetDatabase() {
  db.exec(`
    DELETE FROM tasks;
    DELETE FROM documents;
    DELETE FROM requests;
    DELETE FROM chats;
    DELETE FROM sprint_meta;
    DELETE FROM projects;
    DELETE FROM users;
    DELETE FROM teams;
  `);
  console.log('All pre-written and existing records cleared. Database is 100% clean.');
}

/**
 * Seed database: Populates the full StudySync 57-hour sprint demo scenario
 * @param {boolean} force - If true, bypasses existing team checks
 */
function seedDatabase(force = false) {
  if (!force && process.env.DEMO_SEED !== 'true') {
    // Leave database 100% clean for real first-time usage
    return;
  }

  if (!force) {
    const teamCheck = db.prepare('SELECT COUNT(*) as count FROM teams').get();
    if (teamCheck && teamCheck.count > 0) {
      return;
    }
  }

  console.log('Seeding StudySync 57-hour sprint demo scenario...');

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

  // 4. Sprint Meta (57 Hours Total)
  const insertMeta = db.prepare(`
    INSERT INTO sprint_meta (project_id, sprint_num, status, goal, total_est_hours)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertMeta.run(1, 1, 'published', 'Deliver a working StudySync AI workspace with project tasks, document sharing, AI role assignment, and team/member reports.', 57);

  // 5. Tasks (Sprint 01 - 17 Detailed Tasks / 57 Hours Total)
  seedSprintTasks();

  // 6. Documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (project_id, user_name, filename, filepath, original_name, filesize, is_folder, is_shared)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDoc.run(1, 'Priya', 'API_Spec_v2.pdf', null, 'API_Spec_v2.pdf', '2.1 MB', 0, 1);
  insertDoc.run(1, 'Arun', 'frontend-build/', null, 'frontend-build/', '18 files', 1, 1);
  insertDoc.run(1, 'Priya', 'analyzer.py', null, 'analyzer.py', '14.2 KB', 0, 0);

  // 7. Requests
  const insertReq = db.prepare(`
    INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertReq.run(1, 'Priya', 'Arun', 'frontend-build / API integration code', 'I need the completed API integration module to connect it with the analytics dashboard.', 'work', 'pending');
  insertReq.run(1, 'Meena', 'Priya', 'API_Spec_v2.pdf', 'Need API specs to finish knowledge metrics.', 'share', 'pending');
  insertReq.run(1, 'Vishal', 'Team', 'Testing checklist', 'Testing checklist is completed and ready for the integration team.', 'work', 'approved');
  insertReq.run(1, 'Kavya', 'Lead', 'Kavya Raman (kavya@team.demo)', 'New user signup approval', 'user_add', 'pending');
  insertReq.run(1, 'Team', 'Lead', 'Vishal (vishal@team.demo)', 'User deletion request confirmation', 'user_delete', 'pending');

  // 8. Chats
  const insertChat = db.prepare(`
    INSERT INTO chats (project_id, sender_name, sender_type, message, mode)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertChat.run(1, 'Thryve', 'ai', '✦ Thryve: I noticed Meena and Arun are discussing the same API topic. I can suggest a peer-learning activity.', 'all');
  insertChat.run(1, 'Arun', 'team', 'I can explain the frontend → API contract.', 'all');
  insertChat.run(1, 'Priya', 'me', 'Yes, schedule 15 minutes before the next sprint.', 'all');

  console.log('StudySync demo seed complete (57 hours total).');
}

function seedSprintTasks() {
  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, sprint_num, title, member_name, member_role, start_time, deadline_time, deadline_day, done_when, completed_at, status, is_before_deadline, est_hours, act_hours, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Priya tasks — Reports, integration, QA, demo (Total: 17 hours)
  insertTask.run(1, 1, 'Confirm integration branch and teammate branch names', 'Priya', 'Reports, integration, QA, demo', '09:00', '18:00', 'Day 1', 'Team agrees on merge order and branch ownership', '17:30', 'done', 1, 1.0, 1.0, 'Completed on time');
  insertTask.run(1, 1, 'Build Team Report with work, task, and risk summaries', 'Priya', 'Reports, integration, QA, demo', '09:00', '18:00', 'Day 4', 'Report shows real project data and selected reporting period', '16:45', 'done', 1, 4.0, 3.8, 'Completed on time');
  insertTask.run(1, 1, 'Build Member Report', 'Priya', 'Reports, integration, QA, demo', '09:00', '18:00', 'Day 6', 'Selecting Priya, Meena, Arun, or Vishal shows only that member’s tasks', '17:15', 'done', 1, 4.0, 4.0, 'Completed on time');
  insertTask.run(1, 1, 'Add deadline status and print-to-PDF styling', 'Priya', 'Reports, integration, QA, demo', '09:00', '18:00', 'Day 7', 'Completed tasks are labeled on time/late from timestamps; print hides controls', '15:20', 'done', 1, 3.0, 2.7, 'Completed on time');
  insertTask.run(1, 1, 'Integrate, QA, and prepare demo', 'Priya', 'Reports, integration, QA, demo', '09:00', '18:00', 'Day 10', 'Branches are integrated, key user journeys are checked, and demo flow is ready', null, 'pending', 0, 5.0, 0.0, 'Scheduled for Day 10');

  // Arun tasks — Backend, Supabase, authentication (Total: 14 hours)
  insertTask.run(1, 1, 'Confirm project, member, sprint, and task data fields', 'Arun', 'Backend, Supabase, authentication', '09:00', '18:00', 'Day 1', 'Required database fields and relationships are documented', '16:00', 'done', 1, 2.0, 1.8, 'Completed on time');
  insertTask.run(1, 1, 'Connect workspace project data to Supabase', 'Arun', 'Backend, Supabase, authentication', '09:00', '18:00', 'Day 3', 'Workspace loads records for the selected project', '17:40', 'done', 1, 4.0, 3.9, 'Completed on time');
  insertTask.run(1, 1, 'Add team signup and login validation', 'Arun', 'Backend, Supabase, authentication', '09:00', '18:00', 'Day 4', 'Missing fields and duplicate email are handled clearly', '16:50', 'done', 1, 4.0, 4.2, 'Completed on time');
  insertTask.run(1, 1, 'Enforce project and member access rules', 'Arun', 'Backend, Supabase, authentication', '09:00', '18:00', 'Day 6', 'Members cannot access another project’s private data', null, 'pending', 0, 4.0, 1.5, 'In progress');

  // Meena tasks — Frontend, workspace, task checklist (Total: 13 hours)
  insertTask.run(1, 1, 'Build workspace layout and navigation', 'Meena', 'Frontend, workspace, task checklist', '09:00', '18:00', 'Day 2', 'Dashboard, workspace, and Reports links work', '17:05', 'done', 1, 3.0, 2.8, 'Completed on time');
  insertTask.run(1, 1, 'Build sprint overview and task checklist', 'Meena', 'Frontend, workspace, task checklist', '09:00', '18:00', 'Day 4', 'Tasks display owner, estimate, deadline, and status', '16:30', 'done', 1, 4.0, 4.0, 'Completed on time');
  insertTask.run(1, 1, 'Add task status update controls', 'Meena', 'Frontend, workspace, task checklist', '09:00', '18:00', 'Day 5', 'Members can update task status and see the saved result', null, 'pending', 0, 3.0, 1.2, 'Awaiting API clarification');
  insertTask.run(1, 1, 'Add loading, empty, and error states', 'Meena', 'Frontend, workspace, task checklist', '09:00', '18:00', 'Day 7', 'Screens explain when data is loading, missing, or unavailable', null, 'pending', 0, 3.0, 0.0, 'AT RISK: Pending contract alignment');

  // Vishal tasks — AI features, documents (Total: 13 hours)
  insertTask.run(1, 1, 'Implement AI role assignment', 'Vishal', 'AI features, documents', '09:00', '18:00', 'Day 4', 'Team members receive role suggestions when AI is available', '15:10', 'done', 1, 4.0, 3.6, 'Completed on time');
  insertTask.run(1, 1, 'Handle AI service failures', 'Vishal', 'AI features, documents', '09:00', '18:00', 'Day 5', 'The app gives a helpful fallback when AI is unavailable', '14:40', 'done', 1, 2.0, 1.7, 'Completed on time');
  insertTask.run(1, 1, 'Implement document upload and sharing', 'Vishal', 'AI features, documents', '09:00', '18:00', 'Day 7', 'Authorized project members can upload and view documents', '19:15', 'late', 0, 4.0, 4.8, 'Completed late after Day 7 deadline');
  insertTask.run(1, 1, 'Add document access checks', 'Vishal', 'AI features, documents', '09:00', '18:00', 'Day 8', 'Users cannot view documents belonging to another project', null, 'pending', 0, 3.0, 0.0, 'Scheduled for Day 8');
}

module.exports = {
  resetDatabase,
  seedDatabase
};
