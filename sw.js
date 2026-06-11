// VocRussian Progressive Web App Service Worker
const CACHE_NAME = "voc-russian-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./css/styles.css",
  "./js/app.js",
  "./js/audio.js",
  "./js/db.js",
  "./js/db_expanded.js",
  "./js/srs.js",
  "./js/supabase.js"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Offline Fallback)
self.addEventListener("fetch", (event) => {
  // Avoid interception for third-party API calls (like Wiktionary) so that they get live updates
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache newly requested local items dynamically if needed
        return response;
      });
    })
  );
});
