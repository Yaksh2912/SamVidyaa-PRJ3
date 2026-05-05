const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
            default: 'STUDENT',
        },
        institution: {
            type: String,
        },
        enrollment_number: {
            type: String,
        },
        section: {
            type: String,
        },
        analytics_user_id: {
            type: mongoose.Schema.Types.Mixed,
        },
        analytics_source: {
            type: String,
            enum: ['students', 'trusted_users', null],
            default: null,
        },
        analytics_synced_at: {
            type: Date,
        },
        google_id: {
            type: String,
        },
        avatar_url: {
            type: String,
        },
        auth_provider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        last_login: {
            type: Date,
        },
        points: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
