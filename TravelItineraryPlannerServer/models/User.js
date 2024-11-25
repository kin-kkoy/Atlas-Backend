const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    calendars: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calendars'
    }
}, {collection: 'users'});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;