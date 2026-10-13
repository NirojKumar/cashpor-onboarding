// Renders a list of form items (fields, choices, tables, cards, …) exactly as the forms define them.
// ctx: { hr } — inside an HR / office-use card;  { readOnly } — e.g. a submitted test paper
import { useId } from 'react';
import { useForm } from '../../lib/form.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { k, whenOk, whenAnyOk, SIGRX, NAMERX, ADDR } from '../../lib/flow.js';
import { REGION_ZONES, AG, F, D, R } from '../../content/definitions.js';
import { HO_FIELDS } from '../../lib/roles.js';
import { Html, Pill } from '../Pill.jsx';
import { SigBox, UpBox, Photo, EditNote } from './parts.jsx';
import { Calc } from './Calc.jsx';
import { TestSubmitBox } from '../../candidate/TestBox.jsx';

const GRID = new Set(['f', 'r', 'ms', 'photo', 'html', 'calc', 'link', 'age']);
export const sideEffects = (key, value) => prev => {
  const x = {};
  if (key === '@role' && !prev['@post']) x['@post'] = value;
  if (key === '@track' && (value === 'TCM' || value === 'PCM-CT')) { x['@role'] = value; if (!prev['@post']) x['@post'] = value; }
  if (key === '@track' && value === 'Rejoin') { if (!prev['assess.prev']) x['assess.prev'] = 'Yes'; if (!prev['info.prevInt']) x['info.prevInt'] = 'हाँ'; }
  return x;
};
const ddmmyyyy = v => (v ? String(v).split('-').reverse().join('/') : '');

// does a card still show anything once the HR / office-use parts are hidden?
const anyVisible = (items, hr) => (items || []).some(it => {
  const h = it.hr || hr;
  if (it.t === 'f' || it.t === 'r') return !h;
  if (it.t === 'link') return false;
  if (it.t === 'card') return !it.hr && anyVisible(it.items, h);
  if (it.t === 'group') return anyVisible(it.items, h);
  return true;
});
const hasHr = items => (items || []).some(it => it.hr || it.t === 'link' || (it.items && hasHr(it.items)));

function shown(it, ctx, st, opts) {
  const hide = opts.hideHr, hr = it.hr || ctx.hr;
  switch (it.t) {
    case 'f': case 'r': return !(hide && hr);
    case 'link': return !hide;
    case 'group': return whenOk(it.when, st);
    case 'card':
      if (!whenOk(it.when, st) || !whenAnyOk(it.whenAny, st)) return false;
      if (hide && it.hr) return false;
      if (hide && hasHr(it.items) && !anyVisible(it.items, ctx.hr)) return false;
      return true;
    case 'testsubmit': return opts.mode === 'candidate';
    default: return true;
  }
}

export function Items({ sec, items, ctx = {} }) {
  const { st, opts } = useForm();
  const out = []; let grid = [];
  const flush = () => { if (grid.length) out.push(<div className="grid" key={'g' + out.length}>{grid}</div>); grid = []; };
  (items || []).forEach((it, i) => {
    if (!shown(it, ctx, st, opts)) return;
    const el = <Item key={i} sec={sec} it={it} ctx={ctx} />;
    if (GRID.has(it.t)) grid.push(el); else { flush(); out.push(el); }
  });
  flush();
  return <>{out}</>;
}

