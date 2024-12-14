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
    isShared: {
        type: Boolean,
        default: false
    },
    sharedPermission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
    },
    sharedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'activities'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
});

const EventModel = mongoose.model('events', eventSchema);
module.exports = EventModel;