// TCM / PCM-CT test: submit box at the end of the paper, and the result page
import { useState } from 'react';
import { useForm, useToast } from '../lib/form.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useNav } from './nav.js';
import { mcqList, MATH_KEY, numOf } from '../lib/mcq.js';
import { secIndex } from '../lib/flow.js';
import { Pill, Html } from '../components/Pill.jsx';
import { ThankYou } from './ThankYou.jsx';

export function TestSubmitBox() {
  const { st, files, set } = useForm(); const { LANG, tx, TX } = useI18n(); const toast = useToast(); const go = useNav();
  const [confirm, setConfirm] = useState(false), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const hi = LANG === 'hi', role = st['@role'], sub = role ? st['test.sub.' + role] : null;
  if (!role) return null;
  if (sub) return <section className="card noprint" id="testSubmitBox"><h3>{hi ? 'टेस्ट जमा हो गया' : 'Test submitted'} <Pill cls="ok">✓</Pill></h3>
    <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>{hi ? 'जमा करने का समय' : 'Submitted on'}: {new Date(sub).toLocaleString('en-IN')} · {hi ? 'उत्तर अब बदले नहीं जा सकते।' : 'Answers are now locked.'}</p>
    <button className="btn pri" onClick={() => go(secIndex('result'))}>{hi ? 'परिणाम देखें →' : 'See result →'}</button></section>;
  const submit = async () => {
    if (!st['@name'] || !st['@father'] || !st['@mobile'] || !st['@region']) return setMsg(hi ? 'टेस्ट पेपर के ऊपर अपना नाम, पिता का नाम, मोबाइल नम्बर और अंचल भरें।' : 'Fill your name, father’s name, mobile number and region at the top of the test paper.');
    setBusy(true);
    const qs = mcqList(role, st, tx, TX);
    const answers = qs.map(q => ({ q: q.id, n: (String(q.label).match(/^\s*(\d+)/) || [])[1] || q.id, ans: q.ans || '', key: q.key, ok: q.key !== null && q.ans === q.key }));
    const score = qs.reduce((n, q) => n + (q.key !== null && q.ans === q.key ? q.marks : 0), 0), total = qs.reduce((n, q) => n + (q.key !== null ? q.marks : 0), 0);
    const sigs = {}; Object.keys(files).forEach(x => { if (/sig/i.test(x) && typeof files[x] === 'string') sigs[x] = files[x]; });
    try {
      const r = await fetch('/api/test-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: st, files: sigs, mcq: { score, total, answers } }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || ('Error ' + r.status));
      set('test.sub.' + role, new Date().toISOString(), { ['test.ref.' + role]: j.ref });
      toast(hi ? 'टेस्ट जमा हो गया' : 'Test submitted'); go(secIndex('result'));
    } catch (x) { setBusy(false); setMsg(<><b>{hi ? 'जमा नहीं हुआ।' : 'Not submitted.'}</b> {x.message}</>); }
  };
  return <section className="card noprint" id="testSubmitBox"><h3>{hi ? 'टेस्ट जमा करें' : 'Submit test'}</h3>
    <p style={{ margin: '0 0 10px', maxWidth: '65ch' }}>{hi ? 'सभी प्रश्नों के उत्तर जाँच लें। जमा करने के बाद उत्तर बदले नहीं जा सकते और आपको सही उत्तर व प्राप्तांक दिखाए जाएंगे।' : 'Check all your answers. After you submit, answers cannot be changed and you will see the correct answers and your marks.'}</p>
    <button className="btn pri" id="testSubmit" onClick={() => setConfirm(true)}>{hi ? 'टेस्ट जमा करें' : 'Submit test'}</button>
    {confirm && <div className="confirm" id="testConfirm"><span>{hi ? 'क्या आप टेस्ट जमा करना चाहते हैं? इसके बाद उत्तर बदले नहीं जा सकेंगे।' : 'Submit the test now? You will not be able to change your answers.'}</span>
      <button className="btn pri" id="testYes" disabled={busy} onClick={submit}>{hi ? 'हाँ, जमा करें' : 'Yes, submit'}</button><button className="btn" onClick={() => { setConfirm(false); setMsg(null); }}>{hi ? 'नहीं, वापस जाएँ' : 'Not yet'}</button></div>}
    {msg && <div className="note">{msg}</div>}</section>;
}

export function TestResult() {
  const { st, set } = useForm(); const { LANG, tx, TX } = useI18n(); const go = useNav(); const [reopen, setReopen] = useState(false);
  const hi = LANG === 'hi', role = st['@role'], sub = role ? st['test.sub.' + role] : null;
  if (!role || !sub) return <section className="card"><div className="note">{hi ? 'परिणाम टेस्ट जमा करने के बाद ही दिखेगा।' : 'Your result appears only after you submit the test.'}</div><button className="btn pri" onClick={() => go(secIndex('test'))}>{hi ? 'टेस्ट पेपर पर जाएँ →' : 'Go to test paper →'}</button></section>;
  const qs = mcqList(role, st, tx, TX); let got = 0, tot = 0, ok = 0, bad = 0, blank = 0, pend = 0;
  const rows = qs.map(q => {
    let res, mk;
    if (q.key === null) { pend++; res = <Pill cls="hr">{hi ? 'उत्तर कुंजी लंबित' : 'Answer key pending'}</Pill>; mk = '—'; }
    else { tot += q.marks; if (!q.ans) { blank++; res = <Pill cls="bad">{hi ? 'उत्तर नहीं दिया' : 'Not answered'}</Pill>; mk = '0'; }
      else if (q.ans === q.key) { ok++; got += q.marks; res = <Pill cls="ok">✓ {hi ? 'सही' : 'Correct'}</Pill>; mk = q.marks; }
      else { bad++; res = <Pill cls="bad">✗ {hi ? 'गलत' : 'Wrong'}</Pill>; mk = '0'; } }
    return <tr key={q.id}><td style={{ whiteSpace: 'normal', minWidth: 260 }}><Html html={tx(q.label)} /></td><td><Html html={tx(q.ans) || '—'} /></td><td><b>{q.key === null ? '—' : <Html html={tx(q.key)} />}</b></td><td>{res}</td><td style={{ textAlign: 'right' }}>{mk} / {q.marks}</td></tr>;
  });
  const num = x => { const n = parseFloat(x); return isNaN(n) ? null : n; };
  const w = num(st['test.mWritten']), c = num(st['test.mCase']), pct = tot ? Math.round(got / tot * 100) : 0;
  const qual = w !== null && c !== null && w + c >= 60 && w >= 36 && c >= 24;
  return <>
    <ThankYou kind="test" />
    <section className="card"><h3>{role} {hi ? 'टेस्ट पेपर — परिणाम' : 'Test Paper — Result'}</h3>
      <dl className="facts"><div><dt>{hi ? 'नाम' : 'Name'}</dt><dd>{st['@name'] || '—'}</dd></div><div><dt>{hi ? 'जमा करने का समय' : 'Submitted'}</dt><dd>{new Date(sub).toLocaleString('en-IN')}</dd></div><div><dt>{hi ? 'मोबाइल' : 'Mobile'}</dt><dd>{st['@mobile'] || '—'}</dd></div></dl>
      <div className="score" style={{ marginTop: 14 }}><Pill cls={pct >= 60 ? 'ok' : 'bad'}>{hi ? 'MCQ प्राप्तांक' : 'MCQ marks obtained'}: {got} / {tot}</Pill><Pill cls="ok">{hi ? 'सही' : 'Correct'}: {ok}</Pill><Pill cls="bad">{hi ? 'गलत' : 'Wrong'}: {bad}</Pill><Pill>{hi ? 'खाली' : 'Not answered'}: {blank}</Pill>{pend ? <Pill cls="hr">{hi ? 'उत्तर कुंजी लंबित' : 'Key pending'}: {pend}</Pill> : null}</div></section>
    <section className="card"><h3>{hi ? 'MCQ उत्तर विवरण' : 'MCQ answers'}</h3><div className="tbl-wrap"><table><thead><tr><th>{hi ? 'प्रश्न' : 'Question'}</th><th>{hi ? 'आपका उत्तर' : 'Your answer'}</th><th>{hi ? 'सही उत्तर' : 'Correct answer'}</th><th>{hi ? 'परिणाम' : 'Result'}</th><th style={{ textAlign: 'right' }}>{hi ? 'अंक' : 'Marks'}</th></tr></thead><tbody>{rows}</tbody></table></div></section>
    <section className="card"><h3>{hi ? 'गणित — मॉडल उत्तर' : 'Maths — model answers'}</h3>
      <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14 }}>{hi ? 'कॉपी चेकर की सहायता के लिए। अंतिम अंक HR द्वारा दिए जाएंगे।' : 'A guide for the copy checker. Final marks are given by HR.'}</p>
      <div className="tbl-wrap"><table><thead><tr><th>{hi ? 'प्रश्न' : 'Q'}</th><th>{hi ? 'आपका उत्तर' : 'Your answer'}</th><th>{hi ? 'मॉडल उत्तर' : 'Model answer'}</th><th>{hi ? 'मिलान' : 'Match'}</th></tr></thead><tbody>
        {Object.entries(MATH_KEY[role]).map(([qid, [ans, no]]) => { const a = st['test.' + qid], n = numOf(a), m = n !== null && Math.abs(n - parseFloat(ans)) < 0.6;
          return <tr key={qid}><td>{no}</td><td style={{ whiteSpace: 'normal' }}>{a || '—'}</td><td><b>{ans}</b></td><td>{!a ? <Pill cls="bad">{hi ? 'उत्तर नहीं दिया' : 'Not answered'}</Pill> : m ? <Pill cls="ok">✓ {hi ? 'मेल खाता है' : 'Matches'}</Pill> : <Pill cls="warn">{hi ? 'जाँचें' : 'Check'}</Pill>}</td></tr>; })}
      </tbody></table></div></section>
    <section className="card"><h3>{hi ? 'लिखित व केस स्टडी (HR द्वारा जाँच)' : 'Written & case study (checked by HR)'}</h3>
      <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14 }}>{hi ? 'गणित, हैंड राइटिंग, अनुवाद और केस स्टडी की जाँच कॉपी चेकर करते हैं। कुल अंक नीचे दिखेंगे।' : 'Maths, handwriting, translation and the case study are marked by the copy checker. Their marks show here once entered.'}</p>
      <div className="score">{w === null ? <Pill>{hi ? 'लिखित: अभी जाँच नहीं हुई' : 'Written: not marked yet'}</Pill> : <Pill cls={w >= 36 ? 'ok' : 'bad'}>{hi ? 'लिखित' : 'Written'} {w}/60</Pill>}{c === null ? <Pill>{hi ? 'केस स्टडी: अभी जाँच नहीं हुई' : 'Case study: not marked yet'}</Pill> : <Pill cls={c >= 24 ? 'ok' : 'bad'}>{hi ? 'केस स्टडी' : 'Case study'} {c}/40</Pill>}{w !== null && c !== null ? <Pill cls={qual ? 'ok' : 'bad'}>{hi ? 'कुल' : 'Total'} {w + c}/100 · {qual ? (hi ? 'उत्तीर्ण' : 'Qualified') : (hi ? 'अनुत्तीर्ण' : 'Not qualified')}</Pill> : null}</div>
      <div className="foot-row noprint" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={() => window.print()}>{hi ? 'परिणाम प्रिंट करें' : 'Print result'}</button><button className="btn danger" onClick={() => setReopen(true)}>{hi ? 'टेस्ट दोबारा खोलें (HR)' : 'Reopen test (HR)'}</button></div>
      {reopen && <div className="confirm"><span>{hi ? 'टेस्ट दोबारा खोलें? उत्तर फिर से बदले जा सकेंगे।' : 'Reopen the test? Answers become editable again.'}</span><button className="btn danger" onClick={() => { set('test.sub.' + role, undefined); go(secIndex('test')); }}>{hi ? 'हाँ, खोलें' : 'Yes, reopen'}</button></div>}
    </section>
  </>;
}
