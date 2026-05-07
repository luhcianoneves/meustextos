// Service Worker for Push Notifications
const CACHE_NAME = 'lucianos-scribe-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Luciano\'s Scribe';
  const options = {
    body: data.body || 'Novo texto disponível',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});