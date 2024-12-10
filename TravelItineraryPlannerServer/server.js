const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {Server} = require('socket.io');
const http = require('http');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})
app.use(express.json());
app.use(cors());

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinCalendar', (calendarId) => {
        socket.join(calendarId);
        console.log(`Socket ${socket.id} joined calendar ${calendarId}`);
    });

    socket.on('leaveCalendar', (calendarId) => {
        socket.leave(calendarId);
        console.log(`Socket ${socket.id} left calendar ${calendarId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.set('io', io);

mongoose.connect('mongodb://localhost:27017/AtlasDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Add test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

app.use('/', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/calendar', verifyToken, calendarRoutes);
app.use('/api/notifications', notificationRoutes);
// Store server instance
server.listen(5000, () => {
    console.log('Server has started!');
});

// Increase event listener limit if needed
require('events').EventEmitter.defaultMaxListeners = 15;

const gracefulShutdown = () => {
    console.log('Received shutdown signal. Closing server...');
    server.close(() => {
        console.log('Server closed. Disconnecting from MongoDB...');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed. Exiting process...');
            process.exit(0);
        });
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle different shutdown signals
process.once('SIGTERM', gracefulShutdown);
process.once('SIGINT', gracefulShutdown);