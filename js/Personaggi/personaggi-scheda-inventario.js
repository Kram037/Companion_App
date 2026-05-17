// ============================================================================
// CHARACTER SHEET INVENTORY
// ============================================================================

/* ── Inventario Tab ── */
// Monete D&D 5e con tasso di conversione in MO (oro) e ordine 2x3 (riga1: MR/MA, riga2: ME/MO, riga3: MP/Totale)
const COIN_TYPES = [
    { key: 'mr', label: 'Rame (MR)', short: 'MR', goldRatio: 0.01 },
    { key: 'ma', label: 'Argento (MA)', short: 'MA', goldRatio: 0.1 },
    { key: 'me', label: 'Electrum (ME)', short: 'ME', goldRatio: 0.5 },
    { key: 'mo', label: 'Oro (MO)', short: 'MO', goldRatio: 1 },
    { key: 'mp', label: 'Platino (MP)', short: 'MP', goldRatio: 10 }
];

function _calcCoinsTotalGold(monete) {
    if (!monete) return 0;
    let tot = 0;
    COIN_TYPES.forEach(c => { tot += (parseInt(monete[c.key]) || 0) * c.goldRatio; });
    return tot;
}

function _formatGoldTotal(g) {
    if (g === 0) return '0';
    if (g >= 100 || Number.isInteger(g)) return String(Math.round(g));
    return g.toFixed(2).replace(/\.?0+$/, '');
}

// ──────────────────────────────────────────────────────────────────────
// State + helpers per la lista oggetti dell'Inventario:
//   - search testuale (nome / tipo / sotto-tipo / rarita')
//   - filtri rarita' + tipologia (toggleable via icona imbuto)
//   - drag & drop per riordinare gli oggetti (HTML5 + pointer events
//     per supportare anche il touch). L'ordine viene salvato come
//     ordine dell'array pg.inventario stesso (no campo separato).
// ──────────────────────────────────────────────────────────────────────
window._invListState = window._invListState || {
    search: '',
    filters: { rarita: '', tipo: '' },
    filtersOpen: false,
};

function _invListItemView(o) {
    return _invResolveLive(o);
}

function _invListItemRarity(view) {
    return view._homebrew_rarita || view.rarita || '';
}

function _invListItemTipo(view) {
    return view._homebrew_tipo || view.tipo || '';
}

function _invListMatches(view) {
    const st = window._invListState || {};
    const f = st.filters || {};
    if (f.rarita) {
        const r = String(_invListItemRarity(view) || '').trim();
        if (r !== f.rarita) return false;
    }
    if (f.tipo) {
        const t = String(_invListItemTipo(view) || '').trim();
        if (t !== f.tipo) return false;
    }
    const q = (st.search || '').trim().toLowerCase();
    if (q) {
        const txt = [
            _invDisplayName(view) || view.nome || '',
            view.nome_en || '',
            _invListItemTipo(view),
            view._homebrew_sotto_tipo || view.sotto_tipo || '',
            _invListItemRarity(view),
        ].join(' ').toLowerCase();
        if (!txt.includes(q)) return false;
    }
    return true;
}