function Item({ sec, it, ctx }) {
  const { tx, TX, LANG } = useI18n(); const { st, set, opts } = useForm();
  const hi = LANG === 'hi';
  switch (it.t) {
    case 'f': return <Field sec={sec} it={it} ctx={ctx} />;
    case 'r': return <Radio sec={sec} it={it} ctx={ctx} />;
    case 'ms': return <Multi sec={sec} it={it} ctx={ctx} />;
    case 'photo': return <Photo />;
    case 'html': return <Html as="div" style={{ display: 'contents' }} html={tx(it.x)} />;
    case 'calc': return <div className="fld full"><Calc id={it.id} /></div>;
    case 'age': return <div className="fld full"><Calc id="age" /></div>;
    case 'link': return <div className="fld"><Html as="span" className="lbl" html={tx(it.l)} /><input type="number" value={st[it.src] ?? ''} aria-label={it.l} disabled={opts.readOnly || ctx.readOnly} onChange={e => set(it.src, e.target.value)} /></div>;
    case 'p': return <div className="prose"><Html as="p" html={tx(it.x)} /></div>;
    case 'h': return <Html as="h3" style={{ fontSize: 15.5, margin: '14px 0 6px' }} html={tx(it.x)} />;
    case 'ol': return <div className="prose"><ol type={it.cls === 'alpha' ? 'a' : it.cls === 'roman' ? 'i' : undefined}>{it.items.map((x, j) => <Html as="li" key={j} html={tx(x)} />)}</ol></div>;
    case 'ul': return <div className="prose"><ul className={it.cls || ''}>{it.items.map((x, j) => <Html as="li" key={j} html={tx(x)} />)}</ul></div>;
    case 'note': return <Html as="div" className="note" html={tx(it.x)} />;
    case 'agree': return <Agree k={k(sec, it.id)} text={tx(it.x)} ctx={ctx} />;
    case 'sign': return <div className="grid" style={{ gridColumn: '1/-1' }}><div className="fld"><span className="lbl">{TX('Employee signature', 'कर्मचारी हस्ताक्षर')}</span><SigBox k="@sig" mine readOnly={ctx.readOnly} /></div><Field sec={sec} it={{ id: it.id + 'Date', l: 'दिनांक', type: 'date' }} ctx={ctx} /></div>;
    case 'tbl': return <Table sec={sec} it={it} ctx={ctx} />;
    case 'checklist': return <Checklist sec={sec} it={it} ctx={ctx} />;
    case 'address': return <Address ctx={ctx} />;
    case 'contacts': return null;   // regional contact list was removed from the forms
    case 'days': return <Days sec={sec} it={it} ctx={ctx} />;
    case 'stamppdf': return <StampPdf />;
    case 'testsubmit': return <TestSubmitBox />;
    case 'upload': return <div className="fld full"><span className="lbl"><Html html={tx(it.l)} /> {it.opt ? <Pill>{hi ? 'वैकल्पिक' : 'Optional'}</Pill> : <Pill cls="warn">{hi ? 'अनिवार्य' : 'Required'}</Pill>}</span><UpBox k={k(sec, it.id)} label={hi ? 'फाइल चुनें' : 'Choose file'} readOnly={ctx.readOnly} /></div>;
    case 'policyStatus': return <div><Calc id="policy" /></div>;
    case 'group': return <div><Items sec={sec} items={it.items} ctx={ctx} /></div>;
    case 'card': {
      const hr = ctx.hr || it.hr;
      return <section className={'card' + (it.hr ? ' hrbox' : '')}>{it.title && <h3><Html html={tx(it.title)} />{it.hr && <> <Pill cls="hr">{TX('HR / office use', 'HR / कार्यालय उपयोग')}</Pill></>}</h3>}<Items sec={sec} items={it.items} ctx={{ ...ctx, hr }} /></section>;
    }
    default: return null;
  }
}

const hrPill = (hr, opts) => (hr && !opts.hideHr ? <> <Pill cls="hr">HR</Pill></> : null);

