const EventModel = require('../models/Event');

const addEvent = async (req, res) => {
    const { calendarId } = req.params;
    const { title, description, startTime, endTime, location, isRecurring, recurrenceRule } = req.body;

    try{
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
    }catch(error){
        console.error('Error adding event: ', error);
        res.status(500).json({ error: 'Failed to add event. Please try again later.' });
    }
}

const getEvents = async (req, res) => { //this gets event BY DATE
    const { calendarId } = req.params;
    const { date } = req.query;

    try{
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
    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error fetching events.' });
    }
};

const generateShareLink = async(req, res) => {
    try {
        const { calendarId } = req.params;
        const { accesLevel } = req.body;

        const shareToken = crypto.randomBytes(32).toString('hex');

        const invitation = await InvitationModel.create({
            calendarId,
            token: shareToken,
            accessLevel,
            createdBy: req.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        const shareLink = `${process.env.FRONTEND_URL}/calendar/join/${shareToken}`;

        res.json({
            shareLink,
            invitation
        });
    }catch(error){
        res.status(500).json({ error: 'Failed to generate share link.' });
    }
};

const acceptInvitation = async(req, res) => {
    try {
        const { token } = req.params;
        const invitation = await InvitationModel.findOne({ 
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if(!invitation){
            return res.status(404).json({ error: 'Invitation not found or expired.' });
        }
        // for recording of the permission kada create
        await PermissionModel.create({
            calendarId: invitation.calendarId,
            userId: req.user.id,
            accesLevel: invitation.accessLevel,
            grantedAt: new Date()
        })

        //mu update sa inv stat
        invitation.status = 'accepted',
        await invitation.save();

        res.json({ message: 'Invitation accepted successfully.' });
    }catch(error){
        res.status(500).json({ error: 'Failed to accept invitation.' });
    }
};

module.exports = { 
    addEvent, 
    getEvents, 
    generateShareLink, 
    acceptInvitation 
};