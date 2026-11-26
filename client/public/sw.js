const CACHE_NAME = 'workcrew-v7';

// Install: Take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: Delete all previous caches to purge old chunk references
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Never use Cache-First for HTML/Navigation.
// HTML navigations MUST ALWAYS be Network-First to guarantee latest chunk hashes.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, backend API routes, and uploaded files
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    return;
  }

  // HTML Page Navigations: ALWAYS Network-First
  if (
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // If completely offline, fall back to cached index.html
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Static Assets (Hashed JS, CSS, SVG, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
