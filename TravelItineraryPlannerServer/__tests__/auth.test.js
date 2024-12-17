const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const UserModel = require('../models/User');

const GOOD_INPUT = {
    name: 'Test User',
    email: `test${Math.random().toString(36).substring(7)}@test.com`,
    password: '12345678'
};

let GOOD_INPUT_TOKEN = '';

describe('Authentication Tests', () => {
    beforeAll(async () => {
        // Connect to a test database
        await mongoose.connect('mongodb://localhost:27017/AtlasDBTest');
        // Clear the test database
        await UserModel.deleteMany({});
    });

    afterAll(async () => {
        // Clean up the test database
        await UserModel.deleteMany({});
        await mongoose.connection.close();
        server.close();
    });

    describe('Register', () => {
        it('should create new accounts successfully & respond with an auth token', async () => {
            const response = await request(app)
                .post('/register')
                .send(GOOD_INPUT);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
            
            GOOD_INPUT_TOKEN = response.body.token;
        });

        it('should not allow registration with existing email', async () => {
            const response = await request(app)
                .post('/register')
                .send(GOOD_INPUT);

            expect(response.status).toBe(500);
        });
    });

    describe('Login', () => {
        it('should authenticate successfully and respond with an auth token', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: GOOD_INPUT.email,
                    password: GOOD_INPUT.password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
        });

        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: GOOD_INPUT.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Protected Routes', () => {
        it('should allow access to protected routes with valid token', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${GOOD_INPUT_TOKEN}`);

            expect(response.status).toBe(200);
        });

        it('should deny access to protected routes without token', async () => {
            const response = await request(app)
                .get('/api/user/profile');

            expect(response.status).toBe(401);
        });
    });
});
