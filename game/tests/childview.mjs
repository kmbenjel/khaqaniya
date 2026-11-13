// Q1 round 2: phone screenshots for the cross-model child-view pass (VM; needs `node tests/serve.mjs 4321`).
//   node tests/childview.mjs → test-shots/childview/NN-name.png (390×844 at 2×; downscale to ~800 px JPEG afterwards)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const OUT = 'test-shots/childview';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'ar' });
const p = await ctx.newPage();
const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
const st = () => p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, q: s.boss?.q, screen: s.screen }; });
const shot = (name) => p.screenshot({ path: `${OUT}/${name}.png` });
async function until(pred, skip = []) {
  for (let i = 0; i < 2000; i++) { const s = await st(); if (pred(s)) return s; await api('solve', skip); await p.waitForTimeout(25); }
  throw new Error('not reached');
}
async function open(q, hash = '#/') {
  await p.goto('http://127.0.0.1:4321/khaqaniya/?' + (q.includes('capture=0') ? '' : 'capture=1&') + 'voices=0&sfx=0&fresh=1&seed=7&' + q + hash);
  await p.waitForFunction(() => !!window.__kq);
}
// the story, home, map
await open('recitation=0&motion=1&speed=1&capture=0', '');
await p.getByTestId('btn-start').click();
await p.waitForTimeout(1800); await shot('01-intro-story');
await open('recitation=0&motion=1&speed=1&profile=demo:9', '#/');
await p.waitForTimeout(1200); await shot('02-home');
await api('goto', 'map'); await p.waitForTimeout(1500); await shot('03-map');
// verse 1 with the reciter: listening (a word caught), meaning, G1 audio cards, the radar
await open('recitation=1&motion=1&speed=1');
await api('goto', 'verse:1');
await p.waitForSelector('[data-testid=district-card-line]'); await p.waitForTimeout(900); await shot('04-district-card');
await until((s) => s.step === 'listen', ['next']);
await p.waitForSelector('.listen-card .w.lit', { timeout: 30000 });
await p.waitForTimeout(1200);
await p.locator('.listen-card .w.lit').first().dispatchEvent('pointerdown');
await p.waitForTimeout(250); await shot('05-listening');
await api('speed', 6);
await until((s) => s.step === 'meaning', ['g1']);
await p.waitForTimeout(1200); await shot('06-meaning');
await until((s) => s.item === 'g1', ['g1']);
await p.locator('.opt-audio').last().click(); await p.waitForTimeout(500); await shot('07-listen-and-pick');
await until((s) => s.item === 'radar', ['radar']);
await api('speed', 1);
await p.waitForFunction(() => { const w = document.querySelector('.radar-word'), f = document.querySelector('.radar-field'); return w && f && w.getBoundingClientRect().top - f.getBoundingClientRect().top > 90; }, null, { timeout: 15000 }).catch(() => {});
await shot('08-rhyme-radar');
await api('speed', 25);
await until((s) => s.item === 'g6', ['g6']); await p.waitForTimeout(300);
await api('solve'); await api('solve'); await p.waitForTimeout(300); await shot('09-string-the-words');
await until((s) => s.item === 'reward', ['reward']); await p.waitForTimeout(1800); await shot('10-reward');
// verse 3: G4 lanes; verse 2: the runaway word (G3)
await open('recitation=0&motion=1&speed=25');
await api('learnUpTo', 1); await api('goto', 'verse:2');
await until((s) => s.step === 'playB' && s.item === 'g3', ['g3']); await p.waitForTimeout(400); await shot('11-runaway-word');
await api('learnUpTo', 2); await api('goto', 'verse:3');
await until((s) => s.step === 'playB' && s.item === 'g4', ['g4']); await api('speed', 1); await p.waitForTimeout(2200); await shot('12-catch-the-rhyme');
// the first gang challenge: entrance, a question, the correction
await api('learnUpTo', 7); await api('goto', 'boss:manfoukh');
await p.waitForSelector('[data-testid=entrance-line]:not(:empty)'); await p.waitForTimeout(1500); await shot('13-gang-entrance');
await api('speed', 25);
for (let i = 0; i < 400; i++) {   // the second question, shown before it is answered
  const s = await st();
  if ((s.q || 0) >= 2 && s.item && s.item !== 'entrance') break;
  await api('solve', (s.q || 0) >= 2 ? ['order', 'g1', 'g3', 'g4', 'g5a', 'g5b', 'g6', 'g8', 'g9'] : []); await p.waitForTimeout(25);
}
await p.waitForTimeout(500); await shot('14-challenge-question');
await until((s) => s.item === 'boss-done', ['boss-done']); await p.waitForTimeout(800); await shot('15-gang-corrected');
// necklace, certificate
await api('learnUpTo', 14); await api('goto', 'necklace'); await p.waitForTimeout(1000); await shot('16-necklace');
await api('learnUpTo', 51); await api('goto', 'cert'); await p.waitForTimeout(1000); await shot('17-certificate');
await b.close();
console.log('childview done');
