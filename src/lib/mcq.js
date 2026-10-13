// MCQ answer key & maths model answers for the TCM / PCM-CT test papers
import { TCM_PAPER, PCM_PAPER } from '../content/definitions.js';

// null = answer not given in the source documents; HR to confirm (not scored until filled)
export const ANSWER_KEY = {
  TCM: { q1: 'वाराणसी', q2: '6', q3: 'स्वास्थ्य एवं शिक्षा', q4: '100%', q5: 'रुपया 1000/-', q6: '5 दिन', q7: 'दुसरे माह से', q8: '5800+ कर्मचारी',
    q15: 'भालू', q16: 'वर्ग', q17: '10 km', q18: 'Cycle', q19: '46', q20: 'पिता' },
  'PCM-CT': { p1: null, p2: null, p3: 'आई.डी.बी.आई. बैंक', p4: null, p5: 'फैक्ट शीट', p6: '3,00,000 रुपये',
    p14: 'चाँदी', p15: 'मामा', p16: '120', p17: '10', p18: '72495', p19: '51', p20: '41' },
};
// maths model answers (TCM from Answer Sheet 1; PCM-CT Set-2 worked out from the questions)
export const MATH_KEY = { TCM: { q9: ['105000', '9'], q10: ['10000', '10'], q11: ['600000', '11'], q12: ['14400', '12'], q13: ['1458.33', '13'] },
  'PCM-CT': { p7: ['65000', '7'], p8: ['77000', '8'], p9: ['18000', '9'], p10: ['15300', '10'], p11: ['158384', '11'], p13: ['40', '13'] } };
export const numOf = x => { const m = String(x || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/g); return m ? parseFloat(m[m.length - 1]) : null; };

export function mcqList(role, st, tx, TX) {
  const out = []; const walk = a => a.forEach(it => { if (it.t === 'r') out.push(it); if (it.items) walk(it.items); });
  walk(role === 'TCM' ? TCM_PAPER : PCM_PAPER);
  return out.filter(q => q.id in ANSWER_KEY[role]).map(q => {
    const m = (q.l || '').match(/\((\d+)\)\s*$/);
    const label = q.id === 'q16' ? TX('16. Which shape is missing from the given figure?', '16. दी गई आकृति में लुप्त आकृति कौन-सी है?') : tx(q.l || '').replace(/\s*\(\d+\)\s*$/, '');
    return { id: q.id, label, marks: m ? +m[1] : 2, key: ANSWER_KEY[role][q.id], ans: st['test.' + q.id] };
  });
}
