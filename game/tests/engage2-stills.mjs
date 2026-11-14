// E2: still screenshots of the parents' progress (grown-ups' corner) and the «see you tomorrow» card, capture mode,
// at 2× for docs/engagement/after (scaled down there). Needs a test server: `node tests/serve.mjs 4395`.
//   node tests/engage2-stills.mjs [baseURL=http://127.0.0.1:4395/khaqaniya/] [out=test-shots/e2] [sizes=390x844,360x740]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4395/khaqaniya/';
const OUT = process.argv[3] || 'test-shots/e2';
const SIZES = (process.argv[4] || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
for (const [W, H] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 1000, hasTouch: W < 1000, deviceScaleFactor: 2, locale: 'ar' });
  const p = await ctx.newPage();
  const tag = `${W}x${H}`;
  const shot = (name) => p.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
  const st = () => p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, verse: s.level?.verse }; });
  const open = async (q, hash = '#/') => { await p.goto(BASE + '?capture=1&voices=0&recitation=0&sfx=0&motion=1&fresh=1&seed=7&' + q + hash); await p.waitForFunction(() => !!window.__kq); };
  const patch = (fn) => p.evaluate((fn) => { const k = window.__kq; const pr = k.state().profile; new Function('p', 'today', fn)(pr, k.state().today); k.set({}); }, fn);
  async function until(pred, skip = []) {
    for (let i = 0; i < 3000; i++) { const s = await st(); if (pred(s)) return s; await api('solve', skip); await p.waitForTimeout(25); }
    throw new Error('not reached');
  }
  // the corner: a named player 14 pearls in, two verses to practise (polish retries; words missed with a listener)
  await open('speed=25');
  await api('learnUpTo', 14);
  await patch(`p.name = 'أمين'; p.verses['3'].lapses = 2; p.verses['5'].weak = { s1: 2, a0: 1 }; p.verses['9'].lapses = 1; p.verses['9'].weak = { a2: 1 }; p.verses['2'].due = today; p.verses['6'].due = today;`);
  await api('goto', 'grownups'); await p.waitForTimeout(900); await shot('grown-progress');
  // a second lantern (teal, named), chosen in the progress
  await p.getByTestId('btn-add-player').click();
  await patch(`p.name = 'مريم'; p.lantern = 'teal';`);
  await api('learnUpTo', 4);
  await patch(`p.verses['2'].weak = { s2: 1 };`);
  await api('goto', 'home'); await api('goto', 'grownups'); await p.waitForTimeout(600);
  await p.getByTestId('progress-who-p2').click(); await p.waitForTimeout(400); await shot('grown-progress-lanterns');
  await p.getByTestId('progress-who-p1').click(); await p.waitForTimeout(300);
  await p.getByTestId('practise-5').click(); await p.waitForTimeout(700); await shot('practise-sheet');
  // «see you tomorrow»: pearl 2 of the day (the suggestion is 2), at real speed once the reward's lines are over
  await open('speed=25');
  await api('learnUpTo', 1);
  await patch(`p.name = 'أمين'; p.newToday = { date: today, count: 1 };`);
  await api('goto', 'verse:2');
  await until((s) => s.step === 'reward', ['reward']);
  await until((s) => s.item === 'tomorrow' || s.item === 'reward', ['reward', 'tomorrow']);
  await api('speed', 1);
  await p.waitForTimeout(1200); await shot('tomorrow');
  await ctx.close();
}
await b.close();
console.log('stills in', OUT);
