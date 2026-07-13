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

function _schedaReactOwnsPage() {
    return document.body?.dataset?.reactPage === 'scheda';
}

function _schedaRequestReactRefresh(personaggioId, tab) {
    window.dispatchEvent(new CustomEvent('companion:character-refresh', {
        detail: { personaggioId, tab },
    }));
}

window.setSchedaReactCharacter = function(pg, tab) {
    _schedaPgCache = pg || null;
    window._schedaCurrentPgId = pg?.id || null;
    window._schedaCurrentTab = tab || 'scheda';
};

window.getSchedaReactModel = function(pg) {
    const classFeatures = Array.isArray(pg?.classi) && typeof _autoFeaturesForClass === 'function'
        ? pg.classi.map(c => _autoFeaturesForClass(c, c.livello))
        : [];
    const spellMap = new Map();
    const addSpell = entry => {
        const rawName = typeof entry === 'string' ? entry : (entry?.name || entry?.nome || entry?.name_en || '');
        const resolved = typeof _resolveSpell === 'function' ? _resolveSpell(rawName) : null;
        const spell = resolved || (entry && typeof entry === 'object' ? entry : { name: rawName });
        const name = spell?.name || spell?.nome || spell?.name_en || rawName;
        if (name) spellMap.set(String(name).toLowerCase(), spell);
    };
    (pg?.incantesimi_conosciuti || []).forEach(addSpell);
    if (typeof _pgRaceInnateSpells === 'function') _pgRaceInnateSpells(pg).forEach(addSpell);
    if (typeof _pgSubclassGrantedSpells === 'function') _pgSubclassGrantedSpells(pg).forEach(addSpell);
    if (typeof _pgInvocationGrantedSpells === 'function') _pgInvocationGrantedSpells(pg).forEach(addSpell);

    const featsData = typeof _featsData === 'function' ? _featsData() : {};
    const feats = (pg?.talenti || []).map(entry => {
        const name = typeof entry === 'string' ? entry : (entry?.name || entry?.nome || '');
        return featsData[name] || Object.values(featsData).find(item =>
            item?.slug === entry?.slug || item?.name_en === name || item?.name === name
        ) || (typeof entry === 'object' ? entry : { name });
    });
    const fightingStyles = Object.values(pg?.stile_combattimento || {})
        .flat()
        .map(slug => typeof _fightingStyleById === 'function' ? _fightingStyleById(slug) : { name: slug })
        .filter(Boolean);
    const invocations = (pg?.invocazioni || [])
        .map(id => typeof _invocationById === 'function' ? _invocationById(id) : { name: id })
        .filter(Boolean);

    return {
        classResources: typeof CLASS_RESOURCES !== 'undefined' ? CLASS_RESOURCES : {},
        subclassResources: typeof _pgSubclassResources === 'function' ? _pgSubclassResources(pg) : [],
        raceResources: typeof _pgRaceResources === 'function' ? _pgRaceResources(pg) : [],
        invocationSlots: typeof _pgInvocationSlots === 'function' ? _pgInvocationSlots(pg) : [],
        classFeatures,
        raceTraits: typeof _pgRaceMergedTraits === 'function' ? _pgRaceMergedTraits(pg) : [],
        background: typeof getBackgroundData === 'function' ? getBackgroundData(pg?.background) : null,
        spells: Array.from(spellMap.values()),
        feats,
        fightingStyles,
        invocations,
        inventory: (pg?.inventario || []).map(item => typeof _invResolveLive === 'function' ? _invResolveLive(item) : item),
    };
};

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
            if (_schedaReactOwnsPage()) _schedaRequestReactRefresh(personaggioId, window._schedaCurrentTab);
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
    else if (_schedaReactOwnsPage()) _schedaRequestReactRefresh(personaggioId, window._schedaCurrentTab);
}
