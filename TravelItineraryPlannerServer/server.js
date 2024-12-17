const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
const notificationRoutes = require('./routes/notificationRoutes');
const socketUtil = require('./utils/socket');
const http = require('http');

const app = express();
const server = http.createServer(app);

const io = socketUtil.init(server);

app.use(express.json());
app.use(cors());

const connectDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') { // Orig DB if not running tests
    connectDB('mongodb://localhost:27017/AtlasDB');
}
// Route for .test
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

app.use('/', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/calendar', verifyToken, calendarRoutes);
app.use('/api/notifications', notificationRoutes);

let serverInstance;

if (process.env.NODE_ENV !== 'test') {
    serverInstance = server.listen(5000, () => {
        console.log('Server has started!');
    });
}

const closeServer = () => {
    return new Promise((resolve) => {
        if (serverInstance) {
            serverInstance.close(() => {
                resolve();
            });
        } else {
            resolve();
        }
    });
};

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

process.once('SIGTERM', gracefulShutdown);
process.once('SIGINT', gracefulShutdown);

// Testing purposes: export additional items
module.exports = { 
    app,
    server,
    connectDB,
    closeServer
};