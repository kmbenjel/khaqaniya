// Everything the game plays from a file goes through here (GAME_DESIGN §7.1), and one owner holds «what is playing»:
// - the reciter's clips and the meaning clips (play(): highest priority, starting one stops anything else);
// - a character line's voice (playLine(), from voice.ts: never over a clip, never with the page hidden).
// With the recitation switch off (or a clip missing, failing or too slow to start) a clip is a silent stand-in of its
// length, so every screen keeps its rhythm; `kq:audio` fires either way (video pipeline).
// Whatever stops (its end, stop(), a route change, the page hidden, the next clip) is paused AND detached (src removed):
// a slow clip can never start late over the next one, and the browser's media controls have nothing to resume (G5).
// Only the necklace's «listen to all» (background: true) keeps playing with the screen off (§4.10).
import type { Poem, Verse } from './data';
import { env, emit } from './env';
import { settings } from './store';

export type ClipKind = 'verse' | 'sadr' | 'ajz' | 'meaning' | 'voice';
type Channel = 'clip' | 'voice';
interface Track { channel: Channel; kind: ClipKind; el: HTMLAudioElement | null; background: boolean; paused: boolean; cut: () => void; pause: () => void; resume: () => void; hush: () => void }

const START_MS = 8000;    // a file that has not started by then is given up (silent stand-in for the rest)
const STALL_MS = 8000;    // buffering that long mid-clip ends the clip
const MARGIN_MS = 2500;   // a clip running this much past its own end is ended

let poem: Poem;
// one element for everything (clips and voices never overlap): on iOS the element a tap started may play later on
let el0: HTMLAudioElement | null = null;
let primed = false;
let now: Track | null = null;
let rate = 1;
let controls: { play: () => void } | null = null;

const abortErr = () => new DOMException('aborted', 'AbortError');
export const pageHidden = () => document.visibilityState === 'hidden';
const session = () => ('mediaSession' in navigator ? navigator.mediaSession : null);
const playbackState = (s: MediaSessionPlaybackState) => { const ms = session(); if (ms) try { ms.playbackState = s; } catch { /* old browsers */ } };

export function initAudio(p: Poem) {
  poem = p;
  el0 = newAudio();
  // the app in the background, the screen locked, the tab switched: everything but «listen to all» stops
  const hide = () => { if (now && !now.background) now.cut(); };
  document.addEventListener('visibilitychange', () => { if (pageHidden()) hide(); });
  window.addEventListener('pagehide', hide);
  // Media Session actions are always handled here: with no handler the browser's own «play» resumes the last element
  const ms = session();
  if (ms) {
    const set = (a: MediaSessionAction, f: MediaSessionActionHandler | null) => { try { ms.setActionHandler(a, f); } catch { /* unsupported action */ } };
    set('play', () => { if (now?.paused) now.resume(); else controls?.play(); });
    set('pause', () => now?.pause());
    set('stop', () => stopAll());
  }
}
function newAudio(): HTMLAudioElement { const a = new Audio(); a.preload = 'none'; return a; }

// 0.05 s of silence (WAV, 8 kHz mono)
const SILENCE = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACA' + 'gICA'.repeat(133);
/** On the first tap (inside the gesture): the element plays a moment of silence, so iOS Safari lets the game start it
 *  later from a timer (the first verse comes after the story, not from a tap). Nothing else is playing then. */
export function unlockMedia() {
  if (primed || !el0) return;
  primed = true;
  if (now) return;   // something already plays: the element has started (autoplay was allowed)
  const el = el0;
  el.src = SILENCE;
  const end = () => { if (!now && el.getAttribute('src') === SILENCE) detach(el); };
  el.onended = end;
  el.play().then(() => setTimeout(end, 120), () => end());
}

/** The necklace: what the lock screen's «play» does when nothing is paused (null when leaving). */
export function setMediaControls(c: { play: () => void } | null) { controls = c; }

export function setSlow(on: boolean) {
  rate = on ? 0.8 : 1;
  if (now?.channel === 'clip' && now.el) now.el.playbackRate = rate;   // the clip already playing follows the switch
}

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

/** A clip (or its silent stand-in) holds the speakers. */
export const isPlaying = () => now?.channel === 'clip';

/** Stops whatever plays (paused, detached; its promise resolves `false`). */
export function stopAll() { now?.cut(); }
export const stop = stopAll;
/** A sound switch just went off (pause menu, quick mute, grown-ups' corner): what it covers falls silent now and keeps
 *  its time as a silent stand-in, so the screen's rhythm does not jump. */
export function followSwitches() {
  if (!now?.el) return;
  const s = settings();
  if (now.kind === 'voice' || now.kind === 'meaning' ? !s.voices : !s.recitation) now.hush();
}
/** Stops a character line only (a clip goes on). */
export function stopLine() { if (now?.channel === 'voice') now.cut(); }

/** The page is back in front. A tap or a key counts too: a browser that misreports visibility never freezes a level. */
function whenVisible(signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const off = () => { document.removeEventListener('visibilitychange', on); window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true); signal?.removeEventListener('abort', ab); };
    const on = () => { if (!pageHidden()) go(); };
    const go = () => { off(); resolve(); };
    const ab = () => { off(); reject(abortErr()); };
    document.addEventListener('visibilitychange', on);
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
    signal?.addEventListener('abort', ab, { once: true });
  });
}

