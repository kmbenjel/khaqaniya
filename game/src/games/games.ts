// The mini-games (GAME_DESIGN §4.3). Each renders into the frame and resolves with its round score 1..3.
import { h, svg } from '../core/h';
import { t, tt, has, family } from '../core/copy';
import type { Token, Verse, Where } from '../core/data';
import { shuffle, shuffleMoved, pick } from '../core/rng';
import { verseCard, hemiLine, btn, burst } from '../core/ui';
import { iconEl, artImg, charArt } from '../art';
import { icon } from '../art/icons';
import { sfx } from '../core/sfx';
import { say } from '../core/voice';
import { award, markWeak, profile, vs } from '../core/store';
import { play, stop, hasAudio } from '../core/audio';
import { bare, stripMarks, lastMark } from '../core/arabic';
import { env, sleep } from '../core/env';
import {
  choose, how, otherVerses, pause, playClip, praise, retry, setActive, wobble, wrongRhymes, wrongTokens, typing, type GameCtx, type Opt,
} from './engine';

const reduced = () => document.documentElement.classList.contains('reduce-motion');
const hemi = (v: Verse, w: Where) => (w === 'sadr' ? v.sadr : v.ajz);
const hemiT = (v: Verse, w: Where) => (w === 'sadr' ? v.sadrT : v.ajzT);

// ── G1 listen & pick ─────────────────────────────────────────────────────────────────
export async function g1(ctx: GameCtx): Promise<number> {
  const { verse: v, frame: f } = ctx;
  let rung = ctx.rung ?? (ctx.p.level === 'easy' ? 1 : ctx.p.level === 'mid' ? 2 : 3);
  if (!hasAudio(v) && rung === 1) rung = 2;
  const ask: Where = rung === 3 ? 'ajz' : 'sadr', ans: Where = rung === 3 ? 'sadr' : 'ajz';
  f.setBanner('game.listenPick', 'ear', rung === 1 ? 'game.listenPick.how.audio' : rung === 3 ? 'game.listenPick.how.rev' : 'game.listenPick.how');
  const card = verseCard(v, { onlySadr: ask === 'sadr', onlyAjz: ask === 'ajz', cls: 'prompt-card' });
  const blank = h('div', { class: 'hemi hemi-blank', 'aria-hidden': 'true' }, '…');
  if (ask === 'sadr') card.appendChild(blank); else card.insertBefore(blank, card.firstChild);
  f.prompt.replaceChildren(card);
  const replay = () => void play(v, ask, ctx.signal).catch(() => {});
  f.onEar = replay;
  await how(ctx, 'game.listenPick' + rung, rung === 1 ? 'game.listenPick.how.audio' : rung === 3 ? 'game.listenPick.how.rev' : 'game.listenPick.how');
  await playClip(ctx, v, ask);
  const others = otherVerses(ctx, v, ctx.p.options - 1, ans);
  const opts: Opt[] = shuffle([v, ...others], ctx.rng).map((x) => ({
    label: hemi(x, ans), value: String(x.n), cls: rung === 1 ? 'small-text' : '',
    audio: hasAudio(x) ? () => play(x, ans, ctx.signal).catch(() => {}) : undefined,
  }));
  const zone = h('div'); f.play.replaceChildren(zone);
  await choose(ctx, zone, opts, String(v.n), { replay, audioCards: rung === 1, label: 'g1' });
  blank.replaceWith(hemiLine(hemiT(v, ans), { cls: ans + ' just-placed' }));
  await playClip(ctx, v, 'verse');
  return ctx.round.score();
}

