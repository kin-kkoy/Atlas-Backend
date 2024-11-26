const EventModel = require('../models/Event');

const eventController = {
  addEvent: async (req, res) => {
    try {
      const {
        calendarId,
        title,
        description,
        startTime,
        endTime,
        location,
        isRecurring,
        recurrenceRule,
      } = req.body;

      // Just to check if calendar exists
      if (!calendarId) {
        return res.status(400).json({ error: 'Calendar ID is required.' });
      }

      const newEvent = await EventModel.create({
        calendarId,
        title,
        description,
        startTime,
        endTime,
        location,
        isRecurring,
        recurrenceRule,
      });

      res.status(201).json({
        message: 'Event created successfully',
        event: newEvent,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event.' });
    }
  },

  getEventsByDate: async (req, res) => {
    try {
      const { calendarId, date } = req.query;

      if (!calendarId || !date) {
        return res.status(400).json({ error: 'Calendar ID and date are required.' });
      }

      console.log('Searching for events on date:', date); // DEBUG LOG PARA MAKAKITA KOS READ SDFJKBKJDFS

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Query range:', { startOfDay, endOfDay }); // DEBUG LOG RA JAPON

      const events = await EventModel.find({
        calendarId,
        startTime: { 
          $gte: startOfDay,
          $lte: endOfDay 
        }
      }).sort({ startTime: 1 });

      console.log('Found events:', events); // DEBUG LOG PLS WORK

      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events.' });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const deletedEvent = await EventModel.findByIdAndDelete(eventId);
      
      if (!deletedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  },
};

module.exports = eventController;
