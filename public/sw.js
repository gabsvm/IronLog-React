const CACHE_NAME = 'ironlog-pro-v9-robust';

// ONLY cache the absolute essentials for the app shell.
// Removing specific icon paths prevents the entire SW from failing 
// if a single image file is missing or 404s.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg' 
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force cache critical assets. 
      // If any of these fail, the SW won't install. 
      // We keep this list minimal for stability.
      return cache.addAll(PRECACHE_URLS).catch(err => {
          console.warn("SW Precache warning - continuing anyway:", err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim(); // Take control of open pages immediately
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Cleaning old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NAVIGATION (HTML) - Network First, Fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.match('/index.html') || cache.match('/');
          });
        })
    );
    return;
  }

  // 2. ASSETS - Cache First
  if (
    url.origin === self.location.origin || 
    url.hostname === 'esm.sh' ||           
    url.hostname.includes('fonts') ||
    url.hostname.includes('gstatic')
  ) {
    if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
      return;
    }

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque') {
            return networkResponse;
          }
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
           // Silent fail for non-critical assets
        });
      })
    );
    return;
  }
});