// ── G2 order the halves (and G9 chain shares the ordering engine) ────────────────────
interface Piece { v: Verse; where: Where | 'verse'; label: string }
async function orderPieces(ctx: GameCtx, pieces: Piece[], o: { banner: string; how: string; icon: string; slotsLabel?: boolean; cls?: string }): Promise<number> {
  const f = ctx.frame;
  f.setBanner(o.banner, o.icon, o.how);
  const slots = pieces.map((_, i) => h('div', { class: 'slot', 'data-testid': 'slot-' + i }, h('span', { class: 'slot-n' }, String(i + 1))));
  const size = pieces.length >= 4 ? ' many' : pieces.length >= 3 ? ' some' : '';   // classes, not :has() (old Chrome/Safari)
  f.root.classList.toggle('many-cards', pieces.length >= 4);
  f.prompt.replaceChildren(h('div', { class: 'slots ' + (o.cls || '') + size }, ...slots));
  const tray = h('div', { class: 'tray order-tray ' + (o.cls || '') + size });
  f.play.replaceChildren(tray);
  await how(ctx, o.banner, o.how);
  const order = shuffleMoved(pieces.map((_, i) => i), ctx.rng);
  let next = 0, wrongHere = 0, helpHere = 0;
  const cards: HTMLElement[] = [];
  const clip = (p: Piece) => (p.where === 'verse' ? play(p.v, 'verse', ctx.signal) : play(p.v, p.where, ctx.signal)).catch(() => {});
  await new Promise<void>((resolve, reject) => {
    ctx.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    const placeNext = (card: HTMLElement) => {
      const p = pieces[next];
      card.classList.add('placed');
      slots[next].replaceChildren(h('span', { class: 'slot-n' }, String(next + 1)), h('span', { class: 'slot-text' }, p.label));
      slots[next].classList.add('filled');
      sfx('clack');
      next++;
      void clip(p);
      if (next === pieces.length) { ctx.frame.onHelp = null; setActive(null); document.removeEventListener('keydown', onKey); f.root.classList.remove('many-cards'); resolve(); }
      else setTimeout(() => setActive(active), 0);
    };
    order.forEach((pi, k) => {
      const p = pieces[pi];
      const c = h('button', { type: 'button', class: 'opt piece', 'data-testid': 'tile-' + k, 'data-piece': pi },
        h('span', { class: 'opt-key' }, String(k + 1)), h('span', { class: 'opt-label' }, p.label));
      const ear = h('span', { class: 'opt-ear', role: 'button', tabindex: '0', 'aria-label': t('aria.ear'), onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); void clip(p); } } });
      ear.appendChild(svg(icon('ear')));
      ear.addEventListener('click', (e) => { e.stopPropagation(); void clip(p); });
      if (hasAudio(p.v)) c.appendChild(ear);
      c.addEventListener('click', () => {
        if (c.classList.contains('placed')) return;
        if (pi === next) { if (wrongHere === 0) praise(ctx); placeNext(c); }
        else { wrongHere++; ctx.round.wrong(); wobble(c); retry(ctx); if (wrongHere >= ctx.p.hintAfter) cards.find((x) => Number(x.dataset.piece) === next)?.classList.add('glow'); }
      });
      cards.push(c);
      tray.appendChild(c);
    });
    const onKey = (e: KeyboardEvent) => { if (typing(e)) return; const k = Number(e.key); if (k >= 1 && k <= cards.length) cards[k - 1].click(); };
    document.addEventListener('keydown', onKey);
    ctx.signal.addEventListener('abort', () => document.removeEventListener('keydown', onKey), { once: true });
    const active = { right: () => cards.find((x) => Number(x.dataset.piece) === next) || null, wrong: () => cards.find((x) => !x.classList.contains('placed') && Number(x.dataset.piece) !== next) || null, label: 'order' };
    setActive(active);
    ctx.frame.onHelp = () => {
      helpHere++; ctx.round.help();
      if (helpHere === 1) { void clip(pieces[next]); return; }
      const c = cards.find((x) => Number(x.dataset.piece) === next);
      if (c) placeNext(c);
    };
  });
  return ctx.round.score();
}
export async function g2(ctx: GameCtx): Promise<number> {
  const { verse: v, poem } = ctx;
  const rung = ctx.rung ?? 1;
  const k = rung - 1 + (v.joined ? 1 : 0);
  const prevs = k > 0 ? poem.verses.filter((x) => x.n < v.n).slice(-k) : [];
  const vv = [...prevs, v];
  if (v.joined && vv.length < 2) return g1(ctx);
  const pieces: Piece[] = vv.flatMap((x): Piece[] => (x.joined || v.joined ? [{ v: x, where: 'verse', label: x.sadr + ' ' + x.ajz }] : [{ v: x, where: 'sadr', label: x.sadr }, { v: x, where: 'ajz', label: x.ajz }]));
  // four or more hemistichs (rungs 2–3): «أُرَتِّبُ أَنْصَافَ الْأَبْيَاتِ», not «the two hemistichs» (A1, COPY_REVIEW §8)
  const s = await orderPieces(ctx, pieces, { banner: pieces.length >= 4 && has('game.orderHalves.many') ? 'game.orderHalves.many' : 'game.orderHalves', how: 'game.orderHalves.how', icon: 'pearls' });
  await playClip(ctx, v, 'verse');
  return s;
}
export async function g9(ctx: GameCtx, verses: Verse[]): Promise<number> {
  const sorted = verses.slice().sort((a, b) => a.n - b.n);
  const pieces: Piece[] = sorted.map((x) => ({ v: x, where: 'verse', label: x.sadrT.slice(0, 2).map((t) => t.t).join(' ') + ' …' }));
  return orderPieces(ctx, pieces, { banner: 'game.chain', how: 'game.chain.how', icon: 'chain', cls: 'chain' });
}

// ── G3 the runaway word ──────────────────────────────────────────────────────────────
export function pickBlanks(ctx: GameCtx, count: number): Token[] {
  const v = ctx.verse;
  const weak = vs(v.n)?.weak || {};
  const cand = v.all.filter((tk) => !tk.locked && !(count === 1 && tk.where === 'sadr' && tk.i === 0) && !(ctx.noRhymeBlank && tk.rhyme));
  const tiers = [cand.filter((tk) => weak[tk.key]), cand.filter((tk) => !weak[tk.key] && tk.len >= 4), cand.filter((tk) => !weak[tk.key] && tk.len < 4)];
  const out: Token[] = [];
  for (const tier of tiers) for (const tk of shuffle(tier, ctx.rng)) if (out.length < count) out.push(tk);
  return out.sort((a, b) => (a.where === b.where ? a.i - b.i : a.where === 'sadr' ? -1 : 1));
}
export async function g3(ctx: GameCtx, blanksOverride?: number): Promise<number> {
  const { verse: v, frame: f } = ctx;
  const n = blanksOverride ?? ctx.p.blanks;
  const blanks = pickBlanks(ctx, Math.min(n, v.all.filter((x) => !x.locked).length - 1));
  f.setBanner('game.missingWord', 'magnifier', blanks.length > 1 ? 'game.missingWord.how.many' : 'game.missingWord.how');
  const slots = new Map<string, HTMLElement>();
  const card = verseCard(v, { cls: 'prompt-card', slot: (tk) => {
    if (!blanks.includes(tk)) return null;
    const s = h('span', { class: 'blank', 'data-testid': 'blank-' + tk.key, 'aria-label': t('aria.slot', { n: blanks.indexOf(tk) + 1 }) }, ' '.repeat(Math.max(3, tk.len)));
    slots.set(tk.key, s); return s;
  } });
  f.prompt.replaceChildren(card);
  f.onEar = () => void play(v, 'verse', ctx.signal).catch(() => {});
  const pr = profile();
  if (!pr.seen.tips.includes('game.missingWord.mishmish')) { pr.seen.tips.push('game.missingWord.mishmish'); void say('game.missingWord.mishmish', { signal: ctx.signal }).catch(() => {}); }
  await how(ctx, 'game.missingWord', blanks.length > 1 ? 'game.missingWord.how.many' : 'game.missingWord.how');
  // Mishmish's paw prints (inline SVG: the emoji showed as boxes without an emoji font)
  const paw = '<svg viewBox="0 0 24 24" class="paw" fill="currentColor"><ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><ellipse cx="5.6" cy="10.2" rx="2.2" ry="2.8"/><ellipse cx="9.6" cy="6.4" rx="2.2" ry="2.9"/><ellipse cx="14.4" cy="6.4" rx="2.2" ry="2.9"/><ellipse cx="18.4" cy="10.2" rx="2.2" ry="2.8"/></svg>';
  const zone = h('div'); f.play.replaceChildren(h('div', { class: 'paws', 'aria-hidden': 'true' }, svg(paw), svg(paw), svg(paw)), zone);
  for (const b of blanks) {
    const s = slots.get(b.key)!;
    s.classList.add('active');
    const wrongs = wrongTokens(ctx, b, ctx.p.options - 1);
    const opts: Opt[] = shuffle([b, ...wrongs], ctx.rng).map((tk) => ({ label: tk.t, value: tk.t, cls: 'word' }));
    await choose(ctx, zone, opts, b.t, { replay: () => void play(v, b.where, ctx.signal).catch(() => {}), label: 'g3' });
    s.textContent = b.t; s.classList.remove('active'); s.classList.add('filled');
    await pause(ctx, 350);
  }
  await playClip(ctx, v, 'verse');
  return ctx.round.score();
}

