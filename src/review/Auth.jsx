// Reviewer sign-in: choose a section (HRSM · RM / DRM · HO), sign in, change password, my details
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n, LangSwitch } from '../lib/i18n.jsx';
import { useToast } from '../lib/form.jsx';
import { RL } from '../lib/roles.js';

export const PANELS = hi => [
  { k: 'HRSM', n: '1', t: 'HRSM', who: hi ? 'HR सीनियर मैनेजर' : 'HR Senior Manager', d: hi ? 'अभ्यर्थी द्वारा जमा फॉर्म की समीक्षा व संशोधन, इंटरव्यू मूल्यांकन और HR कार्यालय उपयोग विवरण भरें, फिर RM / DRM को भेजें।' : 'Review and edit the candidate’s submitted forms, fill the interview assessment and HR office-use details, then send to RM / DRM.' },
  { k: 'RM', n: '2', t: 'RM / DRM', who: hi ? 'कोई एक RM या DRM' : 'Any one RM or DRM', d: hi ? 'अभ्यर्थी का सारांश, इंटरव्यू मूल्यांकन व DL / LL घोषणा देखें — हस्ताक्षर अपलोड कर अनुमोदन करें।' : 'See the candidate summary, interview assessment and DL / LL declarations — upload your signature and approve.' },
  { k: 'HO', n: '3', t: hi ? 'HO भर्ती टीम' : 'HO Recruitment Team', who: hi ? 'टीम का कोई एक सदस्य' : 'Any one team member', d: hi ? 'पूरी फाइल देखें, कर्मचारी आईडी, जॉइनिंग तिथि व RCS नंबर भरें और अंतिम अनुमोदन करें।' : 'See the full file, enter Employee ID, joining date and RCS No., and give final approval.' },
];

export function PanelChooser({ onPick }) {
  const { LANG } = useI18n(); const hi = LANG === 'hi';
  return <>
    <div className="welcome-top"><LangSwitch /></div>
    <header className="sec-head"><div><div className="eyebrow">CASHPOR · {hi ? 'समीक्षक पैनल' : 'Reviewer panel'}</div><h2>{hi ? 'अपना सेक्शन चुनें' : 'Choose your section'}</h2><div className="sub">{hi ? 'हर आवेदन इन तीन चरणों से होकर जाता है। अपना सेक्शन खोलें और लॉगिन करें।' : 'Every application passes through these three steps. Open your section and sign in.'}</div></div></header>
    <div className="panels3">{PANELS(hi).map(x => <button key={x.k} type="button" className={`card panel3 pick p-${x.k}`} data-panel={x.k} onClick={() => onPick(x.k)}><div className="pn">{x.n}</div><h3>{x.t}</h3><div className="who">{x.who}</div><p>{x.d}</p><span className="btn pri">{hi ? 'सेक्शन खोलें →' : 'Open section →'}</span></button>)}</div>
    <div className="foot-row" style={{ justifyContent: 'flex-start', gap: 14, marginTop: 4 }}><a href="/" style={{ fontSize: 14 }}>{hi ? '← अभ्यर्थी फॉर्म' : '← Candidate forms'}</a></div>
  </>;
}

