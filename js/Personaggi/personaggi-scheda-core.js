// ============================================================================
// CHARACTER SHEET CORE HELPERS
// ============================================================================

// --- Scheda Personaggio Page ---
window.openSchedaPersonaggio = async function(personaggioId, opts) {
    window.setAppNavigationState({ personaggioId }, 'open-scheda');
    if (opts && opts.scrollToStats) {
        // Flag consumato dopo il render della Pagina 1 per centrare la tabella
        // delle statistiche (PV, PV temp, CA, ecc.). Usato quando si torna
        // alla scheda da una sessione/combattimento.
        window._schedaPendingScrollToStats = true;
    }
    // navigateToPage('scheda') esegue gia' il page-load e quindi il render.
    // Chiamare renderSchedaPersonaggio subito dopo produceva due fetch/render
    // concorrenti e poteva chiudere sezioni/tendine appena aperte.
    return navigateToPage('scheda');
}

// Debounced save for scheda fields
// Una mappa per campo evita che il salvataggio di un campo cancelli il debounce
// di un altro campo modificato subito prima.
let _schedaSaveTimeout = null; // legacy: non usare per nuovi salvataggi
let _schedaSaveTimeouts = new Map();
let _schedaPgCache = null;

function schedaDebouncedSave(personaggioId, field, value) {
    const key = `${personaggioId}:${field}`;
    const existing = _schedaSaveTimeouts.get(key);
    if (existing) clearTimeout(existing);
    const timeout = setTimeout(async () => {
        _schedaSaveTimeouts.delete(key);
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('personaggi').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        } catch (e) { console.error('Errore salvataggio:', e); }
    }, 500);
    _schedaSaveTimeouts.set(key, timeout);
}

async function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) console.error('Errore salvataggio:', error);
}
