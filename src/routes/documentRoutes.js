const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/download/:id', documentController.downloadDocument);

module.exports = router;
