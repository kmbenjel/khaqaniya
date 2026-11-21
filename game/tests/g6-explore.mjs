// G6 polish pass: walk the game's screens in Chrome and WebKit at phone and tablet sizes; collect console errors and
// warnings, page errors, and layout findings the layout audit (qa.spec) does not cover: harakat cut by an *ancestor*
// that clips (overflow / border-radius windows), text wider than its own button or chip, and elements off screen.
//   node tests/g6-explore.mjs [port] [outdir]   (needs `node tests/serve.mjs <port>`; VM only)
// Writes <outdir>/report.json and one PNG per screen and size (outdir default test-shots/g6).
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] || '4378';
const OUT = process.argv[3] || 'test-shots/g6';
const ONLY = process.env.G6_ONLY || '';   // e.g. "chrome:390" to run one combination
mkdirSync(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${PORT}/khaqaniya/`;
const SIZES = [
  { tag: '360', w: 360, h: 740, mobile: true }, { tag: '390', w: 390, h: 844, mobile: true }, { tag: '412', w: 412, h: 915, mobile: true },
  { tag: 'tab', w: 820, h: 1180, mobile: true }, { tag: 'tabL', w: 1180, h: 820, mobile: true },
];

/** In the page: every text node with Arabic marks vs the clip rect of its clipping ancestors; text wider than its box. */
function audit(screen) {
  const out = [];
  const marks = /[ً-ْٰۥۦ]/;
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) out.push({ screen, what: 'hscroll', text: String(document.documentElement.scrollWidth - vw) });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const clipOf = (el) => { const cs = getComputedStyle(el); return cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.contain.includes('paint') || cs.clipPath !== 'none'; };
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const txt = (n.textContent || '').trim();
    if (!txt) continue;
    const el = n.parentElement;
    if (!el || el.closest('[aria-hidden=true], script, style, noscript, .sr-only')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
    if (!rects.length) continue;
    const top = Math.min(...rects.map((x) => x.top)), bottom = Math.max(...rects.map((x) => x.bottom));
    const left = Math.min(...rects.map((x) => x.left)), right = Math.max(...rects.map((x) => x.right));
    const name = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      if (!clipOf(a)) continue;
      const c = a.getBoundingClientRect();
      const acs = getComputedStyle(a);
      // the padding box clips (border excluded)
      const ct = c.top + parseFloat(acs.borderTopWidth), cb = c.bottom - parseFloat(acs.borderBottomWidth);
      const cl = c.left + parseFloat(acs.borderLeftWidth), cr = c.right - parseFloat(acs.borderRightWidth);
      // scrollers are fine when the text is scrolled out of view on purpose; only flag a cut on the visible part
      const scroller = /(auto|scroll)/.test(acs.overflowY + acs.overflowX);
      const cutV = (top < ct - 1 && bottom > ct + 2) || (bottom > cb + 1 && top < cb - 2);
      const cutH = (left < cl - 1 && right > cl + 2) || (right > cr + 1 && left < cr - 2);
      if ((cutV || cutH) && !(scroller && !marks.test(txt))) {
        out.push({ screen, what: marks.test(txt) ? 'clip-marks' : 'clip-text', text: `${name(el)} in ${name(a)} «${txt.slice(0, 30)}» text ${Math.round(top)}..${Math.round(bottom)} clip ${Math.round(ct)}..${Math.round(cb)} h ${Math.round(left)}..${Math.round(right)} / ${Math.round(cl)}..${Math.round(cr)}` });
        break;
      }
    }
    // a label wider than its own button / chip (visible overflow: looks broken)
    const box = el.closest('button, .btn, .chip, .pill-toggle, .tab');
    if (box) {
      const b = box.getBoundingClientRect();
      if (right > b.right + 2 || left < b.left - 2) out.push({ screen, what: 'overflow-btn', text: `${name(el)} in ${name(box)} «${txt.slice(0, 30)}» ${Math.round(left)}..${Math.round(right)} / ${Math.round(b.left)}..${Math.round(b.right)}` });
    }
    if ((right > vw + 2 || left < -2) && !el.closest('.map-scroll, .lanes, .radar-field, .sheet, .tabs')) out.push({ screen, what: 'offscreen', text: `${name(el)} «${txt.slice(0, 30)}» ${Math.round(left)}..${Math.round(right)}` });
  }
  // tap targets: visible buttons smaller than 44 px (WCAG 2.5.8 needs 24; the game's own rule is 56 for children)
  for (const b of document.querySelectorAll('button, a[href], [role=button], input, select')) {
    const r = b.getBoundingClientRect(); const s = getComputedStyle(b);
    if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || b.closest('[aria-hidden=true]')) continue;
    if (r.width < 44 || r.height < 44) out.push({ screen, what: 'small-target', text: `${b.tagName.toLowerCase()}[${b.getAttribute('data-testid') || b.className}] ${Math.round(r.width)}×${Math.round(r.height)}` });
  }
  return out;
}

const findings = [], logs = [];
for (const [bname, type] of [['chrome', chromium], ['webkit', webkit]]) {
  const browser = bname === 'chrome' ? await type.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] }) : await type.launch();
  for (const vp of SIZES) {
    if (ONLY && ONLY !== `${bname}:${vp.tag}`) continue;
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: bname === 'chrome' ? vp.mobile : undefined, hasTouch: true, deviceScaleFactor: 1, locale: 'ar' });
    const p = await ctx.newPage();
    const tag = `${bname}-${vp.tag}`;
    let where = 'boot';
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push({ tag, where, type: m.type(), text: m.text().slice(0, 300) }); });
    p.on('pageerror', (e) => logs.push({ tag, where, type: 'pageerror', text: String(e).slice(0, 300) }));
    const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
    const st = () => p.evaluate(() => { const s = window.__kq.state(); return { item: s.item, step: s.level?.step, q: s.boss?.q, screen: s.screen }; });
    const look = async (name, shoot = true) => {
      where = name;
      await p.waitForTimeout(350);
      findings.push(...(await p.evaluate(audit, name)).map((f) => ({ tag, ...f })));
      if (shoot) await p.screenshot({ path: `${OUT}/${tag}-${name.replace(/[^\w-]+/g, '_')}.png` }).catch(() => {});
    };
    const until = async (pred, skip = [], each) => {
      for (let i = 0; i < 2500; i++) { const s = await st(); if (pred(s)) return s; if (each && (await each(s))) continue; await api('solve', skip); await p.waitForTimeout(20); }
      throw new Error('not reached');
    };
    try {
      // a child's first run: splash (no capture), the story's first panel
      await p.goto(BASE + '?fresh=1&voices=0&recitation=0&sfx=0&seed=7');
      await p.waitForFunction(() => !!window.__kq);
      await look('splash');
      await p.getByTestId('btn-start').click();
      await p.waitForTimeout(900);
      await look('story');
      // capture mode from here (no splash guard), a demo player
      await p.goto(BASE + '?capture=1&voices=0&recitation=0&sfx=0&fresh=1&seed=7&speed=25&motion=0&profile=demo:12#/');
      await p.waitForFunction(() => !!window.__kq);
      for (const target of ['home', 'map', 'necklace', 'stickers', 'heroes', 'grownups', 'about', 'dedication', 'polish']) {
        await api('goto', target); await p.waitForTimeout(500); await look(target);
        if (target === 'stickers') for (const pg of ['districts', 'achievements']) { await p.getByTestId('tab-' + pg).click().catch(() => {}); await look('stickers-' + pg); }
      }
      // verse 13 (new for the demo player): every step and item
      await api('reset', 7);
      const seen = new Set();
      for (const v of [1, 2, 11, 31]) {
        await api('learnUpTo', v - 1);
        await api('goto', 'verse:' + v);
        await until((s) => s.screen === 'verse' && s.item === 'reward', ['reward', 'tomorrow'], async (s) => {
          const k = `${s.step}:${s.item}`;
          if (s.item && !seen.has(k)) { seen.add(k); await look(`v${v}-${k}`, vp.tag === '390' || vp.tag === 'tab' || vp.tag === '360'); }
          if (s.item === 'tomorrow') { await p.getByTestId('tomorrow-ok').click(); return true; }
          return false;
        });
        await p.waitForTimeout(1500);
        await look(`v${v}-reward`);
      }
      await api('learnUpTo', 7);
      await api('goto', 'boss:manfoukh');
      await until((s) => s.item === 'boss-done', ['boss-done'], async (s) => { const k = 'boss' + s.q; if (s.q && !seen.has(k)) { seen.add(k); await look(`boss-q${s.q}-${s.item}`, false); } return false; });
      await look('boss-done');
      for (const target of ['finale', 'prayer', 'medal', 'cert']) { await api('goto', target); await p.waitForTimeout(800); await look(target); }
    } catch (e) { logs.push({ tag, where, type: 'driver', text: String(e).slice(0, 300) }); }
    await ctx.close();
  }
  await browser.close();
}
const uniq = new Map();
for (const f of findings) uniq.set(f.tag.split('-')[0] + '|' + f.what + '|' + f.text.replace(/\d+\.\.\d+.*$/, ''), f);
writeFileSync(`${OUT}/report.json`, JSON.stringify({ findings: [...uniq.values()], logs }, null, 1));
const by = {};
for (const f of uniq.values()) by[f.what] = (by[f.what] || 0) + 1;
console.log('findings', JSON.stringify(by), 'logs', logs.length);
for (const l of logs) console.log(`  [${l.type}] ${l.tag} @${l.where}: ${l.text}`);
