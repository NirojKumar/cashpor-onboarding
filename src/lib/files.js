// Uploaded files on the candidate's device (IndexedDB) until they submit; small helpers for images and PDFs
let dbp;
const open = () => dbp || (dbp = new Promise((res, rej) => {
  try { const r = indexedDB.open('cashpor-onboarding-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
  catch (e) { rej(e); }
}));
const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('f', mode), s = t.objectStore('f'), r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
export const IDB = {
  put: (key, v) => tx('readwrite', s => s.put(v, key)).catch(() => {}),
  del: key => tx('readwrite', s => s.delete(key)).catch(() => {}),
  clear: () => tx('readwrite', s => s.clear()).catch(() => {}),
  all: () => open().then(db => new Promise(res => {
    const out = {}, t = db.transaction('f', 'readonly'), c = t.objectStore('f').openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else res(out); };
    c.onerror = () => res(out);
  })).catch(() => ({})),
};
export const dataURLtoBlob = d => { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: h.slice(5).split(';')[0] }); };
export const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
export function downscale(dataURL, maxW, type) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { const s = Math.min(1, maxW / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL(type, 0.85)); };
    img.onerror = () => res(dataURL); img.src = dataURL;
  });
}
export const fileToURL = url => fetch(url).then(r => r.blob()).then(b => URL.createObjectURL(b));
