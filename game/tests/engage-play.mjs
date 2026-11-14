// E1 engagement playtest (VM): a child's first days with the LIVE game (or any base URL), phone 390×844 at 2×, no capture
// mode, voices, effects and the reciter on. Day 1: splash → story watched → verse 1 at real speed (listen, catch a few
// lit words, meaning read, games with a wrong tap now and then) → district 1 → Manfoukh → district 2 → Khallat; home, map,
// necklace, stickers. Day 2 (clock +1): home → polish. Day 6 (clock +5): the comeback greeting.
// Output: <out>/NN-name.png + play.json (step timings, captions, dead time, first-game time).
//   node engage-play.mjs [baseURL=https://khaqaniya.benjelloun.dev/] [out=shots] [until=all|pearl2]   (pearl2: stop at verse 2's start)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'https://khaqaniya.benjelloun.dev/';
const OUT = process.argv[3] || 'shots';
const UNTIL = process.argv[4] || 'all';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'ar' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.addInitScript(() => {
  window.__log = [];
  for (const ev of ['kq:step', 'kq:say', 'kq:item', 'kq:audio']) window.addEventListener(ev, (e) => window.__log.push({ ev, t: Math.round(performance.now()), d: e.detail }));
});
let n = 0;
const shot = async (name) => { const f = `${OUT}/${String(++n).padStart(2, '0')}-${name}.png`; await p.screenshot({ path: f }); console.log('shot', f); };
const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
const st = () => p.evaluate(() => { const s = window.__kq.state(); return { screen: s.screen, level: s.level, boss: s.boss, polish: s.polish, item: s.item, learned: s.learned }; });
const T0 = Date.now();
const marks = {};
const mark = (k) => { marks[k] = Math.round((Date.now() - T0) / 100) / 10; console.log('mark', k, marks[k]); };

// ── day 1: first launch ──────────────────────────────────────────────────────────────
await p.goto(BASE);
await p.waitForSelector('[data-testid=btn-start]');
await p.waitForTimeout(1500);
await shot('splash');
const tStart = Date.now();
await p.getByTestId('btn-start').tap();
mark('tap-start');
// the story, watched (no taps): one shot per panel
await p.waitForSelector('[data-testid=intro]', { timeout: 10000 }).catch(() => {});
const seenPanels = new Set();
for (let i = 0; i < 900; i++) {
  const s = await st();
  if (s.screen !== 'intro') break;
  const cap = await p.evaluate(() => document.querySelector('[data-testid=intro-caption]')?.textContent || '');
  if (cap && !seenPanels.has(cap)) { seenPanels.add(cap); await p.waitForTimeout(600); await shot('intro-' + seenPanels.size); }
  await p.waitForTimeout(100);
}
mark('story-end');

