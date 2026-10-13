// Shared form state for the candidate app, the reviewer panels and the print view.
//   st     — every answer, keyed like "info.bro" or "@name" ("@" keys are shared by all forms)
//   files  — signatures and uploads as data URLs, keyed by file id
//   opts   — how the forms are shown: readOnly, hideHr (candidate / HO), lockHo (HRSM), print, edits (HRSM changes)
import { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { IDB } from './files.js';

const FormCtx = createContext(null);
export function FormProvider({ st, setSt, files, setFiles, opts = {}, children }) {
  const ref = useRef({}); ref.current = { opts };
  const set = useCallback((key, value, extra) => {
    setSt(prev => {
      const next = { ...prev, [key]: value };
      if (extra) Object.assign(next, typeof extra === 'function' ? extra(next) : extra);
      return next;
    });
    ref.current.opts.onEdit?.(key);
  }, [setSt]);
  const setFile = useCallback((key, dataURL) => {
    setFiles(prev => { const n = { ...prev }; if (dataURL == null) delete n[key]; else n[key] = dataURL; return n; });
    const o = ref.current.opts;
    if (o.persistFiles) { dataURL == null ? IDB.del(key) : IDB.put(key, dataURL); }
    o.onFileEdit?.(key);
  }, [setFiles]);
  const value = useMemo(() => ({ st, files, set, setFile, opts }), [st, files, set, setFile, opts]);
  return <FormCtx.Provider value={value}>{children}</FormCtx.Provider>;
}
export const useForm = () => useContext(FormCtx);

/* toast messages */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(''); const [on, setOn] = useState(false); const t = useRef();
  const toast = useCallback(m => { setMsg(m); setOn(true); clearTimeout(t.current); t.current = setTimeout(() => setOn(false), 2200); }, []);
  return <ToastCtx.Provider value={toast}>{children}<div className={'toast' + (on ? ' on' : '')} id="toast" role="status">{msg}</div></ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

// fills the role-dependent words inside the form text (e.g. "TCM / PCM CT" in the licence letter)
export function useRoleLabels(ref, st, TX, deps = []) {
  useEffect(() => {
    const root = ref.current; if (!root) return;
    root.querySelectorAll('[data-postlbl]').forEach(e => { e.textContent = st['@track'] === 'Rejoin' ? (st['@rrole'] || 'CM/ SCM/ PCM') : (st['@role'] === 'TCM' ? 'TCM' : st['@role'] === 'PCM-CT' ? 'PCM CT' : 'TCM/ PCM CT'); });
    root.querySelectorAll('[data-rrolelbl]').forEach(e => { e.textContent = st['@rrole'] === 'SCM' ? TX('Senior Centre Manager (SCM)', 'वरिष्ठ केंद्र प्रबंधक (SCM)') : st['@rrole'] === 'CM' ? TX('Centre Manager (CM)', 'केंद्र प्रबंधक (CM)') : st['@rrole'] === 'PCM' ? 'PCM' : TX('Centre Manager', 'केंद्र प्रबंधक'); });
    root.querySelectorAll('[data-rolelbl]').forEach(e => { e.textContent = st['@role'] === 'PCM-CT' ? 'PCM-CT' : TX('Centre Manager (TCM)', 'केंद्र प्रबंधक (TCM)'); });
  });
}
