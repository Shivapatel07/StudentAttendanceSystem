const monthInput=document.getElementById('reportMonth');
const thresholdInput=document.getElementById('threshold');
const body=document.getElementById('reportBody');
const message=document.getElementById('message');
const now=new Date();monthInput.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const say=(t,bad=false)=>{message.textContent=t;message.className=`message ${bad?'error':'success'}`;};
async function generate(){
  if(!monthInput.value)return;
  try{
    const res=await fetch(`/api/reports/monthly?month=${encodeURIComponent(monthInput.value)}&threshold=${encodeURIComponent(thresholdInput.value||75)}`);
    const rows=await res.json();if(!res.ok)throw new Error(rows.error||'Could not load report');
    body.innerHTML='';
    if(!rows.length){body.innerHTML='<tr><td colspan="7" class="empty">No students found.</td></tr>';return;}
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      [r.roll_no,r.name,r.working_periods,r.present,r.absent,`${r.percentage.toFixed(2)}%`].forEach((v,i)=>{const td=document.createElement('td');td.textContent=v; if(i===5){const bar=document.createElement('span');bar.className='percentage-pill';bar.textContent=v;td.textContent='';td.appendChild(bar);}tr.appendChild(td);});
      const status=document.createElement('td');status.innerHTML=r.working_periods?`<span class="badge ${r.shortage?'warning':'good'}">${r.shortage?'Below threshold':'On track'}</span>`:'<span class="badge neutral">No records</span>';tr.appendChild(status);body.appendChild(tr);
    });say(`Report generated for ${monthInput.value}.`);
  }catch(e){say(e.message,true);}
}
document.getElementById('generateReport').onclick=generate;
document.getElementById('exportCsv').onclick=()=>{window.location.href=`/api/reports/monthly.csv?month=${encodeURIComponent(monthInput.value)}&threshold=${encodeURIComponent(thresholdInput.value||75)}`;};
generate();
