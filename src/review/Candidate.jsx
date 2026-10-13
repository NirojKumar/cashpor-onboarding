// One application in the reviewer panel.
//   HRSM — every form editable (changes marked "Edited by"), interview sheet, remark, final submit / reject
//   HO   — read-only forms (HR office-use parts hidden), decision: Selected / Rejected / Revert
//   RM / DRM — summary view (see RmView), interview sheet, signature, approve / reject / send back
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, fmtDT } from '../lib/api.js';
import { useI18n, LangSwitch } from '../lib/i18n.jsx';
import { FormProvider, useForm, useToast } from '../lib/form.jsx';
import { S, vis, firstVis, clampSection, secIndex } from '../lib/flow.js';
import { STATUS_FOR, RL } from '../lib/roles.js';
import { labelFor } from '../lib/labels.js';
import { fmtD } from '../lib/api.js';
import { Items } from '../components/form/Items.jsx';
import { StepNav, SectionView } from '../components/Shell.jsx';
import { Pill } from '../components/Pill.jsx';
import { NavCtx } from '../candidate/nav.js';
import { InterviewCard, ApprovalsInline, HistoryTable, ivDefaults } from './Blocks.jsx';
import { statusPill } from './Lists.jsx';
import { useFrame } from './frame.jsx';

const lastEditMap = edits => { const m = {}; (edits || []).forEach(e => { m[e.field_key] = e; }); return m; };

