// E1: still screenshots of the moments a playtest passes too fast to judge (reward, level intro, challenge head and
// correction, polish, home, map, necklace, stickers), capture mode with demo players, at two phone sizes.
//   node engage-stills.mjs [baseURL=https://khaqaniya.benjelloun.dev/] [out=stills] [sizes=390x844,360x740]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'https://khaqaniya.benjelloun.dev/';
const OUT = process.argv[3] || 'stills';
const SIZES = (process.argv[4] || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
for (const [W, H] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 1000, hasTouch: W < 1000, deviceScaleFactor: 2, locale: 'ar' });
  const p = await ctx.newPage();
  const tag = `${W}x${H}`;
  const shot = (name) => p.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
  const st = () => p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, q: s.boss?.q, screen: s.screen, polish: s.polish }; });
  const open = async (q, hash = '#/') => { await p.goto(BASE + '?capture=1&voices=0&recitation=0&sfx=0&motion=1&fresh=1&seed=7&' + q + hash); await p.waitForFunction(() => !!window.__kq); };
  async function until(pred, skip = []) {
    for (let i = 0; i < 3000; i++) { const s = await st(); if (pred(s)) return s; await api('solve', skip); await p.waitForTimeout(25); }
    throw new Error('not reached');
  }
  // home: a new player after 3 pearls, a player 9 pearls in
  await open('profile=demo:3'); await p.waitForTimeout(1500); await shot('home-3');
  await open('profile=demo:9'); await p.waitForTimeout(1500); await shot('home-9');
  await p.evaluate(() => document.querySelector('.home-main')?.scrollTo(0, 9999)); await p.evaluate(() => window.scrollTo(0, 9999)); await p.waitForTimeout(300); await shot('home-9-bottom');
  await api('goto', 'map'); await p.waitForTimeout(1800); await shot('map-9');
  // level intro (the pearl rolls in) and the reward of verse 4
  await open('profile=demo:3&speed=1', '#/');
  await api('goto', 'verse:4'); await p.waitForTimeout(1400); await shot('level-intro');
  await api('speed', 25);
  await until((s) => s.step === 'meaning'); await api('speed', 1); await p.waitForTimeout(1500); await shot('meaning-v4');
  await api('speed', 25);
  await until((s) => s.step === 'reward', ['reward']);
  await api('speed', 1);
  await p.waitForTimeout(350); await shot('reward-0.3s');
  await p.waitForTimeout(1300); await shot('reward-1.6s');
  await p.waitForTimeout(2500); await shot('reward-4s');
  // challenge: the head during a question, then the correction
  await open('profile=demo:7&speed=25', '#/');
  await api('goto', 'boss:manfoukh');
  await p.waitForSelector('[data-testid=entrance-line]:not(:empty)'); await p.waitForTimeout(600); await shot('boss-entrance');
  await until((s) => (s.q || 0) >= 3 && s.item && s.item !== 'entrance', []);
  await p.waitForTimeout(500); await shot('boss-q3');
  await until((s) => s.item === 'boss-done', ['boss-done']); await api('speed', 1); await p.waitForTimeout(1500); await shot('boss-fixed');
  // polish with six due pearls
  await open('speed=25', '#/');
  await api('learnUpTo', 6, { due: true }); await api('goto', 'home'); await p.waitForTimeout(1500); await shot('home-due');
  await api('goto', 'polish');
  await until((s) => s.screen === 'polish' && s.item && s.item !== 'next', []); await p.waitForTimeout(400); await shot('polish-task1');
  await until((s) => (s.polish?.i || 0) >= 2, []); await p.waitForTimeout(400); await shot('polish-task3');
  await until((s) => s.item === 'polish-done', ['polish-done']); await api('speed', 1); await p.waitForTimeout(1500); await shot('polish-done');
  // LISTEN on a first verse (the invitation star), G4 lanes, the story going on before verse 2
  await open('speed=1&recitation=1', '#/');
  await api('goto', 'verse:1');
  await until((s) => s.step === 'listen', ['next']);
  await p.waitForSelector('.listen-card .w.lit', { timeout: 40000 }).catch(() => {}); await p.waitForTimeout(500); await shot('listen-invite');
  await open('speed=25', '#/');
  await api('learnUpTo', 2); await api('goto', 'verse:3');
  await until((s) => s.step === 'playB' && s.item === 'g4', ['g4']); await api('speed', 1); await p.waitForTimeout(1600); await shot('g4-lanes');
  await open('speed=1', '#/');
  await api('learnUpTo', 1);
  await p.evaluate(() => { const pr = window.__kq.state().profile; pr.seen.tips.push('story.short'); });
  await api('goto', 'verse:2');
  await p.waitForSelector('[data-testid=story-beat]', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200); await shot('story-beat');
  // necklace, stickers
  await open('profile=demo:14'); await api('goto', 'necklace'); await p.waitForTimeout(1200); await shot('necklace-14');
  await api('goto', 'stickers'); await p.waitForTimeout(1000); await shot('stickers-14');
  await p.getByTestId('tab-achievements').click(); await p.waitForTimeout(600); await shot('stickers-14-feats');
  await api('goto', 'grownups'); await p.waitForTimeout(1000); await shot('grownups');
  await ctx.close();
}
await b.close();
console.log('stills done');