// ── G4 catch the rhyme ───────────────────────────────────────────────────────────────
export async function g4(ctx: GameCtx, waves: Verse[] = [ctx.verse]): Promise<number> {
  const f = ctx.frame;
  const rk = reduced() ? 'game.rhyme.reduced' : 'game.rhyme.how';
  f.setBanner('game.rhyme', 'pearl', rk);
  await how(ctx, 'game.rhyme', rk);
  for (const v of waves) {
    if (v !== waves[0]) await say('game.rhyme.wave2', { signal: ctx.signal }).catch(() => {});
    const answer = v.ajzT[v.ajzT.length - 1];
    const socket = h('span', { class: 'blank socket', 'data-testid': 'socket' }, '…ـرِ');
    const card = verseCard(v, { cls: 'prompt-card', slot: (tk) => (tk === answer ? socket : null) });
    f.prompt.replaceChildren(card);
    f.onEar = () => void play(v, 'ajz', ctx.signal).catch(() => {});
    const wrongs = wrongRhymes(ctx, v, 2);
    const items = shuffle([answer, ...wrongs], ctx.rng);
    if (reduced()) {
      const zone = h('div'); f.play.replaceChildren(zone);
      await choose(ctx, zone, items.map((tk) => ({ label: tk.t, value: tk.t, cls: 'word pearl-opt' })), answer.t, { replay: f.onEar, label: 'g4' });
    } else await lanes(ctx, items, answer);
    socket.textContent = answer.t; socket.classList.add('filled');
    await playClip(ctx, v, 'ajz');
  }
  return ctx.round.score();
}

function lanes(ctx: GameCtx, items: Token[], answer: Token): Promise<void> {
  const f = ctx.frame;
  return new Promise<void>((resolve, reject) => {
    const field = h('div', { class: 'lanes', 'data-testid': 'lanes' });
    // the catcher is Mishmish in his basket (the drawn pose; a plain basket under the SVG fallback)
    const basket = h('div', { class: 'basket', 'aria-hidden': 'true' }, charArt('mishmish', 'basket'));
    let pos = 1, wave = 0, wrongHere = 0, helpHere = 0, done = false;
    const laneEls: HTMLButtonElement[] = [];
    const finish = () => { done = true; document.removeEventListener('keydown', onKey); ctx.frame.onHelp = null; setActive(null); };
    ctx.signal.addEventListener('abort', () => { finish(); reject(new DOMException('aborted', 'AbortError')); }, { once: true });
    const startWave = () => {
      wave++;
      laneEls.forEach((lane, i) => {
        lane.querySelector('.fall')?.remove();
        lane.classList.remove('out');
        const p = h('span', { class: 'fall', style: { animationDuration: ctx.p.fall / env.speed + 's', animationDelay: (i * 0.25) / env.speed + 's' } }, h('span', { class: 'pearl-word' }, items[i].t));
        if (i === items.length - 1) p.addEventListener('animationend', () => { if (!done) startWave(); });
        lane.appendChild(p);
      });
      if (wrongHere >= ctx.p.hintAfter) laneEls[items.indexOf(answer)].classList.add('glow');
    };
    const catchLane = (i: number) => {
      if (done) return;
      pos = i; basket.style.setProperty('--pos', String(i));
      const lane = laneEls[i];
      if (lane.classList.contains('out')) return;
      if (items[i] === answer) {
        lane.classList.add('caught');
        lane.querySelector('.fall')?.classList.add('caught');
        praise(ctx, lane.querySelector('.pearl-word'), wrongHere >= 2);
        finish();
        setTimeout(resolve, 450 / env.speed);
      } else {
        wrongHere++; ctx.round.wrong();
        lane.classList.add('out'); retry(ctx);
        lane.querySelector('.fall')?.classList.add('bounce');
        if (wrongHere >= ctx.p.hintAfter) laneEls[items.indexOf(answer)].classList.add('glow');
      }
    };
    items.forEach((tk, i) => {
      const lane = h('button', { type: 'button', class: 'lane', 'data-testid': 'lane-' + i, 'data-value': tk.t, 'aria-label': tk.t }) as HTMLButtonElement;
      lane.addEventListener('click', () => catchLane(i));
      laneEls.push(lane); field.appendChild(lane);
    });
    field.appendChild(basket);
    basket.style.setProperty('--pos', '1');
    f.play.replaceChildren(field);
    const onKey = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (e.key === 'ArrowLeft') { pos = Math.min(items.length - 1, pos + 1); basket.style.setProperty('--pos', String(pos)); }
      else if (e.key === 'ArrowRight') { pos = Math.max(0, pos - 1); basket.style.setProperty('--pos', String(pos)); }
      else if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); catchLane(pos); }
      else { const k = Number(e.key); if (k >= 1 && k <= items.length) catchLane(k - 1); }
    };
    document.addEventListener('keydown', onKey);
    ctx.frame.onHelp = () => {
      helpHere++; ctx.round.help();
      if (helpHere === 1) { f.onEar?.(); return; }
      const w = laneEls.find((l, i) => items[i] !== answer && !l.classList.contains('out'));
      if (w) w.classList.add('out'); else laneEls[items.indexOf(answer)].classList.add('glow');
    };
    setActive({ right: () => laneEls[items.indexOf(answer)], wrong: () => laneEls.find((l, i) => items[i] !== answer && !l.classList.contains('out')) || null, label: 'g4' });
    startWave();
    void wave;
  });
}

