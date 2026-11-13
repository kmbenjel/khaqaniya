// Debug helper (VM): verse 1 to the reward at speed 100, then dump name-sheet state.
import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=0&voices=0&speed=100&fresh=1&seed=42&motion=0#/');
await p.waitForFunction(() => !!window.__kq);
await p.evaluate(() => window.__kq.goto('verse:1'));
for (let i = 0; i < 60; i++) {
  const s = await p.evaluate(() => { const s = window.__kq.state(); return [s.level?.step, s.item, document.querySelectorAll('[data-testid=name-sheet]').length, document.querySelector('[data-testid=name-sheet]')?.className, location.hash].join(' '); });
  console.log(i, s);
  const r = await p.evaluate(() => window.__kq.solve(['medal']));
  if (i > 30) console.log('  solve', r);
  await p.waitForTimeout(15);
}
await b.close();
