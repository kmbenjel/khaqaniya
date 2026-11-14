// One verse = one level (GAME_DESIGN §4.2): INTRO → LISTEN → MEANING → PLAY A → PLAY B → PLAY C → RECITE → LINK → REWARD.
import { h } from '../core/h';
import { t, tt, has, num } from '../core/copy';
import type { Verse } from '../core/data';
import { hash, mulberry32 } from '../core/rng';
import { frame, verseCard, btn, sweepLight, stars as starsEl, type Frame } from '../core/ui';
import { charArt, picto, iconEl } from '../art';
import { pearlSvg } from '../art';
import { sfx } from '../core/sfx';
import { say, sayPick, show } from '../core/voice';
import { play, clipFor, setSlow } from '../core/audio';
import { env, emit, isAbort, sleep } from '../core/env';
import { finishVerse, learned, profile, save, settings, learnedCount, clearPendingWeak } from '../core/store';
import { P, checkStickers, districtOf, nextTarget, targetHash, verseUnlocked, bossUnlocked } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { Round, params, setActive, type GameCtx, type Mode } from '../games/engine';
import { g1, g2, g3, g4, g4radar, g5, g6, g7, g8, s1caravan, s2hats } from '../games/games';
import { askNameSheet } from './profiles';
import { stickerArtById } from './book';
import { askSheet } from './ask';
import { pauseMenu } from './grownups';
import { sceneArt } from '../art';
import { svg } from '../core/h';

export const STEP_NAMES = ['intro', 'listen', 'meaning', 'playA', 'playB', 'playC', 'recite', 'link', 'reward'] as const;
let levelState: { verse: number; step: string } | null = null;
export const getLevelState = () => levelState;
function step(v: Verse, s: string) { levelState = { verse: v.n, step: s }; emit('kq:step', { verse: v.n, step: s }); }

/** Waits for the primary "next" button (or Enter). */
export function waitNext(f: Frame, signal: AbortSignal, labelKey = 'btn.next', into?: HTMLElement): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const b = btn(t(labelKey), { icon: 'next', primary: true, testid: 'btn-next', cls: 'next-btn' });
    // phones: the primary button sits in the cast bar, right above the caption, so a long meaning never hides it
    const bar = !into && matchMedia('(max-width: 1023px)').matches ? f.root.querySelector('.castbar') : null;
    const row = h('div', { class: 'next-row' + (bar ? ' in-castbar' : '') }, b);
    const go_ = () => { document.removeEventListener('keydown', onKey); setActive(null); b.disabled = true; if (bar) row.remove(); resolve(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); sfx('tap'); go_(); } };
    b.addEventListener('click', go_);
    document.addEventListener('keydown', onKey);
    signal.addEventListener('abort', () => { document.removeEventListener('keydown', onKey); row.remove(); reject(new DOMException('aborted', 'AbortError')); }, { once: true });
    if (bar) bar.prepend(row); else (into || f.play).appendChild(row);
    setActive({ right: () => b, wrong: () => null, label: 'next' });
  });
}

