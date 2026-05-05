const path = require('path');
const { readSheet } = require('read-excel-file/node');

const CSV_MIME_TYPES = new Set(['text/csv', 'application/csv']);
const XLSX_MIME_TYPES = new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

const createSpreadsheetError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const parseCsvRows = (buffer) => {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                value += '"';
                index += 1;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                value += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(value);
            value = '';
        } else if (char === '\n') {
            row.push(value);
            rows.push(row);
            row = [];
            value = '';
        } else if (char !== '\r') {
            value += char;
        }
    }

    if (value || row.length) {
        row.push(value);
        rows.push(row);
    }

    return rows;
};

const rowsToObjects = (rows, options = {}) => {
    const { defval = '' } = options;
    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => String(header ?? '').trim());

    return dataRows
        .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
        .map((row) => {
            const item = Object.create(null);

            headers.forEach((header, index) => {
                if (!header) return;
                item[header] = row[index] ?? defval;
            });

            return item;
        });
};

const parseSpreadsheetRows = async (file, options = {}) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimetype = file.mimetype || '';

    if (extension === '.csv' || CSV_MIME_TYPES.has(mimetype)) {
        return rowsToObjects(parseCsvRows(file.buffer), options);
    }

    if (extension === '.xlsx' || XLSX_MIME_TYPES.has(mimetype)) {
        const rows = await readSheet(file.buffer);
        return rowsToObjects(rows, options);
    }

    if (extension === '.xls' || mimetype === 'application/vnd.ms-excel') {
        throw createSpreadsheetError('Legacy .xls files are not supported. Please upload a .csv or .xlsx file.');
    }

    throw createSpreadsheetError('Unsupported spreadsheet format. Please upload a .csv or .xlsx file.');
};

module.exports = {
    parseSpreadsheetRows,
};