let wrongEvery = 0;
const shots = new Set();
async function snapOnce(key, name, wait = 400) { if (shots.has(key)) return; shots.add(key); await p.waitForTimeout(wait); await shot(name); }
/** Plays like a child until `stop(state)` is true. `real(state)` = real speed (reciter on, screenshots). */
async function playUntil(stop, real, o = {}) {
  let lastKey = '';
  for (let guard = 0; guard < 60000; guard++) {
    const s = await st();
    if (stop(s)) return s;
    const isReal = real(s);
    await api('speed', isReal ? 1 : 4);
    await p.evaluate((on) => { const st = window.__kq.state().settings; if (st.recitation !== on) window.__kq.set({ recitation: on }); }, isReal);
    // the name sheet after the first pearl: look at it, the grown-up taps «later»
    if (await p.evaluate(() => !!document.querySelector('[data-testid=name-sheet]'))) { await snapOnce('name', 'name-sheet', 800); await p.waitForTimeout(800); await api('solve'); continue; }
    const v = s.level?.verse;
    const key = s.screen === 'boss' ? `boss-${s.boss?.id}-q${s.boss?.q}-${s.item}` : s.screen === 'polish' ? `polish-${s.polish?.i}-${s.item}` : `v${v}-${s.level?.step}-${s.item}`;
    // a child taps the glowing word while listening
    if (s.level?.step === 'listen' && isReal && !shots.has('invite-' + v) && await p.$('.listen-card.invite .w.lit')) { shots.add('invite-' + v); await shot(`v${v}-listen-invite`); }
    if (s.level?.step === 'listen' && isReal) {
      const caught = await p.evaluate(() => { const w = document.querySelector('.listen-card .w.lit'); if (!w) return false; w.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return true; });
      if (caught && !marks['first-star']) mark('first-star');
      if (caught) await snapOnce(`listen-${v}`, `v${v}-listen-catch`, 250);
    }
    if (isReal && s.level?.step === 'meaning' && !s.item) await snapOnce(`meaning-${v}`, `v${v}-meaning`, 1500);
    if (key !== lastKey && s.item) {
      lastKey = key;
      if (isReal && o.shots !== false) {
        const name = s.screen === 'boss' ? `boss-${s.boss?.id}-q${s.boss?.q}-${s.item}` : s.screen === 'polish' ? `polish-${(s.polish?.i ?? 9) + 1}-${s.item}` : `v${v}-${s.level?.step}-${s.item}`;
        await snapOnce(key, name, s.item === 'reward' ? 2600 : s.item === 'g4' ? 1800 : 500);
        if (s.item === 'reward') { await p.waitForTimeout(2500); await shot(`v${v}-reward-later`); }
      }
      if (s.item === 'entrance' && isReal) { await p.waitForTimeout(3500); await shot(`boss-${s.boss?.id}-entrance-later`); }
    }
    if (!s.item) { await p.waitForTimeout(80); continue; }
    if (s.screen === 'verse' && s.level?.step === 'meaning' && isReal) await p.waitForTimeout(3500);   // reading time
    if (o.firstGame && !marks['first-game'] && ['g1', 'g2', 'g3', 'g4', 'g5a', 'radar', 'order'].includes(s.item)) mark('first-game');
    const wrongFirst = ++wrongEvery % 4 === 0 && !['next', 'reward', 'entrance', 'district-card', 'boss-done', 'polish-done', 'g7-reveal', 'home', 'map'].includes(s.item);
    await p.waitForTimeout(isReal ? 700 : 60);
    if (wrongFirst) { await api('fail'); await p.waitForTimeout(isReal ? 900 : 100); }
    await api('solve', ['__none']);
    await p.waitForTimeout(isReal ? 120 : 30);
  }
  throw new Error('playUntil guard');
}
const districts = await api('districts');
// verse 1 and 2 at real speed, then fast; the first pearl's time is measured
await playUntil((s) => s.level?.verse === 2 && s.level?.step === 'intro', (s) => s.level?.verse === 1, { firstGame: true });
mark('pearl-1');
if (UNTIL === 'pearl2') {
  // the story going on (first launch): one more panel before verse 2
  await p.waitForTimeout(1500);
  if (await p.$('[data-testid=story-beat]')) { await shot('story-beat-2'); }
  const log = await p.evaluate(() => window.__log);
  const r1 = (x) => Math.round(x * 10) / 10;
  writeFileSync(`${OUT}/play.json`, JSON.stringify({ base: BASE, marks, firstTapToFirstStar: r1(marks['first-star'] - marks['tap-start']), firstTapToFirstGame: r1(marks['first-game'] - marks['tap-start']), firstTapToPearl1: r1(marks['pearl-1'] - marks['tap-start']), errors, log: log.filter((e) => e.ev !== 'kq:audio').slice(0, 400) }, null, 1));
  console.log('done (pearl2)', JSON.stringify(marks), 'errors', errors.length);
  await b.close();
  process.exit(0);
}
await playUntil((s) => s.screen === 'boss', (s) => s.level?.verse === 2);
mark('boss-1');
await playUntil((s) => s.screen === 'boss' && s.item === 'boss-done', () => true);
await p.waitForTimeout(2500); await shot('boss-manfoukh-fixed');
await api('solve');   // to district 2
await playUntil((s) => s.screen === 'boss' && s.item === 'boss-done', (s) => s.level?.verse === 8 || s.level?.verse === 11 || s.screen === 'boss');
await p.waitForTimeout(2500); await shot('boss-khallat-fixed');
mark('district-2-done');
// home, map, necklace, stickers, heroes
await api('speed', 1);
await api('goto', 'home'); await p.waitForTimeout(3500); await shot('home-day1');
await api('goto', 'map'); await p.waitForTimeout(2000); await shot('map-day1');
await api('goto', 'necklace'); await p.waitForTimeout(1500); await shot('necklace');
await p.getByTestId('btn-play-all').tap(); await p.waitForTimeout(4000); await shot('necklace-playing');
await api('goto', 'stickers'); await p.waitForTimeout(1200); await shot('stickers-friends');
await p.getByTestId('tab-achievements').tap(); await p.waitForTimeout(800); await shot('stickers-feats');
await api('goto', 'heroes'); await p.waitForTimeout(1000); await shot('heroes');

// ── day 2: the daily polish ──────────────────────────────────────────────────────────
await p.goto(BASE + '?today=+1#/');
await p.waitForFunction(() => !!window.__kq);
await p.waitForTimeout(800);
if (await p.$('[data-testid=btn-start]')) { await shot('day2-splash'); await p.getByTestId('btn-start').tap(); }
await p.waitForTimeout(4000); await shot('home-day2');
const due = await p.evaluate(() => document.querySelector('[data-testid=btn-polish]') ? 'big' : document.querySelector('[data-testid=polish-card]') ? 'card' : 'none');
console.log('polish on day 2:', due);
await api('goto', 'polish');
await playUntil((s) => s.item === 'polish-done', () => true);
await p.waitForTimeout(2500); await shot('polish-done');
mark('polish-done');

// ── day 6: back after 4 days away ────────────────────────────────────────────────────
await p.goto(BASE + '?today=+5#/');
await p.waitForFunction(() => !!window.__kq);
await p.waitForTimeout(800);
if (await p.$('[data-testid=btn-start]')) await p.getByTestId('btn-start').tap();
await p.waitForTimeout(3500); await shot('home-day6-comeback');

const log = await p.evaluate(() => window.__log);
const steps = [];
let cur = null;
for (const e of log) {
  if (e.ev === 'kq:step') { if (cur) steps.push(cur); cur = { ...e.d, t: e.t, firstItem: null, says: [] }; }
  else if (cur && e.ev === 'kq:item' && e.d.label && cur.firstItem === null) cur.firstItem = e.t - cur.t;
  else if (cur && e.ev === 'kq:say') cur.says.push({ key: e.d.key, who: e.d.who, words: e.d.text.split(/\s+/).length });
}
if (cur) steps.push(cur);
for (let i = 0; i < steps.length - 1; i++) steps[i].dur = steps[i + 1].t - steps[i].t;
writeFileSync(`${OUT}/play.json`, JSON.stringify({ base: BASE, marks, firstTapToFirstGame: marks['first-game'] - marks['tap-start'], errors, steps }, null, 1));
console.log('done', Math.round((Date.now() - tStart) / 1000), 's; errors', errors.length, JSON.stringify(marks));
await b.close();
