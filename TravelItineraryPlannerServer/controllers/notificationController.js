const NotificationModel = require('../models/Notification');
const UserModel = require('../models/User');

const notificationController = {
    createNotification: async (req, res) => {
        try {
            const { recipientEmail, type, content, eventData } = req.body;
            
            // Find recipient user
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

    getNotifications: async (req, res) => {
        try {
            const notifications = await NotificationModel.find({
                recipientId: req.user.id,
                isRead: false
            }).sort({ createdAt: -1 });

            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            await NotificationModel.findByIdAndUpdate(notificationId, {
                isRead: true
            });
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update notification' });
        }
    }
};

module.exports = notificationController;
