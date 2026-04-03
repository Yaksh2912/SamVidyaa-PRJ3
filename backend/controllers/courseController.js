const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---- Multer setup for handout PDFs ----
const handoutStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'handouts');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const handoutUpload = multer({
    storage: handoutStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'));
    }
});

const handoutUploadMiddleware = handoutUpload.single('handout');

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

const clampPercent = (value) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
};

const average = (values) => {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

// @desc    Get detailed analytics for a single course
// @route   GET /api/courses/:id/analytics
// @access  Private (Instructor/Admin)
const getCourseAnalytics = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructor && course.instructor._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const [modules, enrollments, progressRecords] = await Promise.all([
            Module.find({ course_id: course._id })
                .select('module_name module_order')
                .sort({ module_order: 1 }),
            Enrollment.find({ course_id: course._id })
                .populate('student_id', 'name email enrollment_number points last_login createdAt'),
            StudentProgress.find({ course_id: course._id }).lean(),
        ]);

        const moduleIds = modules.map(module => module._id);
        const tasks = moduleIds.length
            ? await Task.find({ module_id: { $in: moduleIds } }).select('module_id').lean()
            : [];

        const tasksPerModule = tasks.reduce((acc, task) => {
            const moduleId = task.module_id.toString();
            acc[moduleId] = (acc[moduleId] || 0) + 1;
            return acc;
        }, {});

        const enrollmentStatusBreakdown = enrollments.reduce((acc, enrollment) => {
            acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
            return acc;
        }, {});

        const activeEnrollments = enrollments.filter((enrollment) => ['ACTIVE', 'COMPLETED'].includes(enrollment.status) && enrollment.student_id);
        const activeStudents = activeEnrollments
            .map((enrollment) => ({
                enrollment,
                student: enrollment.student_id,
            }))
            .filter(({ student }) => student);

        const progressByStudent = new Map();
        const progressByModule = new Map();

        for (const record of progressRecords) {
            const studentId = record.student_id?.toString();
            const moduleId = record.module_id?.toString();

            if (studentId) {
                if (!progressByStudent.has(studentId)) progressByStudent.set(studentId, []);
                progressByStudent.get(studentId).push(record);
            }

            if (moduleId) {
                if (!progressByModule.has(moduleId)) progressByModule.set(moduleId, []);
                progressByModule.get(moduleId).push(record);
            }
        }

        const totalTasks = tasks.length;
        const totalModules = modules.length;

        const studentAnalytics = activeStudents.map(({ enrollment, student }) => {
            const studentId = student._id.toString();
            const records = progressByStudent.get(studentId) || [];
            const completedTasks = records.reduce((sum, record) => sum + (record.completed_tasks || 0), 0);
            const moduleCompletionCount = records.filter((record) => record.module_status === 'MODULE_COMPLETED' || record.module_test_completed).length;
            const averageScore = average(records.map((record) => record.total_score || 0));
            const completionRate = totalTasks ? clampPercent((completedTasks / totalTasks) * 100) : 0;
            const moduleCompletionRate = totalModules ? clampPercent((moduleCompletionCount / totalModules) * 100) : 0;
            const engagementScore = clampPercent((completionRate * 0.55) + (moduleCompletionRate * 0.25) + (Math.min(averageScore, 100) * 0.2));

            let progressBand = 'not_started';
            if (enrollment.status === 'COMPLETED' || moduleCompletionRate >= 100) {
                progressBand = 'completed';
            } else if (records.length === 0) {
                progressBand = 'not_started';
            } else if (completionRate >= 70 || moduleCompletionRate >= 60) {
                progressBand = 'on_track';
            } else if (completionRate >= 30 || moduleCompletionRate >= 25) {
                progressBand = 'steady';
            } else {
                progressBand = 'needs_support';
            }

            const latestProgressUpdate = records
                .map((record) => new Date(record.updatedAt).getTime())
                .filter(Boolean)
                .sort((a, b) => b - a)[0];

            return {
                studentId,
                name: student.name,
                email: student.email,
                enrollmentNumber: student.enrollment_number,
                globalPoints: student.points || 0,
                enrollmentStatus: enrollment.status,
                completedTasks,
                completionRate,
                moduleCompletionCount,
                moduleCompletionRate,
                averageScore,
                engagementScore,
                progressBand,
                lastActivityAt: latestProgressUpdate ? new Date(latestProgressUpdate).toISOString() : enrollment.updatedAt?.toISOString?.() || enrollment.createdAt?.toISOString?.() || null,
                lastLoginAt: student.last_login || null,
            };
        }).sort((a, b) => {
            if (b.engagementScore !== a.engagementScore) return b.engagementScore - a.engagementScore;
            if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
            if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
            return b.globalPoints - a.globalPoints;
        });

        const moduleAnalytics = modules.map((module) => {
            const moduleId = module._id.toString();
            const records = progressByModule.get(moduleId) || [];
            const taskCount = tasksPerModule[moduleId] || 0;

            const studentsStarted = records.filter((record) =>
                (record.completed_tasks || 0) > 0 ||
                record.module_status !== 'NOT_STARTED' ||
                record.module_test_completed
            ).length;

            const studentsCompleted = records.filter((record) =>
                record.module_status === 'MODULE_COMPLETED' ||
                record.module_test_completed
            ).length;

            const avgTaskCompletion = taskCount
                ? average(records.map((record) => clampPercent(((record.completed_tasks || 0) / taskCount) * 100)))
                : 0;

            return {
                moduleId,
                moduleName: module.module_name,
                moduleOrder: module.module_order,
                taskCount,
                studentsStarted,
                studentsCompleted,
                startedRate: activeStudents.length ? clampPercent((studentsStarted / activeStudents.length) * 100) : 0,
                completedRate: activeStudents.length ? clampPercent((studentsCompleted / activeStudents.length) * 100) : 0,
                averageScore: average(records.map((record) => record.total_score || 0)),
                averageTaskCompletion: avgTaskCompletion,
            };
        });

        const progressBandBreakdown = studentAnalytics.reduce((acc, student) => {
            acc[student.progressBand] = (acc[student.progressBand] || 0) + 1;
            return acc;
        }, { completed: 0, on_track: 0, steady: 0, needs_support: 0, not_started: 0 });

        const attentionNeeded = [...studentAnalytics]
            .filter((student) => ['needs_support', 'not_started'].includes(student.progressBand))
            .sort((a, b) => a.engagementScore - b.engagementScore)
            .slice(0, 5);

        const topPerformers = studentAnalytics.slice(0, 5);
        const bottleneckModule = [...moduleAnalytics]
            .filter((module) => module.taskCount > 0)
            .sort((a, b) => a.completedRate - b.completedRate)[0] || null;

        res.json({
            course: {
                _id: course._id,
                course_name: course.course_name,
                course_code: course.course_code,
                subject: course.subject,
            },
            overview: {
                totalStudents: enrollments.length,
                activeStudents: activeStudents.length,
                pendingStudents: enrollmentStatusBreakdown.PENDING || 0,
                rejectedStudents: enrollmentStatusBreakdown.REJECTED || 0,
                completedEnrollments: enrollmentStatusBreakdown.COMPLETED || 0,
                totalModules,
                totalTasks,
                avgCompletionRate: average(studentAnalytics.map((student) => student.completionRate)),
                avgScore: average(studentAnalytics.map((student) => student.averageScore)),
                studentsNeedingSupport: (progressBandBreakdown.needs_support || 0) + (progressBandBreakdown.not_started || 0),
                topPerformer: topPerformers[0] || null,
                bottleneckModule,
                dataMode: progressRecords.length ? 'progress' : 'enrollment_only',
            },
            distributions: {
                enrollmentStatus: enrollmentStatusBreakdown,
                progressBand: progressBandBreakdown,
            },
            topPerformers,
            attentionNeeded,
            moduleAnalytics,
            studentAnalytics,
        });
    } catch (error) {
        console.error('Course analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch course analytics' });
    }
};