// ── G4r rhyme radar (tutorial, verse 1) ──────────────────────────────────────────────
const endsInRa = (s: string) => /ر$/.test(stripMarks(s));
/** The radar's line for a caught decoy: Mishmish's sardine joke on «سَرْدِينٌ» (compared without marks: the harakat sit
 *  between the letters, so a test on the vocalised word never matched), else the plain miss line. */
const missLine = (w: string) => (stripMarks(w).includes('سردين') ? 'game.rhymeRadar.sardine' : 'game.rhymeRadar.miss');
export async function g4radar(ctx: GameCtx): Promise<number> {
  const { poem, frame: f } = ctx;
  const d = poem.districts[0];
  const real = poem.verses.filter((x) => x.n >= d.from && x.n <= d.to).map((x) => x.ajzT[x.ajzT.length - 1]).filter((tk) => endsInRa(tk.t));
  const reals = shuffle(uniqBy(real, (x) => x.bare), ctx.rng).slice(0, 5).map((tk) => tk.t);
  let decoys = family('decoy').map((k) => t(k)).filter((s) => !endsInRa(s));
  if (decoys.length < 3) {
    const pool = poem.verses.filter((x) => x.n >= d.from && x.n <= d.to).flatMap((x) => x.all).filter((tk) => !tk.locked && !tk.sacred && !tk.rhyme && tk.len >= 3 && !endsInRa(tk.t));
    decoys = [...decoys, ...shuffle(uniqBy(pool, (x) => x.bare), ctx.rng).map((x) => x.t)];
  }
  decoys = decoys.slice(0, 3);
  f.setBanner('game.rhymeRadar', 'pearl', 'game.rhymeRadar.how');
  f.prompt.replaceChildren(h('div', { class: 'radar-goal' }, h('span', { class: 'big-ra' }, 'ـرِ'), h('span', { class: 'radar-count', 'data-testid': 'radar-count' }, '0 / ' + reals.length)));
  await say('game.rhyme.tip', { signal: ctx.signal }).catch(() => {});
  await how(ctx, 'game.rhymeRadar', 'game.rhymeRadar.how');
  const queue = shuffle([...reals.map((w) => ({ w, ok: true })), ...decoys.map((w) => ({ w, ok: false }))], ctx.rng);
  let caught = 0;
  const count = f.prompt.querySelector('.radar-count')!;
  const field = h('div', { class: 'radar-field', 'data-testid': 'radar' });
  f.play.replaceChildren(field);
  if (reduced()) {
    await new Promise<void>((resolve, reject) => {
      ctx.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      const els = queue.map((q, i) => {
        const b = h('button', { type: 'button', class: 'opt word', 'data-testid': 'opt-' + i, 'data-ok': q.ok ? '1' : '0' }, q.w);
        b.addEventListener('click', () => {
          if (b.classList.contains('right')) return;
          if (q.ok) { b.classList.add('right'); praise(ctx, b); caught++; count.textContent = caught + ' / ' + reals.length; if (caught === reals.length) { setActive(null); resolve(); } }
          else { ctx.round.wrong(); wobble(b); sfx('thud'); void say(missLine(q.w), { signal: ctx.signal }).catch(() => {}); }
        });
        field.appendChild(b); return b;
      });
      // help lantern: each press takes one decoy away; with no decoy left the rhyme words glow
      f.onHelp = () => {
        ctx.round.help();
        const decoy = els.find((e) => e.dataset.ok === '0' && !e.classList.contains('gone'));
        if (decoy) { decoy.classList.add('gone'); void say('game.help.remove').catch(() => {}); }
        else els.filter((e) => e.dataset.ok === '1' && !e.classList.contains('right')).forEach((e) => e.classList.add('glow'));
      };
      setActive({ right: () => els.find((e) => e.dataset.ok === '1' && !e.classList.contains('right')) || null, wrong: () => els.find((e) => e.dataset.ok === '0' && !e.classList.contains('gone')) || null, label: 'radar' });
    });
    f.onHelp = null;
  } else {
    while (queue.length) {
      const q = queue.shift()!;
      const el = h('button', { type: 'button', class: 'radar-word', 'data-testid': 'radar-word', 'data-ok': q.ok ? '1' : '0', style: { animationDuration: (ctx.p.fall + 0.5) / env.speed + 's' } }, q.w);
      field.replaceChildren(el);
      let tapped = false;
      setActive({ right: () => (q.ok && !tapped ? el : null), wrong: () => (!q.ok && !tapped ? el : null), label: 'radar' });
      f.onHelp = () => { ctx.round.help(); if (q.ok) el.classList.add('glow'); };   // help: the falling rhyme word glows
      await new Promise<void>((resolve, reject) => {
        ctx.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        el.addEventListener('click', () => {
          if (tapped) return;
          tapped = true;
          if (q.ok) { burst(el); el.classList.add('caught'); praise(ctx); caught++; count.textContent = caught + ' / ' + reals.length; setTimeout(resolve, 380 / env.speed); }
          else { ctx.round.wrong(); el.classList.add('bounce'); sfx('thud'); void say(missLine(q.w), { signal: ctx.signal }).catch(() => {}); setTimeout(resolve, 380 / env.speed); }
        });
        el.addEventListener('animationend', () => { if (!tapped) { if (q.ok) queue.push(q); resolve(); } });
      });
    }
    setActive(null);
    f.onHelp = null;
  }
  await say('game.rhymeRadar.done', { signal: ctx.signal }).catch(() => {});
  return ctx.round.score();
}
function uniqBy<T>(a: T[], k: (x: T) => string): T[] { const s = new Set<string>(); return a.filter((x) => (s.has(k(x)) ? false : (s.add(k(x)), true))); }

