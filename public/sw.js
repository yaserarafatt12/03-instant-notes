// Minimal installable PWA service worker for SeeNote
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through network fetch so live updates always stay fresh
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
