const CACHE_NAME = 'tadaksahak-v1.0.1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js',
  '/data/mots.json', '/data/interface-langue.json',
  '/manifest.webmanifest',

  // Images
  '/images/idaksahak_round.png',
  '/images/idaksahak_square512.png',
  '/images/Gmail.png',
  '/images/whatsapp.png',

  // Fallback
  '/offline.html'
];

// Installation : mise en cache initiale
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie cache-first avec fallback
self.addEventListener('fetch', event => {
  const req = event.request;

  // Pour les pages HTML (navigations)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Pour les ressources statiques (JS, CSS, images, JSON...)
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      });
    }).catch(() => {
      if (req.destination === 'image') {
        return caches.match('/images/idaksahak_square512.png');
      }
    })
  );
});

// Mise à jour immédiate si demandé
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
