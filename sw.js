// ÁUREA — service worker v1
// HTML: network-first (para no servir versiones viejas)
// Estáticos: cache-first
// Música: NO se precachea; se cachea perezosamente al primer uso
const CACHE = 'aurea-v19';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'aurea-seal.png',
  'aurea-hub.png',
  'tick.wav',
  'warn.wav',
  'ding.wav',
  'coins.wav',
  'applause.wav',
  'buzz.wav',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // documentos: red primero SALTANDO la caché HTTP (GitHub Pages cachea ~10 min)
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // resto (incluida la música): caché primero, y al bajar de red se guarda
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok && req.url.startsWith(self.location.origin)) {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
      }
      return r;
    }))
  );
});
