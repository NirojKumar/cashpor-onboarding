// Developer / Admin panel: reviewer accounts (with region), e-mail settings, storage & backups
import { useEffect, useRef, useState } from 'react';
import { api, fmtDT } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useToast } from '../lib/form.jsx';
import { RL } from '../lib/roles.js';
import { REGION_ZONES } from '../content/definitions.js';
import { Pill } from '../components/Pill.jsx';
import { useLoad } from './Lists.jsx';

const RegionOptions = ({ hi }) => <><option value="">{hi ? 'सभी अंचल' : 'All regions'}</option>{REGION_ZONES.map(z => <optgroup key={z.zone} label={`${z.zone} ${hi ? 'ज़ोन' : 'Zone'}`}>{z.regions.map(r => <option key={r}>{r}</option>)}</optgroup>)}</>;

export function UsersView({ me }) {
  const { LANG, TX } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const [rev, setRev] = useState(0); const reload = () => setRev(x => x + 1);
  const r = useLoad(() => api('/api/users'), [rev]);
  const [f, setF] = useState({ full_name: '', email: '', emp_code: '', username: '', role: 'HRSM', region: '', password: '' }), [msg, setMsg] = useState('');
  const [q, setQ] = useState(''), [box, setBox] = useState(null); const boxRef = useRef(null);
  useEffect(() => { if (box) boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [box]);
  const add = async e => { e.preventDefault(); try { await api('/api/users', { body: { ...f, region: ['HRSM', 'RM'].includes(f.role) ? f.region : '' } }); toast(TX('Member added', 'सदस्य जोड़ा गया')); setMsg(''); setF({ ...f, full_name: '', email: '', emp_code: '', username: '', password: '' }); reload(); } catch (x) { setMsg(x.message); } };
  const patch = async (id, body, done) => { try { await api('/api/users/' + id, { body }); toast(done); setBox(null); reload(); } catch (x) { toast(x.message); } };
  const fld = (id, key, l, type = 'text', extra = {}) => <div className="fld"><label htmlFor={id}>{l}</label><input id={id} type={type} value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} {...extra} />{extra.hintText && <span className="hint">{extra.hintText}</span>}</div>;
  const users = r.data || [];
  const shown = q ? users.filter(u => [u.full_name, u.emp_code, u.username, u.email, u.region, u.role].join(' ').toLowerCase().includes(q.toLowerCase())) : users;
  return <>
    <header className="sec-head"><div><div className="eyebrow">Admin</div><h2>{hi ? 'समीक्षक खाते' : 'Reviewer accounts'}</h2><div className="sub">{hi ? 'HRSM, RM/DRM और HO भर्ती टीम (अधिकतम 5) के सदस्य जोड़ें।' : 'Add HRSM, RM/DRM and HO Recruitment team members (up to 5).'}</div></div></header>
    <StorageCard /><MailCard />
    <section className="card"><h3>{hi ? 'नया सदस्य जोड़ें' : 'Add a member'}</h3><form id="userForm" className="grid" onSubmit={add}>
      {fld('un', 'full_name', hi ? 'पूरा नाम' : 'Full name', 'text', { required: true })}
      {fld('uem', 'email', hi ? 'ई-मेल (समीक्षा सूचना हेतु)' : 'E-mail (review alerts)', 'email', { autoComplete: 'off' })}
      {fld('uec', 'emp_code', hi ? 'कर्मचारी आईडी' : 'Employee ID', 'text', { autoComplete: 'off' })}
      {fld('uu', 'username', hi ? 'यूज़रनेम' : 'Username', 'text', { required: true, autoComplete: 'off' })}
      <div className="fld"><label htmlFor="ur">{hi ? 'पैनल' : 'Panel'}</label><select id="ur" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="HRSM">HRSM</option><option value="RM">RM / DRM</option><option value="HO">HO Recruitment Team</option><option value="ADMIN">Admin</option></select></div>
      {['HRSM', 'RM'].includes(f.role) && <div className="fld" id="urgWrap"><label htmlFor="urg">{hi ? 'अंचल (HRSM / RM / DRM)' : 'Region (HRSM / RM / DRM)'}</label><select id="urg" value={f.region} onChange={e => setF({ ...f, region: e.target.value })}><RegionOptions hi={hi} /></select><span className="hint">{hi ? 'इस अंचल के अभ्यर्थी ही दिखेंगे। "सभी अंचल" = सभी अभ्यर्थी।' : 'Sees only candidates of this region. "All regions" = sees everyone.'}</span></div>}
      {fld('upw', 'password', hi ? 'अस्थायी पासवर्ड' : 'Temporary password', 'text', { required: true, autoComplete: 'off', hintText: hi ? 'कम से कम 8 अक्षर, अक्षर व अंक दोनों। पहली बार लॉगिन पर सदस्य को अपना पासवर्ड बदलना होगा।' : 'At least 8 characters, letters and numbers. The member must change it at first sign-in.' })}
      <div className="fld full"><button className="btn pri" type="submit" style={{ alignSelf: 'flex-start' }}>{hi ? 'जोड़ें' : 'Add member'}</button><div id="userMsg">{msg && <div className="note">{msg}</div>}</div></div></form></section>
    <div className="fld" style={{ maxWidth: 360, margin: '14px 0 8px' }}><label htmlFor="usearch">{hi ? 'खोजें (नाम, ई-मेल, अंचल)' : 'Search (name, e-mail, region)'}</label><input id="usearch" type="search" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} /></div>
    {r.error ? <div className="note">{r.error.message}</div> : <div className="tbl-wrap"><table id="usersTbl"><thead><tr><th>{hi ? 'नाम' : 'Name'}</th><th>{hi ? 'कर्मचारी आईडी' : 'Employee ID'}</th><th>{hi ? 'यूज़रनेम' : 'Username'}</th><th>{hi ? 'ई-मेल' : 'E-mail'}</th><th>{hi ? 'पैनल' : 'Panel'}</th><th>{hi ? 'अंचल' : 'Region'}</th><th>{hi ? 'स्थिति' : 'Status'}</th><th>{hi ? 'अंतिम लॉगिन' : 'Last sign-in'}</th><th /></tr></thead><tbody>
      {shown.map(u => <tr key={u.id}><td><b>{u.full_name}</b></td><td>{u.emp_code || '—'}</td><td>{u.username}</td>
        <td>{u.email ? u.email : u.role === 'ADMIN' ? '—' : <Pill cls="warn">{TX('No e-mail — no alerts', 'ई-मेल नहीं — सूचना नहीं')}</Pill>} {u.role !== 'ADMIN' && <button className="btn sm" onClick={() => setBox({ kind: 'email', u, v: u.email || '' })}>{TX('Set', 'बदलें')}</button>}</td>
        <td>{RL(u.role, hi)}</td>
        <td>{u.role === 'HRSM' || u.role === 'RM' ? <>{u.region || TX('All regions', 'सभी अंचल')} <button className="btn sm" onClick={() => setBox({ kind: 'region', u, v: u.region || '' })}>{TX('Set', 'बदलें')}</button></> : u.role === 'HO' ? TX('All regions', 'सभी अंचल') : '—'}</td>
        <td>{u.active ? (u.locked_until && Date.parse(u.locked_until) > Date.now() ? <Pill cls="bad">{TX('Locked', 'लॉक')}</Pill> : <Pill cls="ok">{TX('Active', 'सक्रिय')}</Pill>) : <Pill>{TX('Inactive', 'निष्क्रिय')}</Pill>}</td>
        <td>{u.last_login ? fmtDT(u.last_login) : '—'}</td>
        <td>{u.id !== me.id && <><button className="btn sm" onClick={() => patch(u.id, { active: !u.active }, u.active ? TX('Deactivated', 'निष्क्रिय किया गया') : TX('Activated', 'सक्रिय किया गया'))}>{u.active ? TX('Deactivate', 'निष्क्रिय करें') : TX('Activate', 'सक्रिय करें')}</button> <button className="btn sm" onClick={() => setBox({ kind: 'password', u, v: '' })}>{TX('Reset password', 'पासवर्ड बदलें')}</button></>}</td></tr>)}
    </tbody></table></div>}
    <div id="pwBox" ref={boxRef}>{box && <section className="card"><form className="grid" onSubmit={e => { e.preventDefault(); patch(box.u.id, { [box.kind === 'region' ? 'region' : box.kind]: box.v }, box.kind === 'region' ? TX('Region saved', 'अंचल सहेजा गया') : box.kind === 'email' ? TX('E-mail saved', 'ई-मेल सहेजा गया') : TX('Password changed', 'पासवर्ड बदला गया')); }}>
      <div className="fld"><label htmlFor="boxv">{box.u.full_name} — {box.kind === 'region' ? TX('Region this reviewer sees', 'यह समीक्षक किस अंचल के अभ्यर्थी देखेगा') : box.kind === 'email' ? TX('E-mail for review alerts', 'समीक्षा सूचना हेतु ई-मेल') : TX('New password', 'नया पासवर्ड')}</label>
        {box.kind === 'region' ? <select id="boxv" value={box.v} onChange={e => setBox({ ...box, v: e.target.value })}><RegionOptions hi={hi} /></select> : <input id="boxv" type={box.kind === 'email' ? 'email' : 'text'} required autoFocus value={box.v} onChange={e => setBox({ ...box, v: e.target.value })} />}</div>
      <div className="fld" style={{ justifyContent: 'flex-end', flexDirection: 'row', gap: 8 }}><button className="btn pri" type="submit">{TX('Save', 'सहेजें')}</button><button className="btn" type="button" onClick={() => setBox(null)}>{TX('Cancel', 'रद्द करें')}</button></div></form></section>}</div>
  </>;
}

