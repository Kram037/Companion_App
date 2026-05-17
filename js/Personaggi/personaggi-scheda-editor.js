// ============================================================================
// CHARACTER SHEET EDITORS
// ============================================================================

window.schedaOpenResImmEdit = function(pgId) {
    const display = document.getElementById('schedaResImmDisplay');
    const grid = document.getElementById('schedaResImmEditGrid');
    if (!display || !grid) return;

    if (grid.style.display !== 'none') {
        grid.style.display = 'none';
        display.style.display = '';
        return;
    }

    const pg = _schedaPgCache;
    if (!pg) return;
    const res = pg.resistenze || [];
    const imm = pg.immunita || [];

    grid.innerHTML = `
        <div class="pg-res-header">
            <span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span>
        </div>
        <div class="pg-res-grid">
            ${DAMAGE_TYPES.map(dt => {
                const isRes = res.includes(dt.value);
                const isImm = imm.includes(dt.value);
                return `<div class="pg-res-row">
                    <span class="pg-res-label">${dt.label}</span>
                    <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} data-val="${dt.value}" data-type="res" title="Resistenza">
                    <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} data-val="${dt.value}" data-type="imm" title="Immunità">
                </div>`;
            }).join('')}
        </div>
        <div style="text-align:center;margin-top:8px;">
            <button class="btn-primary" id="schedaResImmSaveBtn" style="padding:6px 24px;font-size:0.85rem;">Salva</button>
        </div>`;

    display.style.display = 'none';
    grid.style.display = '';

    document.getElementById('schedaResImmSaveBtn').addEventListener('click', async () => {
        const newRes = [];
        const newImm = [];
        grid.querySelectorAll('.pg-res-cb:checked').forEach(cb => newRes.push(cb.dataset.val));
        grid.querySelectorAll('.pg-imm-cb:checked').forEach(cb => newImm.push(cb.dataset.val));

        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { error } = await supabase.from('personaggi').update({ resistenze: newRes, immunita: newImm }).eq('id', pgId);
        if (error) { showNotification('Errore: ' + error.message); return; }

        if (_schedaPgCache) {
            _schedaPgCache.resistenze = newRes;
            _schedaPgCache.immunita = newImm;
        }

        const resDisp = newRes.length > 0 ?
            newRes.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const immDisp = newImm.length > 0 ?
            newImm.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        display.innerHTML = `
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resDisp}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immDisp}</div></div>`;

        grid.style.display = 'none';
        display.style.display = '';
        showNotification('Resistenze e immunità aggiornate');
    });
}

function _schedaTalentiContentHtml(currentTalenti) {
    const ctx = 'scheda';
    if (!window._featPickerFilters[ctx]) window._featPickerFilters[ctx] = _defaultFeatFilters();
    const f = window._featPickerFilters[ctx];
    const q = (window._featPickerSearch[ctx] || '').trim().toLowerCase();

    const selectedHtml = currentTalenti.map((nome, i) => {
        const info = _featInfo(nome) || { source_short: '?' };
        const t = {
            nome,
            fonte: info.source_short || '',
            prerequisites: info.prerequisites || '',
            description: info.description || ''
        };
        return _featPickerItemHtml(t, { selected: true, removeOnClick: `schedaTalentoRemove(${i})` });
    }).join('');

    const available = _featsList()
        .filter(t => !currentTalenti.includes(t.nome))
        .filter(t => _featMatchesFilters(t, f))
        .filter(t => _featMatchesSearch(t, q));

    const listHtml = available.map(t =>
        _featPickerItemHtml(t, { onClick: `schedaTalentoAdd('${escapeHtml(t.nome).replace(/'/g, "\\'")}')` })
    ).join('') || '<div class="scheda-empty" style="padding:12px;">Nessun talento corrisponde ai filtri.</div>';

    return `
        ${_featPickerHeaderHtml(ctx)}
        ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
}

window.schedaOpenTalentiEdit = function(pgId) {
    const pg = _schedaPgCache;
    const currentTalenti = pg?.talenti ? [...pg.talenti] : [];

    // Reset stato filtri/ricerca per il contesto scheda ad ogni apertura.
    window._featPickerFilters['scheda'] = _defaultFeatFilters();
    window._featPickerSearch['scheda'] = '';

    const modalHtml = `
    <div class="modal active" id="schedaTalentiModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseTalentiEdit()">&times;</button>
            <h2>Modifica Talenti</h2>
            <div class="wizard-page-scroll" id="schedaTalentiContent">
                ${_schedaTalentiContentHtml(currentTalenti)}
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseTalentiEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaTalentiEditPgId = pgId;
    window._schedaTalentiEditList = currentTalenti;
};

window.schedaTalentoAdd = async function(nome) {
    if (!window._schedaTalentiEditList) return;
    if (!window._schedaTalentiEditList.includes(nome)) {
        window._schedaTalentiEditList.push(nome);
        await _schedaTalentiSave();
        _schedaTalentiRefreshModal();
    }
};

window.schedaTalentoRemove = async function(index) {
    if (!window._schedaTalentiEditList) return;
    window._schedaTalentiEditList.splice(index, 1);
    await _schedaTalentiSave();
    _schedaTalentiRefreshModal();
};

