// Service Worker for PWA Installation & Offline Support
const CACHE_NAME = "pissgo-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through network requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
