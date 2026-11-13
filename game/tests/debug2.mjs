// Debug helper: open a hash, click the entrance skip, then dump the play zone over time.
import { chromium } from '@playwright/test';
const [hash, q = ''] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.on('console', (m) => console.log('console:', m.type(), m.text()));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=0&voices=0&speed=25&fresh=1&seed=42&motion=0' + q + hash);
await p.waitForFunction(() => !!window.__kq);
await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('[data-testid=btn-skip]')?.click());
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(700);
  console.log(i, await p.evaluate(() => JSON.stringify({ b: window.__kq.state().boss, it: window.__kq.state().item, play: document.querySelector('.play-zone')?.innerHTML.slice(0, 200), caps: window.__kq.captions().slice(-3).map((c) => c.key) })));
}
await b.close();
