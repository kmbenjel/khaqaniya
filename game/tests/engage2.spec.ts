// E2 (ENGAGEMENT #13, #14): the parents' progress in the grown-ups' corner, and the gentle «see you tomorrow» card.
import { test, type Page } from '@playwright/test';
import { open, kq, state, shot, expect } from './helpers';

const phoneOnly = (name: string) => test.skip(name !== 'phone', 'one project: the phone');

/** Plays the current screen with the test API until `done`, never tapping through the labels in `skip`. */
async function playUntil(page: Page, done: (s: any) => boolean, skip: string[] = [], max = 3000) {
  for (let i = 0; i < max; i++) {
    const s = await state(page);
    if (done(s)) return s;
    await kq(page, 'solve', skip);
    await page.waitForTimeout(20);
  }
  throw new Error('not reached: ' + JSON.stringify(await state(page)).slice(0, 300));
}
/** Changes the active player's data in the page (the live profile), then saves (set({}) writes the whole store). */
const patchProfile = (page: Page, fn: string, arg?: unknown) => page.evaluate(([fn, arg]) => {
  const k = (window as any).__kq; const p = k.state().profile;
  new Function('p', 'arg', 'today', fn)(p, arg, k.state().today);
  k.set({});
}, [fn, arg] as const);
/** Every item label the game made active (kq:item), in order. */
async function recordItems(page: Page) {
  await page.addInitScript(() => { const w = window as any; w.__items = []; window.addEventListener('kq:item', (e: any) => { if (e.detail.label) w.__items.push(e.detail.label); }); });
}
const items = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__items.slice());

// ── #13 parents' progress ────────────────────────────────────────────────────────────────────────────────────────────
test('parents\' progress: numbers, the seven lamps, verses to practise (their sheet, missed words), one lantern at a time', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(180_000);
  const errors = await open(page, { speed: 25 });   // capture mode: the gate is open
  const total = (await kq(page, 'poem')).length;
  await kq(page, 'learnUpTo', 12);
  // verse 3: two polish retries; verse 5: two words missed in «someone is listening» (s1 twice, a0 once); verse 2 due today
  await patchProfile(page, `p.verses['3'].lapses = 2; p.verses['5'].weak = { s1: 2, a0: 1 }; p.verses['2'].due = today;`);
  const st = await state(page);
  const won = Object.values(st.profile.verses as Record<string, any>).filter((v) => v.stars > 0);
  const golden = won.filter((v) => v.stars >= 3).length;
  const due = won.filter((v) => v.due <= st.today).length;
  const bosses = Object.keys(st.profile.bosses).length;
  await kq(page, 'goto', 'grownups');
  const sec = page.getByTestId('grown-progress');
  await expect(sec).toBeVisible();
  // the progress comes first in the corner
  expect(await page.locator('.corner > section').first().getAttribute('data-testid')).toBe('grown-progress');
  const num = async (id: string) => (await page.getByTestId(id).innerText()).match(/\d+/g)!.map(Number);
  expect(await num('progress-pearls')).toEqual([12, total]);
  expect(await num('progress-golden')).toEqual([golden]);
  expect(await num('progress-days')).toEqual([st.profile.days.length]);
  expect((await num('progress-bosses'))[0]).toBe(bosses);
  expect(await num('progress-due')).toEqual([due]);
  // seven lamps, today's lit (the demo player played today)
  const lamps = page.locator('[data-testid=progress-week] .lamp');
  await expect(lamps).toHaveCount(7);
  expect(await lamps.first().getAttribute('class')).toContain('on');
  // one player: no chooser
  await expect(page.locator('.progress-who')).toBeHidden();
  // verses to practise: the most in need first (2 retries = 4 > 3 missed marks), each with its reasons
  const list = page.locator('[data-testid=practise] .practise-item');
  await expect(list).toHaveCount(2);
  expect(await list.nth(0).getAttribute('data-testid')).toBe('practise-3');
  expect(await list.nth(1).getAttribute('data-testid')).toBe('practise-5');
  await expect(page.getByTestId('practise-3').locator('.practise-why')).toContainText('2');
  await expect(page.getByTestId('practise-5').locator('.practise-word')).toHaveCount(2);
  await shot(page, 'e2-progress-one');
  // a tap opens the verse's sheet, the missed words marked
  await page.getByTestId('practise-5').click();
  const sheet = page.getByTestId('verse-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.w.weak')).toHaveCount(2);
  await expect(sheet.locator('.verse-card')).toHaveAttribute('data-n', '5');
  await shot(page, 'e2-progress-sheet');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  // a second lantern (added in the corner, it becomes the active player): the chooser appears, one lantern at a time
  await page.getByTestId('btn-add-player').click();
  await expect(page.locator('.progress-who')).toBeVisible();
  await expect(page.locator('.who-chip')).toHaveCount(2);
  await expect(page.getByTestId('progress-card')).toHaveAttribute('data-player', 'p1');   // still the one being read
  await kq(page, 'learnUpTo', 2);   // the new player (active) has two pearls
  await page.getByTestId('progress-who-p2').click();
  await expect(page.getByTestId('progress-card')).toHaveAttribute('data-player', 'p2');
  await expect(page.getByTestId('progress-who-p2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('progress-who-p1')).toHaveAttribute('aria-pressed', 'false');
  expect(await num('progress-pearls')).toEqual([2, total]);
  await expect(page.getByTestId('practise-none')).toBeVisible();
  // back to the first lantern; «play it again» from its verse sheet plays as that lantern
  await page.getByTestId('progress-who-p1').click();
  expect(await num('progress-pearls')).toEqual([12, total]);
  await shot(page, 'e2-progress-two');
  expect((await state(page)).profile.id).toBe('p2');
  await page.getByTestId('practise-3').click();
  await expect(page.getByTestId('verse-sheet').locator('.star.on')).toHaveCount(st.profile.verses['3'].stars);   // that lantern's stars
  await page.getByTestId('sheet-level').click();
  await expect(page.getByTestId('level')).toBeVisible();
  const s2 = await state(page);
  expect(s2.profile.id).toBe('p1');
  expect(s2.level?.verse).toBe(3);
  expect(errors).toEqual([]);
});

