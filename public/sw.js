// `scripts/generate-sw-precache.mjs` stamps this on production builds. Keeping
// the source placeholder makes local development deterministic too.
const CACHE_NAME = 'gainslab-pro-__BUILD_ID__';

const CRITICAL_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  /* __BUILD_PRECACHE_URLS__ */
];

const OPTIONAL_PRECACHE_URLS = [
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/favicon-16.png',
  '/assets/branding/logo-mark.png',
  '/assets/branding/logo-lockup.png',
];

const MAX_CACHE_ENTRIES = 120;
const trimCache = async (cache, maxItems) => {
  try {
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      for (const req of toDelete) {
        await cache.delete(req);
      }
    }
  } catch (_) {}
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(CRITICAL_PRECACHE_URLS);
      } catch (error) {
        console.error('[SW] Critical precache failed:', error);
        throw error;
      }

      await Promise.allSettled(
        OPTIONAL_PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[SW] Optional asset skipped:', url, err);
          }
        })
      );
    })
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
        cache.put(request, response.clone()).then(() => trimCache(cache, MAX_CACHE_ENTRIES));
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

  const isSameOriginStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     /\.(png|svg|webp|ico|json|woff2?|css|js)$/i.test(url.pathname));

  if (isSameOriginStatic) {
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
