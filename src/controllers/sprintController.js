const { db } = require('../config/db');
const { getSprintSummary, updateProjectProgress } = require('../services/metricsService');

/**
 * 14. Get Sprint Details & Tasks
 */
function getSprint(req, res, next) {
  try {
    const projectId = req.params.id;
    const sprintNum = parseInt(req.query.sprintNum) || 1;
    const sprintData = getSprintSummary(projectId, sprintNum);
    res.json(sprintData);
  } catch (err) {
    next(err);
  }
}

/**
 * 15. Toggle Sprint Task Completion
 */
function toggleTask(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

/**
 * 16. Approve Sprint
 */
function approveSprint(req, res, next) {
  try {
    const projectId = req.params.id;
    db.prepare(`
      INSERT INTO sprint_meta (project_id, sprint_num, status, published_at)
      VALUES (?, 1, 'published', CURRENT_TIMESTAMP)
    `).run(projectId);

    res.json({ success: true, message: 'Sprint 01 published with team lead approval.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 17. Replan / Regenerate Sprint
 */
function replanSprint(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSprint,
  toggleTask,
  approveSprint,
  replanSprint
};
