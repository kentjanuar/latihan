const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ...');
  // Precache essential assets
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('[Service Worker] Precaching App Shell');
      return cache.addAll([
        '/index.html',
        '/src/js/app.js',
        '/src/css/app.css',
        '/offline.html',
        // etc...
      ]);
    })
  );
  self.skipWaiting(); // if you want the new SW to activate immediately
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker ...');
  event.waitUntil(
    // Optionally remove old caches
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  // Ensure this SW is the controlling one
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // If we have it in cache, return it
        return cachedResponse;
      }
      // Otherwise, fetch from network and dynamically cache
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
          cache.put(event.request.url, networkResponse.clone());
          return networkResponse;
        });
      }).catch(err => {
        // If network fetch fails, optionally serve offline fallback
        return caches.match('/offline.html');
      });
    })
  );
});
