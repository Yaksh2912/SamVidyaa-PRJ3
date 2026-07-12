const path = require('path');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const { pathExists, normalizeRelativePath, resolveWithinUploads } = require('../utils/fileSystem');

const ALLOWED_STUDENT_FILE_STATUSES = ['ACTIVE', 'APPROVED'];

const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';
const isStudentRole = (role) => role === 'STUDENT' || role === 'student';

async function canAccessCourseFile(course, user) {
    if (!course || !user) return false;
    if (isAdminRole(user.role)) return true;

    const instructorId = course.instructor?.toString?.();
    if (instructorId && instructorId === user._id.toString()) {
        return true;
    }

    if (!isStudentRole(user.role)) {
        return false;
    }

    const enrollment = await Enrollment.findOne({
        course_id: course._id,
        student_id: user._id,
        status: { $in: ALLOWED_STUDENT_FILE_STATUSES },
    }).select('_id').lean();

    return Boolean(enrollment);
}

async function canAccessModuleFile(module, user) {
    if (!module || !user) return false;
    if (isAdminRole(user.role)) return true;

    if (module.createdBy?.toString?.() === user._id.toString()) {
        return true;
    }

    const instructorId = module.course_id?.instructor?.toString?.();
    if (instructorId && instructorId === user._id.toString()) {
        return true;
    }

    if (!isStudentRole(user.role)) {
        return false;
    }

    const enrollment = await Enrollment.findOne({
        course_id: module.course_id?._id,
        student_id: user._id,
        status: { $in: ALLOWED_STUDENT_FILE_STATUSES },
    }).select('_id').lean();

    return Boolean(enrollment);
}

async function getProtectedFile(req, res, next) {
    try {
        const rawPath = req.query.path;
        if (!rawPath) {
            return res.status(400).json({ message: 'File path is required' });
        }

        const { relativePath, absolutePath, isWithinUploads } = resolveWithinUploads(rawPath);
        if (!isWithinUploads) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        if (!(await pathExists(absolutePath))) {
            return res.status(404).json({ message: 'File not found' });
        }

        let resolvedName = path.basename(relativePath);
        let disposition = req.query.download === '1' ? 'attachment' : 'inline';

        const course = await Course.findOne({ handout_path: relativePath }).select('_id instructor handout_filename');
        if (course) {
            const allowed = await canAccessCourseFile(course, req.user);
            if (!allowed) {
                return res.status(403).json({ message: 'Not authorized to access this file' });
            }

            resolvedName = course.handout_filename || resolvedName;
        } else {
            const module = await Module.findOne({ 'files.path': relativePath })
                .populate('course_id', 'instructor')
                .select('_id createdBy files course_id');

            if (!module) {
                return res.status(404).json({ message: 'File metadata not found' });
            }

            const allowed = await canAccessModuleFile(module, req.user);
            if (!allowed) {
                return res.status(403).json({ message: 'Not authorized to access this file' });
            }

            const fileEntry = module.files?.find((file) => normalizeRelativePath(file.path) === relativePath);
            resolvedName = fileEntry?.name || resolvedName;
            disposition = 'attachment';
        }

        res.setHeader('Content-Disposition', `${disposition}; filename="${resolvedName.replace(/"/g, '')}"`);
        return res.sendFile(absolutePath);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProtectedFile,
};
