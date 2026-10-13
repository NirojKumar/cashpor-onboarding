// Page frame shared by the candidate app and the reviewer panels: left rail (logo, language, steps), top bar, sheet
import { useRef, useState } from 'react';
import { useI18n, LangSwitch } from '../lib/i18n.jsx';
import { useForm, useRoleLabels } from '../lib/form.jsx';
import { S, vis, isStep, stepNo, stepsTotal, prevVis, nextVis } from '../lib/flow.js';
import { prog, pct } from '../lib/progress.js';
import { LOGO } from '../content/definitions.js';
import { Html } from './Pill.jsx';
import { useDevTaps } from './DevEntry.jsx';

export function Shell({ title, brandSub, railTop, overall, nav, children }) {
  const { L, LANG } = useI18n(); const taps = useDevTaps(); const [open, setOpen] = useState(false);
  return <div className="app">
    <aside className={'rail' + (open ? ' open' : '')} id="rail" aria-label="Onboarding steps" onClick={e => { if (e.target.closest('.nav button,[data-close-rail]')) setOpen(false); }}>
      <div className="brand"><img src={LOGO} alt="CASHPOR logo" onClick={taps} /><div><b>CASHPOR</b><small>{brandSub || L('brandSub')}</small></div></div>
      <LangSwitch />
      {railTop}
      {overall != null && <div className="overall"><span id="ovText">{overall + L('done')}</span><div className="bar"><i id="ovBar" style={{ width: overall + '%' }} /></div></div>}
      {nav}
    </aside>
    <main className="main">
      <div className="topbar"><button className="btn" id="menuBtn" aria-label="Open steps" onClick={() => setOpen(o => !o)}>{L('menu')}</button><img src={LOGO} alt="" /><b id="topTitle">{title}</b></div>
      <div className="sheet" id="sheet" lang={LANG}>{children}</div>
    </main>
  </div>;
}

// the list of steps in the rail
export function StepNav({ st, cur, onGo, review }) {
  const { TI, PHL } = useI18n();
  const out = []; let lastPhase = '';
  S.forEach((s, i) => {
    if (!vis(i, st, review)) return;
    if (s.phase !== lastPhase) { out.push(<div className="phase" key={'p' + i}>{PHL(s.phase)}</div>); lastPhase = s.phase; }
    let stCls = '';
    if (!review && i > 0) { const p = pct(prog(i, st)); stCls = p === 100 ? 'done' : p > 0 ? 'part' : ''; }
    out.push(<button key={i} id={'nav' + i} className={i === cur ? 'on' : ''} onClick={() => onGo(i)}><span className="no">{isStep(i, st, review) ? stepNo(i, st, review) : ''}</span><span>{TI(s.id, st)}</span><span className={'st ' + stCls} /></button>);
  });
  return <nav className="nav" id="nav">{out}</nav>;
}

// one form section: heading, body, previous / next buttons
export function SectionView({ i, review, body, showPill = true, footer = true, onGo }) {
  const { st } = useForm(); const { L, TI, PHL, tx, TX } = useI18n(); const ref = useRef(null);
  useRoleLabels(ref, st, TX);
  const s = S[i];
  const eyebrow = (isStep(i, st, review) ? `${L('step')} ${stepNo(i, st, review)} ${L('of')} ${stepsTotal(st, review)} · ` : '') + PHL(s.phase);
  let pill = null;
  if (showPill && s.id !== 'result' && s.id !== 'welcome') {
    const p = prog(i, st), t = p.tot + p.agTot, pc = t ? Math.round((p.fill + p.ag) / t * 100) : 0;
    pill = <span className={'pill ' + (pc === 100 ? 'ok' : pc ? 'warn' : '')}>{t ? pc + L('pc') : L('office')}</span>;
  }
  const pv = prevVis(i, st, review), nx = nextVis(i, st, review);
  return <div className="sec on" id={'sec' + i} data-sec={s.id} ref={ref}>
    {s.id !== 'welcome' && <header className="sec-head"><div><div className="eyebrow">{eyebrow}</div><h2>{TI(s.id, st)}</h2><div className="sub">{s.sub ? <Html html={tx(s.sub)} /> : null}</div></div>{pill}</header>}
    {body}
    {footer && s.id !== 'welcome' && <div className="foot-row noprint"><button className="btn" onClick={() => onGo(pv)}>← {TI(S[pv].id, st)}</button>{nx > 0 && s.id !== 'choose' && <button className="btn pri" onClick={() => onGo(nx)}>{L('next')}</button>}</div>}
  </div>;
}