function _invListBuildRowsHtml(pg, pgId) {
    const oggetti = pg.inventario || [];
    if (oggetti.length === 0) {
        return '<span class="scheda-empty">Nessun oggetto</span>';
    }
    const visible = [];
    oggetti.forEach((o, i) => {
        const view = _invListItemView(o);
        if (_invListMatches(view)) visible.push({ view, i });
    });
    if (visible.length === 0) {
        return '<span class="scheda-empty">Nessun oggetto corrisponde ai filtri</span>';
    }
    return visible.map(({ view, i }) => {
        const magicStr = view.magic_bonus
            ? ` <span class="inv-magic-badge">+${view.magic_bonus}</span>` : '';
        const hbBadge = view._homebrew_id
            ? ' <span class="inv-hb-badge" title="Homebrew">HB</span>' : '';
        let meta = '';
        if (view._homebrew_id) {
            meta = view._homebrew_meta || (typeof window.formatOggettoMeta === 'function'
                ? window.formatOggettoMeta({
                    tipo: view._homebrew_tipo,
                    sotto_tipo: view._homebrew_sotto_tipo,
                    rarita: view._homebrew_rarita,
                    incantamento: view._homebrew_incantamento,
                    richiede_sintonia: view._homebrew_richiede_sintonia,
                    sintonia_dettaglio: view._homebrew_sintonia_dettaglio,
                }) : '');
        } else if (view.rarita) {
            meta = (typeof window.formatOggettoMeta === 'function')
                ? window.formatOggettoMeta(view) : '';
        }
        const rarClass = _invRarityClass(_invListItemRarity(view));
        return `<div class="inv-item-row inv-item-card ${rarClass}" data-idx="${i}">
            <div class="inv-item-main">
                <div class="inv-item-name inv-item-name-clickable" onclick="invEditItem('${pgId}',${i})">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${view.magico ? ' <span class="inv-magic-badge">✦</span>' : ''}${magicStr}${hbBadge}</div>
                ${meta ? `<div class="inv-item-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
            <div class="inv-item-qty-edit" title="Quantita'">
                <span class="inv-item-qty-x">×</span>
                <input type="number" class="inv-item-qty-input" min="1" step="1"
                    value="${view.quantita || 1}"
                    onclick="event.stopPropagation();this.select();"
                    onchange="invQtyInlineUpdate('${pgId}',${i},this.value)"
                    onblur="invQtyInlineUpdate('${pgId}',${i},this.value)"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">
            </div>
        </div>`;
    }).join('');
}

function _invListReRender(pgId) {
    const pg = _schedaPgCache;
    const cont = document.getElementById('invItemsList');
    if (!pg || !cont) return;
    cont.innerHTML = _invListBuildRowsHtml(pg, pgId);
}

function _invListOptionsFor(pg, field) {
    const set = new Set();
    (pg.inventario || []).forEach(o => {
        const view = _invListItemView(o);
        const v = field === 'rarita' ? _invListItemRarity(view) : _invListItemTipo(view);
        const s = String(v || '').trim();
        if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
}

function _invListActiveFilterCount() {
    const f = (window._invListState && window._invListState.filters) || {};
    return (f.rarita ? 1 : 0) + (f.tipo ? 1 : 0);
}

function _invListRenderFiltersBadge() {
    const badge = document.getElementById('invListFiltersBadge');
    if (!badge) return;
    const n = _invListActiveFilterCount();
    badge.textContent = n ? String(n) : '';
    badge.style.display = n ? 'inline-flex' : 'none';
    const btn = document.getElementById('invListFiltersBtn');
    if (btn) btn.classList.toggle('active', n > 0 || window._invListState?.filtersOpen);
}

function _invListRenderFiltersPanel(pgId) {
    const panel = document.getElementById('invListFiltersPanel');
    if (!panel) return;
    const pg = _schedaPgCache;
    if (!pg) { panel.innerHTML = ''; return; }
    const f = window._invListState.filters || {};
    const rarOpts = _invListOptionsFor(pg, 'rarita');
    const tipOpts = _invListOptionsFor(pg, 'tipo');
    panel.innerHTML = `
        <div class="inv-list-filter-field">
            <label>Rarità</label>
            <select onchange="invListSetFilter('rarita', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${rarOpts.map(v => `<option value="${escapeHtml(v)}" ${f.rarita === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <div class="inv-list-filter-field">
            <label>Tipologia</label>
            <select onchange="invListSetFilter('tipo', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${tipOpts.map(v => `<option value="${escapeHtml(v)}" ${f.tipo === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <button type="button" class="inv-list-filter-reset" onclick="invListResetFilters('${pgId}')">Pulisci</button>
    `;
}

window.invListToggleFilters = function(pgId) {
    window._invListState.filtersOpen = !window._invListState.filtersOpen;
    const bar = document.getElementById('invListSearchBar');
    if (bar) bar.style.display = window._invListState.filtersOpen ? '' : 'none';
    if (window._invListState.filtersOpen) {
        _invListRenderFiltersPanel(pgId);
        const inp = document.getElementById('invListSearch');
        if (inp) setTimeout(() => inp.focus(), 30);
    }
    _invListRenderFiltersBadge();
};

window.invListOnSearch = function(value, pgId) {
    window._invListState.search = value || '';
    _invListReRender(pgId);
};

window.invListSetFilter = function(field, value, pgId) {
    window._invListState.filters = window._invListState.filters || {};
    window._invListState.filters[field] = value || '';
    _invListReRender(pgId);
    _invListRenderFiltersBadge();
};

window.invListResetFilters = function(pgId) {
    window._invListState.filters = { rarita: '', tipo: '' };
    _invListRenderFiltersPanel(pgId);
    _invListReRender(pgId);
    _invListRenderFiltersBadge();
};

// Drag & drop rimosso: gli oggetti dell'inventario ora restano fissi
// nell'ordine in cui sono stati aggiunti.

window.schedaOpenInventoryPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;
    // Tracciamo la tab corrente cosi' il bottone "Vai a Statistiche" sa che
    // deve prima navigare a Pagina 1 e poi scrollare. Senza questo flag il
    // valore restava quello della tab precedente e il bottone non funzionava.
    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'inventario';

    const monete = pg.monete || {};
    const coinCellHtml = (c) => {
        const val = monete[c.key] || 0;
        return `<div class="inv-coin-cell inv-coin-${c.key}">
            <div class="inv-coin-abbr">${c.short}</div>
            <input type="text" inputmode="none" readonly
                class="inv-coin-input"
                id="invCoin_${c.key}"
                value="${val}"
                data-coin="${c.key}"
                data-pgid="${pgId}"
                onclick="invOpenCoinKeypad(this)">
            <div class="inv-coin-name">${c.label.split(' ')[0]}</div>
        </div>`;
    };
    const totalGold = _calcCoinsTotalGold(monete);
    const totalCellHtml = `<div class="inv-coin-cell inv-coin-total" id="invCoinTotalCell">
        <div class="inv-coin-abbr">TOT</div>
        <div class="inv-coin-input inv-coin-total-val" id="invCoinTotal">${_formatGoldTotal(totalGold)}</div>
        <div class="inv-coin-name">in MO</div>
    </div>`;
    // Riga 1: MR / MA · Riga 2: ME / MO · Riga 3: MP / Totale
    const coinsHtml = `<div class="inv-coins-grid inv-coins-grid-2x3">
        ${coinCellHtml(COIN_TYPES[0])}${coinCellHtml(COIN_TYPES[1])}
        ${coinCellHtml(COIN_TYPES[2])}${coinCellHtml(COIN_TYPES[3])}
        ${coinCellHtml(COIN_TYPES[4])}${totalCellHtml}
    </div>`;

    // Le righe degli oggetti vengono generate da _invListBuildRowsHtml,
    // cosi' search/filtri/drag&drop possono ri-renderizzare la lista
    // senza ricaricare l'intera pagina.
    const oggettiRowsHtml = _invListBuildRowsHtml(pg, pgId);

    const sintonia = pg.sintonia || [];
    const maxSintonia = 3;
    const _attuneNameOf = (it) => {
        if (!it) return '';
        if (typeof it === 'string') return it;
        // Strippa eventuale " +N" finale duplicato col magic_bonus.
        return _invDisplayName(it) || it.nome || '';
    };
    const _attuneBonusOf = (it) => {
        if (!it || typeof it === 'string') return 0;
        return it.magic_bonus || 0;
    };
    let sintoniaHtml = '';
    for (let i = 0; i < maxSintonia; i++) {
        const item = sintonia[i] || null;
        const itemName = _attuneNameOf(item);
        const itemBonus = _attuneBonusOf(item);
        const bonusStr = itemBonus ? ` +${itemBonus}` : '';
        sintoniaHtml += `<div class="inv-attune-slot ${item ? 'filled' : 'empty'}" onclick="invEditAttune('${pgId}',${i})">
            <span class="inv-attune-icon">◈</span>
            <span class="inv-attune-name">${item ? escapeHtml(itemName) + bonusStr : 'Slot vuoto'}</span>
        </div>`;
    }

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Inventario')}

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">
            <span>Monete</span>
            <span class="inv-coins-title-total" id="invCoinsTitleTotal" title="Totale in monete d'oro">${_formatGoldTotal(totalGold)} <small>MO</small></span>
        </div>
        <div class="scheda-section-body">
            ${coinsHtml}
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Sintonia</div>
        <div class="scheda-section-body">
            <div class="inv-attune-grid">${sintoniaHtml}</div>
        </div>
    </div>

    <div class="scheda-section inv-section-fixed">
        <div class="scheda-section-title inv-section-title-fixed">
            <span>Inventario</span>
            <div class="inv-section-actions">
                <button type="button" id="invListFiltersBtn" class="inv-list-filters-btn" onclick="invListToggleFilters('${pgId}')" title="Filtri e ricerca" aria-label="Filtri">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span class="inv-list-filters-badge" id="invListFiltersBadge"></span>
                </button>
                <button class="scheda-edit-btn" onclick="invAddItem('${pgId}')" title="Aggiungi oggetto">&#9998;</button>
            </div>
        </div>
        <div id="invListSearchBar" class="inv-list-search-bar" style="display:none;">
            <input type="text" id="invListSearch" class="inv-list-search-input" placeholder="Cerca per nome o tipo..."
                value="${escapeHtml(window._invListState?.search || '')}"
                oninput="invListOnSearch(this.value,'${pgId}')">
            <div id="invListFiltersPanel" class="inv-list-filters-panel"></div>
        </div>
        <div class="scheda-section-body">
            <div id="invItemsList" class="inv-items-grid inv-items-grid-2col">${oggettiRowsHtml}</div>
        </div>
    </div>
    `;

    schedaSetActiveTab('inventario');
    schedaWireTabBar(pgId);
    if (window._invListState?.filtersOpen) {
        const bar = document.getElementById('invListSearchBar');
        if (bar) bar.style.display = '';
        _invListRenderFiltersPanel(pgId);
    }
    _invListRenderFiltersBadge();
};

window.invCoinChange = async function(pgId, coinKey, delta) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const monete = pg.monete ? { ...pg.monete } : {};
    monete[coinKey] = Math.max(0, (monete[coinKey] || 0) + delta);
    pg.monete = monete;
    const el = document.getElementById('invCoin_' + coinKey);
    if (el) el.textContent = monete[coinKey];
    await supabase.from('personaggi').update({ monete }).eq('id', pgId);
};

window.invOpenCoinKeypad = function(inputEl) {
    if (!inputEl) return;
    const coinKey = inputEl.dataset.coin;
    const pgId = inputEl.dataset.pgid;
    pgOpenAbilityKeypad(inputEl);
    const onChange = async () => {
        const val = Math.max(0, parseInt(inputEl.value) || 0);
        inputEl.value = val;
        const supabase = getSupabaseClient();
        const pg = _schedaPgCache;
        if (!supabase || !pg) return;
        const monete = pg.monete ? { ...pg.monete } : {};
        monete[coinKey] = val;
        pg.monete = monete;
        const formattedTotal = _formatGoldTotal(_calcCoinsTotalGold(monete));
        const totEl = document.getElementById('invCoinTotal');
        if (totEl) totEl.textContent = formattedTotal;
        const titleTotEl = document.getElementById('invCoinsTitleTotal');
        if (titleTotEl) titleTotEl.innerHTML = `${formattedTotal} <small>MO</small>`;
        await supabase.from('personaggi').update({ monete }).eq('id', pgId);
        inputEl.removeEventListener('change', onChange);
    };
    inputEl.addEventListener('change', onChange);
};

// ─────────────────────────────────────────────────────────────────────
// Risoluzione "live" di un'entry inventario:
// - Se l'entry ha _homebrew_id e l'oggetto e' nella cache homebrew,
//   usa i campi attuali dall'autore (nome, descrizione, incantamento,
//   tipo, rarita') sovrascrivendo i campi snapshot salvati.
// - Mantiene SEMPRE quantita e ogni campo che l'utente abbia
//   personalizzato localmente (note non gestite qui).
// - Se l'oggetto homebrew e' stato cancellato dall'autore, fallback
//   sui campi snapshot dell'entry (nome/descrizione gia' salvati).
// ─────────────────────────────────────────────────────────────────────
// Mappa una rarita' (stringa libera, italiano o inglese) alla classe CSS
// da applicare alla riga dell'oggetto. Ritorna stringa vuota per rarita'
// sconosciute o "Comune" (che non ha colore).
function _invRarityClass(rar) {
    if (!rar || typeof rar !== 'string') return '';
    const n = rar.trim().toLowerCase();
    if (!n || n === 'comune' || n === 'common') return '';
    if (n === 'non comune' || n === 'uncommon') return 'rarita-non-comune';
    if (n === 'raro' || n === 'rare') return 'rarita-raro';
    if (n === 'molto raro' || n === 'very rare') return 'rarita-molto-raro';
    if (n === 'leggendario' || n === 'legendary') return 'rarita-leggendario';
    if (n === 'artefatto' || n === 'artifact') return 'rarita-artefatto';
    return '';
}

function _invResolveLive(entry) {
    if (!entry || typeof entry !== 'object') return entry || {};
    if (!entry._homebrew_id) return entry;
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    const hb = cache.find(o => String(o.id) === String(entry._homebrew_id));
    if (!hb) return entry; // autore ha cancellato l'oggetto: fallback snapshot
    const ench = parseInt(hb.incantamento) || 0;
    return {
        ...entry,
        nome: hb.nome || entry.nome,
        descrizione: hb.descrizione || hb.proprieta || entry.descrizione || '',
        magico: ench > 0 || !!hb.richiede_sintonia || (hb.rarita && hb.rarita !== 'Comune') || !!entry.magico,
        magic_bonus: ench > 0 ? ench : (entry.magic_bonus || 0),
        _homebrew_tipo: hb.tipo || null,
        _homebrew_sotto_tipo: hb.sotto_tipo || null,
        _homebrew_rarita: hb.rarita || null,
        _homebrew_incantamento: parseInt(hb.incantamento) || 0,
        _homebrew_richiede_sintonia: !!hb.richiede_sintonia,
        _homebrew_sintonia_dettaglio: hb.sintonia_dettaglio || null,
        _homebrew_author: hb._author_name || null,
        // Snapshot della formula meta gia' formattata (utile a chi non
        // vuole reimpaginarla).
        _homebrew_meta: (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(hb) : '',
    };
}

window._invResolveLive = _invResolveLive;

// ─────────────────────────────────────────────────────────────────────
// Picker "Aggiungi Oggetto al Tesoro"
// Tab "Catalogo" (vuoto, futuro dataset SRD) + tab "Homebrew" (visibile
// solo se l'utente ha l'homebrew abilitato dai settings) + bottone "Crea
// rapidamente" che apre la mini-dialog testo libero (vecchio
// comportamento di invAddItem).
// ─────────────────────────────────────────────────────────────────────
window._invPickerState = { tab: 'catalog', search: '', filters: { rarita: '', tipo: '' }, filtersOpen: false };

window.invAddItem = async function(pgId) {
    // Carica gli homebrew oggetti in background; se la cache c'e' gia'
    // partiamo subito con quella, altrimenti viene riempita dopo.
    if (typeof window.loadHomebrewOggetti === 'function') {
        try { await window.loadHomebrewOggetti(); } catch (_) {}
    }
    _invOpenPickerDialog(pgId);
};

function _invHomebrewEnabled() {
    try {
        const s = AppState.cachedUserData?.homebrew_settings;
        return !!s && s.enabled !== false;
    } catch (_) { return false; }
}

function _invOpenPickerDialog(pgId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const showHb = _invHomebrewEnabled();
    if (!showHb) _invPickerState.tab = 'catalog';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-picker-modal" style="width:720px;max-width:96vw;text-align:left;">
        <h3 style="margin-bottom:10px;font-size:1rem;">Aggiungi Oggetto</h3>
        <div class="inv-picker-tabs">
            <button class="inv-picker-tab ${_invPickerState.tab === 'catalog' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','catalog')">Catalogo</button>
            <button class="inv-picker-tab ${_invPickerState.tab === 'veleni' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','veleni')">Veleni</button>
            ${showHb ? `<button class="inv-picker-tab ${_invPickerState.tab === 'homebrew' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','homebrew')">Homebrew</button>` : ''}
        </div>
        <div class="inv-picker-search-row">
            <input type="text" id="invPickerSearch" class="hp-calc-input" placeholder="Cerca per nome o tipo..."
                value="${escapeHtml(_invPickerState.search || '')}"
                oninput="_invPickerOnSearch(this.value,'${pgId}')">
            <button type="button" id="invPickerFiltersBtn" class="inv-picker-filters-btn"
                onclick="_invPickerToggleFilters('${pgId}')" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="inv-picker-filters-badge" id="invPickerFiltersBadge"></span>
            </button>
        </div>
        <div id="invPickerFiltersPanel" class="inv-picker-filters-panel" style="display:none;"></div>
        <div id="invPickerList" class="inv-picker-list"></div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:space-between;">
            <button class="btn-secondary" onclick="invQuickCreate('${pgId}')">+ Crea rapidamente</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderFiltersBadge();
    _invPickerRenderList(pgId);
}

window._invPickerSwitchTab = function(pgId, tab) {
    _invPickerState.tab = tab;
    // Cambiando dataset, le opzioni dei filtri cambiano: reset per evitare
    // scelte non piu' presenti (es. "Arma" filtrato in tab Veleni).
    _invPickerState.filters = { rarita: '', tipo: '' };
    const tabLabel = { catalog: 'catalogo', veleni: 'veleni', homebrew: 'homebrew' }[tab] || tab;
    document.querySelectorAll('.inv-picker-tab').forEach(b => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.inv-picker-tab'))
        .find(b => b.textContent.trim().toLowerCase() === tabLabel);
    if (btn) btn.classList.add('active');
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderFiltersBadge();
    _invPickerRenderList(pgId);
};

window._invPickerOnSearch = function(value, pgId) {
    _invPickerState.search = value || '';
    _invPickerRenderList(pgId);
};

// ─── Filtri picker (rarita' + tipologia) ────────────────────────────
// Le opzioni del dropdown vengono derivate dinamicamente dal dataset
// del tab attivo, cosi' "Veleni" mostra ingerito/inalato/contatto/iniezione
// mentre "Catalogo" mostra Arma/Armatura/Bacchetta/etc.
function _invPickerActiveDataset() {
    if (_invPickerState.tab === 'veleni') {
        return Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
    }
    if (_invPickerState.tab === 'homebrew') {
        return (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
            ? AppState.cachedHomebrewOggetti : [];
    }
    return Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
}

function _invPickerOptionsFor(field) {
    const ds = _invPickerActiveDataset();
    const set = new Set();
    for (const o of ds) {
        let v = '';
        if (field === 'rarita') {
            v = o.rarita_it || o.rarita || '';
        } else if (field === 'tipo') {
            v = (_invPickerState.tab === 'veleni')
                ? (o.sotto_tipo_it || o.sotto_tipo_en || '')
                : (o.tipo || '');
        }
        v = String(v || '').trim();
        if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
}

function _invPickerActiveFilterCount() {
    const f = _invPickerState.filters || {};
    return (f.rarita ? 1 : 0) + (f.tipo ? 1 : 0);
}

function _invPickerMatchesFilters(o) {
    const f = _invPickerState.filters || {};
    if (f.rarita) {
        const r = o.rarita_it || o.rarita || '';
        if (String(r).trim() !== f.rarita) return false;
    }
    if (f.tipo) {
        const t = (_invPickerState.tab === 'veleni')
            ? (o.sotto_tipo_it || o.sotto_tipo_en || '')
            : (o.tipo || '');
        if (String(t).trim() !== f.tipo) return false;
    }
    return true;
}

function _invPickerRenderFiltersBadge() {
    const badge = document.getElementById('invPickerFiltersBadge');
    if (!badge) return;
    const n = _invPickerActiveFilterCount();
    badge.textContent = n ? String(n) : '';
    badge.style.display = n ? 'inline-flex' : 'none';
    const btn = document.getElementById('invPickerFiltersBtn');
    if (btn) btn.classList.toggle('active', n > 0);
}

function _invPickerRenderFiltersPanel(pgId) {
    const panel = document.getElementById('invPickerFiltersPanel');
    if (!panel) return;
    if (!_invPickerState.filtersOpen) {
        panel.style.display = 'none';
        return;
    }
    const f = _invPickerState.filters || {};
    const tipoLabel = _invPickerState.tab === 'veleni' ? 'Tipo' : 'Tipologia';
    const rarOpts = _invPickerOptionsFor('rarita');
    const tipOpts = _invPickerOptionsFor('tipo');
    panel.style.display = 'flex';
    panel.innerHTML = `
        <div class="inv-picker-filter-field">
            <label>Rarità</label>
            <select onchange="_invPickerSetFilter('rarita', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${rarOpts.map(v => `<option value="${escapeHtml(v)}" ${f.rarita === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <div class="inv-picker-filter-field">
            <label>${tipoLabel}</label>
            <select onchange="_invPickerSetFilter('tipo', this.value, '${pgId}')">
                <option value="">Tutti</option>
                ${tipOpts.map(v => `<option value="${escapeHtml(v)}" ${f.tipo === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <button type="button" class="inv-picker-filter-reset" onclick="_invPickerResetFilters('${pgId}')">Pulisci</button>
    `;
}

window._invPickerToggleFilters = function(pgId) {
    _invPickerState.filtersOpen = !_invPickerState.filtersOpen;
    _invPickerRenderFiltersPanel(pgId);
};

window._invPickerSetFilter = function(field, value, pgId) {
    _invPickerState.filters = _invPickerState.filters || {};
    _invPickerState.filters[field] = value || '';
    _invPickerRenderList(pgId);
    _invPickerRenderFiltersBadge();
};

window._invPickerResetFilters = function(pgId) {
    _invPickerState.filters = { rarita: '', tipo: '' };
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderList(pgId);
    _invPickerRenderFiltersBadge();
};

function _invPickerRenderList(pgId) {
    const cont = document.getElementById('invPickerList');
    if (!cont) return;
    const q = (_invPickerState.search || '').trim().toLowerCase();
    if (_invPickerState.tab === 'catalog') {
        const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
        if (cat.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Catalogo oggetti non disponibile.</p>
            </div>`;
            return;
        }
        // Voci "generiche": Arma/Armatura/Scudo +1/+2/+3. La rarita' viene
        // scelta nello step successivo, quindi qui non hanno una rarita'
        // fissa (per i filtri restituiscono true sempre se non c'e' filtro
        // rarita' attivo, false altrimenti).
        const generics = _invPickerGenericMagicEntries();
        const filterActive = _invPickerActiveFilterCount() > 0;
        const genericsFiltered = filterActive ? [] : generics;
        let list = cat.filter(_invPickerMatchesFilters);
        if (q) {
            list = list.filter(o => {
                const txt = (o.nome || '') + ' ' + (o.nome_en || '') + ' ' + (o.tipo || '') + ' ' + (o.sotto_tipo || '') + ' ' + (o.rarita || '');
                return txt.toLowerCase().includes(q);
            });
        }
        const genericsVisible = q
            ? genericsFiltered.filter(g => g.nome.toLowerCase().includes(q) || g.tipo.toLowerCase().includes(q))
            : genericsFiltered;
        if (list.length === 0 && genericsVisible.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Nessun oggetto trovato per "${escapeHtml(q)}".</p>
            </div>`;
            return;
        }
        const genericsHtml = genericsVisible.map(g => {
            return `<div class="inv-picker-item inv-picker-item-generic" onclick="_invOpenGenericMagicDialog('${pgId}','${g.kind}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(g.nome)} <span class="inv-picker-item-en">scegli bonus e tipo</span></div>
                    <div class="inv-picker-item-meta">${escapeHtml(g.meta)}</div>
                </div>
            </div>`;
        }).join('');
        cont.innerHTML = genericsHtml + list.slice(0, 200).map(o => {
            const meta = (typeof window.formatOggettoMeta === 'function')
                ? window.formatOggettoMeta(o) : '';
            const rarClass = _invRarityClass(o.rarita);
            const pendingBadge = o._nome_pending
                ? '<span class="inv-picker-tr-pending" title="Traduzione italiana in arrivo">TR</span>'
                : '';
            const subEn = (o._nome_pending && o.nome_en && o.nome_en !== o.nome)
                ? '' : (o.nome_en && o.nome_en !== o.nome ? `<span class="inv-picker-item-en">${escapeHtml(o.nome_en)}</span>` : '');
            return `<div class="inv-picker-item ${rarClass}" onclick="_invShowItemPreview('${pgId}','catalog','${o.id}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(o.nome || 'Oggetto')} ${pendingBadge} ${subEn}</div>
                    ${meta ? `<div class="inv-picker-item-meta">${escapeHtml(meta)}</div>` : ''}
                </div>
            </div>`;
        }).join('') + (list.length > 200
            ? `<div class="inv-picker-empty" style="padding:8px;font-size:0.8rem;color:var(--text-secondary);">Mostrando i primi 200 di ${list.length} risultati. Affina la ricerca.</div>`
            : '');
        return;
    }
    if (_invPickerState.tab === 'veleni') {
        const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
        if (ven.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Catalogo veleni non disponibile.</p>
            </div>`;
            return;
        }
        let vlist = ven.filter(_invPickerMatchesFilters);
        if (q) {
            vlist = vlist.filter(o => {
                const txt = (o.nome_it || '') + ' ' + (o.nome_en || '') + ' '
                    + (o.sotto_tipo_it || '') + ' ' + (o.categoria_it || '') + ' '
                    + (o.rarita_it || '');
                return txt.toLowerCase().includes(q);
            });
        }
        if (vlist.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Nessun veleno trovato per "${escapeHtml(q)}".</p>
            </div>`;
            return;
        }
        cont.innerHTML = vlist.slice(0, 200).map(o => {
            const meta = `${o.sotto_tipo_it || ''}${o.categoria_it ? ' (' + o.categoria_it + ')' : ''} · ${o.rarita_it || ''} · ${o.prezzo_mo || 0} mo`;
            const rarClass = _invRarityClass(o.rarita_it);
            const pendingBadge = o._nome_pending
                ? '<span class="inv-picker-tr-pending" title="Traduzione italiana in arrivo">TR</span>'
                : '';
            const subEn = (o.nome_en && o.nome_en !== o.nome_it)
                ? `<span class="inv-picker-item-en">${escapeHtml(o.nome_en)}</span>` : '';
            return `<div class="inv-picker-item ${rarClass}" onclick="_invShowItemPreview('${pgId}','veleni','${o.id}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(o.nome_it || o.nome_en || 'Veleno')} ${pendingBadge} ${subEn}</div>
                    <div class="inv-picker-item-meta">${escapeHtml(meta)}</div>
                </div>
            </div>`;
        }).join('') + (vlist.length > 200
            ? `<div class="inv-picker-empty" style="padding:8px;font-size:0.8rem;color:var(--text-secondary);">Mostrando i primi 200 di ${vlist.length} risultati. Affina la ricerca.</div>`
            : '');
        return;
    }
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    let list = cache.filter(_invPickerMatchesFilters);
    if (q) {
        list = list.filter(o => {
            const txt = (o.nome || '') + ' ' + (o.tipo || '') + ' ' + (o.rarita || '');
            return txt.toLowerCase().includes(q);
        });
    }
    if (list.length === 0) {
        cont.innerHTML = `<div class="inv-picker-empty">
            <p style="margin:0;">Nessun oggetto homebrew disponibile.</p>
            <p style="margin:6px 0 0 0;color:var(--text-secondary);font-size:0.85rem;">Crea oggetti nel Laboratorio o abilita gli homebrew degli amici dai Settings.</p>
        </div>`;
        return;
    }
    list.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    cont.innerHTML = list.map(o => {
        // formatOggettoMeta gia' include il bonus +N nella posizione
        // canonica (subito dopo tipo/sotto-tipo, prima della rarita').
        const meta = (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(o) : '';
        const author = o._is_own ? 'Tuo' : (o._author_name || 'Amico');
        return `<div class="inv-picker-item" onclick="_invShowItemPreview('${pgId}','homebrew','${o.id}')">
            <div class="inv-picker-item-main">
                <div class="inv-picker-item-name">${escapeHtml(o.nome || 'Oggetto')}</div>
                ${meta ? `<div class="inv-picker-item-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
            <div class="inv-picker-item-author">${escapeHtml(author)}</div>
        </div>`;
    }).join('');
}

// ──────────────────────────────────────────────────────────────────────
// Preview oggetto prima dell'aggiunta al tesoro.
// Apre un overlay sopra il picker con nome, meta, descrizione completa
// (formattata via formatRichText) e bottoni "Indietro" / "Aggiungi al
// tesoro". Funziona per source='catalog'|'veleni'|'homebrew'.
// ──────────────────────────────────────────────────────────────────────
function _invFindItemBySource(source, id) {
    if (source === 'catalog') {
        const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
        return cat.find(o => String(o.id) === String(id));
    }
    if (source === 'veleni') {
        const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
        return ven.find(o => String(o.id) === String(id));
    }
    if (source === 'homebrew') {
        const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
            ? AppState.cachedHomebrewOggetti : [];
        return cache.find(o => String(o.id) === String(id));
    }
    return null;
}

function _invPreviewExtract(source, it) {
    // Normalizza i campi cosi' la preview mostra la stessa shape per
    // tutti e tre i dataset (catalog, veleni, homebrew).
    if (!it) return null;
    if (source === 'veleni') {
        const meta = `${it.sotto_tipo_it || ''}${it.categoria_it ? ' (' + it.categoria_it + ')' : ''} · ${it.rarita_it || ''} · ${it.prezzo_mo || 0} mo`;
        return {
            nome: it.nome_it || it.nome_en || 'Veleno',
            nomeAlt: (it.nome_en && it.nome_en !== it.nome_it) ? it.nome_en : '',
            rarita: it.rarita_it || 'Comune',
            meta,
            extras: it.fonte ? `<div class="inv-preview-extra"><b>Fonte:</b> ${escapeHtml(it.fonte)}</div>` : '',
            descrizione: it.descrizione_it || it.descrizione_en || '',
            pendingTr: !!it._desc_pending,
        };
    }
    if (source === 'homebrew') {
        const meta = (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(it) : '';
        const author = it._is_own ? 'Tuo' : (it._author_name || 'Amico');
        return {
            nome: it.nome || 'Oggetto',
            nomeAlt: '',
            rarita: it.rarita || 'Comune',
            meta,
            extras: `<div class="inv-preview-extra"><b>Autore:</b> ${escapeHtml(author)}</div>`,
            descrizione: it.descrizione || it.proprieta || '',
            pendingTr: false,
        };
    }
    // catalog
    const meta = (typeof window.formatOggettoMeta === 'function')
        ? window.formatOggettoMeta(it) : '';
    return {
        nome: it.nome || it.nome_en || 'Oggetto',
        nomeAlt: (it.nome_en && it.nome_en !== it.nome) ? it.nome_en : '',
        rarita: it.rarita || 'Comune',
        meta,
        extras: '',
        descrizione: it.descrizione || it.descrizione_en || '',
        pendingTr: !!it._desc_pending,
    };
}

window._invShowItemPreview = function(pgId, source, id) {
    const it = _invFindItemBySource(source, id);
    if (!it) return;
    const data = _invPreviewExtract(source, it);
    if (!data) return;
    const rarClass = _invRarityClass(data.rarita);
    const descHtml = data.descrizione
        ? (typeof window.formatRichText === 'function'
            ? window.formatRichText(data.descrizione)
            : escapeHtml(data.descrizione).replace(/\n/g, '<br>'))
        : '<i style="color:var(--text-muted);">Nessuna descrizione disponibile.</i>';
    const trBadge = data.pendingTr
        ? '<span class="inv-picker-tr-pending" style="margin-left:8px;" title="Traduzione italiana in arrivo">TR</span>'
        : '';
    const altName = data.nomeAlt
        ? `<div class="inv-preview-alt">${escapeHtml(data.nomeAlt)}</div>` : '';

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay inv-preview-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-preview-modal ${rarClass}">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <div class="inv-preview-header">
            <h3 class="inv-preview-title">${escapeHtml(data.nome)}${trBadge}</h3>
            ${altName}
            ${data.meta ? `<div class="inv-preview-meta">${escapeHtml(data.meta)}</div>` : ''}
            ${data.extras || ''}
        </div>
        <div class="inv-preview-desc">${descHtml}</div>
        <div class="dialog-actions inv-preview-actions">
            <button type="button" class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">← Indietro</button>
            <button type="button" class="btn-primary" id="invPreviewAddBtn">Aggiungi all'inventario</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#invPreviewAddBtn').onclick = () => {
        overlay.remove();
        if (source === 'catalog') return invAddFromCatalog(pgId, id);
        if (source === 'veleni')  return invAddFromVeleni(pgId, id);
        if (source === 'homebrew') return invAddFromHomebrew(pgId, id);
    };
};

window.invAddFromHomebrew = async function(pgId, hbId) {
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    const hb = cache.find(o => String(o.id) === String(hbId));
    if (!hb) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    // Riferimento "live": salviamo solo i metadati di lookup + alcuni
    // campi snapshot di fallback (utili se l'autore cancella l'oggetto).
    const entry = {
        nome: hb.nome || 'Oggetto',
        descrizione: hb.descrizione || hb.proprieta || '',
        quantita: 1,
        magico: parseInt(hb.incantamento) > 0,
        _homebrew_id: hb.id,
        _homebrew_owner_uid: hb._author_uid,
    };
    if (parseInt(hb.incantamento) > 0) entry.magic_bonus = parseInt(hb.incantamento);
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// Aggiunge un oggetto del catalogo (immutabile) al tesoro come snapshot
// completo: dato che il catalogo non cambia, copiamo direttamente i campi
// utili (tipo, sotto_tipo, rarita, incantamento, sintonia, descrizione)
// nell'inventario senza riferimenti "live".
window.invAddFromCatalog = async function(pgId, catId) {
    const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
    const it = cat.find(o => String(o.id) === String(catId));
    if (!it) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: it.nome || it.nome_en || 'Oggetto',
        descrizione: it.descrizione || it.descrizione_en || '',
        quantita: 1,
        tipo: it.tipo || '',
        sotto_tipo: it.sotto_tipo || '',
        rarita: it.rarita || '',
        richiede_sintonia: !!it.richiede_sintonia,
        sintonia_dettaglio: it.sintonia_dettaglio || '',
        incantamento: parseInt(it.incantamento) || 0,
        magico: (it.rarita && it.rarita !== 'Comune') || (parseInt(it.incantamento) > 0),
        _catalog_id: it.id,
    };
    if (parseInt(it.incantamento) > 0) entry.magic_bonus = parseInt(it.incantamento);
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// ──────────────────────────────────────────────────────────────────────
// Voci "generiche" del catalogo: Arma/Armatura/Scudo +N.
// Vengono mostrate in cima alla lista del catalogo. Cliccandole si apre
// un dialog a 2 step (bonus → tipo specifico) che alla conferma aggiunge
// l'oggetto all'inventario come snapshot completo (analogo a un item
// del catalogo "fisso").
// ──────────────────────────────────────────────────────────────────────
// Restituisce il nome dell'item per il display, rimuovendo un eventuale
// suffisso " +N" duplicato quando lo stesso bonus e' gia' presente in
// magic_bonus (cosi' i vecchi item salvati con il vecchio formato
// "Pugnale +2" non si vedono come "Pugnale +2 +2"). Per i nuovi item
// salviamo il nome senza bonus, quindi qui non serve fare nulla.
function _invDisplayName(view) {
    if (!view) return '';
    const nome = view.nome || '';
    const bonus = parseInt(view.magic_bonus) || parseInt(view._homebrew_incantamento) || 0;
    if (bonus <= 0) return nome;
    const re = /\s*\+\d+\s*$/;
    return nome.replace(re, '').trim() || nome;
}
window._invDisplayName = _invDisplayName;

function _invPickerGenericMagicEntries() {
    return [
        { kind: 'arma',          nome: 'Arma Magica',     tipo: 'Arma',     meta: 'Bonus: +1 / +2 / +3 · scegli tipo arma' },
        { kind: 'armatura',      nome: 'Armatura Magica', tipo: 'Armatura', meta: 'Bonus: +1 / +2 / +3 · scegli tipo armatura' },
        { kind: 'scudo',         nome: 'Scudo Magico',    tipo: 'Scudo',    meta: 'Bonus: +1 / +2 / +3' },
        { kind: 'pozione_cura',  nome: 'Pozione di Cura', tipo: 'Pozione',  meta: 'Comune / Non Comune / Raro / Molto Raro · scegli grado' },
    ];
}

// Varianti della Pozione di Cura (SRD). HP recuperati = dadi + bonus fisso.
// Le mostriamo come una sola "voce generica" del catalogo: l'utente
// seleziona quale grado tra i quattro al momento dell'aggiunta.
const _POTION_HEALING_VARIANTS = [
    { id: 'common',    nome: 'Pozione di Cura',           rarita: 'Comune',     dado: '2d4 + 2',   nome_en: 'Potion of Healing' },
    { id: 'uncommon',  nome: 'Pozione di Cura Maggiore',  rarita: 'Non Comune', dado: '4d4 + 4',   nome_en: 'Potion of Greater Healing' },
    { id: 'rare',      nome: 'Pozione di Cura Superiore', rarita: 'Raro',       dado: '8d4 + 8',   nome_en: 'Potion of Superior Healing' },
    { id: 'very_rare', nome: 'Pozione di Cura Suprema',   rarita: 'Molto Raro', dado: '10d4 + 20', nome_en: 'Potion of Supreme Healing' },
];

function _potionHealingDescription(variant) {
    return `Quando bevi questa pozione, recuperi ${variant.dado} punti ferita. Indipendentemente dalla sua potenza, il liquido rosso della pozione luccica quando viene agitato.`;
}

const _GENERIC_BONUS_OPTS = [
    { bonus: 1, rarita: 'Non Comune' },
    { bonus: 2, rarita: 'Raro' },
    { bonus: 3, rarita: 'Molto Raro' },
];

window._invOpenGenericMagicDialog = function(pgId, kind) {
    if (kind === 'pozione_cura') {
        return _invOpenPotionHealingDialog(pgId);
    }
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const labels = { arma: 'Arma Magica', armatura: 'Armatura Magica', scudo: 'Scudo Magico' };
    const title = labels[kind] || 'Oggetto Magico';
    const bonusBtns = _GENERIC_BONUS_OPTS.map(b => {
        const rarClass = _invRarityClass(b.rarita);
        return `<button type="button" class="generic-magic-bonus-btn ${rarClass}"
            onclick="_invGenericPickType('${pgId}','${kind}',${b.bonus})">
            <span class="generic-magic-bonus">+${b.bonus}</span>
            <span class="generic-magic-rar">${b.rarita}</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(title)}</h3>
        <p class="generic-magic-sub">Step 1 di 2 · Scegli il bonus magico</p>
        <div class="generic-magic-bonus-grid">${bonusBtns}</div>
        <div class="dialog-actions" style="margin-top:14px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window._invGenericPickType = function(pgId, kind, bonus) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    if (kind === 'scudo') {
        // Lo scudo non ha sotto-tipi: aggiungiamo subito.
        _invAddGenericMagicItem(pgId, kind, bonus, 'Scudo');
        return;
    }
    let options = [];
    let labelTipo = '';
    if (kind === 'arma') {
        labelTipo = 'arma';
        const armi = (typeof DND_ARMI !== 'undefined') ? DND_ARMI : [];
        options = armi.map(a => ({
            id: a.nome,
            label: a.nome,
            sub: `${a.danni} ${a.tipo_danno}`,
            cat: a.cat,
        }));
    } else {
        labelTipo = 'armatura';
        const arms = (typeof DND_ARMATURE !== 'undefined') ? DND_ARMATURE : [];
        options = arms.filter(a => a.cat !== 'scudo').map(a => ({
            id: a.nome,
            label: a.nome,
            sub: `CA ${a.ca_base} · ${a.cat}`,
            cat: a.cat,
        }));
    }
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rar = _GENERIC_BONUS_OPTS.find(b => b.bonus === bonus)?.rarita || 'Non Comune';
    // Raggruppa per categoria per leggibilita'.
    const groups = {};
    for (const o of options) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = (kind === 'arma')
        ? ['semplice_mischia', 'semplice_distanza', 'guerra_mischia', 'guerra_distanza']
        : ['leggera', 'media', 'pesante'];
    const groupLabels = {
        semplice_mischia: 'Semplici da Mischia', semplice_distanza: 'Semplici a Distanza',
        guerra_mischia: 'Da Guerra (Mischia)', guerra_distanza: 'Da Guerra (Distanza)',
        leggera: 'Armatura Leggera', media: 'Armatura Media', pesante: 'Armatura Pesante',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_invAddGenericMagicItem('${pgId}','${kind}',${bonus},'${escapeHtml(o.id).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.label)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(o.sub)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${kind === 'arma' ? 'Arma' : 'Armatura'} +${bonus} <span class="generic-magic-rar-inline">(${escapeHtml(rar)})</span></h3>
        <p class="generic-magic-sub">Step 2 di 2 · Scegli il tipo di ${escapeHtml(labelTipo)}</p>
        <div class="generic-magic-type-list">${body}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:space-between;">
            <button class="btn-secondary" onclick="_invOpenGenericMagicDialog('${pgId}','${kind}')">← Indietro</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window._invAddGenericMagicItem = async function(pgId, kind, bonus, tipoSpecifico) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const rar = _GENERIC_BONUS_OPTS.find(b => b.bonus === bonus)?.rarita || 'Non Comune';
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const tipoCatLabel = { arma: 'Arma', armatura: 'Armatura', scudo: 'Scudo' }[kind] || 'Oggetto';
    // Costruisco l'entry replicando la forma usata da invAddFromCatalog,
    // cosi' rimane consistente con gli oggetti del catalogo "fisso".
    // IMPORTANTE: il nome NON deve contenere "+N" perche' il bonus
    // viene gia' mostrato come badge separato in tutte le viste; se
    // lo includessimo nel nome ne vedremmo due (es. "Pugnale +2 +2").
    const nome = tipoSpecifico;
    const entry = {
        nome,
        descrizione: `${tipoCatLabel} magica/o con bonus +${bonus} ai tiri per colpire e ai danni (arma) o alla CA (armatura/scudo).`,
        quantita: 1,
        tipo: tipoCatLabel,
        sotto_tipo: tipoSpecifico,
        rarita: rar,
        richiede_sintonia: false,
        sintonia_dettaglio: '',
        incantamento: bonus,
        magico: true,
        magic_bonus: bonus,
    };
    // Per le armi cerco i dati combat (danni, tipo_danno, proprieta) cosi'
    // che il sistema di equip/danni funzioni come per le armi normali.
    if (kind === 'arma' && typeof DND_ARMI !== 'undefined') {
        const arma = DND_ARMI.find(a => a.nome === tipoSpecifico);
        if (arma) {
            entry.danni = arma.danni;
            entry.tipo_danno = arma.tipo_danno;
            entry.proprieta = arma.proprieta;
            entry.cat = arma.cat;
        }
    }
    if (kind === 'armatura' && typeof DND_ARMATURE !== 'undefined') {
        const arm = DND_ARMATURE.find(a => a.nome === tipoSpecifico);
        if (arm) {
            entry.ca_base = arm.ca_base;
            entry.cat = arm.cat;
            entry.mod_des = arm.mod_des;
            entry.max_des = arm.max_des;
            entry.forza = arm.forza;
            entry.furtivita = arm.furtivita;
        }
    }
    if (kind === 'scudo' && typeof DND_ARMATURE !== 'undefined') {
        const sh = DND_ARMATURE.find(a => a.cat === 'scudo');
        if (sh) {
            entry.ca_base = sh.ca_base;
            entry.cat = sh.cat;
        }
    }
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

// ──────────────────────────────────────────────────────────────────────
// Voce generica "Pozione di Cura": un solo item nel picker che apre un
// dialog con le 4 varianti SRD (Comune / Maggiore / Superiore / Suprema).
// Click su una variante => aggiunta diretta al tesoro come snapshot.
// ──────────────────────────────────────────────────────────────────────
function _invOpenPotionHealingDialog(pgId) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rows = _POTION_HEALING_VARIANTS.map(v => {
        const rarClass = _invRarityClass(v.rarita);
        return `<button type="button" class="generic-magic-type-row ${rarClass}"
            onclick="_invAddPotionHealing('${pgId}','${v.id}')">
            <span class="generic-magic-type-name">${escapeHtml(v.nome)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(v.rarita)} · recupera ${escapeHtml(v.dado)} PF</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">Pozione di Cura</h3>
        <p class="generic-magic-sub">Scegli il grado della pozione</p>
        <div class="generic-magic-type-list">${rows}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

window._invAddPotionHealing = async function(pgId, variantId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const variant = _POTION_HEALING_VARIANTS.find(v => v.id === variantId);
    if (!variant) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: variant.nome,
        descrizione: _potionHealingDescription(variant),
        quantita: 1,
        tipo: 'Pozione',
        sotto_tipo: 'Cura',
        rarita: variant.rarita,
        richiede_sintonia: false,
        sintonia_dettaglio: '',
        magico: true,
        // Per consultazione veloce dal sistema HP / consumo.
        cura_dado: variant.dado,
    };
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

// Aggiunge un veleno del catalogo (immutabile) all'inventario come
// snapshot. Il veleno viene salvato come oggetto consumabile con tutte
// le info utili (sotto_tipo, categoria, prezzo, rarita, descrizione).
window.invAddFromVeleni = async function(pgId, veId) {
    const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
    const it = ven.find(o => String(o.id) === String(veId));
    if (!it) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: it.nome_it || it.nome_en || 'Veleno',
        descrizione: it.descrizione_it || it.descrizione_en || '',
        quantita: 1,
        tipo: 'Veleno',
        sotto_tipo: it.sotto_tipo_it || it.sotto_tipo_en || '',
        rarita: it.rarita_it || 'Comune',
        magico: false,
        prezzo_mo: it.prezzo_mo || 0,
        _veleno_categoria: it.categoria_it || it.categoria_en || '',
        _veleno_id: it.id,
    };
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invQuickCreate = function(pgId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const rarita = ['Comune','Non Comune','Raro','Molto Raro','Leggendario','Artefatto'];
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-quick-modal" style="width:780px;max-width:96vw;text-align:left;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Crea oggetto rapido</h3>
        <div class="inv-quick-row">
            <input type="text" id="invItemNome" class="hp-calc-input inv-quick-name" placeholder="Nome oggetto">
            <select id="invItemRarita" class="hp-calc-input inv-quick-rarita">
                ${rarita.map(r => `<option value="${r}" ${r === 'Comune' ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            <input type="number" id="invItemQty" class="hp-calc-input inv-quick-qty" value="1" min="1" title="Quantita'">
        </div>
        ${window.renderTextareaFullscreen({
            id: 'invItemDesc',
            className: 'equip-desc-textarea inv-quick-desc',
            rows: 6,
            placeholder: "Descrizione dell'oggetto...",
            value: '',
        })}
        <div class="dialog-actions" style="margin-top:12px;">
            <button class="btn-secondary" onclick="invAddItem('${pgId}')">Indietro</button>
            <button class="btn-primary" onclick="invSaveNewItem('${pgId}')">Aggiungi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window.invSaveNewItem = async function(pgId) {
    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    const qty = parseInt(document.getElementById('invItemQty')?.value) || 1;
    const rarita = document.getElementById('invItemRarita')?.value || 'Comune';
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = { nome, descrizione: desc, quantita: qty, rarita };
    // Magico inferito: tutto cio' che non e' "Comune" e' magico per definizione D&D.
    entry.magico = rarita !== 'Comune';
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// Aggiornamento inline della quantita' direttamente dalla riga del
// tesoro. Salta il save se il valore non e' cambiato; supporta sia
// onchange che onblur senza moltiplicare le scritture (debouncing
// implicito via flag pendente sul campo). Per gli oggetti homebrew
// aggiorna solo `quantita`, preservando i metadati di lookup.
// Toggle del popover informativo accanto al titolo del dialog di
// modifica oggetto (sostituisce il vecchio banner fisso).
window.invToggleHbInfo = function(btn) {
    const pop = btn?.parentElement?.querySelector('.inv-edit-info-pop');
    if (!pop) return;
    const wasOpen = !pop.hasAttribute('hidden');
    if (wasOpen) {
        pop.setAttribute('hidden', '');
        return;
    }
    pop.removeAttribute('hidden');
    setTimeout(() => {
        const onDoc = (ev) => {
            if (!pop.contains(ev.target) && ev.target !== btn) {
                pop.setAttribute('hidden', '');
                document.removeEventListener('click', onDoc, true);
            }
        };
        document.addEventListener('click', onDoc, true);
    }, 0);
};

window.invQtyInlineUpdate = async function(pgId, idx, rawVal) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const prev = inventario[idx];
    if (!prev) return;
    let qty = parseInt(rawVal, 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > 9999) qty = 9999;
    if ((prev.quantita || 1) === qty) return; // niente da fare
    inventario[idx] = { ...prev, quantita: qty };
    pg.inventario = inventario;
    try {
        await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    } catch (e) {
        console.warn('[inv] errore aggiornamento quantita\' inline:', e);
    }
};

window.invEditItem = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const raw = (pg.inventario || [])[idx];
    if (!raw) return;
    const item = _invResolveLive(raw);
    const isHomebrew = !!raw._homebrew_id;
    const hbMeta = isHomebrew
        ? (item._homebrew_meta || (typeof window.formatOggettoMeta === 'function'
            ? window.formatOggettoMeta({
                tipo: item._homebrew_tipo,
                sotto_tipo: item._homebrew_sotto_tipo,
                rarita: item._homebrew_rarita,
                incantamento: item._homebrew_incantamento,
                richiede_sintonia: item._homebrew_richiede_sintonia,
                sintonia_dettaglio: item._homebrew_sintonia_dettaglio,
            }) : ''))
        : '';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const lockAttr = isHomebrew ? 'readonly' : '';
    // Sotto-titolo discreto con la formula meta D&D ("Tipo, rarita'
    // (richiede sintonia)"). Sempre visibile per gli homebrew, niente
    // banner ingombrante.
    const metaLine = (isHomebrew && hbMeta)
        ? `<div class="inv-edit-meta">${escapeHtml(hbMeta)}</div>`
        : '';
    // Bottoncino "i" compatto: al click rivela un piccolo popover con
    // il dettaglio "Homebrew di X · live updates". Niente banner fisso.
    const infoBtn = isHomebrew
        ? `<button type="button" class="inv-edit-info-btn"
            title="Informazioni su questo oggetto homebrew"
            onclick="invToggleHbInfo(this)">i</button>
           <div class="inv-edit-info-pop" hidden>
                Homebrew di <b>${escapeHtml(item._homebrew_author || 'Autore')}</b>.<br>
                Nome e descrizione si aggiornano live dall'autore: qui puoi solo vederli.
                Per modificare la quantita' usa il numero accanto all'oggetto nella tabella.
           </div>`
        : '';
    overlay.innerHTML = `<div class="hp-calc-modal inv-edit-modal" style="width:720px;max-width:96vw;text-align:left;">
        <div class="inv-edit-header">
            <h3>Modifica Oggetto</h3>
            ${infoBtn}
        </div>
        <input type="text" id="invItemNome" class="hp-calc-input" value="${escapeHtml(item.nome || '')}" placeholder="Nome" style="margin-bottom:6px;" ${lockAttr}>
        ${metaLine}
        ${isHomebrew
            ? `<div class="equip-desc-rendered">${(item.descrizione && item.descrizione.trim())
                ? window.formatRichText(item.descrizione)
                : '<span class="equip-desc-empty">Nessuna descrizione</span>'}</div>`
            : window.renderTextareaFullscreen({
                id: 'invItemDesc',
                className: 'equip-desc-textarea',
                rows: 10,
                placeholder: 'Descrizione (effetti magici, note...)',
                value: item.descrizione || '',
            })
        }
        <div class="dialog-actions" style="margin-top:12px;">
            <button class="btn-danger" onclick="invDeleteFromEdit('${pgId}',${idx})">Elimina</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="invUpdateItem('${pgId}',${idx})">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window.invSelectMagicBonus = function(btn, bonus) {
    const row = btn.parentElement;
    if (!row) return;
    row.querySelectorAll('.custom-res-dice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const hidden = document.getElementById('invItemMagicBonus');
    if (hidden) hidden.value = String(bonus);
};

window.invUpdateItem = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const prev = inventario[idx] || {};

    // Per gli oggetti homebrew non c'e' nulla da modificare nel dialog
    // (nome e descrizione sono read-only e arrivano live dalla cache,
    // la quantita' si modifica inline nella tabella). Ci limitiamo a
    // chiudere il dialog senza salvare.
    if (prev._homebrew_id) {
        document.querySelector('.hp-calc-overlay')?.remove();
        return;
    }

    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    // Conserviamo eventuali metadati storici (magico/magic_bonus) gia'
    // salvati: il dialog non li espone piu' ma non vogliamo perderli su
    // oggetti pre-esistenti.
    const updated = {
        ...prev,
        nome,
        descrizione: desc,
        quantita: prev.quantita || 1,
    };
    inventario[idx] = updated;
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invDeleteFromEdit = async function(pgId, idx) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare oggetto?',
        message: 'L\'oggetto verra\' rimosso dal tesoro.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    document.querySelector('.hp-calc-overlay')?.remove();
    await window.invRemoveItem(pgId, idx);
};

window.invRemoveItem = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const removed = inventario[idx];
    inventario.splice(idx, 1);
    pg.inventario = inventario;
    // Propaga la rimozione all'equipaggiamento: ogni entry equip
    // creata da questo oggetto del tesoro (matched per _treasure_uid)
    // viene rimossa. La rimozione dall'equip non tocca il tesoro
    // (relazione unidirezionale: equip -> tesoro).
    const removedUid = removed && removed._treasure_uid;
    const updates = { inventario };
    let equipChanged = false;
    let attuneChanged = false;
    if (removedUid) {
        if (Array.isArray(pg.equipaggiamento)) {
            const before = pg.equipaggiamento.length;
            pg.equipaggiamento = pg.equipaggiamento.filter(e => e.from_treasure_uid !== removedUid);
            if (pg.equipaggiamento.length !== before) {
                equipChanged = true;
                updates.equipaggiamento = pg.equipaggiamento;
                const newCA = calcCAFromEquip(pg);
                pg.classe_armatura = newCA;
                updates.classe_armatura = newCA;
            }
        }
        if (Array.isArray(pg.sintonia)) {
            const newSint = pg.sintonia.map(s => {
                if (s && typeof s === 'object' && s.from_treasure_uid === removedUid) {
                    attuneChanged = true;
                    return null;
                }
                return s;
            });
            if (attuneChanged) {
                pg.sintonia = newSint;
                updates.sintonia = newSint;
            }
        }
    }
    await supabase.from('personaggi').update(updates).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
    if (equipChanged && attuneChanged) {
        showNotification('Oggetto rimosso anche da equipaggiamento e sintonia');
    } else if (equipChanged) {
        showNotification('Oggetto rimosso anche dall\'equipaggiamento');
    } else if (attuneChanged) {
        showNotification('Oggetto rimosso anche dalla sintonia');
    }
};

// Estrae dal tesoro tutti gli oggetti che richiedono sintonia (catalogo
// SRD o homebrew). Esclude eventuali entry gia' usate da uno slot di
// sintonia diverso da quello in editing (per non duplicare).
function _schedaInvAttunableItems(pg, currentSlotIdx) {
    if (!pg || !Array.isArray(pg.inventario)) return [];
    const sintonia = Array.isArray(pg.sintonia) ? pg.sintonia : [];
    const usedUids = new Set();
    sintonia.forEach((s, i) => {
        if (i === currentSlotIdx) return;
        if (s && typeof s === 'object' && s.from_treasure_uid) usedUids.add(s.from_treasure_uid);
    });
    const out = [];
    pg.inventario.forEach((entry, index) => {
        const view = (typeof window._invResolveLive === 'function')
            ? window._invResolveLive(entry) : entry;
        const requires = !!(view.richiede_sintonia || view._homebrew_richiede_sintonia);
        if (!requires) return;
        if (entry._treasure_uid && usedUids.has(entry._treasure_uid)) return;
        out.push({ index, view });
    });
    return out;
}

window.invEditAttune = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const raw = (pg.sintonia || [])[idx] || null;
    const current = (raw && typeof raw === 'object')
        ? raw
        : (raw ? { nome: String(raw) } : null);

    let currentHtml = '';
    let pickerHtml = '';
    if (current) {
        const bonus = current.magic_bonus || 0;
        const nameWithEnch = `${escapeHtml(_invDisplayName(current) || 'Oggetto')}${bonus ? ' +' + bonus : ''}`;
        const descHtml = current.descrizione
            ? `<div class="inv-attune-current-desc">${(typeof window.formatRichText === 'function' ? window.formatRichText(current.descrizione) : escapeHtml(current.descrizione))}</div>`
            : '<div class="inv-attune-current-desc inv-attune-current-desc-empty">Nessuna descrizione disponibile per questo oggetto.</div>';
        currentHtml = `<div class="inv-attune-current">
            <div class="inv-attune-current-head">
                <div>
                    <div class="inv-attune-current-label">Slot occupato da</div>
                    <div class="inv-attune-current-name">${nameWithEnch}</div>
                </div>
                <button class="btn-danger" onclick="invDeleteAttuneFromEdit('${pgId}',${idx})">Libera slot</button>
            </div>
            ${descHtml}
        </div>`;
    } else {
        const attunable = _schedaInvAttunableItems(pg, idx);
        const treasureRows = attunable.length ? attunable.map(({ index, view }) => {
            const ench = view.magic_bonus || view._homebrew_incantamento || 0;
            const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
            const rar = view._homebrew_rarita || view.rarita || '';
            const rarClass = _invRarityClass(rar);
            const subText = [sub, rar].filter(Boolean).join(' · ') || 'Richiede sintonia';
            return `<button type="button" class="inv-attune-pick-row ${rarClass}"
                    onclick="invAttuneFromTreasure('${pgId}',${idx},${index})">
                <span class="inv-attune-pick-name">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${ench ? ' +' + ench : ''}</span>
                <span class="inv-attune-pick-sub">${escapeHtml(subText)}</span>
            </button>`;
        }).join('') : `<div class="inv-attune-pick-empty">
                Nessun oggetto che richiede sintonia nel tuo tesoro.<br>
                <small>Aggiungi prima l'oggetto al tesoro, poi torna qui per assegnarlo a uno slot di sintonia.</small>
            </div>`;
        pickerHtml = `<div class="inv-attune-pick-section">
            <div class="inv-attune-pick-label">Scegli dal Tesoro</div>
            <div class="inv-attune-pick-list">${treasureRows}</div>
        </div>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-attune-modal">
        <button class="hp-calc-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <div class="hp-calc-title">Sintonia – Slot ${idx + 1}</div>
        ${currentHtml}
        ${pickerHtml}
        <div class="dialog-actions inv-attune-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

// Salva immediatamente l'oggetto del tesoro selezionato nello slot di sintonia.
window.invAttuneFromTreasure = async function(pgId, slotIdx, invIndex) {
    const pg = _schedaPgCache;
    if (!pg || !Array.isArray(pg.inventario)) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const desc = view.descrizione || view._homebrew_meta || '';
    const uid = _schedaEnsureInvUid(pg.inventario, invIndex);

    const slot = { nome: _invDisplayName(view) || view.nome || 'Oggetto' };
    if (desc) slot.descrizione = desc;
    if (ench > 0) slot.magic_bonus = ench;
    if (uid) slot.from_treasure_uid = uid;

    const sintonia = pg.sintonia ? [...pg.sintonia] : [null, null, null];
    while (sintonia.length < 3) sintonia.push(null);
    sintonia[slotIdx] = slot;
    pg.sintonia = sintonia;

    const updates = { sintonia };
    if (uid) updates.inventario = pg.inventario;
    await supabase.from('personaggi').update(updates).eq('id', pgId);

    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invDeleteAttuneFromEdit = async function(pgId, idx) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Liberare lo slot?',
        message: 'L\'oggetto verra\' rimosso dallo slot di sintonia (resta nel tesoro).',
        confirmLabel: 'Libera', danger: true,
    });
    if (!ok) return;
    document.querySelector('.hp-calc-overlay')?.remove();
    await window.invRemoveAttune(pgId, idx);
};

window.invRemoveAttune = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const sintonia = pg.sintonia ? [...pg.sintonia] : [null, null, null];
    sintonia[idx] = null;
    pg.sintonia = sintonia;
    await supabase.from('personaggi').update({ sintonia }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};
