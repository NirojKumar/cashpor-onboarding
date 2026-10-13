// Automatic results shown inside the forms (test totals, grades, age, nomination share, bank account checks, policy status)
import { useForm } from '../../lib/form.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { S, secIndex } from '../../lib/flow.js';
import { prog } from '../../lib/progress.js';
import { Pill } from '../Pill.jsx';

const num = x => { const n = parseFloat(x); return isNaN(n) ? null : n; };
const Score = ({ children }) => <div className="score">{children}</div>;

export function Calc({ id }) {
  const { st } = useForm(); const { TX, TI } = useI18n();
  switch (id) {
    case 'grand': {
      const w = num(st['test.mWritten']), c = num(st['test.mCase']);
      const ok = w !== null && c !== null && w + c >= 60 && w >= 36 && c >= 24;
      return <Score>
        {w === null ? <Pill>{TX('Written: —', 'लिखित: —')}</Pill> : <Pill cls={w >= 36 ? 'ok' : 'bad'}>{TX('Written', 'लिखित')} {w}/60 · {w >= 36 ? TX('qualifies', 'उत्तीर्ण') : TX('below 36', '36 से कम')}</Pill>}
        {c === null ? <Pill>{TX('Case study: —', 'केस स्टडी: —')}</Pill> : <Pill cls={c >= 24 ? 'ok' : 'bad'}>{TX('Case study', 'केस स्टडी')} {c}/40 · {c >= 24 ? TX('qualifies', 'उत्तीर्ण') : TX('below 24', '24 से कम')}</Pill>}
        {w !== null && c !== null ? <Pill cls={ok ? 'ok' : 'bad'}>{TX('Grand total', 'कुल योग')} {w + c}/100 · {ok ? TX('selected for next level', 'अगले स्तर के लिए चयनित') : TX('not selected', 'चयनित नहीं')}</Pill> : <Pill>{TX('Grand total: —', 'कुल योग: —')}</Pill>}
      </Score>;
    }
    case 'psFinal': {
      const ps = ['psK', 'psC', 'psA', 'psB'].map(x => num(st['assess.' + x]));
      if (!ps.every(x => x !== null)) return <Score><Pill>{TX('Final grade: fill all four parameters', 'अंतिम ग्रेड: चारों मापदंड भरें')}</Pill></Score>;
      const t = ps.reduce((a, b) => a + b, 0);
      return <Score><Pill cls="ok">{TX('Final grade', 'अंतिम ग्रेड')} {(t / 4).toFixed(2)} ({TX('Total', 'कुल')} {t} ÷ 4)</Pill></Score>;
    }
    case 'mt': {
      const mt = num(st['assess.mtObt']); if (mt === null) return null;
      return <Score><Pill cls={mt >= 6 ? 'ok' : 'bad'}>{mt}/10 · {mt >= 6 ? TX('qualifies for next level', 'अगले स्तर के योग्य') : TX('below 6', '6 से कम')}</Pill></Score>;
    }
    case 'nomTotal': {
      let tot = 0, any = false; for (let r = 0; r < 4; r++) { const v = num(st[`nomination.nom.${r}.4`]); if (v !== null) { tot += v; any = true; } }
      return <Score>{!any ? <Pill>{TX('Total share: 0%', 'कुल प्रतिशत: 0%')}</Pill> : tot > 100 ? <Pill cls="bad">{TX(`Total ${tot}% — must not exceed 100%`, `कुल ${tot}% — 100% से अधिक नहीं होना चाहिए`)}</Pill> : tot === 100 ? <Pill cls="ok">{TX('Total 100% ✓', 'कुल 100% ✓')}</Pill> : <Pill cls="warn">{TX(`Total ${tot}% — ${100 - tot}% left`, `कुल ${tot}% — शेष ${100 - tot}%`)}</Pill>}</Score>;
    }
    case 'age': {
      const dob = st['@dob'];
      if (!dob) return <Score><Pill>{TX('Age: enter date of birth in the information sheet', 'आयु: सूचना शीट में जन्म तिथि भरें')}</Pill></Score>;
      const d = new Date(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
      return <Score><Pill cls={a >= 18 ? 'ok' : 'bad'}>{TX(`Age from DOB: ${a} years · ${a >= 18 ? 'more than 18 ✓' : 'under 18'}`, `जन्म तिथि से आयु: ${a} वर्ष · ${a >= 18 ? '18 से अधिक ✓' : '18 से कम'}`)}</Pill></Score>;
    }
    case 'accMatch': {
      const a1 = st['salary.acc'], a2 = st['salary.acc2']; if (!a1 || !a2) return null;
      return <Score>{a1 === a2 ? <Pill cls="ok">{TX('Account numbers match ✓', 'खाता संख्या मेल खाती है ✓')}</Pill> : <Pill cls="bad">{TX('Account numbers do not match — check again', 'खाता संख्या मेल नहीं खाती — दोबारा जाँचें')}</Pill>}</Score>;
    }
    case 'ifscOk': {
      const ifsc = st['salary.ifsc']; if (!ifsc) return null;
      return <Score>{/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) ? <Pill cls="ok">{TX('IFSC format is correct ✓', 'IFSC format सही है ✓')}</Pill> : <Pill cls="bad">{TX('IFSC must be 11 characters: 4 letters + 0 + 6 letters/digits', 'IFSC 11 अक्षर का होना चाहिए: 4 अक्षर + 0 + 6 अक्षर/अंक')}</Pill>}</Score>;
    }
    case 'policy':
      return <Score>{['nda', 'safe', 'values', 'it', 'undertaking', 'p192', 'pep'].map(pid => { const p = prog(secIndex(pid), st); return <Pill key={pid} cls={p.agTot && p.ag === p.agTot ? 'ok' : 'warn'}>{TI(pid, st)}: {p.ag}/{p.agTot}</Pill>; })}</Score>;
    default: return null;
  }
}
export { S };
