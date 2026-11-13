import { test } from '@playwright/test';
import { kq, state, shot, expect, Q, trackPlayback, advancedClips } from './helpers';

// PWA: after the first load, airplane mode: the game boots and district 1 is playable; the game's worker uses only
// kq-game- caches and never answers the poem site under /qasida/.
test('boots offline after first load; district 1 playable; /qasida/ left to its own worker', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  await trackPlayback(page);
  await page.goto(Q({ fresh: 1 }) + '#/');
  await page.waitForFunction(() => !!(window as any).__kq);
  await page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r?.active; }, null, { timeout: 60_000 });
  await page.reload();                                       // now controlled by the worker
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('kq-game-shell-')), null, { timeout: 60_000 });
  // precache finished: district 1 audio is in the media cache
  await page.waitForFunction(async () => { const c = await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none'); return (await c.keys()).length >= 21; }, null, { timeout: 60_000 });
  const keys: string[] = await page.evaluate(() => caches.keys());
  expect(keys.filter((k) => !k.startsWith('kq-')).length).toBe(0);
  await context.setOffline(true);
  await page.goto(Q({ recitation: 1 }) + '#/');            // no fresh: keep the cached state
  await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
  await expect(page.getByTestId('home')).toBeVisible();
  // fonts and data came from the cache
  expect(await page.evaluate(() => document.fonts.check('700 28px Amiri'))).toBe(true);
  await kq(page, 'goto', 'verse:1');
  await expect(page.getByTestId('level')).toBeVisible();
  // the first clip plays from the cache (offline)
  // (the game's Audio() elements are not in the DOM: playback is tracked by trackPlayback)
  await expect.poll(() => advancedClips(page), { timeout: 30_000 }).toContainEqual(expect.stringContaining('audio/v/001.mp3'));
  const played = (await advancedClips(page)).length > 0;
  for (let i = 0; i < 400; i++) { const s = await state(page); if (s.level?.step === 'reward') break; await kq(page, 'solve'); await page.waitForTimeout(30); }
  expect((await state(page)).level.step).toBe('reward');
  await shot(page, info.project.name + '-offline-reward');
  // the poem site: offline and never cached by the game → the game's worker must not answer it with the game shell
  const res = await page.goto('qasida/').catch((e) => e);
  const body = res && 'status' in res ? await page.content() : '';
  expect(body).not.toContain('id="app"');
  await context.setOffline(false);
  await page.goto('qasida/');
  await expect(page.locator('body')).not.toContainText('%KQ_');
  expect(await page.locator('#app').count()).toBe(0);
  console.log('offline clip played:', played);
  expect(played).toBe(true);
});
