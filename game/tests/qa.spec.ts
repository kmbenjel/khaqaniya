import { test, type Page } from '@playwright/test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { open, kq, state, shot, expect, GAME, REPO, Q, trackPlayback, advancedClips } from './helpers';

// Q1 QA: the §13.5 acceptance checklist, item by item (what can be automated). Results go to game/QA.md.

const desktopOnly = (name: string) => test.skip(name !== 'desktop', 'one project is enough');
/** Private names that must never ship, from outside the repo: env KQ_PRIVATE_RX (one regex) or
 *  ~/.config/khaqaniya/private.rx (one regex per line, # comments). null = not configured. */
function privatePatterns(): RegExp[] | null {
  if (process.env.KQ_PRIVATE_RX) return [new RegExp(process.env.KQ_PRIVATE_RX, 'i')];
  const f = path.join(os.homedir(), '.config/khaqaniya/private.rx');
  if (!existsSync(f)) return null;
  const rx = readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => new RegExp(l, 'i'));
  return rx.length ? rx : null;
}

/** Plays the current screen with the test API until `done`, never tapping through the labels in `skip`. */
async function playUntil(page: Page, done: (s: any) => boolean, o: { skip?: string[]; each?: (s: any) => Promise<boolean | void>; max?: number } = {}) {
  for (let i = 0; i < (o.max ?? 3000); i++) {
    const s = await state(page);
    if (done(s)) return s;
    if (process.env.QA_TRACE && i % 50 === 0) console.log('trace', i, s.screen, JSON.stringify(s.level), JSON.stringify(s.boss), s.item, s.learned);
    if (o.each && (await o.each(s))) continue;
    await kq(page, 'solve', o.skip ?? []);
    await page.waitForTimeout(20);
  }
  throw new Error('not reached: ' + JSON.stringify(await state(page)).slice(0, 300));
}

// ── 1. first game within 60 s of the first tap; pearl 1 without reading ─────────────────────────────────────────────
for (const watchIntro of [false, true]) {
  test(`first tap → first game ≤ 60 s, pearl 1 by taps only (intro ${watchIntro ? 'watched' : 'skipped'})`, async ({ page }, info) => {
    test.setTimeout(240_000);
    // real speed, the reciter on, voices off (no voice files yet: captions hold their reading time)
    const errors = await open(page, { capture: 0, speed: 1, recitation: 1, voices: 0, motion: 1 }, '');
    await expect(page.getByTestId('splash')).toBeVisible();
    const t0 = Date.now();
    await page.getByTestId('btn-start').click();
    const marks: Record<string, number> = {};
    await page.evaluate(() => { (window as any).__steps = []; window.addEventListener('kq:step', (e: any) => (window as any).__steps.push([e.detail.step, Math.round(performance.now())])); });
    const pt0 = await page.evaluate(() => performance.now());
    if (!watchIntro) await page.getByTestId('btn-skip').click();
    // the child taps only big buttons and the right answers (solve = one visible tap), never reads
    const s = await playUntil(page, (x) => x.level?.step === 'reward' && x.item === 'reward', { skip: ['reward', 'intro'], max: 4000 });
    const steps: [string, number][] = await page.evaluate(() => (window as any).__steps);
    for (const [k, at] of steps) if (!(k in marks)) marks[k] = Math.round((at - pt0) / 100) / 10;
    marks.total = Math.round((Date.now() - t0) / 100) / 10;
    console.log(`first-pearl timeline (intro ${watchIntro ? 'watched' : 'skipped'}):`, JSON.stringify(marks));
    if (info.project.name === 'phone') await shot(page, `qa-first-pearl-${watchIntro ? 'intro' : 'skip'}`);
    expect(s.learned).toBe(1);                    // the reward is on screen: pearl 1 is on the necklace
    expect(marks.playA).toBeLessThanOrEqual(60);
    expect(errors).toEqual([]);
  });
}

// ── 2. no dead end: every verse with wrong taps first, and with the help lantern only ──────────────────────────────
async function helpReveal(page: Page): Promise<'na' | 'revealed' | 'placed' | 'stuck'> {
  return page.evaluate(async () => {
    const api = (window as any).__kq;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const a0 = api.active();
    const CHOICE = ['g1', 'g3', 'g4', 'g5a', 'g5b', 'g6', 'g8', 'order', 'radar', 's1', 's2'];
    if (!a0 || !a0.right || !a0.wrong || !CHOICE.includes(a0.label)) return 'na';   // next buttons, recite faces: nothing to help with
    const help = document.querySelector('[data-testid=help]') as HTMLElement | null;
    if (!help || help.hidden) return 'stuck';
    for (let k = 0; k < 8; k++) {
      help.click();
      await wait(60);
      const a = api.active();
      if (!a || a.right !== a0.right || !a.right?.isConnected) return 'placed';   // help placed the piece itself
      const r = a.right as HTMLElement;
      if (r.classList.contains('glow')) return 'revealed';
      const sib = [...(r.parentElement?.children || [])].filter((e) => e !== r && e.matches('.opt, .lane, .tile, .piece, .gate-city, .radar-word'));
      const left = sib.filter((e) => !e.matches('.gone, .out, .used, .placed, .right'));
      if (sib.length && !left.length) return 'revealed';                       // only the right one is left
    }
    return 'stuck';
  });
}

