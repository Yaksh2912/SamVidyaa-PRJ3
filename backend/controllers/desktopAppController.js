const DesktopAppAsset = require('../models/DesktopAppAsset');
const multer = require('multer');
const path = require('path');
const { ensureDir, pathExists, removeFileIfPresent } = require('../utils/fileSystem');

const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';

const installerStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'desktop-apps');
        ensureDir(dir)
            .then(() => cb(null, dir))
            .catch(cb);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const allowedExtensions = new Set(['.exe', '.msi']);

const installerUpload = multer({
    storage: installerStorage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        if (allowedExtensions.has(extension)) {
            cb(null, true);
            return;
        }

        cb(new Error('Only .exe or .msi installer files are allowed'));
    }
});

const desktopAppUploadMiddleware = installerUpload.single('installer');

const serializeDesktopApp = (asset) => ({
    available: true,
    title: asset.title,
    version: asset.version,
    filename: asset.filename,
    file_path: asset.file_path,
    file_size: asset.file_size,
    download_count: asset.download_count || 0,
    mime_type: asset.mime_type,
    updated_at: asset.updatedAt,
    platform: asset.platform,
});

// @desc    Get current public desktop app metadata
// @route   GET /api/desktop-app/latest
// @access  Public
const getLatestDesktopApp = async (_req, res) => {
    try {
        const asset = await DesktopAppAsset.findOne({ platform: 'windows' });

        if (!asset) {
            return res.json({
                available: false,
                message: 'Desktop app not available',
            });
        }

        res.json(serializeDesktopApp(asset));
    } catch (error) {
        console.error('Get latest desktop app error:', error);
        res.status(500).json({ message: 'Failed to fetch desktop app' });
    }
};

// @desc    Download current desktop app installer
// @route   GET /api/desktop-app/download
// @access  Public
const downloadDesktopApp = async (_req, res) => {
    try {
        const asset = await DesktopAppAsset.findOne({ platform: 'windows' });

        if (!asset) {
            return res.status(404).json({ message: 'Desktop app not available' });
        }

        const absolutePath = path.join(__dirname, '..', asset.file_path);

        if (!(await pathExists(absolutePath))) {
            return res.status(404).json({ message: 'Installer file not found' });
        }

        asset.download_count = (asset.download_count || 0) + 1;
        await asset.save();

        res.download(absolutePath, asset.filename);
    } catch (error) {
        console.error('Desktop app download error:', error);
        res.status(500).json({ message: 'Failed to download desktop app' });
    }
};

// @desc    Upload or replace desktop app installer
// @route   POST /api/desktop-app/upload
// @access  Private (Admin)
const uploadDesktopApp = async (req, res) => {
    try {
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Installer file is required' });
        }

        const existingAsset = await DesktopAppAsset.findOne({ platform: 'windows' });
        await removeFileIfPresent(existingAsset?.file_path, { bestEffort: true });

        const relativePath = path.join('uploads', 'desktop-apps', req.file.filename);
        const asset = existingAsset || new DesktopAppAsset({ platform: 'windows' });

        asset.title = 'SamVidyaa Desktop';
        asset.version = (req.body.version || '').trim() || 'Latest';
        asset.filename = req.file.originalname;
        asset.file_path = relativePath;
        asset.file_size = req.file.size;
        asset.mime_type = req.file.mimetype || 'application/octet-stream';
        asset.download_count = existingAsset?.download_count || 0;
        asset.uploaded_by = req.user._id;

        await asset.save();

        res.status(existingAsset ? 200 : 201).json({
            message: 'Desktop app uploaded',
            ...serializeDesktopApp(asset),
        });
    } catch (error) {
        console.error('Desktop app upload error:', error);
        res.status(500).json({ message: 'Failed to upload desktop app' });
    }
};

// @desc    Remove current desktop app installer
// @route   DELETE /api/desktop-app
// @access  Private (Admin)
const deleteDesktopApp = async (req, res) => {
    try {
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const asset = await DesktopAppAsset.findOne({ platform: 'windows' });
        if (!asset) {
            return res.status(404).json({ message: 'Desktop app not found' });
        }

        await removeFileIfPresent(asset.file_path);
        await asset.deleteOne();

        res.json({ message: 'Desktop app removed' });
    } catch (error) {
        console.error('Desktop app delete error:', error);
        res.status(500).json({ message: 'Failed to remove desktop app' });
    }
};

module.exports = {
    getLatestDesktopApp,
    downloadDesktopApp,
    uploadDesktopApp,
    deleteDesktopApp,
    desktopAppUploadMiddleware,
};