export function Field({ sec, it, ctx = {} }) {
  const { st, set, opts } = useForm(); const { tx, TX } = useI18n(); const uid = useId();
  const hr = it.hr || ctx.hr;
  if (it.type === 'text' && SIGRX.test(it.l)) return <SigField sec={sec} it={it} hr={hr} ctx={ctx} />;
  const key = k(sec, it.id), v = st[key] ?? it.v ?? '';
  const lockHo = opts.lockHo && HO_FIELDS.includes(key);
  const disabled = !!(opts.readOnly || ctx.readOnly || lockHo);
  const cls = 'fld' + ((it.full || it.type === 'textarea') ? ' full' : '');
  const label = <label htmlFor={uid}><Html html={tx(it.l)} />{hrPill(hr, opts)}</label>;
  const hint = it.hint ? <span className="hint"><Html html={tx(it.hint)} /></span> : null;
  const onChange = e => { let val = e.target.value; if (it.upper) val = val.toUpperCase(); set(key, val); };
  const hoNote = lockHo ? <div className="ho-note" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{TX('Filled by HO Recruitment Team at final approval', 'अंतिम अनुमोदन के समय HO भर्ती टीम द्वारा भरा जाएगा')}</div> : null;
  let control;
  if (key === '@region' && !opts.print) {
    const known = REGION_ZONES.some(z => z.regions.includes(v));
    return <div className={cls}>{label}
      <select id={uid} value={v} disabled={disabled} onChange={onChange}>
        <option value="">{TX('— Choose your region —', '— अपना अंचल चुनें —')}</option>
        {v && !known && <option>{v}</option>}
        {REGION_ZONES.map(z => <optgroup key={z.zone} label={`${z.zone} ${TX('Zone', 'ज़ोन')}`}>{z.regions.map(r => <option key={r}>{r}</option>)}</optgroup>)}
      </select>
      {!opts.readOnly && <span className="hint">{TX('Your application goes to the HRSM and RM / DRM of this region.', 'आपका आवेदन इसी अंचल के HRSM व RM / DRM के पास जाएगा।')}</span>}<EditNote k={key} /></div>;
  }
  if (it.type === 'textarea') control = opts.print ? <div className="ta-print">{v}</div> : <textarea id={uid} value={v} disabled={disabled} onChange={onChange} />;
  else if (opts.print) control = <input id={uid} type="text" value={it.type === 'date' ? ddmmyyyy(v) : v} readOnly disabled />;
  else control = <input id={uid} type={it.type} value={v} disabled={disabled} inputMode={it.inputmode} placeholder={lockHo ? TX('Filled by HO Recruitment Team', 'HO भर्ती टीम द्वारा भरा जाएगा') : undefined} onChange={onChange} />;
  return <div className={cls}>{label}{control}{hint}{hoNote}<EditNote k={key} /></div>;
}

function SigField({ sec, it, hr, ctx }) {
  const { st, set, opts } = useForm(); const { tx } = useI18n();
  const own = k(sec, it.id), key = hr ? own + '.sig' : '@sig';
  const withName = NAMERX.test(it.l);
  return <div className="fld"><span className="lbl"><Html html={tx(it.l)} />{hrPill(hr, opts)}</span>
    {withName && <input type="text" value={st[own] ?? ''} aria-label={it.l} disabled={!!(opts.readOnly || ctx.readOnly)} onChange={e => set(own, e.target.value)} />}
    <SigBox k={key} mine={!hr} readOnly={ctx.readOnly} /><EditNote k={own} /></div>;
}

function Radio({ sec, it, ctx }) {
  const { st, set, opts } = useForm(); const { tx } = useI18n(); const name = useId();
  const hr = it.hr || ctx.hr, key = k(sec, it.id), v = st[key];
  const disabled = !!(opts.readOnly || ctx.readOnly);
  return <div className="fld full" role="radiogroup" aria-label={it.l ? it.l.replace(/<[^>]+>/g, '') : undefined}>
    {it.l && <span className="lbl"><Html html={tx(it.l)} />{hrPill(hr, opts)}</span>}
    <div className="opts">{it.o.map(o => <label key={o}><input type="radio" name={name} value={o} checked={v === o} disabled={disabled} onChange={() => set(key, o, sideEffects(key, o))} /> <Html html={tx(o)} /></label>)}</div>
    <EditNote k={key} /></div>;
}

function Multi({ sec, it, ctx }) {
  const { st, set, opts } = useForm(); const { tx } = useI18n();
  const key = k(sec, it.id), v = Array.isArray(st[key]) ? st[key] : [];
  const toggle = (o, on) => { const a = new Set(v); on ? a.add(o) : a.delete(o); set(key, [...a]); };
  return <div className="fld full"><span className="lbl"><Html html={tx(it.l)} /></span>
    <div className="opts">{it.o.map(o => <label key={o}><input type="checkbox" checked={v.includes(o)} disabled={!!(opts.readOnly || ctx.readOnly)} onChange={e => toggle(o, e.target.checked)} /> <Html html={tx(o)} /></label>)}</div><EditNote k={key} /></div>;
}

export function Agree({ k: key, text, ctx = {} }) {
  const { st, set, opts } = useForm();
  return <label className="agree"><input type="checkbox" checked={!!st[key]} disabled={!!(opts.readOnly || ctx.readOnly)} onChange={e => set(key, e.target.checked)} /><Html html={text} /><EditNote k={key} /></label>;
}