const CHUNKS = 6;
for (let c = 0; c < CHUNKS; c++) {
  test(`no dead end (verses chunk ${c + 1}/${CHUNKS}): wrong taps first, then help only`, async ({ page }, info) => {
    desktopOnly(info.project.name);
    test.setTimeout(1_200_000);
    const errors = await open(page, { speed: 100 });
    const n = (await kq(page, 'poem')).length;
    const per = Math.ceil(n / CHUNKS);
    const stuck: string[] = [];
    const helped: Record<string, number> = {};
    for (let v = c * per + 1; v <= Math.min(n, (c + 1) * per); v++) {
      for (const mode of ['wrong', 'help'] as const) {
        await kq(page, 'reset', 42);
        if (v > 1) await kq(page, 'learnUpTo', v - 1);
        await kq(page, 'goto', 'verse:' + v);
        await expect(page.getByTestId('level')).toBeVisible();
        let lastWrongEl = '';
        await playUntil(page, (s) => s.level?.verse === v && s.level?.step === 'reward' && s.item === 'reward', {
          skip: ['reward'], max: 2500,
          each: async (s) => {
            if (!s.item) return false;
            if (mode === 'wrong') {
              const key = s.level?.step + ':' + s.item;
              if (key === lastWrongEl) return false;
              lastWrongEl = key;
              if (!(await page.evaluate(() => !!(window as any).__kq.active()?.wrong))) return false;
              for (let k = 0; k < 3; k++) if (!(await kq(page, 'fail'))) break;
              return false;                                        // then solve
            }
            const r = await helpReveal(page);
            if (r === 'stuck') stuck.push(`v${v} ${s.level?.step} ${s.item}`);
            if (r !== 'na') helped[s.item] = (helped[s.item] || 0) + 1;
            return r === 'placed';                                 // placed: loop again; revealed/na: tap it (solve)
          },
        });
      }
    }
    console.log(`chunk ${c + 1}: help used on`, JSON.stringify(helped), 'stuck:', JSON.stringify([...new Set(stuck)]));
    expect([...new Set(stuck)]).toEqual([]);
    expect(errors).toEqual([]);
  });
}

// ── 3. sizes (§6), clipped harakat (line-height), horizontal scroll — phone 360×740 / 390×844, desktop 1280×720/800 ──
interface Finding { screen: string; what: string; size?: number; lh?: number; text: string }
async function auditLayout(page: Page, screen: string): Promise<Finding[]> {
  return page.evaluate((screen) => {
    const out: { screen: string; what: string; size?: number; lh?: number; text: string }[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) out.push({ screen, what: 'hscroll', text: String(document.documentElement.scrollWidth - vw) });
    const own = (e: Element) => [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent || '').trim().length > 0);
    const visible = (e: Element) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
    for (const e of document.querySelectorAll('body *')) {
      if (!own(e) || !visible(e) || e.closest('[aria-hidden=true], .tap-dot, noscript, script, style, .fixture-build')) continue;
      const cs = getComputedStyle(e);
      const fs = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs;
      const txt = (e.textContent || '').trim().slice(0, 40);
      const cls = (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') || e.tagName.toLowerCase();
      const what = e.tagName.toLowerCase() + cls;
      const verse = /Amiri/.test(cs.fontFamily);
      const marked = /[ً-ْٰۥۦ]/.test(txt);
      const inVerseCard = !!e.closest('.verse-card .hemi');
      const tileLike = !!e.closest('.tile, .opt, .bead, .pearl-word, .slot, .radar-word, .blank, .piece');
      const min = inVerseCard ? 28 : tileLike && verse ? 24 : e.closest('.bubble, .entrance-line, .intro-caption') ? 20 : 16;
      if (fs < min - 0.5) out.push({ screen, what: 'small', size: Math.round(fs * 10) / 10, text: what + ' «' + txt + '» min ' + min });
      if (verse && marked && lh < 1.75) out.push({ screen, what: 'lineheight', size: fs, lh: Math.round(lh * 100) / 100, text: what + ' «' + txt + '»' });
      // text cut by its own box (harakat above/below the line box), e.g. overflow:hidden with a tight height
      if (verse && marked && (cs.overflow === 'hidden' || cs.overflowY === 'hidden') && e.scrollHeight > e.clientHeight + 2) out.push({ screen, what: 'clipped', size: fs, text: what + ' «' + txt + '»' });
      const r = e.getBoundingClientRect();
      if ((r.right > vw + 2 || r.left < -2) && !e.closest('.map-scroll, .lanes, .radar-field')) out.push({ screen, what: 'offscreen', text: what + ' «' + txt + '» ' + Math.round(r.left) + '..' + Math.round(r.right) });
    }
    return out;
  }, screen);
}

