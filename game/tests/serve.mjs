// Tiny static server for the e2e check: serves a root dir the way GitHub Pages would
// (directory index, 301 for a directory without trailing slash, Range support, correct mime types).
import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const CT = { '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.mp3': 'audio/mpeg',
    '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };

export function serve(root, port = 0) {
    const log = [];
    const server = createServer((req, res) => {
        const u = new URL(req.url, 'http://x');
        let p = decodeURIComponent(u.pathname);
        log.push(p);
        let fp = path.normalize(path.join(root, p));
        if (!fp.startsWith(root) || !existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
        if (statSync(fp).isDirectory()) {
            if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + u.search }); return res.end(); }
            fp = path.join(fp, 'index.html');
            if (!existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
        }
        const size = statSync(fp).size, type = CT[path.extname(fp)] || 'application/octet-stream';
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
        if (range) {
            const a = range[1] ? +range[1] : 0, b = range[2] ? Math.min(+range[2], size - 1) : size - 1;
            res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
            return createReadStream(fp, { start: a, end: b }).pipe(res);
        }
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
        createReadStream(fp).pipe(res);
    });
    return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok({ server, port: server.address().port, log })));
}

// CLI (Playwright webServer): serve like production, game at /khaqaniya/, and at /khaqaniya/qasida/ the real poem site
// (../site/dist) when built, else a stub page with its own service worker.   node tests/serve.mjs [port]
import { mkdirSync, rmSync, symlinkSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export function prepareRoot(GAME) {
  const ROOT = path.join(GAME, '.serve');
  rmSync(ROOT, { recursive: true, force: true });
  const K = path.join(ROOT, 'khaqaniya');
  mkdirSync(K, { recursive: true });
  for (const f of readdirSync(path.join(GAME, 'dist'))) symlinkSync(path.join(GAME, 'dist', f), path.join(K, f));
  // capture `&timings=reader` reads ./video/reader-timings.json: the local server exposes the repo's video/ (never deployed)
  const video = path.resolve(GAME, '../video');
  if (existsSync(video)) symlinkSync(video, path.join(K, 'video'));
  const site = path.resolve(GAME, '../site/dist');
  if (existsSync(path.join(site, 'index.html')) && process.env.KQ_STUB_QASIDA !== '1') symlinkSync(site, path.join(K, 'qasida'));
  else {
    const q = path.join(K, 'qasida');
    mkdirSync(q);
    writeFileSync(path.join(q, 'index.html'), `<!doctype html><meta charset=utf-8><title>qasida</title><body data-qasida="stub">qasida stub<script>navigator.serviceWorker.register('./sw.js',{scope:'./'})</script>`);
    writeFileSync(path.join(q, 'sw.js'), `self.addEventListener('install',e=>e.waitUntil(caches.open('kq-qasida-stub').then(c=>c.add('./')).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match('./')))});`);
  }
  return ROOT;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const ROOT = prepareRoot(GAME);
  const port = Number(process.argv[2] || 4321);
  serve(ROOT, port).then(({ port: p }) => console.log('serving http://127.0.0.1:' + p + '/khaqaniya/'));
}
