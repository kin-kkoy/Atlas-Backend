const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const UserModel = require('../models/User');
const CalendarModel = require('../models/Calendar');

const userController = {
    register: async (req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            
            const user = await UserModel.create({ 
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword 
            });

            if (!user || !user._id) {
                return res.status(500).json({ error: "User creation failed" });
            }

            // auto create a calendar for the user
            await CalendarModel.create({
                userId: user._id,
                title: `${user.name}'s Calendar`,
                description: `Default calendar for ${user.name}`
            });

            const token = jwt.sign(
                { userId: user._id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.status(201).json({ 
                message: "Registered Successfully",
                token: token,
            });
        } catch(err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: "Registration failed" });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const isPasswordCorrect = await bcrypt.compare(password, user.password);

            if (isPasswordCorrect) {
                const token = jwt.sign(
                    { userId: user._id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                const calendar = await CalendarModel.findOne({ userId: user._id });
                
                if (!calendar) {
                    return res.status(500).json({ error: "User calendar not found" });
                }

                res.json({ 
                    message: "Login successful", 
                    token: token,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        calendarId: calendar._id 
                    }
                });
            } else {
                res.status(401).json({ error: "Password incorrect" });
            }
        } catch(err) {
            res.status(500).json({ error: "Login failed! " + err.message });
        }
    },

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if(!user){
            return res.status(404).json({ error: "User not found" });
        }

        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExpiry = Date.now() + 1000 * 60 * 10; // 10 mins ni
        
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        console.log("Token: " + resetToken);
        res.json({ message: "Reset token sent, please check console" });
    },

    resetPassword: async (req, res) => {
        const { email, resetToken, newPassword } = req.body;
        const user = await UserModel.findOne({ 
            email, resetToken, resetTokenExpiry: { $gt: Date.now() } 
        });

        if(!user){
            return res.status(404).json({ error: "Invalid or expired token" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successful" });
    },

    getUserProfile: async (req, res) => {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ 
                userName: user.userName 
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ error: 'Failed to fetch user profile' });
        }
    }
};

module.exports = userController;