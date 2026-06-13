const CACHE_NAME = 'wc2026-v2';
const DATA_URLS = [
  'data/predictions.json',
  'data/results.json',
  'data/elo-calibrated.json',
  'data/model_performance.json',
  'data/model-backtest.json',
];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Data JSON files: network-first (always fetch fresh, fallback to cache)
  if (DATA_URLS.some(d => url.pathname.endsWith(d.replace('data/', '/data/')))) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML: always network-first, never serve stale
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (JS/CSS/images): cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
