const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');

router.get('/', approvalController.getApprovals);
router.post('/:id/decide', approvalController.decideApproval);

module.exports = router;