async function _schedaTalentiSave() {
    const pgId = window._schedaTalentiEditPgId;
    const talenti = window._schedaTalentiEditList;
    if (!pgId) return;

    if (_schedaPgCache) _schedaPgCache.talenti = talenti;

    const display = document.getElementById('schedaTalentiDisplay');
    if (display) {
        display.innerHTML = talenti.length > 0
            ? talenti.map(t => `<span class="scheda-tag">${escapeHtml(t)}</span>`).join('')
            : '<span class="scheda-empty">Nessun talento</span>';
    }

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ talenti, updated_at: new Date().toISOString() }).eq('id', pgId);
    }
}

function _schedaTalentiRefreshModal() {
    const container = document.getElementById('schedaTalentiContent');
    if (!container) return;
    const talenti = window._schedaTalentiEditList || [];
    container.innerHTML = _schedaTalentiContentHtml(talenti);
    // Il re-focus della ricerca è gestito da _featPickerRefresh().
}

window.schedaCloseTalentiEdit = function() {
    const m = document.getElementById('schedaTalentiModal');
    if (m) m.remove();
    document.body.style.overflow = '';
    window._schedaTalentiEditPgId = null;
    window._schedaTalentiEditList = null;
};

// ============================================================
// Picker invocazioni del Warlock
// ============================================================
window._invocationPickerSearch = window._invocationPickerSearch || '';
window._invocationPickerFilters = window._invocationPickerFilters || { source: 'all', prereq: 'all', meets: 'all' };

