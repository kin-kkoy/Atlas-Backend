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

app.listen(5000, () => {
    console.log('Server has started!');
});

process.on('SIGTERM', () => {
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});
