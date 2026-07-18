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

function waitForSupabase() {
    return new Promise((resolve) => {
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
        };

        if (canInitSupabaseClient()) {
            finish(initSupabase());
            return;
        }

        let attempts = 0;
        const maxAttempts = 150;
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
