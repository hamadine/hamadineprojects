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

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, resClone));
        return res;
      });
    }).catch(() => {
      if (req.destination === 'image') return caches.match('/images/idaksahak_square512.png');
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
