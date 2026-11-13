// Debug helper (VM): verse N with wrong taps first, per-iteration timing.  node tests/debug3.mjs N
import { chromium } from '@playwright/test';
const n = Number(process.argv[2] || 2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=0&voices=0&speed=100&fresh=1&seed=42&motion=0#/');
await p.waitForFunction(() => !!window.__kq);
if (process.argv[3] === 'reset') { await p.evaluate(() => window.__kq.goto('verse:1')); for (let i = 0; i < 200; i++) { const s = await p.evaluate(() => window.__kq.state().item); if (s === 'reward') break; await p.evaluate(() => window.__kq.solve(['reward'])); } console.log('v1 done'); await p.evaluate(() => window.__kq.reset(42)); }
await p.evaluate((n) => { window.__kq.learnUpTo(n - 1); window.__kq.goto('verse:' + n); }, n);
let last = '';
for (let i = 0; i < 300; i++) {
  const s = await p.evaluate(() => { const s = window.__kq.state(); return JSON.stringify([s.level, s.item]); });
  const key = s;
  let t = Date.now();
  if (key !== last) { last = key; const hw = await p.evaluate(() => !!window.__kq.active()?.wrong); if (hw) { for (let k = 0; k < 3; k++) { const r = await p.evaluate(() => window.__kq.fail()); console.log(i, s, 'fail', r, Date.now() - t); t = Date.now(); if (!r) break; } } }
  const r = await p.evaluate(() => window.__kq.solve(['reward']));
  console.log(i, s, 'solve', r, Date.now() - t);
  if (s.includes('"reward"]')) break;
}
await b.close();
