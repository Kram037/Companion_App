// ============================================================================
// CHARACTER SHEET PRIVILEGES
// ============================================================================

const PRIV_DEFAULT_CUSTOM_TABS = ['Razza', 'Background'];

function _classesData() { return window.CLASSES_DATA || []; }

function _getClassData(slug) {
    if (!slug) return null;
    return _classesData().find(c =>
        c.slug === slug ||
        (c.name_en || '').toLowerCase() === String(slug).toLowerCase() ||
        (c.name || '').toLowerCase() === String(slug).toLowerCase()
    ) || null;
}

function _normalizePrivilegi(pg) {
    const p = pg.privilegi || {};
    let order = Array.isArray(p.custom_tabs_order)
        ? [...p.custom_tabs_order]
        : [...PRIV_DEFAULT_CUSTOM_TABS];
    if (!order.includes('Razza')) order.unshift('Razza');
    // Riporta "Background" tra le tabelle predefinite (auto-popola dal dataset locale).
    if (!order.includes('Background')) {
        const i = order.indexOf('Razza');
        if (i >= 0) order.splice(i + 1, 0, 'Background');
        else order.push('Background');
    }
    return {
        hidden_auto: Array.isArray(p.hidden_auto) ? [...p.hidden_auto] : [],
        custom_features: (p.custom_features && typeof p.custom_features === 'object')
            ? { ...p.custom_features } : {},
        custom_tabs_order: order,
        // Tabelle custom della pagina 1 (Statistiche). Stesso schema delle
        // tabelle custom della pagina 2.
        p1_tabs_order: Array.isArray(p.p1_tabs_order) ? [...p.p1_tabs_order] : [],
        p1_features: (p.p1_features && typeof p.p1_features === 'object')
            ? { ...p.p1_features } : {},
    };
}

/** Sceglie il nome localizzato (IT/EN) di una classe/sottoclasse in base alla lingua corrente. */
function _localizedClassName(entry) {
    if (!entry) return '';
    const lang = _spellLang();
    if (lang === 'en') return entry.name_en || entry.name || '';
    return entry.name || entry.name_en || '';
}

function _autoFeaturesForClass(clsEntry, pgClassLevel) {
    const cls = _getClassData(clsEntry.nome);
    if (!cls) return { className: clsEntry.nome, features: [], subclassName: null, subFeatures: [] };
    const lvl = parseInt(pgClassLevel || clsEntry.livello || 1) || 1;
    const features = (cls.features || [])
        .filter(f => !f.level || f.level <= lvl)
        .map(f => ({
            source: cls.slug,
            source_label: _localizedClassName(cls),
            name_en: f.name_en,
            name: f.name || f.name_en,
            level: f.level,
            description: f.description || '',
            description_en: f.description_en || '',
            translated: !!f.translated,
        }));
    let subclassName = null;
    let subFeatures = [];
    // ── Sottoclasse HOMEBREW: lo slug è 'hb:<id>' e i dati stanno in cache. ──
    if (clsEntry.sottoclasse_homebrew_id || (clsEntry.sottoclasseSlug || '').startsWith('hb:')) {
        const hbId = clsEntry.sottoclasse_homebrew_id
            || String(clsEntry.sottoclasseSlug || '').replace(/^hb:/, '');
        const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewSottoclassi))
            ? AppState.cachedHomebrewSottoclassi : [];
        const hb = cache.find(r => String(r.id) === String(hbId));
        if (hb) {
            subclassName = hb.nome || clsEntry.sottoclasse || 'Sottoclasse Homebrew';
            const feats = Array.isArray(hb.sottoclasse_features) ? hb.sottoclasse_features : [];
            subFeatures = feats
                .filter(f => !f.level || parseInt(f.level) <= lvl)
                .map(f => ({
                    source: cls.slug + ':hb:' + hbId,
                    source_label: subclassName,
                    name_en: f.name || f.nome || '',
                    name: f.name || f.nome || '',
                    level: parseInt(f.level) || null,
                    description: f.description || f.descrizione || '',
                    description_en: f.description || f.descrizione || '',
                    translated: true,
                    _isHomebrew: true,
                }));
        } else {
            // Fallback: la cache homebrew non è ancora disponibile.
            subclassName = clsEntry.sottoclasse || 'Sottoclasse Homebrew';
        }
    } else if (cls.subclasses && cls.subclasses.length > 0 && clsEntry.sottoclasseSlug) {
        const sub = cls.subclasses.find(s => s.slug === clsEntry.sottoclasseSlug);
        if (sub) {
            subclassName = _localizedClassName(sub);
            subFeatures = (sub.features || [])
                .filter(f => !f.level || f.level <= lvl)
                .map(f => ({
                    source: cls.slug + ':' + sub.slug,
                    source_label: subclassName,
                    name_en: f.name_en,
                    name: f.name || f.name_en,
                    level: f.level,
                    description: f.description || '',
                    description_en: f.description_en || '',
                    translated: !!f.translated,
                }));
        }
    }
    return { className: _localizedClassName(cls), features, subclassName, subFeatures };
}

/** Estrae nome/descrizione localizzati di un privilegio (auto o custom) in base alla lingua corrente. */
function _privFeatField(f, key) {
    if (!f) return '';
    const lang = _spellLang();
    if (key === 'name') {
        if (lang === 'en') return f.name_en || f.name || '';
        return f.name || f.name_en || '';
    }
    if (key === 'description') {
        if (lang === 'en') return f.description_en || f.description || '';
        return f.description || f.description_en || '';
    }
    return '';
}

function _privFeatureKey(source, nameEn) {
    return `${source}:${nameEn}`;
}

