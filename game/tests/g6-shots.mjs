// G6: before/after stills for docs/shots/g6 (VM; needs a server of the build on PORT).
//   node tests/g6-shots.mjs PORT OUTDIR
// Keyboard focus on home's big button (the focus ring), 360×740 first reward with its stickers (where «next» sits),
// 360 necklace (the thread through wrapped lines), tablet home and a tablet play screen (the cast), the map at 390.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] || '4378';
const OUT = process.argv[3] || 'test-shots/g6-stills';
mkdirSync(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${PORT}/khaqaniya/`;
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
async function page(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 1024, hasTouch: w < 1024, locale: 'ar' });
  const p = await ctx.newPage();
  p.api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
  p.until = async (pred, skip = []) => { for (let i = 0; i < 2500; i++) { const s = await p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, screen: s.screen }; }); if (pred(s)) return s; await p.api('solve', skip); await p.waitForTimeout(20); } throw new Error('not reached'); };
  return p;
}
const go = async (p, q, hash = '#/') => { await p.goto(BASE + '?capture=1&voices=0&recitation=0&sfx=0&seed=7&speed=25&motion=0&' + q + hash); await p.waitForFunction(() => !!window.__kq); };
const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.png` });

let p = await page(390, 844);
await go(p, 'fresh=1&profile=demo:12');
await p.waitForTimeout(800);
await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
await p.getByTestId('btn-continue').focus().catch(() => {});
await p.evaluate(() => { const b = document.querySelector('.home .big-btn, .home .btn-primary'); b?.focus({ focusVisible: true }); });
await p.waitForTimeout(300); await shot(p, '390-home-focus');
await p.api('goto', 'map'); await p.waitForTimeout(1500); await shot(p, '390-map');
await p.context().close();

p = await page(360, 740);
await go(p, 'fresh=1');
await p.api('goto', 'verse:1');
await p.until((s) => s.screen === 'verse' && s.item === 'reward', ['reward']);
await p.waitForTimeout(1200); await shot(p, '360-reward-first-pearl');
await p.api('learnUpTo', 12); await p.api('goto', 'necklace'); await p.waitForTimeout(800); await shot(p, '360-necklace');
await p.context().close();

p = await page(820, 1180);
await go(p, 'fresh=1&profile=demo:12');
await p.waitForTimeout(1000); await shot(p, 'tab-home');
await p.api('reset', 7); await p.api('goto', 'verse:1');
await p.until((s) => s.item === 'radar', ['radar']); await p.waitForTimeout(600); await shot(p, 'tab-radar');
await p.context().close();
await b.close();
console.log('stills in', OUT);
