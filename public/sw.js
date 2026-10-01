// `scripts/generate-sw-precache.mjs` stamps this on production builds. Keeping
// the source placeholder makes local development deterministic too.
const CACHE_NAME = 'gainslab-pro-__BUILD_ID__';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/favicon-16.png',
  '/assets/branding/logo-mark.png',
  '/assets/branding/logo-lockup.png',
  /* __BUILD_PRECACHE_URLS__ */
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((error) => {
        console.warn('[SW] Precache warning:', error);
      })
    )
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      )
    )
  );
});

const isFirebaseRequest = (url) =>
  url.hostname.includes('firebaseio.com') ||
  url.hostname.includes('googleapis.com') ||
  url.hostname.includes('firestore.googleapis.com') ||
  url.hostname.includes('identitytoolkit');

const shouldCacheResponse = (response) =>
  response &&
  response.status === 200 &&
  (response.type === 'basic' || response.type === 'cors' || response.type === 'opaque');

const shellHandler = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached =
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match('/index.html')) ||
    (await cache.match('/'));

  const networkPromise = fetch(request)
    .then((res) => {
      if (shouldCacheResponse(res)) {
        cache.put('/index.html', res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(null), 3000);
  });

  const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
  if (timeoutId) clearTimeout(timeoutId);

  if (networkResponse) {
    return networkResponse;
  }

  const fallback = (await cache.match('/offline.html')) || (await cache.match('/index.html'));
  return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (shouldCacheResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || new Response('', { status: 504 });
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    isFirebaseRequest(url)
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(shellHandler(request));
    return;
  }

  const isStaticAsset =
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname === 'esm.sh' ||
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname === 'img.youtube.com';

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'GainsLab';
  const body = data.body || 'Rest finished. Ready for the next set.';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'gainslab-timer',
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Open workout' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => client.url.includes(targetUrl) && 'focus' in client);
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) =>
        Promise.all(
          clientList.map((client) => client.postMessage({ type: 'FLUSH_SYNC_QUEUE' }))
        )
      )
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-workouts-data') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) =>
        Promise.all(
          clientList.map((client) => client.postMessage({ type: 'FLUSH_SYNC_QUEUE' }))
        )
      )
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