function _renderPrivFeatureRow(f, opts = {}) {
    const isHidden = !!opts.hidden;
    const isCustom = !!opts.custom;
    const name = _privFeatField(f, 'name');
    const desc = _privFeatField(f, 'description').trim();
    const hasDesc = desc.length > 0;
    const lvlBadge = f.level
        ? `<span class="priv-feat-level">Lv ${f.level}</span>`
        : `<span class="priv-feat-level priv-feat-level-empty">—</span>`;
    // Mostra il badge "EN" solo quando la lingua corrente e' italiano ma esiste solo la versione inglese.
    const lang = _spellLang();
    const showEnWarn = lang === 'it' && !f.translated && !isCustom && f.description_en && !f.description;
    const langWarn = showEnWarn
        ? `<span class="priv-feat-en-badge" title="Descrizione disponibile solo in inglese">EN</span>`
        : '';
    const editFn = opts.editFn || (isCustom
        ? `privEditCustom('${escapeHtml(opts.tabName || '')}',${opts.index})`
        : '');
    // Per le righe custom: il click sull'header toggla il body (come per
    // i privilegi auto). Se non c'e' descrizione, il click apre l'editor
    // per evitare un'azione "morta". La matita affiancata apre sempre
    // l'editor.
    const isClickable = hasDesc || isCustom;
    const headerClass = `priv-feat-header${isClickable ? ' priv-feat-clickable' : ''}${isHidden ? ' priv-feat-hidden' : ''}`;
    const headerOnclick = hasDesc
        ? `onclick="privToggleFeatureBody(this)"`
        : (isCustom && editFn ? `onclick="${editFn}"` : '');
    const arrowHtml = hasDesc ? '<span class="priv-feat-arrow">▾</span>' : '';
    const editBtn = (isCustom && editFn)
        ? `<button class="priv-feat-edit-btn" onclick="event.stopPropagation();${editFn}" title="Modifica">&#9998;</button>`
        : '';
    return `<div class="priv-feat-row${isHidden ? ' priv-feat-row-hidden' : ''}">
        <div class="${headerClass}" ${headerOnclick}>
            ${lvlBadge}
            <span class="priv-feat-name">${escapeHtml(name)}${langWarn}</span>
            ${arrowHtml}
            ${editBtn}
        </div>
        ${hasDesc ? `<div class="priv-feat-body" style="display:none;">${_privDescToHtml(desc)}</div>` : ''}
    </div>`;
}

function _privDescToHtml(desc) {
    // Delegato al formatter unico dell'app: garantisce una sintassi
    // coerente ovunque (**bold**, *bold*, _italic_, "- bullet").
    const html = window.formatRichText(desc);
    return html;
}

window.privToggleFeatureBody = function(headerEl) {
    if (!headerEl) return;
    const row = headerEl.closest('.priv-feat-row');
    if (!row) return;
    const body = row.querySelector('.priv-feat-body');
    const arrow = headerEl.querySelector('.priv-feat-arrow');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
};

