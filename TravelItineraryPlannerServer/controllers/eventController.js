const EventModel = require('../models/Event');
const ActivityModel = require('../models/Activity');
const UserModel = require('../models/User');
const PermissionModel = require('../models/Permission');
const CalendarModel = require('../models/Calendar');
const NotificationModel = require('../models/Notification');

const eventController = {
  addEvent: async (req, res) => {
    try {
      const { title, description, activities, date, isShared, shareWithEmail, sharePermission } = req.body;
      const { calendarId } = req.params;
      
      // Create the event
      const event = new EventModel({
        title,
        description,
        date: new Date(date),
        calendarId,
        createdBy: req.user.id,
        isShared: false,
        hasBeenShared: false,
        sharedPermission: 'view',  // default permission
        activities: []  // Initialize empty activities array
      });

      const savedEvent = await event.save();

      // Add activities if they exist
      let savedActivities = [];
      if (activities && activities.length > 0) {
        savedActivities = await Promise.all(activities.map(activity => 
          ActivityModel.create({
            ...activity,
            eventId: savedEvent._id,
            startTime: new Date(activity.startTime),
            endTime: new Date(activity.endTime)
          })
        ));

        // Update the event with activity references
        savedEvent.activities = savedActivities.map(activity => activity._id);
        await savedEvent.save();
      }

      // Include activities in the response
      const eventWithActivities = {
        ...savedEvent.toObject(),
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
        const { calendarId, eventId } = req.params;
        const userId = req.user.id;

        // Get the event
        const event = await EventModel.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check calendar ownership
        const calendar = await CalendarModel.findById(calendarId);
        if (!calendar) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        // If user owns the calendar or created the event, allow deletion
        if (calendar.userId.toString() === userId || event.createdBy?.toString() === userId) {
            await ActivityModel.deleteMany({ eventId });
            await EventModel.findByIdAndDelete(eventId);
            
            return res.status(200).json({ 
                message: 'Event deleted successfully',
                deletedEventId: eventId
            });
        }

        // Check shared event permissions
        const permission = await PermissionModel.findOne({
            userId: userId,
            eventId: eventId,
            accessLevel: 'edit'
        });

        if (permission) {
            await ActivityModel.deleteMany({ eventId });
            await EventModel.findByIdAndDelete(eventId);
            
            return res.status(200).json({ 
                message: 'Event deleted successfully',
                deletedEventId: eventId
            });
        }

        return res.status(403).json({ 
            error: 'You do not have permission to delete this event'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
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
        const originalEvent = await EventModel.findById(eventId);
        if (!originalEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Get recipient's calendar
        const recipientCalendar = await CalendarModel.findOne({ userId: recipient._id });
        if (!recipientCalendar) {
            return res.status(404).json({ error: 'Recipient calendar not found' });
        }

        // Create a new event for the recipient
        const sharedEvent = new EventModel({
            title: originalEvent.title,
            description: originalEvent.description || '',
            date: originalEvent.date,
            calendarId: recipientCalendar._id,
            sharedFrom: req.user.id,
            originalEventId: eventId,
            sharedPermission: permission || 'view',
            isShared: true,
            createdBy: originalEvent.createdBy,
            canEdit: permission === 'edit'
        });
        
        const savedSharedEvent = await sharedEvent.save();

        // Create permission record for the recipient with correct calendarId and accessLevel
        await PermissionModel.create({
            userId: recipient._id,
            eventId: savedSharedEvent._id,
            calendarId: recipientCalendar._id,
            accessLevel: permission === 'modify' ? 'edit' : 'view'
        });

        // Copy activities
        const activities = await ActivityModel.find({ eventId });
        const activityPromises = activities.map(activity => {
            return ActivityModel.create({
                title: activity.title,
                description: activity.description || '',
                type: activity.type || 'activity',
                startTime: activity.startTime,
                endTime: activity.endTime,
                location: activity.location || '',
                eventId: savedSharedEvent._id,
                isRecurring: activity.isRecurring || false,
                recurrenceRule: activity.recurrenceRule || ''
            });
        });

        await Promise.all(activityPromises);

        // Create notification
        const notification = new NotificationModel({
            recipientId: recipient._id,
            type: 'EVENT_SHARE',
            content: `${originalEvent.title} has been shared with you`,
            eventData: savedSharedEvent
        });

        await notification.save();

        res.status(200).json({ 
            message: 'Event shared successfully',
            sharedEvent: savedSharedEvent 
        });
    } catch (error) {
        console.error('Error sharing event:', error);
        res.status(500).json({ error: error.message || 'Failed to share event' });
    }
  },
  getAllEvents: async (req, res) => {
    try {
        const { calendarId } = req.params;
        
        // Get all events that:
        // 1. Belong to the user's calendar AND
        // 2. Either were created by the user OR are not shared events
        const events = await EventModel.find({ 
            calendarId,
            $or: [
                { createdBy: req.user.id },  // Events created by the user (including shared ones)
                { isShared: { $ne: true } }  // Non-shared events in the calendar
            ]
        })
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
  },
  getEventActivities: async (req, res) => {
    try {
        const { eventId } = req.params;
        const activities = await ActivityModel.find({ eventId });
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching event activities:', error);
        res.status(500).json({ error: 'Failed to fetch event activities' });
    }
  },
  getSharedEvents: async (req, res) => {
    try {
        const { calendarId } = req.params;
        
        // Find events that were shared with this user's calendar
        const events = await EventModel.find({ 
            calendarId,
            isShared: true,  // Use isShared field to filter
            sharedFrom: { $exists: true, $ne: null }
        })
        .populate({
            path: 'sharedFrom',
            select: 'userName email'  // Include both userName and email
        })
        .lean();

        // Get activities for these events
        const eventIds = events.map(event => event._id);
        const activities = await ActivityModel.find({
            eventId: { $in: eventIds }
        }).lean();

        // Combine events with their activities and sharer information
        const eventsWithActivities = events.map(event => ({
            ...event,
            sharedBy: event.sharedFrom?.userName || event.sharedFrom?.email || 'Unknown',
            activities: activities.filter(activity => 
                activity.eventId.toString() === event._id.toString()
            )
        }));

        res.json(eventsWithActivities);
    } catch (error) {
        console.error('Error fetching shared events:', error);
        res.status(500).json({ error: 'Failed to fetch shared events' });
    }
}
};

module.exports = eventController;