export function CandidateView({ id, user, onDone, setDirty }) {
  const { LANG, TI, TX } = useI18n(); const Frame = useFrame();
  const [res, setRes] = useState(null), [err, setErr] = useState(null);
  const [st, setSt] = useState({}), [files, setFiles] = useState({});
  const [cur, setCur] = useState(0), [nDirty, setNDirty] = useState(0);
  const changed = useRef(new Set()), dirtyFiles = useRef(new Set());
  const load = async (keepSection) => {
    try {
      const r = await api('/api/candidates/' + id);
      const canAct = STATUS_FOR[user.role] === r.candidate.status;
      let data = r.data;
      if (canAct && user.role === 'HRSM') data = { ...Object.fromEntries(Object.entries(ivDefaults('hr', user)).filter(([k2]) => !r.data[k2])), ...r.data };
      if (canAct && user.role === 'RM') data = { ...Object.fromEntries(Object.entries(ivDefaults('rm', user)).filter(([k2]) => !r.data[k2])), ...r.data };
      changed.current.clear(); dirtyFiles.current.clear(); setNDirty(0); setDirty(0);
      setRes(r); setSt(data); setFiles(r.files || {});
      setCur(c => (keepSection ? clampSection(c, data, true) : firstVis(data, true)));
    } catch (e) { setErr(e); }
  };
  useEffect(() => { load(false); }, [id]);
  const mark = () => { const n = changed.current.size + dirtyFiles.current.size; setNDirty(n); setDirty(n); };
  const editable = !!res && user.role === 'HRSM' && res.candidate.status === 'submitted';
  const opts = useMemo(() => ({ mode: 'review', readOnly: !editable, hideHr: user.role === 'HO', lockHo: user.role === 'HRSM', lastEdit: lastEditMap(res?.edits),
    onEdit: k => { changed.current.add(k); mark(); }, onFileEdit: k => { dirtyFiles.current.add(k); mark(); } }), [editable, res, user.role]);
  if (err) return <Frame><div className="note">{err.message}</div></Frame>;
  if (!res) return <Frame><p style={{ color: 'var(--muted)' }}>{LANG === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p></Frame>;
  const go = n => { setCur(clampSection(n, st, true)); window.scrollTo(0, 0); };
  const actions = { changed, dirtyFiles, reload: () => load(true), onDone, nDirty };
  if (user.role === 'RM') return <FormProvider st={st} setSt={setSt} files={files} setFiles={setFiles} opts={{ ...opts, readOnly: true }}>
    <Frame title={res.candidate.full_name}><div className="welcome-top"><LangSwitch /></div><CandBar res={res} user={user} actions={actions} /><RmView res={res} user={user} onDone={onDone} /></Frame></FormProvider>;
  const i = clampSection(cur, st, true);
  return <FormProvider st={st} setSt={setSt} files={files} setFiles={setFiles} opts={opts}>
    <NavCtx.Provider value={go}>
      <Frame title={TI(S[i].id, st)} nav={<StepNav st={st} cur={i} onGo={go} review />}>
        <CandBar res={res} user={user} actions={actions} />
        <SectionView i={i} review onGo={go} body={<Items sec={S[i].id} items={S[i].items} />} />
      </Frame>
    </NavCtx.Provider>
  </FormProvider>;
}

function CandBar({ res, user, actions }) {
  const { st, files } = useForm(); const { LANG, TX } = useI18n(); const toast = useToast();
  const c = res.candidate, hi = LANG === 'hi', role = user.role, canAct = STATUS_FOR[role] === c.status;
  const [remark, setRemark] = useState(c.hr_remark || ''), [sure, setSure] = useState(false), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const [dec, setDec] = useState(''), [ho, setHo] = useState({ emp: '', doj: '', rcs: st['assess.rcs'] || '', remark: '' });
  const fail = x => { setBusy(false); setMsg(<div className="note">{x.message}</div>); };
  const hrSave = async submit => {
    setBusy(true); setMsg(null);
    const changes = {}, fl = {};
    actions.changed.current.forEach(k => { changes[k] = st[k]; }); Object.keys(st).filter(k => k.startsWith('iv.hr.')).forEach(k => { changes[k] = st[k]; });
    actions.dirtyFiles.current.forEach(k => { fl[k] = files[k] === undefined ? null : files[k]; });
    try {
      await api(`/api/candidates/${c.id}/hr`, { body: { changes, files: fl, remark, submit } });
      toast(submit ? (st['iv.hr.result'] === 'Rejected' ? TX('Application rejected', 'आवेदन अस्वीकृत') : TX('Sent to RM / DRM', 'RM / DRM को भेजा गया')) : TX('Changes saved', 'बदलाव सहेजे गए'));
      if (submit) return actions.onDone('queue');
      setBusy(false); actions.reload();
    } catch (x) { setSure(false); fail(x); }
  };
  const hoSubmit = async () => {
    setBusy(true); setMsg(null);
    try {
      if (dec === 'Revert') { await api(`/api/candidates/${c.id}/return`, { body: { reason: ho.remark } }); toast(TX('Reverted to HRSM', 'HRSM को रिवर्ट किया गया')); return actions.onDone('queue'); }
      const r = await api(`/api/candidates/${c.id}/ho`, { body: { decision: dec, employee_id: ho.emp, joining_date: ho.doj, rcs_no: ho.rcs, remark: ho.remark } });
      if (r.rejected) { toast(TX('Application rejected', 'आवेदन अस्वीकृत')); return actions.onDone('all'); }
      toast(TX('Final approval done — added to the candidate sheet', 'अंतिम अनुमोदन पूर्ण — अभ्यर्थी शीट में जोड़ा गया')); actions.onDone('sheet');
    } catch (x) { fail(x); }
  };
  const rejecting = st['iv.hr.result'] === 'Rejected';
  let act = null;
  if (role === 'HRSM' && canAct) act = <>
    {c.returned_note && <div className="note" style={{ marginTop: 10 }}><b>{hi ? 'वापस भेजा गया:' : 'Sent back:'}</b> {c.returned_note}</div>}
    <InterviewCard who="hr" editable />
    <div className="grid"><div className="fld full"><label htmlFor="hrRemark">{hi ? 'HRSM टिप्पणी' : 'HRSM remark'}</label><textarea id="hrRemark" value={remark} onChange={e => setRemark(e.target.value)} /></div></div>
    <div className="foot-row" style={{ marginTop: 6, justifyContent: 'flex-start', alignItems: 'center' }}>
      <button className="btn" id="hrSave" disabled={busy} onClick={() => hrSave(false)}>{hi ? 'बदलाव सहेजें' : 'Save changes'}</button>
      <button className="btn pri" id="hrSubmit" disabled={busy} onClick={() => (sure ? hrSave(true) : setSure(true))}>{sure ? (rejecting ? TX('Confirm: reject this application', 'पुष्टि करें: आवेदन अस्वीकृत करें') : TX('Confirm: send to RM / DRM', 'पुष्टि करें: RM / DRM को भेजें')) : (rejecting ? TX('Final submit — Reject', 'अंतिम रूप से जमा करें — अस्वीकृत') : TX('Final submit → RM / DRM', 'अंतिम रूप से जमा करें → RM / DRM'))}</button>
      <span id="hrDirty" style={{ fontSize: 13, color: 'var(--amber)' }}>{actions.nDirty ? TX(`${actions.nDirty} unsaved change(s)`, `${actions.nDirty} बदलाव सहेजे नहीं गए`) : ''}</span></div>
    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>{hi ? 'आप सभी फॉर्म में बदलाव कर सकते हैं और इंटरव्यू मूल्यांकन (मूल्यांकन शीट, चेक लिस्ट, ईमानदारी आकलन) भर सकते हैं। हर बदलाव के नीचे “संशोधित — आपका नाम” दिखेगा। कर्मचारी आईडी, जॉइनिंग तिथि और RCS नंबर HO भर्ती टीम भरेगी।' : 'You can edit any form and fill the interview assessment (assessment sheet, checklist, honesty evaluation). Every change shows “Edited by” with your name below it. Employee ID, joining date and RCS No. are filled by the HO Recruitment Team.'}</p></>;
  if (role === 'HO' && canAct) {
    const show = which => dec && which.split(' ').includes(dec);
    act = <><h3 style={{ margin: '14px 0 6px' }}>{hi ? 'HO भर्ती टीम का निर्णय' : 'HO Recruitment decision'}</h3>
      <div className="opts hodec">{[['Selected', hi ? 'चयनित (Selected)' : 'Selected'], ['Rejected', hi ? 'अस्वीकृत (Rejected)' : 'Rejected'], ['Revert', hi ? 'रिवर्ट — HRSM को वापस (Revert)' : 'Revert to HRSM']].map(([v, l]) => <label key={v}><input type="radio" name="hoDec" value={v} checked={dec === v} onChange={() => setDec(v)} />{l}</label>)}</div>
      <div className="grid" style={{ marginTop: 10 }}>
        {show('Selected') && <><div className="fld"><label htmlFor="hoEmp">{hi ? 'कर्मचारी आईडी' : 'Employee ID'}</label><input id="hoEmp" type="text" value={ho.emp} onChange={e => setHo({ ...ho, emp: e.target.value })} /></div>
          <div className="fld"><label htmlFor="hoDoj">{hi ? 'जॉइनिंग तिथि' : 'Joining date'}</label><input id="hoDoj" type="date" value={ho.doj} onChange={e => setHo({ ...ho, doj: e.target.value })} /></div>
          <div className="fld"><label htmlFor="hoRcs">{hi ? 'आरसीएस नंबर (RCS No.)' : 'RCS No.'}</label><input id="hoRcs" type="text" value={ho.rcs} onChange={e => setHo({ ...ho, rcs: e.target.value })} /></div></>}
        {show('Selected Rejected Revert') && <div className="fld full"><label htmlFor="hoRemark">{hi ? 'HO भर्ती टिप्पणी (अस्वीकृत / रिवर्ट पर कारण ज़रूरी)' : 'HO Recruitment remark (reason required for Rejected / Revert)'}</label><textarea id="hoRemark" value={ho.remark} onChange={e => setHo({ ...ho, remark: e.target.value })} /></div>}
      </div>
      {dec && <div className="foot-row" style={{ marginTop: 6, justifyContent: 'flex-start' }}><button className={'btn ' + (dec === 'Selected' ? 'pri' : 'danger')} id="hoApprove" disabled={busy} onClick={hoSubmit}>{dec === 'Rejected' ? TX('Reject application', 'आवेदन अस्वीकृत करें') : dec === 'Revert' ? TX('Revert to HRSM', 'HRSM को रिवर्ट करें') : TX('Select & final submit', 'चयनित — अंतिम रूप से जमा करें')}</button></div>}</>;
  }
  const pdf = (role === 'HRSM' || role === 'HO') ? <a className="btn sm" href={`/api/candidates/${c.id}/pdf`} data-pdf onClick={() => toast(TX('Preparing PDF… this can take a few seconds', 'PDF तैयार हो रहा है… कुछ सेकंड लग सकते हैं'))}>{hi ? 'PDF निकालें' : 'Extract PDF'}</a> : null;
  return <section className="card revbar">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div><div className="eyebrow" style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600 }}>{c.ref} · {c.track === 'Rejoin' ? TX('Rejoin', 'पुनः जॉइनिंग') : TX('New Join', 'नई जॉइनिंग')}{c.region ? ` · ${c.region}` : ''}</div><h2 style={{ fontSize: 24 }}>{c.full_name || '—'}</h2><div style={{ color: 'var(--muted)', fontSize: 14 }}>{c.post || ''} · {c.mobile || ''} · {TX('submitted', 'जमा')} {fmtDT(c.submitted_at)}</div></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{statusPill(c.status, hi)}{pdf}</div></div>
    {(role !== 'HRSM' || c.status !== 'submitted') && <ApprovalsInline c={c} user={user} />}
    {res.edits.length > 0 && <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>✎ {res.edits.length} {TX('change(s) made by HRSM — marked “Edited by” under each field.', 'बदलाव HRSM द्वारा — हर फील्ड के नीचे “संशोधित” लिखा है।')}</p>}
    {res.history.length > 0 && <details style={{ marginTop: 10 }}><summary>{hi ? 'आवेदन का इतिहास देखें' : 'View application history'}</summary><HistoryTable history={res.history} /></details>}
    {act}<div id="actMsg">{msg}</div></section>;
}

