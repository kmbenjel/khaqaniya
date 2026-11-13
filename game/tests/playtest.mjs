// Q1 child-eye playtest driver (VM; needs `node tests/serve.mjs 4321`): plays districts 1–2 and their challenges through
// the UI like a child (a visible tap on the right answer, now and then a wrong one first), phone 360×740, capture mode,
// the reciter on. Logs per step: wall time, "dead time" before the first tappable thing, captions (words), the size of
// the tapped target; one screenshot per step and game. Output: test-shots/playtest/*.png + playtest.json.
//   node tests/playtest.mjs [fastSpeed=2] [verses=all|1,2,8] [startVerse=1]
// Real-speed verses and the first challenge play with the reciter; the fast ones mute it (clips run in real time).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const fast = Number(process.argv[2] || 2);
const only = process.argv[3] && process.argv[3] !== 'all' ? new Set(process.argv[3].split(',').map(Number)) : null;
const startAt = Number(process.argv[4] || 1);
const OUT = 'test-shots/playtest';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'ar' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.addInitScript(() => {
  window.__log = [];
  for (const ev of ['kq:step', 'kq:say', 'kq:item', 'kq:audio', 'kq:screen']) window.addEventListener(ev, (e) => window.__log.push({ ev, t: Math.round(performance.now()), d: e.detail }));
});
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=1&voices=0&sfx=1&speed=1&fresh=1&seed=7&motion=1#/');
await p.waitForFunction(() => !!window.__kq);
const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
const st = () => p.evaluate(() => { const s = window.__kq.state(); return { screen: s.screen, level: s.level, boss: s.boss, item: s.item, learned: s.learned }; });
const shots = new Set();
const snap = async (name) => { if (shots.has(name)) return; shots.add(name); await p.screenshot({ path: `${OUT}/${name}.png` }); };
const taps = [];
let wrongEvery = 0;
const t0 = Date.now();
async function tapRight(wrongFirst) {
  const info = await p.evaluate(() => { const a = window.__kq.active(); const r = a?.right?.getBoundingClientRect(); return a && r ? { label: a.label, w: Math.round(r.width), h: Math.round(r.height), hasWrong: !!a.wrong } : null; });
  if (info) taps.push(info);
  if (wrongFirst && info?.hasWrong) { await api('fail'); await p.waitForTimeout(700); }
  return api('solve', ['__none']);
}
const districts = await api('districts');
const end = districts[1].to;
if (startAt > 1) await api('learnUpTo', startAt - 1);
await api('goto', 'verse:' + startAt);
let lastKey = '';
for (let guard = 0; guard < 40000; guard++) {
  const s = await st();
  if (s.screen === 'boss' && s.item === 'boss-done' && s.boss?.id === districts[1].boss) { await snap('boss2-fixed'); break; }
  const v = s.level?.verse;
  const speed = s.screen === 'boss' ? (s.boss?.id === districts[0].boss ? 1 : fast) : (v && (only ? only.has(v) : [1, 2, 8].includes(v)) ? 1 : fast);
  await api('speed', speed);
  await p.evaluate((on) => { const st = window.__kq.state().settings; if (st.recitation !== on) window.__kq.set({ recitation: on }); }, speed === 1);
  const key = s.screen === 'boss' ? `boss-${s.boss?.id}-q${s.boss?.q}-${s.item}` : `v${v}-${s.level?.step}-${s.item}`;
  if (key !== lastKey && s.item) { lastKey = key; if (speed === 1) { await p.waitForTimeout(350); await snap(key); } }
  if (v > end && s.screen === 'verse') break;
  if (guard % 100 === 0) console.log('pt', guard, key, JSON.stringify(s));
  if (await p.evaluate(() => !!document.querySelector('[data-testid=name-sheet]'))) { await snap('name-sheet'); await p.waitForTimeout(1500); await api('solve'); continue; }   // the grown-up taps "later"
  if (!s.item) { await p.waitForTimeout(50); continue; }
  // a child: mostly right, a wrong tap now and then (every 4th choice)
  const wrongFirst = ++wrongEvery % 4 === 0;
  // a short human pause before tapping (reading the banner / looking): 600 ms at real speed
  await p.waitForTimeout(speed === 1 ? 600 : 80);
  await tapRight(wrongFirst);
  await p.waitForTimeout(60);
}
const log = await p.evaluate(() => window.__log);
// per-step durations and dead time (step start → first item)
const steps = [];
let cur = null;
for (const e of log) {
  if (e.ev === 'kq:step') { if (cur) steps.push(cur); cur = { ...e.d, t: e.t, firstItem: null, says: [] }; }
  else if (cur && e.ev === 'kq:item' && e.d.label && cur.firstItem === null) cur.firstItem = e.t - cur.t;
  else if (cur && e.ev === 'kq:say') cur.says.push({ key: e.d.key, words: e.d.text.split(/\s+/).length });
}
if (cur) steps.push(cur);
for (let i = 0; i < steps.length - 1; i++) steps[i].dur = steps[i + 1].t - steps[i].t;
const small = taps.filter((x) => Math.min(x.w, x.h) < 56);
writeFileSync(`${OUT}/playtest.json`, JSON.stringify({ minutes: Math.round((Date.now() - t0) / 6000) / 10, fast, errors, smallTargets: small, steps }, null, 1));
console.log('playtest done in', Math.round((Date.now() - t0) / 1000), 's; steps', steps.length, 'small targets', small.length, 'errors', errors.length);
await b.close();
