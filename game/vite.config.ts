import { defineConfig, type Plugin } from 'vite';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Writes dist/sw.js: precache = the shell (html, js, css, fonts, icons, manifest), the data files and district 1's audio.
function serviceWorker(): Plugin {
  return {
    name: 'kq-sw',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist');
      const files: string[] = [];
      const walk = (d: string) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else files.push(path.relative(dist, p).split(path.sep).join('/')); } };
      walk(dist);
      const timings = existsSync(path.join(dist, 'data/timings.json')) ? JSON.parse(readFileSync(path.join(dist, 'data/timings.json'), 'utf8')) : { verses: [] };
      const world = JSON.parse(readFileSync(path.join(dist, 'data/world.json'), 'utf8'));
      const firstTo = world.districts[0].to;
      const d1 = new Set<string>(timings.verses.filter((v: { n: number }) => v.n <= firstTo).flatMap((v: Record<string, string>) => [v.file, v.sadr, v.ajz]).filter(Boolean));
      // art: only what district 1 needs offline (characters at 1×, the intro panels, its band and gang member); the rest is
      // cached when a district first shows or by «download everything»
      const art = existsSync(path.join(dist, 'data/art.json')) ? JSON.parse(readFileSync(path.join(dist, 'data/art.json'), 'utf8')) : { files: {} };
      const d0 = world.districts[0];
      const d1art = Object.entries(art.files as Record<string, string | null>).filter(([id, f]) => f && (/^char\./.test(id) || /^intro\./.test(id) || id === 'district.' + (d0.skin || d0.id) || id.startsWith('boss.' + d0.boss + '.'))).map(([, f]) => f as string);
      const pre = files.filter((f) => !/^(sw\.js|FIXTURE|robots\.txt|sitemap\.xml)$/.test(f) && !f.startsWith('audio/') && !f.startsWith('art/') && !f.endsWith('.map') && !f.endsWith('.txt')).concat([...d1], d1art);
      const hash = createHash('sha256');
      for (const f of pre) if (existsSync(path.join(dist, f))) hash.update(f).update(readFileSync(path.join(dist, f)));
      const version = hash.digest('hex').slice(0, 12);
      const list = ['./', ...pre.filter((f) => f !== 'index.html').map((f) => './' + f)];
      const media = (JSON.parse(readFileSync(path.join(dist, 'data/build.json'), 'utf8')).media as string) || 'v1';
      const sw = readFileSync(path.resolve(import.meta.dirname, 'sw.template.js'), 'utf8').replace('__VERSION__', version).replace('__MEDIA__', media).replace('__PRECACHE__', JSON.stringify(list));
      writeFileSync(path.join(dist, 'sw.js'), sw);
      console.log(`sw.js: version ${version}, ${list.length} precached files`);
      if (existsSync(path.join(dist, 'FIXTURE'))) console.warn('dist/FIXTURE present: this build used dev fixtures and must not be deployed');
    },
  };
}

// Title, description and noscript of index.html come from the copy (prepare-data writes public/data/head.json).
function head(): Plugin {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return {
    name: 'kq-head',
    transformIndexHtml(html) {
      const p = path.resolve(import.meta.dirname, 'public/data/head.json');
      const d = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { title: '', description: '', noscript: '' };
      return html.replaceAll('%KQ_TITLE%', esc(d.title)).replaceAll('%KQ_DESC%', esc(d.description)).replaceAll('%KQ_NOSCRIPT%', esc(d.noscript));
    },
  };
}

export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', assetsInlineLimit: 0, sourcemap: false, reportCompressedSize: true },
  plugins: [head(), serviceWorker()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1' },
});
