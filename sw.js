const CACHE_NAME = 'tadaksahak-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/App.js',
  '/style.css',
  '/data/interface-langue.json',
  '/data/mots.json',
  // Ajoute ici d'autres fichiers à mettre en cache
];

// Installation : met en cache les fichiers essentiels
self.addEventListener('install', event => {
  self.skipWaiting(); // Passe immédiatement à l'état "activate"
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activation : clean les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Stratégie de cache
self.addEventListener('fetch', event => {
  const req = event.request;
  // HTML : network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // Autres : cache-first
    event.respondWith(
      caches.match(req).then(resp => resp || fetch(req))
    );
  }
});

// --- Communication mise à jour ---
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
