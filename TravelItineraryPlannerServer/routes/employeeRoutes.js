const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { loginLimiter, verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', employeeController.register);
router.post('/login', loginLimiter, employeeController.login);
router.post('/forgot-password', employeeController.forgotPassword);
router.post('/reset-password', employeeController.resetPassword);
// Protected routes
router.get('/home', verifyToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;