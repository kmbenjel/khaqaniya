// Service-worker registration and media caching from the page (GAME_DESIGN §11). Cache names start with kq-game-.
import type { District } from './core/data';
import { P, versesOf } from './core/progress';

/** The media cache of this build (its name carries the media set's hash, like the service worker's). */
export const mediaCache = () => 'kq-game-media-' + ((P().build as { media?: string }).media || 'v1');
export function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || import.meta.env.DEV) return;
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { /* offline-first is a bonus */ });
}

function filesOf(ns: number[]): string[] {
  const poem = P();
  const out: string[] = [];
  for (const n of ns) {
    const v = poem.verses.find((x) => x.n === n);
    if (!v) continue;
    for (const f of [v.timing?.file, v.timing?.sadr, v.timing?.ajz, v.meaningClip?.file]) if (f) out.push('./' + f);
  }
  return out;
}
/** Caches files in the media cache; resolves with how many are in it and how many failed (offline, quota). */
async function cacheFiles(urls: string[], progress?: (k: number, of: number) => void): Promise<{ done: number; failed: number }> {
  if (!('caches' in window)) return { done: 0, failed: urls.length };
  let c: Cache;
  try { c = await caches.open(mediaCache()); } catch { return { done: 0, failed: urls.length }; }
  let k = 0, failed = 0;
  for (const u of urls) {
    const abs = new URL(u, location.href).href;
    try { if (!(await c.match(abs))) { const r = await fetch(abs); if (r.ok) await c.put(abs, r); else failed++; } }
    catch { failed++; }
    progress?.(++k, urls.length);
  }
  return { done: k - failed, failed };
}
const artOf = (d: District) => { const a = P().art; return [a['district.' + (d.skin || d.id)], d.boss ? a['boss.' + d.boss + '.ragged'] : null, d.boss ? a['boss.' + d.boss + '.fixed'] : null].filter(Boolean).map((f) => './' + f); };
export const cacheDistrict = (d: District) => cacheFiles([...filesOf(versesOf(d).map((v) => v.n)), ...artOf(d)]);
export function downloadAll(progress?: (k: number, of: number) => void) {
  const poem = P();
  const voices = Object.values(poem.voice).map((v) => './' + v.file);
  const art = [...Object.values(poem.art), ...Object.values(poem.artX2 || {})].filter(Boolean).map((f) => './' + f);
  return cacheFiles([...filesOf(poem.verses.map((v) => v.n)), ...voices, ...art], progress);
}
