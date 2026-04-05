const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { embedAndStore, clearVectorsByFilter, isReady } = require('./vectorStore');

const HANDOUT_VECTOR_TYPE = 'course-handout';

const normalizeExtractedText = (text = '') => text
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const resolveUploadPath = (relativePath) => path.resolve(__dirname, '..', relativePath);

const clearCourseHandoutVectors = async (courseId) => {
    if (!courseId || !isReady()) {
        return false;
    }

    await clearVectorsByFilter({
        courseId: courseId.toString(),
        type: HANDOUT_VECTOR_TYPE,
    });

    return true;
};

const extractPdfTextFromFile = async (absolutePath) => {
    if (!absolutePath || !fs.existsSync(absolutePath)) {
        throw new Error('Handout PDF file not found.');
    }

    const dataBuffer = await fs.promises.readFile(absolutePath);
    const parser = new PDFParse({ data: dataBuffer });

    try {
        const result = await parser.getText();
        const text = normalizeExtractedText(result.text || '');
        const pages = result.total || result.numpages || result.pages?.length || 0;

        return { text, pages };
    } finally {
        await parser.destroy();
    }
};

const ingestHandoutPdf = async ({
    relativePath,
    source,
    courseId = '',
    courseName = '',
    replaceExistingForCourse = true,
}) => {
    if (!relativePath) {
        throw new Error('Handout file path is required.');
    }

    if (!isReady()) {
        return {
            status: 'skipped',
            reason: 'Vector store is not initialized.',
            chunksStored: 0,
            pages: 0,
        };
    }

    const absolutePath = resolveUploadPath(relativePath);
    const { text, pages } = await extractPdfTextFromFile(absolutePath);

    if (!text) {
        throw new Error('Could not extract text from PDF.');
    }

    if (replaceExistingForCourse && courseId) {
        await clearCourseHandoutVectors(courseId);
    }

    const chunksStored = await embedAndStore(text, {
        source: source || path.basename(relativePath),
        courseId: courseId.toString(),
        courseName,
        type: HANDOUT_VECTOR_TYPE,
    });

    return {
        status: 'indexed',
        chunksStored,
        pages,
    };
};

const syncCourseHandout = async (course) => {
    if (!course?.handout_path) {
        return {
            status: 'skipped',
            reason: 'No handout is attached to this course.',
            chunksStored: 0,
            pages: 0,
        };
    }

    return ingestHandoutPdf({
        relativePath: course.handout_path,
        source: course.handout_filename || path.basename(course.handout_path),
        courseId: course._id?.toString(),
        courseName: course.course_name || '',
        replaceExistingForCourse: true,
    });
};

module.exports = {
    HANDOUT_VECTOR_TYPE,
    clearCourseHandoutVectors,
    extractPdfTextFromFile,
    ingestHandoutPdf,
    resolveUploadPath,
    syncCourseHandout,
};
