// Interview assessment sheet (HRSM / RM-DRM), approvals, application history and the list of HRSM changes
import { useForm } from '../lib/form.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { fmtDT, fmtD } from '../lib/api.js';
import { RL, short } from '../lib/roles.js';
import { Pill } from '../components/Pill.jsx';
import { SigBox } from '../components/form/parts.jsx';

export const IVP = [['app', 'Appearance'], ['pres', 'Presentation Skills'], ['comm', 'Communication Skills'], ['subj', 'Subject Knowledge']];
const IVL = { 4: ['G-4', 'Very Good', 'बहुत अच्छा'], 3: ['G-3', 'Good', 'अच्छा'], 2: ['G-2', 'Average', 'औसत'], 1: ['G-1', 'Below Average', 'औसत से कम'] };
export function ivGrade(who, st, hi) {
  const v = IVP.map(([x]) => +st[`iv.${who}.${x}`]).filter(Boolean); if (v.length < 4) return '—';
  const sum = v.reduce((a, b) => a + b, 0), g = Math.round(sum / 4);
  return `${IVL[g][0]} · ${hi ? IVL[g][2] : IVL[g][1]} (${sum}/16)`;
}
export const ivDefaults = (who, user) => ({ [`iv.${who}.name`]: user.full_name, [`iv.${who}.pos`]: who === 'hr' ? 'HRSM' : (user.role === 'RM' ? 'RM / DRM' : ''), [`iv.${who}.dept`]: who === 'hr' ? 'HRD' : 'OPERATION', [`iv.${who}.date`]: new Date().toISOString().slice(0, 10) });

