#!/usr/bin/env node
// Deterministic «demo run» for the YouTube walkthrough (GAME_DESIGN §12): a scripted play-through at real speed, recorded
// as video by Playwright, with every kq:step / kq:audio / kq:say event logged with its time so the video pipeline can lay
// the narrator, captions and (≤ 1 hemistich) recitation quotes exactly where the game "played" them.
// Run on the VM with the game served (node tests/serve.mjs 4321):
//   node tests/demo-run.mjs [outDir=video-capture] [segments=all|intro,gate,boss1,…] [w=1280] [h=720]
// Recitation is off by default in the capture (Content ID, sources/CONTENT_ID.md): pass KQ_RECITATION=1 to hear it.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [out = 'video-capture', which = 'all', W = '1280', H = '720'] = process.argv.slice(2);
const BASE = process.env.KQ_URL || 'http://127.0.0.1:4321/khaqaniya/';
const REC = process.env.KQ_RECITATION === '1' ? 1 : 0;
mkdirSync(out, { recursive: true });

// Each segment: a fresh page (own video file) from a URL state, then a list of actions.
// Actions: ['solve', n] solve n items · ['fail'] one wrong tap · ['help'] press the help lantern · ['wait', ms] ·
//          ['until', step] solve until the level/boss reaches that step · ['click', testid] · ['goto', target]
const SEGMENTS = {
  intro: { q: { fresh: 1 }, hash: '', actions: [['click', 'btn-start'], ['wait', 36000], ['waitFor', 'home'], ['wait', 9000]] },
  gate: { q: { fresh: 1, profile: 'demo:0' }, hash: '#/verse/1', actions: [['untilItem', 'radar'], ['fail'], ['untilStep', 'playC'], ['wait', 1500], ['help'], ['help'], ['untilStep', 'reward'], ['wait', 4000], ['click', 'btn-next'], ['untilStep', 'playA'], ['untilStep', 'reward'], ['wait', 3000]] },
  boss1: { q: { fresh: 1, profile: 'demo:7' }, hash: '#/boss/manfoukh', actions: [['wait', 8000], ['solve', 3], ['fail'], ['untilItem', 'boss-done'], ['wait', 6000]] },
  map: { q: { fresh: 1, profile: 'demo:22' }, hash: '#/map', actions: [['wait', 3000], ['scroll', 1600], ['wait', 2500], ['scroll', -800], ['wait', 2500]] },
  workshop: { q: { fresh: 1, profile: 'demo:30' }, hash: '#/verse/31', actions: [['untilStep', 'playB'], ['wait', 2000], ['untilStep', 'reward'], ['wait', 3000]] },
  polish: { q: { fresh: 1 }, hash: '#/', setup: "window.__kq.learnUpTo(12, { due: true }); window.__kq.goto('polish')", actions: [['untilItem', 'polish-done'], ['wait', 4000]] },
  necklace: { q: { fresh: 1, profile: 'demo:14' }, hash: '#/necklace', actions: [['click', 'btn-play-all'], ['wait', 12000], ['click', 'btn-play-all']] },
  finale: { q: { fresh: 1, profile: 'demo:51' }, hash: '#/boss/nasyan', actions: [['untilScreen', 'finale'], ['untilScreen', 'prayer'], ['wait', 6000], ['click', 'btn-amen'], ['wait', 7000], ['click', 'btn-next'], ['wait', 8000]] },
};
const list = which === 'all' ? Object.keys(SEGMENTS) : which.split(',');
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const log = [];
for (const name of list) {
  const seg = SEGMENTS[name];
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, locale: 'ar', recordVideo: { dir: path.join(out, name), size: { width: +W, height: +H } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const events = [];
  await page.exposeFunction('__kqEvent', (type, detail) => events.push({ t: (Date.now() - t0) / 1000, type, detail }));
  await page.addInitScript(() => { for (const ty of ['kq:step', 'kq:audio', 'kq:say', 'kq:screen', 'kq:item']) window.addEventListener(ty, (e) => window.__kqEvent(ty, e.detail)); });
  const q = new URLSearchParams({ capture: '1', seed: '42', recitation: String(REC), voices: '1', sfx: '1', motion: '1', ...Object.fromEntries(Object.entries(seg.q).map(([k, v]) => [k, String(v)])) });
  if (seg.q.capture === 0) q.delete('capture');
  if (name === 'intro') q.delete('capture');
  await page.goto(BASE + '?' + q + seg.hash);
  await page.waitForFunction(() => !!window.__kq);
  if (seg.setup) await page.evaluate(seg.setup);
  const st = () => page.evaluate(() => window.__kq.state());
  for (const [a, x] of seg.actions) {
    if (a === 'wait') await page.waitForTimeout(x);
    else if (a === 'click') await page.getByTestId(x).first().click();
    else if (a === 'waitFor') await page.getByTestId(x).waitFor();
    else if (a === 'solve') for (let i = 0; i < x; i++) { await page.evaluate(() => window.__kq.solve()); await page.waitForTimeout(700); }
    else if (a === 'fail') { await page.evaluate(() => window.__kq.fail()); await page.waitForTimeout(900); }
    else if (a === 'help') { await page.getByTestId('help').click(); await page.waitForTimeout(1200); }
    else if (a === 'scroll') { await page.getByTestId('map').evaluate((e, dy) => e.scrollBy({ top: dy, behavior: 'smooth' }), x); }
    else if (a.startsWith('until')) {
      for (let i = 0; i < 400; i++) {
        const s = await st();
        const done = a === 'untilStep' ? s.level?.step === x : a === 'untilItem' ? s.item === x : s.screen === x;
        if (done) break;
        await page.evaluate(() => window.__kq.solve());
        await page.waitForTimeout(650);
      }
    }
  }
  await ctx.close();
  log.push({ segment: name, events });
  console.log(`${name}: ${events.length} events, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
writeFileSync(path.join(out, 'events.json'), JSON.stringify(log, null, 1));
await browser.close();