export function Login({ panel, onPick, onUser }) {
  const { LANG, TX } = useI18n(); const hi = LANG === 'hi';
  const [u, setU] = useState(''), [p, setP] = useState(''), [msg, setMsg] = useState('');
  const P = PANELS(hi), cur = P.find(x => x.k === panel);
  const submit = async e => { e.preventDefault(); if (!panel) return setMsg(TX('Choose your panel first.', 'पहले अपना पैनल चुनें।'));
    try { const r = await api('/api/login', { body: { username: u, password: p, panel } }); onUser(r.user); } catch (x) { setMsg(x.message); } };
  return <>
    <div className="welcome-top"><LangSwitch /></div>
    <div className="seg3">{P.map(x => <button key={x.k} type="button" data-panel={x.k} className={x.k === panel ? 'on' : ''} onClick={() => onPick(x.k)}><span>{x.n}</span>{x.t}</button>)}</div>
    <header className="sec-head"><div><div className="eyebrow">{hi ? 'सेक्शन' : 'Section'} {cur ? cur.n + ' · ' : ''}{cur ? cur.t : ''}</div><h2>{cur ? cur.t : ''} {hi ? 'लॉगिन' : 'sign in'}</h2><div className="sub">{cur ? cur.d : ''}</div></div></header>
    <section className="card"><form id="loginForm" className="grid" style={{ maxWidth: 640 }} autoComplete="on" onSubmit={submit}>
      <div className="fld"><label htmlFor="lu">{hi ? 'यूज़रनेम / ई-मेल' : 'Username / e-mail'}</label><input id="lu" type="text" autoComplete="username" required autoFocus value={u} onChange={e => setU(e.target.value)} /></div>
      <div className="fld"><label htmlFor="lp">{hi ? 'पासवर्ड' : 'Password'}</label><input id="lp" type="password" autoComplete="current-password" required value={p} onChange={e => setP(e.target.value)} /></div>
      <div className="fld full" style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button className="btn pri" type="submit">{hi ? 'लॉगिन करें' : 'Sign in'}</button><button className="btn" type="button" onClick={() => onPick(null)}>{hi ? '← सभी सेक्शन' : '← All sections'}</button></div>
      <div id="loginMsg" className="fld full">{msg && <div className="note">{msg}</div>}</div></form></section>
  </>;
}

function ProfFields({ user, v, setV }) {
  const { LANG } = useI18n(); const hi = LANG === 'hi';
  return <>
    <div className="fld"><label htmlFor="pfName">{hi ? 'आपका पूरा नाम' : 'Your full name'}</label><input id="pfName" type="text" autoComplete="name" required value={v.full_name} onChange={e => setV({ ...v, full_name: e.target.value })} /></div>
    <div className="fld"><label htmlFor="pfEmp">{hi ? 'कर्मचारी आईडी' : 'Employee ID'}</label><input id="pfEmp" type="text" required={user.role !== 'ADMIN'} value={v.emp_code} onChange={e => setV({ ...v, emp_code: e.target.value })} /><span className="hint">{hi ? 'हर अनुमोदन पर “अनुमोदित — नाम (कर्मचारी आईडी)” दिखेगा' : 'Every approval will show “Approved by Name (Emp ID)”'}</span></div>
    {user.role !== 'ADMIN' && <div className="fld"><label htmlFor="pfMail">{hi ? 'ई-मेल (समीक्षा सूचना व रिमाइंडर हेतु)' : 'E-mail (for review alerts & reminders)'}</label><input id="pfMail" type="email" autoComplete="email" required value={v.email} onChange={e => setV({ ...v, email: e.target.value })} /></div>}
  </>;
}
const profInit = u => ({ full_name: u.full_name && u.full_name !== u.username ? u.full_name : '', emp_code: u.emp_code || '', email: u.email || '' });