export function InterviewCard({ who, editable }) {
  const { st, files, set } = useForm(); const { LANG } = useI18n(); const hi = LANG === 'hi';
  const post = st['@rrole'] || st['@role'] || st['@post'] || '', key = x => `iv.${who}.${x}`, val = x => st[key(x)] || '';
  if (!editable && !IVP.some(([x]) => val(x)) && !val('result')) return null;
  const title = who === 'hr' ? (hi ? 'HRSM इंटरव्यू मूल्यांकन' : 'HRSM Interview Assessment') : (hi ? 'RM / DRM इंटरव्यू मूल्यांकन' : 'RM / DRM Interview Assessment');
  const resPill = val('result') ? <Pill cls={val('result') === 'Selected' ? 'ok' : 'bad'}>{val('result') === 'Selected' ? (hi ? 'चयनित' : 'Selected') : (hi ? 'अस्वीकृत' : 'Rejected')}</Pill> : '—';
  const sel = x => editable ? <select aria-label={x} value={val(x)} onChange={e => set(key(x), e.target.value)}><option value="">—</option>{[4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}</select> : <b>{val(x) || '—'}</b>;
  const inp = (x, l, type = 'text') => <div className="fld"><label>{l}</label>{editable ? <input type={type} value={val(x)} onChange={e => set(key(x), e.target.value)} /> : <div><b>{type === 'date' ? fmtD(val(x)) : val(x) || '—'}</b></div>}</div>;
  const sigKey = who === 'hr' ? 'hr.sig' : 'rm.sig';
  return <section className="card ivcard" data-iv={who}><h3>{title}</h3><p style={{ margin: '-4px 0 8px', color: 'var(--muted)', fontSize: 13.5 }}>Interview Assessment sheet for the position of <b>{post || '—'}</b></p>
    <div className="tbl-wrap"><table className="ivtbl"><thead><tr><th>S.No.</th><th>Candidate's Name</th><th>Father's Name</th><th>Position</th>{IVP.map(([x, l]) => <th key={x}>{l}</th>)}<th>Grade</th><th>Remarks<br /><small>Selected / Rejected</small></th></tr></thead>
      <tbody><tr><td>1</td><td>{st['@name'] || '—'}</td><td>{st['@father'] || '—'}</td><td>{post || '—'}</td>{IVP.map(([x]) => <td key={x}>{sel(x)}</td>)}<td data-ivgrade={who}><b>{ivGrade(who, st, hi)}</b></td><td data-ivres={who}>{resPill}</td></tr></tbody></table></div>
    {editable && <div className="fld" style={{ marginTop: 10 }}><span className="lbl">{hi ? 'निर्णय (Remarks: Selected / Rejected)' : 'Decision (Remarks: Selected / Rejected)'}</span>
      <div className="opts ivres">{['Selected', 'Rejected'].map(o => <label key={o}><input type="radio" name={key('result')} value={o} checked={val('result') === o} onChange={() => set(key('result'), o)} />{o === 'Selected' ? (hi ? 'चयनित (Selected)' : 'Selected') : (hi ? 'अस्वीकृत (Rejected)' : 'Rejected')}</label>)}</div></div>}
    <div className="ivfoot"><table className="ivleg"><thead><tr><th>Marks</th><th>Grade</th><th>Level</th></tr></thead><tbody>{[4, 3, 2, 1].map(n => <tr key={n}><td>{n}</td><td>{IVL[n][0]}</td><td>{IVL[n][1]}</td></tr>)}</tbody></table>
      <div className="grid" style={{ flex: 1, minWidth: 260 }}>{inp('name', hi ? 'साक्षात्कारकर्ता का नाम (Name of Interviewer)' : 'Name of Interviewer')}{inp('pos', hi ? 'पद (Position)' : 'Position')}{inp('dept', hi ? 'विभाग (Department)' : 'Department')}{inp('date', hi ? 'साक्षात्कार की तिथि' : 'Date of Interview', 'date')}
        <div className="fld"><span className="lbl">{hi ? 'हस्ताक्षर (Signature)' : 'Signature'}</span>{editable ? <SigBox k={sigKey} readOnly={false} /> : files[sigKey] ? <img src={files[sigKey]} alt="" style={{ height: 40, background: '#fff', padding: 2, borderRadius: 4 }} /> : '—'}</div></div></div></section>;
}

export function HistoryTable({ history }) {
  const { LANG, TX } = useI18n(); const hi = LANG === 'hi';
  if (!history || !history.length) return null;
  const A = { submitted: TX('Submitted by candidate', 'अभ्यर्थी द्वारा जमा'), approved: TX('Approved', 'अनुमोदित'), returned: TX('Sent back to HRSM (revert)', 'HRSM को वापस भेजा (रिवर्ट)'), rejected: TX('Rejected', 'अस्वीकृत'), emailed: TX('E-mail to candidate', 'अभ्यर्थी को ई-मेल'), reminded: TX('Review reminder e-mail', 'समीक्षा रिमाइंडर ई-मेल') };
  return <><h3 style={{ fontSize: 15, marginTop: 14 }}>{hi ? 'आवेदन का इतिहास' : 'Application history'}</h3><div className="tbl-wrap"><table><thead><tr><th>{hi ? 'कब' : 'When'}</th><th>{hi ? 'क्या हुआ' : 'What happened'}</th><th>{hi ? 'किसने' : 'By'}</th><th>{hi ? 'टिप्पणी' : 'Remark'}</th></tr></thead>
    <tbody>{history.map((x, i) => <tr key={i}><td>{fmtDT(x.at)}</td><td>{A[x.action] || x.action}</td><td>{x.by}{x.by_role ? ` (${RL(x.by_role, hi)})` : ''}</td><td style={{ whiteSpace: 'normal' }}>{x.remark || ''}</td></tr>)}</tbody></table></div></>;
}

export function EditsTable({ edits, labelFor }) {
  const { LANG } = useI18n(); const hi = LANG === 'hi';
  if (!edits || !edits.length) return null;
  return <><h3 style={{ fontSize: 15, marginTop: 14 }}>{hi ? 'HR द्वारा किए गए बदलाव' : 'Changes made by HR'} ({edits.length})</h3><div className="tbl-wrap"><table><thead><tr><th>{hi ? 'फील्ड' : 'Field'}</th><th>{hi ? 'पहले' : 'Before'}</th><th>{hi ? 'बाद में' : 'After'}</th><th>{hi ? 'किसने' : 'By'}</th><th>{hi ? 'कब' : 'When'}</th></tr></thead>
    <tbody>{edits.map((e, i) => <tr key={i}><td>{labelFor ? labelFor(e.field_key) : e.field_key}</td><td style={{ whiteSpace: 'normal' }}>{short(e.old_value)}</td><td style={{ whiteSpace: 'normal' }}>{short(e.new_value)}</td><td>{e.by} ({e.by_role})</td><td>{fmtDT(e.edited_at)}</td></tr>)}</tbody></table></div></>;
}

// remarks of each panel, shown above the forms (and in the PDF)
export function ApprovalsInline({ c, user }) {
  const { files } = useForm(); const { LANG, TX } = useI18n(); const hi = LANG === 'hi';
  const b = (t, who, at, txt, extra) => who ? <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}><b>{t}</b> · {who} · <span style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDT(at)}</span><div style={{ whiteSpace: 'pre-wrap' }}>{txt || '—'}</div>{extra}</div> : null;
  return <>
    {c.status === 'rejected' && <div className="note" style={{ marginTop: 10, background: 'var(--red-soft,#fde8e8)' }}><b>{hi ? 'आवेदन अस्वीकृत' : 'Application rejected'}</b> · {c.rejected_by || ''} ({RL(c.rejected_role, hi) || ''}) · {fmtDT(c.rejected_at)}<br />{c.reject_remark || ''}</div>}
    {b(hi ? 'HRSM टिप्पणी' : 'HRSM remark', c.hr_by, c.hr_at, c.hr_remark)}
    {b(hi ? 'RM / DRM टिप्पणी' : 'RM / DRM remark', c.rm_by, c.rm_at, c.rm_remark, files['rm.sig'] ? <img src={files['rm.sig']} alt="RM / DRM signature" style={{ height: 44, marginTop: 4, background: '#fff', padding: 2, borderRadius: 4 }} /> : null)}
    <InterviewCard who="hr" editable={false} />
    {!(user && user.role === 'RM' && c.status === 'hr_approved') && <InterviewCard who="rm" editable={false} />}
    {c.status === 'completed' && b(hi ? 'HO भर्ती' : 'HO Recruitment', c.ho_by, c.ho_at, `${TX('Employee ID', 'कर्मचारी आईडी')}: ${c.employee_id} · ${TX('Joining date', 'जॉइनिंग तिथि')}: ${fmtD(c.joining_date)}${c.rcs_no ? ' · RCS No.: ' + c.rcs_no : ''}${c.ho_remark ? ' · ' + c.ho_remark : ''}`)}
  </>;
}

