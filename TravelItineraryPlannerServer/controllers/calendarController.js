const crypto = require('crypto');
const InvitationModel = require('../models/Invitation');
const PermissionModel = require('../models/Permission');
const EventModel = require('../models/Event');
const CalendarModel = require('../models/Calendar');

const addEvent = async (req, res) => {
    const { calendarId } = req.params;
    const { title, description, startTime, endTime, location, isRecurring, recurrenceRule } = req.body;

    try {
        const newEvent = new EventModel({
            calendarId: calendarId,
            title,
            description,
            startTime,
            endTime,
            location,
            isRecurring,
            recurrenceRule
        });

        const savedEvent = await newEvent.save();

        res.status(201).json({ message: 'Event added successfully!', event: savedEvent });
    } catch (error) {
        console.error('Error adding event: ', error);
        res.status(500).json({ error: 'Failed to add event. Please try again later.' });
    }
}

const getEvents = async (req, res) => { //this gets event BY DATE
    const { calendarId } = req.params;
    const { date } = req.query;

    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const events = await EventModel.find({
            calendarId: calendarId,
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).exec();

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching events.' });
    }
};

const generateShareLink = async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { accessLevel } = req.body;

        const shareToken = crypto.randomBytes(32).toString('hex');

        const invitation = await InvitationModel.create({
            calendarId,
            token: shareToken,
            accessLevel,
            createdBy: req.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        const shareLink = `${process.env.FRONTEND_URL}/calendar/join/${shareToken}`;

        console.log('Share link: ', shareLink);

        res.json({
            shareLink,
            invitation
        });
    } catch (error) {
        console.error('Error generating share link: ', error);
        res.status(500).json({ error: 'Failed to generate share link.' });
    }
};

const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await InvitationModel.findOne({
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('calendarId');

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found or expired.' });
        }
        // for recording of the permission kada create
        await PermissionModel.create({
            calendarId: invitation.calendarId,
            userId: req.user.id,
            accessLevel: invitation.accessLevel,
            grantedAt: new Date()
        })

        //mu update sa inv stat
        invitation.status = 'accepted',
            await invitation.save();

        res.json({
            message: 'Invitation accepted successfully.',
            calendar: {
                _id: invitation.calendarId._id,
                title: invitation.calendarId.title,
                description: invitation.calendarId.description
            }
        });
    } catch (error) {
        console.error('Accept invitation error: ', error);
        res.status(500).json({ error: 'Failed to accept invitation.' });
    }
};

const getSharedCalendars = async (req, res) => {
    try {
        const permissions = await PermissionModel.find({
            userId: req.user.id,
        }).populate({
            path: 'calendarId',
            populate: {
                path: 'userId',
                model: 'users',
                select: 'name email'
            }
        });

        const calendars = permissions.map(permission => {
            if (!permission.calendarId) return null;
            return {
                _id: permission.calendarId._id,
                title: permission.calendarId.title,
                description: permission.calendarId.description,
                accessLevel: permission.accessLevel,
                ownerName: permission.calendarId.userId?.name || 'Unknown'
            };
        }).filter(calendar => calendar !== null);

        res.json({ calendars });
    } catch (error) {
        console.error('Error fetching shared calendars: ', error);
        res.status(500).json({ error: 'Failed to fetch shared calendars.' });
    }
};

const removeCalendarPermission = async (req, res) => {
    try {
        const { calendarId } = req.params;
        await PermissionModel.deleteOne({
            calendarId: calendarId,
            userId: req.user.id
        });
        await InvitationModel.deleteMany({
            calendarId: calendarId,
            status: 'pending',
        });

        await EventModel.deleteMany({
            calendarId: calendarId
        })

        res.json({ message: 'Calendar permission removed successfully' });
    } catch (error) {
        console.error('Error removing calendar permission:', error);
        res.status(500).json({ error: 'Failed to remove calendar permission' });
    }
};

module.exports = {
    addEvent,
    getEvents,
    generateShareLink,
    acceptInvitation,
    getSharedCalendars,
    removeCalendarPermission
};