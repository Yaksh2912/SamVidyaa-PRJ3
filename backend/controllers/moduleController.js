const Module = require('../models/Module');
const archive = require('archiver');
const fs = require('fs');
const path = require('path');

// @desc    Create a new module
// @route   POST /api/modules
// @access  Private (Teacher/Admin)
const createModule = async (req, res) => {
    try {
        const { course_id, module_name, description, module_order, tasks_per_module, module_test_questions } = req.body;

        if (!course_id || !module_name || !module_order) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // req.files is array because of upload.array() middleware
        const files = req.files ? req.files.map(file => ({
            name: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        const newModule = await Module.create({
            course_id,
            module_name,
            description,
            module_order,
            tasks_per_module,
            module_test_questions,
            files,
            createdBy: req.user._id
        });

        res.status(201).json(newModule);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create module' });
    }
};

// @desc    Get all modules for the logged in teacher
// @route   GET /api/modules
// @access  Private
const getTeacherModules = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = { createdBy: req.user._id };

        if (course_id) {
            query.course_id = course_id;
        }

        const modules = await Module.find(query)
            .sort({ module_order: 1, createdAt: -1 })
            .populate('course_id', 'course_name course_code');

        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Export module as ZIP
// @route   GET /api/modules/:id/export
// @access  Private
const exportModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check ownership (optional, but good practice)
        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log(`Exporting module: ${module.module_name}`);
        console.log(`Files count: ${module.files ? module.files.length : 0}`);
        if (module.files) console.log('Files:', module.files);

        const archiveZip = archive('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        res.attachment(`${module.module_name.replace(/ /g, '_')}.zip`);

        archiveZip.pipe(res);

        if (module.files && module.files.length > 0) {
            for (const file of module.files) {
                // Check if file exists
                if (fs.existsSync(file.path)) {
                    console.log(`Adding file to zip: ${file.path}`);
                    archiveZip.file(file.path, { name: file.name });
                } else {
                    console.error(`File not found: ${file.path}`);
                    // We could add a text file saying file missing, or just skip
                }
            }
        } else {
            console.log('No files to export.');
            // Maybe add a text file to the zip saying "No files in this module"
            archiveZip.append('This module has no uploaded files.', { name: 'README.txt' });
        }

        await archiveZip.finalize();

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Delete a module
// @route   DELETE /api/modules/:id
// @access  Private (Teacher/Admin)
const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check ownership
        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Optional: Delete associated files from filesystem
        // if (module.files && module.files.length > 0) {
        //     module.files.forEach(file => {
        //         fs.unlink(file.path, (err) => {
        //             if (err) console.error("Failed to delete file:", file.path);
        //         });
        //     });
        // }

        await module.deleteOne();
        res.json({ message: 'Module removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete module' });
    }
};

module.exports = {
    createModule,
    getTeacherModules,
    exportModule,
    deleteModule
};
