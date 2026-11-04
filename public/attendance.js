const dateInput = document.getElementById('attendanceDate');
const head = document.getElementById('attendanceHead');
const body = document.getElementById('attendanceBody');
const message = document.getElementById('message');
const today = new Date();
dateInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const say = (t, bad=false) => { message.textContent=t; message.className=`message ${bad?'error':'success'}`; };
async function api(url, options={}) {
  const res=await fetch(url,{headers:{'Content-Type':'application/json'},...options});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Request failed');
  return data;
}
function draw(rows) {
  head.innerHTML = `<tr><th>Roll number</th><th>Student</th>${Array.from({length:7},(_,i)=>`<th>P${i+1}</th>`).join('')}</tr>`;
  body.innerHTML='';
  if(!rows.length){body.innerHTML='<tr><td colspan="9" class="empty">No students found. Add students first.</td></tr>';return;}
  rows.forEach(s=>{
    const tr=document.createElement('tr');
    const roll=document.createElement('td');roll.textContent=s.roll_no;tr.appendChild(roll);
    const name=document.createElement('td');name.textContent=s.name;tr.appendChild(name);
    s.periods.forEach((status,i)=>{
      const td=document.createElement('td');
      const select=document.createElement('select');select.className='status-select';select.dataset.roll=s.roll_no;select.dataset.period=String(i+1);select.setAttribute('aria-label',`${s.name} period ${i+1}`);
      select.innerHTML='<option value="">—</option><option value="Present">Present</option><option value="Absent">Absent</option>';
      select.value=status;select.classList.toggle('present',status==='Present');select.classList.toggle('absent',status==='Absent');
      select.addEventListener('change',()=>{select.classList.toggle('present',select.value==='Present');select.classList.toggle('absent',select.value==='Absent');});
      td.appendChild(select);tr.appendChild(td);
    });body.appendChild(tr);
  });
}
async function loadAttendance(){
  if(!dateInput.value)return;
  try{draw(await api(`/api/attendance?date=${encodeURIComponent(dateInput.value)}`));}
  catch(e){say(e.message,true);}
}
function markAll(status){document.querySelectorAll('.status-select').forEach(s=>{s.value=status;s.classList.toggle('present',status==='Present');s.classList.toggle('absent',status==='Absent');});}
document.getElementById('allPresent').onclick=()=>markAll('Present');
document.getElementById('allAbsent').onclick=()=>markAll('Absent');
dateInput.addEventListener('change',loadAttendance);
document.getElementById('saveAttendance').onclick=async()=>{
  const records=Array.from(document.querySelectorAll('.status-select')).filter(s=>s.value).map(s=>({roll_no:s.dataset.roll,period:Number(s.dataset.period),status:s.value}));
  try{const result=await api('/api/attendance',{method:'POST',body:JSON.stringify({date:dateInput.value,records})});say(`${result.count} attendance record(s) saved.`);}
  catch(e){say(e.message,true);}
};
loadAttendance();
