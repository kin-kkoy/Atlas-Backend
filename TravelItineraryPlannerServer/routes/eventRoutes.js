const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/add', verifyToken, eventController.addEvent);
router.put('/:calendarId/update/:eventId', verifyToken, eventController.updateEvent);
router.delete('/:calendarId/events/:eventId', verifyToken, eventController.deleteEvent);
router.get('/:calendarId/by-date', verifyToken, eventController.getEventsByDate);
router.get('/:calendarId/all', verifyToken, eventController.getAllEvents);
router.get('/:calendarId/events/:eventId/activities', verifyToken, eventController.getEventActivities);
router.get('/:calendarId/shared', verifyToken, eventController.getSharedEvents);
router.post('/:calendarId/events/:eventId/activities', verifyToken, eventController.addActivities);
router.put('/:calendarId/events/:eventId/activities/:activityId', verifyToken, eventController.updateActivity);

module.exports = router;
