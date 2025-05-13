const CACHE_NAME = 'offline-cache-v4';
const OFFLINE_URLS = [
  'index.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/autonumeric@4.6.0',
  'offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 🚫 Не кэшировать API-запросы (allorigins, nationalbank и другие внешние источники)
  if (
    url.href.includes('allorigins.win') ||
    url.href.includes('nationalbank.kz') ||
    url.pathname.startsWith('/api/') || // твои внутренние API
    event.request.method !== 'GET' ||
    url.protocol.startsWith('chrome-extension') ||
    url.protocol.startsWith('devtools')
  ) {
    return; // просто пропускаем
  }

  // остальное — HTML, CSS, JS, шрифты — кэшируем
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        }).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        })
      );
    })
  );
});
