/* service-worker.js — KidChronicle offline cache */

const CACHE_NAME = 'kidchronicle-v1';

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
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,400&family=DM+Sans:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
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

