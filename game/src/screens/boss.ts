// Gang challenges (GAME_DESIGN §4.8): entrance, an ink meter of K drops, one question per verse + an order question +
// the final G6 on the boss verse; a wrong answer loses nothing (the question comes back two places later); then the
// member is corrected (not defeated) and becomes a friend. The final challenge (nasyan) is cumulative.
import { h } from '../core/h';
import { t, has } from '../core/copy';
import type { District, Verse } from '../core/data';
import { hash, mulberry32, shuffle, pick } from '../core/rng';
import { frame, btn, type Frame } from '../core/ui';
import { blotArt, charArt, iconEl } from '../art';
import { sfx, type Sfx } from '../core/sfx';
import { say, show } from '../core/voice';
import { env, emit, isAbort, sleep } from '../core/env';
import { profile, save, vs, learned, award } from '../core/store';
import { P, versesOf, districtById, bossUnlocked, bossKey, checkStickers, nextTarget, targetHash } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { Round, params, setActive, type GameCtx } from '../games/engine';
import { g1, g2, g3, g4, g5, g6, g8, g9 } from '../games/games';
import { shareCard } from './finale';
import { pauseMenu } from './grownups';
import { stickerArtById } from './book';

const GAG_SFX: Record<string, Sfx> = { manfoukh: 'hiss', khallat: 'swoosh', ajoul: 'whoosh', kaslan: 'thud', mattat: 'stretch', qallab: 'flip', fuwaq: 'pop', duhrouj: 'puff', khafiyy: 'reveal', nasyan: 'thud' };
let bossState: { id: string; q: number; k: number; washed: number } | null = null;
export const getBossState = () => bossState;

export function bossScreen(ctx: ScreenCtx): HTMLElement {
  bossState = null;
  const poem = P();
  const d = districtById(ctx.params[0]);
  if (!d || !bossUnlocked(d)) { setTimeout(() => go('#/map', true)); return h('div'); }
  const f = frame(poem, { back: () => pauseMenu(() => go('#/map')), dots: false, title: d.boss ? t('boss.' + d.boss + '.name') : t('boss.quiz.title'), cls: 'boss', sky: d.sky });
  f.root.setAttribute('data-testid', 'boss');
  setTimeout(() => void runBoss(d, f, ctx.signal).catch((e) => { if (!isAbort(e)) console.error(e); }), 0);
  return f.root;
}

interface Q { type: string; v: Verse; again?: boolean }

function plan(d: District, rng: () => number): Q[] {
  const poem = P();
  const vv = versesOf(d);
  if (d.final) {
    const qs: Q[] = [];
    for (const od of poem.districts.filter((x) => x !== d)) {
      const learnedVs = versesOf(od).filter((v) => learned(v.n));
      const v = pick(learnedVs.length ? learnedVs : versesOf(od), rng);
      qs.push({ type: typeForRung(vs(v.n)?.rung || 1, rng), v });
    }
    const bv = poem.verses.find((x) => x.n === d.bossVerse) || vv[vv.length - 1];
    return [...qs.slice(0, 9), { type: 'g6r3', v: bv }];
  }
  const K = Math.max(4, Math.min(8, vv.length + 1));
  const types = ['g3up', 'g4', 'g1r1', 'g5', 'g2r2'];
  const strength = (v: Verse) => (vs(v.n)?.stars || 0) * 10 + (vs(v.n)?.box || 0);
  let per = shuffle(vv, rng);
  const slots = K - 2;
  if (per.length > slots) per = per.slice().sort((a, b) => strength(a) - strength(b)).slice(0, slots);
  while (per.length < slots) per.push(vv.slice().sort((a, b) => strength(a) - strength(b))[per.length % vv.length]);
  per = shuffle(per, rng);
  const qs: Q[] = per.map((v, i) => ({ type: types[(i + Math.floor(rng() * types.length)) % types.length], v }));
  qs.push(vv.length >= 3 ? { type: 'g9', v: vv[0] } : { type: 'g8', v: vv[vv.length - 1] });
  const bv = poem.verses.find((x) => x.n === d.bossVerse) || vv[vv.length - 1];
  qs.push({ type: 'g6r3', v: bv });
  return qs;
}
const typeForRung = (r: number, rng: () => number) => (r <= 1 ? 'g1r1' : r === 2 ? 'g3up' : r === 3 ? pick(['g4', 'g5'], rng) : 'g2r2');

