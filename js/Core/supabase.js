// Adapter legacy. Il client viene creato esclusivamente da src/api/supabaseClient.ts.
let supabaseReady = false;

function ensureSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (typeof window.initializeSupabaseClient !== 'function') return null;

    try {
        return window.initializeSupabaseClient();
    } catch (error) {
        console.error('Errore inizializzazione Supabase:', error);
        return null;
    }
}

function canInitSupabaseClient() {
    return !!ensureSupabaseClient();
}

function hasInvalidSupabaseConfig() {
    if (!window.CompanionConfig) return false;
    return !window.CompanionConfig.supabaseUrl || !window.CompanionConfig.supabaseAnonKey;
}

function initSupabase() {
    try {
        if (!ensureSupabaseClient()) {
            console.error('Supabase client non disponibile. Verifica config e caricamento SDK.');
            return false;
        }

        supabaseReady = true;
        appDebug('Supabase verificato e pronto');
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
        const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 2000;
        const intervalMs = 100;
        let completed = false;
        /** @type {number | null} */
        let interval = null;
        /** @param {boolean} value */
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
        }, 100);
    });
}

function getSupabaseClient() {
    return ensureSupabaseClient();
}
