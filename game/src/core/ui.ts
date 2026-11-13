// Shared UI pieces: buttons, the verse card, the play frame (top bar, banner, prompt, play zone, cast bar), sheets.
import { h, svg, clear, type Child } from './h';
import { t, num, has } from './copy';
import { iconEl, charArt, lanternArt } from '../art';
import { sfx } from './sfx';
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
  const b = h('button', { type: 'button', class: 'icon-btn ' + cls, 'aria-label': t(ariaKey), title: t(ariaKey), 'data-testid': testid }, iconEl(id));
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
export function muteBtn(): HTMLButtonElement {
  const st = settings();
  const all = () => st.recitation || st.voices || st.sfx;
  const b = iconBtn(all() ? 'speaker' : 'mute', 'aria.mute', 'btn-mute', () => {
    const on = !all();
    st.voices = on; st.sfx = on; save();
    b.replaceChildren(iconEl(on ? 'speaker' : 'mute'));
  });
  return b;
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
    o.mishmish !== false ? h('div', { class: 'cast cast-mishmish', 'data-char': 'mishmish' }, charArt('mishmish')) : null,
    o.laqlaq ? h('div', { class: 'cast cast-laqlaq', 'data-char': 'laqlaq' }, charArt('laqlaq')) : null,
    bubble,
    o.amin !== false ? h('div', { class: 'cast cast-amin', 'data-char': 'amin' }, charArt('amin', 'idle', profile().lantern)) : null,
    help);
  setBubbleHost(bubble);
  return { el, bubble, ear, help: helpBtn };
}

export interface Frame {
  root: HTMLElement; top: HTMLElement; banner: HTMLElement; prompt: HTMLElement; play: HTMLElement; side: HTMLElement;
  bubble: HTMLElement; ear: HTMLButtonElement; help: HTMLButtonElement;
  setBanner(titleKey: string, iconId: string, howKey?: string): void;
  setDots(step: number): void;
  onEar: (() => void) | null; onHelp: (() => void) | null;
  reset(): void;
}

/** The shared frame of levels, challenges and polish (§8.1). */
export function frame(poem: Poem, o: { back: () => void; dots?: boolean; title?: string; cls?: string; scenePlace?: string; sky?: string }): Frame {
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
    setDots(step) { dots.setAttribute('aria-label', t('aria.steps', { n: Math.min(step + 1, 5), total: 5 })); dots.querySelectorAll('.dot').forEach((d, i) => { d.classList.toggle('done', i < step); d.classList.toggle('now', i === step); }); },
    reset() { clear(prompt); clear(play); f.onEar = null; f.onHelp = null; f.help.classList.remove('glow'); f.help.hidden = false; f.ear.hidden = false; },
  };
  const cb = castbar({ ear: () => f.onEar?.(), help: () => f.onHelp?.() });
  f.bubble = cb.bubble; f.ear = cb.ear!; f.help = cb.help!;
  f.root = h('div', { class: 'frame ' + (o.cls || ''), 'data-sky': o.sky || '' }, top, h('div', { class: 'stage' }, h('div', { class: 'play-pane' }, banner, prompt, play), side), cb.el);
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

export function toast(text: string, ms = 2400) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms / env.speed);
}

export function lanternRow(n: number, max: number, color: string): HTMLElement {
  return h('div', { class: 'lantern-row' }, ...Array.from({ length: max }, (_, i) => h('span', { class: 'mini-lantern' + (i < n ? ' on' : '') }, lanternArt(color, i < n))));
}
