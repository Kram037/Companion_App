// ============================================================================
// PERSONAGGI TALENTI
// ============================================================================

// Talenti: dataset locale caricato da js/Personaggi/data/feats_data.js (window.FEATS_DATA).
// Sorgente: PDF aidedd.org parsato in risorse/talenti/parse_feats.py.
// Solo i NOMI ITALIANI sono puntatori salvati nel DB (pg.talenti = [string, ...]),
// l'app risolve descrizione/prerequisiti/fonte localmente.
function _featsData() { return window.FEATS_DATA || {}; }

// Lista talenti (compat: array di {nome, fonte}) generata dal dataset locale.
// Restituisce un array ordinato alfabeticamente per nome IT.
function _featsList() {
    const data = _featsData();
    const out = Object.values(data).map(f => ({
        nome: f.name,
        nome_en: f.name_en,
        fonte: f.source_short || f.source || '',
        prerequisites: f.prerequisites || '',
        description: f.description || ''
    }));
    out.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    return out;
}

function _featInfo(nomeIt) {
    const data = _featsData();
    return data[nomeIt] || null;
}

// Elenco di tutti i `source_short` distinti presenti nel dataset talenti.
function _featAllSources() {
    const set = new Set();
    Object.values(_featsData()).forEach(f => {
        const s = f.source_short || f.source || '';
        if (s) set.add(s);
    });
    return Array.from(set).sort();
}

function _defaultFeatFilters() {
    return { prereq: 'any', sources: [] };
}

// Stato filtri/ricerca per ciascun "contesto" del picker (wizard, scheda).
window._featPickerFilters = window._featPickerFilters || {};
window._featPickerSearch = window._featPickerSearch || {};

function _featMatchesFilters(t, f) {
    if (!f) return true;
    if (f.prereq === 'yes' && !t.prerequisites) return false;
    if (f.prereq === 'no' && t.prerequisites) return false;
    if (f.sources && f.sources.length > 0 && !f.sources.includes(t.fonte)) return false;
    return true;
}

function _featMatchesSearch(t, q) {
    if (!q) return true;
    return (
        t.nome.toLowerCase().includes(q) ||
        (t.nome_en && t.nome_en.toLowerCase().includes(q)) ||
        (t.fonte || '').toLowerCase().includes(q)
    );
}