test('parents\' progress never shows in the child view: only behind the grown-ups\' gate', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(180_000);
  const errors = await open(page, { capture: 0, speed: 25, recitation: 0, voices: 0 }, '');
  await expect(page.getByTestId('splash')).toBeVisible();
  await kq(page, 'learnUpTo', 12);
  await patchProfile(page, `p.verses['3'].lapses = 2; p.verses['5'].weak = { s1: 1 };`);
  await page.getByTestId('btn-start').click();
  await expect(page.getByTestId('home')).toBeVisible();
  const none = async (where: string) => {
    await page.waitForTimeout(400);
    expect(await page.locator('[data-testid=grown-progress], .progress-card, .practise').count(), 'progress shown on ' + where).toBe(0);
  };
  await none('home');
  for (const target of ['map', 'necklace', 'stickers', 'heroes', 'dedication', 'home']) { await kq(page, 'goto', target); await none(target); }
  await page.evaluate(() => { location.hash = '#/profiles'; }); await none('profiles');
  await kq(page, 'goto', 'verse:13'); await page.waitForTimeout(800); await none('a level');
  // the corner and About: the gate, nothing of the progress
  for (const id of ['btn-grownups', 'btn-about']) {
    await kq(page, 'goto', 'home');
    await page.getByTestId(id).click();
    await expect(page.getByTestId('gate')).toBeVisible();
    await none('the gate via ' + id);
  }
  // a grown-up answers the gate: now the progress is there
  await kq(page, 'goto', 'home');
  await page.getByTestId('btn-grownups').click();
  const q = (await page.locator('.gate-q').innerText()).match(/\d+/g)!.map(Number);
  await page.getByTestId('gate-input').fill(String(q[0] * q[1]));
  await page.getByTestId('gate-ok').click();
  await expect(page.getByTestId('grown-progress')).toBeVisible();
  await expect(page.getByTestId('practise-3')).toBeVisible();
  expect(errors).toEqual([]);
});