const findItem = (items, pred) => { for (const it of items || []) { if (pred(it)) return it; const f = findItem(it.items, pred); if (f) return f; } return null; };
function RmView({ res, user, onDone }) {
  const { st: d, files } = useForm(); const { LANG, TX } = useI18n(); const toast = useToast();
  const c = res.candidate, hi = LANG === 'hi', canAct = c.status === 'hr_approved';
  const [remark, setRemark] = useState(''), [reason, setReason] = useState(''), [msg, setMsg] = useState(null), [sbMsg, setSbMsg] = useState(null), [busy, setBusy] = useState(false);
  const v = k2 => d[k2] || '—', addr = p => ['Village', 'Post', 'Thana', 'Mark', 'District', 'State', 'Pin'].map(x => d['@' + p + x]).filter(Boolean).join(', ') || '—';
  const married = d['@marital'] === 'विवाहित';
  const facts = [[hi ? 'अभ्यर्थी का नाम' : 'Candidate name', '@name'], [hi ? 'आवेदित पद' : 'Position applied', d['@rrole'] ? '@rrole' : d['@role'] ? '@role' : '@post'], [hi ? 'जन्म तिथि' : 'Date of birth', '@dob'], [hi ? 'पिता का नाम' : 'Father’s name', '@father'], [hi ? 'माता का नाम' : 'Mother’s name', '@mother'],
    ...(married ? [[hi ? 'पति/ पत्नी का नाम' : 'Spouse name', '@spouse'], [hi ? 'सास का नाम' : 'Mother-in-law name', 'info.mil']] : []), [hi ? 'संपर्क नम्बर' : 'Contact number', '@mobile']];
  const edu = findItem(S[secIndex('info')].items, it => it.t === 'tbl' && it.id === 'edu');
  const assess = S[secIndex('assess')], hon = findItem(S[secIndex('honesty')].items, it => it.t === 'card' && it.hr), lic = S[secIndex('licence')];
  const decl = d['licence.hasDL'] === 'नहीं';
  const approve = async () => { setBusy(true); setMsg(null);
    try { await api(`/api/candidates/${c.id}/rm`, { body: { remark, signature: files['rm.sig'] || null, interview: Object.fromEntries(Object.entries(d).filter(([k2]) => k2.startsWith('iv.rm.'))) } });
      toast(d['iv.rm.result'] === 'Rejected' ? TX('Application rejected', 'आवेदन अस्वीकृत') : TX('Approved and sent to HO Recruitment', 'अनुमोदित — HO भर्ती टीम को भेजा गया')); onDone('queue'); }
    catch (x) { setBusy(false); setMsg(<div className="note">{x.message}</div>); } };
  const sendBack = async () => { try { await api(`/api/candidates/${c.id}/return`, { body: { reason } }); toast(TX('Sent back to HRSM', 'HRSM को वापस भेजा गया')); onDone('queue'); } catch (x) { setSbMsg(<div className="note">{x.message}</div>); } };
  return <>
    <section className="card"><h3>{hi ? 'अभ्यर्थी का विवरण' : 'Candidate details'}</h3><div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>{d['@photo'] && <img src={d['@photo']} alt="" style={{ width: 96, height: 120, objectFit: 'cover', borderRadius: 6 }} />}
      <dl className="facts" style={{ flex: 1, minWidth: 240 }}>{facts.map(([l, k2]) => <div key={k2}><dt>{l}</dt><dd>{k2 === '@dob' ? fmtD(d[k2]) : v(k2)}</dd></div>)}<div><dt>{hi ? 'स्थायी पता' : 'Permanent address'}</dt><dd>{addr('p')}</dd></div><div><dt>{hi ? 'अस्थायी पता' : 'Temporary address'}</dt><dd>{addr('t')}</dd></div></dl></div></section>
    <section className="card sec on"><h3>{hi ? 'शैक्षिक योग्यता' : 'Qualification'}</h3><Items sec="info" items={[edu]} /></section>
    <section className="card sec on"><h3>{hi ? 'इंटरव्यू मूल्यांकन' : 'Interview assessment'}</h3><Items sec="assess" items={assess.items} />{hon && <Items sec="honesty" items={[hon]} />}</section>
    {decl ? <section className="sec on"><h3 style={{ margin: '18px 0 8px' }}>{hi ? 'DL / LL घोषणा पत्र (अभ्यर्थी द्वारा भरा गया)' : 'DL / LL declarations (filled by the candidate)'}</h3><Items sec="licence" items={lic.items} /></section>
      : <section className="card"><p style={{ margin: 0 }}>{hi ? 'अभ्यर्थी के पास ड्राइविंग लाइसेंस है — कोई DL/LL घोषणा नहीं।' : 'The candidate has a driving licence — no DL/LL declaration.'}{(d['licence.dlFile'] || []).length ? ' ' + TX('DL uploaded.', 'DL अपलोड है।') : ''}</p></section>}
    {canAct && <><InterviewCard who="rm" editable />
      <section className="card hrbox"><h3>{hi ? 'RM / DRM निर्णय' : 'RM / DRM decision'}</h3><p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--muted)' }}>{hi ? 'ऊपर इंटरव्यू मूल्यांकन में "चयनित" या "अस्वीकृत" चुनें। चयनित पर हस्ताक्षर ज़रूरी है।' : 'Choose Selected or Rejected in the interview assessment above. A signature is required to select.'}</p>
        <div className="grid"><div className="fld full"><label htmlFor="rmRemark">{hi ? 'RM / DRM टिप्पणी' : 'RM / DRM remark'}</label><textarea id="rmRemark" value={remark} onChange={e => setRemark(e.target.value)} /></div></div>
        <div className="foot-row" style={{ justifyContent: 'flex-start' }}><button className="btn pri" id="rmApprove" disabled={busy} onClick={approve}>{d['iv.rm.result'] === 'Rejected' ? TX('Reject application', 'आवेदन अस्वीकृत करें') : TX('Approve → HO Recruitment', 'अनुमोदन करें → HO भर्ती टीम')}</button></div><div id="rmMsg">{msg}</div>
        <details className="sendback"><summary>{hi ? 'HRSM को वापस भेजें' : 'Send back to HRSM'}</summary><div className="grid"><div className="fld full"><label htmlFor="sbReason">{hi ? 'वापस भेजने का कारण' : 'Reason for sending back'}</label><textarea id="sbReason" value={reason} onChange={e => setReason(e.target.value)} /></div></div><button className="btn danger" id="sbBtn" onClick={sendBack}>{hi ? 'वापस भेजें' : 'Send back'}</button><div id="sbMsg">{sbMsg}</div></details></section></>}
  </>;
}

