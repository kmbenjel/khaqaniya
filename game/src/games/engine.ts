// What all mini-games share (GAME_DESIGN §4.3): the round score, gentle wrong answers, the help lantern, auto-hints,
// keyboard keys, rate-limited voice feedback, the test hooks (solve / fail), and the choice of wrong options (§4.6).
import { h } from '../core/h';
import { t } from '../core/copy';
import type { Poem, Token, Verse, Where } from '../core/data';
import type { Frame } from '../core/ui';
import type { Rng } from '../core/rng';
import { shuffle } from '../core/rng';
import { sfx } from '../core/sfx';
import { say, sayPick } from '../core/voice';
import { adapt, learned, profile, save, settings, type Level } from '../core/store';
import { env, emit, sleep } from '../core/env';
import { play, hasAudio, type ClipKind } from '../core/audio';

export type Mode = 'learn' | 'replay' | 'boss' | 'polish';
export interface Params { options: number; blanks: number; g6rung: number; echo: boolean; fall: number; hintAfter: number; howTimes: number; level: Level }
export interface GameCtx {
  poem: Poem; verse: Verse; frame: Frame; rng: Rng; signal: AbortSignal; mode: Mode; p: Params; rung?: number;
  round: Round; noRhymeBlank?: boolean;
}

export function params(n: number): Params {
  const pr = profile(); const L = pr.level; const b = pr.boost;
  const clamp = (x: number, a: number, z: number) => Math.max(a, Math.min(z, x));
  const baseOpt = L === 'easy' ? (n <= 3 ? 2 : 3) : L === 'mid' ? 3 : 4;
  const baseBl = L === 'easy' ? (n >= 4 ? 2 : 1) : L === 'mid' ? 2 : 3;
  const baseR = L === 'easy' ? 1 : L === 'mid' ? 2 : 3;
  return {
    options: clamp(baseOpt + b, 2, 4), blanks: Math.max(1, baseBl + b), g6rung: clamp(baseR + b, 1, 4), echo: L !== 'strong' && !settings().grownupMode,
    fall: L === 'easy' ? 4.5 : L === 'mid' ? 3.5 : 2.8, hintAfter: L === 'strong' ? 3 : 2, howTimes: settings().grownupMode || L === 'strong' ? 0 : L === 'mid' ? 1 : 3, level: L,
  };
}

/** Score of one round: 3 = no wrong tap and no help · 2 = one of either · 1 = more (never 0). */
export class Round {
  wrongs = 0; helps = 0; items = 0;
  wrong() { this.wrongs++; }
  help() { this.helps++; }
  score(): number { const m = this.wrongs + this.helps; return m === 0 ? 3 : m === 1 ? 2 : 1; }
}

