const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    calendarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calendars',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

const EventModel = mongoose.model('events', eventSchema);
module.exports = EventModel;