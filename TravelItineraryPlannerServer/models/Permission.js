const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    calendarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calendars',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    accessLevel: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
    },
    grantedAt: {
        type: Date,
        default: Date.now
    }
});

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = mongoose.model('Permission', permissionSchema);