// ── test hooks: the current item knows its right and a wrong target ──────────────────
interface Active { right: () => Element | null; wrong: () => Element | null; label?: string }
let active: Active | null = null;
export function setActive(a: Active | null) { active = a; emit('kq:item', { label: a?.label || null }); }
export const getActive = () => active;
/** A key typed into a field (a name, the grown-ups' answer) is never a game key. */
export const typing = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)); };
export function tapVisibly(el: Element | null): boolean {
  if (!el || !(el as HTMLElement).isConnected) return false;
  if (env.capture || env.pointer) {
    const r = el.getBoundingClientRect();
    const dot = h('div', { class: 'tap-dot', style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' } });
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  }
  (el as HTMLElement).click();
  return true;
}

// ── feedback ─────────────────────────────────────────────────────────────────────────
let praiseCount = 0, wrongCount = 0;
export function praise(ctx: GameCtx) {
  sfx('pop'); sfx('sparkle');
  praiseCount++;
  if (praiseCount % 2 === 0) void sayPick('fb.right', ctx.rng);
}
export function retry(ctx: GameCtx) {
  sfx('thud');
  wrongCount++;
  if (wrongCount % 3 === 1) void sayPick('fb.retry', ctx.rng);
}
export function wobble(el: Element) { el.classList.remove('wobble'); void (el as HTMLElement).offsetWidth; el.classList.add('wobble'); setTimeout(() => el.classList.remove('wobble'), 320); }
/** Speak a game's instruction the first N times it is met (by level), else only show its banner. */
export async function how(ctx: GameCtx, gameKey: string, howKey: string) {
  const pr = profile();
  const seen = pr.seen.how[gameKey] || 0;
  pr.seen.how[gameKey] = seen + 1; save();
  if (seen < ctx.p.howTimes) await say(howKey, { signal: ctx.signal }).catch(() => {});
}
export async function playClip(ctx: GameCtx, v: Verse, kind: ClipKind) { await play(v, kind, ctx.signal); }

// ── choosing among options ─────────────────────────────────────────────────────────
export interface Opt { label: Node | string; value: string; audio?: () => Promise<void>; cls?: string; sub?: Node | string }
/**
 * Renders options into `into`; resolves when the right one (value === answer) is tapped. A wrong tap wobbles, thuds,
 * replays the prompt; after `hintAfter` wrong taps the right one glows. Help: 1st press replays, 2nd removes a wrong one.
 */
export function choose(ctx: GameCtx, into: HTMLElement, opts: Opt[], answer: string, o: { replay?: () => void; audioCards?: boolean; label?: string; onRight?: (el: HTMLElement) => void; keys?: boolean } = {}): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    let wrongHere = 0, helpHere = 0, done = false;
    into.replaceChildren();
    into.classList.add('options', 'n' + opts.length);
    into.classList.toggle('words', opts.some((op) => /\bword\b/.test(op.cls || '')));   // class, not :has() (old Chrome/Safari)
    const els: HTMLElement[] = [];
    const onKey = (e: KeyboardEvent) => {
      if (done || typing(e)) return;
      const k = Number(e.key);
      if (k >= 1 && k <= els.length) { e.preventDefault(); els[k - 1].click(); }
    };
    const cleanup = () => { done = true; document.removeEventListener('keydown', onKey); ctx.frame.onHelp = null; };
    ctx.signal.addEventListener('abort', () => { cleanup(); reject(new DOMException('aborted', 'AbortError')); }, { once: true });
    opts.forEach((op, i) => {
      const card = h('button', { type: 'button', class: 'opt ' + (op.cls || '') + (o.audioCards ? ' opt-audio' : ''), 'data-testid': 'opt-' + i, 'data-value': op.value, 'aria-keyshortcuts': String(i + 1) },
        h('span', { class: 'opt-key', 'aria-hidden': 'true' }, String(i + 1)), h('span', { class: 'opt-label' }, op.label), op.sub ? h('span', { class: 'opt-sub' }, op.sub) : null);
      if (op.audio) {
        const ear = h('span', { class: 'opt-ear', role: 'button', tabindex: '0', 'aria-label': t('aria.ear'), 'data-testid': 'opt-ear-' + i, onclick: (e: Event) => { e.stopPropagation(); void op.audio!(); },
          onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); void op.audio!(); } } }, '');
        ear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M11 10a2 2 0 0 1 4 0"/></svg>';
        card.appendChild(ear);
      }
      card.addEventListener('click', () => {
        if (done || card.classList.contains('gone')) return;
        // audio cards (G1 rung 1, §4.3): the first tap plays the card and shows its ✓; a tap on a card already heard chooses it
        if (o.audioCards && op.audio && !card.classList.contains('heard')) {
          els.forEach((e) => e.classList.remove('heard'));
          card.classList.add('heard');
          sfx('tap');
          void op.audio();
          return;
        }
        if (op.value === answer) {
          cleanup();
          card.classList.add('right');
          els.forEach((e) => e !== card && e.classList.add('dim'));
          adapt(wrongHere === 0 && helpHere === 0);
          praise(ctx);
          o.onRight?.(card);
          setActive(null);
          resolve(wrongHere === 0 && helpHere === 0);
        } else {
          wrongHere++; ctx.round.wrong();
          wobble(card); retry(ctx);
          o.replay?.();
          if (wrongHere >= ctx.p.hintAfter) { const g = els.find((e) => e.dataset.value === answer); if (g && !g.classList.contains('glow')) { g.classList.add('glow'); void say('fb.hint.glow').catch(() => {}); } }
        }
      });
      els.push(card);
      into.appendChild(card);
    });
    if (o.keys !== false) document.addEventListener('keydown', onKey);
    ctx.frame.onHelp = () => {
      if (done) return;
      helpHere++; ctx.round.help();
      if (helpHere === 1 && o.replay) { o.replay(); void say('game.help.listen').catch(() => {}); return; }
      const wrong = els.filter((e) => e.dataset.value !== answer && !e.classList.contains('gone'));
      if (wrong.length > 1 || (wrong.length === 1 && els.length - 1 > 1)) { wrong[0].classList.add('gone'); void say('game.help.remove').catch(() => {}); }
      else els.find((e) => e.dataset.value === answer)?.classList.add('glow');
    };
    setActive({ right: () => els.find((e) => e.dataset.value === answer) || null, wrong: () => els.find((e) => e.dataset.value !== answer && !e.classList.contains('gone')) || null, label: o.label });
  });
}

