// Reviewer panel (/review): HRSM · RM / DRM · HO Recruitment · Developer / Admin
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n, LangSwitch } from '../lib/i18n.jsx';
import { useToast } from '../lib/form.jsx';
import { RL } from '../lib/roles.js';
import { PANELS, PanelChooser, Login, PasswordView, ProfileView } from './Auth.jsx';
import { CandidateList, SheetView, ExamView } from './Lists.jsx';
import { CandidateView, TestView } from './Candidate.jsx';
import { UsersView } from './Admin.jsx';
import { FrameData, Frame } from './frame.jsx';

const hashPanel = () => ({ '#hrsm': 'HRSM', '#rm': 'RM', '#ho': 'HO' })[location.hash.toLowerCase().replace(/^#review-?/, '#')] || null;

export default function ReviewApp() {
  const { LANG, TX } = useI18n(); const toast = useToast(); const hi = LANG === 'hi';
  const [user, setUser] = useState(undefined);            // undefined = checking, null = signed out
  const [panel, setPanel] = useState(hashPanel);
  const [view, setView] = useState('queue');             // queue · all · sheet · exam · users · password · profile
  const [open, setOpen] = useState(null);                // { kind: 'cand' | 'test', id }
  const [dirty, setDirty] = useState(0); const [leaveSure, setLeaveSure] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => { document.documentElement.dataset.mode = 'review'; api('/api/me').then(r => setUser(r.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { if (user === null) { try { history.replaceState(null, '', panel ? '#' + panel.toLowerCase() : location.pathname); } catch { /* ignore */ } } }, [user, panel]);
  useEffect(() => { if (user) setView(user.role === 'ADMIN' ? 'users' : 'queue'); }, [user?.id]);

  // waiting-for-review pop-up and badge (every minute)
  const seen = useRef('');
  useEffect(() => {
    if (!user || !['HRSM', 'RM', 'HO'].includes(user.role) || user.must_change || user.need_profile) return;
    let stop = false;
    const poll = async () => { try { const n = await api('/api/notice'); if (stop) return; const ids = n.items.map(i => i.id).join(',');
      setNotice(prev => ({ ...n, show: n.count > 0 && ids !== seen.current && (!prev || n.count > prev.count || !prev.shown) ? true : prev?.show || false, shown: prev?.shown || n.count > 0 }));
      if (n.count) seen.current = ids; } catch { /* offline */ } };
    poll(); const t = setInterval(poll, 60000); return () => { stop = true; clearInterval(t); };
  }, [user?.id, user?.must_change, user?.need_profile]);
  useEffect(() => { document.title = (notice?.count ? `(${notice.count}) ` : '') + TX('CASHPOR Reviewer panel', 'कैशपॉर समीक्षक पैनल'); }, [notice?.count, LANG]);

  const goView = v => {
    if (dirty && open && !leaveSure) { setLeaveSure(true); toast(TX('You have unsaved changes. Click again to leave without saving.', 'बदलाव सहेजे नहीं गए। बिना सहेजे जाने के लिए फिर क्लिक करें।')); return; }
    setLeaveSure(false); setDirty(0); setOpen(null); setView(v); window.scrollTo(0, 0);
  };
  const onAuthError = useCallback(e => { if (e.status === 401) setUser(null); else if (e.data?.must_change) setUser(u => ({ ...u, must_change: true })); else if (e.data?.need_profile) setUser(u => ({ ...u, need_profile: true })); }, []);
  const logout = async () => { await api('/api/logout', { body: {} }).catch(() => {}); setUser(null); setOpen(null); setNotice(null); seen.current = ''; document.title = 'CASHPOR'; };

  /* ---------- rail: signed-in user, tabs, back ---------- */
  const tabs = !user ? [] : user.role === 'ADMIN' ? [['users', hi ? 'उपयोगकर्ता' : 'Users']] : [['queue', hi ? 'मेरी कतार' : 'My queue'], ['all', hi ? 'सभी अभ्यर्थी' : 'All candidates'],
    ...(user.role === 'HRSM' || user.role === 'HO' ? [['sheet', hi ? 'अभ्यर्थी विवरण शीट' : 'Candidate sheet']] : []), ...(user.role === 'HRSM' ? [['exam', hi ? 'परीक्षा परिणाम (TCM / PCM-CT)' : 'Exam results (TCM / PCM-CT)']] : [])];
  const railTop = user ? <div id="revRail">
    <div className="revuser"><b>{user.full_name}</b><span>{user.emp_code ? `${hi ? 'कर्मचारी आईडी' : 'Emp ID'} ${user.emp_code} · ` : ''}{RL(user.role, hi)} {hi ? 'पैनल' : 'panel'}{user.region && user.role !== 'HO' ? <> · {hi ? 'अंचल' : 'Region'} <b>{user.region}</b></> : user.role === 'HO' ? ` · ${hi ? 'सभी अंचल' : 'All regions'}` : ''}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}><button className="btn sm" id="logoutBtn" style={{ margin: 0 }} onClick={logout}>{hi ? 'लॉग आउट' : 'Sign out'}</button><button className="btn sm" style={{ margin: 0 }} onClick={() => goView('profile')}>{hi ? 'मेरा विवरण' : 'My details'}</button><button className="btn sm" style={{ margin: 0 }} onClick={() => goView('password')}>{hi ? 'पासवर्ड बदलें' : 'Change password'}</button></div></div>
    <div className="revtabs">{tabs.map(([k, t]) => <button key={k} data-view={k} className={view === k && !open ? 'on' : ''} onClick={() => goView(k)}>{t}{k === 'queue' && notice?.count ? <> <span className={'qbadge' + (notice.overdue ? ' late' : '')}>{notice.count}</span></> : null}</button>)}</div>
    {open && <button className="btn sm" id="backBtn" style={{ margin: '6px 6px 0' }} onClick={() => goView(view)}>{leaveSure ? TX('Unsaved changes — click again to leave', 'बदलाव सहेजे नहीं गए — छोड़ने के लिए फिर क्लिक करें') : `← ${hi ? 'सूची पर वापस' : 'Back to list'}`}</button>}
  </div> : <div id="revRail"><div className="revtabs">{PANELS(hi).map(x => <button key={x.k} className={panel === x.k ? 'on' : ''} onClick={() => setPanel(x.k)}>{x.n} · {x.t}</button>)}</div></div>;
  const frameData = { railTop, brandSub: TX('Reviewer panel', 'समीक्षक पैनल'), defTitle: TX('Reviewer panel', 'समीक्षक पैनल') };

  let page;
  if (user === undefined) page = <Frame />;
  else if (!user) page = <Frame>{panel ? <Login panel={panel} onPick={setPanel} onUser={u => setUser(u)} /> : <PanelChooser onPick={setPanel} />}</Frame>;
  else if (user.must_change) page = <Frame><PasswordView user={user} forced onDone={u => setUser(u)} /></Frame>;
  else if (user.need_profile) page = <Frame><ProfileView user={user} forced onDone={u => setUser(u)} /></Frame>;
  else if (open?.kind === 'cand') page = <CandidateView key={open.id} id={open.id} user={user} setDirty={setDirty} onDone={v => { setDirty(0); setOpen(null); setView(v); }} />;
  else if (open?.kind === 'test') page = <TestView key={open.id} id={open.id} />;
  else {
    const body = view === 'password' ? <PasswordView user={user} onDone={u => { setUser(u); goView(user.role === 'ADMIN' ? 'users' : 'queue'); }} onCancel={() => goView(user.role === 'ADMIN' ? 'users' : 'queue')} />
      : view === 'profile' ? <ProfileView user={user} onDone={u => { setUser(u); goView(user.role === 'ADMIN' ? 'users' : 'queue'); }} onCancel={() => goView(user.role === 'ADMIN' ? 'users' : 'queue')} />
      : view === 'users' ? <UsersView me={user} />
      : view === 'sheet' ? <SheetView onOpen={id => setOpen({ kind: 'cand', id })} />
      : view === 'exam' ? <ExamView onOpenTest={id => setOpen({ kind: 'test', id })} />
      : <CandidateList key={view} user={user} view={view} onOpen={id => setOpen({ kind: 'cand', id })} onAuthError={onAuthError} />;
    page = <Frame>{view === 'password' || view === 'profile' ? body : <><div className="welcome-top"><LangSwitch /></div><div id="viewBox">{body}</div></>}</Frame>;
  }
  return <FrameData.Provider value={frameData}>{page}{notice?.show && <NoticePop n={notice} onClose={() => setNotice({ ...notice, show: false })} onOpen={id => { setNotice({ ...notice, show: false }); setOpen({ kind: 'cand', id }); }} />}</FrameData.Provider>;
}

function NoticePop({ n, onClose, onOpen }) {
  const { LANG } = useI18n(); const hi = LANG === 'hi';
  return <div id="noticePop" role="dialog" aria-label={hi ? 'समीक्षा हेतु आवेदन' : 'Applications to review'}>
    <div className="np-head"><b>🔔 {hi ? `${n.count} आवेदन आपकी समीक्षा हेतु` : `${n.count} application${n.count > 1 ? 's' : ''} waiting for your review`}</b><button type="button" className="np-x" aria-label="Close" onClick={onClose}>✕</button></div>
    {n.overdue > 0 && <div className="np-late">{hi ? `${n.overdue} आवेदन ${n.reminderHours} घंटे से अधिक समय से लंबित — कृपया आज समीक्षा करें।` : `${n.overdue} pending for more than ${n.reminderHours} hours — please review today.`}</div>}
    <ul>{n.items.slice(0, 5).map(i => <li key={i.id}><span><b>{i.full_name || '—'}</b><small>{i.ref} · {i.post || ''} · {i.hours < 1 ? (hi ? 'अभी' : 'just now') : (hi ? `${i.hours} घंटे से` : `${i.hours} h waiting`)}</small></span><button className={'btn sm ' + (i.overdue ? 'danger' : 'pri')} onClick={() => onOpen(i.id)}>{hi ? 'खोलें' : 'Open'}</button></li>)}</ul>
    {!n.hasEmail && <div className="np-mail">{hi ? 'ई-मेल सूचना व रिमाइंडर पाने के लिए "मेरा विवरण" में अपना ई-मेल जोड़ें।' : 'Add your e-mail in “My details” to get e-mail alerts and reminders.'}</div>}
  </div>;
}
