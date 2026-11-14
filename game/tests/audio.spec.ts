// G5: nothing plays in the background (the owner once heard a verse's voice playing in the background, 2026-11-14).
// Every media element the game plays is recorded; at most one may ever be unpaused, and none after leaving a screen.
// Scenarios: a slow network (clips that start late), the page hidden mid-clip, rapid navigation mid-clip, a tap on the
// ear while a character speaks, and the browser's own media-session «play» (lock screen, headset) off the necklace.
import { test, expect, type Page } from '@playwright/test';
import { open, kq } from './helpers';

// route interception does not see requests a service worker answers
test.use({ serviceWorkers: 'block' });
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'one project is enough'));

/** Records every media element, the most ever unpaused at once (with where and why), each 'playing' start, the
 *  media-session handlers, and gives `uaPlay()` (what the browser does on a lock-screen «play») and `hide(bool)`. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const M: any = ((window as any).__media = { els: [], max: 0, peaks: [], starts: [], handlers: {}, last: null });
    const unpaused = () => (M.els as HTMLMediaElement[]).filter((e) => !e.paused);
    M.unpaused = () => unpaused().map((e) => e.getAttribute('src') || '(no src)');
    M.playing = () => (M.els as HTMLMediaElement[]).filter((e) => !e.paused && e.readyState > 2).map((e) => e.getAttribute('src'));
    const check = (why: string) => {
      const u = unpaused();
      if (u.length > M.max) { M.max = u.length; M.peaks.push({ why, srcs: u.map((e) => e.getAttribute('src')), hash: location.hash, t: Math.round(performance.now()) }); }
    };
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!M.els.includes(this)) {
        M.els.push(this);
        this.addEventListener('playing', () => { M.starts.push({ src: this.getAttribute('src'), hash: location.hash, t: Math.round(performance.now()) }); check('playing'); });
      }
      M.last = this;
      const r = orig.call(this);
      check('play');
      return r;
    };
    setInterval(() => check('tick'), 20);
    if ('mediaSession' in navigator) {
      const ms = navigator.mediaSession;
      const set = ms.setActionHandler.bind(ms);
      ms.setActionHandler = (a: MediaSessionAction, f: MediaSessionActionHandler | null) => { M.handlers[a] = f; try { set(a, f); } catch { /* */ } };
    }
    // the browser's «play» (lock screen, notification, headset): the page's handler, else it resumes the page's last media
    M.uaPlay = () => {
      const f = M.handlers.play;
      if (f) { f({ action: 'play' }); return 'handler'; }
      if (M.last && M.last.paused && M.last.getAttribute('src')) { M.last.play().catch(() => {}); return 'default'; }
      return 'none';
    };
    M.hide = (hidden: boolean) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
      document.dispatchEvent(new Event('visibilitychange'));
      if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    };
  });
}
const media = (page: Page) => page.evaluate(() => { const M = (window as any).__media; return { max: M.max, peaks: M.peaks, starts: M.starts, unpaused: M.unpaused(), playing: M.playing(), state: navigator.mediaSession?.playbackState }; });
const nowMs = (page: Page) => page.evaluate(() => Math.round(performance.now()));
/** Waits until a clip really sounds (playing with data). */
const sounding = (page: Page, timeout = 30_000) => page.waitForFunction(() => (window as any).__media.playing().length > 0, null, { timeout });
const hash = (page: Page, hsh: string) => page.evaluate((x) => { location.hash = x; }, hsh);