const Module = require('../models/Module');
const Task = require('../models/Task');
const archive = require('archiver');



const CodingQuestion = require('../models/CodingQuestion');

// @desc    Export course as JSON
// @route   GET /api/courses/:id/export
// @access  Private (Instructor/Admin)
const exportCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership
        if (course.instructor._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log(`Exporting course JSON: ${course.course_name}`);

        // 1. Fetch all modules
        const modules = await Module.find({ course_id: course._id }).sort({ module_order: 1 });

        const modulesData = [];

        // 2. Fetch Course Test Questions
        const courseTestQs = await CodingQuestion.find({ course_id: course._id, question_type: 'COURSE_TEST' });
        const mappedCourseTestQs = courseTestQs.map(q => ({
            questionType: q.question_type,
            questionText: q.question_text,
            problemStatement: q.problem_statement,
            expectedOutput: q.expected_output,
            sampleInput: q.sample_input,
            sampleOutput: q.sample_output,
            difficulty: q.difficulty,
            points: q.points,
            timeLimit: q.time_limit,
            language: q.language,
            testCases: q.test_cases ? q.test_cases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expected_output,
                isSample: tc.is_sample,
                orderIndex: tc.order_index
            })) : []
        }));

        // 3. Loop through modules and fetch tasks & test questions
        for (const module of modules) {
            const tasks = await Task.find({ module_id: module._id });
            const moduleTestQs = await CodingQuestion.find({ module_id: module._id, question_type: 'MODULE_TEST' });

            const mappedTasks = tasks.map(t => ({
                taskName: t.task_name,
                description: t.description,
                problemStatement: t.problem_statement,
                expectedOutput: t.expected_output,
                sampleInput: t.sample_input,
                sampleOutput: t.sample_output,
                difficulty: t.difficulty,
                points: t.points,
                timeLimit: t.time_limit,
                language: t.language,
                testCases: t.test_cases ? t.test_cases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expected_output,
                    isSample: tc.is_sample,
                    orderIndex: tc.order_index
                })) : []
            }));

            const mappedModuleTestQs = moduleTestQs.map(q => ({
                questionType: q.question_type,
                questionText: q.question_text,
                problemStatement: q.problem_statement,
                expectedOutput: q.expected_output,
                sampleInput: q.sample_input,
                sampleOutput: q.sample_output,
                difficulty: q.difficulty,
                points: q.points,
                timeLimit: q.time_limit,
                language: q.language,
                testCases: q.test_cases ? q.test_cases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expected_output,
                    isSample: tc.is_sample,
                    orderIndex: tc.order_index
                })) : []
            }));

            const moduleObj = {
                moduleName: module.module_name,
                description: module.description,
                moduleOrder: module.module_order,
                tasksPerModule: module.tasks_per_module,
                moduleTestQuestionsCount: module.module_test_questions,
                isActive: module.is_active !== undefined ? module.is_active : true,
                tasks: mappedTasks,
                moduleTestQuestions: mappedModuleTestQs
            };

            modulesData.push(moduleObj);
        }

        // 4. Construct final JSON
        const exportData = {
            exportType: "COURSE",
            exportVersion: "1.0",
            exportDate: new Date().toISOString(),
            course: {
                courseCode: course.course_code,
                courseName: course.course_name,
                description: course.description,
                subject: course.subject,
                instructorName: course.instructor ? course.instructor.name : 'Unknown',
                courseTestQuestionsCount: course.course_test_questions,
                isActive: course.is_active !== undefined ? course.is_active : true,
                modules: modulesData,
                courseTestQuestions: mappedCourseTestQs
            }
        };

        // 5. Create ZIP and append JSON
        const archiveZip = archive('zip', {
            zlib: { level: 9 }
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFileName = `course_export_${course.course_code}_${timestamp}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

        archiveZip.pipe(res);

        archiveZip.append(JSON.stringify(exportData, null, 2), { name: 'course_data.json' });

        const readmeContent = `Course Export Metadata
----------------------
Course Code: ${course.course_code}
Course Name: ${course.course_name}
Export Date: ${exportData.exportDate}
Instructor: ${exportData.course.instructorName}
Modules Count: ${modulesData.length}
`;
        archiveZip.append(readmeContent, { name: 'README.txt' });

        await archiveZip.finalize();

    } catch (error) {
        console.error('Course export error:', error);
        res.status(500).json({ message: 'Course export failed' });
    }
};

// @desc    Upload / replace a handout PDF for a course
// @route   POST /api/courses/:id/handout
// @access  Private (Instructor)
const uploadHandout = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        // Remove old handout file if one exists
        if (course.handout_path) {
            const oldFile = path.join(__dirname, '..', course.handout_path);
            if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }

        // Save relative path (e.g. uploads/handouts/xyz.pdf)
        const relativePath = path.join('uploads', 'handouts', req.file.filename);

        course.handout_filename = req.file.originalname;
        course.handout_path = relativePath;
        await course.save();

        res.json({
            message: 'Handout uploaded',
            handout_filename: course.handout_filename,
            handout_path: course.handout_path,
        });
    } catch (error) {
        console.error('Handout upload error:', error);
        res.status(500).json({ message: 'Failed to upload handout' });
    }
};

// @desc    Delete the handout PDF for a course
// @route   DELETE /api/courses/:id/handout
// @access  Private (Instructor)
const deleteHandout = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (course.handout_path) {
            const filePath = path.join(__dirname, '..', course.handout_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        course.handout_filename = null;
        course.handout_path = null;
        await course.save();

        res.json({ message: 'Handout removed' });
    } catch (error) {
        console.error('Handout delete error:', error);
        res.status(500).json({ message: 'Failed to remove handout' });
    }
};

module.exports = { createCourse, getCourses, getCourseById, deleteCourse, getTeacherStats, getCourseAnalytics, exportCourse, uploadHandout, deleteHandout, handoutUploadMiddleware };
