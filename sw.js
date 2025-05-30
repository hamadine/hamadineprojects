const CACHE_NAME = "tadaksahak-cache-v1";
const URLS_TO_CACHE = [
  "/Tadaksahak-Learning-/",
  "/Tadaksahak-Learning-/index.html",
  "/Tadaksahak-Learning-/style.css",
  "/Tadaksahak-Learning-/app.js",
  "/Tadaksahak-Learning-/data/mots.json",
  "/Tadaksahak-Learning-/data/interface-langue.json", // <-- adapte bien le nom !
  "/Tadaksahak-Learning-/images/idaksahak_round.png"
  // Enlève les images carrées si tu ne les utilises plus
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
      return (
        response ||
        fetch(event.request).catch(() =>
          event.request.destination === "document"
            ? caches.match("/Tadaksahak-Learning-/index.html")
            : null
        )
      );
    })
  );
});});