const SIZES = [{ w: 360, h: 740 }, { w: 390, h: 844 }, { w: 1280, h: 720 }, { w: 1280, h: 800 }];
for (const vp of SIZES) {
  test(`layout audit ${vp.w}×${vp.h}: §6 sizes, harakat line-height, no horizontal scroll`, async ({ page }, info) => {
    desktopOnly(info.project.name);
    test.setTimeout(600_000);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    const errors = await open(page, { speed: 25 });
    const found: Finding[] = [];
    const tag = `${vp.w}x${vp.h}`;
    const look = async (name: string) => { await page.waitForTimeout(150); found.push(...(await auditLayout(page, name))); };
    for (const target of ['home', 'map', 'necklace', 'stickers', 'heroes', 'about', 'grownups', 'dedication']) {
      if (target === 'necklace') await kq(page, 'learnUpTo', 12);
      await kq(page, 'goto', target);
      await page.waitForTimeout(400);
      await look(target);
    }
    // levels: every step of verses 1–4 (G1, G2, G3, G4, G4r, G5, G6, G7, G8), the reward
    await kq(page, 'reset', 42);
    const seen = new Set<string>();
    for (const v of [1, 2, 3, 4, 41]) {
      if (v > 1) await kq(page, 'learnUpTo', v - 1);
      await kq(page, 'goto', 'verse:' + v);
      await playUntil(page, (s) => s.level?.verse === v && s.item === 'reward', {
        skip: ['reward'], max: 1500,
        each: async (s) => { const k = (s.level?.step || '') + ':' + (s.item || ''); if (s.item && !seen.has(k)) { seen.add(k); await look('v' + v + ' ' + k); if (vp.w === 360) await shot(page, `qa-${tag}-v${v}-${k.replace(':', '-')}`); } return false; },
      });
      await look('v' + v + ' reward');
    }
    // a challenge, polish, the finale screens
    await kq(page, 'learnUpTo', 7);
    await kq(page, 'goto', 'boss:manfoukh');
    await playUntil(page, (s) => s.item === 'boss-done', { skip: ['boss-done'], max: 1500, each: async (s) => { if (s.boss?.q && s.item && !seen.has('b' + s.boss.q)) { seen.add('b' + s.boss.q); await look('boss q' + s.boss.q + ' ' + s.item); } return false; } });
    await look('boss fixed');
    await kq(page, 'learnUpTo', 9, { due: true });
    await kq(page, 'goto', 'polish');
    await playUntil(page, (s) => s.item === 'polish-done', { skip: ['polish-done'], max: 1500, each: async (s) => { if (s.polish && !seen.has('p' + s.polish.i)) { seen.add('p' + s.polish.i); await look('polish ' + s.item); } return false; } });
    for (const target of ['prayer', 'medal', 'cert']) { await kq(page, 'goto', target); await page.waitForTimeout(600); await look(target); await shot(page, `qa-${tag}-${target}`); }
    const uniq = new Map<string, Finding>();
    for (const f of found) uniq.set(f.what + '|' + f.text, f);
    const list = [...uniq.values()];
    console.log(`layout ${tag}: ${list.length} findings`);
    for (const f of list) console.log(`  [${f.what}] ${f.screen} :: ${f.text}${f.size ? ' ' + f.size + 'px' : ''}${f.lh ? ' lh ' + f.lh : ''}`);
    expect(list.filter((f) => f.what === 'hscroll')).toEqual([]);
    expect(list.filter((f) => f.what === 'clipped' || f.what === 'lineheight')).toEqual([]);
    expect(list.filter((f) => f.what === 'small')).toEqual([]);
    expect(errors).toEqual([]);
  });
}

// ── 4. all three sound switches off: every instruction is a caption, every game a banner with an icon ──────────────
test('sound off: instructions as captions, banners with icons', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(300_000);
  // every item, the first time it is met: the banner (icon + title) and the captions shown since the step began
  await page.addInitScript(() => {
    const w = window as any; w.__firsts = {}; let since: string[] = [];
    window.addEventListener('kq:step', () => { since = []; });
    window.addEventListener('kq:say', (e: any) => since.push(e.detail.key));
    window.addEventListener('kq:item', (e: any) => {
      const l = e.detail.label; if (!l || w.__firsts[l]) return;
      const b = document.querySelector('[data-testid=banner]');
      w.__firsts[l] = { icon: !!b?.querySelector('.icon, svg'), title: (b?.querySelector('.banner-title')?.textContent || '').trim(), caps: since.slice(-6), bubble: (document.querySelector('[data-testid=bubble]') as HTMLElement | null)?.innerText || '' };
    });
  });
  const errors = await open(page, { recitation: 0, voices: 0, sfx: 0, speed: 25, motion: 1 });
  for (const v of [1, 2, 3, 4, 11, 31]) {
    if (v > 1) await kq(page, 'learnUpTo', v - 1);
    await kq(page, 'goto', 'verse:' + v);
    await playUntil(page, (s) => s.level?.verse === v && s.item === 'reward', { skip: ['reward'], max: 1500 });
    await shot(page, 'qa-soundoff-v' + v);
  }
  await kq(page, 'learnUpTo', 7); await kq(page, 'goto', 'boss:manfoukh');
  await playUntil(page, (s) => s.item === 'boss-done', { skip: ['boss-done'], max: 1500 });
  const firsts: Record<string, { icon: boolean; title: string; caps: string[]; bubble: string }> = await page.evaluate(() => (window as any).__firsts);
  const GAMES = ['g1', 'g3', 'g4', 'g5a', 'g5b', 'g6', 'g8', 'order', 'radar', 's1', 's2', 'g7-reveal'];
  const missing: string[] = [];
  for (const [l, f] of Object.entries(firsts)) {
    if (!GAMES.includes(l)) continue;
    if (!f.icon || !f.title) missing.push(`${l}: banner icon/title`);
    if (!f.caps.some((k) => /\.how|\.tip|\.mishmish|\.wave2/.test(k))) missing.push(`${l}: no instruction caption (${f.caps.join(',')})`);
  }
  // the "?" in the banner replays the instruction as a caption
  await kq(page, 'learnUpTo', 1); await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.step === 'playA' && s.item === 'order', { skip: ['order', 'reward'] });
  await page.getByTestId('how').click();
  await expect(page.getByTestId('bubble')).toHaveAttribute('data-key', /game\.orderHalves\.how/);
  console.log('sound-off firsts:', Object.entries(firsts).filter(([l]) => GAMES.includes(l)).map(([l, f]) => `${l}=[${f.title}|${f.caps.filter((k) => /how|tip/.test(k)).join(',')}]`).join(' '));
  console.log('sound-off missing:', JSON.stringify(missing));
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});

