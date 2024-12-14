const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const EventModel = require('../models/Event');
const UserModel = require('../models/User');

let authToken;
let eventId;

describe('Event Tests', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost:27017/AtlasDBTest');
        
        // Create test user and get token
        const response = await request(app)
            .post('/register')
            .send({
                name: 'Event Test User',
                email: 'eventtest@test.com',
                password: 'password123'
            });
        
        authToken = response.body.token;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    describe('Event CRUD Operations', () => {
        it('should create an event with activities', async () => {
            // Test event creation
        });

        it('should update an existing event', async () => {
            // Test event update
        });

        it('should delete an event', async () => {
            // Test event deletion
        });
    });

    describe('Event Activities', () => {
        it('should add activities to an event', async () => {
            // Test adding activities
        });

        it('should update activity details', async () => {
            // Test updating activities
        });
    });
});
