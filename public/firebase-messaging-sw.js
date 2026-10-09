/* eslint-disable no-undef */
// Service Worker para Firebase Cloud Messaging (FCM) - Imperio Lux
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuración de Firebase Cloud Messaging
const firebaseConfig = {
  apiKey: "AIzaSyCCPv93IDnDIGXeT483YdvuIox-pG19yOc",
  authDomain: "gen-lang-client-0079604241.firebaseapp.com",
  projectId: "gen-lang-client-0079604241",
  storageBucket: "gen-lang-client-0079604241.firebasestorage.app",
  messagingSenderId: "1067710464095",
  appId: "1:1067710464095:web:ad7771910992e079599bea"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Gestión de mensajes en segundo plano (Background Push Notifications)
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje push en segundo plano recibido:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Imperio Lux - Notificación';
    const body = payload.notification?.body || payload.data?.body || 'Nueva alerta del sistema';
    const icon = payload.notification?.icon || '/assets/logo.png';
    const tag = payload.data?.categoria || payload.data?.tag || 'imperio-lux-notification';

    const options = {
      body,
      icon,
      badge: icon,
      tag,
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'open_app', title: 'Abrir Sistema' },
        { action: 'dismiss', title: 'Descartar' }
      ]
    };

    return self.registration.showNotification(title, options);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Inicialización FCM en background omitida o no soportada:', err);
}

// Evento click en la notificación push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Soporte estándar para evento 'push'
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.notification?.title || data.title || 'Imperio Lux - Alerta Push';
    const body = data.notification?.body || data.body || 'Alerta recibida en segundo plano';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/assets/logo.png',
        badge: '/assets/logo.png',
        tag: data.categoria || 'push-alert',
        vibrate: [100, 50, 100]
      })
    );
  } catch (e) {
    // Si los datos no vienen en formato JSON plano
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Imperio Lux - Notificación Push', {
        body: text,
        icon: '/assets/logo.png'
      })
    );
  }
});
