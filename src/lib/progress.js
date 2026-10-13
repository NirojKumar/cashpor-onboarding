// How complete each form is: walks the form definitions with the same rules the candidate sees
// (HR / office-use fields, optional uploads, tables and tick boxes are not counted; hidden parts are skipped).
import { S, k, vis, whenOk, whenAnyOk, SIGRX, NAMERX, ADDR } from './flow.js';

export const OPT_KEYS = new Set(['@staffid', '@uan', 'info.milA', 'accident.sn2', 'terms.ccAcc', 'rterms.ccAcc', 'assess.pPG', 'affidavit.settled', 'choose.oldId']);

function walk(sec, items, st, hr, keys, agrees) {
  for (const it of items || []) {
    const h = it.hr || hr;
    switch (it.t) {
      case 'f':
        if (h) break;
        if (it.type === 'text' && SIGRX.test(it.l)) { if (NAMERX.test(it.l)) keys.add(k(sec, it.id)); keys.add('@sig'); }
        else keys.add(k(sec, it.id));
        break;
      case 'r': if (!h) keys.add(k(sec, it.id)); break;
      case 'agree': agrees.push(k(sec, it.id)); break;
      case 'sign': keys.add('@sig'); keys.add(k(sec, it.id + 'Date')); break;
      case 'tbl': it.cols.forEach(c => { if (SIGRX.test(c) && !(hr || it.sigOwn)) keys.add('@sig'); }); break;
      case 'checklist': it.rows.forEach((r, i) => { if (!r[1]) keys.add(`${sec}.${it.pre || 'c'}${i}.yn`); }); break;
      case 'address': ['p', 't'].forEach(p => ADDR.forEach(a => keys.add('@' + p + a[0]))); break;
      case 'days': it.days.forEach((_, i) => keys.add(`${sec}.d${i}cs`)); break;
      case 'stamppdf': keys.add('stamp.s100'); keys.add('stamp.s10'); agrees.push('stamp.aadhaar', 'stamp.notary', 'stamp.wit'); break;
      case 'upload': if (!it.opt) keys.add(k(sec, it.id)); break;
      case 'group': if (whenOk(it.when, st)) walk(sec, it.items, st, h, keys, agrees); break;
      case 'card':
        if (!whenOk(it.when, st) || !whenAnyOk(it.whenAny, st) || it.hr) break;
        walk(sec, it.items, st, h, keys, agrees); break;
      default: break;
    }
  }
}
const filled = v => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length);
export function sectionKeys(i, st) {
  const s = S[i], keys = new Set(), agrees = [];
  if (s.id === 'choose') keys.add('@track');
  else if (s.id === 'review') { agrees.push('review.final'); keys.add('@sig'); keys.add('review.date'); keys.add('review.place'); }
  else if (s.items) walk(s.id, s.items, st, false, keys, agrees);
  for (const x of OPT_KEYS) keys.delete(x);
  return { keys: [...keys], agrees: agrees.filter(x => !OPT_KEYS.has(x)) };
}
export function prog(i, st) {
  const { keys, agrees } = sectionKeys(i, st);
  return { tot: keys.length, fill: keys.filter(x => filled(st[x])).length, agTot: agrees.length, ag: agrees.filter(x => st[x]).length };
}
export function overall(st) {
  let T = 0, F = 0;
  S.forEach((s, i) => { if (i === 0 || !vis(i, st)) return; const p = prog(i, st); T += p.tot + p.agTot; F += p.fill + p.ag; });
  return T ? Math.round(F / T * 100) : 0;
}
export const pct = p => { const t = p.tot + p.agTot; return t ? Math.round((p.fill + p.ag) / t * 100) : null; };
