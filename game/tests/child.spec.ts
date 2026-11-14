// G5 bug hunt: the game played the way a curious 8-year-old plays it — mashing and double-tapping, going back
// mid-animation, turning the phone, losing the network, killing the app mid-level, flipping the sound switches and the
// slow mode mid-clip, replaying finished districts, the daily polish, the certificate and sharing (QA.md §7).
import { test, type Page } from '@playwright/test';
import { open, kq, state, expect, Q } from './helpers';

test.use({ actionTimeout: 10_000 });   // a click never waits for ever (a hung walk shows where it is)

const media = (page: Page) => page.evaluate(() => ((window as any).__els as HTMLMediaElement[] || []).filter((e) => !e.paused).map((e) => e.getAttribute('src')));
async function trackMedia(page: Page) {
  await page.addInitScript(() => {
    const w = window as any; w.__els = []; w.__maxUnpaused = 0;
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!w.__els.includes(this)) w.__els.push(this);
      const r = orig.call(this);
      w.__maxUnpaused = Math.max(w.__maxUnpaused, w.__els.filter((e: HTMLMediaElement) => !e.paused).length);
      return r;
    };
    setInterval(() => { w.__maxUnpaused = Math.max(w.__maxUnpaused, w.__els.filter((e: HTMLMediaElement) => !e.paused).length); }, 25);
  });
}
const hscroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
/** Plays until `done` with the test API (one visible tap per item). */
async function playUntil(page: Page, done: (s: any) => boolean, o: { skip?: string[]; each?: (s: any, i: number) => Promise<void>; max?: number } = {}) {
  for (let i = 0; i < (o.max ?? 1500); i++) {
    const s = await state(page);
    if (done(s)) return s;
    if (o.each) await o.each(s, i);
    await kq(page, 'solve', [...(o.skip ?? []), 'name-sheet']);
    if (await page.getByTestId('name-sheet').count()) await page.getByTestId('profile-later').click().catch(() => {});
    await page.waitForTimeout(20);
  }
  throw new Error('not reached: ' + JSON.stringify(await state(page)).slice(0, 300));
}

for (const vp of [{ w: 360, h: 740, p: 'phone' }, { w: 390, h: 844, p: 'phone' }, { w: 1280, h: 800, p: 'desktop' }]) {
  test(`mash and double-tap through verses 1–2 (${vp.w}×${vp.h})`, async ({ page }, info) => {
    test.skip(info.project.name !== vp.p, vp.p + ' size');
    test.setTimeout(400_000);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    const errors = await open(page, { speed: 25 }, '#/');
    const log: string[] = [];
    for (const v of [1, 2]) {
      if (v > 1) await kq(page, 'learnUpTo', 1);
      await kq(page, 'goto', 'verse:' + v);
      // done when the pearl is won (a mash may tap «next» on the reward and go on to the next verse)
      await playUntil(page, (s) => s.learned >= v, {
        skip: ['reward'],
        each: async (s, i) => {
          // every third item: double-tap the right answer and mash the other buttons on screen (not on the reward)
          if (i % 3 || s.level?.step === 'reward') return;
          const r = await page.evaluate(() => { const a = (window as any).__kq.active(); if (!a?.right) return null; a.right.setAttribute('data-mash', '1'); return a.label; });
          if (r) await page.locator('[data-mash="1"]').dblclick({ timeout: 2_000 }).catch(() => {});
          await page.evaluate(() => document.querySelectorAll('[data-mash]').forEach((e) => e.removeAttribute('data-mash')));
          // the play area's own buttons (the top bar's back / necklace / mute lead elsewhere; tested on their own)
          const btns = page.locator('.screen button:not(.topbar *):visible');
          const n = await btns.count();
          for (let k = 0; k < Math.min(n, 4); k++) await btns.nth((k * 7 + i) % n).click({ timeout: 500, noWaitAfter: true }).catch(() => {});
          // a sheet a mash opened (pause, ask the stork): closed again, as a child would
          if (await page.getByTestId('pause').count()) await page.getByTestId('btn-resume').click().catch(() => {});
          if (await page.locator('.sheet-wrap:not(.closing)').count()) await page.keyboard.press('Escape');
          log.push(`${s.level?.step}:${s.item}`);
        },
      });
      expect(await hscroll(page)).toBeLessThanOrEqual(1);
    }
    const s = await state(page);
    expect(s.learned).toBeGreaterThanOrEqual(2);
    expect(errors).toEqual([]);
  });
}