// ── wrong options (§4.6) ───────────────────────────────────────────────────────────
const isOptionable = (tk: Token) => !tk.locked;
const canBeWrong = (tk: Token) => !tk.locked && !tk.sacred;
/** A hemistich may be shown as a wrong option only if none of its words is locked or sacred. */
export const hemiCanBeWrong = (v: Verse, w: Where) => (w === 'sadr' ? v.sadrT : v.ajzT).every(canBeWrong);

export function wrongTokens(ctx: GameCtx, answer: Token, count: number, exclude: Set<string> = new Set()): Token[] {
  const { poem, verse, rng } = ctx;
  const inVerse = new Set(verse.all.map((t) => t.bare));
  const pool: Token[] = [];
  const seen = new Set<string>([answer.bare, ...exclude]);
  const others = shuffle(poem.verses.filter((v) => v.n !== verse.n), rng).sort((a, b) => Number(learned(b.n)) - Number(learned(a.n)));
  const pass = (tol: number) => {
    for (const v of others) for (const tk of v.all) {
      if (pool.length >= count) return;
      if (!canBeWrong(tk) || tk.rhyme !== answer.rhyme || seen.has(tk.bare) || inVerse.has(tk.bare)) continue;
      if (Math.abs(tk.len - answer.len) > tol) continue;
      pool.push(tk); seen.add(tk.bare);
    }
  };
  pass(2); if (pool.length < count) pass(4); if (pool.length < count) pass(99);
  return pool.slice(0, count);
}

export function wrongRhymes(ctx: GameCtx, v: Verse, count: number): Token[] {
  const answer = v.ajzT[v.ajzT.length - 1];
  const inVerse = new Set(v.all.map((t) => t.bare));
  const seen = new Set([answer.bare]);
  const out: Token[] = [];
  const others = shuffle(ctx.poem.verses.filter((x) => x.n !== v.n), ctx.rng).sort((a, b) => Number(learned(b.n)) - Number(learned(a.n)));
  for (const o of others) {
    const r = o.ajzT[o.ajzT.length - 1];
    if (out.length >= count) break;
    if (!canBeWrong(r) || seen.has(r.bare) || inVerse.has(r.bare)) continue;
    out.push(r); seen.add(r.bare);
  }
  return out;
}

/** Other verses for hemistich options: same district first, then neighbours; never one starting like the answer. */
export function otherVerses(ctx: GameCtx, v: Verse, count: number, where: Where): Verse[] {
  const d = ctx.poem.districts.find((x) => x.id === v.district)!;
  const first2 = (x: Verse) => (where === 'sadr' ? x.sadrT : x.ajzT).slice(0, 2).map((t) => t.bare).join(' ');
  const a = first2(v);
  const ok = (x: Verse) => x.n !== v.n && first2(x) !== a && hemiCanBeWrong(x, where);
  const same = shuffle(ctx.poem.verses.filter((x) => x.n >= d.from && x.n <= d.to && ok(x)), ctx.rng);
  const near = ctx.poem.verses.filter((x) => (x.n < d.from || x.n > d.to) && ok(x)).sort((p, q) => Math.abs(p.n - v.n) - Math.abs(q.n - v.n));
  return [...same, ...near].slice(0, count);
}
export { isOptionable, canBeWrong, hasAudio };
export const pause = (ctx: GameCtx, ms: number) => sleep(ms, ctx.signal);
