const CACHE_NAME = 'companion-app-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: event.data.icon || 'images/icon d20.png',
            badge: 'images/icon d20.png',
            tag: 'companion-app-' + Date.now(),
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }
});

self.addEventListener('push', (event) => {
    let data = { title: 'Companion App', body: 'Hai una nuova notifica' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || 'images/icon d20.png',
            badge: 'images/icon d20.png',
            tag: data.tag || 'companion-app-push',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
                campagnaId: data.campagnaId,
                sessioneId: data.sessioneId,
                url: data.url
            }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    client.focus();
                    if (event.notification.data) {
                        client.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            campagnaId: event.notification.data.campagnaId,
                            sessioneId: event.notification.data.sessioneId
                        });
                    }
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data?.url || './index.html');
            }
        })
    );
});
