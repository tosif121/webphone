// Service Worker for handling notifications
self.addEventListener('notificationclick', function(event) {
  console.log('SW: Notification clicked:', event);
  
  event.notification.close();
  
  // Default click - focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('SW: Notification closed:', event);
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('SW: Service Worker activated');
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('SW: Service Worker installed');
  self.skipWaiting();
});