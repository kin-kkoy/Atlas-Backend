const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
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
        required: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceRule: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ActivityModel = mongoose.model('activities', activitySchema);
module.exports = ActivityModel;