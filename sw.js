// ── Milk Logger Service Worker ────────────────────────────────────────────────
// Strategy: Network first, cache fallback.
// On every open, tries to fetch fresh files from the network.
// If offline, falls back to cached version.
// When a new version is detected, activates immediately on next open.

const CACHE_NAME = 'milk-logger-v1.0.14';

const FILES_TO_CACHE = [
  '/milk-logger/milk-logger.html',
  '/milk-logger/manifest.json',
  '/milk-logger/icon-180.png',
  '/milk-logger/icon-192.png',
  '/milk-logger/icon-512.png',
];

// ── Install: cache all files ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activate immediately without waiting for old SW to be released
  self.skipWaiting();
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

// ── Fetch: network first, cache fallback ─────────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle same-origin requests for our cached files
  const url = new URL(event.request.url);
  const isCachedFile = FILES_TO_CACHE.some(f => url.pathname === f);

  if (!isCachedFile) return; // Let other requests (API calls etc.) pass through normally

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Got a fresh response — update the cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});
