const { db } = require('../config/db');
const { analyzeChatAndRespond } = require('../services/aiIntelligenceService');

/**
 * 25. Get Chat Messages
 */
function getMessages(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

/**
 * 26. Send Chat Message & AI Intelligence Engine
 */
function sendMessage(req, res, next) {
  try {
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

    // Run AI contextual heuristics
    const aiReply = analyzeChatAndRespond(projectId, message, mode);

    let aiResult = null;
    if (aiReply) {
      aiResult = db.prepare(`
        INSERT INTO chats (project_id, sender_name, sender_type, message, mode)
        VALUES (?, 'Thryve', 'ai', ?, ?)
      `).run(projectId, aiReply, mode || 'all');
    }

    res.status(201).json({
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
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage
};
