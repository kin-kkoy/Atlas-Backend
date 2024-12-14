const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const UserModel = require('../models/User');
const CalendarModel = require('../models/Calendar');
const EventModel = require('../models/Event');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

let authToken;
let calendarId;
let userId;

describe('Calendar Tests', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost:27017/AtlasDBTest');
        
        // Create test user and get token
        const userResponse = await request(app)
            .post('/register')
            .send({
                name: 'Calendar Test User',
                email: 'calendartest@test.com',
                password: 'password123'
            });
        
        authToken = userResponse.body.token;
        
        // Decode token to get userId
        const decoded = jwt.verify(authToken, JWT_SECRET);
        userId = decoded.userId;

        // Wait a bit to ensure calendar is created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find the calendar
        const calendar = await CalendarModel.findOne({ userId: userId });
        if (!calendar) {
            // If calendar doesn't exist, create one
            const newCalendar = await CalendarModel.create({
                userId: userId,
                title: 'Calendar Test User\'s Calendar',
                description: 'Test Calendar'
            });
            calendarId = newCalendar._id;
        } else {
            calendarId = calendar._id;
        }
    });

    afterAll(async () => {
        await UserModel.deleteMany({});
        await CalendarModel.deleteMany({});
        await EventModel.deleteMany({});
        await mongoose.connection.close();
        server.close();
    });

    describe('Calendar Events', () => {
        it('should add an event to calendar', async () => {
            const currentDate = new Date();
            const response = await request(app)
                .post(`/calendar/${calendarId}/events`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Event',
                    description: 'Test Description',
                    startTime: currentDate,
                    endTime: new Date(currentDate.getTime() + 3600000),
                    location: 'Test Location'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Event created successfully');
        });

        it('should get events by date', async () => {
            const response = await request(app)
                .get(`/calendar/${calendarId}/events`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ date: new Date().toISOString() });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Event Sharing', () => {
        it('should share an event with another user', async () => {
            // First create another user
            await request(app)
                .post('/register')
                .send({
                    name: 'Share Test User',
                    email: 'sharetest@test.com',
                    password: 'password123'
                });

            // Create and share an event
            const response = await request(app)
                .post(`/calendar/${calendarId}/events`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Shared Event',
                    description: 'Test Description',
                    date: new Date(),
                    isShared: true,
                    shareWithEmail: 'sharetest@test.com',
                    sharePermission: 'view'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Event created successfully');
        });
    });
});