// ── LISTEN ───────────────────────────────────────────────────────────────────────────
export async function listenStep(v: Verse, f: Frame, signal: AbortSignal, o: { onePass?: boolean } = {}) {
  const p = params(v.n);
  f.reset(); f.setDots(0);
  f.setBanner('listen.title', 'ear', 'listen.how');
  const card = verseCard(v, { cls: 'listen-card big' });
  const sadrLine = card.querySelector('.sadr') as HTMLElement, ajzLine = card.querySelector('.ajz') as HTMLElement;
  const credit = P().timingsSource?.reciter ? h('p', { class: 'reciter-credit' }, iconEl('ear'), t('listen.reader', { reciter: P().timingsSource!.reciter! })) : null;
  const mouth = h('div', { class: 'echo-mouth', hidden: true, 'data-testid': 'echo' }, h('span', { class: 'mouth' }), h('span', null, t('listen.yourTurn')));
  // while the verse plays, the lit word can be caught: a sparkle and a star count, no score, nothing to lose (Q1 round 2)
  let caught = 0;
  const chip = h('span', { class: 'catch-count', 'data-testid': 'catch-count', 'aria-hidden': 'true', hidden: true }, iconEl('star'), h('span', { class: 'catch-n' }, '0'));
  card.addEventListener('pointerdown', (e) => {
    const w = (e.target as HTMLElement).closest('.w') as HTMLElement | null;
    if (!w || !(w.classList.contains('lit') || w.classList.contains('was-lit')) || w.dataset.caught === String(passes)) return;
    w.dataset.caught = String(passes);
    caught++; chip.hidden = false; chip.querySelector('.catch-n')!.textContent = num(caught);
    chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
    w.classList.remove('caught'); void w.offsetWidth; w.classList.add('caught');
    const r = w.getBoundingClientRect(), c = card.getBoundingClientRect();
    const spark = h('span', { class: 'word-spark', 'aria-hidden': 'true', style: { left: r.left - c.left + r.width / 2 + 'px', top: r.top - c.top + 'px' } }, iconEl('star'));
    card.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
    sfx('sparkle');
  });
  let passes = 0;
  f.prompt.replaceChildren(card, credit || '', mouth);
  const slowT = h('label', { class: 'toggle pill-toggle' }, h('input', { type: 'checkbox', checked: !!settings().slow, 'data-testid': 'slow', onchange: (e: Event) => { settings().slow = (e.target as HTMLInputElement).checked; setSlow(!!settings().slow); save(); } }), iconEl('slow'), h('span', null, t('listen.slow')));
  const ctrl = h('div', { class: 'listen-ctrl' }, chip, slowT);
  f.play.replaceChildren(ctrl);
  setSlow(!!settings().slow);
  const rate = settings().slow ? 0.8 : 1;
  const whole = async (sig: AbortSignal = signal) => {
    passes++;
    const sd = clipFor(v, 'sadr').dur / rate, ad = clipFor(v, 'ajz').dur / rate;
    sweepLight(sadrLine, v.sadrT, sd, sig);
    const tid = setTimeout(() => sweepLight(ajzLine, v.ajzT, ad, sig), (sd * 1000) / env.speed);
    sig.addEventListener('abort', () => clearTimeout(tid), { once: true });
    await play(v, 'verse', sig);
  };
  const echo = async (sig: AbortSignal = signal) => {
    show('listen.echo');
    const win = (d: number) => Math.max(2.5, 1.1 * d) * 1000;
    const turn = async (d: number) => { mouth.hidden = false; show('listen.yourTurn'); await sleep(win(d), sig); mouth.hidden = true; };
    if (v.joined) { await whole(sig); await turn(clipFor(v, 'verse').dur); return; }
    passes++;
    sweepLight(sadrLine, v.sadrT, clipFor(v, 'sadr').dur / rate, sig);
    await play(v, 'sadr', sig); await turn(clipFor(v, 'sadr').dur);
    sweepLight(ajzLine, v.ajzT, clipFor(v, 'ajz').dur / rate, sig);
    await play(v, 'ajz', sig); await turn(clipFor(v, 'ajz').dur);
  };
  f.onEar = () => void whole().catch(() => {});
  const grown = settings().grownupMode;
  if (o.onePass || grown) {
    const nextP = waitNext(f, signal);
    nextP.catch(() => {});   // left mid-verse: whole() throws first, nextP's abort must not surface as unhandled (G5)
    if (!grown) await whole().catch((e) => { if (isAbort(e)) throw e; });
    else void whole().catch(() => {});
    if (!o.onePass) ctrl.appendChild(btn(t('listen.echo'), { icon: 'repeat', testid: 'btn-echo', small: true, onClick: () => void echo().catch(() => {}) }));
    await nextP;
    return;
  }
  await whole();
  const pr = profile();
  // a verse already heard once (a level left and started again): «next» is offered during the echo
  const heardBefore = (pr.seen.listened ||= []).includes(v.n);
  if (!heardBefore) { pr.seen.listened.push(v.n); save(); }
  if (!pr.seen.tips.includes('listen.tip.shatr')) { pr.seen.tips.push('listen.tip.shatr'); save(); await say('listen.tip.shatr', { signal }); }
  if (p.echo && heardBefore) {
    const ec = new AbortController();
    signal.addEventListener('abort', () => ec.abort(), { once: true });
    const nextP = waitNext(f, signal);
    void nextP.then(() => ec.abort(), () => {});
    await Promise.race([echo(ec.signal).catch((e) => { if (!isAbort(e)) throw e; }), nextP]);
    mouth.hidden = true;
    await nextP;
    return;
  }
  if (p.echo) await echo();
  else ctrl.appendChild(btn(t('listen.echo'), { icon: 'repeat', testid: 'btn-echo', small: true, onClick: () => void echo().catch(() => {}) }));
  await waitNext(f, signal);
}

