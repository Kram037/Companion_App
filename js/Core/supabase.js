// Supabase - Database relazionale PostgreSQL
// Il client e' creato in index.html usando window.CompanionConfig.
let supabaseReady = false;

function canInitSupabaseClient() {
    return !!window.supabaseClient || (
        typeof window.supabaseCreateClient === 'function' &&
        !!window.CompanionConfig?.supabaseUrl &&
        !!window.CompanionConfig?.supabaseAnonKey
    );
}

// Initialize Supabase (runs after the SDK module loads)
function initSupabase() {
    try {
        if (!window.supabaseClient && typeof window.supabaseCreateClient === 'function') {
            const { supabaseUrl, supabaseAnonKey } = window.CompanionConfig || {};
            if (supabaseUrl && supabaseAnonKey) {
                window.supabaseClient = window.supabaseCreateClient(supabaseUrl, supabaseAnonKey);
            }
        }

        if (!window.supabaseClient) {
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

// Wait for DOM and Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        if (canInitSupabaseClient()) {
            resolve(initSupabase());
            return;
        }

        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
            attempts++;
            if (canInitSupabaseClient()) {
                clearInterval(checkInterval);
                resolve(initSupabase());
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('Timeout attesa Supabase, continuo comunque...');
                resolve(false);
            }
        }, 100);
    });
}

// Helper per ottenere il client Supabase
function getSupabaseClient() {
    if (!window.supabaseClient) initSupabase();
    return window.supabaseClient;
}
