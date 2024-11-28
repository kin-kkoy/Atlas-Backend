const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    calendarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calendars',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    accessLevel: {
        type: String,
        enum: [ 'view', 'edit'],
        default: 'view'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }, 
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
});

const InvitationModel = mongoose.model('invitations', invitationSchema);
module.exports = InvitationModel;
