import { test } from '@playwright/test';
import { open, kq, expect, sourcePoem, shot } from './helpers';

test.describe.configure({ mode: 'serial' });

// §13.5: locked tokens never appear as options; sacred tokens never as wrong options — all verses × all games × 200 seeds.
test('token audit over 200 seeds', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'data check, one project is enough');
  test.setTimeout(300_000);
  await open(page);
  const poem = await kq(page, 'poem');
  // the Qur'anic quotations are locked where the data/overrides say (verses 41 and 47 by default)
  const locked = poem.filter((v: { locked: string[] }) => v.locked.length);
  expect(locked.length).toBeGreaterThanOrEqual(2);
  let sets = 0;
  const bad: string[] = [];
  for (let seed = 1; seed <= 200; seed++) {
    const r = await kq(page, 'optionAudit', seed);
    sets += r.sets; bad.push(...r.bad);
  }
  console.log(`token audit: ${sets} option sets, ${bad.length} violations`);
  expect(bad.slice(0, 20)).toEqual([]);
  // the poem the game binds is the data, mark for mark
  const src = sourcePoem();
  expect(poem.map((v: { sadr: string; ajz: string }) => v.sadr + '|' + v.ajz)).toEqual(src.verses.map((v) => v.sadr.normalize('NFC') + '|' + v.ajz.normalize('NFC')));
});

// Silah marks (U+06E5 ۥ, U+06E6 ۦ) stay attached to their words and render in the poem font.
test('silah marks: tokens keep them, Amiri renders them', async ({ page }, info) => {
  await open(page, {}, '#/');
  const poem = await kq(page, 'poem');
  const withSilah = poem.filter((v: { sadr: string; ajz: string }) => /[ۥۦ]/.test(v.sadr + v.ajz));
  test.skip(!withSilah.length, 'no silah in this text');
  const v = withSilah[0];
  await kq(page, 'learnUpTo', v.n - 1);
  await kq(page, 'goto', 'verse:' + v.n);
  const card = page.getByTestId('verse-card').first();
  await expect(card).toBeVisible();
  const r = await card.evaluate((el) => ({
    font: getComputedStyle(el).fontFamily,
    ok: document.fonts.check('700 28px Amiri', 'ۥۦ'),
    words: [...el.querySelectorAll('.w')].map((w) => w.textContent || ''),
  }));
  expect(r.font).toContain('Amiri');
  expect(r.ok).toBe(true);
  expect(r.words.some((w) => /^[^\s]*[ۥۦ][^\s]*$/.test(w))).toBe(true);
  expect(r.words.every((w) => !/^[ۥۦ]/.test(w))).toBe(true);   // never split off its word
  await shot(page, info.project.name + '-silah-v' + v.n);
});
