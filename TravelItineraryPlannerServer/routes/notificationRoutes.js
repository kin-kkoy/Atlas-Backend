const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationController.getAllNotifications);
router.put('/:notificationId/read', verifyToken, notificationController.markAsRead);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

module.exports = router;
