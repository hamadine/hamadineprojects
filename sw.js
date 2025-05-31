const CACHE_NAME = "tadaksahak-cache-v2"; // Incrémente à chaque mise à jour !
const URLS_TO_CACHE = [
  "/Tadaksahak-Learning-/",
  "/Tadaksahak-Learning-/index.html",
  "/Tadaksahak-Learning-/style.css",
  "/Tadaksahak-Learning-/app.js",
  "/Tadaksahak-Learning-/data/mots.json",
  "/Tadaksahak-Learning-/data/interface-langue.json",
  "/Tadaksahak-Learning-/images/idaksahak_round.png"
];

// Installation du service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
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
    ).then(() => self.clients.claim())
  );

  // Notifier les pages ouvertes qu'une nouvelle version est disponible
  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: "NEW_VERSION_AVAILABLE" });
    });
  });
});

// Interception des requêtes réseau (offline-first)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).catch(() =>
        event.request.destination === "document"
          ? caches.match("/Tadaksahak-Learning-/index.html")
          : event.request.destination === "image"
            ? caches.match("/Tadaksahak-Learning-/images/idaksahak_round.png")
            : null
      )
    )
  );
});
