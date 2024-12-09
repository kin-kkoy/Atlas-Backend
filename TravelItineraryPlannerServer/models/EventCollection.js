const mongoose = require('mongoose');

const eventCollectionSchema = new mongoose.Schema({
    eventsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'eventCollections' });

module.exports = mongoose.model('eventCollections', eventCollectionSchema);