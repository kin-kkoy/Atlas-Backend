const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { loginLimiter, verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', loginLimiter, userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
// Protected routes
router.get('/home', verifyToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;