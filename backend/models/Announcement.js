const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        audience_type: {
            type: String,
            enum: ['GLOBAL', 'COURSE'],
            default: 'COURSE',
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        expires_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

announcementSchema.index({ audience_type: 1, course_id: 1, createdAt: -1 });
announcementSchema.index({ created_by: 1, createdAt: -1 });
announcementSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Announcement', announcementSchema);