// ── 5. dates: polish intervals with the clock moved +1/+2/+4/+8 days, and back ─────────────────────────────────────
test('polish intervals 1, 2, 4, 8 days with the clock moved; nothing lost going back', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(300_000);
  await open(page, { speed: 50 });
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.item === 'reward' && s.level?.step === 'reward', { skip: ['reward'] });
  const v1 = async () => (await kq(page, 'store')).profiles[0].verses['1'];
  const dueNow = async () => { const st = await state(page); const v = st.profile.verses['1']; return v.due <= st.today; };
  const log: string[] = [];
  let first = await v1();
  expect(first.box).toBe(1);
  const starsAt0 = first.stars;
  let offset = 0;
  for (const interval of [1, 2, 4, 8]) {
    // one day before it falls due: not dusty
    if (interval > 1) { await kq(page, 'setClock', offset + interval - 1); expect(await dueNow()).toBe(false); }
    offset += interval;
    await kq(page, 'setClock', offset);
    expect(await dueNow()).toBe(true);
    await kq(page, 'goto', 'polish');
    await playUntil(page, (s) => s.item === 'polish-done', { skip: ['polish-done'] });
    const v = await v1();
    const st = await state(page);
    const gap = Math.round((Date.parse(v.due) - Date.parse(st.today)) / 86400000);
    log.push(`+${offset}d: box ${v.box}, next in ${gap} d`);
    expect(gap).toBe([1, 2, 4, 8, 16, 32][v.box - 1]);
    expect(v.stars).toBeGreaterThanOrEqual(starsAt0);
  }
  // back to the real date: nothing is lost, the pearl is simply not due yet
  const before = await v1();
  await kq(page, 'setClock', 0);
  await kq(page, 'goto', 'home');
  const after = await v1();
  expect(after).toEqual(before);
  expect(await dueNow()).toBe(false);
  await expect(page.getByTestId('home')).toBeVisible();
  await kq(page, 'goto', 'polish');
  await expect(page.getByTestId('polish')).toBeVisible();
  await expect(page.locator('.empty')).toBeVisible();          // "nothing to polish", no error
  console.log('polish clock:', log.join(' · '));
  first = after; void first;
});

// ── 6. audio: verse / hemistich clips are the right files (kq:audio vs audio/timings.json); Media Session ───────────
test('audio: clips match audio/timings.json; listen-all sets Media Session', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(600_000);
  const timings = JSON.parse(readFileSync(path.join(REPO, 'audio/timings.json'), 'utf8')).verses as { n: number; file: string; sadr: string; ajz: string }[];
  await page.addInitScript(() => {
    (window as any).__plays = [];
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { (window as any).__plays.push({ src: this.src, t: performance.now() }); return orig.call(this); };
    window.addEventListener('kq:audio', (e: any) => (window as any).__plays.push({ ev: e.detail, t: performance.now() }));
  });
  const errors = await open(page, { recitation: 1, voices: 0, speed: 25 });
  for (const v of [1, 2, 3]) {
    if (v > 1) await kq(page, 'learnUpTo', v - 1);
    await kq(page, 'goto', 'verse:' + v);
    await playUntil(page, (s) => s.level?.verse === v && s.item === 'reward', { skip: ['reward'], max: 3000 });
  }
  const plays: any[] = await page.evaluate(() => (window as any).__plays);
  let checked = 0; const bad: string[] = [];
  for (let i = 0; i < plays.length; i++) {
    const ev = plays[i].ev;
    if (!ev || !['verse', 'sadr', 'ajz'].includes(ev.kind)) continue;
    const next = plays.slice(i + 1, i + 3).find((p) => p.src);
    const tm = timings.find((x) => x.n === ev.id)!;
    const want = ev.kind === 'verse' ? tm.file : tm[ev.kind as 'sadr' | 'ajz'];
    checked++;
    if (!next || !next.src.endsWith(want)) bad.push(`${ev.kind} ${ev.id}: want ${want}, played ${next?.src || 'nothing'}`);
  }
  console.log(`audio: ${checked} clip events checked, ${bad.length} mismatches`, bad.slice(0, 5));
  expect(checked).toBeGreaterThan(20);
  expect(bad).toEqual([]);
  // listen-all: Media Session metadata follows the verse being played
  await kq(page, 'learnUpTo', 3);
  await kq(page, 'goto', 'necklace');
  await page.getByTestId('btn-play-all').click();
  await page.waitForTimeout(1500);
  const ms1 = await page.evaluate(() => ({ title: navigator.mediaSession.metadata?.title, artist: navigator.mediaSession.metadata?.artist, src: [...document.querySelectorAll('audio')].map((a) => a.currentSrc) }));
  const poem = await kq(page, 'poem');
  expect(ms1.title).toBe(poem[0].sadr);
  expect(ms1.artist).toBeTruthy();
  await page.waitForFunction((t) => navigator.mediaSession.metadata?.title === t, poem[1].sadr, { timeout: 30_000 });
  console.log('media session:', ms1.title?.slice(0, 30), '→ verse 2 ok, artist', ms1.artist);
  expect(errors).toEqual([]);
});

