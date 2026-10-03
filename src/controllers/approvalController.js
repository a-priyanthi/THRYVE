const { db } = require('../config/db');

/**
 * 8. Get Approvals Queue
 */
function getApprovals(req, res, next) {
  try {
    const projectId = req.query.projectId || 1;
    const items = db.prepare(`
      SELECT * FROM requests 
      WHERE project_id = ? AND status = 'pending' AND (type IN ('user_add', 'user_delete', 'share') OR to_name = 'Lead')
      ORDER BY id DESC
    `).all(projectId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * 9. Process Approval Decision
 */
function decideApproval(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(newStatus, id);

    // Apply side effects upon approval
    if (action === 'approve') {
      if (request.type === 'user_add') {
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
        db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(request.item);
      }
    }

    res.json({ success: true, status: newStatus, message: `Request ${action}d.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getApprovals,
  decideApproval
};
