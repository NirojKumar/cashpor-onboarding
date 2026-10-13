// Hindi / English: UI labels (L, TX), translation of form text (tx) and section titles (TI)
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import TRJ from '../content/translations.json';
import { TT, PH, I18 } from '../content/definitions.js';

const LangCtx = createContext(null);
const KEY = 'cashpor-onboarding-lang';
const read = () => { try { return localStorage.getItem(KEY) || 'en'; } catch { return 'en'; } };

export function makeI18n(lang) {
  const hi = lang === 'hi';
  const L = key => (I18[key] || [key, key])[hi ? 1 : 0];
  const TX = (en, h) => (hi ? h : en);
  // translates a string from the forms; image src attributes are kept out of the lookup key
  const tx = s => {
    if (typeof s !== 'string' || !s) return s;
    const srcs = []; const key = s.replace(/src="([^"]*)"/g, (m, v) => { srcs.push(v); return 'src=""'; });
    const m = TRJ[hi ? 'hi' : 'en'][key.trim()]; if (m === undefined) return s;
    let i = 0; return m.replace(/src=""/g, () => 'src="' + (srcs[i++] || '') + '"');
  };
  const rolePrefix = (id, st) => ((id === 'test' || id === 'terms') && st['@role'] ? st['@role'] + ' ' : (id === 'rterms' && st['@rrole'] ? st['@rrole'] + ' ' : ''));
  const TI = (id, st = {}) => rolePrefix(id, st) + (TT[id] || [id, id])[hi ? 1 : 0];
  const PHL = p => (PH[p] || [p, p])[hi ? 1 : 0];
  return { LANG: lang, hi, L, TX, tx, TI, PHL };
}

export function LangProvider({ children, initial, persist = true }) {
  const [lang, setLangState] = useState(initial || read());
  const setLang = l => { setLangState(l); if (persist) try { localStorage.setItem(KEY, l); } catch { /* private mode */ } };
  useEffect(() => { document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'; }, [lang]);
  const value = useMemo(() => ({ ...makeI18n(lang), setLang }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export const useI18n = () => useContext(LangCtx);

export function LangSwitch({ className = 'langsw' }) {
  const { LANG, setLang } = useI18n();
  return (
    <div className={className} role="group" aria-label="Language / भाषा">
      <button type="button" data-lang="hi" className={LANG === 'hi' ? 'on' : ''} onClick={() => setLang('hi')}>हिन्दी</button>
      <button type="button" data-lang="en" className={LANG === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
    </div>
  );
}
