// ─────────────────────────────────────────────────────────────
//  public/js/admin.js  – Admin dashboard interactions
// ─────────────────────────────────────────────────────────────

// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    const pane = document.getElementById('tab-' + tab);
    if (pane) pane.style.display = '';
    history.replaceState(null, '', `?tab=${tab}`);
  });
});

// Show correct initial tab from URL
(function() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') || 'overview';
  document.querySelector(`[data-tab="${tab}"]`)?.click();
})();

// ── Resolve escalation ────────────────────────────────────────
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-resolve]');
  if (!btn) return;
  const id = btn.dataset.resolve;
  btn.disabled = true;
  btn.textContent = 'Resolving…';
  try {
    const res = await fetch(`/admin/api/escalations/${id}/resolve`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Ticket resolved ✓', 'success');
      const row = btn.closest('tr');
      if (row) {
        const badge = row.querySelector('.badge');
        if (badge) {
          badge.className = 'badge badge-green';
          badge.textContent = '✓ Resolved';
        }
        btn.remove();
      }
    } else {
      showToast('Failed to resolve ticket', 'error');
      btn.disabled = false; btn.textContent = 'Resolve';
    }
  } catch {
    showToast('Network error', 'error');
    btn.disabled = false; btn.textContent = 'Resolve';
  }
});

// ── Load logs on demand ───────────────────────────────────────
const loadLogsBtn = document.getElementById('loadLogsBtn');
const logViewer   = document.getElementById('logViewer');

if (loadLogsBtn && logViewer) {
  loadLogsBtn.addEventListener('click', async () => {
    loadLogsBtn.textContent = 'Loading…';
    loadLogsBtn.disabled = true;
    try {
      const res  = await fetch('/admin/api/logs');
      const data = await res.json();
      const logs = data.data || [];

      if (!logs.length) {
        logViewer.innerHTML = '<span style="color:var(--text-muted)">No logs yet.</span>';
      } else {
        logViewer.innerHTML = logs.slice(0, 80).map(l => {
          const time   = `<span class="log-time">[${l.timestamp?.slice(11,19) || '??:??:??'}]</span>`;
          const type   = `<span class="log-type">${l.type || 'log'}</span>`;
          if (l.type === 'http_request') {
            const method = `<span class="log-method">${l.method}</span>`;
            const path   = `<span class="log-path">${l.path}</span>`;
            return `${time} ${type} ${method} ${path}`;
          }
          if (l.type === 'ai_request') {
            const dur = l.durationMs ? `<span style="color:var(--green-primary)">${l.durationMs}ms</span>` : '';
            const err = l.error ? `<span class="log-error"> ERR: ${l.error}</span>` : '';
            return `${time} <span class="log-ai">AI_REQUEST</span> session:${l.sessionId?.slice(0,8) || '?'} ${dur}${err}`;
          }
          return `${time} ${type} ${JSON.stringify(l).slice(0, 120)}`;
        }).join('\n');
      }
    } catch {
      logViewer.innerHTML = '<span class="log-error">Failed to load logs.</span>';
    } finally {
      loadLogsBtn.textContent = '↻ Refresh Logs';
      loadLogsBtn.disabled = false;
    }
  });

  // auto-load on page load
  loadLogsBtn.click();
}

// ── Toast notifications ───────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Stats auto-refresh every 30s ──────────────────────────────
async function refreshStats() {
  try {
    const res = await fetch('/admin/api/stats');
    const data = await res.json();
    if (!data.success) return;
    const s = data.data;
    const el = id => document.getElementById(id);
    if (el('stat-convos'))       el('stat-convos').textContent       = s.totalConvos;
    if (el('stat-escalations'))  el('stat-escalations').textContent  = s.escalations;
    if (el('stat-open'))         el('stat-open').textContent         = s.openEscalations;
    if (el('stat-orders'))       el('stat-orders').textContent       = s.totalOrders;
  } catch {}
}
setInterval(refreshStats, 30000);
