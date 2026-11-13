// Test and capture hooks (GAME_DESIGN §12): window.kq = { state, solve, fail, next, goto } and window.__kq (more).
import { env, setSpeedForTests } from './core/env';
import { getActive, tapVisibly } from './games/engine';
import { getLevelState } from './screens/level';
import { getBossState } from './screens/boss';
import { getPolishState } from './screens/polish';
import { currentRoute, go } from './core/router';
import { profile, save, settings, setClockOffset, getClockOffset, today, addDays, learnedCount, resetAll, S, INTERVALS, type Settings } from './core/store';
import { P, districtById, bossKey, checkStickers, versesOf } from './core/progress';
import { captions, say as sayLine, bubbleHost, setBubbleHost } from './core/voice';
import { has } from './core/copy';
import { h } from './core/h';
import { played } from './core/sfx';
import { missingKeys } from './core/copy';
import { applySettings } from './screens/grownups';
import { mulberry32, hash } from './core/rng';
import { Round, params, otherVerses, wrongTokens, wrongRhymes, type GameCtx } from './games/engine';
import { pickBlanks } from './games/games';
import type { Verse, Where } from './core/data';

/** §13.5: for one seed, every verse × every option-producing game: locked tokens never options, sacred never wrong. */
export function optionAudit(seed: number) {
  const poem = P();
  const bad: string[] = [];
  let sets = 0;
  const hemiT = (v: Verse, w: Where) => (w === 'sadr' ? v.sadrT : v.ajzT);
  for (const v of poem.verses) {
    for (const level of ['easy', 'mid', 'strong'] as const) {
      const rng = mulberry32(hash(seed, v.n, level));
      const p = { ...params(v.n), level, options: level === 'easy' ? 3 : 4, blanks: level === 'strong' ? 3 : 2 };
      const ctx = { poem, verse: v, rng, p, round: new Round() } as unknown as GameCtx;
      // G1 / G5a / G8: wrong hemistichs
      for (const w of ['sadr', 'ajz'] as Where[]) {
        const others = otherVerses(ctx, v, p.options - 1, w); sets++;
        for (const o of others) for (const tk of hemiT(o, w)) if (tk.locked || tk.sacred) bad.push(`v${v.n} hemi-${w} option v${o.n} has ${tk.locked ? 'locked' : 'sacred'} ${tk.t}`);
      }
      // G3: blanks never locked; wrong words never locked/sacred
      for (const b of pickBlanks(ctx, p.blanks)) {
        if (b.locked) bad.push(`v${v.n} blank is locked ${b.t}`);
        for (const w of wrongTokens(ctx, b, p.options - 1)) { sets++; if (w.locked || w.sacred) bad.push(`v${v.n} G3 wrong ${w.t}`); if (w.bare === b.bare) bad.push(`v${v.n} G3 wrong equals answer ${w.t}`); }
      }
      // G4: wrong rhyme words
      for (const w of wrongRhymes(ctx, v, 2)) { sets++; if (w.locked || w.sacred) bad.push(`v${v.n} G4 wrong ${w.t}`); }
      // G6 rung 4: two extra words
      const first = v.all.find((t) => !t.locked)!;
      for (const w of wrongTokens(ctx, first, 2, new Set(v.all.map((t) => t.bare)))) { sets++; if (w.locked || w.sacred) bad.push(`v${v.n} G6 extra ${w.t}`); }
    }
  }
  return { seed, sets, bad };
}

export function gotoTarget(target: string) {
  const [k, v] = target.split(':');
  const map: Record<string, string> = { polish: '#/polish', necklace: '#/necklace', finale: '#/finale', medal: '#/medal', map: '#/map', home: '#/', stickers: '#/stickers', heroes: '#/heroes', dedication: '#/dedication', grownups: '#/grownups', about: '#/about', intro: '#/intro', prayer: '#/prayer', cert: '#/cert' };
  if (k === 'verse') go('#/verse/' + v, false, true);
  else if (k === 'boss') go('#/boss/' + v, false, true);
  else if (k === 'district') { const d = districtById(v); if (d) go('#/verse/' + d.from, false, true); }
  else go(map[k] || '#/', false, true);
}

/** A demo player with the first k verses learned at 2–3★ and the challenges of complete districts corrected. */
export function demoProfile(k: number, o: { due?: boolean } = {}) {
  const poem = P();
  const p = profile();
  const d0 = today();
  p.seen.intro = true; p.seen.cast = true; p.seen.askedName = true; p.seen.tips.push('listen.tip.shatr', 'game.missingWord.mishmish'); p.seen.lahn = true;
  p.verses = {};
  poem.verses.slice(0, k).forEach((v, i) => {
    const box = 1 + (i % 3);
    p.verses[String(v.n)] = { stars: 2 + ((v.n * 7) % 2), box, due: o.due ? d0 : addDays(d0, INTERVALS[box - 1]), rung: box, plays: 1, lapses: 0, weak: {}, last: d0 };
  });
  p.bosses = {};
  for (const d of poem.districts) if (versesOf(d).every((v) => v.n <= k) && !d.final) p.bosses[bossKey(d)] = { stars: 3, crown: false, date: d0 };
  p.days = Array.from({ length: Math.min(12, Math.max(1, Math.ceil(k / 3))) }, (_, i) => addDays(d0, -i)).sort();
  p.stickers = { amin: d0, mishmish: d0, laqlaq: d0 };
  save();
  checkStickers();
}

