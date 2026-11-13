// shatr test suite — runs on every PR (see .github/workflows/ci.yml).
// Builds the demo poem and asserts the invariants that have regressed before
// (single og:image, hashed app.min.js, valid manifest/JSON-LD, CNAME, no
// placeholder leftovers), then unit-tests the poem/config validators.
// No browser needed: kashida runtime correctness is checked locally by
// `npm run verify` (puppeteer-core). Run: `npm test`.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePoem, checkTashkeel, validateConfig } from '../scripts/validate.mjs';
import { THEMES, DEFAULT_THEME, themeCss, themeNames } from '../scripts/themes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(ROOT, ...p);
const read = (p) => readFileSync(r(p), 'utf8');

const BASE = (() => { const b = (JSON.parse(readFileSync(path.join(ROOT, 'content/poem.config.json'), 'utf8')).basePath || '').replace(/^\/+|\/+$/g, ''); return b ? '/' + b + '/' : '/'; })();
const inDist = (u) => path.join('dist', u.startsWith(BASE) ? u.slice(BASE.length) : u.replace(/^\//, ''));   // URL under the base -> file in dist/
let html = '';
let expectedBayts = 0;

before(async () => {
    await import('../scripts/build.mjs'); // building is a side-effect of import
    html = read('dist/index.html');
    expectedBayts = parsePoem(read('content/poem.txt')).sections.reduce((n, s) => n + s.bayts.length, 0);
});

test('build emits a non-empty index.html with the poem title', () => {
    assert.ok(html.length > 1000, 'index.html too small');
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    assert.ok(title.trim().length > 0, 'empty <title>');
});

test('every bayt in the source renders', () => {
    const rendered = (html.match(/class="bayt"/g) || []).length;
    assert.equal(rendered, expectedBayts, `rendered ${rendered} bayts, expected ${expectedBayts}`);
});

test('exactly one og:image (WhatsApp/Twitter cards break with two)', () => {
    assert.equal((html.match(/property="og:image"/g) || []).length, 1);
});

test('CSP meta present', () => {
    assert.match(html, /http-equiv="Content-Security-Policy"/);
});

test('no unfilled {{placeholders}} leak into output', () => {
    assert.equal((html.match(/{{/g) || []).length, 0);
});

test('app.min.js is content-hashed and the referenced file exists', () => {
    const ref = (html.match(/(\/[^"']*app\.min\.js)\?v=([a-f0-9]{6,})/) || []);
    assert.ok(ref[0], 'no hashed app.min.js reference');
    assert.ok(existsSync(r(inDist(ref[1]))), `referenced ${ref[1]} not in dist/`);
});

test('JSON-LD block is valid JSON', () => {
    const m = html.match(/application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(m, 'no JSON-LD block');
    assert.doesNotThrow(() => JSON.parse(m[1]));
});

test('manifest is linked and valid (name + icons)', () => {
    const href = (html.match(/<link rel="manifest" href="([^"]+)"/) || [])[1];
    assert.ok(href, 'no manifest link');
    const mf = JSON.parse(read(inDist(href)));
    assert.ok(mf.name && Array.isArray(mf.icons) && mf.icons.length, 'manifest missing name/icons');
});

test('the deploy-critical files are all present', () => {
    const atRoot = /^\/?$/.test(JSON.parse(read('content/poem.config.json')).basePath || '');   // under a base path the root site owns CNAME + robots.txt
    for (const f of ['sw.js', 'sitemap.xml', ...(atRoot ? ['robots.txt', 'CNAME'] : [])]) {
        assert.ok(existsSync(r('dist', f)), `missing dist/${f}`);
    }
});

test('print.html exists and is noindexed', () => {
    assert.ok(existsSync(r('dist/print.html')), 'no print.html');
    assert.match(read('dist/print.html'), /content="noindex/);
});

// ---- validators ----

test('parsePoem flags an odd (dangling) shatr', () => {
    const { errors } = parsePoem('شطر أول\nشطر ثان\nشطر بلا قرين');
    assert.ok(errors.some(e => /odd|dangling/i.test(e)), 'no dangling-shatr error');
});

test('parsePoem pairs clean input with no errors', () => {
    const { sections, errors } = parsePoem('## باب\nالشطر الأول\nالشطر الثاني');
    assert.equal(errors.length, 0);
    assert.equal(sections[0].bayts.length, 1);
});

test('checkTashkeel warns on bare text and stays quiet on voweled text', () => {
    const bare = parsePoem('كلام بغير تشكيل هنا\nوهذا شطر اخر بلا ضبط');
    assert.ok(checkTashkeel(bare.sections).length > 0, 'should warn on un-voweled');
    const voweled = parsePoem('دَعِ الأَيَّامَ تَفْعَلُ مَا تَشَاءُ\nوَطِبْ نَفْسًا إِذَا حَكَمَ القَضَاءُ');
    assert.equal(checkTashkeel(voweled.sections).length, 0, 'should not warn on voweled');
});

// ---- themes ----

test('every theme preset is well-formed (light + dark, valid hex)', () => {
    const KEYS = ['bg', 'text', 'title', 'accent', 'card'];
    const hex = /^#[0-9a-fA-F]{6}$/;
    assert.ok(THEMES[DEFAULT_THEME], `default theme "${DEFAULT_THEME}" missing`);
    for (const [name, t] of Object.entries(THEMES)) {
        assert.ok(hex.test(t.themeColor) && hex.test(t.splashColor), `${name}: bad themeColor/splashColor`);
        for (const mode of ['light', 'dark']) {
            assert.ok(t[mode], `${name}.${mode} missing`);
            for (const k of KEYS) assert.ok(hex.test(t[mode][k]), `${name}.${mode}.${k} not a 6-digit hex`);
        }
    }
});

test('themeCss emits :root + dark overrides, and unknown names fall back to default', () => {
    const css = themeCss('sepia');
    assert.match(css, /:root\{[^}]*--bg-color:#f4ecd8/);
    assert.match(css, /html\.dark-mode\{[^}]*--bg-color:#1c1813/);
    assert.equal(themeCss('does-not-exist'), themeCss(DEFAULT_THEME), 'unknown should equal default');
    assert.ok(themeNames().includes(DEFAULT_THEME));
});

test('validateConfig requires the core fields and rejects a URL domain', () => {
    assert.ok(validateConfig({}).length >= 4, 'missing-field errors');
    assert.equal(validateConfig({ title: 't', author: 'a', domain: 'p.example.com', description: 'd' }).length, 0);
    assert.ok(validateConfig({ title: 't', author: 'a', domain: 'https://x.com', description: 'd' })
        .some(e => /bare host/.test(e)), 'should reject URL domain');
});
