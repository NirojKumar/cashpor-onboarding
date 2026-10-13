// My queue / All candidates, the candidate details sheet (HRSM + HO) and exam results (HRSM)
import { useEffect, useState } from 'react';
import { api, fmtDT, fmtD } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useToast } from '../lib/form.jsx';
import { RL, STATUS } from '../lib/roles.js';
import { Pill } from '../components/Pill.jsx';

export const statusPill = (s, hi) => { const x = STATUS[s] || [s, s, '']; return <Pill cls={x[2]}>{hi ? x[1] : x[0]}</Pill>; };
const Loading = () => { const { LANG } = useI18n(); return <p style={{ color: 'var(--muted)' }}>{LANG === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p>; };
export function useLoad(fn, deps) {
  const [st, setSt] = useState({ loading: true });
  useEffect(() => { let on = true; setSt({ loading: true }); fn().then(data => on && setSt({ data }), error => on && setSt({ error })); return () => { on = false; }; }, deps);
  return st;
}

export function CandidateList({ user, view, onOpen, onAuthError }) {
  const { LANG, TX } = useI18n(); const hi = LANG === 'hi';
  const [rf, setRf] = useState('');
  const r = useLoad(() => api('/api/candidates?scope=' + (view === 'all' ? 'all' : 'queue')), [view]);
  useEffect(() => { if (r.error) onAuthError(r.error); }, [r.error]);
  if (r.loading) return <Loading />;
  if (r.error) return <div className="note">{r.error.message}</div>;
  const all = r.data, regs = [...new Set(all.map(x => x.region).filter(Boolean))].sort();
  const filt = regs.includes(rf) ? rf : '', rows = filt ? all.filter(x => x.region === filt) : all;
  const title = view === 'all' ? TX('All candidates', 'सभी अभ्यर्थी') : TX('My queue', 'मेरी कतार');
  const sub = view === 'all' ? TX('Every New Join and Rejoin application and where it is now.', 'सभी नई / पुनः जॉइनिंग आवेदन और उनकी वर्तमान स्थिति।')
    : ({ HRSM: TX('Applications submitted by candidates, waiting for your review.', 'अभ्यर्थियों द्वारा जमा आवेदन, आपकी समीक्षा हेतु।'), RM: TX('Applications approved by HRSM, waiting for RM / DRM approval.', 'HRSM द्वारा अनुमोदित आवेदन, RM / DRM अनुमोदन हेतु।'), HO: TX('Applications approved by RM / DRM, waiting for HO Recruitment.', 'RM / DRM द्वारा अनुमोदित आवेदन, HO भर्ती टीम हेतु।') })[user.role];
  return <>
    <header className="sec-head"><div><div className="eyebrow">{RL(user.role, hi)}</div><h2>{title}</h2><div className="sub">{sub}</div></div><span className="pill">{rows.length}</span></header>
    {regs.length > 1 && <div className="fld" style={{ maxWidth: 320, marginBottom: 10 }}><label htmlFor="rfilt">{hi ? 'अंचल के अनुसार देखें' : 'Show region'}</label><select id="rfilt" value={filt} onChange={e => setRf(e.target.value)}><option value="">{hi ? 'सभी अंचल' : 'All regions'} ({all.length})</option>{regs.map(g => <option key={g}>{g}</option>)}</select></div>}
    {rows.length ? <div className="tbl-wrap"><table><thead><tr><th>{hi ? 'संदर्भ' : 'Ref.'}</th><th>{hi ? 'नाम' : 'Name'}</th><th>{hi ? 'मोबाइल' : 'Mobile'}</th><th>{hi ? 'अंचल' : 'Region'}</th><th>{hi ? 'प्रकार' : 'Type'}</th><th>{hi ? 'पद' : 'Post'}</th><th>{hi ? 'जमा तिथि' : 'Submitted'}</th><th>{hi ? 'स्थिति' : 'Status'}</th><th /></tr></thead><tbody>
      {rows.map(x => <tr key={x.id}><td>{x.ref}</td><td><b>{x.full_name || '—'}</b></td><td>{x.mobile || ''}</td><td>{x.region || '—'}</td><td>{x.track === 'Rejoin' ? TX('Rejoin', 'पुनः जॉइनिंग') : TX('New Join', 'नई जॉइनिंग')}</td><td>{x.post || ''}</td><td>{fmtDT(x.submitted_at)}</td><td>{statusPill(x.status, hi)}</td><td><button className="btn sm pri" data-open={x.id} onClick={() => onOpen(x.id)}>{hi ? 'खोलें' : 'Open'}</button></td></tr>)}</tbody></table></div>
      : <section className="card"><p style={{ margin: 0, color: 'var(--muted)' }}>{view === 'all' ? TX('No applications yet.', 'अभी कोई आवेदन नहीं।') : TX('Nothing is waiting for you right now.', 'अभी आपके लिए कोई आवेदन लंबित नहीं है।')}</p></section>}
  </>;
}

export function SheetView({ onOpen }) {
  const { LANG, TX } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const r = useLoad(() => api('/api/sheet'), []);
  if (r.loading) return <Loading />;
  if (r.error) return <div className="note">{r.error.message}</div>;
  const rows = r.data;
  return <>
    <header className="sec-head"><div><div className="eyebrow">{hi ? 'HO भर्ती टीम द्वारा अनुमोदित' : 'Approved by HO Recruitment'}</div><h2>{hi ? 'अभ्यर्थी विवरण शीट' : 'Candidate details sheet'}</h2><div className="sub">{hi ? 'Excel डाउनलोड करें या हर अभ्यर्थी की पूरी फाइल PDF में निकालें।' : 'Download the Excel sheet, or extract each candidate’s full file as a PDF.'}</div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><a className="btn pri" href="/api/sheet.xlsx" style={{ textDecoration: 'none' }} onClick={() => toast(TX('Preparing the Excel… this can take a minute', 'Excel तैयार हो रहा है… एक मिनट लग सकता है'))}>{hi ? 'Excel डाउनलोड करें' : 'Download Excel'}</a><a className="btn" href="/api/sheet.zip" style={{ textDecoration: 'none' }} onClick={() => toast(TX('Preparing the Excel and all PDFs… this can take a minute', 'Excel और सभी PDF तैयार हो रही हैं… एक मिनट लग सकता है'))}>{hi ? 'Excel + सभी PDF (ZIP)' : 'Excel + all PDFs (ZIP)'}</a></div></header>
    <p style={{ margin: '-6px 0 12px', fontSize: 13.5, color: 'var(--muted)' }}>{hi ? 'हर अभ्यर्थी की पूरी PDF Excel के अंदर ही है (अंतिम कॉलम) — PDF आइकन पर डबल-क्लिक करें, या राइट-क्लिक → Package Object → Open / Save। ZIP में वही Excel और अलग PDF फ़ोल्डर भी है।' : 'Each candidate’s complete PDF is inside the Excel itself (last column) — double-click the PDF icon, or right-click → Package Object → Open / Save. The ZIP holds the same Excel plus a separate PDF folder.'}</p>
    {rows.length ? <div className="tbl-wrap"><table><thead><tr><th>{hi ? 'क्र.सं.' : 'S.No.'}</th><th>{hi ? 'अभ्यर्थी का नाम' : 'Candidate name'}</th><th>{hi ? 'संपर्क नम्बर' : 'Contact number'}</th><th>{hi ? 'अंचल' : 'Region'}</th><th>{hi ? 'कर्मचारी आईडी' : 'Employee ID'}</th><th>{hi ? 'जॉइनिंग तिथि' : 'Joining date'}</th><th>{hi ? 'टिप्पणी' : 'Remark'}</th><th>{hi ? 'दस्तावेज़' : 'Documents'}</th></tr></thead><tbody>
      {rows.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td><b>{x.full_name || ''}</b></td><td>{x.mobile || ''}</td><td>{x.region || '—'}</td><td>{x.employee_id || ''}</td><td>{fmtD(x.joining_date)}</td><td style={{ whiteSpace: 'normal' }}>{x.ho_remark || ''}</td><td><a className="btn sm" href={`/api/candidates/${x.id}/pdf`} data-pdf onClick={() => toast(TX('Preparing PDF… this can take a few seconds', 'PDF तैयार हो रहा है… कुछ सेकंड लग सकते हैं'))}>PDF</a> <button className="btn sm" onClick={() => onOpen(x.id)}>{hi ? 'देखें' : 'View'}</button></td></tr>)}</tbody></table></div>
      : <section className="card"><p style={{ margin: 0, color: 'var(--muted)' }}>{hi ? 'अभी तक कोई अभ्यर्थी अंतिम रूप से अनुमोदित नहीं हुआ।' : 'No candidate has been given final approval yet.'}</p></section>}
  </>;
}

