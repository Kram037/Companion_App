// Supabase - Database relazionale PostgreSQL
// Il client e' creato in index.html usando window.CompanionConfig.
let supabaseReady = false;

function isDebugEnabled() {
    return !!window.CompanionConfig?.debug;
}

// Initialize Supabase (runs after the SDK module loads)
function initSupabase() {
    try {
        if (typeof window.supabaseClient === 'undefined') {
            console.error('Supabase client non disponibile. Verifica config e caricamento SDK.');
            return false;
        }

        supabaseReady = true;
        if (isDebugEnabled()) {
            console.log('Supabase verificato e pronto');
        }
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
        if (typeof window.supabaseClient !== 'undefined') {
            resolve(initSupabase());
            return;
        }

        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof window.supabaseClient !== 'undefined') {
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
    return window.supabaseClient;
}
