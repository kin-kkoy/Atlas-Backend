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
            recurrenceRule,
            createdBy: req.user.id
        });

        const savedEvent = await newEvent.save();

        res.status(201).json({ message: 'Event created successfully', event: savedEvent });
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

        const permissions = await PermissionModel.find ({
            userId: req.user.id,
            calendarId: calendarId
        })

        const ownCalendar = await CalendarModel.findOne({
            userId: req.user.id
        });

        const accessibleCalendarIds = [
            ...permissions.map(p => p.calendarId),
            ownCalendar._id
        ];

        const events = await EventModel.find({
            calendarId: { $in: accessibleCalendarIds },
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('calendarId', 'title').exec();

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching events.' });
    }
};

const getAllAccessibleEvents = async (req, res) => {
    const { date } = req.query;
    
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const permissions = await PermissionModel.find({
            userId: req.user.id
        });

        const ownCalendar = await CalendarModel.findOne({
            userId: req.user.id,
        });

        const accessibleCalendarsIds = [...permissions.map(p => p.calendarId), ownCalendar._id];

        const events = await EventModel.find({
            calendarId: { $in: accessibleCalendarsIds},
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('calendarId', 'title').exec();

        const formattedEvents = events.map(event => ({
            ...event.toObject(),
            calendarTitle: event.calendarId.title
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error('Error fetching accessible events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};



module.exports = {
    addEvent,
    getEvents,
    getAllAccessibleEvents
};