// ============================================================================
// CHARACTER SHEET CORE HELPERS
// ============================================================================

// --- Scheda Personaggio Page ---
window.openSchedaPersonaggio = async function(personaggioId, opts) {
    AppState.currentPersonaggioId = personaggioId;
    sessionStorage.setItem('currentPersonaggioId', personaggioId);
    if (opts && opts.scrollToStats) {
        // Flag consumato dopo il render della Pagina 1 per centrare la tabella
        // delle statistiche (PV, PV temp, CA, ecc.). Usato quando si torna
        // alla scheda da una sessione/combattimento.
        window._schedaPendingScrollToStats = true;
    }
    navigateToPage('scheda');
    await renderSchedaPersonaggio(personaggioId);
}

// Debounced save for scheda fields
let _schedaSaveTimeout = null;
let _schedaPgCache = null;

function schedaDebouncedSave(personaggioId, field, value) {
    if (_schedaSaveTimeout) clearTimeout(_schedaSaveTimeout);
    _schedaSaveTimeout = setTimeout(async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('personaggi').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        } catch (e) { console.error('Errore salvataggio:', e); }
    }, 500);
}

async function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) console.error('Errore salvataggio:', error);
}
