const fs = require('fs/promises');
const path = require('path');
const { constants } = require('fs');

const backendRoot = path.resolve(__dirname, '..');
const uploadsRoot = path.resolve(backendRoot, 'uploads');

// Collapse traversal sequences and strip leading slashes so a caller cannot escape the uploads dir.
const normalizeRelativePath = (input = '') => path.posix
    .normalize(String(input).replace(/\\/g, '/'))
    .replace(/^\/+/, '');

// Resolve a caller-supplied path against the backend root and confirm it stays inside uploads/.
const resolveWithinUploads = (input = '') => {
    const relativePath = normalizeRelativePath(input);
    const absolutePath = path.resolve(backendRoot, relativePath);
    const isWithinUploads = relativePath.startsWith('uploads/')
        && (absolutePath === uploadsRoot || absolutePath.startsWith(uploadsRoot + path.sep));
    return { relativePath, absolutePath, isWithinUploads };
};

const ensureDir = async (dirPath) => {
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
};

const pathExists = async (targetPath) => {
    try {
        await fs.access(targetPath, constants.F_OK);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }

        throw error;
    }
};

const removeFileIfPresent = async (targetPath, options = {}) => {
    const { baseDir = backendRoot, bestEffort = false } = options;

    if (!targetPath) {
        return false;
    }

    const absolutePath = path.isAbsolute(targetPath)
        ? targetPath
        : path.resolve(baseDir, targetPath);

    try {
        await fs.unlink(absolutePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }

        if (bestEffort) {
            console.error('File cleanup error:', error);
            return false;
        }

        throw error;
    }
};

module.exports = {
    ensureDir,
    pathExists,
    removeFileIfPresent,
    normalizeRelativePath,
    resolveWithinUploads,
};
