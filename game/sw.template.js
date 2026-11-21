// Service worker of the game (generated into dist/sw.js by vite.config.ts; GAME_DESIGN §11, site/README.md).
// Own cache prefix kq-game- (the poem site uses kq-qasida-); never answers anything under /qasida/.
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = 'kq-game-shell-' + VERSION;
// media: one cache per media set (hash of every clip and picture, from the build): a re-cut clip or a new picture at the
// same URL replaces the set; data: one cache per build, so a new shell never reads the old data first
const MEDIA = 'kq-game-media-' + '__MEDIA__';
const DATA = 'kq-game-data-' + VERSION;
const scope = new URL(self.registration.scope);

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    const media = await caches.open(MEDIA);
    const data = await caches.open(DATA);
    const missing = [];
    for (const p of PRECACHE) {
      const url = new URL(p, scope).href;
      const isMedia = /\/(audio|art)\//.test(url);
      const cache = isMedia ? media : /\/data\/[^/]+\.json$/.test(url) ? data : shell;
      if (isMedia && (await media.match(url))) continue;
      try { const r = await fetch(url, { cache: 'reload' }); if (r.ok) await cache.put(url, r); else if (!isMedia) missing.push(p); }
      catch (_) { if (!isMedia) missing.push(p); }   // a clip can come later; the shell and the data cannot
    }
    if (missing.length) {   // install fails, the old worker stays; this version's half-filled caches go (R1/G6)
      await caches.delete(SHELL); await caches.delete(DATA);
      throw new Error('precache incomplete: ' + missing.join(' '));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('kq-game-') && k !== SHELL && k !== MEDIA && k !== DATA) await caches.delete(k);
    await self.clients.claim();
  })());
});

const inScope = (url) => url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
const isPoemSite = (url) => url.pathname.startsWith(scope.pathname + 'qasida/') || url.pathname === scope.pathname + 'qasida';

async function rangeResponse(req, res) {
  const range = req.headers.get('range');
  if (!range || !res) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = buf.byteLength;
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = m && m[2] ? Number(m[2]) : size - 1;
  if (!m || !m[1]) { if (m && m[2]) { start = Math.max(0, size - Number(m[2])); end = size - 1; } }
  end = Math.min(end, size - 1);
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!inScope(url) || isPoemSite(url)) return;                 // the poem site's own worker answers there
  if (url.pathname.startsWith(scope.pathname + 'video/')) return;   // capture-only files (reader timings): always the network
  if (req.mode === 'navigate') {
    // network first, so a new version shows at once; a slow network (lie-fi) never holds the child on the boot lantern:
    // this worker's own shell after 3 s. The shell in the cache is only ever the page precached with this version's
    // files (install): a page from the network is never written into it — a newer page in an older version's cache
    // would boot offline to a blank screen, and a 404 for a mistyped link would replace the game (G6, R1)
    const shellKey = new URL('./', scope).href;
    const isShell = url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html';
    const own = async () => { try { return (await (await caches.open(SHELL)).match(shellKey)) || null; } catch (_) { return null; } };
    const net = fetch(req);
    net.catch(() => null);
    e.respondWith((async () => {
      const cached = isShell ? await own() : null;
      if (!cached) { try { return await net; } catch (_) { return (await own()) || Response.error(); } }
      const late = new Promise((res) => setTimeout(() => res(cached), 3000));
      try { return await Promise.race([net.then((r) => (r.ok ? r : cached)), late]); } catch (_) { return cached; }   // a 5xx: the shell too
    })());
    return;
  }
  const key = url.origin + url.pathname;
  if (/\/audio\//.test(url.pathname) || /\/art\//.test(url.pathname)) {           // media: cache-first, kept across versions
    e.respondWith((async () => {
      const c = await caches.open(MEDIA);
      let r = await c.match(key);
      if (!r) {
        try { r = await fetch(key); } catch (_) { return Response.error(); }
        if (r.ok) { try { await c.put(key, r.clone()); } catch (_) { /* quota: serve it anyway */ } }
      }
      return rangeResponse(req, r.clone ? r.clone() : r);
    })());
    return;
  }
  if (/\/data\/[^/]+\.json$/.test(url.pathname)) {                                  // data: stale-while-revalidate
    e.respondWith((async () => {
      const c = await caches.open(DATA);
      const hit = await c.match(key);
      const net = fetch(key, { cache: 'no-cache' }).then((r) => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
    return;
  }
  e.respondWith((async () => {                                                     // shell: cache-first
    const hit = await caches.match(key, { ignoreSearch: true });
    if (hit) return hit;
    let r;
    try { r = await fetch(req); } catch (_) { return Response.error(); }
    if (r.ok && url.origin === scope.origin) { try { await (await caches.open(SHELL)).put(key, r.clone()); } catch (_) { /* quota: serve it anyway */ } }
    return r;
  })());
});
