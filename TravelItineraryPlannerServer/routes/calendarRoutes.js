const express = require('express');
const router = express.Router();
const { addEvent, getEvents, getAllAccessibleEvents } = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:calendarId/events', verifyToken, addEvent);
router.get('/:calendarId/events', verifyToken, getEvents);
router.post('/:calendarId/share', verifyToken);
router.post('/join/:token', verifyToken);
router.get('/shared', verifyToken);
router.delete('/:calendarId/permission', verifyToken);
router.get('/accessible', verifyToken, getAllAccessibleEvents);
module.exports = router;