async function ask(q: Q, gctx: GameCtx, d: District): Promise<void> {
  switch (q.type) {
    case 'g3up': await g3(gctx, gctx.p.blanks + 1); break;
    case 'g4': await g4(gctx, [q.v]); break;
    case 'g1r1': await g1({ ...gctx, rung: 1 }); break;
    case 'g5': await g5(gctx); break;
    case 'g2r2': await g2({ ...gctx, rung: q.v.n > P().verses[0].n ? 2 : 1 }); break;
    case 'g9': await g9(gctx, shuffle(versesOf(d), gctx.rng).slice(0, Math.min(5, versesOf(d).length)).sort((a, b) => a.n - b.n)); break;
    case 'g8': { const prev = P().verses.find((x) => x.n === q.v.n - 1); if (prev) await g8(gctx, prev); else await g1(gctx); break; }
    case 'g6r3': await g6(gctx, 3); break;
    default: await g1(gctx);
  }
}

async function runBoss(d: District, f: Frame, signal: AbortSignal) {
  const poem = P();
  const pr = profile();
  const id = d.boss;
  const bk = bossKey(d);
  const rng = mulberry32(hash(env.seed ?? pr.seed, 'boss', bk, pr.bosses[bk] ? 2 : 1));
  const qs = plan(d, rng);
  const K = qs.length;
  // head: the member + the ink meter
  const blotBox = h('div', { class: 'boss-blot', 'data-testid': 'boss-blot' }, id ? blotArt(id, false, 0) : charArt('mishmish', 'happy'));
  const meter = h('div', { class: 'ink-meter', 'data-testid': 'ink-meter', 'aria-label': t('boss.meter') }, ...Array.from({ length: K }, () => h('span', { class: 'drop' })));
  const head = h('div', { class: 'boss-head' }, blotBox, h('div', { class: 'meter-wrap' }, h('span', { class: 'meter-label' }, t('boss.meter')), meter));
  f.root.querySelector('.play-pane')!.prepend(head);
  // 1. entrance
  emit('kq:step', { boss: bk, step: 'entrance' });
  bossState = { id: bk, q: 0, k: K, washed: 0 };
  const entrance = h('div', { class: 'overlay entrance', 'data-testid': 'boss-entrance' },
    h('div', { class: 'splash-ink' }), id ? blotArt(id, false, 0) : charArt('mishmish', 'wow'),
    h('h2', { class: 'boss-title' }, id ? t('boss.' + id + '.title') : t('boss.quiz.title')), id ? h('p', { class: 'boss-tagline' }, t('boss.' + id + '.tagline')) : null,
    h('p', { class: 'entrance-line', 'data-testid': 'entrance-line' }));
  const skip = btn(t('btn.continue'), { icon: 'next', testid: 'btn-skip', small: true });
  entrance.appendChild(skip);
  document.body.appendChild(entrance);
  let skipped = false;
  const lineEl = entrance.querySelector('.entrance-line')!;
  const sayHere = async (key: string) => { if (skipped) return; const { text } = show(key); lineEl.textContent = text; await say(key, { signal }).catch(() => {}); };
  setActive({ right: () => skip, wrong: () => null, label: 'entrance' });
  await Promise.race([
    (async () => {
      sfx('drip');
      if (id) { sfx(GAG_SFX[id] || 'pop'); await sayHere('boss.' + id + '.intro'); } else await sayHere('boss.quiz.intro');
      if (d.final) await sayHere('boss.cumulative');
      if (id === 'qallab' && has('boss.qallab.intro.amin')) await sayHere('boss.qallab.intro.amin');
      await sayHere('boss.intro.amin');
      if (!Object.keys(pr.bosses).length) { await sayHere('joke.5'); await sayHere('boss.rule'); }
      if (id === 'kaslan') await sayHere('joke.16');
    })(),
    new Promise<void>((r) => skip.addEventListener('click', () => { skipped = true; r(); })),
  ]);
  entrance.remove();
  setActive(null);
  // 2. questions
  const queue = qs.map((q) => ({ ...q }));
  let washed = 0, wrongTotal = 0, helped = false, asked = 0;
  while (queue.length) {
    const q = queue.shift()!;
    asked++;
    bossState = { id: bk, q: asked, k: K, washed };
    if (q.type === 'g6r3' && !queue.length) await say('boss.final', { signal }).catch(() => {});
    f.reset();
    const round = new Round();
    const gctx: GameCtx = { poem, verse: q.v, frame: f, rng, signal, mode: 'boss', p: params(q.v.n), round };
    emit('kq:step', { boss: bk, step: 'q' + asked, type: q.type, verse: q.v.n });
    await ask(q, gctx, d);
    if (round.helps) helped = true;
    wrongTotal += round.wrongs;
    const step = () => Math.min(1, washed / K);
    // the last question (a whole-verse G6, 20+ s) never comes back for one slip: one wrong bead is forgiven, and as the
    // very last question it is washed anyway (kind by construction; the stars still count the wrong taps)
    const lastOne = q.type === 'g6r3' && !queue.length;
    if (round.wrongs === 0 || q.again || lastOne || (q.type === 'g6r3' && round.wrongs <= 1)) {
      washed++;
      meter.children[K - washed]?.classList.add('washed');
      sfx('drip');
      blotBox.replaceChildren(id ? blotArt(id, false, step()) : charArt('mishmish', 'happy'));
      void say(id ? (washed % 2 ? 'boss.' + id + '.right.1' : 'boss.' + id + '.right.2') : 'boss.quiz.right', { signal }).catch(() => {});
    } else {
      if (id) { sfx(GAG_SFX[id] || 'thud'); blotBox.classList.remove('gag'); void blotBox.offsetWidth; blotBox.classList.add('gag'); }
      if (wrongTotal % 3 === 1) void say(id ? 'boss.' + id + '.wrong' : 'boss.quiz.wrong', { signal }).then(() => say('boss.again', { signal })).catch(() => {});
      queue.splice(Math.min(2, queue.length - (queue.length && queue[queue.length - 1].type === 'g6r3' ? 1 : 0)), 0, { ...q, again: true });
    }
    await sleep(500, signal);
  }
  // 3. correction
  const stars = wrongTotal <= 1 ? 3 : wrongTotal <= 4 ? 2 : 1;
  const prevB = pr.bosses[bk];
  pr.bosses[bk] = { stars: Math.max(stars, prevB?.stars || 0), crown: false, date: prevB?.date || new Date().toISOString().slice(0, 10), noHelp: !helped || !!prevB?.noHelp };
  save();
  if (id === 'ajoul' && !helped) award('calm');
  if (id === 'khallat' && stars === 3 && !d.special) award('seven');
  const newSt = checkStickers();
  emit('kq:step', { boss: bk, step: 'fixed' });
  f.reset();
  f.ear.hidden = true; f.help.hidden = true;
  (meter.closest('.meter-wrap') as HTMLElement).hidden = true;   // all washed: no leftover empty drops
  f.setBanner('map.gate.done', 'star');
  const fixedBox = h('div', { class: 'boss-fixed', 'data-testid': 'boss-fixed' }, id ? blotArt(id, true) : charArt('mishmish', 'happy'));
  blotBox.replaceChildren(id ? blotArt(id, true) : charArt('mishmish', 'happy'));
  blotBox.classList.add('smooth');
  f.prompt.replaceChildren(fixedBox, h('div', { class: 'boss-stars' }, ...Array.from({ length: 3 }, (_, i) => h('span', { class: 'star' + (i < stars ? ' on' : '') }, iconEl('star')))));
  sfx('sparkle');
  if (id) { await say('boss.' + id + '.fixed', { signal }); await say('boss.' + id + '.lesson', { signal, who: 'laqlaq' }); } else await say('boss.quiz.end', { signal });
  for (const st of newSt) { sfx('page'); f.prompt.appendChild(h('div', { class: 'new-sticker', 'data-testid': 'new-sticker' }, h('span', { class: 'new-sticker-art', 'aria-hidden': 'true' }, stickerArtById(st)), h('span', null, t('reward.newSticker'), ' ', h('b', null, t('sticker.' + st))))); }
  if (d.final) { await sleep(600, signal); go('#/finale'); return; }
  await say('boss.win', { signal });
  if (rng() < 0.5) await say('joke.12', { signal }).catch(() => {});
  const row = h('div', { class: 'reward-btns' });
  row.append(
    btn(t('boss.next'), { icon: 'next', primary: true, testid: 'btn-next', onClick: () => go(targetHash(nextTarget())) }),
    btn(t('btn.share'), { icon: 'share', testid: 'btn-share', onClick: () => void shareCard('district', d) }),
    btn(t('btn.map'), { icon: 'map', testid: 'btn-map', onClick: () => go('#/map') }));
  f.play.replaceChildren(row);
  setActive({ right: () => row.firstElementChild, wrong: () => null, label: 'boss-done' });
  bossState = null;
}
