import { test, type Page } from '@playwright/test';
import { open, kq, state, shot, expect, sourcePoem } from './helpers';

// Every verse text on screen must be the data, mark for mark: hemistich lines, hemistich options, word tiles/options.
async function auditScreen(page: Page, hemis: Set<string>, tokens: Set<string>, bad: string[]) {
  const r = await page.evaluate(() => {
    const lines = [...document.querySelectorAll('.verse-card .hemi:not(.hemi-blank)')].map((e) => ({ t: e.textContent || '', blank: !!e.querySelector('.blank,.hidden-w') }));
    const hemiOpts = [...document.querySelectorAll('.opt:not(.word):not(.meaning-opt) .opt-label, .piece .opt-label, .slot-text')].map((e) => e.textContent || '');
    const words = [...document.querySelectorAll('.opt.word .opt-label, .tile, .pearl-word, .bead.filled, .blank.filled')].map((e) => e.textContent || '');
    return { lines, hemiOpts, words };
  });
  for (const l of r.lines) if (!l.blank && l.t.trim() && !hemis.has(l.t)) bad.push('line: ' + l.t);
  for (const o of r.hemiOpts) if (o.trim() && !hemis.has(o) && !o.endsWith(' …') && ![...hemis].some((h) => o === h)) {
    // G2 joined pieces are "sadr ajz"; G9 cards are "w1 w2 …"
    if (![...hemis].some((a) => [...hemis].some((b) => o === a + ' ' + b))) bad.push('option: ' + o);
  }
  for (const w of r.words) if (w.trim() && !tokens.has(w.trim()) && !/^ +$/.test(w)) bad.push('word: ' + w);
}

test('the whole poem played to the end via the test API (all levels, all challenges, finale)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'long run: one project');
  test.setTimeout(3_600_000);
  const src = sourcePoem();
  const hemis = new Set(src.verses.flatMap((v) => [v.sadr.normalize('NFC'), v.ajz.normalize('NFC')]));
  const tokens = new Set(src.verses.flatMap((v) => (v.sadr + ' ' + v.ajz).normalize('NFC').split(/\s+/)));
  const errors = await open(page, { speed: 100 }, '#/');
  const bad: string[] = [];
  let lastShotVerse = 0;
  await kq(page, 'goto', 'verse:1');
  for (let guard = 0; guard < 60000; guard++) {
    const s = await state(page);
    if (s.screen === 'medal') break;
    if (guard % 300 === 0 || (process.env.POEM_TRACE && guard < 60)) console.log('poem', guard, Date.now() % 100000, s.screen, JSON.stringify(s.level), s.item, s.learned);
    if (guard % 3 === 0) await auditScreen(page, hemis, tokens, bad);
    if (s.screen === 'verse' && s.level?.step === 'reward' && s.level.verse % 10 === 0 && s.level.verse !== lastShotVerse) { lastShotVerse = s.level.verse; await shot(page, `poem-reward-${s.level.verse}`); }
    // the name sheet after pearl 1 is answered by solve() ("later"); a Playwright click here raced its closing and hung
    const r = await kq(page, 'solve', ['medal']);
    if (process.env.POEM_TRACE && guard < 60) console.log('  solve →', r, await page.evaluate(() => [location.hash, document.querySelectorAll('[data-testid=btn-next]').length, (window as any).__kq.active()?.right?.outerHTML?.slice(0, 120)].join(' | ')));
    await page.waitForTimeout(15);
  }
  const s = await state(page);
  expect(s.screen).toBe('medal');
  expect(s.learned).toBe(src.verses.length);
  expect(s.profile.medal.date).toBeTruthy();
  expect(Object.keys(s.profile.bosses).length).toBe((await kq(page, 'districts')).length);
  await shot(page, 'poem-medal');
  console.log('screen audit violations:', bad.length, bad.slice(0, 5));
  expect([...new Set(bad)].slice(0, 20)).toEqual([]);
  expect(errors).toEqual([]);
});
