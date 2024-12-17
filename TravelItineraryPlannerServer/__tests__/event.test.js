const request = require('supertest');
const mongoose = require('mongoose');
const { app, closeServer } = require('../server');
const EventModel = require('../models/Event');
const UserModel = require('../models/User');
const CalendarModel = require('../models/Calendar');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

let authToken;
let eventId;
let calendarId;
let userId;

describe('Event Tests', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost:27017/AtlasDBTest');
        
        const response = await request(app)
            .post('/register')
            .send({
                name: 'Event Test User',
                email: 'eventtest@test.com',
                password: 'password123'
            });
        
        authToken = response.body.token;
        const decoded = jwt.verify(authToken, JWT_SECRET);
        userId = decoded.userId;

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const calendar = await CalendarModel.findOne({ userId });
        calendarId = calendar._id;
    });

    afterAll(async () => {
        await UserModel.deleteMany({});
        await CalendarModel.deleteMany({});
        await EventModel.deleteMany({});
        await mongoose.connection.close();
        await closeServer(); 
    });

    describe('Event CRUD Operations', () => {
        it('should create an event with activities', async () => {
            const currentDate = new Date();
            const response = await request(app)
                .post(`/api/events/${calendarId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Event',
                    description: 'Test Description',
                    startTime: currentDate,
                    endTime: new Date(currentDate.getTime() + 3600000),
                    location: 'Test Location',
                    activities: [{
                        title: 'Test Activity',
                        startTime: currentDate,
                        endTime: new Date(currentDate.getTime() + 3600000)
                    }]
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('event');
            eventId = response.body.event._id;
        });

        it('should update an existing event', async () => {
            const response = await request(app)
                .put(`/api/events/${calendarId}/update/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Event',
                    description: 'Updated Description'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title', 'Updated Event');
        });

        it('should delete an event', async () => {
            const createResponse = await request(app)
                .post(`/api/events/${calendarId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Event to Delete',
                    description: 'This event will be deleted',
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 3600000),
                    location: 'Delete Location'
                });

            const eventToDeleteId = createResponse.body.event._id;

            const deleteResponse = await request(app)
                .delete(`/api/events/${calendarId}/events/${eventToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.message).toBe('Event deleted successfully');
            expect(deleteResponse.body.deletedEventId).toBe(eventToDeleteId);

            const verifyResponse = await request(app)
                .get(`/api/events/${calendarId}/events/${eventToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(verifyResponse.status).toBe(404);
        });
    });

    describe('Event Activities', () => {
        let testEventId;
        let testActivityId;

        beforeEach(async () => {
            const response = await request(app)
                .post(`/api/events/${calendarId}/add`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Activity Test Event',
                    description: 'Test Description',
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 3600000),
                    location: 'Test Location'
                });

            if (!response.body || !response.body.event) {
                throw new Error('Failed to create test event');
            }
            testEventId = response.body.event._id;

            const activityResponse = await request(app)
                .post(`/api/events/${calendarId}/events/${testEventId}/activities`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    activities: [{
                        title: 'Initial Activity',
                        description: 'Test Activity',
                        location: 'Test Location',
                        startTime: new Date(),
                        endTime: new Date(Date.now() + 3600000)
                    }]
                });

            if (activityResponse.body && activityResponse.body.activities) {
                testActivityId = activityResponse.body.activities[0]._id;
            }
        });

        it('should add activities to an event', async () => {
            const response = await request(app)
                .post(`/api/events/${calendarId}/events/${testEventId}/activities`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    activities: [{
                        title: 'New Activity',
                        startTime: new Date(),
                        endTime: new Date(Date.now() + 3600000)
                    }]
                });


            expect(response.status).toBe(200);
            expect(response.body.activities).toHaveLength(1);
        });

        it('should update activity details', async () => {
            const response = await request(app)
                .put(`/api/events/${calendarId}/events/${testEventId}/activities/${testActivityId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Activity',
                    description: 'Updated Activity Description',
                    location: 'Updated Location'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title', 'Updated Activity');
        });
    });
});
