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
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurrenceRule: {
        type: String, // e.g., "FREQ=WEEKLY;INTERVAL=1"
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const EventModel = mongoose.model('events', eventSchema);
module.exports = EventModel;