// HRSM: one TCM / PCM-CT test paper (read only) with the marks form on top
export function TestView({ id }) {
  const { LANG, TI, TX, tx } = useI18n(); const Frame = useFrame(); const toast = useToast();
  const [res, setRes] = useState(null), [err, setErr] = useState(null), [st, setSt] = useState({}), [files, setFiles] = useState({}), [cur, setCur] = useState(0);
  const [m, setM] = useState({ qr: '', w: '', c: '', rem: '' }), [msg, setMsg] = useState(null);
  useEffect(() => { api('/api/tests/' + id).then(r => { const data = { ...r.data, '@track': r.test.role, '@role': r.test.role }; setRes(r); setSt(data); setFiles(r.files || {}); setCur(secIndex('test'));
    const v = x => (x === null || x === undefined ? '' : x); setM({ qr: v(r.test.qr_mark), w: v(r.test.written), c: v(r.test.case_mark), rem: r.test.hr_remark || '' }); }, setErr); }, [id]);
  const opts = useMemo(() => ({ mode: 'review', readOnly: true }), []);
  if (err) return <Frame><div className="note">{err.message}</div></Frame>;
  if (!res) return <Frame><p style={{ color: 'var(--muted)' }}>{LANG === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p></Frame>;
  const t = res.test, hi = LANG === 'hi', ans = res.answers || [];
  const save = async () => { try { await api('/api/tests/' + t.id, { body: { qr_mark: m.qr, written: m.w, case_mark: m.c, remark: m.rem } }); toast(TX('Marks saved', 'अंक सहेजे गए')); setMsg(null); } catch (x) { setMsg(<div className="note">{x.message}</div>); } };
  const go = n => { setCur(clampSection(n, st, true)); window.scrollTo(0, 0); };
  const i = clampSection(cur, st, true);
  const num = (id2, key, l, max) => <div className="fld"><label htmlFor={id2}>{l}</label><input id={id2} type="number" min="0" max={max} step="0.5" value={m[key]} onChange={e => setM({ ...m, [key]: e.target.value })} /></div>;
  return <FormProvider st={st} setSt={setSt} files={files} setFiles={setFiles} opts={opts}><NavCtx.Provider value={go}>
    <Frame title={TI(S[i].id, st)} nav={<StepNav st={st} cur={i} onGo={go} review />}>
      <section className="card revbar"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><div className="eyebrow" style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600 }}>{t.ref} · {t.role} {hi ? 'टेस्ट पेपर' : 'test paper'}{t.region ? ` · ${t.region}` : ''}</div><h2 style={{ fontSize: 24 }}>{t.name || '—'}</h2><div style={{ color: 'var(--muted)', fontSize: 14 }}>{hi ? 'पिता' : 'Father'}: {t.father || '—'} · {t.mobile || ''} · {hi ? 'जमा' : 'submitted'} {fmtDT(t.submitted_at)}</div></div>
        <div><Pill cls={t.mcq_total && t.mcq_score / t.mcq_total >= 0.6 ? 'ok' : 'bad'}>MCQ {t.mcq_score} / {t.mcq_total}</Pill></div></div>
        <details open style={{ marginTop: 10 }}><summary>{hi ? 'MCQ उत्तर — अभ्यर्थी का उत्तर, सही उत्तर व अंक' : 'MCQ answers — candidate’s answer, correct answer and result'}</summary><div className="tbl-wrap" style={{ marginTop: 8 }}><table><thead><tr><th>{hi ? 'प्रश्न' : 'Q'}</th><th>{hi ? 'अभ्यर्थी का उत्तर' : 'Candidate’s answer'}</th><th>{hi ? 'सही उत्तर' : 'Correct answer'}</th><th>{hi ? 'परिणाम' : 'Result'}</th></tr></thead><tbody>
          {ans.map((a, j) => <tr key={j}><td>{a.n}</td><td>{tx(a.ans) || '—'}</td><td><b>{a.key == null ? '—' : tx(a.key)}</b></td><td>{a.key == null ? <Pill cls="hr">{hi ? 'उत्तर कुंजी लंबित' : 'Key pending'}</Pill> : !a.ans ? <Pill cls="bad">{hi ? 'उत्तर नहीं दिया' : 'Not answered'}</Pill> : a.ok ? <Pill cls="ok">✓</Pill> : <Pill cls="bad">✗</Pill>}</td></tr>)}</tbody></table></div></details>
        <div className="grid" style={{ marginTop: 10 }}>{num('tQr', 'qr', hi ? 'ऑनलाइन QR टेस्ट अंक (10 में से)' : 'Online QR test marks (out of 10)', 10)}{num('tW', 'w', hi ? 'लिखित अंक (60 में से)' : 'Written marks (out of 60)', 60)}{num('tC', 'c', hi ? 'केस स्टडी अंक (40 में से)' : 'Case study marks (out of 40)', 40)}
          <div className="fld full"><label htmlFor="tRem">{hi ? 'HRSM टिप्पणी' : 'HRSM remark'}</label><textarea id="tRem" value={m.rem} onChange={e => setM({ ...m, rem: e.target.value })} /></div></div>
        <div className="foot-row" style={{ justifyContent: 'flex-start', alignItems: 'center', marginTop: 6 }}><button className="btn pri" id="tSave" onClick={save}>{hi ? 'अंक सहेजें' : 'Save marks'}</button>{t.reviewed_by && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{hi ? 'अंतिम बार सहेजा' : 'Last saved by'} {t.reviewed_by} · {fmtDT(t.reviewed_at)}</span>}</div><div id="tMsg">{msg}</div>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>{hi ? 'नीचे पूरा टेस्ट पेपर अभ्यर्थी के उत्तरों के साथ है (केवल देखने हेतु)।' : 'The complete test paper with the candidate’s answers is below (read only).'}</p></section>
      <SectionView i={i} review onGo={go} body={<Items sec={S[i].id} items={S[i].items} />} />
    </Frame></NavCtx.Provider></FormProvider>;
}
export { labelFor, RL, vis };