// ── MEANING ──────────────────────────────────────────────────────────────────────────
export async function meaningStep(v: Verse, f: Frame, signal: AbortSignal, rng?: () => number) {
  f.reset(); f.setDots(1);
  f.setBanner('meaning.title', 'think');
  const m = v.meaning;
  const grown = settings().grownupMode;
  const card = h('div', { class: 'meaning-card', 'data-testid': 'meaning-card' }, h('div', { class: 'meaning-stork' }, charArt('laqlaq', 'think')));
  const body = h('div', { class: 'meaning-body' });
  card.appendChild(body);
  if (!m) body.appendChild(h('p', { class: 'kid-meaning' }, t('meaning.empty')));
  else {
    if (grown && m.adult) body.appendChild(h('p', { class: 'adult-meaning', 'data-testid': 'adult-meaning' }, m.adult));
    else body.appendChild(h('p', { class: 'kid-meaning', 'data-testid': 'kid-meaning' }, m.kid || t('meaning.empty')));   // never the adult text to a child
    if (v.pictos.length) body.appendChild(h('div', { class: 'pictos' }, ...v.pictos.slice(0, 2).map((id) => picto(id, P().verses.length))));
    const ws = m.words || [];
    if (ws.length) {
      const chips = h('div', { class: 'word-chips' });
      const chip = (w: { w: string; m: string }) => btn(w.w, { cls: 'chip', testid: 'word-chip', onClick: () => { show('meaning.word', { params: { word: w.w, meaning: w.m }, who: 'laqlaq' }); const b = f.bubble; if (!has('meaning.word')) b.textContent = w.w + ' : ' + w.m; } });
      ws.slice(0, 3).forEach((w) => chips.appendChild(chip(w)));
      if (ws.length > 3) chips.appendChild(btn('…', { cls: 'chip', onClick: (e) => { (e.currentTarget as HTMLElement).remove(); ws.slice(3).forEach((w) => chips.appendChild(chip(w))); } }));
      body.appendChild(chips);
    }
    if (m.lesson) body.appendChild(h('p', { class: 'lesson' }, h('span', { class: 'lesson-label' }, t('meaning.lesson')), ' ', m.lesson));
    if (grown && m.cite?.length) body.appendChild(h('p', { class: 'cite' }, h('span', null, t('meaning.cite')), ' ', m.cite.join(' · ')));
  }
  const tools = h('div', { class: 'meaning-tools' },
    v.meaningClip ? btn(t('meaning.hear'), { icon: 'ear', small: true, testid: 'meaning-hear', onClick: () => void play(v, 'meaning', signal).catch(() => {}) }) : null,
    btn(t('ai.ask.btn'), { icon: 'ask', small: true, testid: 'ask-btn', onClick: () => askSheet(v) }));
  f.prompt.replaceChildren(card, tools);
  f.onEar = () => { if (v.meaningClip) void play(v, 'meaning', signal).catch(() => {}); else void play(v, 'verse', signal).catch(() => {}); };
  if (rng) await sayPick('meaning.intro', rng, { signal, who: 'laqlaq' });
  if (v.meaningClip && settings().voices) void play(v, 'meaning', signal).catch(() => {});
  const pr = profile();
  if (v.lahnTipShow && !pr.seen.lahn) {
    pr.seen.lahn = true; save();
    for (const k of ['lahn.what', 'lahn.kinds', 'lahn.fix']) await say(k, { signal, who: 'laqlaq' });
  }
  await waitNext(f, signal, 'meaning.gotIt');
}