// ── G5 verse & meaning ───────────────────────────────────────────────────────────────
export async function g5(ctx: GameCtx): Promise<number> {
  const { verse: v, frame: f, poem } = ctx;
  if (!v.meaning?.kid) return g1(ctx);
  const variant = ctx.p.level === 'easy' ? 'a' : 'b';
  const d = poem.districts.find((x) => x.id === v.district)!;
  if (variant === 'a') {
    f.setBanner('game.meaningMatch', 'think', 'game.meaningMatch.how');
    f.prompt.replaceChildren(h('div', { class: 'meaning-prompt' }, h('p', { class: 'kid-meaning' }, v.meaning.kid)));
    const replay = () => { if (v.meaningClip) void play(v, 'meaning', ctx.signal).catch(() => {}); };
    f.onEar = replay;
    await how(ctx, 'game.meaningMatch', 'game.meaningMatch.how');
    replay();
    const others = otherVerses(ctx, v, ctx.p.options - 1, 'sadr');
    const opts: Opt[] = shuffle([v, ...others], ctx.rng).map((x) => ({ label: x.sadr, value: String(x.n), audio: hasAudio(x) ? () => play(x, 'sadr', ctx.signal).catch(() => {}) : undefined }));
    const zone = h('div'); f.play.replaceChildren(zone);
    await choose(ctx, zone, opts, String(v.n), { replay, label: 'g5a' });
  } else {
    f.setBanner('game.meaningMatch', 'think', 'game.meaningMatch.how.b');
    f.prompt.replaceChildren(verseCard(v, { cls: 'prompt-card' }));
    f.onEar = () => void play(v, 'verse', ctx.signal).catch(() => {});
    await how(ctx, 'game.meaningMatch.b', has('game.meaningMatch.how.b') ? 'game.meaningMatch.how.b' : 'game.meaningMatch.how');
    const pool = shuffle(poem.verses.filter((x) => x.n !== v.n && x.meaning?.kid && x.meaning.kid !== v.meaning!.kid), ctx.rng)
      .sort((a, b) => Number(b.n >= d.from && b.n <= d.to) - Number(a.n >= d.from && a.n <= d.to)).slice(0, ctx.p.options - 1);
    const opts: Opt[] = shuffle([v, ...pool], ctx.rng).map((x) => ({ label: x.meaning!.kid!, value: String(x.n), cls: 'meaning-opt' }));
    const zone = h('div'); f.play.replaceChildren(zone);
    await choose(ctx, zone, opts, String(v.n), { replay: f.onEar, label: 'g5b' });
  }
  await playClip(ctx, v, 'verse');
  return ctx.round.score();
}

