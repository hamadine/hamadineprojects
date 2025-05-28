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
  // "./stylelintrc.JSON"  <-- Probablement inutile ici (explication ci-dessous)
];

// INSTALLATION : mise en cache des fichiers essentiels
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// ACTIVATION : nettoyage des anciens caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    })
  );
});

// FETCH : réponse par cache ou requête réseau
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request);
    })
  );
});