const { db } = require('../config/db');
const fs = require('fs');

/**
 * 18. List Documents
 */
function listDocuments(req, res, next) {
  try {
    const projectId = req.params.id;
    const docs = db.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY id DESC').all(projectId);
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

/**
 * 19. Upload Real Files or Folder
 */
function uploadDocuments(req, res, next) {
  try {
    const projectId = req.params.id;
    const userName = req.body.userName || 'Priya';
    const isFolder = req.body.isFolder === 'true' ? 1 : 0;
    const uploadedFiles = req.files || [];

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const inserted = [];
    const stmt = db.prepare(`
      INSERT INTO documents (project_id, user_name, filename, filepath, original_name, filesize, is_folder, is_shared)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    if (isFolder) {
      const folderName = req.body.folderName || 'project-folder/';
      const sizeStr = `${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'}`;
      const result = stmt.run(projectId, userName, folderName, uploadedFiles[0].path, folderName, sizeStr, 1);
      inserted.push({ id: Number(result.lastInsertRowid), filename: folderName, filesize: sizeStr, isFolder: 1, isShared: 0 });
    } else {
      for (const f of uploadedFiles) {
        const sizeStr = f.size > 1048576 
          ? (f.size / 1048576).toFixed(1) + ' MB'
          : (f.size / 1024).toFixed(1) + ' KB';
        const result = stmt.run(projectId, userName, f.originalname, f.path, f.originalname, sizeStr, 0);
        inserted.push({ id: Number(result.lastInsertRowid), filename: f.originalname, filesize: sizeStr, isFolder: 0, isShared: 0 });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} item(s) uploaded to workspace (private by default).`,
      documents: inserted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 20. Share Document
 */
function shareDocument(req, res, next) {
  try {
    const { docId, filename } = req.body;
    if (docId) {
      db.prepare('UPDATE documents SET is_shared = 1 WHERE id = ?').run(docId);
    } else if (filename) {
      db.prepare('UPDATE documents SET is_shared = 1 WHERE filename = ?').run(filename);
    } else {
      return res.status(400).json({ error: 'docId or filename is required.' });
    }
    res.json({ success: true, message: 'Document shared with project members.' });
  } catch (err) {
    next(err);
  }
}

/**
 * 21. Download Document
 */
function downloadDocument(req, res, next) {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).send('Document not found');
    }
    if (doc.filepath && fs.existsSync(doc.filepath)) {
      return res.download(doc.filepath, doc.original_name);
    }
    // Return virtual content for demonstration items
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(`Content of ${doc.filename}\nUploaded by: ${doc.user_name}\nProject ID: ${doc.project_id}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDocuments,
  uploadDocuments,
  shareDocument,
  downloadDocument
};
