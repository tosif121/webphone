const BASE_PATH = '/webphone/v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, vibrate, number } = event.data;
    self.registration.showNotification(title || 'Incoming Call', {
      body: body || '',
      icon: icon || `${BASE_PATH}/badge.png`,
      badge: icon || `${BASE_PATH}/badge.png`,
      tag: tag || 'incoming-call',
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: vibrate || [200, 100, 200],
      data: { number },
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICKED', number: event.notification.data?.number });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(BASE_PATH);
      }
    }),
  );
});