const until = async (f: () => boolean, ms = 15000) => { const t0 = performance.now(); while (!f()) { if (performance.now() - t0 > ms) return false; await new Promise((r) => setTimeout(r, 40)); } return true; };

let floatTimer = 0;
export function installTestApi() {
  const api = {
    env,
    state: () => ({ screen: currentRoute(), hash: location.hash, level: getLevelState(), boss: getBossState(), polish: getPolishState(), item: getActive()?.label || null, learned: learnedCount(), today: today(), clock: getClockOffset(), profile: profile(), settings: settings() }),
    /** Performs the right action for the current item with a visible tap (waits up to 15 s for one). */
    /** `skip`: item labels to leave alone (returns 'skipped'); 'name-sheet' leaves the name sheet open for the caller. */
    solve: async (skip: string[] = []) => {
      const later = () => document.querySelector('[data-testid=name-sheet] [data-testid=profile-later]');
      if (later()) return skip.includes('name-sheet') ? 'skipped' : tapVisibly(later());
      const ok = await until(() => !!getActive()?.right()?.isConnected || !!later());
      if (later()) return skip.includes('name-sheet') ? 'skipped' : tapVisibly(later());
      if (ok && skip.includes(getActive()?.label || '')) return 'skipped';
      return ok ? tapVisibly(getActive()!.right()) : false;
    },
    fail: async () => { const ok = await until(() => !!getActive()?.wrong()?.isConnected, 4000); return ok ? tapVisibly(getActive()!.wrong()) : false; },
    next: () => tapVisibly(document.querySelector('[data-testid=btn-next]')),
    /**
     * Capture (V1/V2): a copy line through the game's own bubble and voice clip, as the game shows its own lines (kq:say,
     * kq:audio for the voice, kq:say-end). On screens without a cast bar (medal, dedication…) a bubble floats at the
     * bottom for the line. Resolves when the clip (or the caption time) ends.
     */
    say: async (key: string, params?: Record<string, string | number>) => {
      if (!has(key)) throw new Error('no copy line ' + key);
      let floating: HTMLElement | null = null;
      if (!bubbleHost() || bubbleHost()!.classList.contains('capture-bubble')) {
        clearTimeout(floatTimer);
        floating = (document.querySelector('.capture-bubble') as HTMLElement | null) || document.body.appendChild(h('div', { class: 'bubble capture-bubble pop-in', 'data-testid': 'bubble', 'aria-live': 'polite' }));
        setBubbleHost(floating);
      }
      try { await sayLine(key, { force: true, params }); }
      finally {
        // a short grace so back-to-back lines reuse the same floating bubble
        if (floating) floatTimer = window.setTimeout(() => { floating!.remove(); if (bubbleHost() === null || !floating!.isConnected) setBubbleHost(null); }, 400 / env.speed);
      }
      return key;
    },
    /** The current item's right / wrong targets (elements; for in-page use by tests). */
    active: () => { const a = getActive(); return a ? { label: a.label || null, right: a.right(), wrong: a.wrong() } : null; },
    goto: gotoTarget,
    seed: (n: number) => { env.seed = n; profile().seed = n; save(); },
    learnUpTo: (k: number, o?: { due?: boolean }) => demoProfile(k, o),
    advanceClock: (days: number) => setClockOffset(getClockOffset() + days),
    setClock: (days: number) => setClockOffset(days),
    set: (patch: Partial<Settings>) => { Object.assign(settings(), patch); save(); applySettings(); },
    level: (l: 'easy' | 'mid' | 'strong') => { profile().level = l; save(); },
    boost: (b: number) => { profile().boost = b; save(); },
    /** A fresh store; the URL switches (recitation, voices, sfx, grownup, level) apply again, as at boot. */
    reset: (seed?: number) => {
      resetAll(seed);
      const st = settings();
      if (env.recitation !== null) st.recitation = env.recitation;
      if (env.voices !== null) st.voices = env.voices;
      if (env.sfx !== null) st.sfx = env.sfx;
      if (env.grownup !== null) st.grownupMode = env.grownup;
      if (env.level) profile().level = env.level;
      save(); applySettings();
    },
    speed: (s: number) => setSpeedForTests(s),
    poem: () => P().verses.map((v) => ({ n: v.n, sadr: v.sadr, ajz: v.ajz, rhymeWord: v.rhymeWord, district: v.district, locked: v.all.filter((t) => t.locked).map((t) => t.t), sacred: v.all.filter((t) => t.sacred).map((t) => t.t) })),
    /** Capture `&timings=`: { url, verses } when the reader durations were applied, else null. */
    timings: () => P().timingsOverride ?? null,
    timingOf: (n: number) => P().verses.find((v) => v.n === n)?.timing ?? null,
    districts: () => P().districts.map((d) => ({ id: d.id, from: d.from, to: d.to, boss: d.boss, bossVerse: d.bossVerse, final: d.final })),
    captions: () => captions.slice(),
    sfx: () => played.slice(),
    missingCopy: () => missingKeys(),
    store: () => JSON.parse(JSON.stringify(S())),
    optionAudit,
  };
  (window as unknown as { __kq: typeof api; kq: unknown }).__kq = api;
  (window as unknown as { kq: unknown }).kq = { state: api.state, solve: api.solve, fail: api.fail, next: api.next, goto: api.goto };
}
