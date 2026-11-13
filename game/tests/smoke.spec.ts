import { test } from '@playwright/test';
import { open, kq, state, shot, expect } from './helpers';

test('boots RTL, splash → intro → home, no errors, no other origin', async ({ page }, info) => {
  const foreign: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1' && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) foreign.push(r.url()); });
  const errors = await open(page, { capture: 0 }, '');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByTestId('splash')).toBeVisible();
  await shot(page, info.project.name + '-01-splash');
  await page.getByTestId('btn-start').click();
  await expect(page.getByTestId('intro')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, info.project.name + '-02-intro');
  await page.getByTestId('btn-skip').click();
  await expect(page.getByTestId('level')).toBeVisible();       // first launch: the story leads into verse 1 (§1.1)
  await kq(page, 'goto', 'home');
  await expect(page.getByTestId('home')).toBeVisible();
  await page.waitForTimeout(500);
  await shot(page, info.project.name + '-03-home');
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scrollW).toBeLessThanOrEqual(0);
  await page.getByTestId('door-map').click();
  await expect(page.getByTestId('map')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, info.project.name + '-04-map');
  expect(foreign).toEqual([]);
  expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
  void kq; void state;
});