function _invocationPickerHeaderHtml() {
    const f = window._invocationPickerFilters;
    const sources = Array.from(new Set(_invocationsAll().map(i => i.source_short || '?'))).sort();
    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;
    const meetsChips = [['all','Tutte'],['meet','Solo idonee']]
        .map(([v, lab]) => chip(lab, f.meets === v, `_invocationPickerSetFilter('meets','${v}')`)).join('');
    const prereqChips = [['all','Tutti'],['any','Sì'],['none','No']]
        .map(([v, lab]) => chip(lab, f.prereq === v, `_invocationPickerSetFilter('prereq','${v}')`)).join('');
    const sourceChips = [['all','Tutti']].concat(sources.map(s => [s, s]))
        .map(([v, lab]) => chip(lab, f.source === v, `_invocationPickerSetFilter('source','${v}')`)).join('');

    let activeCount = 0;
    if (f.meets !== 'all') activeCount += 1;
    if (f.prereq !== 'all') activeCount += 1;
    if (f.source !== 'all') activeCount += 1;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="invocationPickerSearch" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca supplica (IT/EN)..."
                   value="${escapeHtml(window._invocationPickerSearch)}"
                   oninput="_invocationPickerOnSearch(this.value)">
            <button type="button" class="spell-picker-filter-btn" id="invocationPickerFilterBtn"
                    onclick="_invocationPickerTogglePanel()" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                ${activeCount > 0 ? `<span class="spell-picker-filter-badge">${activeCount}</span>` : ''}
            </button>
        </div>
        <div class="spell-filter-panel" id="invocationFilterPanel" style="display:none;">
            <div class="spell-filter-group">
                <div class="spell-filter-label">Idoneità</div>
                <div class="spell-filter-chips">${meetsChips}</div>
            </div>
            <div class="spell-filter-group">
                <div class="spell-filter-label">Prerequisiti</div>
                <div class="spell-filter-chips">${prereqChips}</div>
            </div>
            <div class="spell-filter-group">
                <div class="spell-filter-label">Manuale</div>
                <div class="spell-filter-chips">${sourceChips}</div>
            </div>
            <div class="spell-filter-actions">
                <button type="button" class="btn-secondary btn-small" onclick="_invocationPickerResetFilters()">Reimposta</button>
            </div>
        </div>
    `;
}

window._invocationPickerTogglePanel = function() {
    const panel = document.getElementById('invocationFilterPanel');
    const btn = document.getElementById('invocationPickerFilterBtn');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window._invocationPickerResetFilters = function() {
    window._invocationPickerFilters = { source: 'all', prereq: 'all', meets: 'all' };
    _schedaInvocationsRefreshModal({ keepPanelOpen: true });
};

window._invocationPickerOnSearch = function(v) {
    window._invocationPickerSearch = v || '';
    _schedaInvocationsRefreshModal({ keepFocus: true });
};
window._invocationPickerSetFilter = function(key, val) {
    window._invocationPickerFilters[key] = val;
    _schedaInvocationsRefreshModal({ keepPanelOpen: true });
};

function _pickerFilterValues(value) {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    if (value == null || value === '' || value === 'all') return [];
    return [String(value).trim()].filter(Boolean);
}

function _invocationPickerActiveFilterCount() {
    const f = window._invocationPickerFilters || {};
    return _pickerFilterValues(f.meets).length + _pickerFilterValues(f.prereq).length + _pickerFilterValues(f.source).length;
}

function _invocationPickerBuildFilterButton(field, label, options, value, mode = 'multi') {
    const selected = _pickerFilterValues(value);
    const normalized = mode === 'single' ? [{ value: 'all', label: 'Tutte' }, ...options] : options;
    const encoded = encodeURIComponent(JSON.stringify(normalized)).replace(/'/g, '%27');
    const selectedLabel = mode === 'single' && selected.length
        ? normalized.find(o => String(o.value) === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="_invocationPickerPickFilter('${field}','${encoded}','${safeAttr(label)}','${mode}')" data-value="${safeAttr(selected.join(','))}">
        ${escapeHtml(label)}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _invocationPickerFiltersHtml() {
    const f = window._invocationPickerFilters || {};
    const sources = Array.from(new Set(_invocationsAll().map(i => i.source_short || '?'))).sort()
        .map(value => ({ value, label: value }));
    return [
        _invocationPickerBuildFilterButton('meets', 'Idoneita', [
            { value: 'meet', label: 'Solo idonee' },
        ], f.meets || 'all', 'single'),
        _invocationPickerBuildFilterButton('prereq', 'Prerequisiti', [
            { value: 'any', label: 'Si' },
            { value: 'none', label: 'No' },
        ], f.prereq || 'all', 'single'),
        sources.length ? _invocationPickerBuildFilterButton('source', 'Manuale', sources, f.source || []) : '',
    ].filter(Boolean).join('');
}

function _invocationPickerRenderFilterOverlay() {
    const overlay = document.querySelector('.invocation-filter-overlay');
    if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _invocationPickerFiltersHtml();
}

function _invocationPickerHeaderHtml() {
    const activeCount = _invocationPickerActiveFilterCount();
    return `
        <div class="filters-bar spell-picker-search-row">
            <div class="filter-search-wrap">
                <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="invocationPickerSearch" class="filter-search"
                   placeholder="Cerca supplica (IT/EN)..."
                   value="${escapeHtml(window._invocationPickerSearch)}"
                   oninput="_invocationPickerOnSearch(this.value)">
            </div>
            <button type="button" class="comp-filter-btn" id="invocationPickerFilterBtn"
                    onclick="_invocationPickerTogglePanel()" aria-label="Filtri">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <span>Filtri</span>
                <strong style="${activeCount ? '' : 'display:none;'}">${activeCount || ''}</strong>
            </button>
        </div>
    `;
}

window._invocationPickerTogglePanel = function() {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay invocation-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_invocationPickerFiltersHtml()}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="_invocationPickerResetFilters()">Reset</button>
                <button type="button" class="btn-primary" onclick="this.closest('.hp-calc-overlay').remove()">Applica</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window._invocationPickerPickFilter = function(field, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const f = window._invocationPickerFilters || (window._invocationPickerFilters = { source: [], prereq: 'all', meets: 'all' });
    if (mode === 'single') {
        openCustomSelect(options, value => {
            f[field] = value || 'all';
            _schedaInvocationsRefreshModal();
            _invocationPickerRenderFilterOverlay();
        }, title || 'Filtro');
        return;
    }
    openMultiSelect(options, _pickerFilterValues(f[field]), values => {
        f[field] = values;
        _schedaInvocationsRefreshModal();
        _invocationPickerRenderFilterOverlay();
    }, title || 'Filtro');
};

window._invocationPickerResetFilters = function() {
    window._invocationPickerFilters = { source: [], prereq: 'all', meets: 'all' };
    _schedaInvocationsRefreshModal();
    _invocationPickerRenderFilterOverlay();
};

function _invocationMatchesFilters(inv, pg) {
    const f = window._invocationPickerFilters;
    const sourceFilters = _pickerFilterValues(f.source);
    if (sourceFilters.length && !sourceFilters.includes(inv.source_short || '?')) return false;
    const hasPrereq = (inv.prerequisites && inv.prerequisites.length > 0);
    if (f.prereq === 'none' && hasPrereq) return false;
    if (f.prereq === 'any' && !hasPrereq) return false;
    if (f.meets === 'meet' && !_pgMeetsInvocationPrereqs(pg, inv)) return false;
    return true;
}
function _invocationMatchesSearch(inv, q) {
    if (!q) return true;
    const hay = `${inv.name || ''} ${inv.name_en || ''} ${inv.description || ''}`.toLowerCase();
    return hay.includes(q);
}

function _schedaInvocationsContentHtml(currentInvIds) {
    const pg = _schedaPgCache;
    const all = _invocationsAll();
    const q = (window._invocationPickerSearch || '').trim().toLowerCase();
    const maxInv = _pgMaxInvocations(pg);

    const renderItem = (inv, opts) => {
        const desc = (inv.description || '').replace(/\s+/g, ' ').trim();
        const prereq = _formatInvocationPrereqs(inv);
        const meets = _pgMeetsInvocationPrereqs(pg, inv);
        const cls = opts.selected ? 'pg-talento-item selected' : `pg-talento-item ${opts.disabled ? 'pg-talento-item-disabled' : ''}`;
        const onClick = (opts.onClick && !opts.disabled) ? `onclick="${opts.onClick}"` : '';
        const removeBtn = opts.removeOnClick
            ? `<button type="button" class="pg-talento-remove" onclick="event.stopPropagation();${opts.removeOnClick}">✕</button>`
            : '';
        const infoBtn = `<button type="button" class="pg-talento-info" title="Dettagli" onclick="event.stopPropagation();_featTogglePickerDetail(this)">ⓘ</button>`;
        const prereqHtml = prereq
            ? `<div class="pg-talento-prereq" ${(!meets && !opts.selected) ? 'style="color:var(--danger,#c0392b);"' : ''}><strong>Prerequisito:</strong> ${escapeHtml(prereq)}</div>`
            : '';
        const descHtml = desc
            ? `<div class="pg-talento-desc">${window.formatRichText(desc)}</div>`
            : '';
        return `
            <div class="${cls}" ${onClick} ${opts.title ? `title="${escapeHtml(opts.title)}"` : ''}>
                <div class="pg-talento-row">
                    <span class="pg-talento-name">${escapeHtml(inv.name)}</span>
                    <span class="option-source">(${escapeHtml(inv.source_short || '')})</span>
                    ${infoBtn}
                    ${removeBtn}
                </div>
                <div class="pg-talento-detail" style="display:none;">
                    ${prereqHtml}
                    ${descHtml || '<div class="pg-talento-desc"><em>Nessuna descrizione disponibile.</em></div>'}
                </div>
            </div>`;
    };

    const selected = currentInvIds.map(id => _invocationById(id)).filter(Boolean);
    const selectedHtml = selected.length > 0
        ? selected.map((inv, i) => renderItem(inv, { selected: true, removeOnClick: `schedaInvocationRemove(${i})` })).join('')
        : '';

    const available = all
        .filter(inv => !currentInvIds.includes(inv.id))
        .filter(inv => _invocationMatchesFilters(inv, pg))
        .filter(inv => _invocationMatchesSearch(inv, q));

    const canAddMore = currentInvIds.length < maxInv;

    const listHtml = available.map(inv => {
        const meets = _pgMeetsInvocationPrereqs(pg, inv);
        const disabled = !meets || !canAddMore;
        const reason = !canAddMore ? 'Limite suppliche raggiunto' : (!meets ? 'Prerequisiti non soddisfatti' : '');
        const safeId = inv.id.replace(/'/g, "\\'");
        return renderItem(inv, {
            onClick: `schedaInvocationAdd('${safeId}')`,
            disabled,
            title: disabled ? reason : '',
        });
    }).join('') || '<div class="scheda-empty" style="padding:12px;">Nessuna supplica corrisponde ai filtri.</div>';

    return `
        <div class="invocations-summary"><strong>${currentInvIds.length}</strong> / ${maxInv} suppliche selezionate</div>
        ${_invocationPickerHeaderHtml()}
        ${selectedHtml ? `<div class="form-section-label">Selezionate</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
}

// ─── Picker Stili di Combattimento ─────────────────────────────────────
// Dialog stile "scelta talenti/incantesimi": barra di ricerca fissata in
// alto, pulsante per aprire/chiudere il pannello dei filtri (Classe/
// Sottoclasse e Manuale). Solo la lista scorre, mentre la search row
// resta sempre visibile.
window._fsPickerState = window._fsPickerState || { search: '', source: 'all', slot: 'all', filterOpen: false };

window.schedaOpenFightingStylesEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const allowance = _pgFightingStylesAllowance(pg);
    const slotKeys = Object.keys(allowance); // include sempre 'Personalizzato'
    // Stato locale di selezione: { slotKey: [slug, ...] }
    const stored = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object')
        ? pg.stile_combattimento : {};
    const sel = {};
    slotKeys.forEach(k => { sel[k] = Array.isArray(stored[k]) ? [...stored[k]] : []; });
    // Pulisci selezioni con slug non piu' validi (es. dopo cambio sottoclasse).
    slotKeys.forEach(k => {
        const allowed = _fightingStylesForSlot(k, allowance[k]).map(fs => fs.slug);
        sel[k] = sel[k].filter(s => allowed.includes(s));
    });
    // Stato locale degli override del massimo per slot.
    const initOverrides = (stored._maxOverrides && typeof stored._maxOverrides === 'object')
        ? Object.assign({}, stored._maxOverrides) : {};

    // Costruisci una mappa flat: per ogni stile, in quali "slot" del PG
    // puo' essere assegnato (rispettando le restrizioni di sottoclasse).
    const flatStyles = {}; // slug -> { fs, slots: [slotKey, ...] }
    slotKeys.forEach(k => {
        const list = _fightingStylesForSlot(k, allowance[k]);
        list.forEach(fs => {
            if (!flatStyles[fs.slug]) flatStyles[fs.slug] = { fs, slots: [] };
            flatStyles[fs.slug].slots.push(k);
        });
    });
    const allStyles = Object.values(flatStyles)
        .sort((a, b) => (a.fs.name || '').localeCompare(b.fs.name || ''));

    // Reset stato del filtro a ogni apertura.
    window._fsPickerState = { search: '', source: 'all', slot: 'all', filterOpen: false };
    window._fsPickerSel = sel;
    window._fsPickerAllowance = allowance;
    window._fsPickerSlotKeys = slotKeys;
    window._fsPickerAllStyles = allStyles;
    window._fsPickerOverrides = initOverrides;
    window._fsPickerPgId = pgId;

    let modal = document.getElementById('fsPickerModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'fsPickerModal';
    modal.className = 'modal active';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `<div class="modal-content modal-content-lg fs-picker-modal" onclick="event.stopPropagation();">
        <button class="modal-close" onclick="document.getElementById('fsPickerModal')?.remove();">&times;</button>
        <h2 style="margin-top:0;">Scegli Stili di Combattimento</h2>

        <div id="fsPickerHeader">${_fsPickerHeaderHtml()}</div>
        <div id="fsPickerCounters" class="fs-pick-counters">${_fsPickerCountersHtml()}</div>

        <div class="wizard-page-scroll fs-picker-scroll">
            <div id="fsPickerList" class="fs-pick-list"></div>
        </div>

        <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn-secondary" onclick="document.getElementById('fsPickerModal')?.remove();">Annulla</button>
            <button class="btn-primary" onclick="schedaSaveFightingStyles('${pgId}')">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    schedaFsRenderList();
};

// HTML della search row + pannello filtri (collassabile).
function _fsPickerHeaderHtml() {
    const state = window._fsPickerState;
    const allStyles = window._fsPickerAllStyles || [];
    const slotKeys = window._fsPickerSlotKeys || [];
    const sources = Array.from(new Set(allStyles.map(s => s.fs.source_short).filter(Boolean))).sort();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    const jsArg = s => JSON.stringify(s).replace(/"/g, '&quot;');
    const slotChips = [chip('Tutte', state.slot === 'all', `schedaFsSetSlotFilter('all')`)]
        .concat(slotKeys.map(k => chip(k, state.slot === k, `schedaFsSetSlotFilter(${jsArg(k)})`)))
        .join('');
    const sourceChips = [chip('Tutti', state.source === 'all', `schedaFsSetSourceFilter('all')`)]
        .concat(sources.map(s => chip(s, state.source === s, `schedaFsSetSourceFilter(${jsArg(s)})`)))
        .join('');

    let activeCount = 0;
    if (state.slot !== 'all') activeCount += 1;
    if (state.source !== 'all') activeCount += 1;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="fsPickerSearch" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca stile (IT/EN)..."
                   value="${escapeHtml(state.search)}"
                   oninput="schedaFsSetSearch(this.value)"
                   autocomplete="off">
            <button type="button" class="spell-picker-filter-btn ${state.filterOpen ? 'active' : ''}" id="fsPickerFilterBtn"
                    onclick="schedaFsToggleFilterPanel()" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                ${activeCount > 0 ? `<span class="spell-picker-filter-badge">${activeCount}</span>` : ''}
            </button>
        </div>
        <div class="spell-filter-panel" id="fsPickerFilterPanel" style="display:${state.filterOpen ? '' : 'none'};">
            <div class="spell-filter-group">
                <div class="spell-filter-label">Classe / Sottoclasse</div>
                <div class="spell-filter-chips">${slotChips}</div>
            </div>
            ${sources.length > 0 ? `<div class="spell-filter-group">
                <div class="spell-filter-label">Manuale</div>
                <div class="spell-filter-chips">${sourceChips}</div>
            </div>` : ''}
            <div class="spell-filter-actions">
                <button type="button" class="btn-secondary btn-small" onclick="schedaFsResetFilters()">Reimposta</button>
            </div>
        </div>
    `;
}

// Banner contatori "selezionati / max" per ciascuna classe/sottoclasse.
// Ogni contatore include due pulsanti +/- per modificare liberamente il max.
function _fsPickerCountersHtml() {
    const slotKeys = window._fsPickerSlotKeys || [];
    const allowance = window._fsPickerAllowance || {};
    const sel = window._fsPickerSel || {};
    if (slotKeys.length === 0) return '';
    return slotKeys.map(k => {
        const cnt = (sel[k] || []).length;
        const max = allowance[k] ? allowance[k].max : 0;
        const reached = cnt > 0 && cnt >= max;
        const labelKey = JSON.stringify(k).replace(/"/g, '&quot;');
        return `<span class="fs-pick-counter ${reached ? 'reached' : ''} ${max === 0 ? 'is-empty' : ''}" data-slot="${escapeHtml(k)}">
            <strong>${escapeHtml(k)}:</strong> ${cnt}/${max}
            <button type="button" class="fs-pick-counter-btn" title="Riduci massimo"
                onclick="event.stopPropagation();schedaFsBumpSlotMax(${labelKey}, -1)">−</button>
            <button type="button" class="fs-pick-counter-btn" title="Aumenta massimo"
                onclick="event.stopPropagation();schedaFsBumpSlotMax(${labelKey}, 1)">+</button>
        </span>`;
    }).join('');
}

// Modifica il massimo di stili per uno slot di +/- delta.
window.schedaFsBumpSlotMax = function(slotKey, delta) {
    const allowance = window._fsPickerAllowance || {};
    const overrides = window._fsPickerOverrides || (window._fsPickerOverrides = {});
    const sel = window._fsPickerSel || {};
    const entry = allowance[slotKey];
    if (!entry) return;
    const baseMax = Number.isFinite(entry.baseMax) ? entry.baseMax : entry.max;
    const curMax = entry.max;
    const newMax = Math.max(0, curMax + delta);
    const newOverride = newMax - baseMax;
    if (newOverride === 0) {
        delete overrides[slotKey];
    } else {
        overrides[slotKey] = newOverride;
    }
    entry.max = newMax;
    // Se ho ridotto sotto al numero di selezioni correnti, taglia la lista.
    if (Array.isArray(sel[slotKey]) && sel[slotKey].length > newMax) {
        sel[slotKey] = sel[slotKey].slice(0, newMax);
    }
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    schedaFsRenderList();
};

window.schedaFsToggleFilterPanel = function() {
    const state = window._fsPickerState;
    state.filterOpen = !state.filterOpen;
    const panel = document.getElementById('fsPickerFilterPanel');
    const btn = document.getElementById('fsPickerFilterBtn');
    if (panel) panel.style.display = state.filterOpen ? '' : 'none';
    if (btn) btn.classList.toggle('active', state.filterOpen);
};

window.schedaFsResetFilters = function() {
    const state = window._fsPickerState;
    state.source = 'all';
    state.slot = 'all';
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};

window.schedaFsSetSearch = function(v) {
    window._fsPickerState.search = v || '';
    schedaFsRenderList();
};
window.schedaFsSetSourceFilter = function(src) {
    window._fsPickerState.source = src;
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};
window.schedaFsSetSlotFilter = function(slot) {
    window._fsPickerState.slot = slot;
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};

function _fsPickerActiveFilterCount() {
    const state = window._fsPickerState || {};
    return _pickerFilterValues(state.slot).length + _pickerFilterValues(state.source).length;
}

function _fsPickerBuildFilterButton(field, label, options, value) {
    const selected = _pickerFilterValues(value);
    const encoded = encodeURIComponent(JSON.stringify(options || [])).replace(/'/g, '%27');
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="schedaFsPickFilter('${field}','${encoded}','${safeAttr(label)}')" data-value="${safeAttr(selected.join(','))}">
        ${escapeHtml(label)}
        ${selected.length ? `<small>${selected.length}</small>` : ''}
    </button>`;
}

function _fsPickerFiltersHtml() {
    const state = window._fsPickerState || {};
    const allStyles = window._fsPickerAllStyles || [];
    const slotKeys = window._fsPickerSlotKeys || [];
    const sources = Array.from(new Set(allStyles.map(s => s.fs.source_short).filter(Boolean))).sort();
    return [
        _fsPickerBuildFilterButton('slot', 'Classe / Sottoclasse', slotKeys.map(value => ({ value, label: value })), state.slot || []),
        sources.length ? _fsPickerBuildFilterButton('source', 'Manuale', sources.map(value => ({ value, label: value })), state.source || []) : '',
    ].filter(Boolean).join('');
}

function _fsPickerRenderFilterOverlay() {
    const overlay = document.querySelector('.fs-filter-overlay');
    if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _fsPickerFiltersHtml();
}

function _fsPickerHeaderHtml() {
    const state = window._fsPickerState;
    const activeCount = _fsPickerActiveFilterCount();
    return `
        <div class="filters-bar spell-picker-search-row">
            <div class="filter-search-wrap">
                <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="fsPickerSearch" class="filter-search"
                   placeholder="Cerca stile (IT/EN)..."
                   value="${escapeHtml(state.search)}"
                   oninput="schedaFsSetSearch(this.value)"
                   autocomplete="off">
            </div>
            <button type="button" class="comp-filter-btn" id="fsPickerFilterBtn"
                    onclick="schedaFsToggleFilterPanel()" aria-label="Filtri">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <span>Filtri</span>
                <strong style="${activeCount ? '' : 'display:none;'}">${activeCount || ''}</strong>
            </button>
        </div>
    `;
}

window.schedaFsToggleFilterPanel = function() {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay fs-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_fsPickerFiltersHtml()}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="schedaFsResetFilters()">Reset</button>
                <button type="button" class="btn-primary" onclick="this.closest('.hp-calc-overlay').remove()">Applica</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaFsPickFilter = function(field, encodedOptions, title) {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const state = window._fsPickerState;
    openMultiSelect(options, _pickerFilterValues(state[field]), values => {
        state[field] = values;
        _fsPickerRefreshHeader();
        schedaFsRenderList();
        _fsPickerRenderFilterOverlay();
    }, title || 'Filtro');
};

window.schedaFsResetFilters = function() {
    const state = window._fsPickerState;
    state.source = [];
    state.slot = [];
    _fsPickerRefreshHeader();
    schedaFsRenderList();
    _fsPickerRenderFilterOverlay();
};

window.schedaFsSetSourceFilter = function(src) {
    window._fsPickerState.source = src;
    _fsPickerRefreshHeader();
    schedaFsRenderList();
};

window.schedaFsSetSlotFilter = function(slot) {
    window._fsPickerState.slot = slot;
    _fsPickerRefreshHeader();
    schedaFsRenderList();
};

// Re-renderizza la search row + pannello filtri preservando focus e
// stato di apertura del pannello.
function _fsPickerRefreshHeader(opts) {
    opts = opts || {};
    const header = document.getElementById('fsPickerHeader');
    if (!header) return;
    if (opts.keepPanelOpen) window._fsPickerState.filterOpen = true;
    header.innerHTML = _fsPickerHeaderHtml();
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    // Re-focus della ricerca con il cursore in coda.
    const input = document.getElementById('fsPickerSearch');
    if (input) {
        try {
            input.focus();
            const v = input.value;
            input.setSelectionRange(v.length, v.length);
        } catch (_) { /* ignore */ }
    }
}

window.schedaFsRenderList = function() {
    const state = window._fsPickerState || { search: '', source: 'all', slot: 'all' };
    const allStyles = window._fsPickerAllStyles || [];
    const allowance = window._fsPickerAllowance || {};
    const sel = window._fsPickerSel || {};
    const listEl = document.getElementById('fsPickerList');
    if (!listEl) return;
    const search = (state.search || '').trim().toLowerCase();
    const sourceFilters = _pickerFilterValues(state.source);
    const slotFilters = _pickerFilterValues(state.slot);
    const filtered = allStyles.filter(({ fs, slots }) => {
        if (sourceFilters.length && !sourceFilters.includes(fs.source_short || '')) return false;
        if (slotFilters.length && !slots.some(slot => slotFilters.includes(slot))) return false;
        if (search) {
            const txt = `${fs.name || ''} ${fs.name_en || ''} ${fs.description || ''}`.toLowerCase();
            if (!txt.includes(search)) return false;
        }
        return true;
    });
    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="scheda-empty" style="padding:18px;text-align:center;">Nessuno stile corrisponde ai filtri.</div>';
        return;
    }
    listEl.innerHTML = filtered.map(({ fs, slots }) => {
        const assignedTo = slots.filter(k => (sel[k] || []).includes(fs.slug));
        const isSelected = assignedTo.length > 0;
        // Mostra le slot solo se hanno almeno 1 max o c'e' gia' una
        // selezione su quella slot per questo stile (per consentire la
        // rimozione anche dopo aver azzerato il max).
        const visibleSlots = slots.filter(k => {
            const max = allowance[k] ? allowance[k].max : 0;
            const here = (sel[k] || []).includes(fs.slug);
            return max > 0 || here;
        });
        const slotBadges = visibleSlots.map(k => {
            const max = allowance[k] ? allowance[k].max : 0;
            const reachedMax = (sel[k] || []).length >= max;
            const here = (sel[k] || []).includes(fs.slug);
            return `<button type="button" class="fs-pick-slot-btn ${here ? 'is-on' : ''} ${reachedMax && !here ? 'is-full' : ''}"
                onclick="event.stopPropagation();schedaFsToggleAssign('${fs.slug}', ${JSON.stringify(k).replace(/"/g, '&quot;')})"
                title="${here ? 'Assegnato a ' + escapeHtml(k) : 'Assegna a ' + escapeHtml(k)}">
                ${here ? '✔ ' : '+ '}${escapeHtml(k)} <small>(${(sel[k] || []).length}/${max})</small>
            </button>`;
        }).join('');
        const slotBadgesHtml = slotBadges || '<span class="scheda-empty" style="font-size:0.78rem;padding:4px 8px;">Aumenta il massimo "Personalizzato" sopra per assegnare questo stile.</span>';
        return `<div class="fs-pick-row ${isSelected ? 'fs-pick-row-selected' : ''}">
            <div class="fs-pick-head" onclick="this.closest('.fs-pick-row').classList.toggle('fs-pick-open');">
                <span class="fs-pick-name">${escapeHtml(fs.name)}</span>
                <span class="fs-pick-source">${escapeHtml(fs.source_short || '')}</span>
                <span class="fs-pick-arrow">▾</span>
            </div>
            <div class="fs-pick-slots">${slotBadgesHtml}</div>
            <div class="fs-pick-desc">${window.formatRichText(fs.description || '')}</div>
        </div>`;
    }).join('');
};

// Toggle assegnazione di uno stile a uno slot specifico (classe/sottoclasse).
window.schedaFsToggleAssign = function(slug, slotKey) {
    const sel = window._fsPickerSel || {};
    const allowance = window._fsPickerAllowance || {};
    if (!sel[slotKey]) sel[slotKey] = [];
    const arr = sel[slotKey];
    const i = arr.indexOf(slug);
    if (i >= 0) {
        arr.splice(i, 1);
    } else {
        if (arr.length >= allowance[slotKey].max) {
            showNotification && showNotification(`Hai gia' raggiunto il massimo di stili per ${slotKey}`);
            return;
        }
        // Uno stile per slot: rimuovilo dagli altri slot del PG.
        Object.keys(sel).forEach(k => {
            if (k !== slotKey) {
                const j = sel[k].indexOf(slug);
                if (j >= 0) sel[k].splice(j, 1);
            }
        });
        arr.push(slug);
    }
    // Aggiorna i contatori nel banner sotto la search row.
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    // Aggiorna anche le chip nel pannello filtri (se aperto): nessun
    // contatore nelle chip in questo design, quindi basta ri-renderizzare
    // la lista.
    schedaFsRenderList();
};

window.schedaSaveFightingStyles = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const sel = window._fsPickerSel || {};
    const overrides = window._fsPickerOverrides || {};
    // Costruisci il payload finale: copia delle selezioni + override del max.
    const payload = {};
    Object.keys(sel).forEach(k => { payload[k] = Array.isArray(sel[k]) ? [...sel[k]] : []; });
    // Persiste solo le voci di override realmente non-zero.
    const cleanOverrides = {};
    Object.keys(overrides).forEach(k => {
        const v = overrides[k];
        if (Number.isFinite(v) && v !== 0) cleanOverrides[k] = v;
    });
    if (Object.keys(cleanOverrides).length > 0) payload._maxOverrides = cleanOverrides;
    pg.stile_combattimento = payload;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
        const { error } = await supabase.from('personaggi')
            .update({ stile_combattimento: payload, updated_at: new Date().toISOString() })
            .eq('id', pgId);
        if (error) {
            console.error('[fighting styles] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('stile_combattimento') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "stile_combattimento" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return;
        }
    } catch (e) {
        console.warn('[fighting styles] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return;
    }
    document.getElementById('fsPickerModal')?.remove();
    schedaOpenPrivilegesPage(pgId);
};

window.schedaOpenInvocationsEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = pg.invocazioni ? [...pg.invocazioni] : [];

    window._invocationPickerSearch = '';
    window._invocationPickerFilters = { source: 'all', prereq: 'all', meets: 'all' };

    const modalHtml = `
    <div class="modal active" id="schedaInvocationsModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseInvocationsEdit()">&times;</button>
            <h2>Modifica Suppliche Occulte</h2>
            <div class="wizard-page-scroll" id="schedaInvocationsContent">
                ${_schedaInvocationsContentHtml(current)}
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseInvocationsEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaInvocationsEditPgId = pgId;
    window._schedaInvocationsEditList = current;
};

window.schedaInvocationAdd = async function(invId) {
    if (!window._schedaInvocationsEditList) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const inv = _invocationById(invId);
    if (!inv) return;
    if (window._schedaInvocationsEditList.includes(invId)) return;
    if (window._schedaInvocationsEditList.length >= _pgMaxInvocations(pg)) return;
    if (!_pgMeetsInvocationPrereqs(pg, inv)) return;
    window._schedaInvocationsEditList.push(invId);
    _applyInvocationSkillsToPg(pg);
    await _schedaInvocationsSave();
    _schedaInvocationsRefreshModal();
};

window.schedaInvocationRemove = async function(index) {
    if (!window._schedaInvocationsEditList) return;
    const removedId = window._schedaInvocationsEditList[index];
    window._schedaInvocationsEditList.splice(index, 1);
    const pg = _schedaPgCache;
    if (pg) {
        _removeInvocationSkillFromPg(pg, removedId);
        _applyInvocationSkillsToPg(pg);
    }
    await _schedaInvocationsSave();
    _schedaInvocationsRefreshModal();
};

// Aggiunge a pg.competenze_abilita le skill granted dalle invocazioni
// attualmente selezionate (idempotente).
function _applyInvocationSkillsToPg(pg) {
    if (!pg) return;
    if (!Array.isArray(pg.competenze_abilita)) pg.competenze_abilita = [];
    const skills = _pgInvocationGrantedSkills(pg);
    skills.forEach(s => {
        if (!pg.competenze_abilita.includes(s)) pg.competenze_abilita.push(s);
    });
}

// Quando si rimuove una invocazione che concedeva una skill, toglie la
// competenza solo se non e' garantita anche da un'altra invocazione attiva.
function _removeInvocationSkillFromPg(pg, removedInvId) {
    if (!pg || !removedInvId) return;
    const removed = _invocationById(removedInvId);
    if (!removed || removed.effect !== 'skill_proficiency') return;
    const removedSkills = (removed.effect_data || {}).skills || [];
    const stillGranted = new Set(_pgInvocationGrantedSkills(pg));
    if (!Array.isArray(pg.competenze_abilita)) return;
    pg.competenze_abilita = pg.competenze_abilita.filter(s => {
        if (!removedSkills.includes(s)) return true;
        return stillGranted.has(s);
    });
}

async function _schedaInvocationsSave() {
    const pgId = window._schedaInvocationsEditPgId;
    const list = window._schedaInvocationsEditList;
    if (!pgId) return;
    if (_schedaPgCache) _schedaPgCache.invocazioni = list;

    // Refresh anche pannello privilegi se aperto.
    if (typeof schedaOpenPrivilegesPage === 'function' && window._schedaCurrentTab === 'privilegi') {
        schedaOpenPrivilegesPage(pgId);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
        const payload = {
            invocazioni: list,
            competenze_abilita: _schedaPgCache ? (_schedaPgCache.competenze_abilita || []) : undefined,
            updated_at: new Date().toISOString(),
        };
        try {
            let { error } = await supabase.from('personaggi').update(payload).eq('id', pgId);
            // Retry rimuovendo colonne mancanti (es. 'invocazioni' non ancora migrata).
            for (let i = 0; i < 4 && error; i++) {
                const m = (error.message || '').match(/find ['"]?([a-z_]+)['"]? column/i)
                       || (error.message || '').match(/column ['"]?([a-z_]+)['"]?/i);
                if (!m || !(m[1] in payload)) break;
                delete payload[m[1]];
                ({ error } = await supabase.from('personaggi').update(payload).eq('id', pgId));
            }
            if (error) console.warn('[suppliche] save failed', error);
        } catch (e) {
            console.warn('[suppliche] save failed (column missing?)', e);
        }
    }
}

function _schedaInvocationsRefreshModal(opts = {}) {
    const container = document.getElementById('schedaInvocationsContent');
    if (!container) return;
    const list = window._schedaInvocationsEditList || [];
    container.innerHTML = _schedaInvocationsContentHtml(list);
    if (opts.keepPanelOpen) {
        const panel = document.getElementById('invocationFilterPanel');
        const btn = document.getElementById('invocationPickerFilterBtn');
        if (panel) panel.style.display = '';
        if (btn) btn.classList.add('active');
    }
    if (opts.keepFocus) {
        const inp = document.getElementById('invocationPickerSearch');
        if (inp) {
            inp.focus();
            const v = inp.value;
            inp.setSelectionRange(v.length, v.length);
        }
    }
}

window.schedaCloseInvocationsEdit = function() {
    const m = document.getElementById('schedaInvocationsModal');
    if (m) m.remove();
    document.body.style.overflow = '';
    window._schedaInvocationsEditPgId = null;
    window._schedaInvocationsEditList = null;
};

// HP Calculator