// ── the level ────────────────────────────────────────────────────────────────────────
export function levelScreen(ctx: ScreenCtx): HTMLElement {
  levelState = null;
  clearPendingWeak();
  const poem = P();
  const n = Number(ctx.params[0]);
  const v = poem.verses.find((x) => x.n === n);
  if (!v || !verseUnlocked(n)) { setTimeout(() => go('#/map', true)); return h('div'); }
  const d = districtOf(n);
  const f = frame(poem, { back: () => pauseMenu(() => go('#/map')), cls: 'level', sky: d.sky });
  f.root.dataset.testid = 'level';
  f.root.setAttribute('data-testid', 'level');
  setTimeout(() => void runLevel(v, f, ctx.signal).catch((e) => { if (!isAbort(e)) console.error(e); }), 0);
  return f.root;
}

const ROW_A = ['g1', 'g2', 'g5'], ROW_B = ['g4', 'g3', 'g4'];
export function planFor(v: Verse): { A: string; B: string; C: string } {
  const row = (v.idx - 1) % 3;
  const d = districtOf(v.n);
  let A = ROW_A[row];
  if (d.special && d.special.verse === v.n) A = d.special.game === 'caravan' ? 's1' : d.special.game === 'hats' ? 's2' : A;
  const B = v.n === P().verses[0].n ? 'g4r' : ROW_B[row];
  return { A, B, C: 'g6' };
}

export async function runGame(id: string, gctx: GameCtx): Promise<number> {
  switch (id) {
    case 'g1': return g1(gctx);
    case 'g2': return g2(gctx);
    case 'g3': return g3(gctx);
    case 'g4': {
      const prev = P().verses.filter((x) => x.n < gctx.verse.n && learned(x.n));
      const waves = gctx.mode === 'learn' && prev.length ? [gctx.verse, prev[Math.floor(gctx.rng() * prev.length)]] : [gctx.verse];
      return g4(gctx, waves);
    }
    case 'g4r': return g4radar(gctx);
    case 'g5': return g5(gctx);
    case 'g6': return g6(gctx);
    case 's1': return s1caravan(gctx);
    case 's2': return s2hats(gctx);
    default: return g1(gctx);
  }
}

