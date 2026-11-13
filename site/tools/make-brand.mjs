#!/usr/bin/env node
// Renders this site's own icons (content/icons/*) and 1200x630 social card (content/social-card.jpg) with Chrome,
// so the PWA never ships the shatr demo's icons. Run on the VM:  npm run icons   (needs playwright + google-chrome).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT = 'file://' + path.join(ROOT, 'fonts/amiri-regular-arabic.woff2');
const OUT = path.join(ROOT, 'content');
mkdirSync(path.join(OUT, 'icons'), { recursive: true });

const GOLD = 'linear-gradient(180deg,#f3e2a6,#c9a24a 55%,#a67c2c)';
const css = `@font-face{font-family:A;src:url('${FONT}')}*{margin:0;box-sizing:border-box}
body{font-family:A,serif;direction:rtl;font-feature-settings:'rlig' 0}  /* Amiri's lam-khah ligature draws a tiny dot: keep the khah clear in logos */
.bg{background:radial-gradient(120% 120% at 30% 15%,#2f6b4f,#173a2b 70%);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center}
.gold{background:${GOLD};-webkit-background-clip:text;background-clip:text;color:transparent;padding:.32em .15em;margin:-.32em 0}
.ring{position:absolute;border:2px solid rgba(243,226,166,.45)}`;
const star = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><g fill="none" stroke="#e6c872" stroke-width="3"><rect x="18" y="18" width="64" height="64"/><rect x="18" y="18" width="64" height="64" transform="rotate(45 50 50)"/></g></svg>`;
const icon = (size, font, radius, safe) => `<div class="bg" style="width:${size}px;height:${size}px;border-radius:${radius}px">
  ${safe ? '' : `<div class="ring" style="inset:${size * .05}px;border-radius:${radius * .8}px"></div>`}
  <div style="margin-bottom:${font * .05}px">${star(font * .5)}</div><div class="gold" style="font-size:${font}px;line-height:1.35">الخاقانية</div></div>`;
const card = `<div class="bg" style="width:1200px;height:630px;gap:10px">
  <div class="ring" style="inset:26px;border-radius:26px"></div>
  <div>${star(90)}</div>
  <div class="gold" style="font-size:190px;line-height:1.3">الخَاقَانِيَّةُ</div>
  <div style="font-size:42px;white-space:nowrap;color:#f1ead0;opacity:.95;text-align:center;line-height:1.7;padding:0 90px">رَائِيَّةُ أَبِي مُزَاحِمٍ الخَاقَانِيِّ فِي القِرَاءَاتِ وَحُسْنِ الأَدَاءِ</div>
  <div style="font-size:34px;color:#c9d8c1;margin-top:6px">النَّصُّ بِالضَّبْطِ التَّامِّ · مَعَانِي الأَبْيَاتِ · التِّلَاوَةُ</div></div>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const shot = async (html, w, h, type = 'png', omit = true) => {
    await page.setViewportSize({ width: w, height: h });
    const f = path.join(mkdtempSync(path.join(tmpdir(), 'brand-')), 'b.html');
    writeFileSync(f, `<!doctype html><meta charset=utf-8><style>${css}body{background:${omit ? 'transparent' : '#000'}}</style>${html}`);
    await page.goto('file://' + f);
    await page.evaluate(() => document.fonts.ready);
    return page.screenshot({ type, omitBackground: omit, ...(type === 'jpeg' ? { quality: 84 } : {}) });
};
const png = {};
png['icon-512.png'] = await shot(icon(512, 112, 110), 512, 512);
// render once at 512 then downscale with the browser for crisp 192/180/64/48/32/16
const big = png['icon-512.png'].toString('base64');
const scaled = async (px) => shot(`<img src="data:image/png;base64,${big}" width="${px}" height="${px}" style="display:block">`, px, px);
png['icon-192.png'] = await scaled(192);
png['apple-touch-icon.png'] = await shot(`<div style="width:180px;height:180px">${icon(180, 40, 0)}</div>`, 180, 180, 'png', false);
png['icon-maskable-512.png'] = await shot(icon(512, 90, 0, true), 512, 512, 'png', false);
for (const s of [16, 32, 48, 64]) png[`p${s}`] = await scaled(s);
png['favicon-16x16.png'] = png.p16; png['favicon-32x32.png'] = png.p32;
writeFileSync(path.join(OUT, 'social-card.jpg'), await shot(card, 1200, 630, 'jpeg', false));
await browser.close();

for (const [name, buf] of Object.entries(png)) if (name.endsWith('.png') && !/^p\d+$/.test(name)) writeFileSync(path.join(OUT, 'icons', name), buf);
// favicon.svg wraps a 64px png (a real svg glyph would need the font); favicon.ico = png-in-ico 16/32/48
writeFileSync(path.join(OUT, 'icons/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${png.p64.toString('base64')}"/></svg>\n`);
const imgs = [png.p16, png.p32, png.p48], dims = [16, 32, 48];
const head = Buffer.alloc(6 + 16 * imgs.length); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let off = head.length;
imgs.forEach((b, i) => { const o = 6 + 16 * i; head[o] = dims[i]; head[o + 1] = dims[i]; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(off, o + 12); off += b.length; });
writeFileSync(path.join(OUT, 'icons/favicon.ico'), Buffer.concat([head, ...imgs]));
console.log('✓ brand written to content/icons and content/social-card.jpg');
