self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('10000-store').then((cache) => cache.addAll([
      './',
      'icon.png',
      'manifest.json'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
