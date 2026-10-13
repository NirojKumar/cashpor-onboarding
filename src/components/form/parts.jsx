// Signature boxes, uploads, photo and the "Edited by" notes
import { useEffect, useMemo, useState } from 'react';
import { useForm, useToast } from '../../lib/form.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { downscale, readFile, dataURLtoBlob } from '../../lib/files.js';
import { fmtDT } from '../../lib/api.js';
import { RL, short } from '../../lib/roles.js';
import { Pill } from '../Pill.jsx';

/* "✎ Edited by Name (HRSM) · date · earlier: …" under a field the HRSM changed */
export function EditNote({ k }) {
  const { opts } = useForm(); const { TX, hi } = useI18n();
  const e = opts.lastEdit?.[k]; if (!e) return null;
  return <div className="edited-note">✎ {!e.old_value ? TX('Filled by', 'भरा गया —') : TX('Edited by', 'संशोधित —')} <b>{e.by}</b> ({RL(e.by_role, hi) || e.by_role}) · {fmtDT(e.edited_at)}{e.old_value && e.old_value !== '[file]' ? <> · {TX('earlier', 'पहले')}: “{short(e.old_value)}”</> : null}</div>;
}

export function SigBox({ k, mine, readOnly }) {
  const { files, set, setFile, opts } = useForm(); const { L, LANG } = useI18n(); const toast = useToast();
  const d = files[k], ro = readOnly ?? opts.readOnly;   // readOnly={false} keeps it editable inside a read-only view (RM / DRM signature)
  const pick = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (!f.type.startsWith('image/')) return toast(LANG === 'hi' ? 'कृपया हस्ताक्षर की फोटो (JPG/PNG) चुनें' : 'Choose a photo of your signature (JPG or PNG)');
    const url = await downscale(await readFile(f), 600, 'image/png');
    setFile(k, url); set(k, f.name); toast(L('sigDone'));
  };
  const remove = () => { setFile(k, null); set(k, undefined); };
  return (
    <div className={'sig' + (d ? ' has' : '')} data-sigk={k}>
      {d ? <img alt="Signature" src={d} /> : <span className="empty">{mine ? L('sigMine') : L('sigEmpty')}</span>}
      {!ro && <label className="btn sm"><span>{d ? L('replace') : L('upload')}</span><input className="vh" type="file" accept="image/*" onChange={pick} /></label>}
      {!ro && d && <button type="button" className="btn sm danger" onClick={remove}>{L('remove')}</button>}
      <EditNote k={k} />
    </div>
  );
}

const blobCache = new Map();
const blobURL = (id, d) => { if (!d) return null; const c = blobCache.get(id); if (c && c.d === d) return c.url; const url = URL.createObjectURL(dataURLtoBlob(d)); blobCache.set(id, { d, url }); return url; };

export function UpBox({ k, label, readOnly }) {
  const { st, files, set, setFile, opts } = useForm(); const { L, TX, LANG } = useI18n(); const toast = useToast();
  const list = Array.isArray(st[k]) ? st[k] : [], ro = readOnly || opts.readOnly, hi = LANG === 'hi';
  const add = async e => {
    const chosen = [...e.target.files]; e.target.value = ''; const added = [];
    for (const f of chosen) {
      if (f.size > 8 * 1024 * 1024) { toast((hi ? 'फाइल 8 MB से बड़ी है: ' : 'File is larger than 8 MB: ') + f.name); continue; }
      const id = 'aff-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); let d = await readFile(f);
      if (f.type.startsWith('image/')) d = await downscale(d, 1800, 'image/jpeg');
      setFile(id, d); added.push({ id, name: f.name, type: f.type || 'application/pdf', size: f.size });
    }
    if (added.length) { set(k, [...list, ...added]); toast(hi ? 'फाइल अपलोड हो गई' : 'File uploaded'); }
  };
  const remove = id => { setFile(id, null); set(k, list.filter(f => f.id !== id)); };
  return (
    <>
      {!ro && <label className="btn"><span>{label}</span><input className="vh" type="file" accept="application/pdf,image/*" multiple onChange={add} /></label>}
      {!ro && <span className="hint" style={{ display: 'block', marginTop: 4, color: 'var(--muted)', fontSize: 12.5 }}>{TX('PDF / JPG / PNG · max 8 MB', 'PDF / JPG / PNG · अधिकतम 8 MB')}</span>}
      <ul className="files" data-filesk={k}>
        {list.length ? list.map(f => {
          const d = files[f.id], url = blobURL(f.id, d);
          return <li key={f.id}>{f.type.startsWith('image/') && d ? <img src={d} alt="" /> : <Pill>PDF</Pill>}<span>{f.name} · {(f.size / 1024 / 1024).toFixed(2)} MB</span>
            {url && !opts.print && <a className="btn sm" href={url} target="_blank" rel="noopener">{hi ? 'देखें' : 'View'}</a>}
            {!ro && <button type="button" className="btn sm danger" onClick={() => remove(f.id)}>{L('remove')}</button>}</li>;
        }) : <li><span style={{ color: 'var(--muted)' }}>{hi ? 'अभी कोई फाइल अपलोड नहीं हुई' : 'No files uploaded yet'}</span></li>}
      </ul>
      <EditNote k={k} />
    </>
  );
}

export function Photo() {
  const { st, set, opts } = useForm(); const { TX } = useI18n();
  const v = st['@photo'];
  const pick = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; set('@photo', await downscale(await readFile(f), 240, 'image/jpeg')); };
  return (
    <div className="fld"><span className="lbl">{TX('Photo', 'फोटो')}</span>
      <div className="photo"><div className="ph" style={v ? { backgroundImage: `url(${v})` } : undefined}>{v ? '' : TX('Photo', 'फोटो')}</div>
        {!opts.readOnly && <input type="file" accept="image/*" aria-label="Upload photo" style={{ maxWidth: '100%' }} onChange={pick} />}</div>
      <EditNote k="@photo" />
    </div>
  );
}
