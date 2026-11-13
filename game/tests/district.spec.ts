import { test } from '@playwright/test';
import { open, kq, state, shot, expect } from './helpers';

// District 1 played to the end through the UI: every verse level (all steps), then the gang challenge, with screenshots
// of the first time each step / game banner appears.
test('district 1 (gate) through the UI, verse levels + challenge', async ({ page }, info) => {
  test.setTimeout(600_000);
  const errors = await open(page, {}, '#/map');
  const seen = new Set<string>();
  const snap = async (tag: string) => { if (seen.has(tag)) return; seen.add(tag); await page.waitForTimeout(250); await shot(page, `${info.project.name}-d1-${tag}`); };
  const districts = await kq(page, 'districts');
  const gate = districts[0];
  await page.getByTestId('pearl-' + gate.from).click();
  for (let guard = 0; guard < 2000; guard++) {
    const s = await state(page);
    if (guard % 25 === 0) console.log(guard, s.screen, JSON.stringify(s.level), s.item, s.learned);
    if (s.screen === 'boss') break;
    if (s.screen === 'verse' && s.level) {
      const banner = (await page.getByTestId('banner').textContent().catch(() => '')) || '';
      await snap(s.level.step + '-' + (await page.locator('.play-zone').getAttribute('class')) + '-' + banner.length);
      if (s.level.step === 'reward' && s.item === 'reward') {
        await expect(page.locator('[data-testid=reward-pearl], [data-testid=reward-strand]').first()).toBeVisible();   // the pearl, then the strand it lands on
        const sheet = page.getByTestId('name-sheet');
        if (await sheet.isVisible().catch(() => false)) { await page.getByTestId('profile-later').click(); await expect(sheet).toBeHidden(); continue; }
        await page.getByTestId('btn-next').click();
        await page.waitForTimeout(100);
        continue;
      }
    }
    const sheet = page.getByTestId('name-sheet');
    if (await sheet.isVisible().catch(() => false)) { await snap('name-sheet'); await page.getByTestId('name-input').fill('أمين'); await page.getByTestId('profile-ok').click(); await expect(sheet).toBeHidden(); await snap('amin-easter'); continue; }
    await kq(page, 'solve', ['reward', 'name-sheet']);   // the reward and the name sheet are answered through the UI above
    await page.waitForTimeout(40);
  }
  const s0 = await state(page);
  expect(s0.learned).toBe(gate.to - gate.from + 1);
  expect(s0.screen).toBe('boss');
  // the challenge: solve every question, sometimes fail first (nothing is lost)
  let fails = 0;
  for (let guard = 0; guard < 2000; guard++) {
    const s = await state(page);
    if (s.item === 'boss-done') break;
    if (s.boss && s.boss.q) await snap('boss-q' + Math.min(s.boss.q, 3));
    if (s.boss && s.boss.q === 2 && fails < 1 && s.item && !['entrance', 'next'].includes(s.item)) { fails++; await kq(page, 'fail'); }
    await kq(page, 'solve', ['boss-done']);
    await page.waitForTimeout(40);
  }
  await expect(page.getByTestId('boss-fixed')).toBeVisible();
  await snap('boss-fixed');
  const st = await state(page);
  expect(Object.keys(st.profile.bosses)).toContain(gate.boss);
  expect(st.profile.stickers['district.' + gate.id]).toBeTruthy();
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('level')).toBeVisible();
  expect((await state(page)).level.verse).toBe(gate.to + 1);
  expect(errors).toEqual([]);
});
