import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute'

precacheAndRoute(self.__WB_MANIFEST)

const FILES_TO_CACHE = [
  './offline.html',
];
const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
);
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== PRECACHE) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
);
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') {
  // Not a page navigation, bail.
  return;
}
event.respondWith(
    fetch(event.request)
        .catch(() => {
          return caches.open(PRECACHE)
              .then((cache) => {
                return cache.match('offline.html');
              });
        })
);
});