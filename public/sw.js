
const CACHE_NAME = 'ironlog-pro-v6-offline-capable';
const STATIC_ASSETS = [
  '/',
  '/index.html',
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
  self.clients.claim();
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
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. IGNORE: API Calls (Firebase, GenAI) - Let the app logic/SDK handle these
  if (url.origin.includes('googleapis') || url.origin.includes('firestore') || url.origin.includes('firebase')) {
    return; // Network only
  }

  // 2. DEPENDENCIES (esm.sh, images, css, js) -> CACHE FIRST (Stale While Revalidate logic)
  // This is critical for the app to load without internet
  if (
    url.hostname === 'esm.sh' || 
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|woff2)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached file immediately if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache it for next time
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
           // If offline and not in cache, we can't do much for assets
           // But because we cache on first load, this shouldn't happen for core files
        });
      })
    );
    return;
  }

  // 3. NAVIGATION (HTML) -> NETWORK FIRST, FALLBACK TO CACHE
  // Try to get the latest version. If offline, serve the cached app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // OFFLINE FALLBACK: Serve index.html
          return caches.match('/index.html').then(resp => resp || caches.match('/'));
        })
    );
  }
});
