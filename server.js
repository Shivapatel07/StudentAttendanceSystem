
const express = require('express');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Validate YYYY-MM-DD and ensure it is a real calendar date
function validDate(value) {
    if (typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

// Validate attendance period (1 to 7)
function validPeriod(value) {
    return (
        (typeof value === 'number' ||
            (typeof value === 'string' && /^[1-7]$/.test(value))) &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 1 &&
        Number(value) <= 7
    );
}

// Validate and normalize report threshold
function getThreshold(value) {
    if (value === undefined || value === '') {
        return 75;
    }

    const threshold = Number(value);

    if (!Number.isFinite(threshold)) {
        return null;
    }

    return Math.min(100, Math.max(0, threshold));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Get all students
app.get('/api/students', async (req, res, next) => {
    try {
        const students = await db.getStudents();
        res.json(students);
    } catch (error) {
        next(error);
    }
});

// Add a new student
app.post('/api/students', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const rollNo = String(req.body.roll_no || '').trim();
        const department = String(req.body.department || '').trim();

        if (!name || !rollNo) {
            return res.status(400).json({
                error: 'Roll number and student name are required.'
            });
        }

        const result = await db.addStudent({
            roll_no: rollNo,
            name,
            department
        });

        res.status(201).json(result);

    } catch (error) {
        if (
            error.code === 'SQLITE_CONSTRAINT' ||
            error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            /UNIQUE constraint failed/i.test(error.message || '')
        ) {
            return res.status(409).json({
                error: 'That roll number already exists.'
            });
        }

        next(error);
    }
});

// Update student
app.put('/api/students/:rollNo', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const department = String(req.body.department || '').trim();

        if (!name) {
            return res.status(400).json({
                error: 'Student name is required.'
            });
        }

        const changed = await db.updateStudent(
            req.params.rollNo,
            name,
            department
        );

        if (!changed) {
            return res.status(404).json({
                error: 'Student not found.'
            });
        }

        res.json({ message: 'Student updated.' });

    } catch (error) {
        next(error);
    }
});

// Delete student and associated attendance
app.delete('/api/students/:rollNo', async (req, res, next) => {
    try {
        const changed = await db.deleteStudent(req.params.rollNo);

        if (!changed) {
            return res.status(404).json({
                error: 'Student not found.'
            });
        }

        res.json({
            message: 'Student and associated attendance deleted.'
        });

    } catch (error) {
        next(error);
    }
});

// Get attendance for a particular date
app.get('/api/attendance', async (req, res, next) => {
    try {
        const date = req.query.date;

        if (!validDate(date)) {
            return res.status(400).json({
                error: 'Provide a valid date as YYYY-MM-DD.'
            });
        }

        const attendance = await db.getAttendance(date);
        res.json(attendance);

    } catch (error) {
        next(error);
    }
});

// Save attendance
app.post('/api/attendance', async (req, res, next) => {
    try {
        const { date, records } = req.body;

        if (!validDate(date) || !Array.isArray(records)) {
            return res.status(400).json({
                error: 'Valid date and records array are required.'
            });
        }

        if (records.length === 0) {
            return res.status(400).json({
                error: 'At least one attendance record is required.'
            });
        }

        for (const record of records) {
            if (
                !record ||
                typeof record.roll_no !== 'string' ||
                !record.roll_no.trim() ||
                !validPeriod(record.period) ||
                !['Present', 'Absent'].includes(record.status)
            ) {
                return res.status(400).json({
                    error: 'Each record needs roll_no, period 1–7, and status Present or Absent.'
                });
            }
        }

        await db.saveAttendance(date, records);

        res.json({
            message: 'Attendance saved successfully.',
            count: records.length
        });

    } catch (error) {
        next(error);
    }
});

// Get monthly attendance report
app.get('/api/reports/monthly', async (req, res, next) => {
    try {
        const month = String(req.query.month || '');
        const threshold = getThreshold(req.query.threshold);

        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({
                error: 'Provide month as YYYY-MM.'
            });
        }

        if (threshold === null) {
            return res.status(400).json({
                error: 'Threshold must be a valid number.'
            });
        }

        const report = await db.getMonthlyReport(month, threshold);
        res.json(report);

    } catch (error) {
        next(error);
    }
});

// Export monthly attendance report as CSV
app.get('/api/reports/monthly.csv', async (req, res, next) => {
    try {
        const month = String(req.query.month || '');
        const threshold = getThreshold(req.query.threshold);

        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).send(
                'Provide month as YYYY-MM.'
            );
        }

        if (threshold === null) {
            return res.status(400).send(
                'Threshold must be a valid number.'
            );
        }

        const rows = await db.getMonthlyReport(month, threshold);

        // Escape CSV values and reduce spreadsheet formula injection risk
        const csvCell = value => {
            let text = String(value ?? '');

            if (/^[\s]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        };

        const headers = [
            'Roll Number',
            'Student Name',
            'Department',
            'Working Periods',
            'Present',
            'Absent',
            'Attendance %',
            'Below Threshold'
        ];

        const lines = [
            headers,
            ...rows.map(record => [
                record.roll_no,
                record.name,
                record.department,
                record.working_periods,
                record.present,
                record.absent,
                record.percentage,
                record.shortage ? 'Yes' : 'No'
            ])
        ].map(row => row.map(csvCell).join(','));

        res.setHeader(
            'Content-Type',
            'text/csv; charset=utf-8'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="attendance-${month}.csv"`
        );

        res.send('\uFEFF' + lines.join('\r\n'));

    } catch (error) {
        next(error);
    }
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found.'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Application error:', error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: 'Internal server error. Check the server terminal for details.'
    });
});

// Initialize database and start server
if (require.main === module) {
    db.init()
        .then(() => {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(
                    `Student Attendance System running at http://localhost:${PORT}`
                );
            });
        })
        .catch(error => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = app;