// ============================================================
// Tabelle custom della pagina 1 (sotto Risorse)
// Schema identico alla tabella "Risorse": ogni voce e' una risorsa
// consumabile { nome, tipo: 'punti'|'dadi', max, current, dado? }.
// Persistite in pg.privilegi.p1_tabs_order / p1_features.
// ============================================================
function _buildP1CustomTablesHtml(pg) {
    const priv = _normalizePrivilegi(pg);
    if (!priv.p1_tabs_order || priv.p1_tabs_order.length === 0) return '';
    return priv.p1_tabs_order.map(tabName => {
        const items = (priv.p1_features[tabName] || []).filter(r => r && typeof r === 'object' && r.nome != null);
        const rowsHtml = items.length > 0
            ? items.map((r, i) => {
                const max = Number.isFinite(parseInt(r.max)) ? parseInt(r.max) : 1;
                const current = (r.current != null) ? r.current : max;
                const label = r.tipo === 'dadi' && r.dado
                    ? `${escapeHtml(r.nome)} <small>(${escapeHtml(r.dado)})</small>`
                    : escapeHtml(r.nome);
                const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenP1TabRes('${pg.id}',${tabKey},${i})" title="Modifica / elimina">${label}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaP1TabResChange('${pg.id}',${tabKey},${i},${current},-1,${max})">−</button>
                        <span class="scheda-hd-val">${current}</span>
                        <span class="scheda-hd-max">/ ${max}</span>
                        <button class="scheda-hd-btn" onclick="schedaP1TabResChange('${pg.id}',${tabKey},${i},${current},1,${max})">+</button>
                    </div>
                </div>`;
            }).join('')
            : '<span class="scheda-empty">Nessuna risorsa</span>';
        const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
        const sectionKey = 'p1tab:' + tabName;
        const open = window._schedaOpenSections && window._schedaOpenSections.has(sectionKey);
        return `<div class="scheda-section${open ? '' : ' collapsed'}" data-section-key="${escapeHtml(sectionKey)}">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">${escapeHtml(tabName)}
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenP1TabRes('${pg.id}',${tabKey})" title="Aggiungi risorsa">&#9998;</button>
                <button class="scheda-edit-btn priv-tab-remove" onclick="event.stopPropagation();p1RemoveTab(${tabKey})" title="Rimuovi tabella">✕</button>
            </div>
            <div class="scheda-section-body">
                ${items.length > 0 ? `<div class="scheda-hd-table">${rowsHtml}</div>` : rowsHtml}
            </div>
        </div>`;
    }).join('');
}

async function _p1Save(pgId, priv) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    if (_schedaPgCache) _schedaPgCache.privilegi = priv;
    try {
        const { error } = await supabase.from('personaggi')
            .update({ privilegi: priv, updated_at: new Date().toISOString() })
            .eq('id', pgId);
        if (error) {
            console.error('[p1 custom tabs] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes("'privilegi'") || msg.includes('"privilegi"') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[p1 custom tabs] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return false;
    }
}

window.p1AddTab = async function() {
    const name = await _schedaShowInputDialog({
        title: 'Nuova tabella (Pagina 1)',
        placeholder: 'Es. Note, Trofei',
    });
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (priv.p1_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return;
    }
    priv.p1_tabs_order.push(trimmed);
    priv.p1_features[trimmed] = [];
    if (window._schedaOpenSections) window._schedaOpenSections.add('p1tab:' + trimmed);
    _p1Save(pg.id, priv).then(() => openSchedaPersonaggio(pg.id));
};

window.p1RemoveTab = async function(tabName) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Rimuovere tabella?',
        message: `La tabella "${tabName}" e tutte le sue voci verranno eliminate.`,
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    priv.p1_tabs_order = priv.p1_tabs_order.filter(t => t !== tabName);
    delete priv.p1_features[tabName];
    _p1Save(pg.id, priv).then(() => openSchedaPersonaggio(pg.id));
};

// Decremento/Incremento di una risorsa di una tabella custom di pagina 1.
window.schedaP1TabResChange = async function(pgId, tabName, index, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const arr = priv.p1_features[tabName];
    if (!Array.isArray(arr)) return;
    const item = arr[index];
    if (!item) return;
    const newVal = Math.max(0, Math.min(max, current + delta));
    item.current = newVal;
    pg.privilegi = priv;
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            const { error } = await supabase.from('personaggi')
                .update({ privilegi: priv, updated_at: new Date().toISOString() })
                .eq('id', pgId);
            if (error) console.warn('[p1 custom res] save failed', error);
        } catch (e) { console.warn('[p1 custom res] save failed', e); }
    }
    openSchedaPersonaggio(pgId);
};

// Apre la dialog "Aggiungi/Modifica risorsa" per una tabella custom di pagina 1.
window.schedaOpenP1TabRes = function(pgId, tabName, editIndex) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const list = Array.isArray(priv.p1_features[tabName]) ? priv.p1_features[tabName] : [];
    const editing = (editIndex != null && editIndex >= 0);
    const existing = editing ? list[editIndex] : null;
    const initialType = (existing && existing.tipo === 'dadi') ? 'dadi' : 'punti';
    const initialDado = (existing && existing.dado) ? existing.dado : 'd8';
    const initialNome = existing ? (existing.nome || '') : '';
    const initialMax  = existing && Number.isFinite(parseInt(existing.max)) ? parseInt(existing.max) : 1;

    const dadiBtns = ['d4','d6','d8','d10','d12','d20'].map(d =>
        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === initialDado ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
    ).join('');

    const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
    const confirmFn = editing
        ? `schedaConfirmP1TabRes('${pgId}',${tabKey},${editIndex})`
        : `schedaConfirmP1TabRes('${pgId}',${tabKey})`;
    const deleteBtn = editing
        ? `<button type="button" class="btn-danger" onclick="schedaP1TabResDeleteFromEdit('${pgId}',${tabKey},${editIndex})">Elimina</button>`
        : '';

    document.getElementById('p1TabResModal')?.remove();
    const modalHtml = `
    <div class="modal active" id="p1TabResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="document.getElementById('p1TabResModal')?.remove();document.body.style.overflow='';">&times;</button>
            <h2>${editing ? 'Modifica Risorsa' : `Aggiungi a ${escapeHtml(tabName)}`}</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="p1TabResNome" class="form-input" placeholder="Es. Frecce, Pozioni, Cariche" value="${escapeHtml(initialNome)}">
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="custom-res-type-row">
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'punti' ? 'active' : ''}" id="crTypePunti" onclick="schedaCrTypeSelect('punti')">Punti</button>
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'dadi'  ? 'active' : ''}" id="crTypeDadi" onclick="schedaCrTypeSelect('dadi')">Dadi</button>
                </div>
            </div>
            <div class="form-group" id="crDadoGroup" style="display:${initialType === 'dadi' ? '' : 'none'};">
                <label class="form-label">Tipo di dado</label>
                <div class="custom-res-dice-row">${dadiBtns}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Utilizzi massimi</label>
                <input type="number" id="p1TabResMax" class="form-input" min="1" value="${initialMax}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>${deleteBtn}</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('p1TabResModal')?.remove();document.body.style.overflow='';">Annulla</button>
                    <button type="button" class="btn-primary" onclick="${confirmFn}">${editing ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = initialType;
    window._crDado = initialDado;
};

window.schedaConfirmP1TabRes = async function(pgId, tabName, editIndex) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const nome = document.getElementById('p1TabResNome')?.value?.trim();
    if (!nome) { showNotification && showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('p1TabResMax')?.value) || 1;
    const tipo = window._crType || 'punti';
    const priv = _normalizePrivilegi(pg);
    if (!Array.isArray(priv.p1_features[tabName])) priv.p1_features[tabName] = [];
    const arr = priv.p1_features[tabName];
    const editing = (editIndex != null && editIndex >= 0 && arr[editIndex]);
    if (editing) {
        const prev = arr[editIndex];
        const prevCurrent = Number.isFinite(parseInt(prev.current)) ? parseInt(prev.current) : max;
        const updated = { nome, tipo, max, current: Math.max(0, Math.min(prevCurrent, max)) };
        if (tipo === 'dadi') updated.dado = window._crDado || 'd8';
        arr[editIndex] = updated;
    } else {
        const newRes = { nome, tipo, max, current: max };
        if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';
        arr.push(newRes);
    }
    await _p1Save(pgId, priv);
    document.getElementById('p1TabResModal')?.remove();
    document.body.style.overflow = '';
    openSchedaPersonaggio(pgId);
    showNotification && showNotification(editing ? 'Risorsa aggiornata' : 'Risorsa aggiunta');
};

window.schedaP1TabResDeleteFromEdit = async function(pgId, tabName, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare risorsa?',
        message: 'La risorsa verra\' eliminata definitivamente.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    document.getElementById('p1TabResModal')?.remove();
    document.body.style.overflow = '';
    await schedaP1TabResDelete(pgId, tabName, index);
};

window.schedaP1TabResDelete = async function(pgId, tabName, index) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const arr = priv.p1_features[tabName];
    if (!Array.isArray(arr) || !arr[index]) return;
    arr.splice(index, 1);
    await _p1Save(pgId, priv);
    openSchedaPersonaggio(pgId);
    showNotification && showNotification('Risorsa rimossa');
};

window.schedaOpenPrivilegesPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'privilegi';

    const priv = _normalizePrivilegi(pg);
    const classi = pg.classi || [];

    // ── Sezione Classe (per ogni classe del multiclass) ──
    let classBlocks = '';
    let subclassBlocks = '';
    if (classi.length === 0) {
        classBlocks = '<span class="scheda-empty">Nessuna classe selezionata</span>';
    } else {
        classi.forEach(c => {
            const data = _autoFeaturesForClass(c, c.livello);
            const classTitle = `${escapeHtml(data.className)} - Livello ${c.livello || 1}`;
            const rows = data.features.length > 0
                ? data.features.map(f => {
                    const key = _privFeatureKey(f.source, f.name_en);
                    return _renderPrivFeatureRow(f, { hidden: priv.hidden_auto.includes(key), featKey: key });
                  }).join('')
                : '<span class="scheda-empty">Nessun privilegio disponibile a questo livello</span>';
            classBlocks += `<div class="priv-subblock">
                <div class="priv-subblock-title">${classTitle}</div>
                <div class="priv-feat-list-wrap">${rows}</div>
            </div>`;

            if (data.subclassName) {
                const subRows = data.subFeatures.length > 0
                    ? data.subFeatures.map(f => {
                        const key = _privFeatureKey(f.source, f.name_en);
                        return _renderPrivFeatureRow(f, { hidden: priv.hidden_auto.includes(key), featKey: key });
                      }).join('')
                    : '<span class="scheda-empty">Nessun privilegio di sottoclasse a questo livello</span>';
                subclassBlocks += `<div class="priv-subblock">
                    <div class="priv-subblock-title">${escapeHtml(data.subclassName)} (${escapeHtml(data.className)})</div>
                    <div class="priv-feat-list-wrap">${subRows}</div>
                </div>`;
            }
        });
    }

    // ── Sezioni custom ──
    // Le tabelle PREDEFINITE (Razza, Background) vengono renderizzate
    // PRIMA di "Talenti", perche' fanno parte della base del personaggio.
    // Le tabelle CREATE DALL'UTENTE invece vanno DOPO "Talenti", cosi' i
    // privilegi automatici/standard restano in alto e l'utente personalizza
    // in fondo.
    let customDefaultSectionsHtml = '';  // Razza + Background (sopra a Talenti)
    let customUserSectionsHtml = '';     // Tabelle utente (sotto a Talenti)
    priv.custom_tabs_order.forEach(tabName => {
        const items = priv.custom_features[tabName] || [];
        let autoRows = '';
        // Per la tabella "Razza" auto-popola con i tratti dal dataset locale
        // (window.RACES_DATA), poi aggiunge le voci custom dell'utente.
        if (tabName === 'Razza') {
            const raceTraits = _pgRaceMergedTraits(pg);
            if (raceTraits.length > 0) {
                const merged = buildMergedRaceData(pg.razza, pg.sottorazza || null);
                const subraceLabel = merged && merged.sottorazza
                    ? ` <span class="priv-subblock-title-sub">(${escapeHtml(merged.sottorazza)})</span>`
                    : '';
                const headerLabel = `${escapeHtml(pg.razza || '')}${subraceLabel}`;
                const traitRows = raceTraits.map(t => _renderPrivFeatureRow({
                    name: t.name,
                    name_en: t.name_en,
                    description: t.description || '',
                    translated: true,
                }, {})).join('');
                autoRows = `<div class="priv-subblock">
                    <div class="priv-subblock-title">${headerLabel}</div>
                    <div class="priv-feat-list-wrap">${traitRows}</div>
                </div>`;
            }
        }
        // Per la tabella "Background" auto-popola il privilegio dal dataset
        // locale (window.BACKGROUNDS_DATA). Mostra anche un riepilogo di
        // skills/strumenti/lingue/equipaggiamento iniziale + oro come info.
        if (tabName === 'Background' && pg.background) {
            const bg = getBackgroundData(pg.background);
            if (bg && bg._local) {
                const featRows = bg.privilegio_nome
                    ? _renderPrivFeatureRow({
                        name: bg.privilegio_nome,
                        description: bg.privilegio_descrizione || '',
                        translated: true,
                    }, {})
                    : '';
                const infoLines = [];
                if (bg.competenze_abilita && bg.competenze_abilita.length) {
                    const skillNames = bg.competenze_abilita.map(k => {
                        const s = DND_SKILLS.find(x => x.key === k);
                        return s ? s.nome : k;
                    });
                    infoLines.push(`<div class="bg-info-line"><strong>Abilita':</strong> ${escapeHtml(skillNames.join(', '))}</div>`);
                }
                if (bg.scelte_abilita_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Abilita' (a scelta):</strong> ${escapeHtml(bg.scelte_abilita_testo)}</div>`);
                }
                if (bg.competenze_strumenti && bg.competenze_strumenti.length) {
                    infoLines.push(`<div class="bg-info-line"><strong>Strumenti:</strong> ${escapeHtml(bg.competenze_strumenti.join(', '))}</div>`);
                }
                if (bg.scelte_strumenti_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Strumenti (a scelta):</strong> ${escapeHtml(bg.scelte_strumenti_testo)}</div>`);
                }
                if (bg.linguaggi_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Linguaggi:</strong> ${escapeHtml(bg.linguaggi_testo)}</div>`);
                } else if (bg.linguaggi_specifici && bg.linguaggi_specifici.length) {
                    infoLines.push(`<div class="bg-info-line"><strong>Linguaggi:</strong> ${escapeHtml(bg.linguaggi_specifici.join(', '))}</div>`);
                }
                if (bg.equipaggiamento_iniziale && bg.equipaggiamento_iniziale.length) {
                    const eqHtml = bg.equipaggiamento_iniziale.map(e => `<li>${escapeHtml(e)}</li>`).join('');
                    infoLines.push(`<div class="bg-info-line"><strong>Equipaggiamento iniziale:</strong><ul class="bg-info-eq">${eqHtml}</ul></div>`);
                }
                if (bg.oro_iniziale) {
                    infoLines.push(`<div class="bg-info-line"><strong>Oro iniziale:</strong> ${bg.oro_iniziale} mo</div>`);
                }
                const infoBlock = infoLines.length
                    ? `<div class="bg-info-block">${infoLines.join('')}</div>`
                    : '';
                autoRows = `<div class="priv-subblock">
                    <div class="priv-subblock-title">${escapeHtml(pg.background)} <span class="priv-subblock-title-sub">(${escapeHtml(bg.fonte || '')})</span></div>
                    ${infoBlock}
                    <div class="priv-feat-list-wrap">${featRows}</div>
                </div>`;
            }
        }
        const rows = items.length > 0
            ? items.map((f, i) => _renderPrivFeatureRow(f, { custom: true, tabName, index: i })).join('')
            : (autoRows ? '' : '<span class="scheda-empty">Nessun privilegio aggiunto</span>');
        const isDefault = PRIV_DEFAULT_CUSTOM_TABS.includes(tabName);
        // Le tabelle predefinite (Razza/Background) hanno solo "aggiungi
        // privilegio". Le tabelle create dall'utente hanno la matita che
        // apre un mini-editor con: rinomina + aggiungi privilegio + elimina.
        const editBtn = isDefault
            ? `<button class="scheda-edit-btn" onclick="event.stopPropagation();privAddCustom('${escapeHtml(tabName)}')" title="Aggiungi privilegio">&#9998;</button>`
            : `<button class="scheda-edit-btn" onclick="event.stopPropagation();privOpenCustomTabEdit('${escapeHtml(tabName)}')" title="Modifica tabella">&#9998;</button>`;
        const sectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">${escapeHtml(tabName)}
                ${editBtn}
            </div>
            <div class="scheda-section-body">${autoRows}${rows}</div>
        </div>`;
        if (isDefault) customDefaultSectionsHtml += sectionHtml;
        else customUserSectionsHtml += sectionHtml;
    });

    // Sezione Talenti: come tendine espandibili coerenti con le altre
    // tabelle di Pagina 2 (header con nome, dropdown con descrizione).
    const talentiData = _featsData();
    // Indici secondari per matching robusto (per name_en, per slug, e
    // ignorando apostrofi/accenti).
    const _normFeat = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['\u2019\s]/g, '');
    const featByEn = {};
    const featBySlug = {};
    const featByNorm = {};
    Object.values(talentiData).forEach(f => {
        if (f.name_en) featByEn[f.name_en] = f;
        if (f.slug) featBySlug[f.slug] = f;
        if (f.name) featByNorm[_normFeat(f.name)] = f;
        if (f.name_en) featByNorm[_normFeat(f.name_en)] = f;
    });
    const talentiRows = (pg.talenti && pg.talenti.length > 0)
        ? pg.talenti.map(t => {
            const nome = typeof t === 'string' ? t : (t && t.name) || '';
            const feat = talentiData[nome]
                || featByEn[nome]
                || featByNorm[_normFeat(nome)]
                || (t && t.slug && featBySlug[t.slug])
                || null;
            const dispName = (feat && feat.name) || nome;
            const desc = feat
                ? (feat.description || feat.description_en || '')
                : (typeof t === 'object' && t.description) || '(descrizione non disponibile)';
            return _renderPrivFeatureRow({
                name: dispName,
                name_en: feat ? feat.name_en : '',
                description: desc,
                description_en: feat ? feat.description_en : '',
                translated: feat ? !!feat.translated : true,
                level: null,
            }, {});
        }).join('')
        : '<span class="scheda-empty">Nessun talento</span>';
    const talentiSectionHtml = `<div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Talenti
            <small style="color:var(--text-muted);font-weight:500;margin-left:4px;">(${pg.talenti ? pg.talenti.length : 0})</small>
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenTalentiEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-section-body" id="schedaTalentiDisplay">
            ${talentiRows}
        </div>
    </div>`;

    // ─── Sezione Stili di Combattimento ───────────────────────────────
    // Sempre visibile: anche se il PG non ha allowance, mostra un messaggio
    // esplicativo. Cosi' il giocatore puo' sempre aprire il picker.
    const fsAllowance = _pgFightingStylesAllowance(pg);
    const fsKeys = Object.keys(fsAllowance);
    let fightingStylesSectionHtml = '';
    {
        const stored = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object')
            ? pg.stile_combattimento : {};
        let totalSelected = 0;
        let totalMax = 0;
        // Includi nel display solo gli slot rilevanti: o hanno max > 0,
        // oppure hanno gia' degli stili selezionati. La slot
        // 'Personalizzato' viene cosi' nascosta finche' l'utente non ne
        // alza il massimo o ne assegna manualmente uno.
        const visibleKeys = fsKeys.filter(cn => {
            const entry = fsAllowance[cn];
            const slugs = Array.isArray(stored[cn]) ? stored[cn] : [];
            return (entry && entry.max > 0) || slugs.length > 0;
        });
        let blocks = '';
        if (visibleKeys.length > 0) {
            blocks = visibleKeys.map(cn => {
                const entry = fsAllowance[cn];
                const max = entry.max;
                totalMax += max;
                const slugs = Array.isArray(stored[cn]) ? stored[cn] : [];
                totalSelected += slugs.length;
                const rows = slugs.length > 0
                    ? slugs.map(slug => {
                        const fs = _fightingStyleById(slug);
                        return _renderPrivFeatureRow({
                            name: fs ? fs.name : slug,
                            name_en: fs ? fs.name_en : '',
                            description: fs ? fs.description : '',
                            translated: true,
                            level: null,
                        }, {});
                    }).join('')
                    : '<span class="scheda-empty">Nessuno stile selezionato</span>';
                return `<div class="priv-feat-row" style="background:transparent;border:none;padding:0;">
                    <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin:6px 0 4px;">${escapeHtml(cn)} <small style="font-weight:500;text-transform:none;">(${slugs.length}/${max})</small></div>
                    ${rows}
                </div>`;
            }).join('');
        } else {
            blocks = '<div class="scheda-empty" style="padding:6px 4px;">Nessuno stile di combattimento. Premi la matita per modificare il massimo o sceglierne uno.</div>';
        }
        const counterTxt = visibleKeys.length > 0 ? `<small style="color:var(--text-muted);font-weight:500;margin-left:4px;">(${totalSelected}/${totalMax})</small>` : '';
        fightingStylesSectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Stili di Combattimento
                ${counterTxt}
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenFightingStylesEdit('${pg.id}')" title="Scegli stili">&#9998;</button>
            </div>
            <div class="scheda-section-body" id="schedaFightingStylesDisplay">${blocks}</div>
        </div>`;
    }

    // Sezione Invocazioni Occulte (solo per Warlock).
    let invocationsSectionHtml = '';
    const wlvl = _pgWarlockLevel(pg);
    if (wlvl >= 2) {
        const maxInv = _pgMaxInvocations(pg);
        const selected = (pg.invocazioni || []).map(id => _invocationById(id)).filter(Boolean);
        const itemsHtml = selected.length > 0
            ? selected.map(inv => {
                const desc = (inv.description || '').replace(/\s+/g, ' ').trim();
                const prereq = _formatInvocationPrereqs(inv);
                const prereqLine = prereq ? `<div class="priv-feat-prereq"><strong>Prerequisiti:</strong> ${escapeHtml(prereq)}</div>` : '';
                return `<div class="priv-feat-row">
                    <div class="priv-feat-header priv-feat-clickable" onclick="privToggleFeatureBody(this)">
                        <span class="priv-feat-level">${escapeHtml(inv.source_short || '')}</span>
                        <span class="priv-feat-name">${escapeHtml(inv.name)}</span>
                        <span class="priv-feat-arrow">&#9662;</span>
                    </div>
                    <div class="priv-feat-body" style="display:none;">
                        ${prereqLine}
                        <div class="priv-feat-desc">${window.formatRichText(desc)}</div>
                    </div>
                </div>`;
            }).join('')
            : '<span class="scheda-empty">Nessuna supplica selezionata</span>';
        invocationsSectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Suppliche Occulte <small style="color:var(--text-muted);font-weight:500;">(${selected.length} / ${maxInv})</small>
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenInvocationsEdit('${pg.id}')" title="Modifica suppliche">&#9998;</button>
            </div>
            <div class="scheda-section-body" id="schedaInvocationsDisplay">${itemsHtml}</div>
        </div>`;
    }

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Pagina 2 · Privilegi')}

    <div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Classe</div>
        <div class="scheda-section-body">${classBlocks}</div>
    </div>

    ${subclassBlocks ? `<div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Sottoclasse</div>
        <div class="scheda-section-body">${subclassBlocks}</div>
    </div>` : ''}

    ${fightingStylesSectionHtml}

    ${invocationsSectionHtml}

    ${customDefaultSectionsHtml}

    ${talentiSectionHtml}

    ${customUserSectionsHtml}

    <div class="priv-add-tab-wrap">
        <button class="btn-secondary priv-add-tab-btn" onclick="privAddTab()">
            <span class="priv-add-tab-plus">+</span> Nuova tabella
        </button>
    </div>
    `;

    schedaSetActiveTab('privilegi');
    schedaWireTabBar(pgId);
};

async function _privSave(pgId, priv) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    if (_schedaPgCache) _schedaPgCache.privilegi = priv;
    try {
        const { error } = await supabase.from('personaggi').update({ privilegi: priv }).eq('id', pgId);
        if (error) {
            console.error('[priv tabs] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes("'privilegi'") || msg.includes('"privilegi"') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[priv tabs] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return false;
    }
}

window.privToggleAutoFeature = async function(featKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    const i = priv.hidden_auto.indexOf(featKey);
    if (i >= 0) priv.hidden_auto.splice(i, 1);
    else priv.hidden_auto.push(featKey);
    await _privSave(pg.id, priv);
    schedaOpenPrivilegesPage(pg.id);
};

window.privAddCustom = function(tabName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    _privOpenEditDialog({ tabName, mode: 'add' });
};

window.privEditCustom = function(tabName, index) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    const item = (priv.custom_features[tabName] || [])[index];
    if (!item) return;
    _privOpenEditDialog({ tabName, mode: 'edit', index, item });
};

window.privRemoveCustom = async function(tabName, index) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (!priv.custom_features[tabName]) return;
    priv.custom_features[tabName].splice(index, 1);
    await _privSave(pg.id, priv);
    schedaOpenPrivilegesPage(pg.id);
};

