#!/usr/bin/env node
// Copies the shared data into public/ (so `vite` serves it and `vite build` ships it), validates the world binding,
// prints the verse table and the copy keys the code uses but design/copy.ar.json lacks, and writes public/FIXTURE
// when any dev fixture stands in for real data (deploy refuses a build that has dist/FIXTURE).
//   node scripts/prepare-data.mjs            (run by `npm run build` / `npm run dev`)
//   KQ_BASE=https://host/path                overrides ../site/hosting.json for robots.txt / sitemap.xml
//   KQ_FORCE_FIXTURES=1                      use the fixtures even when the real files exist
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(GAME, '..');
const PUB = path.join(GAME, 'public');
const OUT = path.join(PUB, 'data');
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const has = (p) => existsSync(p);
const force = process.env.KQ_FORCE_FIXTURES === '1';
const fixture = [];
const warn = [];

rmSync(OUT, { recursive: true, force: true });
rmSync(path.join(PUB, 'audio'), { recursive: true, force: true });
rmSync(path.join(PUB, 'FIXTURE'), { force: true });
mkdirSync(OUT, { recursive: true });

// ── poem ────────────────────────────────────────────────────────────────────────────
let poemPath = path.join(REPO, 'text/khaqaniya.json');
if (force || !has(poemPath)) {
  poemPath = path.join(GAME, 'fixtures/khaqaniya.dev.json');
  if (!has(poemPath)) { console.error('no text/khaqaniya.json and no fixture: run `npm run fixture`'); process.exit(1); }
  fixture.push('text: fixtures/khaqaniya.dev.json (text/khaqaniya.json missing)');
}
const poem = j(poemPath);
const nfc = (s) => (typeof s === 'string' ? s.normalize('NFC') : s);
for (const v of poem.verses) { v.sadr = nfc(v.sadr); v.ajz = nfc(v.ajz); v.rhymeWord = nfc(v.rhymeWord); }
const N = poem.verses.length;

// ── meanings ────────────────────────────────────────────────────────────────────────
let meanPath = path.join(REPO, 'text/meanings.json');
if (force || !has(meanPath)) {
  meanPath = path.join(GAME, 'fixtures/meanings.dev.json');
  fixture.push('meanings: fixtures/meanings.dev.json (text/meanings.json missing)');
}
const meanings = has(meanPath) ? j(meanPath) : { verses: [] };

// ── audio ───────────────────────────────────────────────────────────────────────────
const timingsPath = path.join(REPO, 'audio/timings.json');
const timings = has(timingsPath) ? j(timingsPath) : null;
let audioBytes = 0;
const copyRepoFile = (rel) => {
  const src = path.join(REPO, rel);
  if (!has(src)) return false;
  const dst = path.join(PUB, rel);
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  audioBytes += statSync(src).size;
  return true;
};
if (timings) {
  for (const t of timings.verses) for (const k of ['file', 'sadr', 'ajz']) if (t[k] && !copyRepoFile(t[k])) { warn.push(`audio missing: ${t[k]}`); delete t[k]; }
} else warn.push('audio/timings.json missing: text-only play');
// optional: Laqlaq reading the kid meanings, character voices (GAME_DESIGN §3.2)
const optional = {};
for (const [name, rel] of [['meaningsAudio', 'audio/meanings.json'], ['voice', 'audio/voice/index.json']]) {
  const p = path.join(REPO, rel);
  if (!has(p)) continue;
  const d = j(p);
  const entries = name === 'voice' ? Object.values(d) : d.verses || [];
  for (const e of entries) if (e.file && !copyRepoFile(e.file)) warn.push(`${rel}: missing ${e.file}`);
  optional[name] = d;
}

// ── copy ────────────────────────────────────────────────────────────────────────────
const copyPath = path.join(REPO, 'design/copy.ar.json');
const copy = has(copyPath) ? j(copyPath) : null;
if (!copy) fixture.push('copy: design/copy.ar.json missing (every UI string shows a dev marker)');
const copyKeys = new Set();
const flatten = (o, pre = '') => {
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith('_')) continue;
    const key = pre ? pre + '.' + k : k;
    if (typeof v === 'string' || (v && typeof v === 'object' && ('text' in v || 'say' in v))) copyKeys.add(key);
    else if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key);
  }
};
if (copy) flatten(copy);

