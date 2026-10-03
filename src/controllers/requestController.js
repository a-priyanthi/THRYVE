const { db } = require('../config/db');

/**
 * 22. Get Collaboration Requests
 */
function getRequests(req, res, next) {
  try {
    const items = db.prepare('SELECT * FROM requests WHERE project_id = ? ORDER BY id DESC').all(req.params.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * 23. Create Collaboration Work Request
 */
function createRequest(req, res, next) {
  try {
    const { fromName, toName, item, reason, type } = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Item description is required.' });
    }

    const result = db.prepare(`
      INSERT INTO requests (project_id, from_name, to_name, item, reason, type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.params.id, fromName || 'Priya', toName || 'Teammate', item, reason || '', type || 'work');

    res.status(201).json({
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Work request sent to ${toName}. Teammate notified.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 24. Approve Work Request
 */
function approveRequest(req, res, next) {
  try {
    const reqItem = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    db.prepare("UPDATE requests SET status = 'approved' WHERE id = ?").run(req.params.id);
    
    // Auto share file if it matches document filename
    db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(reqItem.item);

    res.json({
      success: true,
      message: `Approved. Work/document '${reqItem.item}' is now accessible to ${reqItem.from_name}.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRequests,
  createRequest,
  approveRequest
};
