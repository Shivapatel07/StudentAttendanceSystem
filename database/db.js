
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database configuration
const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, 'attendance.db');

// Create database directory if it does not exist
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Create SQLite connection
const connection = new sqlite3.Database(dbPath);

// Enable foreign keys
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Initialize database and tables
async function init() {
    await run('PRAGMA foreign_keys = ON');

    await run(`
        CREATE TABLE IF NOT EXISTS students (
            roll_no TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT NOT NULL DEFAULT ''
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roll_no TEXT NOT NULL,
            attendance_date TEXT NOT NULL,
            period INTEGER NOT NULL CHECK(period BETWEEN 1 AND 7),
            status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
            UNIQUE(roll_no, attendance_date, period),
            FOREIGN KEY(roll_no)
                REFERENCES students(roll_no)
                ON DELETE CASCADE
        )
    `);

    // Insert sample students if database is empty
    const count = await get(
        'SELECT COUNT(*) AS count FROM students'
    );

    if (count.count === 0) {
        const seedStudents = [
            ['STU001', 'Aarav Kumar', 'CSE (AI & ML)'],
            ['STU002', 'Ananya Reddy', 'CSE (AI & ML)'],
            ['STU003', 'Rahul Sharma', 'CSE (AI & ML)']
        ];

        for (const student of seedStudents) {
            await run(
                `INSERT INTO students
                (roll_no, name, department)
                VALUES (?, ?, ?)`,
                student
            );
        }
    }

    console.log('SQLite database initialized successfully.');
}

// Get all students
async function getStudents() {
    return all(`
        SELECT roll_no, name, department
        FROM students
        ORDER BY roll_no
    `);
}

// Add student
async function addStudent(student) {
    const rollNo = String(student.roll_no || '').trim();
    const name = String(student.name || '').trim();
    const department = String(student.department || '').trim();

    if (!rollNo || !name) {
        throw new Error('Roll number and name are required.');
    }

    await run(
        `INSERT INTO students
        (roll_no, name, department)
        VALUES (?, ?, ?)`,
        [rollNo, name, department]
    );

    return {
        roll_no: rollNo,
        name,
        department
    };
}

// Update student
async function updateStudent(rollNo, name, department) {
    const result = await run(
        `UPDATE students
        SET name = ?, department = ?
        WHERE roll_no = ?`,
        [name, department || '', rollNo]
    );

    return result.changes > 0;
}

// Delete student
// Attendance is automatically deleted through ON DELETE CASCADE
async function deleteStudent(rollNo) {
    const result = await run(
        'DELETE FROM students WHERE roll_no = ?',
        [rollNo]
    );

    return result.changes > 0;
}

// Get attendance for a particular date
async function getAttendance(date) {
    const students = await getStudents();

    const records = await all(
        `SELECT roll_no, attendance_date, period, status
        FROM attendance
        WHERE attendance_date = ?`,
        [date]
    );

    const attendanceMap = new Map();

    records.forEach(record => {
        attendanceMap.set(
            `${record.roll_no}-${record.period}`,
            record.status
        );
    });

    return students.map(student => ({
        ...student,

        periods: Array.from(
            { length: 7 },
            (_, index) =>
                attendanceMap.get(
                    `${student.roll_no}-${index + 1}`
                ) || ''
        )
    }));
}

// Save attendance using a transaction
async function saveAttendance(date, records) {
    await run('BEGIN IMMEDIATE TRANSACTION');

    try {
        for (const record of records) {
            if (
                !record ||
                typeof record.roll_no !== 'string' ||
                !record.roll_no.trim() ||
                !Number.isInteger(Number(record.period)) ||
                Number(record.period) < 1 ||
                Number(record.period) > 7 ||
                !['Present', 'Absent'].includes(record.status)
            ) {
                throw new Error('Invalid attendance record.');
            }

            const student = await get(
                'SELECT roll_no FROM students WHERE roll_no = ?',
                [record.roll_no.trim()]
            );

            if (!student) {
                throw new Error(
                    `Unknown student roll number: ${record.roll_no}`
                );
            }

            await run(`
                INSERT INTO attendance
                (roll_no, attendance_date, period, status)
                VALUES (?, ?, ?, ?)

                ON CONFLICT(roll_no, attendance_date, period)
                DO UPDATE SET status = excluded.status
            `, [
                record.roll_no.trim(),
                date,
                Number(record.period),
                record.status
            ]);
        }

        await run('COMMIT');

    } catch (error) {
        try {
            await run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Transaction rollback failed:', rollbackError);
        }

        throw error;
    }
}

// Get monthly attendance report
async function getMonthlyReport(month, threshold = 75) {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);

    if (!match) {
        throw new Error('Invalid month. Expected YYYY-MM.');
    }

    if (!Number.isFinite(Number(threshold))) {
        throw new Error('Invalid attendance threshold.');
    }

    const year = Number(match[1]);
    const monthNumber = Number(match[2]);

    const startDate = `${month}-01`;

    const nextMonth = new Date(
        Date.UTC(year, monthNumber, 1)
    );

    const endDate = nextMonth.toISOString().slice(0, 10);

    const students = await getStudents();

    const rows = await all(`
        SELECT
            roll_no,
            SUM(
                CASE WHEN status = 'Present'
                THEN 1 ELSE 0 END
            ) AS present,

            SUM(
                CASE WHEN status = 'Absent'
                THEN 1 ELSE 0 END
            ) AS absent,

            COUNT(*) AS recorded

        FROM attendance

        WHERE attendance_date >= ?
        AND attendance_date < ?

        GROUP BY roll_no
    `, [startDate, endDate]);

    const counts = new Map(
        rows.map(row => [row.roll_no, row])
    );

    return students.map(student => {
        const count = counts.get(student.roll_no) || {
            present: 0,
            absent: 0,
            recorded: 0
        };

        const present = Number(count.present || 0);
        const absent = Number(count.absent || 0);

        const workingPeriods = present + absent;

        const percentage = workingPeriods > 0
            ? Number(
                ((present / workingPeriods) * 100).toFixed(2)
            )
            : 0;

        return {
            ...student,
            working_periods: workingPeriods,
            present,
            absent,
            percentage,
            shortage:
                workingPeriods > 0 &&
                percentage < threshold
        };
    });
}

// Export database functions
module.exports = {
    init,
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getAttendance,
    saveAttendance,
    getMonthlyReport
};
