const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    }, 

    type: {
        type: String,
    },

    content: {
        type: String,
        required: true,
    },

    eventData: {
        type: Object
    },

    isRead: {
        type: Boolean,
        default: false, 
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const NotificationModel = mongoose.model('notifications', notificationSchema);

module.exports = NotificationModel;
