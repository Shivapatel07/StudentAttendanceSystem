const form = document.getElementById('studentForm');
const body = document.getElementById('studentsBody');
const message = document.getElementById('message');
let students = [];
let editingRoll = null;
const say = (text, bad = false) => { message.textContent = text; message.className = `message ${bad ? 'error' : 'success'}`; };
async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
async function loadStudents() {
  try {
    students = await api('/api/students');
    document.getElementById('studentSummary').textContent = `${students.length} student(s) registered`;
    renderStudents();
  } catch (e) { say(e.message, true); }
}
function renderStudents() {
  const q = document.getElementById('studentSearch').value.toLowerCase();
  const filtered = students.filter(s => [s.roll_no, s.name, s.department].some(v => (v || '').toLowerCase().includes(q)));
  body.innerHTML = '';
  if (!filtered.length) { body.innerHTML = '<tr><td colspan="4" class="empty">No students found.</td></tr>'; return; }
  filtered.forEach(s => {
    const tr = document.createElement('tr');
    [s.roll_no, s.name, s.department].forEach(value => { const td = document.createElement('td'); td.textContent = value || '—'; tr.appendChild(td); });
    const actions = document.createElement('td');
    const edit = document.createElement('button'); edit.className = 'text-button'; edit.textContent = 'Edit'; edit.onclick = () => beginEdit(s);
    const del = document.createElement('button'); del.className = 'text-button danger-text'; del.textContent = 'Delete'; del.onclick = () => removeStudent(s.roll_no);
    actions.append(edit, del); tr.appendChild(actions); body.appendChild(tr);
  });
}
function beginEdit(s) {
  editingRoll = s.roll_no;
  document.getElementById('rollNo').value = s.roll_no;
  document.getElementById('rollNo').disabled = true;
  document.getElementById('studentName').value = s.name;
  document.getElementById('department').value = s.department;
  document.getElementById('formTitle').textContent = 'Edit student';
  document.getElementById('saveStudent').textContent = 'Save changes';
  document.getElementById('cancelEdit').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetForm() {
  editingRoll = null; form.reset(); document.getElementById('rollNo').disabled = false;
  document.getElementById('formTitle').textContent = 'Add a student';
  document.getElementById('saveStudent').textContent = 'Add student';
  document.getElementById('cancelEdit').classList.add('hidden');
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = { roll_no: document.getElementById('rollNo').value.trim(), name: document.getElementById('studentName').value.trim(), department: document.getElementById('department').value.trim() };
  try {
    if (editingRoll) { await api(`/api/students/${encodeURIComponent(editingRoll)}`, { method: 'PUT', body: JSON.stringify(data) }); say('Student updated successfully.'); }
    else { await api('/api/students', { method: 'POST', body: JSON.stringify(data) }); say('Student added successfully.'); }
    resetForm(); await loadStudents();
  } catch (e) { say(e.message, true); }
});
document.getElementById('cancelEdit').onclick = resetForm;
document.getElementById('studentSearch').addEventListener('input', renderStudents);
async function removeStudent(rollNo) {
  if (!confirm(`Delete ${rollNo} and its attendance records?`)) return;
  try { await api(`/api/students/${encodeURIComponent(rollNo)}`, { method: 'DELETE' }); say('Student deleted.'); await loadStudents(); }
  catch (e) { say(e.message, true); }
}
loadStudents();
