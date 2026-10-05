const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Team Auth
router.post('/team-login', authController.teamLogin);
router.post('/team-signup', authController.teamSignup);

// Member Auth
router.post('/member-login', authController.memberLogin);
router.post('/user-signup', authController.userSignup);
router.post('/delete-user-request', authController.deleteUserRequest);

// Profile & Settings
router.post('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/reset', authController.resetAllData);
router.post('/seed-demo', authController.seedDemoData);

module.exports = router;
