const cacheName = "tadaksahak-v1";

const assets = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./images/idaksahak_round.png",
  "./icon-192.png",
  "./icon-512.png",
  "./data/mots.json"
  // "./offline.html" <-- à ajouter si tu crées une page offline
];

// INSTALLATION : mise en cache des fichiers essentiels
self.addEventListener("install", event => {
  self.skipWaiting(); // ✅ Active immédiatement
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

// ACTIVATION : nettoyage des anciens caches + prise de contrôle
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // ✅ Prend le contrôle de toutes les pages ouvertes
  );
});

// FETCH : réponse par cache ou requête réseau
self.addEventListener("fetch", event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(res => {
        return res || fetch(event.request);
      })
    );
  }
});
