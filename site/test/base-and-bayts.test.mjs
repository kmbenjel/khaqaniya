// basePath, service-worker isolation and the optional per-bayt meaning/audio sidecar.
// Builds a tiny poem into a temp dir (SHATR_CONTENT / SHATR_DIST) so it never touches content/ or dist/.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeBase, parseBayts, validateConfig } from '../scripts/validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'shatr-test-'));
const POEM = ['دَعِ الأَيَّامَ تَفْعَلُ مَا تَشَاءُ', 'وَطِبْ نَفْسًا إِذَا حَكَمَ الْقَضَاءُ', 'وَلَا تَجْزَعْ لِحَادِثَةِ اللَّيَالِي', 'فَمَا لِحَوَادِثِ الدُّنْيَا بَقَاءُ'];

const build = (name, cfg, bayts) => {
    const content = path.join(tmp, name + '-content'), dist = path.join(tmp, name + '-dist');
    mkdirSync(path.join(content, 'audio'), { recursive: true });
    writeFileSync(path.join(content, 'poem.txt'), POEM.join('\n') + '\n');
    writeFileSync(path.join(content, 'poem.config.json'), JSON.stringify({ title: 'اختبار', author: 'مؤلف', description: 'وصف', domain: 'example.org', ...cfg }));
    if (bayts) { writeFileSync(path.join(content, 'bayts.json'), JSON.stringify(bayts)); writeFileSync(path.join(content, 'audio/001.mp3'), 'fake'); }
    execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, env: { ...process.env, SHATR_CONTENT: content, SHATR_DIST: dist }, stdio: 'pipe' });
    const f = (p) => readFileSync(path.join(dist, p), 'utf8');
    return { dist, f, html: f('index.html') };
};

test('normalizeBase', () => {
    assert.equal(normalizeBase(undefined), '/');
    assert.equal(normalizeBase(''), '/');
    assert.equal(normalizeBase('/'), '/');
    assert.equal(normalizeBase('qasida'), '/qasida/');
    assert.equal(normalizeBase('/a/b'), '/a/b/');
    assert.equal(normalizeBase('/a/b/'), '/a/b/');
});

test('validateConfig rejects a bad basePath / signature / cachePrefix', () => {
    const ok = { title: 't', author: 'a', domain: 'x.org', description: 'd' };
    assert.deepEqual(validateConfig({ ...ok, basePath: '/qasida/' }), []);
    assert.ok(validateConfig({ ...ok, basePath: '/a b/' }).length);
    assert.ok(validateConfig({ ...ok, basePath: '//evil' }).length);
    assert.ok(validateConfig({ ...ok, signature: 'sometimes' }).length);
    assert.ok(validateConfig({ ...ok, cachePrefix: 'a b' }).length);
});

test('parseBayts: valid, range, duplicates, missing audio, bad words', () => {
    const good = parseBayts({ bayts: [{ n: 1, kid: 'ك', words: [{ w: 'a', m: 'b' }], more: 'm', audio: 'audio/001.mp3' }, { n: 2, kid: 'ك2' }] }, 2, () => true);
    assert.deepEqual(good.errors, []);
    assert.ok(good.hasMeaning && good.hasAudio && good.byN.get(1).words.length === 1);
    assert.ok(parseBayts({ bayts: [{ n: 3, kid: 'x' }] }, 2).errors.length, 'n out of range');
    assert.ok(parseBayts({ bayts: [{ n: 1 }, { n: 1 }] }, 2).errors.length, 'duplicate');
    assert.ok(parseBayts({ bayts: [{ n: 1, audio: 'audio/x.mp3' }] }, 2, () => false).errors.length, 'missing audio file');
    assert.ok(parseBayts({ bayts: [{ n: 1, audio: '../x.mp3' }] }, 2, () => true).errors.length, 'audio path escapes content/');
    assert.ok(parseBayts({ bayts: [{ n: 1, words: [{ w: 'a' }] }] }, 2).errors.length, 'word without meaning');
    assert.ok(parseBayts({}, 2).errors.length, 'no bayts array');
});

