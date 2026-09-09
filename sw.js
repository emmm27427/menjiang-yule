// 门将娱乐 - Service Worker
// Cache version — bump this when releasing updates
const CACHE_VERSION = 'tcg-assistant-v5';
const CACHE_NAME = CACHE_VERSION;

// Core assets to cache on install
const CORE_ASSETS = [
  './',
  './tcg-assistant.html',
  './manifest.json',
  './icon.svg'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll but ignore individual failures (fonts may be offline)
      return Promise.allSettled(
        CORE_ASSETS.map(url => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests that aren't fonts (e.g., analytics)
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFontRequest = url.hostname.includes('fonts.googleapis.com') ||
                        url.hostname.includes('fonts.gstatic.com');

  if (!isSameOrigin && !isFontRequest) return;

  // Network-first for navigation requests (HTML pages) — ensures latest version
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, clone)
          );
        }
        return networkResponse;
      }).catch(() => {
        // Offline — return cached main page
        return caches.match(event.request).then(cached => cached || caches.match('./tcg-assistant.html'));
      })
    );
    return;
  }

  // Cache-first for everything else (assets, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if available
      if (cachedResponse) {
        // For fonts, also try to update cache in background
        if (isFontRequest) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache =>
                cache.put(event.request, clone)
              );
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // Not in cache — fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, clone)
          );
        }
        return networkResponse;
      }).catch(() => {
        // Offline and not cached — for navigation requests, return cached main page
        if (event.request.mode === 'navigate') {
          return caches.match('./tcg-assistant.html');
        }
      });
    })
  );
});

// Handle messages from the page (for update notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
