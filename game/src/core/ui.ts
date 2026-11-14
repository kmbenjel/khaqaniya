// Shared UI pieces: buttons, the verse card, the play frame (top bar, banner, prompt, play zone, cast bar), sheets.
import { h, svg, clear, type Child } from './h';
import { t, num, has } from './copy';
import { iconEl, charArt, lanternArt, artFile } from '../art';
import type { Pose } from '../art/chars';
import { sfx } from './sfx';
import { followSwitches } from './audio';
import { setBubbleHost, say } from './voice';
import type { Token, Verse, Poem } from './data';
import { learnedCount, profile, settings, save } from './store';
import { env } from './env';
import { go } from './router';
import { icon } from '../art/icons';

export function btn(label: Child, o: { icon?: string; testid?: string; primary?: boolean; small?: boolean; ghost?: boolean; aria?: string; onClick?: (e: MouseEvent) => void; cls?: string; disabled?: boolean } = {}): HTMLButtonElement {
  const b = h('button', {
    type: 'button', class: ['btn', o.primary && 'btn-primary', o.small && 'btn-small', o.ghost && 'btn-ghost', o.cls].filter(Boolean).join(' '),
    'data-testid': o.testid, 'aria-label': o.aria, disabled: o.disabled,
  }, o.icon ? iconEl(o.icon) : null, label !== '' && label !== null ? h('span', { class: 'btn-label' }, label) : null);
  if (o.onClick) b.addEventListener('click', (e) => { sfx('tap'); o.onClick!(e); });
  return b;
}
export function iconBtn(id: string, ariaKey: string, testid: string, onClick: () => void, cls = ''): HTMLButtonElement {
  // no `title`: the aria.* labels are unvocalised (for screen readers); as a hover tooltip a child would read them (G5)
  const b = h('button', { type: 'button', class: 'icon-btn ' + cls, 'aria-label': t(ariaKey), 'data-testid': testid }, iconEl(id));
  b.addEventListener('click', () => { sfx('tap'); onClick(); });
  return b;
}

/** One hemistich line: each word a span (data-i), the text exactly as the data, words separated by single spaces. */
export function hemiLine(tokens: Token[], o: { hidden?: (tk: Token) => boolean; cls?: string; slot?: (tk: Token) => HTMLElement | null } = {}): HTMLElement {
  const line = h('div', { class: 'hemi ' + (o.cls || ''), 'data-where': tokens[0]?.where });
  tokens.forEach((tk, k) => {
    if (k) line.appendChild(document.createTextNode(' '));
    const s = o.slot?.(tk);
    if (s) { line.appendChild(s); return; }
    line.appendChild(h('span', { class: 'w' + (tk.locked ? ' locked' : '') + (o.hidden?.(tk) ? ' hidden-w' : ''), 'data-i': tk.i, 'data-key': tk.key }, tk.t));
  });
  return line;
}
export function verseCard(v: Verse, o: { cls?: string; hidden?: (tk: Token) => boolean; slot?: (tk: Token) => HTMLElement | null; testid?: string; onlyAjz?: boolean; onlySadr?: boolean } = {}): HTMLElement {
  return h('div', { class: 'verse-card ' + (o.cls || ''), 'data-testid': o.testid || 'verse-card', 'data-n': v.n, lang: 'ar' },
    o.onlyAjz ? null : hemiLine(v.sadrT, { hidden: o.hidden, slot: o.slot, cls: 'sadr' }),
    o.onlySadr ? null : hemiLine(v.ajzT, { hidden: o.hidden, slot: o.slot, cls: 'ajz' }));
}

/** Karaoke-like reading light over a hemistich: its duration spread over the words by letter count (§4.2). */
export function sweepLight(line: HTMLElement, tokens: Token[], seconds: number, signal?: AbortSignal): void {
  const spans = [...line.querySelectorAll<HTMLElement>('.w')];
  const total = tokens.reduce((a, tk) => a + tk.len + 1, 0);
  let acc = 0;
  // a word just passed stays catchable for a moment (.was-lit): the LISTEN sparkle game is generous with small fingers
  const unlight = () => spans.forEach((x) => { if (x.classList.contains('lit')) { x.classList.remove('lit'); x.classList.add('was-lit'); window.setTimeout(() => x.classList.remove('was-lit'), 600); } });
  line.classList.add('reading');
  const timers: number[] = [];
  spans.forEach((s, k) => {
    const at = (acc / total) * seconds * 1000 / env.speed;
    acc += (tokens[k]?.len || 1) + 1;
    timers.push(window.setTimeout(() => { unlight(); s.classList.add('lit'); }, at));
  });
  timers.push(window.setTimeout(() => { unlight(); line.classList.remove('reading'); }, seconds * 1000 / env.speed));
  signal?.addEventListener('abort', () => timers.forEach(clearTimeout), { once: true });
}