// ── 7. keyboard play: verses 1–2 and the first challenge with keys only (Tab, Enter, Space, digits, arrows) ─────────
test('keyboard only: verses 1–2 to the reward', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(400_000);
  const errors = await open(page, { speed: 25 });   // reduced motion: G4 and the radar as still choices (lanes: digits, tested in code)
  const unreachable = new Set<string>();
  const used: Record<string, number> = {};
  const press = async (k: string) => { used[k] = (used[k] || 0) + 1; await page.keyboard.press(k); };
  for (const v of [1, 2]) {
    if (v > 1) await kq(page, 'learnUpTo', 1);
    await kq(page, 'goto', 'verse:' + v);
    for (let guard = 0; guard < 600; guard++) {
      const s = await state(page);
      if (s.level?.verse === v && s.item === 'reward') break;
      if (!s.item) { await page.waitForTimeout(40); continue; }
      // the digit of the right option, when the item shows numbered keys
      const r = await page.evaluate(() => {
        const a = (window as any).__kq.active(); const el = a?.right as HTMLElement | null;
        if (!el || !el.isConnected) return { kind: 'none' };
        const key = el.querySelector('.opt-key')?.textContent || el.getAttribute('aria-keyshortcuts');
        if (key) return { kind: 'digit', key };
        if (el.matches('.lane')) return { kind: 'digit', key: String([...el.parentElement!.querySelectorAll('.lane')].indexOf(el) + 1) };
        if (el.matches('.tile.word')) { const free = [...document.querySelectorAll('.word-tray .tile:not(.used)')]; return { kind: 'digit', key: String(free.indexOf(el) + 1) }; }
        return { kind: 'tab' };
      });
      if (r.kind === 'digit' && r.key && Number(r.key) <= 9) { await press(r.key); await page.waitForTimeout(40); continue; }
      if (r.kind === 'none') { await page.waitForTimeout(40); continue; }
      // otherwise Tab to it and press Enter
      let ok = false;
      for (let k = 0; k < 40; k++) {
        if (await page.evaluate(() => document.activeElement === (window as any).__kq.active()?.right)) { ok = true; break; }
        await press('Tab');
      }
      if (!ok) { unreachable.add(s.item); await kq(page, 'solve'); continue; }
      await press('Enter');
      await page.waitForTimeout(60);
    }
  }
  console.log('keyboard keys used:', JSON.stringify(used), 'not reachable by Tab:', [...unreachable].join(' '));
  expect([...unreachable]).toEqual([]);
  expect(errors).toEqual([]);
});

// ── 8. reduced motion from the OS setting; faceless Amin by default ───────────────────────────────────────────────
test('prefers-reduced-motion: no lanes, no falling words, short animations; Amin with a face by default', async ({ page }, info) => {
  desktopOnly(info.project.name);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(Q({ motion: 1 }).replace('motion=1', '') + '#/');           // no URL override: the OS setting decides
  await page.waitForFunction(() => !!(window as any).__kq);
  expect(await page.evaluate(() => document.documentElement.classList.contains('reduce-motion'))).toBe(true);
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.level?.step === 'playB' && s.item === 'radar', { skip: ['radar', 'reward'] });
  await expect(page.getByTestId('radar-word')).toHaveCount(0);
  await expect(page.locator('.radar-field .opt.word').first()).toBeVisible();
  const anim = await page.evaluate(() => [...document.querySelectorAll('body *')].map((e) => parseFloat(getComputedStyle(e).animationDuration) || 0).reduce((a, b) => Math.max(a, b), 0));
  expect(anim).toBeLessThan(0.01);
  // faces on (owner 2026-11-13, DECISIONS 1): the flag is off by default and Amin is drawn with his simple face
  const art = JSON.parse(readFileSync(path.join(GAME, 'data/art.json'), 'utf8'));
  expect(art.faceless).toBe(false);
  await kq(page, 'goto', 'home');
  await expect(page.locator('.char-amin').first()).toBeVisible();
  expect(await page.locator('.char-amin.faceless').count()).toBe(0);
});

