const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const sprintController = require('../controllers/sprintController');
const documentController = require('../controllers/documentController');
const requestController = require('../controllers/requestController');
const chatController = require('../controllers/chatController');
const upload = require('../middleware/upload');

// Base Projects CRUD
router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);

// Members
router.get('/:id/members', projectController.getProjectMembers);
router.post('/:id/members/roles', projectController.updateMemberRoleAndWork);

// Sprints & Tasks
router.get('/:id/sprint', sprintController.getSprint);
router.post('/:id/sprint/toggle-task', sprintController.toggleTask);
router.post('/:id/sprint/approve', sprintController.approveSprint);
router.post('/:id/sprint/replan', sprintController.replanSprint);

// Documents within Project
router.get('/:id/documents', documentController.listDocuments);
router.post('/:id/documents/upload', upload.array('files'), documentController.uploadDocuments);
router.post('/:id/documents/share', documentController.shareDocument);

// Collaboration Requests within Project
router.get('/:id/requests', requestController.getRequests);
router.post('/:id/requests', requestController.createRequest);
router.post('/:id/requests/:id/approve', requestController.approveRequest);

// Discussions / Chat within Project
router.get('/:id/chat', chatController.getMessages);
router.post('/:id/chat', chatController.sendMessage);

module.exports = router;
