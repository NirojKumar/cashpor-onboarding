// The candidate's onboarding: choose New Join / Rejoin / TCM / PCM-CT, fill every form, upload documents, submit.
// Answers stay on the device (localStorage, files in IndexedDB) until the candidate submits.
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FormProvider } from '../lib/form.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { IDB } from '../lib/files.js';
import { S, vis, clampSection } from '../lib/flow.js';
import { overall } from '../lib/progress.js';
import { Items } from '../components/form/Items.jsx';
import { Shell, StepNav, SectionView } from '../components/Shell.jsx';
import { Pill } from '../components/Pill.jsx';
import { NavCtx } from './nav.js';
import { Welcome, Choose, ReviewSubmit } from './Pages.jsx';
import { TestResult } from './TestBox.jsx';

const KEY = 'cashpor-onboarding-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };

export function CandidateApp() {
  const { TI, TX } = useI18n();
  const [st, setSt] = useState(load);
  const [files, setFiles] = useState({});
  const [cur, setCur] = useState(() => { try { return +localStorage.getItem(KEY + '-pos') || 0; } catch { return 0; } });
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => { IDB.all().then(all => setFiles(f => ({ ...all, ...f }))); }, []);
  useEffect(() => { const t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* storage full */ } }, 150); return () => clearTimeout(t); }, [st]);
  // the current section disappears when the choice changes (e.g. TCM → New Join): move to a visible one
  const i = clampSection(cur, st, false);
  useEffect(() => { if (i !== cur) setCur(i); }, [i, cur]);
  const go = n => { const x = clampSection(n, st, false); setCur(x); try { localStorage.setItem(KEY + '-pos', x); } catch { /* ignore */ } window.scrollTo(0, 0); };
  // "Save PDF" prints every form, not only the open one
  useEffect(() => {
    const before = () => flushSync(() => setPrintAll(true)), after = () => setPrintAll(false);
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);
  useEffect(() => { document.documentElement.dataset.mode = 'candidate'; }, []);

  const opts = useMemo(() => ({ mode: 'candidate', hideHr: true, persistFiles: true }), []);
  const track = st['@track'];
  const TRK = { 'New Join': TX('New Join', 'नई जॉइनिंग'), Rejoin: TX('Rejoin', 'पुनः जॉइनिंग') };
  const chip = track ? <Pill cls={track === 'Rejoin' ? 'warn' : 'ok'}>{TRK[track] || track}</Pill> : null;
  const testLocked = !!(st['@role'] && st['test.sub.' + st['@role']]);

  const body = idx => {
    const s = S[idx];
    if (s.id === 'welcome') return <Welcome />;
    if (s.id === 'choose') return <Choose />;
    if (s.id === 'review') return <ReviewSubmit />;
    if (s.id === 'result') return <TestResult />;
    return <Items sec={s.id} items={s.items} ctx={s.id === 'test' && testLocked ? { readOnly: true } : {}} />;
  };
  const shown = printAll ? S.map((_, j) => j).filter(j => vis(j, st) && j > 0) : [i];
  return <FormProvider st={st} setSt={setSt} files={files} setFiles={setFiles} opts={opts}>
    <NavCtx.Provider value={go}>
      <Shell title={TI(S[i].id, st)} railTop={<div id="choiceChip" className="chiprow">{chip}</div>} overall={overall(st)} nav={<StepNav st={st} cur={i} onGo={go} />}>
        {shown.map(j => <SectionView key={j} i={j} body={body(j)} onGo={go} />)}
      </Shell>
    </NavCtx.Provider>
  </FormProvider>;
}