let root, based;
before(() => {
    root = build('root', {});
    based = build('based', { basePath: '/khaqaniya/qasida/', cachePrefix: 'kq-qasida', resources: { links: [{ href: '../', label: 'لعبة', icon: 'game' }] }, credits: { items: [{ label: 'تلاوة', text: 'قارئ' }] } },
        { bayts: [{ n: 1, kid: 'معنى', words: [{ w: 'كلمة', m: 'شرح' }], more: 'تفصيل', audio: 'audio/001.mp3' }, { n: 2, kid: 'معنى ٢' }] });
});

test('default build is unchanged: root URLs, CNAME, robots, no bayt-item', () => {
    assert.match(root.html, /<link rel="manifest" href="\/site\.webmanifest">/);
    assert.match(root.html, /data-base="\/"/);
    assert.ok(existsSync(path.join(root.dist, 'CNAME')) && existsSync(path.join(root.dist, 'robots.txt')));
    assert.ok(!root.html.includes('class="bayt-item"') && !root.html.includes('media-src'));
    assert.equal(JSON.parse(root.f('site.webmanifest')).scope, '/');
    assert.match(root.f('sw.js'), /const PREFIX = 'example-'/);
});

test('basePath: every root-absolute URL is under the base; canonical + sitemap carry it', () => {
    const refs = [...based.html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(m => m[1]);
    assert.ok(refs.length > 5);
    assert.deepEqual(refs.filter(u => !u.startsWith('/khaqaniya/qasida/')), []);
    assert.match(based.html, /rel="canonical" href="https:\/\/example\.org\/khaqaniya\/qasida\/"/);
    assert.match(based.f('sitemap.xml'), /<loc>https:\/\/example\.org\/khaqaniya\/qasida\/<\/loc>/);
    assert.ok(!existsSync(path.join(based.dist, 'CNAME')) && !existsSync(path.join(based.dist, 'robots.txt')), 'root site owns CNAME and robots.txt');
    const mf = JSON.parse(based.f('site.webmanifest'));
    assert.equal(mf.start_url, '/khaqaniya/qasida/'); assert.equal(mf.scope, '/khaqaniya/qasida/');
    assert.ok(mf.icons.every(i => i.src.startsWith('/khaqaniya/qasida/')));
    assert.ok(based.f('sw.js').includes("PREFIX = 'kq-qasida-'"));
    assert.ok(/url\('\/khaqaniya\/qasida\/fonts\//.test(based.html));
    assert.ok(!/\{\{/.test(based.html + based.f('sw.js') + based.f('site.webmanifest')), 'no placeholders left');
});

test('sw.js only deletes caches that start with its own prefix, and never precaches audio', () => {
    const sw = based.f('sw.js');
    assert.match(sw, /key\.startsWith\(PREFIX\)/);
    assert.ok(!/\/audio\//.test(JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]).join()));
});

test('bayts.json: panels sit outside .bayt, ids are global, audio is base-relative and copied', () => {
    assert.equal((based.html.match(/class="bayt-item"/g) || []).length, 2);
    assert.match(based.html, /id="b1"/); assert.match(based.html, /id="b2"/);
    assert.match(based.html, /data-src="\/khaqaniya\/qasida\/audio\/001\.mp3"/);
    assert.ok(existsSync(path.join(based.dist, 'audio/001.mp3')));
    assert.equal((based.html.match(/data-bayt-action="audio"/g) || []).length, 1, 'bayt 2 has no clip, so no audio button');
    assert.equal((based.html.match(/<aside class="sharh"/g) || []).length, 2);
    // .bayt must contain exactly its two .verse children (the kashida pass reads them by index)
    for (const m of based.html.matchAll(/<div class="bayt">([\s\S]*?)<\/div>\s*<\/div>/g)) assert.equal((m[1].match(/class="verse"/g) || []).length, 2);
    assert.ok(!/<div class="bayt">[^]*?class="sharh"[^]*?<\/div>\s*<div class="bayt-tools"/.test(based.html.split('class="bayt-tools"')[0].split('class="bayt"').pop()));
    assert.match(based.html, /<details class="sharh-more"><summary>المزيد<\/summary>/);
    assert.match(based.html, /data-action="toggle-meanings"/);
    assert.match(based.html, /media-src 'self' blob:/);
    assert.match(based.html, /id="link-card-1"/);
    assert.match(based.html, /class="credits"/);
});
