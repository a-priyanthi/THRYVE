const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const approvalRoutes = require('./approvalRoutes');
const documentRoutes = require('./documentRoutes');
const aiRoutes = require('./aiRoutes');
const reportRoutes = require('./reportRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Thryve AI Collaborative Platform API'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/approvals', approvalRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