export function stars(n: number, max = 3): HTMLElement {
  return h('span', { class: 'stars', 'aria-label': t('necklace.sheet.stars', { n }), 'data-stars': n },
    ...Array.from({ length: max }, (_, i) => h('span', { class: 'star' + (i < n ? ' on' : '') }, svg(icon('star')))));
}

export function necklaceCounter(poem: Poem): HTMLElement {
  return h('button', { type: 'button', class: 'hud-necklace', 'data-testid': 'hud-necklace', 'aria-label': t('aria.necklace', { n: learnedCount(), total: poem.verses.length }), onclick: () => go('#/necklace') },
    iconEl('necklace'), h('span', { class: 'hud-n' }, num(learnedCount()), ' / ', num(poem.verses.length)));
}
/** The quick mute of the top bar: everything off at once (what plays falls silent now), and back as it was. */
let beforeMute: { recitation: boolean; voices: boolean; sfx: boolean } | null = null;
export function muteBtn(): HTMLButtonElement {
  const st = settings();
  const loud = () => st.recitation || st.voices || st.sfx;
  const paint = () => { b.replaceChildren(iconEl(loud() ? 'speaker' : 'mute')); b.setAttribute('aria-label', t(loud() ? 'aria.mute' : 'aria.unmute')); b.setAttribute('aria-pressed', String(!loud())); };
  // (G5) it used to switch only voices and effects while its icon followed the reciter too: with the reciter on it could
  // mute but never unmute, and a line already speaking went on
  const b = iconBtn('speaker', 'aria.mute', 'btn-mute', () => {
    if (loud()) { beforeMute = { recitation: st.recitation, voices: st.voices, sfx: st.sfx }; st.recitation = st.voices = st.sfx = false; }
    else { Object.assign(st, beforeMute || { recitation: true, voices: true, sfx: true }); beforeMute = null; }
    save(); followSwitches(); paint();
  });
  paint();
  return b;
}

/** A burst of small sparkles at an element (STYLE §10: at most 12 particles, each well under 0.5 % of the screen,
 *  transform and opacity only, gone in 0.8 s); nothing under reduced motion. `dust`: grey-brown specks (polishing). */
