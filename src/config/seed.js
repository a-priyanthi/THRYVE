const { db } = require('./db');

/**
 * Seed database with initial default data if not already seeded
 */
function seedDatabase() {
  const teamCheck = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  if (teamCheck && teamCheck.count > 0) {
    return; // Already seeded
  }

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

module.exports = {
  seedDatabase
};
