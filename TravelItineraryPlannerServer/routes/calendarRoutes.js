const express = require('express');
const router = express.Router();
const { addEvent, getEvents, generateShareLink, acceptInvitation, getSharedCalendars, removeCalendarPermission, getAllAccessibleEvents } = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/events', verifyToken, addEvent);
router.get('/:calendarId/events', verifyToken, getEvents);
router.post('/:calendarId/share', verifyToken, generateShareLink);
router.post('/join/:token', verifyToken, acceptInvitation);
router.get('/shared', verifyToken, getSharedCalendars);
router.delete('/:calendarId/permission', verifyToken, removeCalendarPermission);
router.get('/accessible', verifyToken, getAllAccessibleEvents);
module.exports = router;