const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/suggest-roles', aiController.suggestRoles);
router.post('/placeholder-scaffold', aiController.placeholderScaffold);
router.post('/sprint-suggestion', aiController.sprintSuggestion);

module.exports = router;
