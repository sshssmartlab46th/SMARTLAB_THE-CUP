/* Sangsan High School Sports Festival Service Worker */
const CACHE_NAME = 'sangsan-sports-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/sangsan_logo.png',
  '/smartlab-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Pre-cache non-critical error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first fetch strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Web Push event listener
self.addEventListener('push', (event) => {
  let title = '상산고 체육대회 경기 알림';
  let options = {
    body: '경기 소집 시간 또는 일정 변경 알림이 도착했습니다.',
    icon: '/images/sangsan_logo.png',
    badge: '/images/sangsan_logo.png',
    tag: 'match-alert',
    renotify: true,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) options.body = data.body;
      if (data.icon) options.icon = data.icon;
      if (data.tag) options.tag = data.tag;
      if (data.data) options.data = data.data;
    } catch (e) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Client postMessage event listener for app-triggered SW notifications
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const defaultOptions = {
      icon: '/images/sangsan_logo.png',
      badge: '/images/sangsan_logo.png',
      tag: 'sangsan-notification',
      renotify: true,
      data: { url: '/' },
      ...options
    };
    event.waitUntil(
      self.registration.showNotification(title || '상산고 체육대회 알림', defaultOptions)
    );
  }
});

// Handle notification interaction click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
