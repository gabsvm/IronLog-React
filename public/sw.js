
const CACHE_NAME = 'ironlog-pro-v5-offline';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation Requests (HTML) -> Network First, Fallback to Cache
  // This ensures we try to get the latest version, but if offline, we load the app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the index.html for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // If offline, return cached index.html
          return caches.match(event.request).then(resp => resp || caches.match('/'));
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images) -> Stale While Revalidate
  // Serve from cache immediately, then update cache in background.
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|json)$/) ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => {
            // Swallow offline errors for background fetches
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
