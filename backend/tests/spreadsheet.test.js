const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSpreadsheetRows } = require('../utils/spreadsheet');

test('parseSpreadsheetRows reads quoted csv rows into objects', async () => {
    const rows = await parseSpreadsheetRows({
        originalname: 'students.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from('Email,Enrollment Number,Name\n"ada@example.com","STU,001","Ada Lovelace"\n'),
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].Email, 'ada@example.com');
    assert.equal(rows[0]['Enrollment Number'], 'STU,001');
    assert.equal(rows[0].Name, 'Ada Lovelace');
});

test('parseSpreadsheetRows rejects legacy xls files', async () => {
    await assert.rejects(
        () => parseSpreadsheetRows({
            originalname: 'students.xls',
            mimetype: 'application/vnd.ms-excel',
            buffer: Buffer.from(''),
        }),
        /Legacy \.xls files are not supported/
    );
});
