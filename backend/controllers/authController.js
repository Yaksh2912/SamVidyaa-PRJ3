const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, institution, enrollment_number } = req.body;
        let { username } = req.body;

        console.log("Registering user:", { name, email, role }); // Debug log

        // Removed email restriction for general testing
        // if (!email.endsWith('@bmu.edu.in')) {
        //     return res.status(400).json({ message: 'Only @bmu.edu.in emails are allowed' });
        // }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Auto-generate username if not provided
        if (!username) {
            username = email.split('@')[0];
            // Check if this base username exists, if so, append random
            const baseUsernameExists = await User.findOne({ username });
            if (baseUsernameExists) {
                username += Math.floor(1000 + Math.random() * 9000);
            }
        } else {
            const usernameExists = await User.findOne({ username });
            if (usernameExists) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        let assignedRole = role ? role.toUpperCase() : 'STUDENT';

        // Map frontend role names to backend constants
        if (assignedRole === 'TEACHER') assignedRole = 'INSTRUCTOR';

        if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(assignedRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: assignedRole,
            username,
            institution,
            enrollment_number
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
        res.status(400).json({ message: error.message || 'Registration failed' });
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
