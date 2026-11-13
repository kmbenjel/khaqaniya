#!/usr/bin/env node
// End-to-end check of the built site under its real base path (default /khaqaniya/qasida/), in real Chrome:
//  - every asset URL (html, manifest, sw list, sitemap) resolves under the base, nothing root-absolute leaks
//  - the service worker registers with scope = base; it never touches another app's caches on the shared origin
//  - offline reload works; kashida justification is exact; meanings toggle (per bayt + global); audio plays, caches on play
//  - screenshots desktop 1280x800 and phone 390x844 -> test-shots/
// Run on the VM:  scripts/vm.sh run 'cd site && npm run e2e'     (needs `npm i` once: playwright + esbuild; google-chrome)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(SITE, '..');
const BASE_URL = 'https://benjelloun.dev/khaqaniya';          // the build is made for this, then served on localhost
const BASE = '/khaqaniya/qasida/';
const SHOTS = path.join(SITE, 'test-shots');
let pass = 0, fail = 0;
const ok = (c, m, extra = '') => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.error('  ✗ ' + m + (extra ? '  → ' + extra : '')); } };
const section = (t) => console.log('\n' + t);

// ── build ──────────────────────────────────────────────────────────────────────────
section('build (KQ_BASE=' + BASE_URL + ')');
const env = { ...process.env, KQ_BASE: BASE_URL };
execFileSync('node', [path.join(REPO, 'scripts/gen-site.mjs')], { env, stdio: 'inherit' });
execFileSync('node', [path.join(SITE, 'scripts/build.mjs')], { cwd: SITE, env, stdio: 'inherit' });
const DIST = path.join(SITE, 'dist');

// ── serve like production: <root>/khaqaniya/qasida -> dist, plus a stub "game" at <root>/khaqaniya/ with its own SW ──
const ROOT = path.join(SITE, '.serve');
rmSync(ROOT, { recursive: true, force: true });
mkdirSync(path.join(ROOT, 'khaqaniya'), { recursive: true });
symlinkSync(DIST, path.join(ROOT, 'khaqaniya/qasida'));
writeFileSync(path.join(ROOT, 'khaqaniya/index.html'), `<!doctype html><meta charset=utf-8><title>game</title><script>navigator.serviceWorker.register('/khaqaniya/sw.js',{scope:'/khaqaniya/'})</script>game`);
writeFileSync(path.join(ROOT, 'khaqaniya/sw.js'), `self.addEventListener('install',e=>e.waitUntil(caches.open('kq-game-cache-v1').then(c=>c.put('/khaqaniya/x',new Response('x'))).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));`);
const { server, port, log } = await serve(ROOT);
const ORIGIN = `http://127.0.0.1:${port}`;
const URL_Q = ORIGIN + BASE;