export function burst(el: Element | null | undefined, o: { n?: number; kind?: 'gold' | 'dust' | 'mint'; spread?: number } = {}): void {
  if (!el || !(el as HTMLElement).isConnected || document.documentElement.classList.contains('reduce-motion')) return;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return;
  const n = Math.min(12, o.n ?? 10);
  const spread = o.spread ?? Math.max(36, Math.min(96, Math.max(r.width, r.height) * 0.6));
  const box = h('div', { class: 'burst burst-' + (o.kind || 'gold'), 'aria-hidden': 'true', style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' } });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    const d = spread * (0.55 + Math.random() * 0.55);
    box.appendChild(h('span', { class: 'spark' + (i % 3 === 0 && o.kind !== 'dust' ? ' star' : ''), style: `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;animation-delay:${Math.round(Math.random() * 90)}ms` }));
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 900);
}

// ── the cast: every pose a character may take on this screen is drawn once, stacked; a reaction only changes which one
// shows (no image is fetched at the moment of the reaction, so nothing blinks) ────────────────────────────────────────
const CAST_POSES: Record<string, Pose[]> = { amin: ['idle', 'happy', 'think'], mishmish: ['idle', 'happy', 'basket', 'cloth', 'point'], laqlaq: ['idle', 'happy'] };
function castChar(who: string, base: Pose, color?: string): HTMLElement {
  const box = h('div', { class: 'cast cast-' + who, 'data-char': who, 'data-base': base });
  const poses = CAST_POSES[who].includes(base) ? CAST_POSES[who] : [base, ...CAST_POSES[who]];
  for (const p of poses) { const el = charArt(who, p, color); el.classList.add('pose', 'pose-' + p); if (p === base) el.classList.add('on'); box.appendChild(el); }
  return box;
}
const castEl = (who: string) => [...document.querySelectorAll<HTMLElement>(`.castbar .cast[data-char="${who}"]`)].find((e) => e.isConnected && e.offsetParent !== null) || null;
const poseTimers = new Map<string, number>();
function showPose(box: HTMLElement, pose: string) {
  const want = box.querySelector(`.pose-${pose}`) ? pose : box.dataset.base || 'idle';
  box.querySelectorAll('.pose').forEach((e) => e.classList.toggle('on', e.classList.contains('pose-' + want)));
}
/** A short reaction of a character in the cast bar (Amin cheers on a right answer, thinks after a wrong tap…), back to
 *  his base pose after `ms`. `hop` adds a little jump. */
export function castReact(who: string, pose: Pose, ms = 1100, hop = false): void {
  const box = castEl(who);
  if (!box) return;
  clearTimeout(poseTimers.get(who));
  showPose(box, pose);
  if (hop && !document.documentElement.classList.contains('reduce-motion')) {
    box.classList.remove('hop'); void box.offsetWidth; box.classList.add('hop');
    setTimeout(() => box.classList.remove('hop'), 560);   // or the hop would hold the talking animation off
  }
  poseTimers.set(who, window.setTimeout(() => { if (box.isConnected) showPose(box, box.dataset.base || 'idle'); }, ms / env.speed));
}
/** The pose a character keeps on this screen (Mishmish hides in his basket during a challenge, holds the cloth while
 *  polishing). */
export function castBase(who: string, pose: Pose): void {
  const box = castEl(who);
  if (!box) return;
  if (!box.querySelector('.pose-' + pose)) { const el = charArt(who, pose); el.classList.add('pose', 'pose-' + pose); box.appendChild(el); }
  box.dataset.base = pose;
  clearTimeout(poseTimers.get(who));
  showPose(box, pose);
}

/** The cast bar at the bottom of play screens: ear · Mishmish · caption bubble · Amin · help lantern. */
export function castbar(o: { ear?: () => void; help?: () => void; mishmish?: boolean; amin?: boolean; laqlaq?: boolean } = {}): { el: HTMLElement; bubble: HTMLElement; ear: HTMLButtonElement | null; help: HTMLButtonElement | null } {
  const bubble = h('div', { class: 'bubble', 'data-testid': 'bubble', 'aria-live': 'polite', hidden: true });
  const ear = o.ear ? iconBtn('ear', 'aria.ear', 'ear', o.ear, 'ear-btn') : null;
  const helpBtn = o.help ? iconBtn('help', 'aria.help', 'help', o.help, 'help-btn') : null;
  // a one-word visible label under the lantern (A1: btn.help.label); the button keeps its aria-label
  const help = helpBtn && has('btn.help.label') ? h('div', { class: 'help-wrap' }, helpBtn, h('span', { class: 'help-label', 'aria-hidden': 'true' }, t('btn.help.label'))) : helpBtn;
  const el = h('div', { class: 'castbar' },
    ear,
    o.mishmish !== false ? castChar('mishmish', 'idle') : null,
    o.laqlaq ? castChar('laqlaq', 'idle') : null,
    bubble,
    o.amin !== false ? castChar('amin', 'idle', profile().lantern) : null,
    help);
  setBubbleHost(bubble);
  return { el, bubble, ear, help: helpBtn };
}

export interface Frame {
  root: HTMLElement; top: HTMLElement; banner: HTMLElement; prompt: HTMLElement; play: HTMLElement; side: HTMLElement;
  bubble: HTMLElement; ear: HTMLButtonElement; help: HTMLButtonElement;
  setBanner(titleKey: string, iconId: string, howKey?: string): void;
  setDots(step: number): void;
  /** The district painting the cast stands on (bottom of the frame), and its sky. */
  setPlace(skin: string | null, sky?: string): void;
  onEar: (() => void) | null; onHelp: (() => void) | null;
  reset(): void;
}

/** The shared frame of levels, challenges and polish (§8.1). */
export function frame(poem: Poem, o: { back: () => void; dots?: boolean; title?: string; cls?: string; scenePlace?: string; sky?: string; place?: string }): Frame {
  const dots = h('div', { class: 'dots', role: 'img', 'aria-label': t('aria.steps', { n: 1, total: 5 }) }, ...['listen', 'meaning', 'play', 'recite', 'reward'].map((s) => h('span', { class: 'dot', 'data-step': s })));
  const top = h('header', { class: 'topbar' },
    iconBtn('back', 'aria.back', 'btn-back', o.back, 'back-btn'),
    o.dots === false ? h('div', { class: 'top-title' }, o.title || '') : dots,
    necklaceCounter(poem), muteBtn());
  const banner = h('div', { class: 'banner', 'data-testid': 'banner', 'aria-live': 'polite' });   // each game's title is announced
  const prompt = h('section', { class: 'prompt-zone' });
  const play = h('section', { class: 'play-zone' });
  const side = h('div', { class: 'story-pane' });
  const f: Frame = {
    root: null as unknown as HTMLElement, top, banner, prompt, play, side, bubble: null as unknown as HTMLElement,
    ear: null as unknown as HTMLButtonElement, help: null as unknown as HTMLButtonElement, onEar: null, onHelp: null,
    setBanner(titleKey, iconId, howKey) {
      clear(banner);
      banner.append(iconEl(iconId), h('span', { class: 'banner-title' }, t(titleKey)));
      if (howKey) banner.append(h('button', { type: 'button', class: 'how-btn', 'data-testid': 'how', 'aria-label': t('aria.helpQ'), onclick: () => { sfx('tap'); void say(howKey); } }, '؟'));
      banner.classList.remove('flash'); void banner.offsetWidth; banner.classList.add('flash');
    },
    setPlace(skin, sky) {
      const file = skin ? artFile('district.' + skin) : null;
      f.root.classList.toggle('banded', !!file);
      // absolute: a url() inside a custom property resolves against the stylesheet that uses it (assets/), not the page
      if (file) f.root.style.setProperty('--band', `url("${new URL(file, location.href).href}")`); else f.root.style.removeProperty('--band');
      if (sky) f.root.dataset.sky = sky;
    },
    setDots(step) { dots.setAttribute('aria-label', t('aria.steps', { n: Math.min(step + 1, 5), total: 5 })); dots.querySelectorAll('.dot').forEach((d, i) => { d.classList.toggle('done', i < step); d.classList.toggle('now', i === step); }); },
    reset() { clear(prompt); clear(play); f.onEar = null; f.onHelp = null; f.help.classList.remove('glow'); f.help.hidden = false; f.ear.hidden = false; },
  };
  const cb = castbar({ ear: () => f.onEar?.(), help: () => f.onHelp?.() });
  f.bubble = cb.bubble; f.ear = cb.ear!; f.help = cb.help!;
  f.root = h('div', { class: 'frame ' + (o.cls || ''), 'data-sky': o.sky || '' }, top, h('div', { class: 'stage' }, h('div', { class: 'play-pane' }, banner, prompt, play), side), cb.el);
  if (o.place) f.setPlace(o.place);
  return f;
}

/** A bottom sheet (ask the stork, verse sheet, name entry…). */
let sheetSeq = 0;
export function sheet(content: Child, o: { testid?: string; onClose?: () => void; title?: string } = {}): { el: HTMLElement; close: () => void } {
  const opener = document.activeElement as HTMLElement | null;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    el.classList.add('closing'); setTimeout(() => el.remove(), 180); o.onClose?.(); document.removeEventListener('keydown', esc);
    if (opener?.isConnected) opener.focus({ preventScroll: true });   // focus goes back where it was
  };
  // Escape closes; Tab stays inside the sheet (a modal dialog)
  const esc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };
  const titleId = 'sheet-title-' + ++sheetSeq;
  const el = h('div', { class: 'sheet-wrap', 'data-testid': o.testid || 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, onclick: (e: Event) => { if (e.target === el) close(); } },
    h('div', { class: 'sheet' },
      h('div', { class: 'sheet-head' }, o.title ? h('h2', { id: titleId }, o.title) : h('span'), iconBtn('cross', 'aria.close', 'sheet-close', close)),
      h('div', { class: 'sheet-body' }, content)));
  // no title: the dialog is named by its first line of text (the name sheet's question, a verse sheet's heading…)
  if (!o.title) { const lead = el.querySelector('.sheet-body h2, .sheet-body h3, .sheet-body p'); if (lead) lead.id = titleId; else el.removeAttribute('aria-labelledby'); }
  (el as HTMLElement & { kqClose?: () => void }).kqClose = close;
  document.body.appendChild(el);
  document.addEventListener('keydown', esc);
  setTimeout(() => (el.querySelector('button, input') as HTMLElement | null)?.focus(), 50);
  return { el, close };
}

export function toast(text: string, ms = 2400, cls = '') {
  const el = h('div', { class: 'toast ' + cls, role: 'status' }, text);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms / env.speed);
}

export function lanternRow(n: number, max: number, color: string): HTMLElement {
  return h('div', { class: 'lantern-row' }, ...Array.from({ length: max }, (_, i) => h('span', { class: 'mini-lantern' + (i < n ? ' on' : '') }, lanternArt(color, i < n))));
}
