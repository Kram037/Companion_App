const CACHE_NAME = 'companion-app-v205';
const BUILD_ASSET_URLS = [];

const APP_SHELL_URLS = [
    './',
    './index.html',
    './manifest.json',
    './js/Core/config.js',
    './js/Core/supabase.js',
    './js/Core/version.js',
    './js/Core/state.js',
    './js/Core/utils.js',
    './js/Core/content-localization.js',
    './js/Core/lang.js',
    './js/Core/theme.js',
    './js/Core/data-loader.js',
    './js/Core/navigation.js',
    './js/Core/bookmarks.js',
    './js/Core/dice-roller.js',
    './js/Core/auth.js',
    './js/Core/users.js',
    './js/Social/amici.js',
    './js/Campagna/campagne.js',
    './js/Personaggi/personaggi-catalog.js',
    './js/Personaggi/personaggi-state.js',
    './js/Personaggi/personaggi-talenti.js',
    './js/Personaggi/personaggi-equipaggiamento.js',
    './js/Personaggi/personaggi-stats.js',
    './js/Personaggi/personaggi-razze-background.js',
    './js/Personaggi/personaggi-sottoclassi.js',
    './js/Personaggi/personaggi-invocazioni-stili.js',
    './js/Personaggi/personaggi-classi.js',
    './js/Personaggi/personaggi-competenze.js',
    './js/Personaggi/personaggi-slot-incantesimo.js',
    './js/Personaggi/personaggi-pv-keypad.js',
    './js/Personaggi/personaggi-wizard-navigation.js',
    './js/Personaggi/personaggi-lista.js',
    './js/Personaggi/personaggi-scheda-core.js',
    './js/Personaggi/personaggi-scheda-risorse.js',
    './js/Personaggi/personaggi-incantesimi-preparati.js',
    './js/Personaggi/personaggi-scheda-render.js',
    './js/Personaggi/personaggi-scheda-abilita.js',
    './js/Personaggi/personaggi-scheda-chrome.js',
    './js/Personaggi/personaggi-scheda-incantesimi.js',
    './js/Personaggi/personaggi-scheda-inventario.js',
    './js/Personaggi/personaggi-scheda-privilegi.js',
    './js/Personaggi/personaggi-scheda-editor.js',
    './js/Personaggi/personaggi-scheda-calcolatori.js',
    './js/Personaggi/personaggi-pf-max-modifiers.js',
    './js/Personaggi/personaggi-scheda-levelup-risorse.js',
    './js/Personaggi/personaggi-scheda-bonus.js',
    './js/Personaggi/personaggi-scheda-equipaggiamento.js',
    './js/Personaggi/personaggi-scheda-linguaggi.js',
    './js/Personaggi/personaggi-form.js',
    './js/Personaggi/personaggi-campagna-picker.js',
    './js/Personaggi/personaggi-micro.js',
    './js/Personaggi/personaggi.js',
    './js/Sessioni/sessions.js',
    './js/Core/realtime.js',
    './js/Sessioni/initiative.js',
    './js/Core/init.js',
    './css/Core/base.css',
    './css/Core/components.css',
    './css/Core/modals.css',
    './css/Core/bookmarks.css',
    './css/Core/fantasy.css',
    './css/Core/dice-roller.css',
    './css/Campagna/campagne.css',
    './css/Personaggi/personaggi.css',
    './css/Sessioni/sessions.css',
    './css/Combattimento/combat.css',
    './css/Laboratorio/laboratorio.css',
    './css/Compendio/compendio.css',
    './images/app-icon-180.png',
    './images/app-icon-192.png',
    './images/app-icon-512.png',
    './images/icon d20.png',
    './images/Scheda%20personaggio/Icona_scheda_combattimento.png',
    './images/Toolbar/Compendio-toolbar-20260521.svg',
    './images/Toolbar/Laboratorio.svg',
    './images/Tabs/Background.svg',
    './images/Tabs/Classi.svg',
    './images/Tabs/Equipaggiamento.svg',
    './images/Tabs/Incantesimi.svg',
    './images/Tabs/Mostri%20e%20Combattimenti.svg',
    './images/Tabs/Razze.svg',
    './images/Tabs/Suppliche.svg',
    './images/Tabs/Talenti%20e%20Stili.svg',
    './images/Logo Leggenda.jpeg'
];

const DATA_URL_PREFIXES = [
    './js/Compendio/data/',
    './js/Personaggi/data/',
    './risorse/'
];

const RUNTIME_SCRIPT_URLS = [
    './js/Combattimento/combat.js',
    './js/Compendio/compendio.js',
    './js/Laboratorio/laboratorio.js'
];

const PRECACHE_URLS = [...new Set([...APP_SHELL_URLS, ...BUILD_ASSET_URLS])];
const PRECACHE_PATHS = new Set(PRECACHE_URLS.map(normalizeManagedPath));
const BUILD_ASSET_PATHS = new Set(BUILD_ASSET_URLS.map(normalizeManagedPath));

self.addEventListener('install', (event) => {
    event.waitUntil(
        precacheAppShell()
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

    if (shouldNetworkFirst(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (shouldCacheFirst(url)) {
        event.respondWith(cacheFirst(request));
    }
});

function managedPath(url) {
    const path = url.pathname.replace(self.location.pathname.replace(/sw\.js$/, ''), './');
    return normalizeManagedPath(path);
}

function normalizeManagedPath(path) {
    try {
        return decodeURIComponent(path);
    } catch (_) {
        return path;
    }
}

function shouldNetworkFirst(url) {
    const path = managedPath(url);
    if (!PRECACHE_PATHS.has(path) || BUILD_ASSET_PATHS.has(path)) return false;
    return !/\.(?:png|jpe?g|svg|webp|gif|ico)$/i.test(path);
}

function shouldCacheFirst(url) {
    const path = managedPath(url);
    if (DATA_URL_PREFIXES.some(prefix => path.startsWith(prefix))) return true;
    if (RUNTIME_SCRIPT_URLS.includes(path)) return true;
    return PRECACHE_PATHS.has(path);
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

async function precacheAppShell() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE_URLS.map(async (url) => {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Precache fallita per ${url}`);
        }
        await cache.put(url, response);
    }));
}

async function networkFirst(request, fallbackUrl) {
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return caches.match(request).then(cached => {
            if (cached) return cached;
            return fallbackUrl ? caches.match(fallbackUrl) : Response.error();
        });
    }
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: event.data.icon || 'images/app-icon-192.png',
            badge: 'images/app-icon-192.png',
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
            icon: data.icon || 'images/app-icon-192.png',
            badge: 'images/app-icon-192.png',
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
