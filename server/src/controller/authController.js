const { response } = require('express');
const bcrypt = require('bcryptjs'); //for hashing passwords
const express = require('express'); //for creating express application
const { OAuth2Client } = require('google-auth-library'); //for Google OAuth2 authentication

const jwt = require('jsonwebtoken');
const Users = require('../model/Users');
const { validationResult } = require('express-validator');
const { send } = require('../service/emailService');
const secret = process.env.JWT_SECRET; //secret key for signing JWT
const refreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const authController = {
    login: async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(401).json({ errors: errors.array() });
        }

        try {
            const { username, password } = request.body;
            const data = await Users.findOne({ email: username });
            if (!data) {
                return response.status(401).json({ message: "Invalid credentials" });
            }
            const isMatch = await bcrypt.compare(password, data.password);
            if (!isMatch) {
                return response.status(401).json({ message: "Invalid credentials" });
            }
            // if (username === 'admin' && password === '1234') {
            //     const userDetails = {
            //         name: 'shekhar',
            //         email: 'shekhar@example.com'
            //     };
            const userDetails = {
                id: data._id,
                name: data.name,
                email: data.email,
                role: data.role ? data.role : 'admin',
                adminId: data.adminId,
                credits: data.credits
            };
            const token = jwt.sign(userDetails, secret, { expiresIn: '1h' });
            const refreshToken = jwt.sign(userDetails, refreshSecret, { expiresIn: '7d' });

            response.cookie('jwttoken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });
            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });
            response.json({ message: "User authenticated", userDetails: userDetails });
        }


        catch (error) {
            console.log(error);
            // Handle any errors that occur during the login process
            response.status(500).json({ error: 'Internal server error' });
        }
    },
    logout: (request, response) => {
        response.clearCookie('jwttoken');
        response.clearCookie('refreshToken');
        response.json({ message: 'User logged out successfully' });
    },
    isUserLoggedIn: async (request, response) => {
        const token = request.cookies.jwttoken;
        if (!token) {
            return response.status(401).json({ message: 'Unauthorized access' });
        }
        jwt.verify(token, secret, async (error, userDetails) => {
            if (error) {
                return response.status(401).json({ message: 'Unauthorized access' });
            }
            else {
                const data = await Users.findById({
                    _id: userDetails.id
                });
                return response.json({ userDetails: userDetails });
            }
        });
    },
    register: async (request, response) => {
        try {
            const { name, username, password } = request.body;
            const data = await Users.findOne({ email: username });
            if (data) {
                return response.status(401).json({ message: 'User already exists' });
            }
            const encryptedPassword = await bcrypt.hash(password, 10);
            const user = new Users({
                email: username,
                password: encryptedPassword,
                name: name,
                role: 'admin'
            });
            await user.save();
            const userDetails = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'admin',
                credits: data.credits
            };
            const token = jwt.sign(userDetails, secret, { expiresIn: '1h' });
            const refreshToken = jwt.sign(userDetails, refreshSecret, { expiresIn: '7d' });

            response.cookie('jwttoken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/'
            });
            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });

            response.json({ message: 'User authenticated', userDetails: userDetails });
        }
        catch (error) {
            console.log(error);
            return response.status(500).json({ error: 'Internal server error' });
        }
    },
    googleAuth: async (request, response) => {
        const { idToken } = request.body;
        if (!idToken) {
            return response.status(400).json({ message: 'Invalid request' });
        }
        try {
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const googleResponse = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
            });

            const payload = googleResponse.getPayload();
            const { sub: googleId, email, name } = payload;
            // Check if user already exists in the database
            let data = await Users.findOne({ email: email });
            if (!data) {
                data = new Users({
                    email: email,
                    name: name,
                    isGoogleUser: true,
                    googleId: googleId,
                    role: 'admin'
                });
                await data.save();
            }
            const user = {
                id: data._id ? data._id : googleId, // Use _id if available, otherwise use googleId
                username: email,
                name: name,
                role: data.role ? data.role : 'admin',
                credits: data.credits

            };
            const token = jwt.sign(user, secret, { expiresIn: '1h' });
            const refreshToken = jwt.sign(user, refreshSecret, { expiresIn: '7d' });

            response.cookie('jwttoken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });
            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });
            response.json({ message: 'User authenticated', userDetails: user });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },
    refreshToken: async (request, response) => {
        try {
            const refreshToken = request.cookies?.refreshToken;
            if (!refreshToken) {
                return response.status(401).json({ message: "No refresh token" });
            }
            const decoded = jwt.verify(refreshToken, refreshSecret);
            const data = await Users.findById({ _id: decoded.id });
            const user = {
                id: data._id,
                username: data.email,
                name: data.name,
                role: data.role ? data.role : 'admin',
                credits: data.credits,
                subscription: data.subscription
            };


            const newAccessToken = jwt.sign(user, secret, { expiresIn: '1h' });
            response.cookie('jwttoken', newAccessToken, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/',
            });
            response.json({ message: "Token refreshed", userDetails: user });
        }
        catch (error) {
            console.log(error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },
    sendResetPasswordToken: async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }

        try {
            const { email } = request.body;
            
            // Check if user exists
            const user = await Users.findOne({ email: email });
            if (!user) {
                return response.status(404).json({ message: "User not found with this email" });
            }

            // Generate 6-digit code
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Set expiry time (15 minutes from now)
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 15);

            // Save code and expiry to database
            user.resetPasswordCode = resetCode;
            user.resetPasswordExpiry = expiryTime;
            await user.save();

            // Send email with reset code
            const emailSubject = "Password Reset Code";
            const emailBody = `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this reset, please ignore this email.`;
            
            await send(email, emailSubject, emailBody);

            response.json({ message: "Reset code sent to your email" });
        } catch (error) {
            console.log(error);
            response.status(500).json({ error: 'Internal server error' });
        }
    },
    resetPassword: async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, code, newPassword } = request.body;
            
            // Find user by email
            const user = await Users.findOne({ email: email });
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }

            // Check if code exists and is valid
            if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
                return response.status(400).json({ message: "Invalid reset code" });
            }

            // Check if code has expired
            if (new Date() > user.resetPasswordExpiry) {
                return response.status(400).json({ message: "Reset code has expired" });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password and clear reset fields
            user.password = hashedPassword;
            user.resetPasswordCode = null;
            user.resetPasswordExpiry = null;
            await user.save();

            response.json({ message: "Password reset successfully" });
        } catch (error) {
            console.log(error);
            response.status(500).json({ error: 'Internal server error' });
        }
    },
};
module.exports = authController;