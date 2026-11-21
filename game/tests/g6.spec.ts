// G6 polish pass: the bugs found in the debug hunt, one test each (game/QA.md §8).
import { test, type Page } from '@playwright/test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import path from 'node:path';
import { open, kq, state, expect, GAME, Q } from './helpers';
// @ts-expect-error plain JS helper
import { serve } from './serve.mjs';

const phoneOnly = (name: string) => test.skip(name !== 'phone', 'one project: the phone');

async function playUntil(page: Page, done: (s: any) => boolean, skip: string[] = [], max = 3000) {
  for (let i = 0; i < max; i++) {
    const s = await state(page);
    if (done(s)) return s;
    await kq(page, 'solve', skip);
    await page.waitForTimeout(20);
  }
  throw new Error('not reached: ' + JSON.stringify(await state(page)).slice(0, 300));
}

// ── corrupted or old progress in localStorage ───────────────────────────────────────────────────────────────────────
const good = () => ({ v: 1, activeProfile: 'p1', settings: { recitation: false, voices: false, sfx: true, dailyNew: 2 }, profiles: [{ id: 'p1', name: 'أمين', lantern: 'teal', level: 'easy', seed: 7, created: '2026-11-01', days: ['2026-11-01'], verses: { '1': { stars: 2, box: 1, due: '2026-11-02', rung: 1, plays: 1, lapses: 0, weak: {}, last: '2026-11-01' } }, bosses: {}, stickers: { firstPearl: '2026-11-01' } }] });
const BAD: [string, unknown][] = [
  ['not JSON', '{"v":1,"profiles":[{"id":"p1"'],
  ['null', null],
  ['a number', 42],
  ['an array', []],
  ['profiles null', { v: 1, activeProfile: 'p1', settings: null, profiles: null }],
  ['a null profile', { v: 1, activeProfile: 'p1', profiles: [null, { id: 'p2' }] }],
  ['wrong types in a profile', { ...good(), profiles: [{ ...good().profiles[0], days: 'yesterday', verses: null, bosses: [], stickers: 7, seen: { how: null, tips: 'x', jokes: null, lines: {} }, polish: null, medal: null, newToday: 3, level: 'hard', lantern: 12, name: 5 }] }],
  ['a broken verse state', { ...good(), profiles: [{ ...good().profiles[0], verses: { '1': null, '2': { stars: '3' }, '3': { stars: 2, due: 5, weak: null, lapses: 'x' }, foo: { stars: 9 } } }] }],
  ['wrong settings', { ...good(), settings: { recitation: 'yes', textSize: 'xxl', numerals: 3, dailyNew: -4, ai: null } }],
  ['an unknown active player', { ...good(), activeProfile: 'p9' }],
];
for (const [name, value] of BAD) {
  test(`corrupted progress (${name}): the game boots, plays verse 1 and saves a clean store`, async ({ page }, info) => {
    phoneOnly(info.project.name);
    test.setTimeout(120_000);
    await page.addInitScript(([raw]) => { if (!sessionStorage.getItem('g6-seeded')) { sessionStorage.setItem('g6-seeded', '1'); localStorage.setItem('kq.v1', raw as string); } }, [typeof value === 'string' ? value : JSON.stringify(value)]);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(Q({ fresh: 0, seed: 7 }) + '#/');
    await page.waitForFunction(() => !!(window as any).__kq);
    await expect(page.getByTestId('home')).toBeVisible();
    for (const target of ['map', 'necklace', 'stickers', 'heroes', 'grownups', 'home']) { await kq(page, 'goto', target); await page.waitForTimeout(250); }
    await kq(page, 'goto', 'verse:1');
    await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
    const st = await kq(page, 'store');
    expect(st.v).toBe(1);
    expect(Array.isArray(st.profiles) && st.profiles.length >= 1).toBe(true);
    const p = st.profiles.find((x: any) => x.id === st.activeProfile);
    expect(p).toBeTruthy();
    expect(Array.isArray(p.days)).toBe(true);
    expect(p.verses['1'].stars).toBeGreaterThan(0);
    for (const v of Object.values(p.verses) as any[]) { expect(typeof v.stars).toBe('number'); expect(typeof v.due).toBe('string'); expect(typeof v.weak).toBe('object'); }
    // what could be kept was kept (the good player's name and lantern, the verse already won)
    if (name === 'wrong settings' || name === 'an unknown active player') { expect(p.name).toBe('أمين'); expect(p.lantern).toBe('teal'); }
    if (name === 'a broken verse state') expect(p.verses['3'].stars).toBe(2);
    // the unreadable store is kept aside for a grown-up, not silently thrown away
    if (name === 'not JSON') expect(await page.evaluate(() => localStorage.getItem('kq.v1.unreadable'))).toContain('"profiles"');
    expect(errors).toEqual([]);
  });
}

