const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/add', verifyToken, eventController.addEvent); 
router.get('/:calendarId/by-date', verifyToken, eventController.getEventsByDate); 
router.delete('/:eventId', verifyToken, eventController.deleteEvent); 
router.post('/share', verifyToken, eventController.shareEvent);

module.exports = router;
