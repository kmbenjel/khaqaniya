import { test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { open, kq, state, expect, REPO } from './helpers';

// Capture-mode features for the video (CAPTURE.md): __kq.say, kq:sfx, &timings=, and fresh=1 keeping first-time lines.
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'capture runs at 1280×720/800'));

const events = async (page: any, names: string[]) => page.addInitScript((names: string[]) => {
  (window as any).__ev = []; for (const n of names) window.addEventListener(n, (e: any) => (window as any).__ev.push({ n, d: e.detail, t: performance.now() }));
}, names);
const got = (page: any): Promise<{ n: string; d: any; t: number }[]> => page.evaluate(() => (window as any).__ev);

test('__kq.say: a copy line through the bubble and its voice clip, resolves at the clip end', async ({ page }) => {
  test.setTimeout(120_000);
  // a voice index (no voice files exist yet): joke.14 voiced by a 9.8 s clip
  await page.route('**/data/build.json', async (r) => { const res = await r.fetch(); const j = await res.json(); j.files = [...(j.files || []), 'voice.json']; await r.fulfill({ json: j }); });
  await page.route('**/data/voice.json', (r) => r.fulfill({ json: { 'joke.14': { file: 'audio/v/001.mp3', dur: 9.833 } } }));
  await events(page, ['kq:say', 'kq:say-end', 'kq:audio']);
  const errors = await open(page, { voices: 1, recitation: 0, speed: 1 }, '#/');
  await kq(page, 'learnUpTo', 3);
  await kq(page, 'goto', 'home');                            // a calm screen with a cast bar
  await expect(page.getByTestId('home')).toBeVisible();
  await page.waitForTimeout(4000);                          // the home greeting is over
  const t0 = Date.now();
  const p = kq(page, 'say', 'joke.14', { n: 51 });
  await expect(page.getByTestId('bubble')).toHaveAttribute('data-key', 'joke.14');
  expect(await p).toBe('joke.14');
  const took = Date.now() - t0;
  const ev = await got(page);
  expect(ev.find((e) => e.n === 'kq:say' && e.d.key === 'joke.14')).toBeTruthy();
  expect(ev.find((e) => e.n === 'kq:audio' && e.d.kind === 'voice' && e.d.id === 'joke.14')).toBeTruthy();
  expect(took).toBeGreaterThan(9000);                       // resolved when the clip ended, not at the caption time
  // a screen without a cast bar: the line floats at the bottom, then goes
  await kq(page, 'goto', 'dedication');
  await expect(page.getByTestId('dedication')).toBeVisible();
  for (const k of ['dedication.1', 'finale.medal', 'joke.21']) {
    const q = kq(page, 'say', k);
    await expect(page.locator('.capture-bubble')).toHaveAttribute('data-key', k);
    await q;
  }
  await expect(page.locator('.capture-bubble')).toHaveCount(0);
  const keys = (await got(page)).filter((e) => e.n === 'kq:say').map((e) => e.d.key);
  expect(keys).toEqual(expect.arrayContaining(['dedication.1', 'finale.medal', 'joke.21']));
  expect(errors).toEqual([]);
});

test('kq:sfx: one event per effect, with its name and time (also when the effects switch is off)', async ({ page }) => {
  await events(page, ['kq:sfx']);
  await open(page, { sfx: 0, speed: 25 }, '#/');
  await kq(page, 'goto', 'verse:1');
  for (let i = 0; i < 400; i++) { const s = await state(page); if (s.level?.step === 'playA') break; await kq(page, 'solve', ['g1']); await page.waitForTimeout(20); }
  const ev = await got(page);
  expect(ev.length).toBeGreaterThan(2);
  expect(ev.every((e) => typeof e.d.name === 'string' && typeof e.d.t === 'number' && e.d.muted === true)).toBe(true);
  expect(ev.map((e) => e.d.name)).toEqual(expect.arrayContaining(['whoosh', 'roll']));
  // normal play (no capture): no event
  await page.goto('./?sfx=0&fresh=1#/splash');
  await page.waitForFunction(() => !!(window as any).__kq);
  await page.evaluate(() => { (window as any).__ev = []; });
  await page.getByTestId('btn-start').click();
  await page.waitForTimeout(500);
  expect((await got(page)).filter((e) => e.n === 'kq:sfx')).toEqual([]);
});

test('&timings=: karaoke and echo windows follow the reader durations; other verses keep theirs', async ({ page }) => {
  test.setTimeout(120_000);
  const real = JSON.parse(readFileSync(path.join(REPO, 'audio/timings.json'), 'utf8')).verses as { n: number; dur: number; sadrDur: number; ajzDur: number }[];
  await page.route('**/video/reader-timings.json', (r) => r.fulfill({ json: { source: { reciter: 'reader' }, verses: [{ n: 1, file: 'x.mp3', dur: 7, sadrDur: 3, ajzDur: 4 }] } }));
  await events(page, ['kq:audio']);
  await open(page, { timings: 'reader', recitation: 0, speed: 1 }, '#/');
  expect(await page.evaluate(() => (window as any).__kq.timings())).toEqual({ url: './video/reader-timings.json', verses: [1] });
  await kq(page, 'goto', 'verse:1');
  await kq(page, 'speed', 4);
  await page.waitForFunction(() => (window as any).__ev.filter((e: any) => e.d.kind === 'ajz').length >= 1, null, { timeout: 60_000 });
  const ev = (await got(page)).map((e) => e.d).filter((d) => d.id === 1);
  expect(ev.find((d) => d.kind === 'verse').dur).toBe(7);
  expect(ev.find((d) => d.kind === 'sadr').dur).toBe(3);
  expect(ev.find((d) => d.kind === 'ajz').dur).toBe(4);
  // the echo window after the sadr = max(2.5, 1.1 × 3 s) = 3.3 s (÷ speed 4)
  const all = await got(page);
  const sadr = all.find((e) => e.d.id === 1 && e.d.kind === 'sadr')!, ajz = all.find((e) => e.d.id === 1 && e.d.kind === 'ajz')!;
  const gap = (ajz.t - sadr.t) / 1000;                      // sadr clip (3 s) + window (3.3 s), at speed 4
  expect(gap).toBeGreaterThan((3 + 3.3) / 4 - 0.3);
  expect(gap).toBeLessThan((3 + 3.3) / 4 + 0.6);
  // a verse the file lacks keeps Ghouthani's durations
  expect(await page.evaluate(() => (window as any).__kq.timingOf(2).dur)).toBeCloseTo(real.find((t) => t.n === 2)!.dur, 3);
});

test('fresh=1 at the gate keeps every first-time line (V1 starts the gate chapter from fresh=1)', async ({ page }) => {
  test.setTimeout(120_000);
  await events(page, ['kq:say']);
  await open(page, { speed: 25, motion: 1 }, '#/verse/1');
  for (let i = 0; i < 600; i++) { const s = await state(page); if (await page.getByTestId('name-sheet').count()) break; await kq(page, 'solve', ['reward', 'name-sheet']); await page.waitForTimeout(20); }
  const keys = (await got(page)).map((e) => e.d.key);
  for (const k of ['district.gate.intro', 'level.start.first', 'listen.tip.shatr', 'game.listenPick.how', 'game.rhyme.tip', 'game.rhymeRadar.how', 'game.rhymeRadar.done', 'game.build.how', 'game.recite.how'])
    expect(keys.some((x) => x === k || x.startsWith(k + '.'))).toBe(true);
  await expect(page.getByTestId('name-sheet')).toBeVisible();        // the first pearl asks for a name
  console.log('fresh=1 first-time lines:', keys.join(' '));
});