// Mini modal di input (sostituisce prompt() che in alcuni contesti
// Electron viene bloccato e ritorna null silenziosamente).
function _schedaShowInputDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => {
            if (e.target === overlay) { overlay.remove(); resolve(null); }
        };
        const title = (opts && opts.title) || 'Inserisci un valore';
        const placeholder = (opts && opts.placeholder) || '';
        const initial = (opts && opts.initial) || '';
        overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
            <h3 style="margin-bottom:12px;font-size:1rem;">${escapeHtml(title)}</h3>
            <input type="text" id="schedaInputDlgVal" class="hp-calc-input" value="${escapeHtml(initial)}" placeholder="${escapeHtml(placeholder)}">
            <div class="dialog-actions" style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn-secondary" id="schedaInputDlgCancel">Annulla</button>
                <button class="btn-primary" id="schedaInputDlgOk">OK</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        const input = document.getElementById('schedaInputDlgVal');
        const finish = (val) => { overlay.remove(); resolve(val); };
        document.getElementById('schedaInputDlgCancel').onclick = () => finish(null);
        document.getElementById('schedaInputDlgOk').onclick = () => finish(input.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); finish(input.value); }
            if (e.key === 'Escape') { e.preventDefault(); finish(null); }
        };
        // Nessun auto-focus: evita la comparsa automatica della tastiera.
    });
}

