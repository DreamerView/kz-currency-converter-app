const CACHE_NAME = 'offline-cache-v7';
const OFFLINE_URLS = [
  'offline.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/autonumeric@4.6.0',
];

// Установка: кэшируем нужные файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // оставить только актуальный
          .map((name) => caches.delete(name))    // удалить устаревшие
      );
    }).then(() => clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 🚫 Пропускаем неподходящие запросы
  if (
    url.href.includes('allorigins.win') ||
    url.href.includes('nationalbank.kz') ||
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET' ||
    url.protocol.startsWith('chrome-extension') ||
    url.protocol.startsWith('devtools')
  ) {
    return;
  }

  // 📄 Отдельная обработка index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('index.html', cloned);
          });
          return response;
        })
        .catch(() => caches.match('index.html').then(res => res || caches.match('offline.html')))
    );
    return;
  }

  // 📦 Остальные ресурсы
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
            return caches.match('offline.html');
          }
        })
      );
    })
  );
});
