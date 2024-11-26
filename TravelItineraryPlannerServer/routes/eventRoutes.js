const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/add', verifyToken, eventController.addEvent); 
router.get('/by-date', verifyToken, eventController.getEventsByDate); 
router.delete('/delete/:eventId', verifyToken, eventController.deleteEvent); 

module.exports = router;