// Dialog di conferma promise-based con stile dell'app (sostituisce window.confirm).
// opts: { title, message, confirmLabel, cancelLabel, danger? }
function _schedaShowConfirmDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
        const title = (opts && opts.title) || 'Conferma';
        const message = (opts && opts.message) || '';
        const confirmLabel = (opts && opts.confirmLabel) || 'OK';
        const cancelLabel = (opts && opts.cancelLabel) || 'Annulla';
        const danger = !!(opts && opts.danger);
        overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
            <h3 style="margin-bottom:10px;font-size:1rem;">${escapeHtml(title)}</h3>
            <p style="margin:0 0 14px;font-size:0.92rem;color:var(--text);">${escapeHtml(message)}</p>
            <div class="dialog-actions" style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn-secondary" id="schedaConfirmDlgCancel">${escapeHtml(cancelLabel)}</button>
                <button class="${danger ? 'btn-danger' : 'btn-primary'}" id="schedaConfirmDlgOk">${escapeHtml(confirmLabel)}</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        const finish = (val) => { overlay.remove(); resolve(val); };
        document.getElementById('schedaConfirmDlgCancel').onclick = () => finish(false);
        document.getElementById('schedaConfirmDlgOk').onclick = () => finish(true);
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); document.removeEventListener('keydown', onKey); finish(false); }
            if (e.key === 'Enter')  { e.preventDefault(); document.removeEventListener('keydown', onKey); finish(true); }
        };
        document.addEventListener('keydown', onKey);
    });
}

