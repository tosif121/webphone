// Service Worker for handling notifications
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Default click - focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(self.registration.scope || '/webphone/v1/');
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  // Notification closed
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  // Service Worker activated
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  // Service Worker installed
  self.skipWaiting();
});
