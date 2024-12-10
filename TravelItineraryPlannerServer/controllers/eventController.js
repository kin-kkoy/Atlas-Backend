const EventModel = require('../models/Event');
const ActivityModel = require('../models/Activity');
const UserModel = require('../models/User');
const PermissionModel = require('../models/Permission');
const CalendarModel = require('../models/Calendar');
const NotificationModel = require('../models/Notification');

const eventController = {
  addEvent: async (req, res) => {
    try {
      const { title, description, activities, date, sharing } = req.body;
      const { calendarId } = req.params;
      
      // Create the event
      const event = await EventModel.create({
        title,
        description,
        date: new Date(date),
        calendarId,
        createdBy: req.user.id
      });

      // Add activities
      let savedActivities = [];
      if (activities && activities.length > 0) {
        savedActivities = await Promise.all(activities.map(activity => 
          ActivityModel.create({
            ...activity,
            eventId: event._id,
            startTime: new Date(activity.startTime),
            endTime: new Date(activity.endTime)
          })
        ));
      }

      // Include activities in the response
      const eventWithActivities = {
        ...event.toObject(),
        activities: savedActivities
      };

      res.status(201).json({
        message: 'Event created successfully',
        event: eventWithActivities
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message || 'Failed to create event' });
    }
  },

  getEventsByDate: async (req, res) => {
    try {
      const { date } = req.query;
      const { calendarId } = req.params;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all events for the calendar
      const events = await EventModel.find({ calendarId });
      
      // Get activities for these events that fall within the date range
      const activities = await ActivityModel.find({
        eventId: { $in: events.map(event => event._id) },
        startTime: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      // Combine events with their activities
      const eventsWithActivities = events.map(event => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        activities: activities.filter(activity => 
          activity.eventId.toString() === event._id.toString()
        )
      })).filter(event => event.activities.length > 0);

      res.json(eventsWithActivities);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  deleteEvent: async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // First, check if the event exists and get its details
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if the event belongs to the user's calendar
        const calendar = await CalendarModel.findById(event.calendarId);
        if (calendar.userId.toString() === userId) {
            // User owns the calendar, allow deletion
            await ActivityModel.deleteMany({ eventId });
            await PermissionModel.deleteMany({ eventId });
            await EventModel.findByIdAndDelete(eventId);
            
            return res.status(200).json({ 
                message: 'Event and all associated data deleted successfully',
                deletedEventId: eventId
            });
        }

        // If not the owner, check for modify permission
        const hasModifyPermission = await PermissionModel.findOne({
            eventId,
            userId,
            accessLevel: 'modify'
        });

        if (!hasModifyPermission) {
            return res.status(403).json({ 
                error: 'Not authorized to delete this event'
            });
        }

        // User has modify permission, proceed with deletion
        await ActivityModel.deleteMany({ eventId });
        await PermissionModel.deleteMany({ eventId });
        await EventModel.findByIdAndDelete(eventId);
        
        res.status(200).json({ 
            message: 'Event and all associated data deleted successfully',
            deletedEventId: eventId
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event: ' + error.message });
    }
},

  shareEvent: async (req, res) => {
    try {
        const { eventId, recipientEmail, permission } = req.body;
        
        // Find the recipient user
        const recipient = await UserModel.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        // Get the original event
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Get recipient's calendar
        const recipientCalendar = await CalendarModel.findOne({ userId: recipient._id });
        if (!recipientCalendar) {
            return res.status(404).json({ error: 'Recipient calendar not found' });
        }

        // Create a new event for the recipient
        const sharedEvent = new EventModel({
            title: event.title,
            description: event.description || '',
            date: event.date,
            calendarId: recipientCalendar._id,
            sharedFrom: req.user.id,
            originalEventId: eventId,
            sharedPermission: permission
        });
        
        const savedEvent = await sharedEvent.save();

        // Copy activities
        const activities = await ActivityModel.find({ eventId });
        const activityPromises = activities.map(activity => {
            return ActivityModel.create({
                title: activity.title,
                description: activity.description || 'No description provided',
                type: activity.type || 'activity',
                startTime: activity.startTime,
                endTime: activity.endTime,
                location: activity.location || '',
                eventId: savedEvent._id,
                isRecurring: activity.isRecurring || false,
                recurrenceRule: activity.recurrenceRule || ''
            });
        });

        await Promise.all(activityPromises);

        // Create notification
        const notification = new NotificationModel({
            recipientId: recipient._id,
            type: 'EVENT_SHARE',
            content: `${event.title} has been shared with you`,
            eventData: savedEvent
        });

        await notification.save();

        res.status(200).json({ 
            message: 'Event shared successfully',
            sharedEvent: savedEvent 
        });
    } catch (error) {
        console.error('Error sharing event:', error);
        res.status(500).json({ error: error.message || 'Failed to share event' });
    }
  },
  getAllEvents: async (req, res) => {
    try {
        const { calendarId } = req.params;
        
        const events = await EventModel.find({ calendarId })
            .lean()
            .exec();

        const eventIds = events.map(event => event._id);
        const activities = await ActivityModel.find({
            eventId: { $in: eventIds }
        }).lean();

        const eventsWithActivities = events.map(event => ({
            ...event,
            activities: activities.filter(activity => 
                activity.eventId.toString() === event._id.toString()
            )
        }));

        res.json(eventsWithActivities);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
  }
};

module.exports = eventController;