const mb = b => (b == null ? '—' : b > 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : (b / 1048576).toFixed(1) + ' MB');
function StorageCard() {
  const { LANG, TX } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const [rev, setRev] = useState(0), [busy, setBusy] = useState(false);
  const r = useLoad(() => api('/api/admin/storage'), [rev]);
  if (r.loading) return null;
  if (r.error) return <div className="note">{r.error.message}</div>;
  const s = r.data, last = s.backups[0];
  const backup = async () => { setBusy(true); try { await api('/api/admin/backups', { body: {} }); toast(TX('Backup done', 'बैकअप पूर्ण')); setRev(x => x + 1); } catch (x) { toast(x.message); } setBusy(false); };
  return <section className="card"><h3>{hi ? 'स्टोरेज व बैकअप' : 'Storage & backups'}</h3>
    {s.lowDisk && <div className="note"><b>{hi ? 'डिस्क लगभग भर गई है:' : 'Disk almost full:'}</b> {hi ? `केवल ${mb(s.free)} खाली है। पुराने बैकअप दूसरी जगह कॉपी करें या डिस्क बढ़ाएँ।` : `only ${mb(s.free)} free. Move old backups elsewhere or add disk space.`}</div>}
    {s.mail && !s.mail.configured && <div className="note"><b>{hi ? 'ई-मेल सेट नहीं:' : 'E-mail not set up:'}</b> {hi ? 'अभ्यर्थियों को ई-मेल अभी भेजे नहीं जा रहे — वे data/outbox में सहेजे जा रहे हैं। नीचे SMTP सेटिंग भरें।' : 'Candidate e-mails are not being sent yet — they are saved in data/outbox. Fill in the SMTP settings below.'}</div>}
    {!s.https && <div className="note"><b>{hi ? 'सुरक्षित लिंक (HTTPS) नहीं:' : 'Not on a secure link (HTTPS):'}</b> {hi ? 'असली अभ्यर्थियों से पहले README के अनुसार HTTPS चालू करें।' : 'turn on HTTPS as described in the README before real candidates use the app.'}</div>}
    <dl className="facts"><div><dt>{hi ? 'आवेदन' : 'Applications'}</dt><dd>{s.candidates} ({s.completed} {hi ? 'पूर्ण' : 'completed'})</dd></div><div><dt>{hi ? 'अपलोड की गई फाइलें' : 'Uploaded files'}</dt><dd>{s.files} · {mb(s.fileBytes)}</dd></div><div><dt>{hi ? 'डेटाबेस (MongoDB)' : 'Database (MongoDB)'}</dt><dd>{mb(s.dbBytes)}</dd></div>
      <div><dt>{hi ? 'बैकअप' : 'Backups'}</dt><dd>{s.backups.length} · {mb(s.backupBytes)} ({hi ? `${s.keepDays} दिन रखे जाते हैं` : `kept ${s.keepDays} days`})</dd></div><div><dt>{hi ? 'डिस्क पर खाली जगह' : 'Free disk space'}</dt><dd>{mb(s.free)}{s.total ? ` / ${mb(s.total)}` : ''}</dd></div><div><dt>{hi ? 'अंतिम बैकअप' : 'Last backup'}</dt><dd>{last ? fmtDT(last.at) : '—'}</dd></div></dl>
    {s.mail && <details style={{ marginTop: 8 }}><summary>{hi ? 'हाल के ई-मेल' : 'Recent e-mails'} ({s.mail.configured ? s.mail.from : (hi ? 'SMTP सेट नहीं' : 'SMTP not set up')})</summary>{s.mail.recent.length ? <div className="tbl-wrap"><table><thead><tr><th>{hi ? 'कब' : 'When'}</th><th>{hi ? 'प्रकार' : 'Type'}</th><th>{hi ? 'किसे' : 'To'}</th><th>{hi ? 'स्थिति' : 'Status'}</th></tr></thead><tbody>{s.mail.recent.map((m, i) => <tr key={i}><td>{fmtDT(m.created_at)}</td><td>{m.kind}</td><td>{m.to_addr}</td><td>{m.status === 'sent' ? <Pill cls="ok">{TX('Sent', 'भेजा')}</Pill> : m.status === 'saved' ? <Pill cls="warn">{TX('Saved to outbox', 'outbox में')}</Pill> : <><Pill cls="bad">{TX('Failed', 'विफल')}</Pill> {m.error || ''}</>}</td></tr>)}</tbody></table></div> : <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{hi ? 'अभी कोई ई-मेल नहीं।' : 'No e-mails yet.'}</p>}</details>}
    <div className="foot-row" style={{ justifyContent: 'flex-start', marginTop: 12 }}><button className="btn pri" disabled={busy} onClick={backup}>{hi ? 'अभी बैकअप लें' : 'Back up now'}</button></div>
    {s.backups.length > 0 && <details style={{ marginTop: 10 }}><summary>{hi ? 'बैकअप फाइलें डाउनलोड करें' : 'Download backup files'}</summary><ul className="files">{s.backups.slice(0, 40).map(b => <li key={b.name}><span>{b.name} · {mb(b.bytes)}</span><a className="btn sm" href={'/api/admin/backups/' + encodeURIComponent(b.name)}>{hi ? 'डाउनलोड' : 'Download'}</a></li>)}</ul></details>}
    <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>{hi ? 'सर्वर हर दिन अपने आप बैकअप लेता है। सप्ताह में एक बार एक बैकअप फाइल डाउनलोड करके किसी दूसरी सुरक्षित जगह रखें।' : 'The server backs up automatically every day. Once a week, download one backup file and keep it in a second safe place.'}</p></section>;
}

