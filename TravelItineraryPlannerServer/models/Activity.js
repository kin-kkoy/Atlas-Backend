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
    }
});

const ActivityModel = mongoose.model('activities', activitySchema);
module.exports = ActivityModel;