async function runLevel(v: Verse, f: Frame, signal: AbortSignal) {
  const poem = P();
  const pr = profile();
  const replay = learned(v.n);
  const attempt = (pr.verses[String(v.n)]?.plays || 0) + 1;
  const seed = env.seed ?? pr.seed;
  const rng = mulberry32(hash(seed, v.n, attempt));
  const mk = (mode: Mode = replay ? 'replay' : 'learn'): GameCtx => ({ poem, verse: v, frame: f, rng, signal, mode, p: params(v.n), round: new Round(), noRhymeBlank: plan.B === 'g4' });
  const plan = planFor(v);
  // INTRO
  step(v, 'intro');
  f.reset(); f.setDots(0);
  f.setBanner('map.pearl', 'pearl'); f.banner.querySelector('.banner-title')!.textContent = t('map.pearl', { n: v.n });
  const pearl = h('div', { class: 'intro-pearl rolling', 'data-testid': 'intro-pearl' }, svg(pearlSvg('open')), h('span', { class: 'intro-n' }, num(v.n)));
  f.prompt.replaceChildren(pearl);
  sfx('roll');
  let skipToC = false;
  // district opening (first verse of a district, first time): title card + Laqlaq's line
  const dd = districtOf(v.n);
  if (v.n === dd.from && !replay) {
    const card = h('div', { class: 'overlay district-card', 'data-testid': 'district-card', 'data-sky': dd.sky },
      h('div', { class: 'district-card-bg' }, sceneArt(dd.skin, dd.sky)),
      h('div', { class: 'district-card-text' }, h('h2', null, t('district.' + dd.skin + '.name')), h('p', null, t('map.district.range', { from: dd.from, to: dd.to })),
        h('p', { class: 'district-section' }, t('map.district.section', { titles: dd.sections.map((x) => x.title).join(tt('map.district.section.sep') || ' · ') }))),
      h('div', { class: 'district-card-stork' }, charArt('laqlaq', 'happy')),
      // Laqlaq's opening line as a caption on the card itself: the cast bar's bubble is under this overlay
      h('p', { class: 'district-card-line', 'data-testid': 'district-card-line', 'aria-live': 'polite' }, t('district.' + dd.skin + '.intro')));
    document.body.appendChild(card);
    const skipCard = btn(t('btn.continue'), { icon: 'next', primary: true, testid: 'btn-next' });
    card.appendChild(skipCard);
    setActive({ right: () => skipCard, wrong: () => null, label: 'district-card' });
    await Promise.race([say('district.' + dd.skin + '.intro', { signal, who: 'laqlaq' }).then(() => sleep(600, signal)), new Promise<void>((r) => skipCard.addEventListener('click', () => r()))]);
    card.remove();
    setActive(null);
  }
  if (settings().grownupMode) {
    f.play.appendChild(btn(t('btn.skip'), { icon: 'next', testid: 'btn-skip', small: true, onClick: () => { skipToC = true; } }));
  }
  if (replay && has('level.replay')) await say('level.replay', { signal });
  else if (v.n === poem.verses[0].n && !learnedCount() && has('level.start.first')) await say('level.start.first', { signal });
  else await sayPick('level.start', rng, { signal });
  if (!skipToC) await sleep(300, signal);
  let score = 0;
  if (!skipToC) {
    step(v, 'listen');
    await listenStep(v, f, signal, { onePass: replay });
    if (!replay) { step(v, 'meaning'); await meaningStep(v, f, signal, rng); }
    if (!replay) {
      step(v, 'playA'); f.reset(); f.setDots(2);
      score += await runGame(plan.A, mk());
      await sleep(250, signal);
    }
    step(v, 'playB'); f.reset(); f.setDots(2);
    score += await runGame(plan.B, mk());
    await sleep(250, signal);
  } else score += 6;
  step(v, 'playC'); f.reset(); f.setDots(2);
  score += await runGame('g6', mk());
  await sleep(250, signal);
  step(v, 'recite'); f.reset(); f.setDots(3);
  score += await g7(mk());
  if (replay) score += 3;   // replay has no Round A: count it as full so stars come from the rounds played
  if (!replay && v.n > poem.verses[0].n) {
    step(v, 'link'); f.reset(); f.setDots(3);
    const prev = poem.verses.find((x) => x.n === v.n - 1)!;
    await g8(mk(), prev);
    await sleep(250, signal);
  }
  // REWARD
  step(v, 'reward');
  await reward(v, f, signal, score, rng);
}

export const starsFor = (score: number) => (score >= 10 ? 3 : score >= 7 ? 2 : 1);