// ── static checks on dist/ ─────────────────────────────────────────────────────────
section('static: URLs under the base');
const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:href|src|data-src)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|data:|mailto:|\.\.\/)/.test(u));
const rootAbs = refs.filter(u => u.startsWith('/'));
ok(rootAbs.length > 5 && rootAbs.every(u => u.startsWith(BASE)), `all ${rootAbs.length} root-absolute asset URLs in index.html start with ${BASE}`, rootAbs.filter(u => !u.startsWith(BASE)).join(' '));
const bad = [];
for (const u of new Set(rootAbs)) { const r = await fetch(ORIGIN + u.replace(/\?.*$/, '')); if (!r.ok) bad.push(u + ' ' + r.status); }
ok(!bad.length, 'each of them answers 200 on the server', bad.join(', '));
const mf = JSON.parse(readFileSync(path.join(DIST, 'site.webmanifest'), 'utf8'));
ok(mf.start_url === BASE && mf.scope === BASE && mf.id === BASE, `manifest start_url/scope/id = ${BASE}`);
ok(mf.icons.every(i => i.src.startsWith(BASE)), 'manifest icons under the base');
const iconBad = []; for (const i of mf.icons) if (!(await fetch(ORIGIN + i.src)).ok) iconBad.push(i.src);
ok(!iconBad.length, 'manifest icons resolve', iconBad.join(', '));
const brandOk = readdirSync(path.join(SITE, 'engine/icons')).every(f => existsSync(path.join(SITE, 'content/icons', f)) && readFileSync(path.join(DIST, 'assets/icons', f)).equals(readFileSync(path.join(SITE, 'content/icons', f))));
ok(brandOk, "every icon shipped is this site's own (shatr demo logo overridden)");
const sw = readFileSync(path.join(DIST, 'sw.js'), 'utf8');
ok(/const PREFIX = 'kq-qasida-'/.test(sw) && /key\.startsWith\(PREFIX\)/.test(sw), 'sw.js: own cache prefix and activate deletes only its own');
const swAssets = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
ok(!swAssets.some(a => /audio\//.test(a)), 'sw precache list has no audio');
const swBad = []; for (const a of swAssets) if (!(await fetch(new URL(a, ORIGIN + BASE + 'sw.js'))).ok) swBad.push(a);
ok(!swBad.length, `all ${swAssets.length} precache URLs resolve against the sw URL`, swBad.join(', '));
const sm = readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
ok(sm.includes(`<loc>${BASE_URL}/qasida/</loc>`), 'sitemap lists ' + BASE_URL + '/qasida/');
ok(html.includes(`rel="canonical" href="${BASE_URL}/qasida/"`) && html.includes(`og:url" content="${BASE_URL}/qasida/"`), 'canonical + og:url on the real host + base');
ok(!existsSync(path.join(DIST, 'CNAME')) && !existsSync(path.join(DIST, 'robots.txt')), 'no CNAME / robots.txt when a base path is set');
ok(/<html[^>]*lang="ar"[^>]*data-base="\/khaqaniya\/qasida\/"/.test(html) || /data-base="\/khaqaniya\/qasida\/"/.test(html), 'html carries data-base');
const jl = JSON.parse(html.match(/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
ok(jl.url === `${BASE_URL}/qasida/`, 'JSON-LD url');
const gameHref = (html.match(/id="link-card-1"/) && html.match(/href="([^"]*)"[^>]*class="resource-card" id="link-card-1"/) || [])[1];
ok(gameHref === '../', 'link card to the game (../ = ' + BASE_URL + '/)', String(gameHref));
ok(/class="credits"/.test(html) && html.includes('يحيى الغوثاني'), 'credits present, recitation credited');

// ── browser ──────────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--disable-blink-features=AutomationControlled'] });
const profiles = [
    { name: 'desktop', opts: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone', opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
];
mkdirSync(SHOTS, { recursive: true });
for (const f of readdirSync(SHOTS)) if (f.endsWith('.png')) rmSync(path.join(SHOTS, f));

for (const { name, opts } of profiles) {
    section(`browser: ${name} ${opts.viewport.width}x${opts.viewport.height}`);
    // app.js skips the service worker for bots (webdriver / "headless" in the UA): present as a normal Chrome
    const ua = `Mozilla/5.0 (${name === 'phone' ? 'Linux; Android 14; Pixel 8' : 'X11; Linux x86_64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} ${name === 'phone' ? 'Mobile ' : ''}Safari/537.36`;
    const ctx = await browser.newContext({ ...opts, locale: 'ar', userAgent: ua });
    const page = await ctx.newPage();
    const errors = [], reqs = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', r => { if (r.url().startsWith(ORIGIN)) reqs.push(new URL(r.url()).pathname); });

    // the "game" registers first, so another app already owns the origin's caches
    await page.goto(ORIGIN + '/khaqaniya/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; await caches.open('kq-qasida-cache-oldversion'); });

    await page.goto(URL_Q);
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    // (navigator.serviceWorker.ready would return the game's registration, which already covers this URL)
    const reg = await page.evaluate(async (scope) => {
        for (let i = 0; i < 100; i++) { const r = await navigator.serviceWorker.getRegistration(scope); if (r && r.active && r.scope === scope) return { scope: r.scope, script: r.active.scriptURL }; await new Promise(f => setTimeout(f, 100)); }
        return null;
    }, URL_Q);
    ok(reg.scope === URL_Q && reg.script === URL_Q + 'sw.js', 'service worker registered with scope = base', JSON.stringify(reg));
    await page.waitForFunction(async () => (await caches.keys()).some(k => /^kq-qasida-cache-[0-9a-f]+$/.test(k)));
    await page.reload(); // now controlled
    await page.waitForFunction((u) => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL === u, URL_Q + 'sw.js');
    const keys = await page.evaluate(() => caches.keys());
    ok(keys.includes('kq-game-cache-v1'), "the game's cache survives our activate", keys.join(','));
    ok(!keys.includes('kq-qasida-cache-oldversion'), 'our own stale cache is removed');
    const ctl = await page.evaluate(() => navigator.serviceWorker.controller.scriptURL);
    ok(ctl === URL_Q + 'sw.js', 'page is controlled by our worker, not the game\'s');
    ok(reqs.every(p => p.startsWith('/khaqaniya/')), 'every request stays under /khaqaniya/');

    const nb = await page.locator('.bayt').count();
    ok(nb >= 3, `${nb} bayts rendered`);
    ok(await page.evaluate(() => [...document.querySelectorAll('.verse')].some(v => v.textContent.includes('ـ'))), 'kashida applied (tatweel present)');
    const gaps = await page.evaluate(() => [...document.querySelectorAll('.bayt')].map(b => {
        const w = [...b.querySelectorAll('.verse')].map(v => { const r = document.createRange(); r.selectNodeContents(v); return r.getBoundingClientRect().width; });
        return Math.abs(w[0] - w[1]);
    }));
    const maxGap = Math.max(...gaps);
    ok(maxGap < 4, 'kashida: both halves of every bayt are equal width', 'max gap ' + maxGap.toFixed(2) + 'px');
    // (the number itself is a CSS counter and cannot be read back; the screenshots show it)
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('main')).counterReset.startsWith('bayt-num') && getComputedStyle(document.querySelector('.poem-section')).counterReset === 'none'), 'bayt counter runs over the whole poem, not per section');
    await page.screenshot({ path: path.join(SHOTS, `${name}-top.png`) });

    await page.locator('#b4').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, `${name}-bayt4.png`) });   // first bayt of section 2 must show the number 4
    await page.evaluate(() => scrollTo(0, 0));
    // meanings
    const m1 = page.locator('.bayt-item').filter({ has: page.locator('[data-bayt-action="meaning"]') }).first();
    const panel = m1.locator('.sharh');
    ok(await panel.isHidden(), 'meaning hidden by default');
    await m1.locator('[data-bayt-action="meaning"]').click();
    ok(await panel.isVisible() && (await m1.locator('[data-bayt-action="meaning"]').getAttribute('aria-expanded')) === 'true', 'per-bayt toggle opens the meaning');
    ok((await panel.locator('.sharh-kid').innerText()).length > 3, 'kid meaning shown first');
    const more = panel.locator('details.sharh-more');
    if (await more.count()) { ok(!(await more.evaluate(d => d.open)), 'adult text collapsed behind «المزيد»'); await more.locator('summary').click(); ok(await more.evaluate(d => d.open), '«المزيد» opens'); }
    // meaning panel is outside .bayt and does not widen the verse grid
    ok(await m1.evaluate(i => !i.querySelector('.bayt .sharh') && i.querySelector('.bayt').children.length === 2), 'panel sits outside the kashida grid');
    const pw = await panel.evaluate(p => ({ p: p.getBoundingClientRect().width, c: p.closest('.poem-section').getBoundingClientRect().width, vw: innerWidth }));
    ok(pw.p <= pw.c + 1 && pw.c <= pw.vw, 'panel fits inside the poem column / viewport', JSON.stringify(pw));
    await m1.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, `${name}-meaning.png`) });
    await m1.locator('[data-bayt-action="meaning"]').click();
    ok(await panel.isHidden(), 'per-bayt toggle closes it again');
    const gaps2 = await page.evaluate(() => [...document.querySelectorAll('.bayt')].map(b => { const w = [...b.querySelectorAll('.verse')].map(v => { const r = document.createRange(); r.selectNodeContents(v); return r.getBoundingClientRect().width; }); return Math.abs(w[0] - w[1]); }));
    ok(Math.max(...gaps2) < 4, 'justification still exact after toggling meanings');
    // global toggle (dock on phone, rail on desktop)
    const gbtn = page.locator(`${name === 'phone' ? '.bottom-dock' : '.controls'} [data-action="toggle-meanings"]`);
    const top = async () => { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(700); };   // rail/dock hide while scrolling down
    await top();
    await gbtn.click();
    const shown = await page.locator('.sharh:visible').count(), total = await page.locator('.sharh').count();
    ok(total > 0 && shown === total && (await gbtn.getAttribute('aria-pressed')) === 'true', `global toggle opens all ${total} meanings`);
    await page.reload();
    ok(await page.locator('.sharh:visible').count() === total, 'global choice is remembered after reload');
    await page.screenshot({ path: path.join(SHOTS, `${name}-all-meanings.png`) });
    await top();
    await gbtn.click();
    ok(await page.locator('.sharh:visible').count() === 0, 'global toggle closes all');

    // audio
    await page.addInitScript(() => {});
    await page.evaluate(() => { window.__plays = []; const A = window.Audio; window.Audio = function (src) { const a = new A(src); a.addEventListener('playing', () => window.__plays.push('playing')); a.addEventListener('ended', () => window.__plays.push('ended')); return a; }; });
    const a1 = page.locator('.bayt-item').filter({ has: page.locator('[data-bayt-action="audio"]') }).first();
    const abtn = a1.locator('[data-bayt-action="audio"]');
    await abtn.click();
    await page.waitForFunction(() => window.__plays.includes('playing'), null, { timeout: 8000 });
    ok(await a1.evaluate(i => i.classList.contains('playing')) && (await abtn.getAttribute('aria-pressed')) === 'true', 'audio button plays the clip and shows the playing state');
    await page.waitForFunction(() => window.__plays.includes('ended'), null, { timeout: 8000 });
    await page.waitForFunction(() => !document.querySelector('.bayt-item.playing'));
    ok(true, 'clip ends and the state resets');
    const cached = await page.evaluate(async () => { const c = await caches.open('kq-qasida-audio'); return (await c.keys()).map(r => new URL(r.url).pathname); });
    ok(cached.length === 1 && /\/khaqaniya\/qasida\/audio\/\d+\.mp3$/.test(cached[0]), 'clip stored in the audio cache on first play', cached.join(','));
    const pre = await page.evaluate(async () => { const out = []; for (const k of await caches.keys()) if (/cache-/.test(k)) out.push(...(await (await caches.open(k)).keys()).map(r => r.url)); return out; });
    ok(!pre.some(u => /\/audio\//.test(u)), 'audio is not in the precache');
    // stop button
    await abtn.click(); await page.waitForFunction(() => document.querySelector('.bayt-item.playing'));
    await abtn.click(); await page.waitForFunction(() => !document.querySelector('.bayt-item.playing'));
    ok(true, 'second click stops playback');

    // offline
    await ctx.setOffline(true);
    await page.reload();
    ok(await page.locator('.bayt').count() === nb, 'offline reload still shows every bayt');
    ok(await page.evaluate(() => [...document.querySelectorAll('.verse')].some(v => v.textContent.includes('ـ'))), 'offline: kashida still applied (app.js + font from cache)');
    const before = await page.evaluate(() => window.__plays?.length || 0);
    await page.evaluate(() => { window.__plays = []; const A = window.Audio; window.Audio = function (s) { const a = new A(s); a.addEventListener('playing', () => window.__plays.push('playing')); return a; }; });
    await page.locator('.bayt-item [data-bayt-action="audio"]').first().click();
    await page.waitForFunction(() => window.__plays && window.__plays.includes('playing'), null, { timeout: 8000 });
    ok(true, 'offline: the clip played before still plays (from the audio cache)');
    await page.waitForFunction(() => !document.querySelector('.bayt-item.playing'), null, { timeout: 8000 });
    await page.screenshot({ path: path.join(SHOTS, `${name}-offline.png`) });
    await ctx.setOffline(false);
    ok(!errors.filter(e => !/Failed to load resource|net::ERR/.test(e)).length, 'no console / page errors', errors.slice(0, 3).join(' | '));
    await ctx.close();
}
await browser.close();
server.close();
console.log(`\n${fail ? '✗' : '✓'} ${pass} passed, ${fail} failed. Screenshots: ${path.relative(REPO, SHOTS)}/`);
process.exit(fail ? 1 : 0);