function _featPickerHeaderHtml(ctx) {
    const f = window._featPickerFilters[ctx] || _defaultFeatFilters();
    const q = window._featPickerSearch[ctx] || '';
    const allSources = _featAllSources();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    const prereqChips = [['any','Tutti'],['yes','Sì'],['no','No']]
        .map(([v, lab]) => chip(lab, f.prereq === v, `_featFilterSet('${ctx}','prereq','${v}')`)).join('');

    const sourceChips = allSources
        .map(s => chip(s, f.sources.includes(s), `_featFilterToggle('${ctx}','sources','${escapeHtml(s)}')`)).join('');

    const filtersPanel = `<div class="spell-filter-panel" id="featFilterPanel_${ctx}" style="display:none;">
        <div class="spell-filter-group">
            <div class="spell-filter-label">Prerequisiti</div>
            <div class="spell-filter-chips">${prereqChips}</div>
        </div>
        ${allSources.length > 0 ? `<div class="spell-filter-group">
            <div class="spell-filter-label">Manuale</div>
            <div class="spell-filter-chips">${sourceChips}</div>
        </div>` : ''}
        <div class="spell-filter-actions">
            <button type="button" class="btn-secondary btn-small" onclick="_featFilterReset('${ctx}')">Reimposta</button>
        </div>
    </div>`;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="featPickerSearch_${ctx}" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca talento (IT/EN/fonte)..."
                   value="${escapeHtml(q)}" oninput="_featPickerOnSearch('${ctx}', this.value)">
            <button type="button" class="spell-picker-filter-btn" id="featPickerFilterBtn_${ctx}"
                    onclick="_featFilterTogglePanel('${ctx}')" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="spell-picker-filter-badge" id="featFilterBadge_${ctx}" style="display:none;">0</span>
            </button>
        </div>
        ${filtersPanel}
    `;
}

function _featPickerHeaderHtml(ctx) {
    const q = window._featPickerSearch[ctx] || '';
    const activeCount = _featPickerActiveFilterCount(ctx);
    return `
        <div class="filters-bar spell-picker-search-row">
            <div class="filter-search-wrap">
                <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="featPickerSearch_${ctx}" class="filter-search"
                    placeholder="Cerca talento (IT/EN/fonte)..."
                    value="${escapeHtml(q)}" oninput="_featPickerOnSearch('${ctx}', this.value)">
            </div>
            <button type="button" class="comp-filter-btn" id="featPickerFilterBtn_${ctx}"
                    onclick="_featFilterTogglePanel('${ctx}')" aria-label="Filtri">
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
                <strong id="featFilterBadge_${ctx}" style="${activeCount ? '' : 'display:none;'}">${activeCount || ''}</strong>
            </button>
        </div>
    `;
}

function _featPickerActiveFilterCount(ctx) {
    const f = window._featPickerFilters[ctx];
    if (!f) return 0;
    let n = 0;
    if (f.prereq && f.prereq !== 'any') n += 1;
    n += (f.sources || []).length;
    return n;
}

window._featPickerOnSearch = function(ctx, value) {
    window._featPickerSearch[ctx] = value;
    _featPickerRefresh(ctx);
};

window._featFilterTogglePanel = function(ctx) {
    const panel = document.getElementById(`featFilterPanel_${ctx}`);
    const btn = document.getElementById(`featPickerFilterBtn_${ctx}`);
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window._featFilterToggle = function(ctx, field, value) {
    const f = window._featPickerFilters[ctx];
    if (!f || !Array.isArray(f[field])) return;
    const i = f[field].indexOf(value);
    if (i >= 0) f[field].splice(i, 1); else f[field].push(value);
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

window._featFilterSet = function(ctx, field, value) {
    const f = window._featPickerFilters[ctx];
    if (!f) return;
    f[field] = value;
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

window._featFilterReset = function(ctx) {
    window._featPickerFilters[ctx] = _defaultFeatFilters();
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

// Re-render del contesto richiamando il renderer dedicato di quel contesto.
function _featPickerRefresh(ctx, opts) {
    opts = opts || {};
    const panelOpen = (() => {
        const p = document.getElementById(`featFilterPanel_${ctx}`);
        return p ? p.style.display !== 'none' : false;
    })();

    if (ctx === 'wizard') {
        pgRenderTalenti();
    } else if (ctx === 'scheda') {
        _schedaTalentiRefreshModal();
    }

    if (opts.keepPanelOpen && panelOpen) {
        const p = document.getElementById(`featFilterPanel_${ctx}`);
        const b = document.getElementById(`featPickerFilterBtn_${ctx}`);
        if (p) p.style.display = '';
        if (b) b.classList.add('active');
    }
    // Re-focus sulla barra di ricerca dopo il re-render (mantiene il cursore in coda).
    const input = document.getElementById(`featPickerSearch_${ctx}`);
    if (input && document.activeElement !== input) {
        input.focus();
        const v = input.value;
        try { input.setSelectionRange(v.length, v.length); } catch (_) { /* ignore */ }
    }
    _featPickerUpdateBadge(ctx);
}

function _featPickerUpdateBadge(ctx) {
    const badge = document.getElementById(`featFilterBadge_${ctx}`);
    if (!badge) return;
    const n = _featPickerActiveFilterCount(ctx);
    if (n > 0) { badge.textContent = n; badge.style.display = ''; }
    else badge.style.display = 'none';
    document.getElementById(`featPickerFilterBtn_${ctx}`)?.classList.toggle('active', n > 0);
}

function _featBuildFilterButton(ctx, field, label, options, value, mode = 'multi') {
    const selected = Array.isArray(value) ? value.map(String) : (value && value !== 'any' ? [String(value)] : []);
    const encoded = encodeURIComponent(JSON.stringify(options || [])).replace(/'/g, '%27');
    const selectedLabel = mode === 'single' && selected.length
        ? (options || []).find(o => String(o.value) === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="_featFilterPick('${ctx}','${field}','${encoded}','${safeAttr(label)}','${mode}')" data-value="${safeAttr(selected.join(','))}">
        ${escapeHtml(label)}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _featFiltersHtml(ctx) {
    const f = window._featPickerFilters[ctx] || _defaultFeatFilters();
    const sources = _featAllSources().map(value => ({ value, label: value }));
    return [
        _featBuildFilterButton(ctx, 'prereq', 'Prerequisiti', [
            { value: 'any', label: 'Tutti' },
            { value: 'yes', label: 'Si' },
            { value: 'no', label: 'No' },
        ], f.prereq || 'any', 'single'),
        sources.length ? _featBuildFilterButton(ctx, 'sources', 'Manuale', sources, f.sources || []) : '',
    ].filter(Boolean).join('');
}

function _featFilterRerenderDialog(ctx) {
    const overlay = Array.from(document.querySelectorAll('.feat-filter-overlay'))
        .find(el => el.dataset.ctx === ctx);
    if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _featFiltersHtml(ctx);
}

window._featFilterTogglePanel = function(ctx) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay feat-filter-overlay';
    overlay.dataset.ctx = ctx;
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_featFiltersHtml(ctx)}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="_featFilterReset('${ctx}')">Reset</button>
                <button type="button" class="btn-primary" onclick="this.closest('.hp-calc-overlay').remove()">Applica</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window._featFilterPick = function(ctx, field, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const f = window._featPickerFilters[ctx] || (window._featPickerFilters[ctx] = _defaultFeatFilters());
    if (mode === 'single') {
        openCustomSelect(options, value => {
            f[field] = value || 'any';
            _featPickerRefresh(ctx);
            _featFilterRerenderDialog(ctx);
        }, title || 'Filtro');
        return;
    }
    openMultiSelect(options, Array.isArray(f[field]) ? f[field] : [], values => {
        f[field] = values;
        _featPickerRefresh(ctx);
        _featFilterRerenderDialog(ctx);
    }, title || 'Filtro');
};

window._featFilterReset = function(ctx) {
    window._featPickerFilters[ctx] = _defaultFeatFilters();
    _featPickerRefresh(ctx);
    _featFilterRerenderDialog(ctx);
};

let pgCurrentTalenti = [];

function pgSetupTalentiDelegation(container) {
    if (!container || container.dataset.pgTalentiDelegated === '1') return;
    container.dataset.pgTalentiDelegated = '1';
    container.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-feat-action]');
        if (!actionEl || !container.contains(actionEl)) return;

        const action = actionEl.dataset.featAction;
        if (action === 'toggle-detail') {
            event.stopPropagation();
            _featTogglePickerDetail(actionEl);
            return;
        }
        if (action === 'add') {
            pgAddTalento(actionEl.dataset.featName || '');
            return;
        }
        if (action === 'remove') {
            event.stopPropagation();
            pgRemoveTalento(Number(actionEl.dataset.featIndex));
        }
    });
}

function _featPickerItemHtml(t, opts) {
    const itemAttrs = opts.itemAction
        ? `data-feat-action="${safeAttr(opts.itemAction)}" data-feat-name="${safeAttr(opts.itemValue || t.nome)}"`
        : (opts.onClick ? `onclick="${opts.onClick}"` : '');
    const removeBtn = opts.removeAction
        ? `<button type="button" class="pg-talento-remove" data-feat-action="${safeAttr(opts.removeAction)}" data-feat-index="${safeAttr(opts.removeIndex)}">✕</button>`
        : opts.removeOnClick
        ? `<button type="button" class="pg-talento-remove" onclick="event.stopPropagation();${opts.removeOnClick}">✕</button>`
        : '';
    const infoBtn = opts.delegatedInfo
        ? `<button type="button" class="pg-talento-info" title="Dettagli" data-feat-action="toggle-detail">ⓘ</button>`
        : `<button type="button" class="pg-talento-info" title="Dettagli" onclick="event.stopPropagation();_featTogglePickerDetail(this)">ⓘ</button>`;
    const cls = opts.selected ? 'pg-talento-item selected' : 'pg-talento-item';
    const prereqHtml = t.prerequisites
        ? `<div class="pg-talento-prereq"><strong>Prerequisito:</strong> ${escapeHtml(t.prerequisites)}</div>`
        : '';
    const descHtml = t.description
        ? `<div class="pg-talento-desc">${window.formatRichText(t.description)}</div>`
        : '';
    return `
        <div class="${cls}" ${itemAttrs}>
            <div class="pg-talento-row">
                <span class="pg-talento-name">${escapeHtml(t.nome)}</span>
                <span class="option-source">(${escapeHtml(t.fonte || '')})</span>
                ${infoBtn}
                ${removeBtn}
            </div>
            <div class="pg-talento-detail" style="display:none;">
                ${prereqHtml}
                ${descHtml || '<div class="pg-talento-desc"><em>Nessuna descrizione disponibile.</em></div>'}
            </div>
        </div>
    `;
}

window._featTogglePickerDetail = function(btn) {
    const item = btn.closest('.pg-talento-item');
    if (!item) return;
    const detail = item.querySelector('.pg-talento-detail');
    if (!detail) return;
    detail.style.display = detail.style.display === 'none' ? '' : 'none';
};

function pgRenderTalenti() {
    const container = document.getElementById('pgTalentiList');
    if (!container) return;
    pgSetupTalentiDelegation(container);
    const ctx = 'wizard';
    if (!window._featPickerFilters[ctx]) window._featPickerFilters[ctx] = _defaultFeatFilters();
    const f = window._featPickerFilters[ctx];
    const q = (window._featPickerSearch[ctx] || '').trim().toLowerCase();

    const selectedHtml = pgCurrentTalenti.map((nome, i) => {
        const info = _featInfo(nome) || { name: nome, source_short: '?' };
        const t = {
            nome,
            fonte: info.source_short || '',
            prerequisites: info.prerequisites || '',
            description: info.description || ''
        };
        return _featPickerItemHtml(t, {
            selected: true,
            delegatedInfo: true,
            removeAction: 'remove',
            removeIndex: i
        });
    }).join('');

    const available = _featsList()
        .filter(t => !pgCurrentTalenti.includes(t.nome))
        .filter(t => _featMatchesFilters(t, f))
        .filter(t => _featMatchesSearch(t, q));
    const listHtml = available.map(t =>
        _featPickerItemHtml(t, {
            delegatedInfo: true,
            itemAction: 'add',
            itemValue: t.nome
        })
    ).join('') || '<div class="scheda-empty" style="padding:12px;">Nessun talento corrisponde ai filtri.</div>';

    setSafeHtml(container, `
        ${_featPickerHeaderHtml(ctx)}
        ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `);
    _featPickerUpdateBadge(ctx);
}

window.pgAddTalento = function(nome) {
    if (!pgCurrentTalenti.includes(nome)) {
        pgCurrentTalenti.push(nome);
        pgRenderTalenti();
    }
};

window.pgRemoveTalento = function(index) {
    pgCurrentTalenti.splice(index, 1);
    pgRenderTalenti();
};
