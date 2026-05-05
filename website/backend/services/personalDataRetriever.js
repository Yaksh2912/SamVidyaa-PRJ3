const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const PointTransaction = require('../models/PointTransaction');
const Module = require('../models/Module');
const Task = require('../models/Task');

/**
 * PRIVACY LAYER: Every query in this file is ALWAYS filtered by student_id.
 * The student_id comes from the JWT token (set by authMiddleware), NOT from user input.
 * This ensures Student A can never access Student B's data.
 */

/**
 * Retrieve comprehensive context about a specific student.
 * This data is injected into the LLM prompt so the chatbot can
 * answer personal questions (grades, progress, points, etc.)
 *
 * @param {string} studentId - MongoDB ObjectId from JWT (req.user._id)
 * @returns {object} Structured student context
 */
async function getStudentContext(studentId) {
    const [user, enrollments, progress, recentPoints] = await Promise.all([
        // Student profile
        User.findById(studentId).select('name email points enrollment_number institution'),

        // Active enrollments with course details
        Enrollment.find({ student_id: studentId, status: 'ACTIVE' })
            .populate('course_id', 'course_name course_code subject description points'),

        // Module-level progress across all courses
        StudentProgress.find({ student_id: studentId })
            .populate('course_id', 'course_name course_code')
            .populate('module_id', 'module_name module_order'),

        // Recent point activity (last 15 transactions)
        PointTransaction.find({ user_id: studentId })
            .sort({ createdAt: -1 })
            .limit(15)
            .populate('course_id', 'course_name'),
    ]);

    if (!user) {
        return { error: 'Student not found' };
    }

    // Get upcoming/pending tasks for enrolled courses
    const enrolledCourseIds = enrollments.map(e => e.course_id?._id).filter(Boolean);
    const modules = await Module.find({ course_id: { $in: enrolledCourseIds }, is_active: true })
        .select('_id module_name course_id');

    const moduleIds = modules.map(m => m._id);
    const tasks = await Task.find({ module_id: { $in: moduleIds } })
        .select('task_name difficulty points time_limit language module_id')
        .populate('module_id', 'module_name course_id');

    // Build a clean, structured context object
    const context = {
        student_name: user.name,
        student_email: user.email,
        enrollment_number: user.enrollment_number || 'N/A',
        institution: user.institution || 'N/A',
        total_points: user.points || 0,

        enrolled_courses: enrollments.map(e => ({
            course_name: e.course_id?.course_name,
            course_code: e.course_id?.course_code,
            subject: e.course_id?.subject,
            description: e.course_id?.description,
            course_points: e.course_id?.points,
            enrollment_date: e.enrollment_date,
            status: e.status,
        })),

        module_progress: progress.map(p => ({
            course: p.course_id?.course_name || 'Unknown Course',
            course_code: p.course_id?.course_code,
            module: p.module_id?.module_name || 'Unknown Module',
            module_order: p.module_id?.module_order,
            status: p.module_status,
            completed_tasks: p.completed_tasks,
            total_score: p.total_score,
            module_test_completed: p.module_test_completed,
            course_test_completed: p.course_test_completed,
            can_attempt_module_test: p.can_attempt_module_test,
        })),

        available_tasks: tasks.map(t => ({
            task_name: t.task_name,
            difficulty: t.difficulty,
            points: t.points,
            time_limit: t.time_limit,
            language: t.language,
            module: t.module_id?.module_name,
        })),

        recent_point_activity: recentPoints.map(p => ({
            amount: p.amount,
            reason: p.reason,
            course: p.course_id?.course_name || 'General',
            date: p.createdAt,
        })),
    };

    return context;
}

/**
 * Get a quick summary string for the student (used as a fast-path
 * when the LLM only needs a brief overview, not full context).
 */
async function getStudentSummary(studentId) {
    const user = await User.findById(studentId).select('name points');
    const enrollmentCount = await Enrollment.countDocuments({
        student_id: studentId,
        status: 'ACTIVE',
    });
    const progressRecords = await StudentProgress.find({ student_id: studentId });

    const totalTasks = progressRecords.reduce((sum, p) => sum + p.completed_tasks, 0);
    const totalScore = progressRecords.reduce((sum, p) => sum + p.total_score, 0);

    return `Student: ${user?.name || 'Unknown'} | Points: ${user?.points || 0} | Enrolled Courses: ${enrollmentCount} | Tasks Completed: ${totalTasks} | Total Score: ${totalScore}`;
}

module.exports = { getStudentContext, getStudentSummary };
