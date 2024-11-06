const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/Employee');

app.use('/', employeeRoutes);

app.listen(5000, () => {
    console.log('Server has started!');
});