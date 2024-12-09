const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // REFER NI SA USER COLLECTIONS NOT THE USER MODEL
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#007bff'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'calendars' });

const CalendarModel = mongoose.model('calendars', calendarSchema);
module.exports = CalendarModel;