const mk = (v, max) => (v === null || v === undefined || v === '' ? '—' : `${+v}/${max}`);
export function ExamView({ onOpenTest }) {
  const { LANG } = useI18n(); const hi = LANG === 'hi';
  const r = useLoad(() => api('/api/tests'), []);
  if (r.loading) return <Loading />;
  if (r.error) return <div className="note">{r.error.message}</div>;
  const rows = r.data;
  return <>
    <header className="sec-head"><div><div className="eyebrow">HRSM</div><h2>{hi ? 'परीक्षा परिणाम' : 'Exam results'}</h2><div className="sub">{hi ? 'TCM / PCM-CT लिखित परीक्षा — MCQ उत्तर व अंक अपने-आप; ऑनलाइन QR टेस्ट, लिखित व केस स्टडी के अंक HRSM भरता है। पूरा टेस्ट पेपर देखने के लिए "टेस्ट पेपर देखें" दबाएँ।' : 'TCM / PCM-CT written tests — MCQ answers and marks are automatic; HRSM enters the online QR test, written and case-study marks. Open “Review paper” to see the complete test paper.'}</div></div><a className="btn pri" href="/api/tests.xlsx" style={{ textDecoration: 'none' }}>{hi ? 'Excel डाउनलोड करें' : 'Download Excel'}</a></header>
    {rows.length ? <div className="tbl-wrap"><table><thead><tr><th>{hi ? 'क्र.सं.' : 'Sl. No.'}</th><th>{hi ? 'अभ्यर्थी का नाम' : 'Candidate name'}</th><th>{hi ? 'पिता का नाम' : 'Father’s name'}</th><th>{hi ? 'संपर्क नम्बर' : 'Contact number'}</th><th>{hi ? 'अंचल' : 'Region'}</th><th>{hi ? 'पद' : 'Post'}</th><th>{hi ? 'परीक्षा तिथि' : 'Test date'}</th><th>{hi ? 'MCQ अंक' : 'MCQ marks'}</th><th>{hi ? 'ऑनलाइन QR टेस्ट' : 'Online QR test'}</th><th>{hi ? 'लिखित' : 'Written'}</th><th>{hi ? 'केस स्टडी' : 'Case study'}</th><th /></tr></thead><tbody>
      {rows.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td><b>{x.name || ''}</b></td><td>{x.father || ''}</td><td>{x.mobile || ''}</td><td>{x.region || '—'}</td><td>{x.role}</td><td>{fmtD(x.submitted_at)}</td><td><Pill cls={x.mcq_total && x.mcq_score / x.mcq_total >= 0.6 ? 'ok' : 'bad'}>{x.mcq_score} / {x.mcq_total}</Pill></td><td>{mk(x.qr_mark, 10)}</td><td>{mk(x.written, 60)}</td><td>{mk(x.case_mark, 40)}</td><td><button className="btn sm pri" onClick={() => onOpenTest(x.id)}>{hi ? 'टेस्ट पेपर देखें' : 'Review paper'}</button></td></tr>)}</tbody></table></div>
      : <section className="card"><p style={{ margin: 0, color: 'var(--muted)' }}>{hi ? 'अभी कोई टेस्ट जमा नहीं हुआ। अभ्यर्थी TCM / PCM-CT चुनकर टेस्ट जमा करेंगे तो यहाँ दिखेगा।' : 'No test submitted yet. Tests appear here when candidates choose TCM or PCM-CT and submit the test paper.'}</p></section>}
  </>;
}
