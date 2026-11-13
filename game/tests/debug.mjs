// Ad-hoc driver for debugging on the VM (needs `node tests/serve.mjs 4321` running):
//   node tests/debug.mjs '<hash>' <steps> '<extra query>'
import { chromium } from '@playwright/test';

const [hash = '#/verse/1', steps = '200', q = ''] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.on('console', (m) => console.log('console:', m.type(), m.text()));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=0&voices=0&speed=25&fresh=1&seed=42&motion=0' + q + hash);
await p.waitForFunction(() => !!window.__kq);
let last = '';
for (let i = 0; i < Number(steps); i++) {
  const s = await p.evaluate(() => { const s = window.__kq.state(); return JSON.stringify({ sc: s.screen, h: s.hash, l: s.level, b: s.boss, it: s.item, n: s.learned }); });
  if (s !== last) { console.log(i, s); last = s; }
  const t0 = Date.now(); const ok = await p.evaluate(() => window.__kq.solve()); console.log('solve took', Date.now() - t0, ok, await p.evaluate(() => performance.now() | 0));
  if (!ok) { console.log(i, 'solve returned false'); console.log(await p.evaluate(() => [...document.querySelectorAll('[data-testid]')].filter((e) => e.offsetParent).map((e) => e.getAttribute('data-testid')).join(' '))); console.log(await p.evaluate(() => JSON.stringify({ frames: document.querySelectorAll('.frame').length, zones: document.querySelectorAll('.play-zone').length, prompt: document.querySelector('.prompt-zone')?.innerHTML.slice(0, 200), overlays: document.querySelectorAll('.overlay').length, play: document.querySelector('.play-zone')?.innerHTML.slice(0, 300), caps: window.__kq.captions().slice(-6).map((c) => c.key), st: window.__kq.state().boss }))); await p.waitForTimeout(2000); console.log('again', await p.evaluate(() => JSON.stringify({ now: performance.now() | 0, prompt: document.querySelector('.prompt-zone')?.childElementCount, play: document.querySelector('.play-zone')?.innerHTML.length, item: window.__kq.state().item }))); await p.screenshot({ path: 'test-shots/debug-stall.png' }); break; }
  await p.waitForTimeout(40);
}
await p.screenshot({ path: 'test-shots/debug.png' });
await b.close();