async function reward(v: Verse, f: Frame, signal: AbortSignal, score: number, rng: () => number) {
  const s = starsFor(score);
  const firstPearlEver = learnedCount() === 0;
  const daysBefore = profile().days.length;
  const res = finishVerse(v.n, s);
  f.reset(); f.setDots(4);
  f.setBanner('step.reward', 'star');
  f.ear.hidden = true; f.help.hidden = true;
  const pearl = h('div', { class: 'reward-pearl', 'data-testid': 'reward-pearl' }, svg(pearlSvg(res.stars >= 3 ? 's3' : res.stars === 2 ? 's2' : 's1')));
  f.prompt.replaceChildren(h('div', { class: 'reward' }, pearl, starsEl(res.stars), h('p', { class: 'reward-stars-line' }, t('reward.stars.' + s))));
  sfx('sparkle');
  setTimeout(() => {
    pearl.classList.add('fly'); sfx('swoosh');
    // the pearl lands on the necklace in the HUD: its counter ticks (it was drawn before the pearl was won)
    setTimeout(() => {
      const hud = f.root.querySelector('.hud-necklace');
      const n = hud?.querySelector('.hud-n');
      if (hud && n) { n.textContent = num(learnedCount()) + ' / ' + num(P().verses.length); hud.setAttribute('aria-label', t('aria.necklace', { n: learnedCount(), total: P().verses.length })); hud.classList.remove('bump'); void (hud as HTMLElement).offsetWidth; hud.classList.add('bump'); }
      // where the pearl went: the district's strand, the new pearl landing among the ones already won
      const d = districtOf(v.n);
      const strand = h('div', { class: 'reward-strand', 'data-testid': 'reward-strand', 'aria-hidden': 'true' },
        ...P().verses.filter((x) => x.n >= d.from && x.n <= d.to).map((x) => {
          const st = profile().verses[String(x.n)]?.stars || 0;
          return h('span', { class: 'strand-pearl' + (x.n === v.n ? ' landed' : '') + (st ? '' : ' empty') }, svg(pearlSvg(st >= 3 ? 's3' : st === 2 ? 's2' : st === 1 ? 's1' : 'open')));
        }));
      pearl.replaceWith(strand);
    }, 700 / env.speed);
  }, 900 / env.speed);
  const pr = profile();
  pr.rewards++;
  save();
  const newSt = checkStickers();
  await sayPick('reward.pearl', rng as never, { signal });
  if (profile().days.length > daysBefore && daysBefore > 0) await say('days.lit', { signal });
  const dist = districtOf(v.n);
  if (res.first && bossUnlocked(dist) && !pr.bosses[dist.boss || dist.id]) await say('reward.gateOpen', { signal });
  for (const id of newSt) { sfx('page'); f.prompt.appendChild(h('div', { class: 'new-sticker', 'data-testid': 'new-sticker' }, h('span', { class: 'new-sticker-art', 'aria-hidden': 'true' }, stickerArtById(id)), h('span', null, t('reward.newSticker'), ' ', h('b', null, t('sticker.' + id))))); }
  const jokeEvery = settings().grownupMode ? 4 : 2;
  if (pr.rewards % jokeEvery === 0) {
    if (v.countJoke && has('joke.14') && !pr.seen.jokes.includes('joke.14')) { pr.seen.jokes.push('joke.14'); await say('joke.14', { signal, params: { n: P().verses.length } }); }
    else {
      const jk = await sayPick('joke', rng as never, { signal, params: { n: P().verses.length } }, ['joke.5', 'joke.12', 'joke.14', 'joke.16']);
      if (has(jk + '.real')) await say(jk + '.real', { signal, who: 'laqlaq' });
    }
  }
  if (firstPearlEver && !pr.name && !pr.seen.askedName) { pr.seen.askedName = true; save(); await askNameSheet(); }
  const d = districtOf(v.n);
  const tg = nextTarget();
  const row = h('div', { class: 'reward-btns' });
  f.play.replaceChildren(row);
  const nextHash = bossUnlocked(d) && !pr.bosses[d.boss || d.id] ? '#/boss/' + (d.boss || d.id) : targetHash(tg);
  row.append(
    btn(t('btn.next'), { icon: 'next', primary: true, testid: 'btn-next', onClick: () => go(nextHash) }),
    btn(t('btn.replay'), { icon: 'again', testid: 'btn-replay', onClick: () => go('#/verse/' + v.n + '?r=' + Date.now()) }),
    btn(t('btn.map'), { icon: 'map', testid: 'btn-map', onClick: () => go('#/map') }));
  setActive({ right: () => row.querySelector('[data-testid=btn-next]'), wrong: () => null, label: 'reward' });
}
