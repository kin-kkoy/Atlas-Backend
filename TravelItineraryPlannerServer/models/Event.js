const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    calendarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calendars',
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
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceRule: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {collection: 'events'});

const EventModel = mongoose.model('events', EventSchema);
module.exports = EventModel;
