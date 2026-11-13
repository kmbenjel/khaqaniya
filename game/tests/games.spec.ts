import { test, type Page } from '@playwright/test';
import { open, kq, state, shot, expect } from './helpers';

/** Solve until the level reaches `step` (or the screen changes). */
async function until(page: Page, f: (s: any) => boolean, skip: string[] = [], max = 600) {
  // solve() waits for the next item and taps it at once, so terminal items (reward, polish-done, finale…) are passed in
  // `skip` (solve returns 'skipped' without tapping) or the loop would tap straight through the state it waits for.
  for (let i = 0; i < max; i++) { const s = await state(page); if (f(s)) return s; await kq(page, 'solve', [...skip, 'reward']); await page.waitForTimeout(30); }
  throw new Error('not reached');
}
const banner = (page: Page) => page.getByTestId('banner');

test('every mini-game type appears and completes', async ({ page }, info) => {
  test.setTimeout(400_000);
  const errors = await open(page, { motion: 1 }, '#/');   // motion on: G4 lanes and the falling radar words
  const types = new Set<string>();
  // every item the game activates is announced by a kq:item event (the loop below would miss the short ones)
  await page.evaluate(() => { (window as any).__seen = []; window.addEventListener('kq:item', (e: any) => { if (e.detail.label) (window as any).__seen.push(e.detail.label); }); });
  const watch = async () => { for (const l of await page.evaluate(() => (window as any).__seen as string[])) types.add(l); };
  // verse 1: G1 (rung by level), G4 radar, G6, G7, reward
  await kq(page, 'goto', 'verse:1');
  for (let i = 0; i < 400; i++) { const s = await state(page); await watch(); if (s.level?.step === 'reward') break; await kq(page, 'solve', ['reward']); await page.waitForTimeout(30); }
  // verse 2: G2, G3, G6, G7, G8 — with wrong taps and help first (no dead end)
  await kq(page, 'learnUpTo', 1); await kq(page, 'goto', 'verse:2');
  await until(page, (s) => s.level?.step === 'playA' && s.item === 'order', ['order']);
  await kq(page, 'fail'); await kq(page, 'fail'); await kq(page, 'fail');
  await expect(page.locator('.piece.glow')).toHaveCount(1);
  await page.getByTestId('help').click(); await page.getByTestId('help').click();
  await shot(page, info.project.name + '-g2-help');
  for (let i = 0; i < 400; i++) { const s = await state(page); await watch(); if (s.level?.step === 'reward') break; if (s.level?.step === 'playB' && s.item === 'g3') { await kq(page, 'fail'); } await kq(page, 'solve', ['reward']); await page.waitForTimeout(30); }
  // verse 3 at level mid: G5 (b), G4 lanes
  await kq(page, 'learnUpTo', 2); await kq(page, 'level', 'mid'); await kq(page, 'goto', 'verse:3');
  await until(page, (s) => s.level?.step === 'playA' && /g5/.test(s.item || ''), ['g5a', 'g5b']);
  await watch(); await shot(page, info.project.name + '-g5');
  await until(page, (s) => s.level?.step === 'playB' && s.item === 'g4', ['g4']);
  await expect(page.getByTestId('lanes')).toBeVisible();
  await shot(page, info.project.name + '-g4-lanes');
  await kq(page, 'fail');
  await until(page, (s) => s.level?.step === 'playC');
  // strong + boost: G6 rung 4 (two extra words in the tray)
  await kq(page, 'level', 'strong'); await kq(page, 'boost', 1);
  await until(page, (s) => s.level?.step === 'playC' && s.item === 'g6', ['g6']);
  await watch(); await shot(page, info.project.name + '-g6');
  // RECITE: listener mode, mark a word as missed → weak word saved
  await until(page, (s) => s.level?.step === 'recite' && s.item === 'g7-reveal', ['g7-reveal']);
  await page.getByTestId('listener-toggle').check();
  await page.locator('.markable .w').nth(2).click();
  await shot(page, info.project.name + '-g7-listener');
  await page.getByTestId('listener-ok').click();
  await until(page, (s) => s.level?.step === 'reward');
  const st = await state(page);
  expect(Object.keys(st.profile.verses['3'].weak).length).toBe(1);
  expect(st.profile.stickers.listener).toBeTruthy();
  // specials: S1 caravan at the end of «seven», S2 hats in «workshop»
  await kq(page, 'level', 'easy'); await kq(page, 'boost', 0);
  const ds = await kq(page, 'districts');
  for (const [id, label] of [['seven', 's1'], ['workshop', 's2']] as const) {
    const d = ds.find((x: any) => x.id === id);
    const w = (await kq(page, 'store')) && null; void w;
    await kq(page, 'learnUpTo', d.to - 1);
    await kq(page, 'goto', 'verse:' + (id === 'seven' ? 11 : 31));
    const s = await until(page, (x) => x.level?.step === 'playA' && ['s1', 's2', 'g1'].includes(x.item), ['s1', 's2', 'g1']);
    await watch();
    await shot(page, info.project.name + '-special-' + id);
    expect([label, 'g1']).toContain(s.item);   // S1 needs the reciter/city copy; it falls back to G1 until it exists
    await until(page, (x) => x.level?.step === 'playB');
  }
  console.log('game items seen:', [...types].sort().join(' '));
  for (const g of ['g1', 'order', 'radar', 'g3', 'g4', 'g6', 'g7-reveal', 'g7-rate', 'g8']) expect(types).toContain(g);
  expect([...types].some((x) => /^g5/.test(x))).toBe(true);
  expect(errors).toEqual([]);
});

