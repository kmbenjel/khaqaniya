// Character lines: always a caption bubble; the voice file audio/voice/<key>.mp3 plays when it exists and voices are on
// (GAME_DESIGN §7.3). One line at a time; an instruction interrupts a joke; a missing voice is not an error.
import { entry, family, speakerOf, t, tPick } from './copy';
import type { Poem } from './data';
import { env, emit } from './env';
import { isPlaying } from './audio';
import { profile, save, settings } from './store';
import type { Rng } from './rng';
import { setDuck } from './sfx';
import { charArt, blotArt } from '../art';
import { h } from './h';

let poem: Poem;
const el = new Audio();
let host: HTMLElement | null = null;
let hideTimer = 0;
export const captions: { key: string; who: string; text: string }[] = [];
export function initVoice(p: Poem) { poem = p; }
/** The element that shows bubbles on the current screen (each screen calls this with its cast bar). */
export function setBubbleHost(h: HTMLElement | null) { host = h; }
export const bubbleHost = () => (host && host.isConnected ? host : null);

export interface SayOpts { params?: Record<string, string | number>; who?: string; wait?: boolean; signal?: AbortSignal; hold?: boolean; /** capture: play the voice file even for a line marked voice:false */ force?: boolean }

export function show(key: string, opts: SayOpts = {}): { text: string; who: string } {
  const text = t(key, opts.params);
  const who = opts.who || speakerOf(key);
  captions.push({ key, who, text }); if (captions.length > 200) captions.shift();
  emit('kq:say', { key, who, text });
  const target = host && host.isConnected ? host : null;
  if (target) {
    target.dataset.who = who;
    const cast = target.closest('.castbar');
    const inBar = !!cast?.querySelector(`[data-char="${who}"]`);
    const face = inBar || who === 'narrator' ? null : ['amin', 'mishmish', 'laqlaq'].includes(who) ? charArt(who, 'happy') : blotArt(who, false, 0.5);
    target.replaceChildren(...(face ? [h('span', { class: 'bubble-face', 'aria-hidden': 'true' }, face)] : []), h('span', { class: 'bubble-text' }, text));
    target.classList.remove('pop-in'); void target.offsetWidth; target.classList.add('pop-in');
    target.hidden = false;
    target.setAttribute('data-key', key);
    cast?.querySelectorAll('[data-char]').forEach((c) => c.classList.toggle('talking', (c as HTMLElement).dataset.char === who));
  }
  return { text, who };
}

/** Shows a line (caption) and plays its voice if any. Resolves when the line is over. */
export function say(key: string, opts: SayOpts = {}): Promise<void> {
  if (opts.signal?.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'));
  const { text } = show(key, opts);
  clearTimeout(hideTimer);
  const words = text.split(/\s+/).length;
  const capMs = Math.max(2500, 350 * words);
  const v = poem?.voice[key];
  const e = entry(key);
  return new Promise<void>((resolve, reject) => {
    let done = false;
    const end = () => { if (done) return; done = true; setDuck(false); emit('kq:say-end', { key }); resolve(); };
    opts.signal?.addEventListener('abort', () => { el.pause(); setDuck(false); if (!done) { done = true; reject(new DOMException('aborted', 'AbortError')); } }, { once: true });
    if (v && settings().voices && (opts.force || (e?.voice ?? true)) && !isPlaying()) {
      el.src = './' + v.file;
      el.onended = end; el.onerror = () => setTimeout(end, capMs / env.speed);
      setDuck(true);
      emit('kq:audio', { kind: 'voice', id: key, startedAt: performance.now(), dur: v.dur || capMs / 1000 });
      el.play().catch(() => setTimeout(end, capMs / env.speed));
      setTimeout(end, ((v.dur || capMs / 1000) + 2) * 1000);
    } else setTimeout(end, (opts.wait === false ? 0 : capMs) / env.speed);
  });
}
/** Stops the character voice (route change, intro tap); effects are no longer ducked under it. */
export function stopVoice() { el.pause(); setDuck(false); }

/** Say a line of a rotating family, never the same one twice until all were heard (jokes, praise). */
export function sayPick(prefix: string, rng: Rng, opts: SayOpts = {}, exclude: string[] = []): Promise<string> {
  const p = profile();
  const fam = family(prefix).filter((k) => !exclude.includes(k));
  const heard = new Set(p.seen.lines.filter((k) => fam.includes(k)));
  const fresh = fam.filter((k) => !heard.has(k));
  const pool = fresh.length ? fresh : fam;
  const key = pool.length ? pool[Math.floor(rng() * pool.length)] : tPick(prefix, rng);
  heard.add(key);
  const others = p.seen.lines.filter((k) => !fam.includes(k));
  p.seen.lines = [...others, ...(heard.size >= fam.length ? [key] : [...heard])].slice(-400);
  save();
  return say(key, opts).then(() => key);
}

export function hideBubble() { if (host) host.hidden = true; }
