const EventModel = require('../models/Event');
const ActivityModel = require('../models/Activity');
const UserModel = require('../models/User');
const PermissionModel = require('../models/Permission');
const CalendarModel = require('../models/Calendar');
const NotificationModel = require('../models/Notification');
const io = require('../utils/socket').getIO();
const socketUtil = require('../utils/socket');

const getSocketIO = () => {
  const io = socketUtil.getIO();
  return io;
};

const eventController = {
  addEvent: async (req, res) => {
    try {
      const { title, description, activities, date, isShared, shareWithEmail, sharePermission } = req.body;
      const { calendarId } = req.params;
      
      const event = new EventModel({
        title,
        description,
        date: new Date(date),
        calendarId,
        createdBy: req.user.id,
        activities: []
      });

      const savedEvent = await event.save();

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

        savedEvent.activities = savedActivities.map(activity => activity._id);
        await savedEvent.save();
      }

      // If event is to be shared, create a copy for the recipient
      if (isShared && shareWithEmail) {
        const recipient = await UserModel.findOne({ email: shareWithEmail });
        if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found' });
        }

        const recipientCalendar = await CalendarModel.findOne({ userId: recipient._id });
        
        if (!recipientCalendar) {
          return res.status(404).json({ error: 'Recipient calendar not found' });
        }

        const sharedEvent = new EventModel({
          title,
          description,
          date: new Date(date),
          calendarId: recipientCalendar._id,
          createdBy: req.user.id,
          isShared: true,
          sharedFrom: req.user.id,
          sharedPermission: sharePermission,
          activities: []
        });

        const savedSharedEvent = await sharedEvent.save();

        await PermissionModel.create({
          userId: recipient._id,
          eventId: savedSharedEvent._id,
          calendarId: recipientCalendar._id,
          accessLevel: sharePermission
        });

        if (activities && activities.length > 0) {
          const sharedActivities = await Promise.all(activities.map(activity => 
            ActivityModel.create({
              ...activity,
              eventId: savedSharedEvent._id,
              startTime: new Date(activity.startTime),
              endTime: new Date(activity.endTime)
            })
          ));
          
          savedSharedEvent.activities = sharedActivities.map(activity => activity._id);
          await savedSharedEvent.save();
        }

        // Create notification
        await NotificationModel.create({
          recipientId: recipient._id,
          type: 'EVENT_SHARE',
          content: `${title} has been shared with you`,
          eventData: savedSharedEvent
        });
      }

      res.status(201).json({
        message: 'Event created successfully',
        event: {
          ...savedEvent.toObject(),
          activities: savedActivities
        }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
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

      const events = await EventModel.find({ calendarId });
      
      const activities = await ActivityModel.find({
        eventId: { $in: events.map(event => event._id) },
        startTime: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

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

        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const calendar = await CalendarModel.findById(calendarId);
        if (!calendar) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        const hasPermission = 
            calendar.userId.toString() === userId || 
            event.createdBy.toString() === userId;

        if (!hasPermission) {
            return res.status(403).json({ error: 'You do not have permission to delete this event' });
        }

        await ActivityModel.deleteMany({ eventId: event._id });
        await EventModel.findByIdAndDelete(eventId);

        if (event.isShared) {
            await PermissionModel.deleteMany({ eventId: event._id });
        }

        res.status(200).json({ 
            message: 'Event deleted successfully',
            deletedEventId: eventId 
        });

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
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
      
      const events = await EventModel.find({ 
        calendarId,
        isShared: true
      })
      .populate({
        path: 'sharedFrom',
        select: 'userName email'
      })
      .populate('activities')
      .lean();

      const permissions = await PermissionModel.find({
        userId: req.user.id,
        eventId: { $in: events.map(event => event._id) }
      });

      const eventsWithPermissions = events.map(event => {
        const eventPermission = permissions.find(p => 
          p.eventId.toString() === event._id.toString()
        );
        
        return {
          ...event,
          sharedBy: event.sharedFrom?.userName || event.sharedFrom?.email || 'Unknown',
          sharedPermission: eventPermission?.accessLevel || event.sharedPermission || 'view'
        };
      });

      res.json(eventsWithPermissions);
    } catch (error) {
      console.error('Error fetching shared events:', error);
      res.status(500).json({ error: 'Failed to fetch shared events' });
    }
  },
  updateEvent: async (req, res) => {
    try {
      const { calendarId, eventId } = req.params;
      const updateData = req.body;

      // 1. Find the source event
      const sourceEvent = await EventModel.findById(eventId);
      if (!sourceEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // 2. Find all related events
      let relatedEvents = [];
      const searchId = sourceEvent.isShared ? sourceEvent.sharedFrom : sourceEvent._id;

      relatedEvents = await EventModel.find({
        $or: [
          { _id: searchId },
          { sharedFrom: searchId }
        ]
      });

      // 3. Update each event and its activities
      for (const relatedEvent of relatedEvents) {
        // Update event basic info
        await EventModel.findByIdAndUpdate(
          relatedEvent._id,
          {
            title: updateData.title,
            description: updateData.description
          }
        );

        // Only process activities if they exist in the update data
        if (updateData.activities && updateData.activities.length > 0) {
          const currentActivities = await ActivityModel.find({ eventId: relatedEvent._id });

          for (let i = 0; i < updateData.activities.length; i++) {
            const updatedActivity = updateData.activities[i];
            const currentActivity = currentActivities[i];

            if (currentActivity) {
              await ActivityModel.updateOne(
                { _id: currentActivity._id },
                {
                  title: updatedActivity.title,
                  description: updatedActivity.description,
                  startTime: new Date(updatedActivity.startTime),
                  endTime: new Date(updatedActivity.endTime),
                  location: updatedActivity.location || ''
                }
              );
            }
          }
        }
      }

      // 4. Get updated event data
      const finalEvent = await EventModel.findById(eventId);
      const updatedActivities = await ActivityModel.find({ eventId });

      // 5. Send notifications if needed
      const io = getSocketIO();
      if (io) {
        for (const event of relatedEvents) {
          if (event._id.toString() !== eventId) {
            const calendar = await CalendarModel.findById(event.calendarId);
            if (calendar) {
              const activities = await ActivityModel.find({ eventId: event._id });
              io.to(calendar.userId.toString()).emit('eventUpdated', {
                ...event.toObject(),
                activities
              });
            }
          }
        }
      }

      res.json({
        ...finalEvent.toObject(),
        activities: updatedActivities
      });

    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  },

  addActivities: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { activities } = req.body;

      const event = await EventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const newActivities = await Promise.all(activities.map(activity => 
        ActivityModel.create({
          ...activity,
          eventId,
          startTime: new Date(activity.startTime),
          endTime: new Date(activity.endTime)
        })
      ));

      event.activities = [...event.activities, ...newActivities.map(a => a._id)];
      await event.save();

      res.status(200).json({ activities: newActivities });
    } catch (error) {
      console.error('Error adding activities:', error);
      res.status(500).json({ error: 'Failed to add activities' });
    }
  },

  updateActivity: async (req, res) => {
    try {
      const { activityId } = req.params;
      const updateData = req.body;

      const updatedActivity = await ActivityModel.findByIdAndUpdate(
        activityId,
        updateData,
        { new: true }
      );

      if (!updatedActivity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.status(200).json(updatedActivity);
    } catch (error) {
      console.error('Error updating activity:', error);
      res.status(500).json({ error: 'Failed to update activity' });
    }
  }
};

module.exports = eventController;