// ── world binding (GAME_DESIGN §3.3) ────────────────────────────────────────────────
const world = j(path.join(GAME, 'data/world.json'));
const extras = j(path.join(GAME, 'data/verse-extras.json'));
const art = j(path.join(GAME, 'data/art.json'));
// generated art (game/art, R1): copy only the files the manifest uses into public/art (never ref/, tools/, cache/, raw/,
// and the faceless set only when the flag is on); an id whose file is missing falls back to its SVG (set to null here)
rmSync(path.join(PUB, 'art'), { recursive: true, force: true });
let artBytes = 0;
const artCopy = (rel) => {
  if (!rel || !rel.startsWith('art/')) return false;
  const src = path.join(GAME, rel);
  if (!has(src)) return false;
  const dst = path.join(PUB, rel);
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(src, dst); artBytes += statSync(src).size;
  return true;
};
for (const [id, f] of Object.entries(art.files || {})) {
  if (!f) continue;
  if (id.includes('.faceless') && !art.faceless) { art.files[id] = null; continue; }
  if (!artCopy(f)) { warn.push(`art missing: ${f} (${id} → SVG)`); art.files[id] = null; }
}
for (const [id, f] of Object.entries(art.x2 || {})) {
  if ((id.includes('.faceless') && !art.faceless) || !art.files[id] || !artCopy(f)) delete art.x2[id];
}
console.log(`art: ${Object.values(art.files).filter(Boolean).length} files + ${Object.keys(art.x2 || {}).length} @2x, ${(artBytes / 1e6).toFixed(2)} MB`);
if (artBytes > 3e6) warn.push(`art over the 3 MB budget: ${(artBytes / 1e6).toFixed(2)} MB`);
const ds = world.districts;
let lastTo = ds[ds.length - 1].to;
if (lastTo !== N) { warn.push(`verse count ${N} != world's last district end ${lastTo}: district "${ds[ds.length - 1].id}" absorbs the difference`); }
const sections = poem.sections || [];
const secEnds = new Set(sections.map((s) => s.to));
const longSection = (n) => sections.some((s) => n >= s.from && n < s.to && s.to - s.from + 1 > 8);
const bad = ds.slice(0, -1).filter((d) => !secEnds.has(d.to) && !longSection(d.to));
const binding = bad.length ? 'generic' : 'world';
if (bad.length) warn.push(`world binding fails at district ends ${bad.map((d) => d.id + '@' + d.to).join(', ')}: the game uses the generic builder (§3.3 rule 3). Orchestrator: tell G1 which sections to use.`);

// ── verse table ─────────────────────────────────────────────────────────────────────
const ranges = []; let from = 1;
for (const d of ds) { const to = d === ds[ds.length - 1] ? N : d.to; ranges.push({ id: d.id, from, to }); from = to + 1; }
const strip = (s) => s.replace(/[ً-ٰٟۡـ]/g, '');
const tok = (s) => s.trim().split(/\s+/);
console.log('\n n  | rhymeWord        | district | pictos                      | flags');
for (const v of poem.verses) {
  const e = extras.verses[String(v.n)] || {};
  const d = ranges.find((r) => v.n >= r.from && v.n <= r.to);
  const flags = [];
  const quran = v.quran || e.quran;
  if (quran) flags.push('quran:' + quran.map((q) => q.text || tok(v[q.where]).slice(q.from, q.to + 1).join(' ')).join(' / '));
  if (v.joined || e.joined) flags.push('joined:' + tok(v.sadr).slice(-1)[0] + '|' + tok(v.ajz)[0]);
  if (e.sacred) flags.push('sacred+:' + e.sacred.map((q) => tok(v[q.where]).slice(q.from, q.to + 1).join(' ')).join(' / '));
  if (e.lahnTip) flags.push('lahnTip');
  if (e.countJoke) flags.push('countJoke');
  const boss = ds.find((x) => x.bossVerse === v.n); if (boss) flags.push('boss ' + boss.boss);
  const sp = ds.find((x) => x.special && x.special.verse === v.n); if (sp) flags.push('special ' + sp.special.game);
  const last = tok(v.ajz).slice(-1)[0];
  if (strip(last) !== strip(v.rhymeWord || '')) flags.push('!rhymeWord≠last word');
  if (!/ر[يو]?$/.test(strip(v.rhymeWord || ''))) flags.push('!no ر rhyme');
  console.log(String(v.n).padStart(3) + ' | ' + (v.rhymeWord || '').padEnd(16) + ' | ' + (d ? d.id : '?').padEnd(8) + ' | ' + (e.pictos || []).join(',').padEnd(27) + ' | ' + flags.join('; '));
  if (timings && !timings.verses.find((t) => t.n === v.n)) warn.push(`no timing for verse ${v.n}`);
  if (!meanings.verses.find((m) => m.n === v.n)) warn.push(`no meaning for verse ${v.n}`);
}

// ── copy keys used by the code but missing in copy.ar.json ──────────────────────────
const used = new Set();
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = path.join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f)) {
  const src = readFileSync(p, 'utf8');
  for (const m of src.matchAll(/\b(?:t|tt|say|tPick|sayPick|tSay|has|P_|iconBtn\([^,]+,)\(?\s*'([a-zA-Z][a-zA-Z0-9_.]*[a-zA-Z0-9])'\s*[,)]/g)) if (/\./.test(m[1])) used.add(m[1]);
} } };
walk(path.join(GAME, 'src'));
const pat = j(path.join(GAME, 'data/copy-patterns.json'));
const expand = (p) => {
  let out = [p];
  for (const [name, vals] of Object.entries({ district: ds.map((d) => d.id), boss: ds.map((d) => d.boss), ...pat.sets })) {
    out = out.flatMap((s) => (s.includes('{' + name + '}') ? vals.map((v) => s.replaceAll('{' + name + '}', v)) : [s]));
  }
  return out;
};
for (const p of pat.keys) for (const k of expand(p)) used.add(k);
const prefixOk = (k) => [...copyKeys].some((c) => c.startsWith(k + '.'));   // tPick('fb.right') wants fb.right.1…
const missing = [...used].filter((k) => !copyKeys.has(k) && !prefixOk(k)).sort();
const unused = [...copyKeys].filter((k) => ![...used].some((u) => k === u || k.startsWith(u + '.'))).sort();
writeFileSync(path.join(GAME, 'copy-missing.txt'), missing.join('\n') + (missing.length ? '\n' : ''));

