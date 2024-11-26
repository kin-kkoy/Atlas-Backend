const EventModel = require('../models/Event');
const CalendarModel = require('../models/Calendar');

const eventController = {
    createEvent: async (req, res) => {
        try {
            const userId = req.user.userId;

            const calendar = await CalendarModel.findOne({ userId });
            
            if (!calendar) {
                return res.status(404).json({ error: "Calendar not found" });
            }

            const eventData = {
                ...req.body,
                calendarId: calendar._id,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime)
            };

            const event = await EventModel.create(eventData);

            await CalendarModel.findByIdAndUpdate(
                calendar._id,
                { $push: { events: event._id } }
            );

            res.status(201).json(event);
        } catch (error) {
            console.error('Event creation error:', error);
            res.status(500).json({ error: "Failed to create event" });
        }
    },

    getEvents: async (req, res) => {
        try {
            const userId = req.user.userId;
            const calendar = await CalendarModel.findOne({ userId });

            if (!calendar) {
                return res.status(404).json({ error: "Calendar not found" });
            }
            
            const events = await EventModel.find({calendarId: calendar._id});
            res.status(200).json(events);
        } catch (error) {
            console.error('Event retrieval error:', error);
            res.status(500).json({ error: "Failed to retrieve events" });
        }
    }
};

module.exports = eventController;