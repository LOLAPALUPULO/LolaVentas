// service-worker.js
const CACHE_NAME = 'lolaventas-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // As it's imported as a module
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://github.com/LOLAPALUPULO/LolaVentas/raw/main/Pitched%20Battle.ttf',
  'https://aistudiocdn.com/react@^19.2.1', // Main entry points for importmap
  'https://aistudiocdn.com/react@^19.2.1/index.js',
  'https://aistudiocdn.com/react-dom@^19.2.1',
  'https://aistudiocdn.com/react-dom@^19.2.1/index.js',
  'https://aistudiocdn.com/firebase@^12.6.0',
  'https://aistudiocdn.com/firebase@^12.6.0/compat/app/index.js',
  'https://aistudiocdn.com/firebase@^12.6.0/compat/firestore/index.js',
  'https://www.soundjay.com/buttons/sounds/button-2.mp3', // Sound for Digital payment
  'https://www.soundjay.com/buttons/sounds/button-7.mp3', // Sound for Billete payment
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache.addAll failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and cleaning old caches.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy: Cache First, then Network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful network responses
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed and no cache match for:', event.request.url, error);
            // Optionally return a fallback page for navigations
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html'); // Fallback to cached index.html
            }
            throw error;
          });
      })
  );
});