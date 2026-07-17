// Adapter legacy. Il client viene creato esclusivamente da src/api/supabaseClient.ts.
let supabaseReady = false;

function canInitSupabaseClient() {
    return !!window.supabaseClient;
}

function initSupabase() {
    try {
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

function getSupabaseClient() {
    return window.supabaseClient;
}