// ── G6 string the words ──────────────────────────────────────────────────────────────
export async function g6(ctx: GameCtx, rungOverride?: number): Promise<number> {
  const { verse: v, frame: f } = ctx;
  const rung = rungOverride ?? ctx.rung ?? ctx.p.g6rung;
  const bk = rung >= 4 ? 'game.build.how.extra' : rung <= 2 ? 'game.build.how.half' : 'game.build.how';
  f.setBanner('game.build', 'pearls', 'game.build.how');
  await how(ctx, 'game.build', 'game.build.how');
  if (rung >= 4 || (rung <= 2 && !profile().seen.tips.includes(bk))) { profile().seen.tips.push(bk); await say(bk, { signal: ctx.signal }).catch(() => {}); }
  const units: { tokens: Token[]; clip: 'sadr' | 'ajz' | 'verse' }[] = rung <= 2 && !v.joined
    ? [{ tokens: v.sadrT, clip: 'sadr' }, { tokens: v.ajzT, clip: 'ajz' }]
    : rung <= 2 ? [{ tokens: v.sadrT, clip: 'verse' }, { tokens: v.ajzT, clip: 'verse' }] : [{ tokens: v.all, clip: 'verse' }];
  const threads = h('div', { class: 'threads' });
  f.prompt.replaceChildren(threads);
  // Draw every unit's thread up front (RTL beads); the active one fills.
  const beadRows = units.map((u) => {
    const row = h('div', { class: 'thread', 'data-testid': 'thread' });
    const beads = u.tokens.map((tk) => h('span', { class: 'bead', 'data-key': tk.key }, ' '));
    if (rung >= 3) {   // whole verse: break the line at the hemistich boundary
      const s = u.tokens.findIndex((tk) => tk.where === 'ajz');
      row.append(h('div', { class: 'thread-line' }, ...beads.slice(0, s)), h('div', { class: 'thread-line' }, ...beads.slice(s)));
    } else row.append(h('div', { class: 'thread-line' }, ...beads));
    threads.appendChild(row);
    return beads;
  });
  for (let ui = 0; ui < units.length; ui++) {
    const u = units[ui];
    const beads = beadRows[ui];
    const pre = new Set<number>();
    u.tokens.forEach((tk, k) => { if (tk.locked) pre.add(k); });
    if (rung === 1) pre.add(0);
    if (ctx.p.level === 'easy') {   // tokens differing only in marks: pre-place the first of them
      u.tokens.forEach((tk, k) => { if (u.tokens.some((o, j) => j > k && o.bare === tk.bare && o.t !== tk.t)) pre.add(k); });
    }
    pre.forEach((k) => { beads[k].textContent = u.tokens[k].t; beads[k].classList.add('filled', 'pre'); });
    const remaining = u.tokens.map((tk, k) => ({ tk, k })).filter((x) => !pre.has(x.k));
    if (!remaining.length) continue;
    const extras = rung >= 4 ? wrongTokens(ctx, remaining[0].tk, 2, new Set(v.all.map((x) => x.bare))) : [];
    const trayItems = shuffleMoved([...remaining.map((x) => ({ t: x.tk.t, real: true })), ...extras.map((x) => ({ t: x.t, real: false }))], ctx.rng);
    const tray = h('div', { class: 'tray word-tray' });
    f.play.replaceChildren(tray);
    const clipPlay = () => void (u.clip === 'verse' ? play(v, 'verse', ctx.signal) : play(v, u.clip, ctx.signal)).catch(() => {});
    f.onEar = clipPlay;
    let idx = 0, wrongHere = 0, helpHere = 0;
    await new Promise<void>((resolve, reject) => {
      ctx.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      const tiles: HTMLElement[] = [];
      const want = () => remaining[idx];
      const markNext = () => beads.forEach((b, k) => b.classList.toggle('next', want() ? k === want().k : false));
      markNext();
      const place = (tile: HTMLElement) => {
        const w = want();
        beads[w.k].textContent = w.tk.t; beads[w.k].classList.add('filled', 'pop-in');
        tile.classList.add('used');
        sfx('clack');
        burst(beads[w.k], { n: 6, spread: 34 });
        idx++;
        markNext();
        if (idx === remaining.length) { f.onHelp = null; setActive(null); document.removeEventListener('keydown', onKey); resolve(); }
      };
      trayItems.forEach((it, k) => {
        const tile = h('button', { type: 'button', class: 'tile word', 'data-testid': 'tile-' + k, 'data-t': it.t }, it.t);
        tile.addEventListener('click', () => {
          if (tile.classList.contains('used')) return;
          if (it.t === want().tk.t && it.real) place(tile);
          else { wrongHere++; ctx.round.wrong(); wobble(tile); retry(ctx); if (wrongHere >= ctx.p.hintAfter + 1) tiles.find((x) => !x.classList.contains('used') && x.dataset.t === want().tk.t)?.classList.add('glow'); }
        });
        tiles.push(tile); tray.appendChild(tile);
      });
      const onKey = (e: KeyboardEvent) => { if (typing(e)) return; const n = Number(e.key); const free = tiles.filter((x) => !x.classList.contains('used')); if (n >= 1 && n <= free.length) free[n - 1].click(); };
      document.addEventListener('keydown', onKey);
      f.onHelp = () => {
        helpHere++; ctx.round.help();
        if (helpHere === 1) { clipPlay(); return; }
        const tile = tiles.find((x) => !x.classList.contains('used') && x.dataset.t === want().tk.t);
        if (tile) place(tile);
      };
      setActive({
        right: () => tiles.find((x) => !x.classList.contains('used') && want() && x.dataset.t === want().tk.t) || null,
        wrong: () => tiles.find((x) => !x.classList.contains('used') && want() && x.dataset.t !== want().tk.t) || null, label: 'g6',
      });
    });
    beads.forEach((b) => b.classList.remove('next'));
    beadRows[ui][0].closest('.thread')!.classList.add('knot');
    sfx('sparkle');
    burst(beadRows[ui][0].closest('.thread'), { n: 12 });
    await (u.clip === 'verse' ? playClip(ctx, v, 'verse') : playClip(ctx, v, u.clip));
  }
  void say('game.build.knot', { signal: ctx.signal }).catch(() => {});
  if (units.length > 1) await playClip(ctx, v, 'verse');
  return ctx.round.score();
}