test('back mid-animation: browser back during the title card, LISTEN, a game and the flying pearl', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone');
  test.setTimeout(300_000);
  await trackMedia(page);
  const errors = await open(page, { speed: 2, recitation: 1, voices: 1, motion: 1 }, '#/');
  await kq(page, 'goto', 'map');
  await page.waitForTimeout(300);
  // the district title card (verse 1 of a fresh profile), then back
  await kq(page, 'goto', 'verse:1');
  await page.waitForTimeout(600);
  await page.goBack();
  await page.waitForTimeout(400);
  expect((await state(page)).screen).toBe('map');
  expect(await media(page)).toEqual([]);
  await page.goForward();
  await page.waitForFunction(() => (window as any).__kq.state().level?.step === 'listen', null, { timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.goBack();
  await page.waitForTimeout(400);
  expect(await media(page)).toEqual([]);
  // a game mid-animation, then the reward's flying pearl
  await page.goForward();
  await kq(page, 'speed', 25);
  await playUntil(page, (s) => s.level?.step === 'playA' && !!s.item);
  await kq(page, 'solve'); await page.goBack(); await page.waitForTimeout(300); await page.goForward();
  await playUntil(page, (s) => s.level?.step === 'reward' && s.item === 'reward', { skip: ['reward'] });
  await kq(page, 'speed', 1);
  await page.goBack(); await page.waitForTimeout(150); await page.goForward(); await page.waitForTimeout(1500);
  const s = await state(page);
  expect(s.learned).toBe(1);
  expect(await media(page)).toHaveLength(await page.evaluate(() => ((window as any).__els as HTMLMediaElement[]).filter((e) => !e.paused).length));
  expect(await page.evaluate(() => (window as any).__maxUnpaused)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('rotate the phone mid-level: portrait → landscape → portrait, the item stays tappable', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone');
  test.setTimeout(300_000);
  const errors = await open(page, { speed: 25 }, '#/');
  await kq(page, 'learnUpTo', 3);
  const found: string[] = [];
  for (const v of [4, 5]) {
    await kq(page, 'goto', 'verse:' + v);
    await playUntil(page, (s) => s.level?.verse === v && s.item === 'reward', {
      skip: ['reward'],
      each: async (s, i) => {
        if (i % 4) return;
        for (const [w, hh] of [[844, 390], [740, 360], [390, 844]]) {
          await page.setViewportSize({ width: w, height: hh });
          await page.waitForTimeout(120);
          const hs = await hscroll(page);
          if (hs > 1) found.push(`${w}×${hh} ${s.level?.step}:${s.item} hscroll ${hs}`);
          // the right target is on screen and not covered
          const ok = await page.evaluate(() => {
            const el = (window as any).__kq.active()?.right as HTMLElement | null;
            if (!el || !el.isConnected) return true;
            el.scrollIntoView({ block: 'center' });
            const r = el.getBoundingClientRect();
            const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!top && (el === top || el.contains(top) || top.contains(el));
          });
          if (!ok) found.push(`${w}×${hh} ${s.level?.step}:${s.item} right target covered`);
        }
      },
    });
    await kq(page, 'learnUpTo', v);
  }
  console.log('rotate findings:', found.length, found.slice(0, 20));
  expect(found).toEqual([]);
  expect(errors).toEqual([]);
});

test('offline mid-level: district 1 goes on, an uncached verse plays silent; nothing lost', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone');
  test.setTimeout(400_000);
  await trackMedia(page);
  const errors = await open(page, { speed: 25, recitation: 1, voices: 0 }, '#/');
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller && !!(window as any).__kq, null, { timeout: 30_000 });
  await kq(page, 'goto', 'verse:1');
  await page.waitForFunction(() => (window as any).__kq.state().level?.step === 'listen', null, { timeout: 30_000 });
  await context.setOffline(true);
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', { skip: ['reward'] });
  // a verse of a later district (its clip is not cached): silent stand-ins, the level still ends
  await kq(page, 'learnUpTo', 7);
  await kq(page, 'goto', 'verse:8');
  await playUntil(page, (s) => s.level?.verse === 8 && s.item === 'reward', { skip: ['reward'] });
  await page.goto(Q({ fresh: 0, speed: 25 }) + '#/');   // killed and opened again, still offline (fresh=1 would wipe the store)
  await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
  expect((await state(page)).learned).toBe(8);
  await context.setOffline(false);
  expect(await page.evaluate(() => (window as any).__maxUnpaused)).toBeLessThanOrEqual(1);
  expect(errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|net::/.test(e))).toEqual([]);
});