// Tastierino numerico custom (stesso stile di pgOpenAbilityKeypad) per
// dialog promise-based. Evita la tastiera nativa del telefono.
// opts: { title, initial, min, max }
function _schedaShowNumpadDialog(opts) {
    return new Promise(resolve => {
        const title = (opts && opts.title) || 'Inserisci un valore';
        const initial = (opts && opts.initial != null) ? String(opts.initial) : '';
        const min = (opts && opts.min != null) ? Number(opts.min) : null;
        const max = (opts && opts.max != null) ? Number(opts.max) : null;
        const id = 'schedaNumpadOverlay';
        document.getElementById(id)?.remove();
        const buf = { v: initial && /^\d+$/.test(initial) ? initial : '' };
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => { if (e.target === overlay) { cleanup(); resolve(null); } };
        const rangeHint = (min != null && max != null) ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;text-align:center;">Valore tra ${min} e ${max}</div>` : '';
        overlay.innerHTML = `
            <div class="hp-calc-modal" style="width:300px;">
                <button class="hp-calc-close" id="schedaNumpadClose">&times;</button>
                <div class="hp-calc-title">${escapeHtml(title)}</div>
                ${rangeHint}
                <div class="hp-calc-input-display" id="schedaNumpadDisp">${escapeHtml(buf.v || '0')}</div>
                <div class="hp-calc-numpad">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-calc-numpad-btn" data-k="${n}">${n}</button>`).join('')}
                    <button class="hp-calc-numpad-btn" data-k="C">C</button>
                    <button class="hp-calc-numpad-btn" data-k="0">0</button>
                    <button class="hp-calc-numpad-btn" data-k="BS">⌫</button>
                </div>
                <div class="hp-calc-buttons" style="display:flex;gap:8px;">
                    <button class="hp-calc-btn" id="schedaNumpadCancel" style="flex:1;background:var(--surface);color:var(--text);">Annulla</button>
                    <button class="hp-calc-btn heal" id="schedaNumpadOk" style="flex:1;">Conferma</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const disp = document.getElementById('schedaNumpadDisp');
        const refresh = () => { disp.textContent = buf.v || '0'; };
        const press = (k) => {
            if (k === 'C') buf.v = '';
            else if (k === 'BS') buf.v = buf.v.slice(0, -1);
            else if (/^\d$/.test(k)) {
                if (buf.v === '0') buf.v = k;
                else buf.v = (buf.v + k).slice(0, 4);
            }
            refresh();
        };
        overlay.querySelectorAll('.hp-calc-numpad-btn').forEach(btn => {
            btn.onclick = () => press(btn.getAttribute('data-k'));
        });
        const cleanup = () => { overlay.remove(); };
        const validate = () => {
            if (!buf.v) return null;
            const n = parseInt(buf.v, 10);
            if (!Number.isFinite(n)) return null;
            if (min != null && n < min) return null;
            if (max != null && n > max) return null;
            return n;
        };
        document.getElementById('schedaNumpadOk').onclick = () => {
            const n = validate();
            if (n == null) {
                showNotification && showNotification(min != null && max != null
                    ? `Valore non valido (${min}-${max})`
                    : 'Valore non valido');
                return;
            }
            cleanup(); resolve(n);
        };
        document.getElementById('schedaNumpadCancel').onclick = () => { cleanup(); resolve(null); };
        document.getElementById('schedaNumpadClose').onclick = () => { cleanup(); resolve(null); };
    });
}