// ── G7 say it from memory ────────────────────────────────────────────────────────────
export async function g7(ctx: GameCtx, o: { firstWord?: boolean } = {}): Promise<number> {
  const { verse: v, frame: f } = ctx;
  f.setBanner('game.recite', 'mic', 'game.recite.how');
  let listener = false, tries = 0;
  const showFirst = o.firstWord ?? true;
  // a pill like «بِبُطْءٍ» (a native box read as a broken picture, Argon), lit gold when on
  const toggle = h('label', { class: 'toggle pill-toggle listener-toggle' },
    h('input', { type: 'checkbox', 'data-testid': 'listener-toggle', onchange: (e: Event) => { listener = (e.target as HTMLInputElement).checked; toggle.classList.toggle('on', listener); void stage(); } }),
    iconEl('ear'), h('span', null, t('game.recite.listener')));
  const cloth = () => h('div', { class: 'cloth-card', 'data-testid': 'cloth' },
    h('div', { class: 'cloth-pearl', 'aria-hidden': 'true' }),
    showFirst ? h('div', { class: 'first-word' }, h('span', { class: 'hint-label' }, t('game.recite.firstWord')), ' ', h('span', { class: 'w' }, v.sadrT[0].t), ' …') : null);
  let resolveFn: (s: number) => void = () => {};
  let rejectFn: (e: unknown) => void = () => {};
  const result = new Promise<number>((res, rej) => { resolveFn = res; rejectFn = rej; });
  ctx.signal.addEventListener('abort', () => rejectFn(new DOMException('aborted', 'AbortError')), { once: true });
  const faces = (cap: number) => {
    const good = btn(t('rate.good'), { icon: 'smile', testid: 'rate-good', primary: true, onClick: () => done(Math.min(3, cap)) });
    const almost = btn(t('rate.almost'), { icon: 'meh', testid: 'rate-almost', onClick: () => done(Math.min(2, cap)) });
    const again = btn(t('rate.again'), { icon: 'again', testid: 'rate-again', onClick: () => { tries++; void say('game.recite.again', { signal: ctx.signal }).catch(() => {}); void stage(); } });
    f.play.replaceChildren(h('p', { class: 'rate-label' }, t('game.recite.rate')), h('div', { class: 'faces' }, good, almost, again), toggle);
    setActive({ right: () => good, wrong: () => again, label: 'g7-rate' });
  };
  const done = (s: number) => { setActive(null); f.onHelp = null; praise(ctx); resolveFn(s); };
  const stage = async () => {
    stop();
    if (listener) {
      award('listener');
      f.prompt.replaceChildren(h('p', { class: 'listener-tip' }, t('game.recite.listener.how')), verseCard(v, { cls: 'prompt-card markable' }), h('p', { class: 'listener-tip' }, t('listener.mark')));
      f.prompt.querySelectorAll<HTMLElement>('.w').forEach((w) => w.addEventListener('click', () => {
        w.classList.toggle('missed');
        if (w.classList.contains('missed')) markWeak(v.n, w.dataset.key!);
      }));
      const ok = btn(t('listener.ok'), { icon: 'check', testid: 'listener-ok', primary: true, onClick: () => done(tries ? 2 : f.prompt.querySelector('.missed') ? 2 : 3) });
      const again = btn(t('listener.again'), { icon: 'again', testid: 'listener-again', onClick: () => { tries++; void play(v, 'verse', ctx.signal).catch(() => {}); } });
      f.play.replaceChildren(h('div', { class: 'faces' }, ok, again), toggle);
      (toggle.querySelector('input') as HTMLInputElement).checked = true;
      setActive({ right: () => ok, wrong: () => again, label: 'g7-listener' });
      return;
    }
    f.prompt.replaceChildren(cloth());
    const reveal = btn(t('game.recite.reveal'), { icon: 'eye', testid: 'recite-reveal', primary: true, onClick: async () => {
      sfx('reveal');
      f.prompt.replaceChildren(h('p', { class: 'compare-label' }, t('game.recite.compare')), verseCard(v, { cls: 'prompt-card revealed' }));
      f.play.replaceChildren(h('div', { class: 'wait-clip' }, iconEl('ear')));
      setActive(null);
      await playClip(ctx, v, 'verse').catch(() => {});
      faces(tries ? 2 : 3);
    } });
    f.play.replaceChildren(reveal, toggle);
    setActive({ right: () => reveal, wrong: () => null, label: 'g7-reveal' });
  };
  f.onEar = () => { if (f.prompt.querySelector('.revealed')) void play(v, 'verse', ctx.signal).catch(() => {}); };
  f.onHelp = () => { ctx.round.help(); void play(v, 'sadr', ctx.signal).catch(() => {}); };
  await how(ctx, 'game.recite', 'game.recite.how');
  await stage();
  return result;
}

// ── G8 which verse comes next? ───────────────────────────────────────────────────────
export async function g8(ctx: GameCtx, prev: Verse): Promise<number> {
  const { verse: v, frame: f } = ctx;
  f.setBanner('game.next', 'chain', 'game.next.how');
  f.prompt.replaceChildren(verseCard(prev, { cls: 'prompt-card prev-card' }));
  f.onEar = () => void play(prev, 'verse', ctx.signal).catch(() => {});
  await how(ctx, 'game.next', 'game.next.how');
  void playClip(ctx, prev, 'verse').catch(() => {});   // the options come at once; the previous verse plays meanwhile
  const k = Math.min(3, Math.max(2, ctx.p.options));
  const others = otherVerses(ctx, v, k, 'sadr').filter((x) => x.n !== prev.n).slice(0, k - 1);
  const opts: Opt[] = shuffle([v, ...others.slice(0, k - 1)], ctx.rng).map((x) => ({ label: x.sadr, value: String(x.n), audio: hasAudio(x) ? () => play(x, 'sadr', ctx.signal).catch(() => {}) : undefined }));
  const zone = h('div'); f.play.replaceChildren(zone);
  await choose(ctx, zone, opts, String(v.n), { replay: f.onEar, label: 'g8' });
  f.prompt.appendChild(h('div', { class: 'thread-join', 'aria-hidden': 'true' }));
  void say('game.next.thread', { signal: ctx.signal }).catch(() => {});
  f.prompt.appendChild(verseCard(v, { cls: 'prompt-card next-card' }));
  // the two verses back to back (~20 s with the reciter): the child may go on at any time
  const go = btn(t('btn.next'), { icon: 'next', primary: true, testid: 'btn-next', cls: 'next-btn' });
  f.play.replaceChildren(h('div', { class: 'next-row' }, go));
  let skipped = false;
  const skip = new Promise<void>((r) => go.addEventListener('click', () => { skipped = true; stop(); r(); }, { once: true }));
  setActive({ right: () => go, wrong: () => null, label: 'next' });
  await Promise.race([(async () => { await playClip(ctx, prev, 'verse'); if (!skipped) await playClip(ctx, v, 'verse'); })(), skip]);
  setActive(null);
  return ctx.round.score();
}

