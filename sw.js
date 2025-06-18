const CACHE_NAME = 'tadaksahak-v1.0.1';
const ASSETS = [
  '/', '/index.html', '/app.js', '/menu.js', '/style.css',
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

// 📦 Installation : cache tous les assets essentiels
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 🔄 Activation : nettoyage des anciens caches
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

// 🌐 Stratégies de cache
self.addEventListener('fetch', event => {
  const req = event.request;

  // Navigations HTML : stratégie network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    // Autres (CSS, JS, images...) : stratégie cache-first
    event.respondWith(
      caches.match(req)
        .then(cached => cached || fetch(req)
          .then(res => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
            return res;
          })
        )
        .catch(() => {
          // Optionnel : gérer les erreurs d'image ou fichier
          if (req.destination === 'image') {
            return caches.match('/images/idaksahak_square512.png');
          }
        })
    );
  }
});

// 🔄 Mise à jour immédiate si demandé
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