window.privAddTab = async function() {
    const name = await _schedaShowInputDialog({
        title: 'Nuova tabella',
        placeholder: 'Es. Talenti, Doni divini',
    });
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (priv.custom_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return;
    }
    priv.custom_tabs_order.push(trimmed);
    priv.custom_features[trimmed] = [];
    _privSave(pg.id, priv).then(() => schedaOpenPrivilegesPage(pg.id));
};

window.privRemoveTab = async function(tabName) {
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(tabName)) return;
    const ok = await _schedaShowConfirmDialog({
        title: 'Rimuovere tabella?',
        message: `La tabella "${tabName}" e tutti i suoi privilegi verranno eliminati.`,
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    priv.custom_tabs_order = priv.custom_tabs_order.filter(t => t !== tabName);
    delete priv.custom_features[tabName];
    _privSave(pg.id, priv).then(() => schedaOpenPrivilegesPage(pg.id));
};

window.privRenameTab = async function(oldName, newName) {
    const trimmed = String(newName || '').trim();
    if (!trimmed || trimmed === oldName) return false;
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(oldName)) return false;
    const pg = _schedaPgCache;
    if (!pg) return false;
    const priv = _normalizePrivilegi(pg);
    if (priv.custom_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return false;
    }
    const idx = priv.custom_tabs_order.indexOf(oldName);
    if (idx < 0) return false;
    priv.custom_tabs_order[idx] = trimmed;
    priv.custom_features[trimmed] = priv.custom_features[oldName] || [];
    delete priv.custom_features[oldName];
    await _privSave(pg.id, priv);
    return true;
};