// ── S2 hats (workshop special): pick the last vowel mark of one word ─────────────────
export async function s2hats(ctx: GameCtx): Promise<number> {
  const { verse: v, frame: f } = ctx;
  const cands = v.all.filter((tk) => !tk.locked && lastMark(tk.t));
  if (!cands.length) return g1(ctx);
  const tk = pick(cands, ctx.rng);
  const lm = lastMark(tk.t)!;
  const naked = tk.t.slice(0, lm.index) + tk.t.slice(lm.index + 1);
  f.setBanner('game.hats', 'harakat', 'game.hats.how');
  const slot = h('span', { class: 'blank hat-slot', 'data-testid': 'hat-word' }, naked);
  f.prompt.replaceChildren(verseCard(v, { cls: 'prompt-card', slot: (x) => (x === tk ? slot : null) }));
  f.onEar = () => void play(v, tk.where, ctx.signal).catch(() => {});
  await how(ctx, 'game.hats', 'game.hats.how');
  const marks = [['َ', 'game.hats.fatha'], ['ُ', 'game.hats.damma'], ['ِ', 'game.hats.kasra'], ['ْ', 'game.hats.sukun']] as const;
  const opts: Opt[] = marks.map(([m, k]) => ({ label: h('span', { class: 'hat' }, h('span', { class: 'hat-glyph' }, '◌' + m), h('span', { class: 'hat-name' }, t(k))), value: m }));
  const zone = h('div'); f.play.replaceChildren(zone);
  await choose(ctx, zone, opts, lm.mark, { replay: f.onEar, label: 's2' });
  slot.textContent = tk.t; slot.classList.add('filled');
  await playClip(ctx, v, 'verse');
  return ctx.round.score();
}

// ── S1 caravan (seven reciters → five cities) ────────────────────────────────────────
const CARAVAN: [string, string][] = [['nafi', 'madinah'], ['ibnkathir', 'makkah'], ['abuamr', 'basra'], ['ibnamir', 'sham'], ['asim', 'kufa'], ['hamza', 'kufa'], ['kisai', 'kufa']];
export async function s1caravan(ctx: GameCtx): Promise<number> {
  const f = ctx.frame;
  if (!has('reciter.nafi') || !has('city.kufa')) return g1(ctx);
  f.setBanner('game.caravan', 'seven-lanterns', 'game.caravan.how');
  await how(ctx, 'game.caravan', 'game.caravan.how');
  const cities = ['makkah', 'madinah', 'basra', 'sham', 'kufa'];
  const gates = cities.map((c) => h('button', { type: 'button', class: 'gate-city', 'data-testid': 'city-' + c, 'data-city': c }, h('span', { class: 'city-name' }, t('city.' + c)), h('span', { class: 'city-load' })));
  f.prompt.replaceChildren(h('div', { class: 'cities' }, ...gates));
  const order = shuffle(CARAVAN, ctx.rng);
  const tray = h('div', { class: 'tray caravan-tray' });
  f.play.replaceChildren(tray);
  for (const [r, c] of order) {
    // R1's lantern, recoloured per reciter (the seven named lanterns of §1.5: the reciters are never drawn)
    const lan = h('div', { class: 'reciter-lantern active', 'data-testid': 'reciter-' + r, style: '--hue: ' + CARAVAN.findIndex(([x]) => x === r) * 51 + 'deg' }, artImg('reciter-lantern', 'reciter-lantern-art', () => iconEl('help'), true) || iconEl('help'), h('span', null, t('reciter.' + r)));
    tray.replaceChildren(lan);
    let wrongHere = 0;
    await new Promise<void>((resolve, reject) => {
      ctx.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      const handlers = gates.map((g) => {
        const fn = () => {
          if (g.dataset.city === c) { gates.forEach((x, i) => x.removeEventListener('click', handlers[i])); praise(ctx); g.querySelector('.city-load')!.append(h('span', { class: 'mini-lantern on' }, '●')); if (c === 'kufa' && g.querySelectorAll('.mini-lantern').length === 1) void say('game.caravan.kufa', { signal: ctx.signal }).catch(() => {}); resolve(); }
          else { wrongHere++; ctx.round.wrong(); wobble(g); retry(ctx); if (wrongHere >= ctx.p.hintAfter) gates.find((x) => x.dataset.city === c)?.classList.add('glow'); }
        };
        g.addEventListener('click', fn); return fn;
      });
      setActive({ right: () => gates.find((x) => x.dataset.city === c) || null, wrong: () => gates.find((x) => x.dataset.city !== c) || null, label: 's1' });
      f.onHelp = () => { ctx.round.help(); gates.find((x) => x.dataset.city === c)?.classList.add('glow'); };   // help: the right gate glows
    });
    gates.forEach((g) => g.classList.remove('glow'));
    await sleep(250, ctx.signal);
  }
  setActive(null);
  f.onHelp = null;
  await say('game.caravan.done', { signal: ctx.signal }).catch(() => {});
  if (ctx.round.wrongs === 0) award('seven');
  return ctx.round.score();
}

export const _internals = { bare, tt };
