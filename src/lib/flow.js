// Section order, which sections a candidate sees for their choice, and step numbering
import { S, ORDER } from '../content/definitions.js';

// apply the page order (New Join flow) once
{
  const pos = {}; ORDER.forEach(([id, ph], i) => { pos[id] = [i, ph]; });
  S.forEach(s => { if (pos[s.id]) s.phase = pos[s.id][1]; });
  S.sort((a, b) => (pos[a.id] ? pos[a.id][0] : 99) - (pos[b.id] ? pos[b.id][0] : 99));
}
export { S };
export const k = (sec, id) => (id.startsWith('@') ? id : sec + '.' + id);
export const secIndex = id => S.findIndex(s => s.id === id);

const ALWAYS = ['welcome', 'choose'], TEST_PAGES = ['fti', 'cft', 'test', 'result'], TRACK_PAGES = { TCM: ['fti', 'test', 'result'], 'PCM-CT': ['cft', 'test', 'result'] };
export function vis(i, st, review = false) {
  const id = S[i].id, t = st['@track'];
  if (review && ['welcome', 'choose', 'result'].includes(id)) return false;
  if (ALWAYS.includes(id)) return true;
  if (!t) return id === 'review';
  if (TRACK_PAGES[t]) return TRACK_PAGES[t].includes(id);
  if (TEST_PAGES.includes(id)) return false;
  return t === 'Rejoin' ? id !== 'terms' : id !== 'rterms';
}
export const isStep = (i, st, review) => vis(i, st, review) && i > 1 && S[i].phase !== 'Finish';
export const stepNo = (i, st, review) => S.slice(0, i + 1).filter((_, j) => isStep(j, st, review)).length;
export const stepsTotal = (st, review) => S.filter((_, j) => isStep(j, st, review)).length;
export const prevVis = (i, st, review) => { for (let j = i - 1; j >= 0; j--) if (vis(j, st, review)) return j; return 0; };
export const nextVis = (i, st, review) => { for (let j = i + 1; j < S.length; j++) if (vis(j, st, review)) return j; return -1; };
export const firstVis = (st, review) => Math.max(0, S.findIndex((_, j) => vis(j, st, review)));
export function clampSection(i, st, review) {
  i = Math.max(0, Math.min(S.length - 1, +i || 0));
  if (!vis(i, st, review)) i = review ? firstVis(st, review) : 1;
  return i;
}

// a "when" condition on a group / card: [key, 'a|b', key2?, value2?]
export const whenOk = (w, st) => !w || (w[1].split('|').includes(st[w[0]] ?? '') && (!w[2] || (st[w[2]] ?? '') === w[3]));
export const whenAnyOk = (keys, st) => !keys || keys.some(x => st[x] === 'हाँ');
export const SIGRX = /हस्ताक्षर|Signature|\bSign\b/i, NAMERX = /नाम|Name|Position/;
export const ADDR = [['Village', 'ग्राम'], ['Post', 'पोस्ट'], ['Thana', 'थाना'], ['Mark', 'सीमा चिन्ह'], ['District', 'जिला'], ['State', 'राज्य'], ['Pin', 'पिन कोड']];
