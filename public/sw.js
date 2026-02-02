
const CACHE_NAME = 'ironlog-pro-v8-offline-robust';

// Files that MUST be cached immediately during install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force cache critical assets
      return cache.addAll(PRECACHE_URLS).catch(err => console.warn("SW Precache warning:", err));
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
  // This ensures we get updates if online, but app works if offline.
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

  // 2. ASSETS (JS, CSS, Images, Fonts) - Cache First / Stale-While-Revalidate
  // Includes local assets AND external CDNs (esm.sh, google fonts)
  if (
    url.origin === self.location.origin || // Local files
    url.hostname === 'esm.sh' ||           // CDN Dependencies
    url.hostname.includes('fonts') ||
    url.hostname.includes('gstatic')
  ) {
    // Exclude API calls or non-GET requests
    if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
      return;
    }

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        // Return cached response immediately if available
        if (cachedResponse) {
          // Optional: Background update for next time (Stale-While-Revalidate)
          // fetch(event.request).then(netRes => cache.put(event.request, netRes));
          return cachedResponse;
        }

        // If not in cache, fetch from network and cache it
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque') {
            return networkResponse;
          }
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(err => {
           // Network failed and not in cache. Return nothing (image placeholder logic could go here)
           console.warn("SW Fetch failed:", event.request.url);
        });
      })
    );
    return;
  }
});
