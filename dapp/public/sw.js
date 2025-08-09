// Service Worker for caching static assets
const CACHE_NAME = "tansu-v1";
const STATIC_ASSETS = [
  "/",
  "/logo.svg",
  "/logo-background.png",
  "/manifest.json",
  // Add more critical assets here
];

// Install event - cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener("fetch", (event) => {
  // Only cache GET requests from http/https schemes
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }

  // Cache strategy for different types of requests
  if (event.request.destination === "image") {
    // Images: Cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch((error) => {
                console.warn(
                  "Failed to cache image:",
                  event.request.url,
                  error,
                );
              });
            });
          }
          return response;
        });
      }),
    );
  } else if (
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    // JS/CSS: Network first, then cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch((error) => {
                console.warn(
                  "Failed to cache resource:",
                  event.request.url,
                  error,
                );
              });
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        }),
    );
  }
});
