// Supabase - Database relazionale PostgreSQL
// Supabase client è disponibile globalmente da supabase-config.js
let supabaseReady = false;

// Initialize Supabase (runs after supabase-config.js loads)
function initSupabase() {
    try {
        if (typeof window.supabaseClient === 'undefined') {
            console.error('❌ Supabase client non disponibile. Verifica che supabase-config.js sia caricato correttamente.');
            console.log('window.supabaseClient:', typeof window.supabaseClient);
            console.log('window.supabase:', typeof window.supabase);
            return false;
        }

        supabaseReady = true;
        console.log('✅ Supabase verificato e pronto');
        console.log('Supabase client disponibile:', !!window.supabaseClient);
        return true;
    } catch (error) {
        console.error('❌ Errore nella verifica Supabase:', error);
        supabaseReady = false;
        return false;
    }
}

// Wait for DOM and Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        if (typeof window.supabaseClient !== 'undefined') {
            resolve(initSupabase());
        } else {
            // Wait a bit and retry
            let attempts = 0;
            const maxAttempts = 50; // 5 secondi totali (50 * 100ms)
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.supabaseClient !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve(initSupabase());
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⏱️ Timeout attesa Supabase, continuo comunque...');
                    console.warn('window.supabaseClient ancora non disponibile dopo', maxAttempts * 100, 'ms');
                    resolve(false);
                }
            }, 100);
        }
    });
}

// Helper per ottenere il client Supabase
function getSupabaseClient() {
    return window.supabaseClient;
}
