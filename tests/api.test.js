const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDb = path.join(os.tmpdir(), `attendance-test-${process.pid}.db`);
process.env.DB_PATH = tempDb;
const db = require('../database/db');
const app = require('../server');
let server;
let base;

before(async () => {
  await db.init();
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(tempDb + suffix); } catch {}
  }
});

test('health endpoint responds successfully', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});
test('students endpoint returns registered students', async () => {
  const res = await fetch(`${base}/api/students`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(await res.json()));
});
test('student can be added and duplicate roll numbers are rejected', async () => {
  const student = { roll_no: 'TEST-900', name: 'Test Student', department: 'Testing' };
  const first = await fetch(`${base}/api/students`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(student) });
  assert.equal(first.status, 201);
  const duplicate = await fetch(`${base}/api/students`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(student) });
  assert.equal(duplicate.status, 409);
});
test('attendance can be saved and retrieved by date', async () => {
  const date = '2099-01-15';
  const saved = await fetch(`${base}/api/attendance`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({date, records:[{roll_no:'TEST-900',period:1,status:'Present'},{roll_no:'TEST-900',period:2,status:'Absent'}]}) });
  assert.equal(saved.status, 200);
  const res = await fetch(`${base}/api/attendance?date=${date}`);
  const rows = await res.json();
  const student = rows.find(s => s.roll_no === 'TEST-900');
  assert.equal(student.periods[0], 'Present');
  assert.equal(student.periods[1], 'Absent');
});
test('monthly report calculates percentage correctly', async () => {
  const res = await fetch(`${base}/api/reports/monthly?month=2099-01&threshold=75`);
  assert.equal(res.status, 200);
  const rows = await res.json();
  const student = rows.find(s => s.roll_no === 'TEST-900');
  assert.equal(student.present, 1);
  assert.equal(student.absent, 1);
  assert.equal(student.percentage, 50);
  assert.equal(student.shortage, true);
});
