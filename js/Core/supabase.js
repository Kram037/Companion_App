// Adapter legacy. In una build Vite il client viene creato da
// src/api/supabaseClient.ts. Quando GitHub Pages pubblica direttamente il
// branch, /src/main.ts non viene compilato: questo modulo carica allora
// Supabase dal CDN e crea lo stesso client globale.
let supabaseReady = false;
let supabaseFallbackPromise = null;

function hasValidSupabaseConfig() {
    const config = window.CompanionConfig || {};
    return !!(config.supabaseUrl && config.supabaseAnonKey);
}

function createFallbackSupabaseClient(createClient) {
    if (window.supabaseClient) return window.supabaseClient;
    if (typeof createClient !== 'function' || !hasValidSupabaseConfig()) return null;

    const config = window.CompanionConfig;
    window.supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    window.supabaseCreateClient = createClient;
    window.initializeSupabaseClient = function() {
        return window.supabaseClient;
    };
    window.dispatchEvent(new Event('companion:supabase-ready'));
    if (config.debug) console.log('Supabase inizializzato tramite fallback CDN');
    return window.supabaseClient;
}

function loadSupabaseFallback() {
    if (window.supabaseClient) return Promise.resolve(window.supabaseClient);
    if (supabaseFallbackPromise) return supabaseFallbackPromise;
    if (!hasValidSupabaseConfig()) return Promise.resolve(null);

    supabaseFallbackPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
        .then(module => createFallbackSupabaseClient(module.createClient))
        .catch(error => {
            console.error('Errore caricamento fallback Supabase:', error);
            return null;
        })
        .finally(() => {
            supabaseFallbackPromise = null;
        });

    return supabaseFallbackPromise;
}

function ensureSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;

    if (typeof window.initializeSupabaseClient === 'function') {
        try {
            const client = window.initializeSupabaseClient();
            if (client) return client;
        } catch (error) {
            console.error('Errore inizializzazione Supabase:', error);
        }
    }

    // Avvio non bloccante del percorso statico. waitForSupabase resta in ascolto
    // dell'evento companion:supabase-ready emesso al termine dell'import.
    loadSupabaseFallback();
    return null;
}

function canInitSupabaseClient() {
    return !!ensureSupabaseClient();
}

function hasInvalidSupabaseConfig() {
    return !hasValidSupabaseConfig();
}

function initSupabase() {
    try {
        if (!ensureSupabaseClient()) {
            console.error('Supabase client non disponibile. Verifica config e caricamento SDK.');
            return false;
        }

        supabaseReady = true;
        if (typeof appDebug === 'function') appDebug('Supabase verificato e pronto');
        return true;
    } catch (error) {
        console.error('Errore nella verifica Supabase:', error);
        supabaseReady = false;
        return false;
    }
}

/**
 * @param {{ timeoutMs?: number }} [options]
 */
function waitForSupabase(options = {}) {
    return new Promise((resolve) => {
        // Il CDN può richiedere più dei precedenti 2 secondi su rete mobile.
        const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 8000;
        const intervalMs = 100;
        let completed = false;
        let interval = null;

        const finish = (value) => {
            if (completed) return;
            completed = true;
            if (interval) clearInterval(interval);
            window.removeEventListener('companion:supabase-ready', check);
            resolve(value);
        };

        const check = () => {
            if (canInitSupabaseClient()) finish(initSupabase());
            else if (hasInvalidSupabaseConfig()) finish(false);
        };

        if (canInitSupabaseClient()) {
            finish(initSupabase());
            return;
        }
        if (hasInvalidSupabaseConfig()) {
            finish(false);
            return;
        }

        loadSupabaseFallback();
        let attempts = 0;
        const maxAttempts = Math.ceil(timeoutMs / intervalMs);
        window.addEventListener('companion:supabase-ready', check);
        interval = setInterval(() => {
            attempts++;
            if (canInitSupabaseClient()) {
                finish(initSupabase());
            } else if (attempts >= maxAttempts) {
                console.warn('Timeout attesa Supabase, continuo comunque...');
                finish(false);
            }
        }, intervalMs);
    });
}

function getSupabaseClient() {
    return ensureSupabaseClient();
}

// Parte subito nel deploy statico; nella build Vite è un no-op perché il client
// o initializeSupabaseClient sono già disponibili.
loadSupabaseFallback();
