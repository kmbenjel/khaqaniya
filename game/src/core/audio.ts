// The reciter's clips (highest priority: nothing plays over them, GAME_DESIGN §7.1). HTMLAudioElement pool of 3 for
// Media Session; with the recitation switch off (or a clip missing) the same calls still take the clip's time, silently,
// so every screen keeps its rhythm, and `kq:audio` events fire for the video pipeline either way.
import type { Poem, Verse } from './data';
import { env, emit } from './env';
import { settings } from './store';

export type ClipKind = 'verse' | 'sadr' | 'ajz' | 'meaning' | 'voice';
let poem: Poem;
const pool: HTMLAudioElement[] = [];
let current: { el: HTMLAudioElement | null; done: () => void; timer?: number } | null = null;
let rate = 1;
const listeners = new Set<(playing: boolean) => void>();

export function initAudio(p: Poem) {
  poem = p;
  for (let i = 0; i < 3; i++) { const a = new Audio(); a.preload = 'none'; pool.push(a); }
}
export function setSlow(on: boolean) { rate = on ? 0.8 : 1; }
export function onPlaying(f: (playing: boolean) => void) { listeners.add(f); return () => listeners.delete(f); }
const notify = (p: boolean) => listeners.forEach((f) => f(p));

export function clipFor(v: Verse, kind: ClipKind): { file?: string; dur: number } {
  const t = v.timing;
  const est = Math.max(3, (v.sadr.length + v.ajz.length) * 0.075);
  if (kind === 'meaning') return { file: v.meaningClip?.file, dur: v.meaningClip?.dur || 6 };
  if (!t) return { dur: kind === 'verse' ? est : est / 2 };
  if (kind === 'verse') return { file: t.file, dur: t.dur || est };
  if (kind === 'sadr') return { file: t.sadr, dur: t.sadrDur || (t.dur ? t.dur / 2 : est / 2) };
  return { file: t.ajz, dur: t.ajzDur || (t.dur ? t.dur / 2 : est / 2) };
}
export const hasAudio = (v: Verse) => !!v.timing?.file && settings().recitation;

/** Plays one clip; resolves when it ends (or is stopped). */
export function play(v: Verse, kind: ClipKind, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'));
  stop();
  const { file, dur } = clipFor(v, kind);
  const on = kind === 'meaning' ? settings().voices : settings().recitation;
  emit('kq:audio', { kind, id: v.n, startedAt: performance.now(), dur });
  return new Promise<void>((resolve, reject) => {
    let finished = false;
    const done = () => { if (finished) return; finished = true; if (current?.timer) clearTimeout(current.timer); current = null; notify(false); resolve(); };
    const silent = () => { current = { el: null, done, timer: window.setTimeout(done, (dur * 1000) / env.speed / rate) }; };
    signal?.addEventListener('abort', () => {
      if (finished) return;
      finished = true;
      const c = current; current = null;
      if (c?.timer) clearTimeout(c.timer);
      if (c?.el) { c.el.onended = null; c.el.onerror = null; c.el.pause(); }
      notify(false);
      reject(new DOMException('aborted', 'AbortError'));
    }, { once: true });
    notify(true);
    if (!file || !on) { silent(); return; }
    const el = pool.find((a) => a.paused) || pool[0];
    el.src = './' + file;
    el.playbackRate = rate;
    (el as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true;
    el.onended = done;
    el.onerror = () => { if (!finished) { notify(false); silent(); } };
    current = { el, done };
    // safety net: never wait longer than the clip plus a margin
    current.timer = window.setTimeout(done, (dur / rate + 2.5) * 1000);
    el.play().then(() => mediaSession(v)).catch(() => { if (!finished && current?.el === el) { clearTimeout(current.timer); silent(); } });
  });
}
export function stop() {
  if (!current) return;
  const c = current; current = null;
  if (c.el) { c.el.onended = null; c.el.onerror = null; c.el.pause(); }
  if (c.timer) clearTimeout(c.timer);
  c.done();
}
export const isPlaying = () => !!current;

/** A sequence: sadr then ajz (or the whole verse). */
export async function playVerse(v: Verse, signal?: AbortSignal) { await play(v, 'verse', signal); }

function mediaSession(v: Verse) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: v.sadr, artist: poem.timingsSource?.reciter || '', album: poem.title, artwork: [{ src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
  } catch { /* old browsers */ }
}
