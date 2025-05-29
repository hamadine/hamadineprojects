// Version 1.3.0 - Optimisé pour Tadaksahak Learning
const APP_VERSION = '1.3.0';
const CACHE_NAME = `tadaksahak-${APP_VERSION}`;
const OFFLINE_URL = '/offline.html';
const AUDIO_CACHE = 'tadaksahak-audio-v1';

// Fichiers à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data/mots.json',
  OFFLINE_URL,
  // Images
  './images/idaksahak_square.png',
  './images/idaksahak_round.png',
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== AUDIO_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et cross-origin
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) {
    return;
  }

  // Stratégie pour les fichiers audio
  if (url.pathname.includes('/audios/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetched = fetch(request).then(network => {
          const clone = network.clone();
          caches.open(AUDIO_CACHE)
            .then(cache => cache.put(request, clone));
          return network;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // Pour les données JSON (toujours fraîches)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Par défaut: Cache First
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
