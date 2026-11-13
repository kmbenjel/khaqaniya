// Q1: the QA.md screenshots, phone 360×740, current build (VM; needs `node tests/serve.mjs 4321`).
//   node tests/aftershots.mjs → test-shots/after/NN-name.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const OUT = 'test-shots/after';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: 'ar' });
const p = await ctx.newPage();
const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
const st = () => p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, q: s.boss?.q }; });
const shot = (name) => p.screenshot({ path: `${OUT}/${name}.png` });
async function until(pred, skip = []) {
  for (let i = 0; i < 1500; i++) { const s = await st(); if (pred(s)) return s; await api('solve', skip); await p.waitForTimeout(25); }
  throw new Error('not reached');
}
async function open(q, hash = '#/') {
  await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&voices=0&sfx=0&fresh=1&seed=7&' + q + hash);
  await p.waitForFunction(() => !!window.__kq);
}
// verse 1 with the reciter: title card, meaning, G1 audio cards (one heard), the radar falling, recite, reward
await open('recitation=1&motion=1&speed=1');
await api('goto', 'verse:1');
await p.waitForSelector('[data-testid=district-card-line]');
await p.waitForTimeout(900);
await shot('01-district-card');
await api('speed', 4);
await until((s) => s.step === 'meaning', ['g1']);
await p.waitForTimeout(1500); await shot('10-meaning');
await until((s) => s.item === 'g1', ['g1']);
await p.locator('.opt-audio').last().click();
await p.waitForTimeout(500); await shot('02-g1-audio-cards');
await until((s) => s.item === 'radar', ['radar']);
await api('speed', 1);
await p.waitForFunction(() => { const w = document.querySelector('.radar-word'), f = document.querySelector('.radar-field'); return w && f && w.getBoundingClientRect().top - f.getBoundingClientRect().top > 90; }, null, { timeout: 15000 }).catch(() => {});
await shot('03-rhyme-radar');
await api('speed', 25);
await until((s) => s.item === 'g7-rate', ['g7-rate']);
await p.waitForTimeout(300); await shot('06-recite-rate');
await until((s) => s.item === 'reward', ['reward']);
await p.waitForTimeout(1800); await shot('09-reward');
// verse 2 (ordering), verse 3 (G4 lanes) — reciter off for speed
await open('recitation=0&motion=1&speed=25');
await api('learnUpTo', 1); await api('goto', 'verse:2');
await until((s) => s.item === 'order', ['order']);
await p.waitForTimeout(300); await shot('04-order-halves');
await api('learnUpTo', 2); await api('goto', 'verse:3');
await until((s) => s.step === 'playB' && s.item === 'g4', ['g4']);
await api('speed', 1);
await p.waitForTimeout(2200); await shot('05-g4-lanes');
// the first challenge: entrance, then a four-card ordering question
await api('speed', 1);
await api('learnUpTo', 7); await api('goto', 'boss:manfoukh');
await p.waitForSelector('[data-testid=entrance-line]:not(:empty)');
await p.waitForTimeout(1200); await shot('07-challenge-entrance');
await api('speed', 25);
for (let i = 0; i < 600; i++) { const s = await st(); if ((s.item === 'order' && (await p.locator('.slot').count()) >= 4) || s.item === 'boss-done') break; await api('solve', ['boss-done']); await p.waitForTimeout(25); }
await p.waitForTimeout(400); await shot('08-challenge-order4');
await b.close();
console.log('aftershots done');