function Table({ sec, it, ctx }) {
  const { st, set, opts } = useForm(); const { tx } = useI18n();
  const key = k(sec, it.id);
  const rows = typeof it.rows === 'number' ? Array.from({ length: it.rows }, (_, i) => (it.serial ? String(i + 1) : '')) : it.rows;
  const labelled = typeof it.rows !== 'number', types = it.types || {};
  const sigOwn = ctx.hr || it.sigOwn;
  const cols = it.cols.map((c, ci) => ({ c, ci, sig: SIGRX.test(c) })).filter(x => !(opts.hideHr && x.sig && sigOwn));
  const disabled = !!(opts.readOnly || ctx.readOnly);
  const cellKey = (ri, ci) => (it.link && it.link[ri] !== undefined && ci === 1 ? it.link[ri] : `${key}.${ri}.${ci}`);
  const visibleRows = rows.map((r, ri) => ({ r, ri })).filter(({ ri }) => {
    if (!opts.print || ri === 0) return true;   // print: drop empty extra rows
    const inputs = cols.filter(({ ci, sig }) => !(ci === 0 && (labelled || it.serial)) && !sig);
    if (!inputs.length || inputs.some(({ ci }) => types[ci] === 'check')) return true;
    return inputs.some(({ ci }) => String(st[cellKey(ri, ci)] ?? '').trim());
  });
  return <div className="tbl-wrap"><table><thead><tr>{cols.map(({ c, ci }) => <th key={ci}><Html html={tx(c)} /></th>)}</tr></thead><tbody>
    {visibleRows.map(({ r, ri }) => <tr key={ri}>{cols.map(({ c, ci, sig }) => {
      if (ci === 0 && (labelled || it.serial)) return <td key={ci} className="rl"><Html html={tx(r)} /></td>;
      if (sig) return <td key={ci}><SigBox k={sigOwn ? `${key}.${ri}.${ci}` : '@sig'} readOnly={ctx.readOnly} /></td>;
      const kk = cellKey(ri, ci), val = st[kk] ?? '', t = types[ci] || 'text';
      if (t === 'check') return <td key={ci}><input type="checkbox" aria-label={`${r} ${c}`} checked={!!val} disabled={disabled} onChange={e => set(kk, e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} /><EditNote k={kk} /></td>;
      return <td key={ci}><input type={opts.print && t === 'date' ? 'text' : t} aria-label={`${r} ${c}`} value={opts.print && t === 'date' ? ddmmyyyy(val) : val} disabled={disabled} onChange={e => set(kk, e.target.value)} /><EditNote k={kk} /></td>;
    })}</tr>)}
  </tbody></table></div>;
}

function Checklist({ sec, it, ctx }) {
  const { st, set, opts } = useForm(); const { tx, TX } = useI18n(); const base = useId();
  const showHr = !opts.hideHr, disabled = !!(opts.readOnly || ctx.readOnly);
  return <div className="tbl-wrap"><table><thead><tr><th>{TX('Required document', 'आवश्यक दस्तावेज़')}</th><th>{TX('Please tick in box', 'बॉक्स में टिक करें')}</th>{showHr && <><th>{TX('Verified by', 'सत्यापनकर्ता')}</th><th>{TX('Verified date', 'सत्यापन तिथि')}</th></>}</tr></thead><tbody>
    {it.rows.map((r, i) => {
      const b = `${sec}.${it.pre || 'c'}${i}`;
      const yes = r[1] ? r[1].map((o, j) => <label key={j}><input type="checkbox" checked={!!st[`${b}.y${j}`]} disabled={disabled} onChange={e => set(`${b}.y${j}`, e.target.checked)} /> <Html html={tx(o)} /></label>)
        : <label><input type="radio" name={base + i} checked={st[b + '.yn'] === 'Yes'} disabled={disabled} onChange={() => set(b + '.yn', 'Yes')} /> {TX('Yes', 'हाँ')}</label>;
      const no = r[1] ? <label><input type="checkbox" checked={!!st[b + '.no']} disabled={disabled} onChange={e => set(b + '.no', e.target.checked)} /> {TX('No', 'नहीं')}</label>
        : <label><input type="radio" name={base + i} checked={st[b + '.yn'] === 'No'} disabled={disabled} onChange={() => set(b + '.yn', 'No')} /> {TX('No', 'नहीं')}</label>;
      return <tr key={i}><td className="rl" style={{ whiteSpace: 'normal', minWidth: 180 }}><Html html={tx(r[0])} /></td><td><div className="opts">{yes}{no}</div><EditNote k={b + '.yn'} /></td>
        {showHr && <><td><input type="text" aria-label="Verified by" value={st[b + '.by'] || ''} disabled={disabled} onChange={e => set(b + '.by', e.target.value)} /><EditNote k={b + '.by'} /></td>
          <td><input type={opts.print ? 'text' : 'date'} aria-label="Verified date" value={opts.print ? ddmmyyyy(st[b + '.dt']) : st[b + '.dt'] || ''} disabled={disabled} onChange={e => set(b + '.dt', e.target.value)} /><EditNote k={b + '.dt'} /></td></>}</tr>;
    })}</tbody></table></div>;
}

function Address({ ctx }) {
  const { st, set, opts } = useForm(); const { tx, TX, LANG } = useI18n();
  const col = (p, t) => <div><h3 style={{ fontSize: 15, margin: '4px 0 6px' }}>{tx(t)}</h3><div className="grid">{ADDR.map(a => <Field key={a[0]} sec="x" it={{ id: '@' + p + a[0], l: a[1], type: 'text' }} ctx={ctx} />)}</div></div>;
  const copy = e => { if (!e.target.checked) return; const x = {}; ADDR.forEach(a => { x['@t' + a[0]] = st['@p' + a[0]] || ''; }); set('@tVillage', x['@tVillage'], x); };
  return <div style={{ gridColumn: '1/-1' }}>{col('p', 'स्थायी पता')}
    {!opts.readOnly && <label className="agree noprint" style={{ margin: '4px 0 10px' }}><input type="checkbox" onChange={copy} /> {LANG === 'hi' ? 'अस्थायी पता स्थायी पते जैसा ही है' : 'Temporary address is the same as permanent'}</label>}
    {col('t', 'अस्थायी पता')}</div>;
}

function Days({ sec, it, ctx }) {
  const { st, set, opts } = useForm(); const { tx, TX } = useI18n();
  return <div style={{ gridColumn: '1/-1', display: 'grid', gap: 12 }}>{it.days.map((d, i) => {
    let n = 0; for (let j = 0; j < 6; j++) if (st[`fti.d${i}t${j}`]) n++;
    return <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><b style={{ fontFamily: 'var(--f-display)' }}><Html html={tx(d[0])} /></b><Pill cls={n === 6 ? 'ok' : n ? 'warn' : ''}>{TX(`${n}/6 topics covered`, `${n}/6 विषय पूर्ण`)}</Pill></div>
      <div className="opts" style={{ margin: '8px 0' }}>{d[1].map((t, j) => <label key={j}><input type="checkbox" checked={!!st[`${sec}.d${i}t${j}`]} disabled={!!(opts.readOnly || ctx.readOnly)} onChange={e => set(`${sec}.d${i}t${j}`, e.target.checked)} /> <Html html={tx(t)} /></label>)}</div>
      <div className="grid" style={{ margin: 0 }}>
        {!opts.hideHr && <Field sec={sec} it={{ id: 'd' + i + 'tr', l: 'ट्रेनर (CM/BM/CHIB) का नाम व् हस्ताक्षर', type: 'text', hr: 1 }} ctx={ctx} />}
        <Field sec={sec} it={{ id: 'd' + i + 'cs', l: 'प्रशिक्षण प्राप्त करता का नाम व् हस्ताक्षर', type: 'text' }} ctx={ctx} />
      </div></div>;
  })}</div>;
}

const DOCS = {
  s100: { pdf: '/assets/affidavit-rs100.pdf', t: ['/assets/s100-1.jpg', '/assets/s100-2.jpg'], file: 'CASHPOR_Affidavit_Rs100_NonJudicial_Stamp_Paper.pdf',
    en: ['₹100 Non-Judicial Stamp Paper — Guarantor Affidavit', 'The guarantor’s affidavit. Print it on ₹100 non-judicial stamp paper, have the guarantor fill and sign it, get it notarised and attach the guarantor’s Aadhaar card.'],
    hi: ['₹100 नॉन-ज्यूडिशियल स्टाम्प पेपर — प्रतिभू शपथपत्र', 'प्रतिभू (Guarantor) का शपथपत्र। इसे ₹100 के नॉन-ज्यूडिशियल स्टाम्प पेपर पर प्रिंट करें, प्रतिभू से भरवाकर हस्ताक्षर कराएं, नोटरी से सत्यापित कराएं और प्रतिभू का आधार कार्ड संलग्न करें।'] },
  s10: { pdf: '/assets/declaration-rs10.pdf', t: ['/assets/s10-1.jpg', '/assets/s10-2.jpg'], file: 'CASHPOR_Declaration_Rs10_NonJudicial_Stamp_Paper.pdf',
    en: ['₹10 Non-Judicial Stamp Paper — Loan Repayment Declaration', 'Declaration that you will not take loan repayments from beneficiaries into your own or your family’s bank account. Print it on ₹10 non-judicial stamp paper, fill and sign it with three witnesses.'],
    hi: ['₹10 नॉन-ज्यूडिशियल स्टाम्प पेपर — ऋण पुनर्भुगतान घोषणा', 'लाभार्थियों से ऋण पुनर्भुगतान राशि निजी बैंक खाते में न लेने के संबंध में घोषणा। इसे ₹10 के नॉन-ज्यूडिशियल स्टाम्प पेपर पर प्रिंट करें, भरें, हस्ताक्षर करें और तीन साक्षियों के हस्ताक्षर कराएं।'] },
};
function StampPdf() {
  const { opts } = useForm(); const { TX, LANG } = useI18n(); const hi = LANG === 'hi';
  const doc = (key, n) => { const d = DOCS[key], t = hi ? d.hi : d.en; return <section className="card" key={key}><h3>{n}. {t[0]}</h3><p style={{ margin: '0 0 8px', maxWidth: '70ch' }}>{t[1]}</p>
    <div className="affpages"><img src={d.t[0]} alt="Page 1" /><img src={d.t[1]} alt="Page 2" /></div>
    {!opts.readOnly && <div className="foot-row noprint" style={{ justifyContent: 'flex-start', margin: '6px 0 14px' }}><a className="btn pri" href={d.pdf} download={d.file} style={{ textDecoration: 'none' }}>{hi ? 'PDF डाउनलोड करें' : 'Download PDF'}</a><a className="btn" href={d.pdf} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>{hi ? 'PDF खोलें' : 'Open PDF'}</a></div>}
    <h3 style={{ fontSize: 15 }}>{hi ? 'भरा हुआ व हस्ताक्षरित पेपर पुनः अपलोड करें' : 'Re-upload the filled, signed paper'}</h3>
    <UpBox k={'stamp.' + key} label={hi ? 'स्कैन / फोटो / PDF चुनें' : 'Choose scan, photo or PDF'} /></section>; };
  return <>
    <Html as="div" className="note" html={hi ? '<b>ध्यान दें :</b> दोनों दस्तावेज़ नॉन-ज्यूडिशियल स्टाम्प पेपर पर बनेंगे (बॉन्ड पेपर नहीं)। मूल प्रति HR को जमा करें।' : '<b>Note:</b> both documents go on non-judicial stamp paper (not bond paper). Hand the originals to HR.'} />
    {doc('s100', 1)}{doc('s10', 2)}
    <section className="card"><Items sec="stamp" items={[AG('aadhaar', 'प्रतिभू का आधार कार्ड ₹100 शपथपत्र के साथ संलग्न है।'), AG('notary', '₹100 शपथपत्र नोटरी द्वारा सत्यापित है।'), AG('wit', '₹10 घोषणा पत्र पर तीनों साक्षियों के हस्ताक्षर हैं।')]} /></section>
    {!opts.hideHr && <section className="card hrbox"><h3>{hi ? 'HR सत्यापन' : 'HR verification'} <Pill cls="hr">{TX('HR / office use', 'HR / कार्यालय उपयोग')}</Pill></h3><Items sec="stamp" items={[F('vBy', 'Verified by'), D('vDate', 'Verified date'), R('vOk', 'Status', ['Accepted', 'Re-upload needed']), F('vSig', 'Signature')]} ctx={{ hr: 1 }} /></section>}
  </>;
}