/**
 * Plays one clip; resolves when it ends (`true`, also after a silent stand-in) or is cut by stop / another clip (`false`);
 * rejects with AbortError when `signal` aborts. With the page hidden it waits until the page is back (a level never
 * runs on silently in the background), except `background` clips (the necklace's «listen to all»).
 */
export function play(v: Verse, kind: ClipKind, signal?: AbortSignal, o: { background?: boolean } = {}): Promise<boolean> {
  if (signal?.aborted) return Promise.reject(abortErr());
  if (!o.background && pageHidden()) return whenVisible(signal).then(() => play(v, kind, signal, o));
  stopAll();
  const { file, dur } = clipFor(v, kind);
  const on = kind === 'meaning' ? settings().voices : settings().recitation;
  emit('kq:audio', { kind, id: v.n, startedAt: performance.now(), dur });
  return run({ channel: 'clip', kind, el: el0, file: on ? file : undefined, rate, silentMs: (dur * 1000) / env.speed / rate, background: !!o.background, signal, onStart: () => metadata(v) });
}

/**
 * A character line's voice file (voice.ts). `null` when it cannot sound now (a clip holds the speakers, or the page is
 * hidden): the caller shows the caption alone. A line interrupts the line before.
 */
export function playLine(file: string, silentMs: number, signal?: AbortSignal): Promise<boolean> | null {
  if (isPlaying() || pageHidden()) return null;
  stopAll();
  return run({ channel: 'voice', kind: 'voice', el: el0, file, rate: 1, silentMs, background: false, signal });
}

interface RunOpts { channel: Channel; kind: ClipKind; el: HTMLAudioElement | null; file?: string; rate: number; silentMs: number; background: boolean; signal?: AbortSignal; onStart?: () => void }

function run(o: RunOpts): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const t0 = performance.now();
    let settled = false, started = false, timer = 0;
    const arm = (ms: number, f: () => void) => { clearTimeout(timer); timer = window.setTimeout(f, Math.max(0, ms)); };
    const settle = (ended: boolean, aborted = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      o.signal?.removeEventListener('abort', onAbort);
      if (now === track) { now = null; detach(track.el); playbackState('none'); const ms = session(); if (ms) ms.metadata = null; }
      if (aborted) reject(abortErr()); else resolve(ended);
    };
    const onAbort = () => settle(false, true);
    // silent for what is left of the clip's time (no file, recitation off, a failure, too slow to start)
    const silent = () => {
      if (track.el) { detach(track.el); track.el = null; playbackState('none'); }
      arm(o.silentMs - (performance.now() - t0), () => settle(true));
    };
    const track: Track = {
      channel: o.channel, kind: o.kind, el: null, background: o.background, paused: false,
      cut: () => settle(false),
      hush: () => { if (!settled) silent(); },
      pause: () => { const el = track.el; if (!el || track.paused) return; track.paused = true; clearTimeout(timer); el.pause(); playbackState('paused'); },
      resume: () => {
        const el = track.el; if (!el || !track.paused) return;
        track.paused = false;
        if (!started) arm(START_MS, silent);
        el.play().catch(() => { if (now === track && track.el === el) silent(); });
      },
    };
    o.signal?.addEventListener('abort', onAbort, { once: true });
    now = track;
    if (!o.file || !o.el) { silent(); return; }
    const el = o.el;
    track.el = el;
    // the safety net counts from the real start and follows buffering and the rate: a late clip is not cut short
    const armEnd = () => {
      const left = Number.isFinite(el.duration) && el.duration > 0 ? ((el.duration - el.currentTime) * 1000) / (el.playbackRate || 1) : o.silentMs * env.speed;
      arm(left + MARGIN_MS, () => settle(true));
    };
    el.onended = () => settle(true);
    el.onerror = () => { if (now === track && track.el === el) silent(); };
    el.onplaying = () => { if (now !== track || track.paused) return; started = true; o.onStart?.(); playbackState('playing'); armEnd(); };
    el.onwaiting = () => { if (started && !track.paused) arm(STALL_MS, () => settle(true)); };
    el.onratechange = () => { if (started && !el.paused) armEnd(); };
    el.src = './' + o.file;
    el.playbackRate = o.rate;
    (el as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true;
    arm(START_MS, silent);
    el.play().catch(() => { if (now === track && track.el === el && !track.paused) silent(); });
  });
}

/** Paused and emptied: it cannot start late, nor be resumed by anyone. */
function detach(el: HTMLAudioElement | null) {
  if (!el) return;
  el.onended = el.onerror = el.onplaying = el.onwaiting = el.onratechange = null;
  el.pause();
  if (el.hasAttribute('src')) { el.removeAttribute('src'); el.load(); }
}

/** A sequence: sadr then ajz (or the whole verse). */
export async function playVerse(v: Verse, signal?: AbortSignal) { await play(v, 'verse', signal); }

function metadata(v: Verse) {
  const ms = session();
  if (!ms) return;
  try {
    ms.metadata = new MediaMetadata({ title: v.sadr, artist: poem.timingsSource?.reciter || '', album: poem.title, artwork: [{ src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
  } catch { /* old browsers */ }
}
