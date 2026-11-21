// G6: the build served the way GitHub Pages serves it to Lighthouse: gzip for text (html, js, css, json, svg, xml,
// webmanifest), `Cache-Control: max-age=600`, the game at /khaqaniya/ and the poem site at /khaqaniya/qasida/ (same
// layout as tests/serve.mjs). The test server sends everything uncompressed, which made Lighthouse charge 280 KB of
// Arabic JSON at full size on its slow-4G profile.   node scripts/g6-lhserve.mjs [port]
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRoot } from '../tests/serve.mjs';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = prepareRoot(GAME);
const CT = { '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain' };
const TEXT = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.webmanifest', '.txt']);
const port = Number(process.argv[2] || 4378);
createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let fp = path.normalize(path.join(ROOT, decodeURIComponent(u.pathname)));
  if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
  if (statSync(fp).isDirectory()) {
    if (!u.pathname.endsWith('/')) { res.writeHead(301, { Location: u.pathname + '/' + u.search }); return res.end(); }
    fp = path.join(fp, 'index.html');
    if (!existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
  }
  const ext = path.extname(fp);
  let body = readFileSync(fp);
  const h = { 'Content-Type': CT[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=600' };
  if (TEXT.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body); h['Content-Encoding'] = 'gzip'; h.Vary = 'Accept-Encoding'; }
  h['Content-Length'] = body.length;
  res.writeHead(200, h); res.end(body);
}).listen(port, '127.0.0.1', () => console.log('lighthouse server http://127.0.0.1:' + port + '/khaqaniya/'));
