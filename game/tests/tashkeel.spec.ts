// G5: a child never sees unvocalised or technical text (the owner, 2026-11-14, saw an explanation without tashkeel,
// written for grown-ups, in the app). With grown-up mode off and the real (non-capture) game, every screen a child can reach
// is walked; every visible Arabic text node and every caption is measured: harakat per letter below RATIO is a finding,
// traced back to its copy key (design/copy.ar.json) or to the data. The grown-ups' corner and About sit behind the gate.
import { test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { open, kq, state, expect, REPO } from './helpers';

test.use({ actionTimeout: 10_000 });   // a click never waits for ever (a hung walk shows where it is)

const RATIO = 0.5;
const LETTERS = /[ء-غف-يٱ-ۓ]/g;
const MARKS = /[ً-ْٰ]/g;
const ratio = (s: string) => { const l = (s.match(LETTERS) || []).length; return l ? (s.match(MARKS) || []).length / l : 1; };
const letters = (s: string) => (s.match(LETTERS) || []).length;

/** Unvocalised and judged fine for a child (QA.md §7). A pattern here needs its reason. */
const FINE: { rx: RegExp; why: string }[] = [
  // `cert.date` is vocalised («التَّارِيخُ: …»); the month names come from the browser's calendar (Intl), not from copy.
  // Vocalised month names would be new copy keys (offered to A1 in QA.md §7).
  { rx: /^التَّارِيخُ: .*هـ — .*\d{4}$/, why: 'certificate date: month names from Intl' },
];
/** Copy keys waiting for A1's tashkeel (G5 lists them; A1 vocalises, then the key leaves this list). */
const PENDING_A1: string[] = [];

interface Seen { text: string; where: string; via: string }

/** Every visible text node of the page right now (own text of an element, trimmed). */
async function look(page: Page, where: string) {
  await page.evaluate((where) => {
    const w = window as any;
    w.__tk ||= new Map<string, { where: string; via: string }>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n: Node | null; (n = walker.nextNode());) {
      const s = (n.textContent || '').trim();
      const p = n.parentElement;
      if (!s || !p || p.closest('script, style, noscript')) continue;
      if (!(p as any).checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
      const r = p.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const via = (p.closest('[data-testid]')?.getAttribute('data-testid') || '') + ' ' + p.tagName.toLowerCase() + (typeof p.className === 'string' && p.className ? '.' + p.className.trim().split(/\s+/).join('.') : '');
      if (!w.__tk.has(s)) w.__tk.set(s, { where, via });
    }
    // tooltips and placeholders are visible text too
    for (const e of document.querySelectorAll('[title], [placeholder]')) {
      if (!(e as any).checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
      for (const a of ['title', 'placeholder']) { const s = (e.getAttribute(a) || '').trim(); if (s && !w.__tk.has(s)) w.__tk.set(s, { where, via: '@' + a + ' ' + e.tagName.toLowerCase() }); }
    }
  }, where);
}
const tap = async (page: Page, id: string) => { await page.getByTestId(id).first().click({ timeout: 5_000 }); await page.waitForTimeout(250); };

/** Plays the current screen with the test API until `done`, looking at every new step/item; `each` may act first. */
async function walk(page: Page, tag: string, done: (s: any) => boolean, o: { skip?: string[]; each?: (s: any) => Promise<boolean | void>; max?: number } = {}) {
  const seen = new Set<string>();
  const t0 = Date.now();
  console.log('tashkeel walk:', tag);
  for (let i = 0; i < (o.max ?? 2500); i++) {
    if (Date.now() - t0 > 240_000) throw new Error('walk ' + tag + ' stuck at ' + JSON.stringify(await state(page)).slice(0, 300));
    const s = await state(page);
    const k = [s.screen, s.level?.step, s.boss?.q, s.polish?.i, s.item].join(':');
    if (!seen.has(k)) { seen.add(k); await page.waitForTimeout(120); await look(page, tag + ' ' + k); }
    if (done(s)) return s;
    if (o.each && (await o.each(s))) continue;
    const r = await kq(page, 'solve', [...(o.skip ?? []), 'name-sheet']);
    if (r === 'skipped' && (await page.getByTestId('name-sheet').count())) { await look(page, tag + ' name sheet'); await tap(page, 'profile-later'); }
    await page.waitForTimeout(25);
  }
  throw new Error('not reached: ' + JSON.stringify(await state(page)).slice(0, 300));
}

/** Copy entries (key, text, audience) to trace a text back to its key. */
function copyEntries() {
  const raw = JSON.parse(readFileSync(path.join(REPO, 'design/copy.ar.json'), 'utf8'));
  const out: { key: string; text: string; aud?: string; rx: RegExp }[] = [];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const add = (key: string, text: string, aud?: string) => out.push({ key, text, aud, rx: new RegExp('^' + text.split(/\{\w+\}/).map(esc).join('[\\s\\S]*?') + '$') });
  const rec = (o: Record<string, any>, pre: string) => {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_')) continue;
      const key = pre ? pre + '.' + k : k;
      if (typeof v === 'string') add(key, v);
      else if (v && typeof v === 'object' && !Array.isArray(v)) { if (typeof v.text === 'string' || typeof v.say === 'string') add(key, v.text ?? v.say, v.aud); else rec(v, key); }
    }
  };
  rec(raw, '');
  return out;
}
function sourceOf(text: string, copy: ReturnType<typeof copyEntries>): string {
  const exact = copy.filter((e) => e.text.trim() === text);
  if (exact.length) return 'copy ' + exact.map((e) => e.key + (e.aud ? ' [' + e.aud + ']' : '')).join(', ');
  const tpl = copy.filter((e) => /\{\w+\}/.test(e.text) && e.rx.test(text));
  if (tpl.length) return 'copy ' + tpl.map((e) => e.key + (e.aud ? ' [' + e.aud + ']' : '')).slice(0, 3).join(', ');
  const part = copy.filter((e) => e.text.trim().length > 6 && text.includes(e.text.trim()));
  if (part.length) return 'copy (part) ' + part.map((e) => e.key).slice(0, 3).join(', ');
  const m = JSON.parse(readFileSync(path.join(REPO, 'text/meanings.json'), 'utf8')).verses as any[];
  for (const v of m) {
    if (v.adult && v.adult.includes(text.slice(0, 30))) return `data text/meanings.json v${v.n}.adult`;
    if (v.cite?.some((c: string) => text.includes(c.slice(0, 20)))) return `data text/meanings.json v${v.n}.cite`;
  }
  return 'data / code (unknown)';
}

test('tashkeel: every Arabic line a child can see is vocalised (grown-up mode off)', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'one project: the phone');
  test.setTimeout(1_500_000);
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text().slice(0, 160)); });
  const errors = await open(page, { capture: 0, grownup: 0, speed: 25, recitation: 0, voices: 0, motion: 0 }, '');
  // splash → the story → verse 1 (first launch), as a child starts
  await expect(page.getByTestId('splash')).toBeVisible();
  await look(page, 'splash');
  await tap(page, 'btn-start');
  for (let i = 0; i < 6 && (await page.getByTestId('intro').count()); i++) { await page.waitForTimeout(200); await look(page, 'intro ' + (i + 1)); await page.getByTestId('btn-panel-next').click({ timeout: 3_000 }).catch(() => {}); }
  let asked = false;
  const meaningExtras = async (s: any) => {
    if (s.level?.step !== 'meaning' || asked) return false;
    asked = true;
    // the word chips, the «ask the stork» sheet and each of its answers
    for (const c of await page.getByTestId('word-chip').all()) { await c.click(); await page.waitForTimeout(120); await look(page, 'meaning word chip'); }
    await tap(page, 'ask-btn');
    expect(await page.getByTestId('ask-grown').count(), 'grown-ups\' chips shown to a child').toBe(0);
    for (const c of await page.locator('[data-testid^=ask-q-]').all()) { await c.click(); await page.waitForTimeout(120); await look(page, 'ask sheet answer'); }
    await tap(page, 'sheet-close');
    return false;
  };
  await walk(page, 'v1', (s) => s.level?.verse === 1 && s.item === 'reward', { skip: ['reward'], each: meaningExtras });
  await kq(page, 'solve', ['name-sheet']);   // the reward → on: the name sheet comes after pearl 1
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(150);
    if (await page.getByTestId('name-sheet').count()) { await look(page, 'name sheet'); await tap(page, 'profile-later'); break; }
  }
  await page.waitForTimeout(500); await look(page, 'after pearl 1');
  // the pause menu of a level (no gate: a child opens it)
  await kq(page, 'goto', 'verse:2');
  await page.waitForTimeout(400);
  await page.getByTestId('btn-back').first().click({ timeout: 5_000 });
  await look(page, 'pause menu');
  await tap(page, 'btn-resume');
  // verses that bring every mini-game: G1–G8, the radar, both specials (caravan, hats); a replayed verse
  const ds = await kq(page, 'districts');
  const plan: [number, string?][] = [[2], [3, 'mid'], [4], [5, 'strong'], [6], [11], [31], [41], [1]];
  for (const [v, level] of plan) {
    await kq(page, 'learnUpTo', v === 1 ? 3 : v - 1);
    if (level) await kq(page, 'level', level);
    asked = false;
    await kq(page, 'goto', 'verse:' + v);
    await walk(page, 'v' + v, (s) => s.level?.verse === v && s.item === 'reward', { skip: ['reward'], each: meaningExtras });
    await kq(page, 'level', 'easy');
  }
  // a gang challenge with its entrance and every question; the last one (the cave) too
  await kq(page, 'learnUpTo', 7);
  await kq(page, 'goto', 'boss:manfoukh');
  await walk(page, 'boss manfoukh', (s) => s.item === 'boss-done', { skip: ['boss-done'] });
  const last = ds.at(-1);
  // polish, the map (a locked pearl), the necklace and its sheets, stickers, heroes, home, players, the gate
  await kq(page, 'learnUpTo', 9, { due: true });
  await kq(page, 'goto', 'polish');
  await walk(page, 'polish', (s) => s.item === 'polish-done', { skip: ['polish-done'] });
  await kq(page, 'goto', 'polish');   // nothing left to polish
  await page.waitForTimeout(600); await look(page, 'polish empty');
  await kq(page, 'learnUpTo', 12);
  for (const target of ['home', 'map', 'necklace', 'stickers', 'heroes', 'dedication']) { await kq(page, 'goto', target); await page.waitForTimeout(700); await look(page, target); }
  await kq(page, 'goto', 'map');
  await page.waitForTimeout(400);
  for (const id of ['level-1', 'level-20']) { await page.getByTestId(id).first().click({ timeout: 3_000 }).catch(() => {}); await page.waitForTimeout(300); await look(page, 'map ' + id); await page.keyboard.press('Escape'); }
  await kq(page, 'goto', 'necklace');
  await page.waitForTimeout(400);
  for (const id of ['pearl-3', 'pearl-30']) { await tap(page, id); await look(page, 'necklace sheet ' + id); await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
  await tap(page, 'btn-play-all'); await look(page, 'necklace playing'); await tap(page, 'btn-play-all');
  await kq(page, 'goto', 'stickers');
  await page.waitForTimeout(400);
  await page.locator('[data-testid^=sticker-]:not([data-testid=sticker-grid])').first().click().catch(() => {});
  await page.waitForTimeout(300); await look(page, 'sticker sheet'); await page.keyboard.press('Escape');
  for (const tab of await page.locator('[data-testid^=tab-]').all()) { await tab.click(); await page.waitForTimeout(200); await look(page, 'stickers tab'); }
  await kq(page, 'goto', 'home');
  await page.waitForTimeout(500);
  await tap(page, 'home-mishmish'); await look(page, 'home mishmish');
  for (const id of ['btn-grownups', 'btn-about']) { await kq(page, 'goto', 'home'); await page.waitForTimeout(400); await tap(page, id); await page.waitForTimeout(300); await look(page, 'gate via ' + id); }
  expect(await page.locator('.corner, .about-body').count(), 'grown-ups\' pages open without the gate').toBe(0);
  await kq(page, 'goto', 'home'); await page.waitForTimeout(300);
  await page.getByTestId('btn-players').click().catch(() => {}); await page.waitForTimeout(400); await look(page, 'profiles');
  // the last challenge, the finale, the prayer, the medal, the certificate
  await kq(page, 'learnUpTo', 50);
  await kq(page, 'goto', 'boss:' + last.boss);
  await walk(page, 'boss ' + last.boss, (s) => s.screen === 'finale' || s.item === 'boss-done' || s.item === 'finale', { skip: ['boss-done', 'finale'] });
  await kq(page, 'learnUpTo', 51);
  await kq(page, 'goto', 'finale');
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(400); await look(page, 'finale'); }
  for (const target of ['prayer', 'medal', 'cert']) { await kq(page, 'goto', target); await page.waitForTimeout(700); await look(page, target); }
  await page.getByTestId('btn-share').click().catch(() => {}); await page.waitForTimeout(500); await look(page, 'share');

  // every caption the game showed (bubbles come and go between the looks)
  const caps: { key: string; text: string }[] = await kq(page, 'captions');
  const seen: Seen[] = (await page.evaluate(() => [...((window as any).__tk as Map<string, { where: string; via: string }>).entries()].map(([text, v]) => ({ text, ...v })))) as Seen[];
  for (const c of caps) seen.push({ text: c.text, where: 'caption', via: c.key });
  const copy = copyEntries();
  const findings: (Seen & { ratio: number; source: string })[] = [];
  const fine: (Seen & { why: string })[] = [];
  const done = new Set<string>();
  for (const s of seen) {
    for (const line of s.text.split('\n')) {
      const t = line.trim();
      if (letters(t) < 2 || done.has(t)) continue;
      done.add(t);
      const r = ratio(t);
      if (r >= RATIO) continue;
      const ok = FINE.find((f) => f.rx.test(t));
      if (ok) { fine.push({ ...s, text: t, why: ok.why }); continue; }
      findings.push({ ...s, text: t, ratio: Math.round(r * 100) / 100, source: s.where === 'caption' ? 'copy ' + s.via : sourceOf(t, copy) });
    }
  }
  console.log(`tashkeel: ${done.size} Arabic lines looked at, ${findings.length} below ${RATIO}, ${fine.length} fine without marks`);
  for (const f of fine) console.log(`  fine: «${f.text}» (${f.why})`);
  for (const f of findings) console.log(`  [${f.ratio}] «${f.text.slice(0, 90)}» — ${f.source} — ${f.where} / ${f.via}`);
  const pending = findings.filter((f) => PENDING_A1.some((k) => f.source.includes(k + ' ') || f.source.endsWith(k)));
  if (pending.length) console.log(`  ${pending.length} wait for A1 (PENDING_A1)`);
  expect(findings.filter((f) => !pending.includes(f)).map((f) => `«${f.text.slice(0, 60)}» ${f.source}`)).toEqual([]);
  // the walk covers nearly every screen: the console stays clean of warnings too
  console.log('console warnings over the walk:', warnings.length, [...new Set(warnings)].slice(0, 10));
  expect([...new Set(warnings)]).toEqual([]);
  expect(errors).toEqual([]);
});
