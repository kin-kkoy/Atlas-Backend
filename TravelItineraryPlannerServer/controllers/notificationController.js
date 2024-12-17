const NotificationModel = require('../models/Notification');
const UserModel = require('../models/User');

const notificationController = {
    createNotification: async (req, res) => {
        try {
            const { recipientEmail, type, content, eventData } = req.body;
            
            const recipient = await UserModel.findOne({ email: recipientEmail });
            if (!recipient) {
                return res.status(404).json({ error: 'Recipient not found' });
            }

            const notification = new NotificationModel({
                recipientId: recipient._id,
                type,
                content,
                eventData
            });

            await notification.save();
            res.status(201).json({ message: 'Notification created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create notification' });
        }
    },

    getAllNotifications: async (req, res) => {
        try {
            const notifications = await NotificationModel.find({ 
                recipientId: req.user.id 
            })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(10); // Limit to last 10 notifications

            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const notification = await NotificationModel.findByIdAndUpdate(
                req.params.notificationId,
                { isRead: true },
                { new: true }
            );
            res.json(notification);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update notification' });
        }
    },

    getUnreadCount: async (req, res) => {
        try {
            const count = await NotificationModel.countDocuments({
                recipientId: req.user.id,
                isRead: false
            });
            res.json({ count });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get unread count' });
        }
    }
};

module.exports = notificationController;