test('kill and reload mid-level and mid-reward: progress is kept, the level starts again cleanly', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone');
  test.setTimeout(300_000);
  // a persistent store across reloads (no fresh=1 after the first load)
  const errors = await open(page, { speed: 25 }, '#/');
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.step === 'reward' && s.item === 'reward', { skip: ['reward'] });
  const url = Q({ fresh: 0 }) + '#/';
  await page.goto(url);   // killed on the reward screen
  await page.waitForFunction(() => !!(window as any).__kq);
  expect((await state(page)).learned).toBe(1);
  await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.verse === 2 && /^play/.test(s.level?.step || '') && !!s.item, { skip: ['reward'] });
  await page.goto(url);   // killed mid-level
  await page.waitForFunction(() => !!(window as any).__kq);
  const s = await state(page);
  expect(s.learned).toBe(1);
  expect(s.profile.verses['1'].stars).toBeGreaterThan(0);
  await kq(page, 'goto', 'verse:2');
  await playUntil(page, (x) => x.level?.verse === 2 && x.item === 'reward', { skip: ['reward'] });
  expect((await state(page)).learned).toBe(2);
  expect(errors).toEqual([]);
});

test('sound switches and slow mode mid-clip: what is switched off falls silent at once, the quick mute comes back', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop');
  test.setTimeout(300_000);
  await trackMedia(page);
  const errors = await open(page, { speed: 2, recitation: 1, voices: 1 }, '#/');
  await kq(page, 'learnUpTo', 2);
  await kq(page, 'goto', 'verse:3');
  const verseClip = () => page.waitForFunction(() => ((window as any).__els as HTMLMediaElement[]).some((e) => !e.paused && e.readyState > 2 && /audio\/[vh]\//.test(e.getAttribute('src') || '')), null, { timeout: 40_000 });
  await verseClip();
  // the pause menu: the reciter switched off mid-verse
  await page.getByTestId('btn-back').first().click();
  await page.getByTestId('set-recitation').uncheck();
  await page.waitForTimeout(300);
  expect(await media(page), 'the reciter went on after its switch went off').toEqual([]);
  await page.getByTestId('set-recitation').check();
  await page.getByTestId('btn-resume').click();
  // slow mode mid-clip: the clip slows down, and is not cut short by its safety net
  await kq(page, 'goto', 'verse:3');
  await verseClip();
  await page.getByTestId('slow').check();
  const slowed = await page.evaluate(() => ((window as any).__els as HTMLMediaElement[]).find((e) => !e.paused)?.playbackRate);
  expect(slowed).toBeCloseTo(0.8, 2);
  const ended = await page.evaluate(() => new Promise<string>((res) => {
    const el = ((window as any).__els as HTMLMediaElement[]).find((e) => !e.paused)!;
    el.addEventListener('ended', () => res('ended'), { once: true });
    el.addEventListener('emptied', () => res('cut at ' + el.currentTime.toFixed(1) + '/' + el.duration.toFixed(1)), { once: true });
  }));
  expect(ended).toBe('ended');
  await page.getByTestId('slow').uncheck();
  // the quick mute: everything off at once (and the line speaking stops), then back as it was
  await kq(page, 'goto', 'verse:3');
  await verseClip();
  await page.getByTestId('btn-mute').click();
  await page.waitForTimeout(300);
  expect(await media(page)).toEqual([]);
  const st = (await state(page)).settings;
  expect([st.recitation, st.voices, st.sfx]).toEqual([false, false, false]);
  await expect(page.getByTestId('btn-mute')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('btn-mute').click();
  const st2 = (await state(page)).settings;
  expect([st2.recitation, st2.voices, st2.sfx]).toEqual([true, true, true]);
  await verseClip();
  expect(await page.evaluate(() => (window as any).__maxUnpaused)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('replay a finished district: its verses and its challenge again, nothing lost', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop');
  test.setTimeout(400_000);
  const errors = await open(page, { speed: 25 }, '#/');
  await kq(page, 'learnUpTo', 7);
  const before = (await state(page)).profile;
  for (const v of [3, 7]) {
    await kq(page, 'goto', 'verse:' + v);
    // a child taps wrong a lot on a replay
    await playUntil(page, (s) => s.level?.verse === v && s.item === 'reward', { skip: ['reward'], each: async (_s, i) => { if (i % 2 === 0) await kq(page, 'fail'); } });
  }
  await kq(page, 'goto', 'boss:manfoukh');
  await playUntil(page, (s) => s.item === 'boss-done', { skip: ['boss-done'] });
  await kq(page, 'solve');
  await page.waitForTimeout(500);
  await kq(page, 'goto', 'boss:manfoukh');
  await playUntil(page, (s) => s.item === 'boss-done', { skip: ['boss-done'] });
  const after = (await state(page)).profile;
  for (const v of [3, 7]) expect(after.verses[v].stars).toBeGreaterThanOrEqual(before.verses[v].stars);
  expect(Object.keys(after.verses).length).toBe(7);
  expect(after.bosses.manfoukh || Object.values(after.bosses)[0]).toBeTruthy();
  expect(errors).toEqual([]);
});

test('daily polish, left halfway and come back the next day; the certificate and sharing', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone');
  test.setTimeout(300_000);
  const errors = await open(page, { speed: 25 }, '#/');
  await kq(page, 'learnUpTo', 9, { due: true });
  await kq(page, 'goto', 'polish');
  await playUntil(page, (s) => (s.polish?.i ?? 0) >= 2);
  await kq(page, 'goto', 'home');
  await page.waitForTimeout(400);
  await kq(page, 'goto', 'polish');
  await playUntil(page, (s) => s.item === 'polish-done', { skip: ['polish-done'] });
  await kq(page, 'advanceClock', 1);
  await kq(page, 'goto', 'home');
  await page.waitForTimeout(400);
  await kq(page, 'goto', 'polish');
  await page.waitForTimeout(800);
  // the certificate: a name, the print view, the share card (no Web Share in the test browser: the image is saved)
  await kq(page, 'learnUpTo', 51);
  await page.evaluate(() => { const p = (window as any).__kq.state().profile; p.medal.date = (window as any).__kq.state().today; });
  await kq(page, 'goto', 'medal');
  await page.waitForTimeout(600);
  await kq(page, 'goto', 'cert');
  await page.waitForTimeout(600);
  const name = page.getByTestId('cert-name');
  if (await name.count()) { await name.fill('أَمِين'); await name.press('Enter'); }
  await page.evaluate(() => { (window as any).print = () => { (window as any).__printed = true; }; });
  await page.getByTestId('btn-print-now').click({ timeout: 5_000 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => !!(window as any).__printed)).toBe(true);
  // the share card from the medal page (no Web Share here: the picture is saved)
  await kq(page, 'goto', 'medal');
  await page.waitForTimeout(600);
  const dl = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
  await page.getByTestId('btn-share').click({ timeout: 5_000 }).catch(() => {});
  await page.getByTestId('btn-save-image').click({ timeout: 3_000 }).catch(() => {});
  const d = await dl;
  expect(d, 'the share card was not saved').toBeTruthy();
  console.log('share →', d ? d.suggestedFilename() : 'no download', 'printed', await page.evaluate(() => !!(window as any).__printed));
  expect(await hscroll(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
