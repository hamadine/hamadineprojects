const CACHE_NAME = 'tadaksahak-v1.0.3';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js', '/manifest.webmanifest',
  '/images/idaksahak_round.png', '/images/idaksahak_square.png',
  '/images/idaksahak_square512.png', '/images/Gmail.png', '/images/whatsapp.png',
  '/data/mots_final_489.json', '/data/interface-langue.json',
  '/data/histoire.json', '/data/histoire-fr.json', '/data/histoire-en.json',
  '/audios/intro-idaksahak.mp3',
  '/offline.html'
];

self.addEventListener('install', event => {
  console.log('[SW] Install event');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

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

  if (req.url.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
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

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting');
    self.skipWaiting();
  }
});