// "Review & approvals" block at the end of the candidate PDF
export function ApprovalsPrint({ c, edits, history, labelFor }) {
  const { files } = useForm(); const { LANG } = useI18n(); const hi = LANG === 'hi';
  const row = (t, who, at, body) => <div style={{ borderLeft: '3px solid var(--green)', padding: '6px 12px', margin: '8px 0' }}><b>{t}</b>{who ? ` · ${who}` : ''}{at ? <> · <span style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDT(at)}</span></> : null}<div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{body || '—'}</div></div>;
  return <div className="sec"><h3>{hi ? 'समीक्षा व अनुमोदन' : 'Review & approvals'}</h3>
    {row('HRSM', c.hr_by, c.hr_at, c.hr_remark || '')}
    {row('RM / DRM', c.rm_by, c.rm_at, <>{c.rm_remark || ''}{files['rm.sig'] ? <div style={{ marginTop: 6 }}><img src={files['rm.sig']} alt="RM / DRM signature" style={{ height: 48, background: '#fff', padding: 2, borderRadius: 4 }} /></div> : null}</>)}
    {row(hi ? 'HO भर्ती टीम' : 'HO Recruitment', c.ho_by, c.ho_at, c.status === 'completed' ? <>{hi ? 'कर्मचारी आईडी' : 'Employee ID'}: <b>{c.employee_id}</b> · {hi ? 'जॉइनिंग तिथि' : 'Joining date'}: <b>{fmtD(c.joining_date)}</b>{c.rcs_no ? <> · RCS No.: <b>{c.rcs_no}</b></> : null}{c.ho_remark ? <><br />{c.ho_remark}</> : null}</> : '')}
    {c.status === 'rejected' && <div style={{ borderLeft: '3px solid var(--red)', padding: '6px 12px', margin: '8px 0' }}><b>{hi ? 'अस्वीकृत' : 'Rejected'}</b> · {c.rejected_by || ''} ({RL(c.rejected_role, hi) || ''}) · <span style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDT(c.rejected_at)}</span><div style={{ whiteSpace: 'pre-wrap' }}>{c.reject_remark || ''}</div></div>}
    <InterviewCard who="hr" editable={false} /><InterviewCard who="rm" editable={false} />
    <HistoryTable history={history} />
    <EditsTable edits={edits} labelFor={labelFor} />
  </div>;
}
