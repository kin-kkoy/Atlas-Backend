const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/AtlasDB');

app.use('/', userRoutes);
app.use('/events', eventRoutes);

app.listen(5000, () => {
    console.log('Server has started!');
});