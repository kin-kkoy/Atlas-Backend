const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
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
    created_at: {
        type: Date,
        default: Date.now
    },
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    }]
}, {collection: 'calendars'});

const CalendarModel = mongoose.model('calendars', CalendarSchema);
module.exports = CalendarModel;