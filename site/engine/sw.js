const CACHE_NAME = '{{CACHE_NAME}}';
const PREFIX = '{{CACHE_PREFIX}}';          // every cache this worker owns starts with this
const AUDIO_CACHE = PREFIX + 'audio';       // clips cached on first play; survives version bumps
const ASSETS = {{ASSETS}};

// Install Service Worker and cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: delete only OUR old caches. The origin may be shared with other apps
// (a game, another poem), so a cache that does not start with PREFIX is never touched.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(PREFIX) && key !== CACHE_NAME && key !== AUDIO_CACHE)
        .map((key) => {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        })
    )).then(() => self.clients.claim())
  );
});

const scopePath = new URL(self.registration.scope).pathname;

// Fetch event - Network-First for HTML, Cache-First for static assets,
// Cache-on-play for audio (never precached, so the install stays light).
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Never touch anything outside our own scope (other apps share the origin)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) {
    return;
  }

  // Do not intercept tracking/analytics requests to avoid Service Worker errors
  if (
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('analytics') ||
    url.pathname.includes('/collect')
  ) {
    return;
  }

  // Audio clips: cache-first from AUDIO_CACHE, store full 200 responses on first fetch.
  // (The page fetches the whole clip and plays it from a blob, so no Range handling is needed.)
  if (url.pathname.startsWith(scopePath + 'audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((hit) => hit || fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(event.request, response.clone());
          }
          return response;
        }))
      ).catch(() => Response.error())
    );
    return;
  }

  // HTML (page navigations, index.html): Network-First, fall back to the cache offline
  if (event.request.mode === 'navigate' || url.pathname === scopePath || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) => cache.match(event.request, { ignoreSearch: true }))
            .then((hit) => hit || caches.open(CACHE_NAME).then((cache) => cache.match(scopePath)))
        )
    );
  } else {
    // For static assets (fonts, images, icons, manifest), use Cache-First (Offline-first)
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => cache.match(event.request)).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache newly fetched requests on the fly (same-origin 'basic' responses only)
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => {
            // Handle fetch failures (like offline or aborted requests) gracefully
            return Response.error();
          });
      })
    );
  }
});
