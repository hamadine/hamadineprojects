const cacheName = "tadaksahak-v1";

const assets = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./images/idaksahak_square.png", // Ajouté pour cohérence avec le manifest
  "./images/idaksahak_round.png",  // Idem
  "./icon-192.png",                // Si tu utilises bien ces fichiers, sinon retire-les
  "./icon-512.png",
  "./data/mots.json"
  // "./offline.html" // À décommenter si tu ajoutes une page d'erreur offline
];

// INSTALLATION : Mise en cache des fichiers essentiels
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

// ACTIVATION : Nettoyage des anciens caches + prise de contrôle immédiate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH : Réponse via cache d'abord, sinon réseau
self.addEventListener("fetch", event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(res => {
        // Optionnel: page offline personnalisée si res === undefined
        return res || fetch(event.request)/* .catch(() => caches.match('./offline.html')) */;
      })
    );
  }
});