test('unreadable progress that cannot even be set aside: nothing is written over it that session; a reset clears the aside copy', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(120_000);
  const raw = '{"v":1,"profiles":[{"id":"p1","name":"x"';   // cut short
  await page.addInitScript(([raw]) => {
    if (!sessionStorage.getItem('g6-seeded')) { sessionStorage.setItem('g6-seeded', '1'); localStorage.setItem('kq.v1', raw as string); localStorage.removeItem('kq.v1.unreadable'); }
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) { if (k === 'kq.v1.unreadable' && !(window as any).__allowAside) throw new DOMException('full', 'QuotaExceededError'); return set.call(this, k, v); };
  }, [raw]);
  const errors = await open(page, { fresh: 0, seed: 7 });
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
  expect((await state(page)).learned).toBe(1);                                         // played from memory
  expect(await page.evaluate(() => localStorage.getItem('kq.v1'))).toBe(raw);          // the old progress untouched
  // a grown-up's reset (or fresh=1): the aside copy is removed and saving resumes
  await page.evaluate(() => { (window as any).__allowAside = true; localStorage.setItem('kq.v1.unreadable', 'old'); (window as any).__kq.reset(7); });
  expect(await page.evaluate(() => localStorage.getItem('kq.v1.unreadable'))).toBeNull();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('kq.v1')))!).v).toBe(1);
  expect(errors).toEqual([]);
});

// ── a session that crosses midnight ─────────────────────────────────────────────────────────────────────────────────
test('midnight: a session across 00:00 counts a new day, the «see you tomorrow» card and the parents\' lamps follow', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(300_000);
  await page.clock.setFixedTime(new Date('2026-11-20T23:50:00'));
  const errors = await open(page, { speed: 25 });
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
  expect((await state(page)).today).toBe('2026-11-20');
  // pearl 2 after midnight: the first new pearl of the new day (no card: the suggestion is 2 a day)
  await page.clock.setFixedTime(new Date('2026-11-21T00:05:00'));
  await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.verse === 2 && (s.item === 'reward' || s.item === 'tomorrow'), ['reward', 'tomorrow']);
  let s = await state(page);
  expect(s.today).toBe('2026-11-21');
  expect(s.item).toBe('reward');
  expect(s.profile.days).toEqual(['2026-11-20', '2026-11-21']);
  expect(s.profile.newToday).toEqual({ date: '2026-11-21', count: 1 });
  // pearl 3 meets the day's suggestion: the card, with today's pearls and verse 1 (due today) for tomorrow
  await kq(page, 'goto', 'verse:3');
  await playUntil(page, (s) => s.level?.verse === 3 && (s.item === 'reward' || s.item === 'tomorrow'), ['reward', 'tomorrow']);
  s = await state(page);
  expect(s.item).toBe('tomorrow');
  await expect(page.getByTestId('tomorrow-polish')).toHaveAttribute('data-n', '3');
  await page.getByTestId('tomorrow-ok').click();
  // the grown-ups' corner: 2 days, the last two lamps lit (today first)
  await kq(page, 'goto', 'grownups');
  await expect(page.getByTestId('grown-progress')).toBeVisible();
  const lamps = await page.locator('[data-testid=grown-progress] .lamp').evaluateAll((ls) => ls.map((l) => l.classList.contains('on')));
  expect(lamps.slice(0, 3)).toEqual([true, true, false]);
  // home the next morning: verse 1 is due (polish), today's lamp waits
  await page.clock.setFixedTime(new Date('2026-11-22T08:00:00'));
  await kq(page, 'goto', 'home');
  await expect(page.getByTestId('home')).toBeVisible();
  expect((await state(page)).today).toBe('2026-11-22');
  expect(errors).toEqual([]);
});

