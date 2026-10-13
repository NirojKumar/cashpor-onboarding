export async function api(url, opt = {}) {
  const r = await fetch(url, { credentials: 'same-origin', method: opt.method || (opt.body ? 'POST' : 'GET'),
    headers: opt.body ? { 'Content-Type': 'application/json' } : {}, body: opt.body ? JSON.stringify(opt.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || ('Error ' + r.status)), { status: r.status, data: j });
  return j;
}
export const fmtDT = d => { if (!d) return ''; const s = String(d); const x = new Date(s.includes('T') || s.endsWith('Z') ? s : s.replace(' ', 'T') + 'Z'); return isNaN(x) ? s : x.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
export const fmtD = d => { if (!d) return '—'; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
