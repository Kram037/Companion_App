const CACHE_NAME = 'companion-app-v2';

const APP_SHELL_URLS = [
    './',
    './index.html',
    './manifest.json',
    './js/config.js',
    './js/supabase.js',
    './js/version.js',
    './js/state.js',
    './js/utils.js',
    './js/lang.js',
    './js/theme.js',
    './js/navigation.js',
    './js/auth.js',
    './js/users.js',
    './js/amici.js',
    './js/campagne.js',
    './js/personaggi.js',
    './js/sessions.js',
    './js/combat.js',
    './js/laboratorio.js',
    './js/realtime.js',
    './js/initiative.js',
    './js/init.js',
    './css/base.css',
    './css/components.css',
    './css/modals.css',
    './css/campagne.css',
    './css/personaggi.css',
    './css/sessions.css',
    './css/combat.css',
    './css/laboratorio.css',
    './images/icon d20.png',
    './images/Icona_scheda_combattimento.png',
    './images/Logo Leggenda.jpeg'
];

const DATA_URL_PREFIXES = [
    './js/data/',
    './risorse/'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, './index.html'));
        return;
    }

    if (shouldCacheFirst(url)) {
        event.respondWith(cacheFirst(request));
    }
});

function shouldCacheFirst(url) {
    const path = url.pathname.replace(self.location.pathname.replace(/sw\.js$/, ''), './');
    return APP_SHELL_URLS.includes(path) || DATA_URL_PREFIXES.some(prefix => path.startsWith(prefix));
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request, fallbackUrl) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return caches.match(request).then(cached => cached || caches.match(fallbackUrl));
    }
}

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