// Mini editor di una tabella custom: permette di rinominare la tabella,
// aggiungere un nuovo privilegio o eliminare l'intera tabella.
window.privOpenCustomTabEdit = function(tabName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(tabName)) {
        // Tabelle predefinite: niente rinomina/elimina, solo aggiungi.
        return privAddCustom(tabName);
    }
    let modal = document.getElementById('privEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'privEditModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
    <div class="modal-content priv-edit-card">
        <button class="modal-close" onclick="privCloseEdit()" aria-label="Chiudi">×</button>
        <h2 style="margin:0 0 12px;font-size:1.05rem;">Modifica tabella</h2>
        <label class="priv-edit-label">Nome tabella
            <input type="text" id="privTabRenameInput" class="priv-edit-input" value="${escapeHtml(tabName)}" placeholder="Nome della tabella" data-original="${escapeHtml(tabName)}">
        </label>
        <button type="button" class="btn-secondary" style="margin-top:8px;width:100%;"
            onclick="privCloseEdit();privAddCustom('${escapeHtml(tabName)}')">+ Aggiungi privilegio</button>
        <div class="priv-edit-actions priv-edit-actions-wrap">
            <div class="priv-edit-actions-left">
                <button class="btn-danger" onclick="privDeleteTabFromEdit('${escapeHtml(tabName)}')">Elimina</button>
            </div>
            <div class="priv-edit-actions-right">
                <button class="btn-secondary" onclick="privCloseEdit()">Annulla</button>
                <button class="btn-primary" onclick="privConfirmRenameTab('${escapeHtml(tabName)}')">Salva</button>
            </div>
        </div>
    </div>`;
    modal.classList.add('active');
};

window.privConfirmRenameTab = async function(oldName) {
    const input = document.getElementById('privTabRenameInput');
    if (!input) return;
    const newName = (input.value || '').trim();
    if (!newName) {
        showNotification && showNotification('Inserisci un nome valido');
        return;
    }
    if (newName === oldName) {
        privCloseEdit();
        return;
    }
    const ok = await privRenameTab(oldName, newName);
    if (ok) {
        privCloseEdit();
        const pg = _schedaPgCache;
        if (pg) schedaOpenPrivilegesPage(pg.id);
    }
};

window.privDeleteTabFromEdit = async function(tabName) {
    privCloseEdit();
    await privRemoveTab(tabName);
};

function _privOpenEditDialog({ tabName, mode, index, item }) {
    let modal = document.getElementById('privEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'privEditModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    const it = item || { name: '', level: '', description: '' };
    const title = mode === 'edit' ? 'Modifica privilegio' : `Aggiungi a ${tabName}`;
    const isEdit = mode === 'edit' && index != null && index >= 0;
    const deleteBtn = isEdit
        ? `<button class="btn-danger" onclick="privDeleteFromEdit('${escapeHtml(tabName)}',${index})">Elimina</button>`
        : '';
    modal.innerHTML = `
    <div class="modal-content priv-edit-card">
        <button class="modal-close" onclick="privCloseEdit()" aria-label="Chiudi">×</button>
        <h2 style="margin:0 0 12px;font-size:1.05rem;">${escapeHtml(title)}</h2>
        <label class="priv-edit-label">Nome
            <input type="text" id="privEditName" class="priv-edit-input" value="${escapeHtml(it.name)}" placeholder="Es. Visione del Buio">
        </label>
        <label class="priv-edit-label">Livello (opzionale)
            <input type="number" id="privEditLevel" class="priv-edit-input priv-edit-input-num" value="${it.level || ''}" min="1" max="20" placeholder="—">
        </label>
        <label class="priv-edit-label">Descrizione
            <textarea id="privEditDesc" class="priv-edit-textarea" rows="6" placeholder="Descrizione del privilegio">${escapeHtml(it.description || '')}</textarea>
        </label>
        <div class="priv-edit-actions priv-edit-actions-wrap">
            <div class="priv-edit-actions-left">${deleteBtn}</div>
            <div class="priv-edit-actions-right">
                <button class="btn-secondary" onclick="privCloseEdit()">Annulla</button>
                <button class="btn-primary" onclick="privConfirmEdit('${escapeHtml(tabName)}','${mode}',${index === undefined ? -1 : index})">Salva</button>
            </div>
        </div>
    </div>`;
    modal.classList.add('active');
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

window.privDeleteFromEdit = async function(tabName, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare voce?',
        message: 'Questa voce verra\' rimossa definitivamente dalla tabella.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    privCloseEdit();
    if (typeof window.privRemoveCustom === 'function') {
        await window.privRemoveCustom(tabName, index);
    }
};

window.privCloseEdit = function() {
    const modal = document.getElementById('privEditModal');
    if (modal) modal.classList.remove('active');
};

window.privConfirmEdit = async function(tabName, mode, index) {
    const name = (document.getElementById('privEditName')?.value || '').trim();
    const lvlRaw = (document.getElementById('privEditLevel')?.value || '').trim();
    const desc = (document.getElementById('privEditDesc')?.value || '').trim();
    if (!name) {
        showNotification && showNotification('Inserisci almeno il nome');
        return;
    }
    const level = lvlRaw ? Math.max(1, Math.min(20, parseInt(lvlRaw) || 0)) : null;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (!priv.custom_features[tabName]) priv.custom_features[tabName] = [];
    const newItem = { name, level, description: desc };
    if (mode === 'edit' && index >= 0) priv.custom_features[tabName][index] = newItem;
    else priv.custom_features[tabName].push(newItem);
    await _privSave(pg.id, priv);
    privCloseEdit();
    schedaOpenPrivilegesPage(pg.id);
};

function schedaSetActiveTab(tab) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    const privTab = document.getElementById('schedaTabPrivileges');
    if (mainTab) mainTab.classList.toggle('active', tab === 'scheda');
    if (spellTab) spellTab.classList.toggle('active', tab === 'incantesimi');
    if (invTab) invTab.classList.toggle('active', tab === 'inventario');
    if (privTab) privTab.classList.toggle('active', tab === 'privilegi');
}

function schedaWireTabBar(pgId) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    const privTab = document.getElementById('schedaTabPrivileges');
    if (mainTab) mainTab.onclick = () => renderSchedaPersonaggio(pgId);
    if (spellTab) spellTab.onclick = () => schedaOpenSpellPage(pgId);
    if (invTab) invTab.onclick = () => schedaOpenInventoryPage(pgId);
    if (privTab) privTab.onclick = () => schedaOpenPrivilegesPage(pgId);
}

function schedaSlotToggleInline(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg || !pg.slot_incantesimo) return;

    const slot = pg.slot_incantesimo[level];
    if (!slot) return;

    if (index < slot.current) {
        slot.current = index;
    } else {
        slot.current = index + 1;
    }

    // Update pips without reloading
    const content = document.getElementById('schedaContent');
    if (content) {
        const pips = content.querySelectorAll(`.scheda-slot-pip[data-lvl="${level}"]`);
        pips.forEach((p, i) => {
            p.classList.toggle('filled', i < slot.current);
        });
        const countEl = document.getElementById(`sSlotCount_${level}`);
        if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
    }

    schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
}

// Res/Imm inline edit on character sheet
