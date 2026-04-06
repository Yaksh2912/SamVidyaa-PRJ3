const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createUserAccount } = require('../services/userAccountService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, institution, enrollment_number, username } = req.body;

        console.log("Registering public student:", { name, email });

        // Removed email restriction for general testing
        // if (!email.endsWith('@bmu.edu.in')) {
        //     return res.status(400).json({ message: 'Only @bmu.edu.in emails are allowed' });
        // }

        const user = await createUserAccount({
            name,
            email,
            password,
            role: 'STUDENT',
            username,
            institution,
            enrollment_number,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                institution: user.institution,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Registration error:", error);
        res.status(error.statusCode || 400).json({ message: error.message || 'Registration failed' });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { registerUser, authUser };
