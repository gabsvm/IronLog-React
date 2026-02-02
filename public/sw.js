
const CACHE_NAME = 'ironlog-pro-v7-offline';

// Core assets that MUST be present for the app to boot
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/index.css' // Assuming tailwind/css might be extracted here in build
];

// Helper to cache a request
const cacheRequest = async (request, response) => {
  if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
    return;
  }
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (e) {
    // Ignore cache errors (quota, etc)
  }
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We accept that some assets might fail (like external ones), but core must succeed
      return cache.addAll(CORE_ASSETS).catch(err => console.warn("SW: Some assets failed to pre-cache", err));
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

  // 1. NAVIGATION REQUESTS (HTML)
  // Network First -> Fallback to Cache -> Fallback to /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          cacheRequest(event.request, response);
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          // Try exact match first
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          
          // Fallback to app shell
          return cache.match('/index.html') || cache.match('/');
        })
    );
    return;
  }

  // 2. EXTERNAL DEPENDENCIES (esm.sh, fonts, etc) & ASSETS
  // Stale-While-Revalidate Strategy: Serve fast from cache, update in background
  if (
    url.hostname === 'esm.sh' || 
    url.hostname.includes('fonts') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|woff2)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cacheRequest(event.request, networkResponse);
          return networkResponse;
        }).catch(() => null); // Eat errors if offline

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. API CALLS - Network Only (Let the app handle errors)
});
