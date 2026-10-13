// Hidden developer / admin entry: tap the red roof (top) of the CASHPOR logo 3 times → "Enter code"
import { createContext, useContext, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

const DevCtx = createContext(() => {});
export const useDevTaps = () => useContext(DevCtx);

export function DevEntryProvider({ children }) {
  const taps = useRef([]); const [open, setOpen] = useState(false);
  const onTap = e => {
    const r = e.currentTarget.getBoundingClientRect(); if (e.clientY - r.top > r.height * 0.45) return;   // only the red triangle
    const t = Date.now(); taps.current = taps.current.filter(x => t - x < 1500); taps.current.push(t);
    if (taps.current.length >= 3) { taps.current = []; setOpen(true); }
  };
  return <DevCtx.Provider value={onTap}>{children}{open && <DevBox onClose={() => setOpen(false)} />}</DevCtx.Provider>;
}

function DevBox({ onClose }) {
  const { TX } = useI18n(); const [code, setCode] = useState(''); const [msg, setMsg] = useState('');
  const submit = async e => {
    e.preventDefault();
    try {
      const r = await fetch('/api/dev-unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Wrong code.');
      if (location.pathname.startsWith('/review')) { history.replaceState(null, '', '/review'); location.reload(); } else location.href = '/review';
    } catch (x) { setMsg(x.message); }
  };
  return <div id="devBox" role="dialog" aria-modal="true" aria-label="Enter code" onClick={e => { if (e.target.id === 'devBox') onClose(); }}>
    <form id="devForm" onSubmit={submit}><b>{TX('Enter code', 'कोड दर्ज करें')}</b>
      <input id="devCode" type="password" autoComplete="off" autoCapitalize="characters" spellCheck="false" aria-label="Code" autoFocus value={code} onChange={e => setCode(e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}><button className="btn pri" type="submit">{TX('Submit', 'जमा करें')}</button><button className="btn" type="button" onClick={onClose}>{TX('Cancel', 'रद्द करें')}</button></div>
      {msg && <div className="note">{msg}</div>}</form></div>;
}
