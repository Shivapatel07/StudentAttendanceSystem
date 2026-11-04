async function loadDashboard() {
  const countEl = document.getElementById('studentCount');
  if (countEl) {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Could not load students');
      countEl.textContent = (await response.json()).length;
    } catch (e) { countEl.textContent = '—'; }
  }
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}
loadDashboard();