test('polish: due pearls, intervals follow the boxes when the clock moves', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, {}, '#/');
  await kq(page, 'learnUpTo', 9, { due: true });
  await kq(page, 'goto', 'home');
  await expect(page.getByTestId('btn-polish')).toBeVisible();
  const before = (await kq(page, 'store')).profiles[0].verses;
  await page.getByTestId('btn-polish').click();
  await expect(page.getByTestId('polish')).toBeVisible();
  for (let i = 0; i < 600; i++) { const s = await state(page); if (s.item === 'polish-done') break; await kq(page, 'solve', ['polish-done']); await page.waitForTimeout(30); }
  await expect(page.getByTestId('polish-done')).toBeVisible();
  const after = (await kq(page, 'store')).profiles[0].verses;
  const moved = Object.keys(after).filter((k) => after[k].box > before[k].box);
  expect(moved.length).toBe(6);                      // a session takes 6 due pearls
  const intervals = [1, 2, 4, 8, 16, 32];
  const today = (await state(page)).today;
  for (const k of moved) {
    const d = (Date.parse(after[k].due) - Date.parse(today)) / 86400000;
    expect(d).toBe(intervals[after[k].box - 1]);
    expect(after[k].stars).toBeGreaterThanOrEqual(before[k].stars);   // never taken away
  }
  // move the clock: nothing is lost going back
  await kq(page, 'advanceClock', 8);
  expect((await state(page)).today > today).toBe(true);
  await kq(page, 'setClock', -3);
  const back = (await kq(page, 'store')).profiles[0].verses;
  expect(Object.keys(back).length).toBe(9);
});

test('necklace: listen to all, verse sheet, links to the poem site', async ({ page }, info) => {
  await open(page, {}, '#/');
  await kq(page, 'learnUpTo', 5);
  await kq(page, 'goto', 'necklace');
  const audio: any[] = [];
  await page.exposeFunction('__audioEv', (d: any) => audio.push(d));
  await page.evaluate(() => window.addEventListener('kq:audio', (e: any) => (window as any).__audioEv(e.detail)));
  await page.getByTestId('btn-play-all').click();
  await expect(page.getByTestId('now-playing').locator('.verse-card')).toBeVisible();
  await page.waitForTimeout(800);
  expect(audio.length).toBeGreaterThan(0);
  expect(audio[0]).toMatchObject({ kind: 'verse', id: 1 });
  await shot(page, info.project.name + '-necklace');
  await page.getByTestId('btn-play-all').click();
  await page.getByTestId('pearl-3').click();
  await expect(page.getByTestId('verse-sheet')).toBeVisible();
  await expect(page.getByTestId('sheet-read')).toHaveAttribute('href', './qasida/#b3');
  await expect(page.getByTestId('read-poem')).toHaveAttribute('href', './qasida/');
});

