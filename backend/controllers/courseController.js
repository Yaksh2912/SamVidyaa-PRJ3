const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
const createCourse = async (req, res) => {
    try {
        const { course_code, course_name, description, subject, course_test_questions } = req.body;

        const courseExists = await Course.findOne({ course_code });

        if (courseExists) {
            res.status(400).json({ message: 'Course code already exists' });
            return;
        }

        const course = await Course.create({
            course_code,
            course_name,
            description,
            subject,
            instructor: req.user._id, // Assign logged-in user as instructor
            course_test_questions,
        });

        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create course' });
    }
};

// @desc    Get all courses (or instructor's courses)
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
    try {
        let query = {};

        // If user is an instructor, only show their courses? 
        // Or if they are student show enrolled? 
        // For now, let's allow fetching all active courses for students, and all created for instructors.
        if (req.user.role === 'INSTRUCTOR') {
            query = { instructor: req.user._id };
        } else if (req.user.role === 'STUDENT') {
            query = { is_active: true };
        }

        const courses = await Course.find(query).populate('instructor', 'name email');
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to fetch courses' });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name email');

        if (course) {
            res.json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to fetch course' });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await course.deleteOne();
        res.json({ message: 'Course removed' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to delete course' });
    }
};

// @desc    Get teacher dashboard stats
// @route   GET /api/courses/stats
// @access  Private (Instructor)
const getTeacherStats = async (req, res) => {
    try {
        // 1. Get all courses by this instructor
        const courses = await Course.find({ instructor: req.user._id });
        const courseIds = courses.map(c => c._id);

        // 2. Count active classes
        const activeClasses = courses.length;

        // 3. Count total unique students enrolled in these courses
        const distinctStudents = await Enrollment.distinct('student_id', {
            course_id: { $in: courseIds }
        });
        const totalStudents = distinctStudents.length;

        // 4. Return stats
        res.json({
            activeClasses,
            totalStudents,
            // Mocking these for now as we don't have full grading/performance logic yet
            pendingGrading: 0,
            avgPerformance: '0%'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

const Module = require('../models/Module');
const Task = require('../models/Task');
const archive = require('archiver');



// @desc    Export course as JSON
// @route   GET /api/courses/:id/export
// @access  Private (Instructor/Admin)
const exportCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log(`Exporting course JSON: ${course.course_name}`);

        // 1. Fetch all modules
        const modules = await Module.find({ course_id: course._id }).sort({ module_order: 1 });

        const modulesData = [];

        // 2. Loop through modules and fetch tasks
        for (const module of modules) {
            // Fetch tasks
            const tasks = await Task.find({ module_id: module._id });

            const moduleObj = {
                module_name: module.module_name,
                description: module.description,
                module_order: module.module_order,
                tasks_per_module: module.tasks_per_module,
                module_test_questions: module.module_test_questions,
                tasks: tasks.map(t => ({
                    task_name: t.task_name,
                    problem_statement: t.problem_statement,
                    constraints: t.constraints,
                    test_cases: t.test_cases,
                    language: t.language,
                    time_limit: t.time_limit,
                    points: t.points,
                    difficulty: t.difficulty
                })),
                files: module.files ? module.files.map(f => ({
                    name: f.name,
                    mimetype: f.mimetype,
                    size: f.size
                    // Note: We are NOT exporting the actual file content, just metadata
                })) : []
            };

            modulesData.push(moduleObj);
        }

        // 3. Construct final JSON
        const courseData = {
            course_name: course.course_name,
            course_code: course.course_code,
            description: course.description,
            subject: course.subject,
            course_test_questions: course.course_test_questions,
            modules: modulesData
        };

        // 4. Create ZIP and append JSON
        const archiveZip = archive('zip', {
            zlib: { level: 9 }
        });

        const zipFileName = `${course.course_name.replace(/ /g, '_')}_COMPLETE.zip`;
        const jsonFileName = `${course.course_name.replace(/ /g, '_')}.json`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);

        archiveZip.pipe(res);

        archiveZip.append(JSON.stringify(courseData, null, 2), { name: jsonFileName });

        await archiveZip.finalize();

    } catch (error) {
        console.error('Course export error:', error);
        res.status(500).json({ message: 'Course export failed' });
    }
};

module.exports = { createCourse, getCourses, getCourseById, deleteCourse, getTeacherStats, exportCourse };