test('slow network: a clip that starts late never plays over the next one, nor after leaving', async ({ page }) => {
  test.setTimeout(150_000);
  await instrument(page);
  // every reciter clip answers 16 s late (longer than any clip plus the old 2.5 s safety margin)
  await page.route(/\/audio\/[vh]\/.*\.mp3/, async (route) => { await new Promise((r) => setTimeout(r, 16_000)); await route.continue().catch(() => {}); });
  const errors = await open(page, { recitation: 1, voices: 0, speed: 4 }, '#/verse/1');
  await page.waitForTimeout(40_000);
  const during = await media(page);
  await hash(page, '#/stickers');
  const left = await nowMs(page);
  await page.waitForTimeout(20_000);   // every pending response arrives meanwhile
  const after = await media(page);
  console.log('slow network:', JSON.stringify({ max: after.max, peaks: after.peaks.slice(0, 3), starts: after.starts.length }));
  expect(during.max, 'two clips unpaused at once: ' + JSON.stringify(during.peaks)).toBeLessThanOrEqual(1);
  expect(after.max).toBeLessThanOrEqual(1);
  expect(after.unpaused, 'still unpaused after leaving the level').toEqual([]);
  expect(after.starts.filter((s: { t: number }) => s.t > left), 'a clip started after leaving the level').toEqual([]);
  expect(errors).toEqual([]);
});