// ── write public/data ───────────────────────────────────────────────────────────────
const out = (name, data) => writeFileSync(path.join(OUT, name), JSON.stringify(data));
out('poem.json', poem);
out('meanings.json', meanings);
if (timings) out('timings.json', timings);
out('copy.json', copy || {});
out('world.json', world);
out('extras.json', extras);
out('art.json', art);
out('credits.json', j(path.join(GAME, 'data/credits.json')));
if (optional.meaningsAudio) out('meanings-audio.json', optional.meaningsAudio);
if (optional.voice) out('voice.json', optional.voice);
const hosting = has(path.join(REPO, 'site/hosting.json')) ? j(path.join(REPO, 'site/hosting.json')) : { base: 'https://benjelloun.dev/khaqaniya' };
const base = (process.env.KQ_BASE || hosting.base).replace(/\/$/, '');
const version = createHash('sha256').update(JSON.stringify([poem, meanings, timings, copy, world, extras, art, optional])).digest('hex').slice(0, 10);
// the media set's hash: the service worker keeps one media cache per set (a re-cut clip at the same URL is fetched again)
const mediaHash = createHash('sha256');
const walkMedia = (d) => { if (!existsSync(d)) return; for (const f of readdirSync(d).sort()) { const p = path.join(d, f); if (statSync(p).isDirectory()) walkMedia(p); else mediaHash.update(path.relative(PUB, p)).update(readFileSync(p)); } };
walkMedia(path.join(PUB, 'audio')); walkMedia(path.join(PUB, 'art'));
const media = mediaHash.digest('hex').slice(0, 10);
out('build.json', { version, media, fixture, binding, base, built: new Date().toISOString().slice(0, 10), files: ['timings.json', 'meanings-audio.json', 'voice.json'].filter((f) => existsSync(path.join(OUT, f))) });
if (fixture.length) writeFileSync(path.join(PUB, 'FIXTURE'), fixture.join('\n') + '\n');
rmSync(path.join(PUB, 'CNAME'), { force: true });
{ const u = new URL(base); if (u.pathname === '/' || u.pathname === '') writeFileSync(path.join(PUB, 'CNAME'), u.hostname + '\n'); }   // a custom (sub)domain at its root
writeFileSync(path.join(PUB, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\nSitemap: ${base}/qasida/sitemap.xml\n`);
writeFileSync(path.join(PUB, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc></url>\n</urlset>\n`);

// ── manifest + html head from copy (fallback: the poem's own title) ───────────────
const ct = (k) => { if (!copy) return null; let o = copy; for (const p of k.split('.')) { if (o && typeof o === 'object' && p in o) o = o[p]; else { o = copy[k]; break; } } return typeof o === 'string' ? o : o && typeof o === 'object' && typeof o.text === 'string' ? o.text : null; };
const appTitle = ct('app.manifest.name') || ct('app.title') || poem.fullTitle || poem.title;
const appShort = ct('app.manifest.short') || ct('app.title.logo') || poem.title;
const appDesc = ct('app.manifest.description') || poem.fullTitle || poem.title;
const mf = j(path.join(GAME, 'manifest.template.json'));
mf.name = appTitle; mf.short_name = appShort; mf.description = appDesc;
writeFileSync(path.join(PUB, 'manifest.webmanifest'), JSON.stringify(mf, null, 1));
out('head.json', { title: appTitle, description: ct('app.meta.description') || appDesc, noscript: ct('app.noscript') || '' });

// ── report ──────────────────────────────────────────────────────────────────────────
console.log(`\n${N} verses · ${sections.length} sections · binding: ${binding} · audio ${(audioBytes / 1e6).toFixed(1)} MB · data version ${version}`);
for (const w of warn) console.warn('WARN ' + w);
if (fixture.length) console.warn('FIXTURE build (public/FIXTURE, deploy refuses it):\n  - ' + fixture.join('\n  - '));
console.log(`copy: ${copyKeys.size} keys in copy.ar.json · ${used.size} keys/prefixes used by the game · ${missing.length} missing (game/copy-missing.txt)` + (copy ? ` · ${unused.length} not used by the game` : ''));
if (copy && missing.length) console.log('  missing: ' + missing.slice(0, 60).join(' ') + (missing.length > 60 ? ' …' : ''));