// ── #14 a gentle «see you tomorrow» ─────────────────────────────────────────────────────────────────────────────────
test('see you tomorrow: the pearl that meets the day\'s suggestion closes with a card; its one button has the focus and closes it', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(400_000);
  await recordItems(page);
  const errors = await open(page, { speed: 25 });
  expect((await state(page)).settings.dailyNew).toBe(2);
  // pearl 1 of the day: no card
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
  expect(await items(page)).not.toContain('tomorrow');
  await expect(page.getByTestId('tomorrow')).toHaveCount(0);
  // pearl 2 meets the suggestion (2 a day): the card comes after the reward's lines, before its buttons
  await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.verse === 2 && (s.item === 'tomorrow' || s.item === 'reward'), ['reward', 'tomorrow']);
  const card = page.getByTestId('tomorrow');
  await expect(card).toBeVisible();
  expect((await state(page)).item).toBe('tomorrow');
  await expect(card).toHaveAttribute('role', 'dialog');
  await expect(page.getByTestId('tomorrow-ok')).toBeFocused();
  await expect(page.locator('.reward-btns [data-testid=btn-next]')).toHaveCount(0);   // the reward's buttons wait under it
  // today's lamp lit, tomorrow's waiting; the pearls that will want polishing tomorrow (the two learned today)
  await expect(card.locator('.is-today .lamp.on')).toHaveCount(1);
  await expect(card.locator('.is-tomorrow .lamp.waiting')).toHaveCount(1);
  const st = await state(page);
  const tomorrow = new Date(Date.parse(st.today + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  const dueTomorrow = Object.values(st.profile.verses as Record<string, any>).filter((v) => v.stars > 0 && v.due <= tomorrow).length;
  expect(dueTomorrow).toBe(2);
  await expect(page.getByTestId('tomorrow-polish')).toHaveAttribute('data-n', String(dueTomorrow));
  await expect(card.locator('.tomorrow-pearls svg')).toHaveCount(dueTomorrow);
  // the cast's two lines are on the card and were said (captions)
  await expect(card.locator('.tomorrow-line')).toHaveCount(2);
  await shot(page, 'e2-tomorrow');
  // no countdown: it waits (at test speed this is a long time), and Tab stays on its one button
  await page.waitForTimeout(3000);
  await expect(card).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('tomorrow-ok')).toBeFocused();
  const caps: { key: string }[] = await kq(page, 'captions');
  expect(caps.map((c) => c.key)).toEqual(expect.arrayContaining(['tomorrow.line', 'tomorrow.mishmish']));
  // the button closes it; the reward's buttons come back (nothing is blocked)
  await page.keyboard.press('Enter');
  await expect(card).toHaveCount(0);
  await expect(page.locator('.reward-btns [data-testid=btn-next]')).toBeVisible();
  await expect(page.locator('.reward-btns [data-testid=btn-next]')).toBeFocused();   // the focus comes back to the reward
  expect((await state(page)).item).toBe('reward');
  expect((await state(page)).profile.seen.tomorrow).toBe(st.today);
  // a third pearl the same day: no second card
  const before = (await items(page)).filter((x) => x === 'tomorrow').length;
  await kq(page, 'goto', 'verse:3');
  await playUntil(page, (s) => s.level?.verse === 3 && s.item === 'reward', ['reward']);
  expect((await items(page)).filter((x) => x === 'tomorrow').length).toBe(before);
  // the next day: a replay never shows it, even with the suggestion met; a new pearl does (Escape closes it too)
  await kq(page, 'advanceClock', 1);
  await patchProfile(page, `p.newToday = { date: today, count: 2 };`);
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.verse === 1 && s.item === 'reward', ['reward']);
  expect((await items(page)).filter((x) => x === 'tomorrow').length).toBe(before);
  await kq(page, 'goto', 'verse:4');
  await playUntil(page, (s) => s.level?.verse === 4 && (s.item === 'tomorrow' || s.item === 'reward'), ['reward', 'tomorrow']);
  await expect(page.getByTestId('tomorrow')).toBeVisible();
  await expect(page.getByTestId('tomorrow-ok')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tomorrow')).toHaveCount(0);
  await expect(page.locator('.reward-btns [data-testid=btn-next]')).toBeVisible();
  // «no daily suggestion» in the grown-ups' settings: never a card
  await kq(page, 'set', { dailyNew: 0 });
  await kq(page, 'advanceClock', 1);
  await patchProfile(page, `p.newToday = { date: today, count: 5 };`);
  const n0 = (await items(page)).filter((x) => x === 'tomorrow').length;
  await kq(page, 'goto', 'verse:5');
  await playUntil(page, (s) => s.level?.verse === 5 && s.item === 'reward', ['reward']);
  expect((await items(page)).filter((x) => x === 'tomorrow').length).toBe(n0);
  expect(errors).toEqual([]);
});

test('see you tomorrow: leaving the reward while the card is up leaves nothing behind', async ({ page }, info) => {
  phoneOnly(info.project.name);
  test.setTimeout(180_000);
  const errors = await open(page, { speed: 25 });
  await kq(page, 'learnUpTo', 1);
  await patchProfile(page, `p.newToday = { date: today, count: 1 };`);
  await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.verse === 2 && (s.item === 'tomorrow' || s.item === 'reward'), ['reward', 'tomorrow']);
  await expect(page.getByTestId('tomorrow')).toBeVisible();
  await page.goBack();   // the browser's back while the card is up
  await expect(page.getByTestId('tomorrow')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect((await state(page)).item).not.toBe('tomorrow');
  expect(errors).toEqual([]);
});
