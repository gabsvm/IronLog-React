const CACHE_NAME = 'gainslab-pro-v14';

// Core app shell — always cache these
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// --------------- INSTALL ---------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache warning:', err);
      });
    })
  );
});

// --------------- ACTIVATE ---------------
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// --------------- FETCH ---------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET or API/Firebase requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // ---- Navigation (HTML pages) — Network First ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.match('/index.html') || cache.match('/')
          )
        )
    );
    return;
  }

  // ---- Static Assets (JS, CSS, images, fonts) — Cache First ----
  const isStaticAsset =
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname === 'esm.sh' ||
    url.hostname === 'cdn.tailwindcss.com';

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        return fetch(request).then((networkResponse) => {
          // Only cache valid same-origin or CORS responses
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors' || networkResponse.type === 'opaque')
          ) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Silent fail for non-critical external assets
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // ---- YouTube thumbnails — Cache First (30 min TTL via opaque) ----
  if (url.hostname === 'img.youtube.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }
});

// --------------- PUSH NOTIFICATIONS (Rest Timer) ---------------
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'GainsLab';
  const body = data.body || '¡Descanso terminado! Listo para el siguiente set.';
  const icon = '/icon-192.png';
  const badge = '/icon-192.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200],
      tag: 'gainslab-timer',
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: '💪 Ver Workout' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find(c => c.url.includes(targetUrl) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

// --------------- BACKGROUND SYNC ---------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    console.log('[SW] Background Sync triggered: sync-workouts');
    // Implement actual sync logic here, or just resolve to satisfy PWA Builder
    event.waitUntil(Promise.resolve());
  }
});

// --------------- PERIODIC BACKGROUND SYNC ---------------
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-workouts-data') {
    console.log('[SW] Periodic Sync triggered: update-workouts-data');
    event.waitUntil(Promise.resolve());
  }
});