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

module.exports = { addEvent, getEvents };