// /print/:id — every form of one candidate on one page, used by the server (Chromium) to make the PDF
import { useEffect, useMemo, useState } from 'react';
import { api, fmtD, fmtDT } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';
import { FormProvider } from '../lib/form.jsx';
import { S, vis } from '../lib/flow.js';
import { labelFor } from '../lib/labels.js';
import { LOGO } from '../content/definitions.js';
import { Items } from '../components/form/Items.jsx';
import { SectionView } from '../components/Shell.jsx';
import { ReviewSubmit } from '../candidate/Pages.jsx';
import { ApprovalsPrint } from '../review/Blocks.jsx';

export default function PrintView({ id, token }) {
  const { LANG, tx } = useI18n(); const hi = LANG === 'hi';
  const [res, setRes] = useState(null), [st, setSt] = useState({}), [files, setFiles] = useState({}), [err, setErr] = useState(null);
  useEffect(() => {
    document.documentElement.dataset.mode = 'print';
    api(`/api/candidates/${id}?pt=${encodeURIComponent(token || '')}`).then(r => { setRes(r); setSt(r.data); setFiles(r.files || {}); }, e => { setErr(e); window.PRINT_ERROR = e.message; window.PRINT_READY = true; });
  }, [id, token]);
  useEffect(() => {
    if (!res) return;
    (async () => {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await Promise.all([...document.images].map(im => (im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))));
      try { await document.fonts.ready; } catch { /* no font API */ }
      window.PRINT_READY = true;
    })();
  }, [res]);
  const opts = useMemo(() => ({ mode: 'print', print: true, readOnly: true }), []);
  if (err) return <div className="sheet">Error: {err.message}</div>;
  if (!res) return null;
  const c = res.candidate;
  const sections = S.map((_, i) => i).filter(i => vis(i, st, true) && S[i].id !== 'result');
  return <FormProvider st={st} setSt={setSt} files={files} setFiles={setFiles} opts={opts}>
    <div className="app"><main className="main"><div className="sheet" id="sheet">
      <div className="sec pr-cover"><div style={{ display: 'flex', gap: 18, alignItems: 'center', borderBottom: '2px solid #1C7F3A', paddingBottom: 12, marginBottom: 14 }}><img src={LOGO} alt="" style={{ width: 70 }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 12 }}>Regd. No. U65910UP2002NPL027113 · (Providers of financial services to the rural poor)</div><h1 style={{ fontSize: 26, margin: '2px 0', color: '#C9262B' }}>CASHPOR<sup style={{ fontSize: '.4em' }}>®</sup> <span style={{ color: '#1C7F3A' }}>MICRO CREDIT</span></h1><div style={{ fontWeight: 700 }}>{hi ? 'कर्मचारी जॉइनिंग फाइल' : 'Employee Joining File'} · {c.track}</div></div>
        {st['@photo'] && <img src={st['@photo']} alt="" style={{ width: 110, height: 136, objectFit: 'cover', border: '1px solid #999' }} />}</div>
        <dl className="facts"><div><dt>{hi ? 'नाम' : 'Name'}</dt><dd>{c.full_name || '—'}</dd></div><div><dt>{hi ? 'पद' : 'Post'}</dt><dd>{c.post || '—'}</dd></div><div><dt>{hi ? 'मोबाइल' : 'Mobile'}</dt><dd>{c.mobile || '—'}</dd></div><div><dt>{hi ? 'अंचल' : 'Region'}</dt><dd>{c.region || '—'}</dd></div><div><dt>{hi ? 'संदर्भ संख्या' : 'Reference no.'}</dt><dd>{c.ref}</dd></div><div><dt>{hi ? 'कर्मचारी आईडी' : 'Employee ID'}</dt><dd>{c.employee_id || '—'}</dd></div><div><dt>{hi ? 'जॉइनिंग तिथि' : 'Joining date'}</dt><dd>{fmtD(c.joining_date)}</dd></div><div><dt>RCS No.</dt><dd>{c.rcs_no || '—'}</dd></div><div><dt>{hi ? 'जमा करने की तिथि' : 'Submitted on'}</dt><dd>{fmtDT(c.submitted_at)}</dd></div></dl></div>
      {sections.map(i => <SectionView key={i} i={i} review showPill={false} footer={false} body={S[i].id === 'review' ? <ReviewSubmit /> : <Items sec={S[i].id} items={S[i].items} />} />)}
      <ApprovalsPrint c={c} edits={res.edits} history={res.history} labelFor={k => labelFor(k, tx)} />
    </div></main></div>
    <div className="pr-wm" aria-hidden="true" />
  </FormProvider>;
}
