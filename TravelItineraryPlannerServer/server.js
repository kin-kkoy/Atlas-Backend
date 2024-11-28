const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

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

// Store server instance
const server = app.listen(5000, () => {
    console.log('Server has started!');
});

// Increase event listener limit if needed
require('events').EventEmitter.defaultMaxListeners = 15;

// Graceful shutdown handler
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