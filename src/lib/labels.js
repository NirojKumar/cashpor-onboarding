// Field key → its label in the forms (for the "Changes made by HR" table)
import { S, k, SIGRX, ADDR } from './flow.js';

const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
let MAP = null;
function build() {
  MAP = {};
  const walk = (sec, items) => (items || []).forEach(it => {
    if ((it.t === 'f' || it.t === 'r' || it.t === 'ms' || it.t === 'upload') && it.id) MAP[k(sec, it.id)] ??= it.l;
    if (it.t === 'f' && it.type === 'text' && SIGRX.test(it.l)) MAP[k(sec, it.id) + '.sig'] ??= it.l;
    if (it.t === 'agree') MAP[k(sec, it.id)] ??= strip(it.x).slice(0, 70);
    if (it.t === 'checklist') it.rows.forEach((r, i) => { const b = `${sec}.${it.pre || 'c'}${i}`; MAP[b + '.yn'] = MAP[b + '.by'] = MAP[b + '.dt'] = r[0]; });
    if (it.t === 'tbl') { const rows = typeof it.rows === 'number' ? Array.from({ length: it.rows }, (_, i) => String(i + 1)) : it.rows;
      rows.forEach((r, ri) => it.cols.forEach((c, ci) => { MAP[`${k(sec, it.id)}.${ri}.${ci}`] ??= `${strip(r)} ${strip(c)}`.trim(); })); }
    if (it.items) walk(sec, it.items);
  });
  S.forEach(s => walk(s.id, s.items));
  ADDR.forEach(a => { MAP['@p' + a[0]] ??= a[1]; MAP['@t' + a[0]] ??= a[1]; });
  MAP['@sig'] = 'Signature';
}
export function labelFor(key, tx = x => x) { if (!MAP) build(); const l = MAP[key]; return l ? strip(tx(l)) : key; }
