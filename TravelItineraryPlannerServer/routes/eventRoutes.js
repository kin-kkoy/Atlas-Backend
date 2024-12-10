const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/add', verifyToken, eventController.addEvent); 
router.get('/:calendarId/by-date', verifyToken, eventController.getEventsByDate); 
router.delete('/:calendarId/events/:eventId', verifyToken, eventController.deleteEvent); 
router.post('/share', verifyToken, eventController.shareEvent);
router.get('/all', verifyToken, eventController.getAllEvents);
router.get('/:calendarId/all', verifyToken, eventController.getAllEvents);

module.exports = router;
