const CACHE_NAME = 'gainslab-pro-v16';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
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

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (shouldCacheResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cache.match(request) || cache.match('/index.html') || cache.match('/offline.html') || cache.match('/');
  }
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

  return cached || networkPromise || new Response('', { status: 503 });
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
    event.respondWith(networkFirst(request));
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
