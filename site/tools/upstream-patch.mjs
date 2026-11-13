#!/usr/bin/env node
// Writes ../docs/shatr-upstream.patch: the engine changes in this site/ as a patch against ~/projects/shatr
// (read-only: shatr is only copied from). Apply in a shatr checkout:  git apply docs/shatr-upstream.patch
// Files compared: the engine + build + tests + schema that this site/ copied from shatr and extended.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHATR = process.env.SHATR_DIR || path.join(process.env.HOME, 'projects/shatr');
const FILES = ['engine/app.js', 'engine/styles.css', 'engine/sw.js', 'engine/template.html', 'engine/manifest.template.json',
    'scripts/build.mjs', 'scripts/validate.mjs', 'schema/poem.config.schema.json', 'schema/bayts.schema.json',
    'test/build.test.mjs', 'test/base-and-bayts.test.mjs'];
const EXTRA = { 'tools/upstream-docs.md': 'docs/base-path-and-bayts.md' };   // site file -> path in shatr

const tmp = mkdtempSync(path.join(tmpdir(), 'shatr-patch-'));
const put = (root, rel, src) => { if (!existsSync(src)) return; mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); copyFileSync(src, path.join(root, rel)); };
for (const f of FILES) { put(path.join(tmp, 'a'), f, path.join(SHATR, f)); put(path.join(tmp, 'b'), f, path.join(SITE, f)); }
for (const [s, d] of Object.entries(EXTRA)) put(path.join(tmp, 'b'), d, path.join(SITE, s));

let out = '';
try { execFileSync('git', ['diff', '--no-index', '--no-color', 'a', 'b'], { cwd: tmp, encoding: 'utf8' }); }
catch (e) { out = e.stdout; }   // exit 1 = differences
out = out.replace(/^diff --git a\/b\//gm, 'diff --git a/');   // new files are compared against nothing: git prints a/<b-path>
out = out.replace(/^(diff --git |--- |\+\+\+ )(.*)$/gm, (m, k, rest) => k + rest.replace(/(^|\s)a\/a\//g, '$1a/').replace(/(^|\s)b\/b\//g, '$1b/'));
const target = path.join(SITE, '../docs/shatr-upstream.patch');
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, out);
console.log(`✓ ${path.relative(path.join(SITE, '..'), target)} (${out.split('\n').length} lines, ${(out.match(/^diff --git/gm) || []).length} files)`);