// ── 9. bundle: no key, no surname, no tracker, no request to another origin ─────────────────────────────────────────
test('bundle grep: no key, no surname, no tracker; no other origin over a long session', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(300_000);
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|html|css|json|webmanifest|txt|xml|svg)$/.test(f)) files.push(p); } };
  walk(path.join(GAME, 'dist'));
  const bad: string[] = [];
  const rules: [string, RegExp][] = [
    ['google key', /AIza[0-9A-Za-z_-]{30,}/], ['secret key', /\bsk-[A-Za-z0-9]{20,}/], ['bearer', /Bearer\s+[A-Za-z0-9._-]{20,}/],
    ['tracker', /google-analytics|googletagmanager|gtag\(|plausible\.io|matomo|sentry\.io|hotjar|mixpanel|segment\.(io|com)|clarity\.ms|facebook\.net|doubleclick/i],
    ['live AI endpoint', /generativelanguage\.googleapis|api\.openai|anthropic\.com\/v1/i],
  ];
  // the child's surname: patterns kept outside the repo (this file is published), checked with harakat stripped
  const priv = privatePatterns();
  if (!priv) { console.log('bundle grep: NOTE private-name check skipped (set KQ_PRIVATE_RX or ~/.config/khaqaniya/private.rx); scripts/publish.sh gates the export'); test.info().annotations.push({ type: 'note', description: 'private-name check skipped: no patterns outside the repo' }); }
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    for (const [name, re] of rules) if (re.test(s)) bad.push(`${name} in ${path.relative(GAME, f)}`);
    const bareText = s.replace(/[\u064B-\u0652\u0670\u0640\u06E5\u06E6]/g, '');
    for (const re of priv || []) if (re.test(bareText)) bad.push(`private name (pattern ${priv!.indexOf(re) + 1}) in ${path.relative(GAME, f)}`);
  }
  // fetch/XHR/beacon targets in the code: only relative URLs
  const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
  const abs = [...js.matchAll(/(?:fetch|sendBeacon|open)\(\s*['"`](https?:\/\/[^'"`]+)/g)].map((m) => m[1]);
  expect(abs).toEqual([]);
  console.log(`bundle grep: ${files.length} files, ${bad.length} hits`);
  expect(bad).toEqual([]);
  const foreign: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1'].includes(u.hostname) && !/^(data|blob):/.test(u.protocol)) foreign.push(r.url()); });
  await open(page, { speed: 50, recitation: 1 });
  for (const target of ['home', 'map', 'necklace', 'stickers', 'heroes', 'about', 'grownups', 'dedication']) { await kq(page, 'goto', target); await page.waitForTimeout(300); }
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.item === 'reward', { skip: ['reward'] });
  expect(foreign).toEqual([]);
});

// ── 10. offline after «download everything»: the whole game (every clip in the media cache, a late verse plays) ─────
test('offline after «download everything»: every clip cached, late verses and challenges play', async ({ page, context }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(400_000);
  await trackPlayback(page);
  await page.goto(Q({ fresh: 1 }) + '#/');
  await page.waitForFunction(() => !!(window as any).__kq);
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  await kq(page, 'goto', 'grownups');
  await page.getByTestId('btn-download-all').click();
  const timings = JSON.parse(readFileSync(path.join(REPO, 'audio/timings.json'), 'utf8')).verses as { file: string; sadr: string; ajz: string }[];
  const want = timings.flatMap((t) => [t.file, t.sadr, t.ajz]);
  await page.waitForFunction(async (n) => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none')).keys()).length >= n, want.length, { timeout: 240_000 });
  await expect(page.getByTestId('btn-download-all')).toBeEnabled({ timeout: 60_000 }).catch(() => {});
  const cached: string[] = await page.evaluate(async () => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none')).keys()).map((r) => new URL(r.url).pathname));
  const missing = want.filter((f) => !cached.some((c) => c.endsWith('/' + f)));
  expect(missing).toEqual([]);
  // and every picture of the art manifest (1× and @2x)
  const art = JSON.parse(readFileSync(path.join(GAME, 'dist/data/art.json'), 'utf8'));
  const wantArt = [...Object.values(art.files || {}), ...Object.values(art.x2 || {})].filter(Boolean) as string[];
  await expect.poll(async () => { const c: string[] = await page.evaluate(async () => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none')).keys()).map((r) => new URL(r.url).pathname)); return wantArt.filter((f) => !c.some((x) => x.endsWith('/' + f))); }, { timeout: 120_000 }).toEqual([]);
  console.log(`download everything: ${want.length} clips + ${wantArt.length} pictures cached`);
  await context.setOffline(true);
  await page.goto(Q({ recitation: 1, speed: 25 }) + '#/');
  await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
  await expect(page.getByTestId('home')).toBeVisible();
  const failed: string[] = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  await kq(page, 'learnUpTo', 47);
  await kq(page, 'goto', 'verse:48');
  await expect.poll(() => advancedClips(page), { timeout: 30_000 }).toContainEqual(expect.stringContaining('audio/v/048.mp3'));
  await playUntil(page, (s) => s.item === 'reward', { skip: ['reward'], max: 3000 });
  await kq(page, 'set', { recitation: false });             // the clips played from the cache; the challenge only needs to run
  await kq(page, 'goto', 'boss:khafiyy');
  await playUntil(page, (s) => s.item === 'boss-done', { skip: ['boss-done'], max: 3000 });
  await shot(page, 'qa-offline-all-boss');
  expect(failed.filter((u) => !/qasida/.test(u))).toEqual([]);
  await context.setOffline(false);
});

// ── 11. district 1 offline end to end, challenge included (the reciter off: speed; clip presence checked) ───────────
test('offline after first load: all of district 1 and its challenge', async ({ page, context }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(400_000);
  await page.goto(Q({ fresh: 1 }) + '#/');
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  await page.waitForFunction(async () => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none')).keys()).length >= 21, null, { timeout: 60_000 });
  const timings = JSON.parse(readFileSync(path.join(REPO, 'audio/timings.json'), 'utf8')).verses as { n: number; file: string; sadr: string; ajz: string }[];
  const d1 = (await kq(page, 'districts'))[0];
  const want = timings.filter((t) => t.n >= 1 && t.n <= d1.to).flatMap((t) => [t.file, t.sadr, t.ajz]);
  const cached: string[] = await page.evaluate(async () => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('kq-game-media-')) || 'none')).keys()).map((r) => new URL(r.url).pathname));
  expect(want.filter((f) => !cached.some((c) => c.endsWith('/' + f)))).toEqual([]);
  // district 1's pictures are precached (characters, intro panels, the gate band, its gang member)
  const art = JSON.parse(readFileSync(path.join(GAME, 'dist/data/art.json'), 'utf8')).files as Record<string, string | null>;
  const d1art = Object.entries(art).filter(([id, f]) => f && (/^char\./.test(id) || /^intro\./.test(id) || id === 'district.gate' || id.startsWith('boss.' + d1.boss + '.'))).map(([, f]) => f as string);
  const inCache: string[] = await page.evaluate(async () => { const out: string[] = []; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname); return out; });
  expect(d1art.filter((f) => !inCache.some((c) => c.endsWith('/' + f)))).toEqual([]);
  await context.setOffline(true);
  await page.goto(Q({ speed: 50 }) + '#/');
  await page.waitForFunction(() => !!(window as any).__kq, null, { timeout: 30_000 });
  await kq(page, 'goto', 'verse:1');
  await playUntil(page, (s) => s.screen === 'boss' && s.item === 'boss-done', { skip: ['boss-done'], max: 6000 });
  expect((await state(page)).learned).toBe(d1.to);
  await context.setOffline(false);
});

// ── Q1 round 2: LISTEN has something to do, the intro is tap-through, four cards fit, paws and reward strand ─────
test('round 2: catch the lit word, «next» during the echo of a verse heard before', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 740 });
  await open(page, { speed: 1, recitation: 0, motion: 1 });
  await kq(page, 'learnUpTo', 1);
  await kq(page, 'goto', 'verse:2');
  await page.waitForSelector('.listen-card .w.lit', { timeout: 30_000 });
  await page.locator('.listen-card .w.lit').first().dispatchEvent('pointerdown');
  await expect(page.getByTestId('catch-count')).toBeVisible();
  await expect(page.locator('.catch-n')).toHaveText('1');
  await expect(page.locator('.word-spark')).toHaveCount(1);
  await shot(page, 'qa-r2-listen-catch');
  // first time: no «next» before the echo is over
  await expect(page.getByTestId('echo')).toBeVisible({ timeout: 30_000 });
  expect(await page.getByTestId('btn-next').count()).toBe(0);
  // the same verse again (level left and restarted): «next» is offered while the echo runs
  await kq(page, 'goto', 'map'); await kq(page, 'goto', 'verse:2');
  await expect(page.getByTestId('echo')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('btn-next')).toBeVisible();
  await page.getByTestId('btn-next').click();
  await expect.poll(async () => (await state(page)).level?.step).toBe('meaning');
  const caps: string[] = (await kq(page, 'captions')).map((c: { key: string }) => c.key);
  await page.waitForTimeout(3000);                           // the aborted echo says nothing more
  const after: string[] = (await kq(page, 'captions')).map((c: { key: string }) => c.key);
  expect(after.slice(caps.length).filter((k) => /listen\./.test(k))).toEqual([]);
});