test('hidden page: the level falls silent and waits; listen-all keeps playing (screen off, §4.10)', async ({ page }) => {
  test.setTimeout(150_000);
  await instrument(page);
  const errors = await open(page, { recitation: 1, voices: 0, speed: 4 }, '#/verse/1');
  await sounding(page);
  await page.evaluate(() => (window as any).__media.hide(true));
  await page.waitForTimeout(400);
  expect((await media(page)).unpaused, 'a level clip kept playing with the page hidden').toEqual([]);
  const hidAt = await nowMs(page);
  await page.waitForTimeout(8_000);
  const hidden = await media(page);
  expect(hidden.unpaused).toEqual([]);
  expect(hidden.starts.filter((s: { t: number }) => s.t > hidAt), 'a clip started while hidden').toEqual([]);
  // back in front: the level goes on with sound
  await page.evaluate(() => (window as any).__media.hide(false));
  await page.waitForFunction((t) => (window as any).__media.starts.some((s: { t: number }) => s.t > t), hidAt, { timeout: 30_000 });

  // the necklace's «listen to all» is meant for the screen off: it keeps playing, verse after verse
  await kq(page, 'learnUpTo', 3);
  await kq(page, 'goto', 'necklace');
  await page.getByTestId('btn-play-all').click();
  await sounding(page);
  const n0 = (await media(page)).starts.length;
  await page.evaluate(() => (window as any).__media.hide(true));
  await page.waitForTimeout(1_000);
  expect((await media(page)).playing.length, 'listen-all stopped when the screen went off').toBe(1);
  await page.waitForFunction((n) => (window as any).__media.starts.length > n, n0, { timeout: 30_000 });   // the next verse, still hidden
  // the lock screen's «pause» holds it, and its «play» goes on
  await page.evaluate(() => (window as any).__media.handlers.pause?.({ action: 'pause' }));
  await page.waitForTimeout(300);
  expect((await media(page)).unpaused).toEqual([]);
  expect(await page.evaluate(() => (window as any).__media.uaPlay())).toBe('handler');
  await sounding(page);
  await page.evaluate(() => (window as any).__media.hide(false));
  const end = await media(page);
  expect(end.max, JSON.stringify(end.peaks)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('rapid navigation and taps mid-clip: one clip at a time, nothing after leaving', async ({ page }) => {
  test.setTimeout(150_000);
  await instrument(page);
  const errors = await open(page, { recitation: 1, voices: 1, speed: 2 }, '#/');
  await kq(page, 'learnUpTo', 4);
  // a character is speaking (a long line, 13 s) when the child taps the ear: the verse starts, the line gives way
  await kq(page, 'goto', 'verse:2');
  await page.waitForFunction(() => (window as any).__kq.state().level?.step === 'listen', null, { timeout: 30_000 });
  await sounding(page);   // the verse; then, in a gap between clips, the line starts
  await page.waitForFunction(() => {
    if ((window as any).__media.unpaused().length) return false;
    void (window as any).__kq.say('lahn.kinds').catch(() => {});
    return true;
  }, null, { timeout: 30_000, polling: 20 });
  await page.waitForFunction(() => {
    const M = (window as any).__media;
    if (!M.playing().some((s: string) => /voice\//.test(s))) return false;
    (document.querySelector('[data-testid=ear]') as HTMLElement).click();
    return true;
  }, null, { timeout: 30_000 });
  await page.waitForTimeout(1_500);
  const mid = await media(page);
  expect(mid.max, 'voice and verse together: ' + JSON.stringify(mid.peaks)).toBeLessThanOrEqual(1);
  expect(mid.playing.some((s: string) => /audio\/v\//.test(s)), 'the verse did not start').toBe(true);
  // a child hopping between screens while clips start
  const hops = ['#/verse/1', '#/map', '#/verse/3', '#/necklace', '#/verse/2', '#/', '#/verse/4', '#/necklace', '#/polish', '#/verse/1'];
  for (const [i, x] of hops.entries()) {
    await hash(page, x);
    if (x === '#/necklace') await page.getByTestId('btn-play-all').click().catch(() => {});
    else if (x.startsWith('#/verse')) await page.getByTestId('ear').click({ timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(300 + ((i * 397) % 900));
  }
  await sounding(page).catch(() => {});
  await hash(page, '#/stickers');
  const left = await nowMs(page);
  await page.waitForTimeout(4_000);
  const end = await media(page);
  console.log('rapid:', JSON.stringify({ max: end.max, peaks: end.peaks, starts: end.starts.length }));
  expect(end.max, JSON.stringify(end.peaks)).toBeLessThanOrEqual(1);
  expect(end.unpaused).toEqual([]);
  expect(end.starts.filter((s: { t: number }) => s.t > left)).toEqual([]);
  expect(errors).toEqual([]);
});

test('media session: the browser\'s «play» off the necklace resumes nothing', async ({ page }) => {
  test.setTimeout(120_000);
  await instrument(page);
  const errors = await open(page, { recitation: 1, voices: 0, speed: 4 }, '#/');
  await kq(page, 'learnUpTo', 3);
  // the necklace sets its handlers and clears them on leaving
  await kq(page, 'goto', 'necklace');
  await page.getByTestId('btn-play-all').click();
  await sounding(page);
  // a level clip, then away from the level
  await kq(page, 'goto', 'verse:2');
  await sounding(page);
  await kq(page, 'goto', 'stickers');
  await page.waitForTimeout(500);
  expect((await media(page)).unpaused).toEqual([]);
  const at = await nowMs(page);
  const how = await page.evaluate(() => (window as any).__media.uaPlay());
  await page.waitForTimeout(2_000);
  const m = await media(page);
  console.log('media session play off the necklace →', how, JSON.stringify(m.unpaused));
  expect(m.unpaused, 'the lock-screen «play» resumed a clip on ' + how).toEqual([]);
  expect(m.starts.filter((s: { t: number }) => s.t > at)).toEqual([]);
  expect(m.state === 'playing').toBe(false);
  // on a level: a headset «pause» holds the clip (the level waits, playbackState says paused), its «play» resumes it
  await kq(page, 'goto', 'verse:1');
  await sounding(page);
  const paused = await page.evaluate(() => { const M = (window as any).__media; const src = M.playing()[0]; M.handlers.pause?.({ action: 'pause' }); return src; });
  await page.waitForTimeout(200);
  const m1 = await media(page);
  expect(m1.unpaused, 'the «pause» action left a clip playing').toEqual([]);
  expect(m1.state).toBe('paused');
  const at2 = await nowMs(page);
  await page.waitForTimeout(1_500);
  expect((await media(page)).starts.filter((s: { t: number }) => s.t > at2), 'the level went on during a pause').toEqual([]);
  expect(await page.evaluate(() => (window as any).__media.uaPlay())).toBe('handler');
  await sounding(page);
  const m2 = await media(page);
  expect(m2.playing).toEqual([paused]);
  expect(m2.state).toBe('playing');
  expect(m2.max, JSON.stringify(m2.peaks)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
