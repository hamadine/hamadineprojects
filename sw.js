const CACHE_NAME = "tadaksahak-cache-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data/mots.json",
  "./data/interface-langues.json",
  "./images/idaksahak_round.png",
  "./images/idaksahak_square.png",
  "./images/idaksahak_square_512.png"
];

// Installation du service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() =>
        event.request.destination === "document"
          ? caches.match("./index.html")
          : null
      );
    })
  );
});