// ── the service worker's update flow: an old version open when a new one is deployed ─────────────────────────────────
/** A copy of the build on its own server, with a proxy in front that can hold the game's page (lie-fi). */
async function stage() {
  const root = mkdtempSync(path.join(tmpdir(), 'kq-update-'));
  const dir = path.join(root, 'khaqaniya');
  cpSync(path.join(GAME, 'dist'), dir, { recursive: true, dereference: true });
  const { server, port } = await serve(root, 0);
  const s = { stallMs: 0, stalled: 0 };
  const proxy = createServer(async (req, res) => {
    const u = new URL(req.url || '/', 'http://x');
    if (s.stallMs && u.pathname === '/khaqaniya/') { s.stalled++; await new Promise((r) => setTimeout(r, s.stallMs)); }
    try {
      const r = await fetch(`http://127.0.0.1:${port}` + req.url, { headers: req.headers.range ? { range: String(req.headers.range) } : {}, redirect: 'manual' });
      const h: Record<string, string> = {};
      r.headers.forEach((v, k) => { if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(k)) h[k] = v; });
      res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
    } catch { res.destroy(); }
  });
  await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(proxy.address() as { port: number }).port}/khaqaniya/`;
  /** Deploys «v2»: a new bundle that marks the window, named in index.html and in the worker's precache, a new version;
   *  `broken`: its worker's precache names a file that does not exist (its install fails). */
  const deploy = (broken = false) => {
    const assets = path.join(dir, 'assets');
    const js = readdirSync(assets).find((f) => /^index-.*\.js$/.test(f))!;
    const js2 = js.replace(/\.js$/, 'v2.js');
    writeFileSync(path.join(assets, js2), readFileSync(path.join(assets, js), 'utf8') + '\n;window.__kqV2 = true;\n');
    rmSync(path.join(assets, js));
    writeFileSync(path.join(dir, 'index.html'), readFileSync(path.join(dir, 'index.html'), 'utf8').replace(js, js2));
    const sw = readFileSync(path.join(dir, 'sw.js'), 'utf8');
    const v1 = /const VERSION = '([0-9a-f]+)'/.exec(sw)![1];
    let sw2 = sw.replace(`const VERSION = '${v1}'`, `const VERSION = '${v1}2'`).replace(js, js2);
    if (broken) sw2 = sw2.replace('const PRECACHE = [', 'const PRECACHE = ["./assets/missing-v2.js",');
    writeFileSync(path.join(dir, 'sw.js'), sw2);
  };
  const close = () => { proxy.closeAllConnections?.(); proxy.close(); server.close(); rmSync(root, { recursive: true, force: true }); };
  return { base, s, deploy, close };
}
async function controlled(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
}
const isV2 = (page: Page) => page.evaluate(() => (window as any).__kqV2 === true);

test('update: a new version installs over the old one; the open app moves to it at the next calm screen, through the splash; then works offline', async ({ page, context }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(300_000);
  const st = await stage();
  try {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await controlled(page, st.base + Q({ capture: 0, fresh: 0, speed: 25 }) + '#/');
    await page.getByTestId('btn-start').click();
    await page.getByTestId('btn-skip').click({ timeout: 5000 }).catch(() => {});   // the story may end by itself first
    await page.waitForFunction(() => (window as any).__kq?.state().screen === 'verse');
    const oldShell = (await page.evaluate(() => caches.keys())).find((k: string) => k.startsWith('kq-game-shell-'))!;
    st.deploy();
    // mid-level the update installs and takes over, but the level is not interrupted
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r!.update(); });
    await page.waitForFunction((old) => caches.keys().then((ks) => !ks.includes(old) && ks.some((k) => k.startsWith('kq-game-shell-'))), oldShell, { timeout: 60_000 });
    await page.waitForTimeout(500);
    expect(await isV2(page)).toBe(false);
    expect((await state(page)).screen).toBe('verse');
    expect((await state(page)).updateReady).toBe(true);
    await kq(page, 'solve');
    // the next calm screen (the map) is the new version, reached through the splash: its tap unlocks audio (iOS)
    await kq(page, 'goto', 'map');
    await page.waitForFunction(() => (window as any).__kqV2 === true && (window as any).__kq?.state().screen === 'splash', null, { timeout: 30_000 });
    await page.getByTestId('btn-start').click();
    await page.waitForFunction(() => (window as any).__kq?.state().screen === 'map', null, { timeout: 30_000 });
    expect(await page.evaluate(() => location.hash)).toBe('#/map');
    // offline the new version boots (same session: no splash)
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
    expect(await isV2(page)).toBe(true);
    await expect(page.getByTestId('map')).toBeVisible();
    await context.setOffline(false);
    expect(errors.filter((e) => !/Failed to load resource|net::/.test(e))).toEqual([]);
  } finally { st.close(); }
});

test('update with progress held in memory only (storage failing): no reload, nothing lost', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(300_000);
  const st = await stage();
  try {
    await controlled(page, st.base + Q({ capture: 0, fresh: 0, speed: 25 }) + '#/');
    // from now on every write of the progress fails (quota): the game plays from memory
    await page.addInitScript(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k: string, v: string) { if (k === 'kq.v1') throw new DOMException('full', 'QuotaExceededError'); return set.call(this, k, v); }; });
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__kq && !!navigator.serviceWorker.controller);
    await page.getByTestId('btn-start').click();
    await kq(page, 'goto', 'verse:1');
    await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
    expect((await state(page)).learned).toBe(1);
    st.deploy();
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r!.update(); });
    await page.waitForFunction(() => (window as any).__kq.state().updateReady === true, null, { timeout: 60_000 });
    await kq(page, 'goto', 'map');
    await expect(page.getByTestId('map')).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await isV2(page)).toBe(false);                 // not reloaded
    expect((await state(page)).learned).toBe(1);          // the pearl held in memory is still there
  } finally { st.close(); }
});

test('lie-fi during a broken deploy: the newer page never lands in the older version\'s shell; offline boots the old version', async ({ page, context }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(300_000);
  const st = await stage();
  try {
    await controlled(page, st.base + Q({ fresh: 0, speed: 25 }) + '#/');
    st.deploy(true);              // v2's page and bundle are on the server, its worker cannot install
    st.s.stallMs = 4500;          // the v2 page arrives after the worker's 3 s: the cached v1 shell is served
    await page.goto(st.base + Q({ fresh: 0, speed: 25, n: 2 }) + '#/', { timeout: 60_000 });
    await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
    expect(await isV2(page)).toBe(false);
    await page.waitForTimeout(4000);                      // the late v2 page has arrived at the worker by now
    expect(st.s.stalled).toBeGreaterThan(0);
    // v2's install has run and failed (nothing installing or waiting), v1 still in control
    await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then((r) => !r?.waiting && !r?.installing && !!r?.active), null, { timeout: 60_000 });
    st.s.stallMs = 0;
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
    await expect(page.getByTestId('home')).toBeVisible();
    expect(await isV2(page)).toBe(false);
    await context.setOffline(false);
  } finally { st.close(); }
});

// ── the offline shell: only the game's own page, and a slow network falls back to it ───────────────────────────────
test('offline shell: a 404 for a mistyped link never replaces it; on a stalled network the cached game opens in seconds', async ({ page, context }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(180_000);
  // a proxy in front of the test server that can stall the game's page (lie-fi), on its own origin (its own worker)
  const up = `http://127.0.0.1:${process.env.KQ_PORT || '4321'}`;
  let stall = false, stalled = 0;
  const proxy = createServer(async (req, res) => {
    const u = new URL(req.url || '/', 'http://x');
    if (stall && u.pathname === '/khaqaniya/') { stalled++; await new Promise((r) => setTimeout(r, 20_000)); }
    try {
      const r = await fetch(up + req.url, { headers: req.headers.range ? { range: String(req.headers.range) } : {}, redirect: 'manual' });
      const h: Record<string, string> = {};
      r.headers.forEach((v, k) => { if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(k)) h[k] = v; });
      res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
    } catch { res.destroy(); }
  });
  await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(proxy.address() as { port: number }).port}/khaqaniya/`;
  try {
    await page.goto(base + Q() + '#/');
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
    // a mistyped link inside the game's scope: the server's 404 (it used to become the offline shell)
    const r = await page.goto(base + 'nope/');
    expect(r?.status()).toBe(404);
    await context.setOffline(true);
    await page.goto(base + Q({ fresh: 0 }) + '#/');
    await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
    await expect(page.getByTestId('home')).toBeVisible();
    await context.setOffline(false);
    // lie-fi: the network answers the page after 20 s; the cached shell is served after 3 s
    stall = true;
    const t0 = Date.now();
    await page.goto(base + Q({ fresh: 0, stalled: 1 }) + '#/', { timeout: 60_000 });   // another URL: a real load, not a hash jump
    await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
    await expect(page.getByTestId('home')).toBeVisible();
    const ms = Date.now() - t0;
    console.log('stalled navigation answered in', ms, 'ms; stalled requests', stalled);
    expect(stalled).toBeGreaterThan(0);
    expect(ms).toBeLessThan(9000);
  } finally { stall = false; proxy.closeAllConnections?.(); proxy.close(); }
});

// ── small phones: the end-of-screen buttons are never left below the fold ──────────────────────────────────────────
test('360×740: the first reward with its sticker banners brings «next» into view (it was hidden under the caption)', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 360, height: 740 });
  const errors = await open(page, { speed: 25 });
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
  await expect(page.getByTestId('new-sticker').first()).toBeVisible();
  const next = page.locator('.reward-btns [data-testid=btn-next]');
  await expect(next).toBeVisible();
  // fully inside the scrolling stage's visible box, and above the cast bar
  await expect.poll(() => page.evaluate(() => {
    const b = document.querySelector('.reward-btns [data-testid=btn-next]')!.getBoundingClientRect();
    const st = document.querySelector('.frame .stage')!.getBoundingClientRect();
    const bar = document.querySelector('.frame .castbar')!.getBoundingClientRect();
    return b.top >= st.top - 1 && b.bottom <= st.bottom + 1 && b.bottom <= bar.top + 1;
  }), { timeout: 5000 }).toBe(true);
  expect(errors).toEqual([]);
});

test('necklace on phones: the thread runs through every line of a wrapped district; «read the poem» is a 56 px target', async ({ page }, info) => {
  phoneOnly(info.project.name);
  for (const w of [360, 390, 412]) {
    await page.setViewportSize({ width: w, height: 800 });
    await open(page, { speed: 25 });
    await kq(page, 'learnUpTo', 12);
    await kq(page, 'goto', 'necklace');
    await expect(page.getByTestId('necklace')).toBeVisible();
    const r = await page.evaluate(() => [...document.querySelectorAll('.pearl-row')].map((row) => {
      const top = row.getBoundingClientRect().top;
      const lines = new Set([...row.querySelectorAll('.pearl-btn')].map((b) => Math.round(b.getBoundingClientRect().top - top)));
      // the band of the thread, as drawn: 33..39 px in every 64 px; each line's middle must fall in it
      const mids = [...row.querySelectorAll('.pearl-btn')].map((b) => { const x = b.getBoundingClientRect(); return Math.round(x.top + x.height / 2 - top) % 64; });
      return { lines: lines.size, ok: mids.every((m) => m >= 33 && m <= 39) };
    }));
    expect(r.some((x) => x.lines > 1), `a district wraps at ${w}px`).toBe(true);
    expect(r.every((x) => x.ok), `thread through each line at ${w}px: ${JSON.stringify(r)}`).toBe(true);
    const link = await page.getByTestId('read-poem').boundingBox();
    expect(link!.height).toBeGreaterThanOrEqual(56);
  }
});
