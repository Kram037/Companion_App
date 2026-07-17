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

let _schedaPgCache = null;

async function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) console.error('Errore salvataggio:', error);
}
