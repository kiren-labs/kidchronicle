/* service-worker.js — KidChronicle offline cache */

const CACHE_NAME = 'kidchronicle-v2';

// Only local assets in install-time precache.
// Third-party CDN resources (fonts, icons) are cached on first network fetch via the
// fetch handler, avoiding install failures when the CDN is slow or offline.
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/app.css',
  '/css/themes.css',
  '/js/storage.js',
  '/js/profiles.js',
  '/js/logbook.js',
  '/js/reflection.js',
  '/js/points.js',
  '/js/psychology.js',
  '/js/charts.js',
  '/js/export.js',
  '/js/app.js',
  '/assets/data/suggestions.json',
  '/assets/data/reflection-prompts.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Cache-first strategy — serve from cache, fall back to network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        // If both cache and network fail, return nothing gracefully
        return new Response('', { status: 503, statusText: 'Offline' });
      })
  );
});