test('finale: last challenge → dawn → still prayer → medal → certificate → dedication', async ({ page }, info) => {
  test.setTimeout(300_000);
  const errors = await open(page, {}, '#/');
  const ds = await kq(page, 'districts');
  const last = ds[ds.length - 1];
  await kq(page, 'learnUpTo', last.to);
  await kq(page, 'goto', 'boss:' + last.boss);
  await expect(page.getByTestId('boss')).toBeVisible();
  for (let i = 0; i < 800; i++) { const s = await state(page); if (s.screen === 'finale') break; await kq(page, 'solve', ['finale']); await page.waitForTimeout(30); }
  await expect(page.getByTestId('finale')).toBeVisible();
  await page.waitForTimeout(500);
  await shot(page, info.project.name + '-finale');
  const audio: any[] = [];
  await page.exposeFunction('__audioEv2', (d: any) => audio.push(d));
  await expect(page.getByTestId('prayer')).toBeVisible({ timeout: 60_000 });
  await page.evaluate(() => window.addEventListener('kq:audio', (e: any) => (window as any).__audioEv2(e.detail)));
  const sfxBefore = (await kq(page, 'sfx')).length;
  await page.waitForTimeout(1500);
  // the prayer: no animation, no transition, no synthetic voice, no effect
  const anim = await page.evaluate(() => [...document.querySelectorAll('[data-testid=prayer], [data-testid=prayer] *')].map((e) => getComputedStyle(e).animationName + '|' + getComputedStyle(e).transitionDuration));
  expect(anim.every((a) => a.startsWith('none|') && /^0s/.test(a.split('|')[1]))).toBe(true);
  expect(audio.filter((a) => a.kind === 'voice')).toEqual([]);
  expect((await kq(page, 'sfx')).length).toBe(sfxBefore);
  await shot(page, info.project.name + '-prayer');
  await page.getByTestId('btn-amen').click();
  await expect(page.getByTestId('medal')).toBeVisible();
  await page.waitForTimeout(1300);
  await shot(page, info.project.name + '-medal');
  expect((await state(page)).profile.stickers.medal).toBeTruthy();
  await page.getByTestId('btn-print').click();
  await page.getByTestId('cert-name').fill('أمين');
  await page.emulateMedia({ media: 'print' });
  await shot(page, info.project.name + '-cert-print');
  await page.emulateMedia({ media: 'screen' });
  await kq(page, 'goto', 'dedication');
  await expect(page.getByTestId('dedication')).toBeVisible();
  await expect(page.locator('.dedication .from')).not.toBeEmpty();   // dedication.from is signed (DECISIONS 2)
  await shot(page, info.project.name + '-dedication');
  expect(errors).toEqual([]);
});

test('grown-ups gate, settings, reduced motion makes G4 three still choices', async ({ page }, info) => {
  await open(page, { capture: 0, motion: 1 }, '#/grownups');   // reduced motion must come from the setting, not the URL
  await page.getByTestId('btn-start').click();
  await page.getByTestId('btn-skip').click();
  await expect(page.getByTestId('level')).toBeVisible();       // first launch: story → verse 1
  await kq(page, 'goto', 'grownups');
  await expect(page.getByTestId('gate')).toBeVisible();
  const q = await page.locator('.gate-q').textContent();
  const [a, b] = (q || '').match(/\d+/g)!.map(Number);
  await page.getByTestId('gate-input').fill('1');
  await page.getByTestId('gate-ok').click();
  await expect(page.locator('.gate-msg')).not.toBeEmpty();
  await page.getByTestId('gate-input').fill(String(a * b));
  await page.getByTestId('gate-ok').click();
  await expect(page.getByTestId('set-reduceMotion')).toBeVisible();
  await page.getByTestId('set-reduceMotion').check();
  await page.getByTestId('size-l').click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'l');
  await shot(page, info.project.name + '-grownups');
  expect(await page.evaluate(() => document.documentElement.classList.contains('reduce-motion'))).toBe(true);
  await kq(page, 'learnUpTo', 2);
  await kq(page, 'goto', 'verse:3');
  await until(page, (s) => s.level?.step === 'playB' && s.item === 'g4', ['g4']);
  await expect(page.getByTestId('lanes')).toHaveCount(0);
  await expect(page.locator('.pearl-opt')).toHaveCount(3);
});
