const CACHE_NAME = 'tadaksahak-v1.0.1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js',
  '/data/mots.json', '/data/interface-langue.json',
  '/manifest.webmanifest',
  '/images/idaksahak_round.png',
  '/images/idaksahak_square512.png',
  '/images/Gmail.png',
  '/images/whatsapp.png',
  '/offline.html'
];

// 💾 Installation : mise en cache initiale
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 🧹 Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 🌐 Interception des requêtes (Cache First + Fallback)
self.addEventListener('fetch', event => {
  const req = event.request;

  // Pages HTML (navigations)
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
    return;
  }

  // Ressources statiques (JS, CSS, images, etc.)
  event.respondWith(
    caches.match(req).then(cachedRes => {
      return cachedRes || fetch(req).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
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

// ⚙️ Réception des messages de mise à jour
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
