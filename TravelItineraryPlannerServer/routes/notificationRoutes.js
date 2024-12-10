const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, notificationController.createNotification);
router.get('/', verifyToken, notificationController.getNotifications);
router.put('/:notificationId/read', verifyToken, notificationController.markAsRead);

module.exports = router;
