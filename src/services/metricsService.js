const { db } = require('../config/db');

/**
 * Recalculate and update the overall progress percentage for a project
 * @param {number|string} projectId 
 * @returns {number} progress percentage (0-100)
 */
function updateProjectProgress(projectId) {
  const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId);
  if (!tasks.length) return 0;
  
  const completed = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
  const pct = Math.round((completed / tasks.length) * 100);
  
  db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(pct, projectId);
  return pct;
}

/**
 * Get sprint summary statistics and grouped tasks
 * @param {number|string} projectId 
 * @param {number} sprintNum 
 */
function getSprintSummary(projectId, sprintNum = 1) {
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

  const totalEstHours = tasks.reduce((sum, t) => sum + (t.est_hours || 0), 0);
  const totalActHours = tasks.reduce((sum, t) => sum + (t.act_hours || 0), 0);

  // Group tasks by member
  const members = {};
  tasks.forEach(t => {
    if (!members[t.member_name]) {
      members[t.member_name] = {
        name: t.member_name,
        role: t.member_role,
        totalEstHours: 0,
        totalActHours: 0,
        tasks: []
      };
    }
    members[t.member_name].tasks.push(t);
    members[t.member_name].totalEstHours += (t.est_hours || 0);
    members[t.member_name].totalActHours += (t.act_hours || 0);
  });

  const meta = db.prepare('SELECT * FROM sprint_meta WHERE project_id = ? AND sprint_num = ?').get(projectId, sprintNum) || {
    status: 'published',
    goal: 'Deliver a working StudySync AI workspace with project tasks, document sharing, AI role assignment, and team/member reports.',
    total_est_hours: 57
  };

  return {
    sprintNum,
    meta,
    summary: {
      total,
      done,
      onTime,
      late,
      pending,
      progressPct,
      totalEstHours,
      totalActHours
    },
    members: Object.values(members),
    allTasks: tasks
  };
}

module.exports = {
  updateProjectProgress,
  getSprintSummary
};