export function ProfileView({ user, forced, onDone, onCancel }) {
  const { LANG } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const [v, setV] = useState(profInit(user)), [msg, setMsg] = useState('');
  const submit = async e => { e.preventDefault(); try { const r = await api('/api/profile', { body: { ...v, email: user.role === 'ADMIN' ? undefined : v.email } }); toast(hi ? 'विवरण सहेजा गया' : 'Details saved'); onDone(r.user); } catch (x) { setMsg(x.message); } };
  return <>
    <div className="welcome-top"><LangSwitch /></div>
    <header className="sec-head"><div><div className="eyebrow">{RL(user.role, hi)}</div><h2>{hi ? 'मेरा विवरण' : 'My details'}</h2><div className="sub">{forced ? (hi ? 'आगे बढ़ने से पहले अपना नाम, कर्मचारी आईडी और ई-मेल भरें — “अनुमोदित” में नाम व आईडी दिखेगा, और समीक्षा सूचना व रिमाइंडर आपके ई-मेल पर आएंगे।' : 'Enter your name, employee ID and e-mail before you continue — “Approved by” shows your name and ID, and review alerts and reminders go to your e-mail.') : ''}</div></div></header>
    <section className="card"><form id="profForm" className="grid" style={{ maxWidth: 720 }} onSubmit={submit}><ProfFields user={user} v={v} setV={setV} />
      <div className="fld full" style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}><button className="btn pri" type="submit">{hi ? 'सहेजें' : 'Save'}</button>{!forced && <button className="btn" type="button" onClick={onCancel}>{hi ? 'रद्द करें' : 'Cancel'}</button>}</div>
      <div id="pfMsg" className="fld full">{msg && <div className="note">{msg}</div>}</div></form></section>
  </>;
}

export function PasswordView({ user, forced, onDone, onCancel }) {
  const { LANG, TX } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const withProfile = forced && user.need_profile;
  const [v, setV] = useState(profInit(user)), [pw, setPw] = useState(['', '', '']), [msg, setMsg] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (pw[1] !== pw[2]) return setMsg(TX('The two new passwords do not match.', 'दोनों नए पासवर्ड एक जैसे नहीं हैं।'));
    try { const r = await api('/api/password', { body: { current: pw[0], password: pw[1], ...(withProfile ? { ...v, email: user.role === 'ADMIN' ? undefined : v.email } : {}) } }); toast(TX('Password changed', 'पासवर्ड बदला गया')); onDone(r.user); }
    catch (x) { setMsg(x.message); }
  };
  const pf = (i, id, l, ac, hint) => <div className="fld"><label htmlFor={id}>{l}</label><input id={id} type="password" autoComplete={ac} required value={pw[i]} onChange={e => setPw(Object.assign([...pw], { [i]: e.target.value }))} />{hint && <span className="hint">{hint}</span>}</div>;
  return <>
    <div className="welcome-top"><LangSwitch /></div>
    <header className="sec-head"><div><div className="eyebrow">{RL(user.role, hi)}</div><h2>{withProfile ? (hi ? 'अपना विवरण व नया पासवर्ड' : 'Your details & new password') : (hi ? 'नया पासवर्ड चुनें' : 'Choose a new password')}</h2><div className="sub">{forced ? (hi ? 'सुरक्षा के लिए, आगे बढ़ने से पहले अपना पासवर्ड बदलें।' : 'For security, set your own password before you continue.') : ''}</div></div></header>
    <section className="card"><form id="pwChange" className="grid" style={{ maxWidth: 720 }} onSubmit={submit}>
      {withProfile && <><ProfFields user={user} v={v} setV={setV} /><div className="fld full" style={{ borderTop: '1px solid var(--line)', margin: '4px 0' }} /></>}
      {pf(0, 'pc0', hi ? 'वर्तमान पासवर्ड' : 'Current password', 'current-password')}
      {pf(1, 'pc1', hi ? 'नया पासवर्ड' : 'New password', 'new-password', hi ? 'कम से कम 8 अक्षर, जिसमें अक्षर और अंक दोनों हों' : 'At least 8 characters, with both letters and numbers')}
      {pf(2, 'pc2', hi ? 'नया पासवर्ड दोबारा' : 'New password again', 'new-password')}
      <div className="fld full" style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}><button className="btn pri" type="submit">{hi ? 'पासवर्ड बदलें' : 'Change password'}</button>{!forced && <button className="btn" type="button" onClick={onCancel}>{hi ? 'रद्द करें' : 'Cancel'}</button>}</div>
      <div id="pcMsg" className="fld full">{msg && <div className="note">{msg}</div>}</div></form></section>
  </>;
}
export { useEffect };
