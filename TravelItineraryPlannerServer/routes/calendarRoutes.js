const express = require('express');
const router = express.Router();
const { addEvent, getEvents, generateShareLink, acceptInvitation } = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/events', verifyToken, addEvent);
router.get('/:calendarId/events', verifyToken, getEvents);
router.post('/:calendarId/share', verifyToken, generateShareLink);
router.post('/join/:token', verifyToken, acceptInvitation);

module.exports = router;