const MAIL_PRESETS = { o365: ['smtp.office365.com', 587, false, 'Microsoft 365 / Outlook'], gmail: ['smtp.gmail.com', 587, false, 'Google Workspace / Gmail'], zoho: ['smtp.zoho.in', 587, false, 'Zoho Mail (India)'] };
function MailCard() {
  const { LANG, TX } = useI18n(); const hi = LANG === 'hi';
  const [rev, setRev] = useState(0); const r = useLoad(() => api('/api/admin/mail'), [rev]);
  const [m, setM] = useState(null), [to, setTo] = useState(''), [msg, setMsg] = useState(null);
  useEffect(() => { if (r.data) setM({ host: r.data.host || '', port: r.data.port || 587, secure: !!r.data.secure, user: r.data.user || '', pass: '', from: r.data.from || '', help: r.data.help || '' }); }, [r.data]);
  if (!m) return r.error ? <div className="note">{r.error.message}</div> : null;
  const save = async e => { e.preventDefault(); setMsg(<p style={{ color: 'var(--muted)' }}>{TX('Checking…', 'जाँच हो रही है…')}</p>);
    try { const x = await api('/api/admin/mail', { body: m }); setMsg(<div className="note" style={x.warn ? undefined : { background: 'var(--green-soft)' }}>{x.warn || x.note}</div>); if (!x.warn) setRev(v => v + 1); } catch (x) { setMsg(<div className="note">{x.message}</div>); } };
  const test = async () => { setMsg(null); try { const x = await api('/api/admin/mail/test', { body: { to } }); setMsg(<div className="note" style={{ background: 'var(--green-soft)' }}>{x.status === 'sent' ? TX('Test e-mail sent — check the inbox (and the spam folder).', 'टेस्ट ई-मेल भेजा गया — इनबॉक्स (और स्पैम) देखें।') : TX('SMTP is not set up yet — the test e-mail was saved in data/outbox.', 'SMTP अभी सेट नहीं — टेस्ट ई-मेल data/outbox में सहेजा गया।')}</div>); } catch (x) { setMsg(<div className="note">{x.message}</div>); } };
  const f = (id, key, l, type = 'text', ph = '') => <div className={'fld' + (key === 'help' ? ' full' : '')}><label htmlFor={id}>{l}</label><input id={id} type={type} value={m[key]} placeholder={ph} autoComplete="off" onChange={e => setM({ ...m, [key]: e.target.value })} /></div>;
  return <section className="card"><h3>{hi ? 'अभ्यर्थी ई-मेल सेटिंग' : 'Candidate e-mail settings'} {r.data?.configured ? <Pill cls="ok">{hi ? 'चालू' : 'On'}</Pill> : <Pill cls="warn">{hi ? 'सेट नहीं' : 'Not set up'}</Pill>}</h3>
    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14 }}>{hi ? 'कंपनी के ई-मेल खाते की SMTP जानकारी भरें — इसी खाते से अभ्यर्थियों को स्वीकृति और स्वागत ई-मेल जाएंगे। Gmail / Google Workspace में सामान्य पासवर्ड की जगह “App password” बनाकर डालें।' : 'Enter the SMTP details of the company mailbox that should send the acknowledgement and welcome e-mails. For Gmail / Google Workspace use an “App password”, not the normal password.'}</p>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{Object.entries(MAIL_PRESETS).map(([key, v]) => <button key={key} className="btn sm" type="button" onClick={() => setM({ ...m, host: v[0], port: v[1], secure: v[2] })}>{v[3]}</button>)}</div>
    <form id="mailForm" className="grid" onSubmit={save}>
      {f('mHost', 'host', hi ? 'SMTP सर्वर' : 'SMTP server', 'text', 'smtp.office365.com')}
      {f('mPort', 'port', hi ? 'पोर्ट' : 'Port', 'number')}
      <div className="fld"><label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 22 }}><input type="checkbox" checked={m.secure} onChange={e => setM({ ...m, secure: e.target.checked })} /> {hi ? 'SSL (पोर्ट 465)' : 'SSL (port 465)'}</label></div>
      {f('mUser', 'user', hi ? 'ई-मेल / यूज़रनेम' : 'Mailbox / username', 'text', 'hr@cashpor.in')}
      {f('mPass', 'pass', hi ? 'पासवर्ड / ऐप पासवर्ड' : 'Password / app password', 'password', r.data?.hasPass ? (hi ? 'सहेजा हुआ — बदलने के लिए ही भरें' : 'saved — type only to change') : '')}
      {f('mFrom', 'from', hi ? 'प्रेषक (From)' : 'Sender (From)', 'text', 'CASHPOR HR <hr@cashpor.in>')}
      {f('mHelp', 'help', hi ? 'ई-मेल के नीचे सहायता पंक्ति (वैकल्पिक)' : 'Help line at the bottom of every mail (optional)', 'text', 'HR helpline: 0542-XXXXXXX · hr@cashpor.in')}
      <div className="fld full" style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}><button className="btn pri" type="submit">{hi ? 'सहेजें और जाँचें' : 'Save & check connection'}</button>
        <input type="email" placeholder={hi ? 'टेस्ट ई-मेल किसे भेजें' : 'Send a test e-mail to…'} style={{ maxWidth: 260 }} value={to} onChange={e => setTo(e.target.value)} /><button className="btn" type="button" onClick={test}>{hi ? 'टेस्ट ई-मेल भेजें' : 'Send test e-mail'}</button></div>
      <div id="mMsg" className="fld full">{msg}</div></form></section>;
}