test('round 2: the intro panels go by one tap each, «skip all» stays', async ({ page }, info) => {
  desktopOnly(info.project.name);
  await open(page, { capture: 0, speed: 1 }, '');
  await page.getByTestId('btn-start').click();
  await expect(page.getByTestId('intro')).toBeVisible();
  await expect(page.getByTestId('btn-skip')).toBeVisible();
  const first = await page.getByTestId('intro-caption').textContent();
  await page.getByTestId('btn-panel-next').click();
  await expect(page.getByTestId('intro-caption')).not.toHaveText(first || '');
  for (let i = 0; i < 6 && (await page.getByTestId('intro').count()); i++) { await page.getByTestId('btn-panel-next').click().catch(() => {}); await page.waitForTimeout(400); }
  await expect(page.getByTestId('level')).toBeVisible();     // six taps: the story is over, verse 1 begins
});

test('round 2: four ordering cards fit 360×740 above the cast bar; paws are SVG; the reward strand', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 360, height: 740 });
  await open(page, { speed: 25, recitation: 0 });
  await kq(page, 'learnUpTo', 7);
  await kq(page, 'goto', 'boss:manfoukh');
  // every ordering question with 4+ cards (G2 rung 2: four hemistichs; G9: up to five verse openings), measured as it opens;
  // two seeds so that both kinds come up
  const fits: Record<string, number> = {};
  for (const seed of [42, 7]) {
    await kq(page, 'reset', seed); await kq(page, 'seed', seed); await kq(page, 'learnUpTo', 7);
    await kq(page, 'goto', 'boss:manfoukh');
    await expect(page.getByTestId('boss')).toBeVisible();
    for (let i = 0; i < 800; i++) {
      const s = await state(page);
      if (s.item === 'boss-done') break;
      const slots = await page.locator('.slot').count();
      const key = seed + '-q' + s.boss?.q + '-' + slots + (await page.locator('.slots.chain').count() ? '-chain' : '-halves');
      if (s.item === 'order' && slots >= 4 && !(await page.locator('.piece.placed').count()) && !(key in fits)) {
        await page.waitForTimeout(250);
        fits[key] = await page.evaluate(() => {
          const bar = document.querySelector('.castbar')!.getBoundingClientRect().top;
          return Math.min(...[...document.querySelectorAll('.piece')].map((p) => Math.round(bar - p.getBoundingClientRect().bottom)));
        });
        await shot(page, 'qa-r2-order-' + key);
      }
      await kq(page, 'solve', s.item === 'order' && key in fits || s.item === 'order' && slots < 4 ? ['boss-done'] : ['order', 'boss-done']); await page.waitForTimeout(20);
    }
  }
  console.log('ordering with 4+ cards: px left above the cast bar', JSON.stringify(fits));
  expect(Object.keys(fits).some((k) => k.endsWith('-halves'))).toBe(true);
  expect(Object.keys(fits).some((k) => k.endsWith('-chain'))).toBe(true);
  expect(Math.min(...Object.values(fits))).toBeGreaterThanOrEqual(0);
  // G3's paws are SVG now
  await kq(page, 'reset', 42); await kq(page, 'learnUpTo', 1); await kq(page, 'goto', 'verse:2');
  await playUntil(page, (s) => s.level?.step === 'playB' && s.item === 'g3', { skip: ['g3', 'reward'] });
  await expect(page.locator('.paws svg')).toHaveCount(3);
  expect(await page.locator('.paws').textContent()).toBe('');
  await playUntil(page, (s) => s.item === 'reward', { skip: ['reward'] });
  await expect(page.getByTestId('reward-strand')).toBeVisible();
  await expect(page.locator('.strand-pearl.landed')).toHaveCount(1);
  await shot(page, 'qa-r2-reward-strand');
});

