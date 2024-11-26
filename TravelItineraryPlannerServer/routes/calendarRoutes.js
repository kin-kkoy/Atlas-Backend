const express = require('express');
const router = express.Router();
const { addEvent, getEvents } = require('../controllers/calendarController');

// Debug logs ni
router.post('/:calendarId/events', (req, res, next) => {
    console.log('Received event creation request:', {
        calendarId: req.params.calendarId,
        body: req.body
    });
    next();
}, addEvent);

router.get('/:calendarId/events', getEvents);

module.exports = router;