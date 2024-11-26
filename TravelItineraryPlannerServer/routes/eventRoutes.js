const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, eventController.createEvent);
router.get('/', verifyToken, eventController.getEvents);
module.exports = router;