test('round 2: the sardine decoy fires the sardine line of Mishmish (falling and still radar)', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(120_000);
  for (const motion of [0, 1]) {
    await open(page, { speed: motion ? 2 : 25, recitation: 0, motion });
    if (motion) await page.evaluate(() => {   // a quick finger: taps the sardine the moment it starts falling
      setInterval(() => { for (const w of document.querySelectorAll<HTMLElement>('.radar-word:not(.bounce)')) if ((w.textContent || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').includes('سردين')) w.click(); }, 50);
    });
    await kq(page, 'goto', 'verse:1');
    if (motion) {
      let heard = false;
      for (let i = 0; i < 1500 && !heard; i++) {
        heard = (await kq(page, 'captions')).some((c: { key: string }) => c.key === 'game.rhymeRadar.sardine');
        if ((await state(page)).level?.step === 'playC') break;
        if (!heard) { await kq(page, 'solve', ['reward']); await page.waitForTimeout(20); }
      }
      expect(heard).toBe(true);
      continue;
    }
    await playUntil(page, (s) => s.level?.step === 'playB' && s.item === 'radar', { skip: ['radar', 'reward'] });
    const strip = (x: string) => x.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (!motion) {
      const opts = page.locator('.radar-field .opt');
      const n = await opts.count();
      for (let i = 0; i < n; i++) if (strip((await opts.nth(i).textContent()) || '').includes('سردين')) { await opts.nth(i).click(); break; }
    } else {
      // wait for the sardine to fall (the queue is shuffled), tap it
      await page.waitForFunction(() => [...document.querySelectorAll('.radar-word')].some((w) => (w.textContent || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').includes('سردين')), null, { timeout: 60_000 });
      await page.locator('.radar-word').first().click();
    }
    await expect.poll(async () => (await kq(page, 'captions')).map((c: { key: string }) => c.key)).toContain('game.rhymeRadar.sardine');
  }
});

// ── round 2 C (Luna review): service-worker caches carry their versions; an impossible range is a 416 ──────────────
test('round 2 C: versioned data and media caches; range past the end → 416', async ({ page }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(120_000);
  await page.goto(Q({ fresh: 1 }) + '#/');
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  const build = JSON.parse(readFileSync(path.join(GAME, 'dist/data/build.json'), 'utf8'));
  const keys: string[] = await page.evaluate(() => caches.keys());
  expect(keys).toContain('kq-game-media-' + build.media);
  expect(keys.some((k) => /^kq-game-data-[0-9a-f]{12}$/.test(k))).toBe(true);
  expect(keys.some((k) => k === 'kq-game-media-v1' || k === 'kq-game-data-v1')).toBe(false);
  const r = await page.evaluate(async () => { const x = await fetch('./audio/v/001.mp3', { headers: { Range: 'bytes=99999999-' } }); return { s: x.status, cr: x.headers.get('Content-Range') }; });
  expect(r.s).toBe(416);
  expect(r.cr).toMatch(/^bytes \*\/\d+$/);
  const ok = await page.evaluate(async () => (await fetch('./audio/v/001.mp3', { headers: { Range: 'bytes=0-99' } })).status);
  expect(ok).toBe(206);
});

// ── A1's new keys (COPY_REVIEW §8): G2 rung 2–3 title, help label, storage warning, iOS install guidance ──────────
test('copy round: orderHalves.many, help label, storage warning, iOS install line', async ({ page, browser }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(180_000);
  await open(page, { speed: 25 });
  await expect(page.locator('.help-label')).toHaveCount(0);   // home: no cast-bar lantern
  await kq(page, 'learnUpTo', 7); await kq(page, 'goto', 'boss:manfoukh');
  await expect(page.locator('.help-label').first()).toBeVisible();
  let titles = new Set<string>();
  for (let seed of [42, 7]) {
    await kq(page, 'reset', seed); await kq(page, 'seed', seed); await kq(page, 'learnUpTo', 7); await kq(page, 'goto', 'boss:manfoukh');
    for (let i = 0; i < 600; i++) {
      const s = await state(page);
      if (s.item === 'boss-done') break;
      if (s.item === 'order') titles.add(((await page.locator('.slot').count()) >= 4 && !(await page.locator('.slots.chain').count()) ? '4:' : '2:') + (await page.locator('.banner-title').textContent()));
      await kq(page, 'solve', ['boss-done']); await page.waitForTimeout(20);
    }
  }
  console.log('ordering titles:', [...titles].join(' | '));
  expect([...titles].some((x) => x.startsWith('4:أُرَتِّبُ أَنْصَافَ'))).toBe(true);
  // storage blocked: the child sees the warning on home, the grown-ups the detail
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('blocked', 'QuotaExceededError'); }; });
  await p2.goto(Q({ speed: 25 }) + '#/');
  await expect(p2.getByTestId('storage-warn')).toBeVisible();
  await p2.evaluate(() => (window as any).__kq.goto('grownups'));
  await expect(p2.getByTestId('storage-warn-grown')).toBeVisible();
  await expect(p2.getByTestId('install-ios')).toHaveCount(0);   // not iOS
  await ctx.close();
  // iOS Safari, not installed: the install line
  const ios = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1' });
  const p3 = await ios.newPage();
  await p3.goto(Q({ speed: 25 }) + '#/grownups');
  await expect(p3.getByTestId('install-ios')).toBeVisible();
  await expect(p3.getByTestId('storage-warn-grown')).toHaveCount(0);
  await ios.close();
});
