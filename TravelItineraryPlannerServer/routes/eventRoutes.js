const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

// Routes
router.post('/add', verifyToken, eventController.addEvent); // Add event
router.get('/by-date', verifyToken, eventController.getEventsByDate); // Get events by date

module.exports = router;
