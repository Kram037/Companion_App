// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

// [BUILD-MARKER] Se vedi questa riga in console, hai la versione nuova del file.
appDebug('[homebrew][build] personaggi.js BUILD 2026-04-23-F integrazione sottoclassi homebrew nella scheda');

/* ──────────────────────────────────────────────────────────────────────
   Privilegi Tab
   Schema dati pg.privilegi:
   {
     hidden_auto: ['<class_slug>:<feature_name_en>', ...],   // privilegi auto-popolati nascosti
     custom_features: { '<TabName>': [{name, level, description}] },
     custom_tabs_order: ['Razza','Background', ...]          // ordine + presenza tabelle custom
   }
   ────────────────────────────────────────────────────────────────────── */

// Tabelle custom presenti di default nella pagina Privilegi.
// Nota: "Talenti" non e' qui perche' viene gestito come sezione speciale legata a pg.talenti.
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

function _invocationMatchesFilters(inv, pg) {
    const f = window._invocationPickerFilters;
    if (f.source !== 'all' && (inv.source_short || '?') !== f.source) return false;
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
    const filtered = allStyles.filter(({ fs, slots }) => {
        if (state.source !== 'all' && fs.source_short !== state.source) return false;
        if (state.slot !== 'all' && !slots.includes(state.slot)) return false;
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
let _hpCalcState = null;

window.schedaOpenHpCalcLive = function(pgId, field) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let currentVal, maxVal;
    if (field === 'pv_attuali') {
        currentVal = pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10);
        maxVal = pg.punti_vita_max || 10;
    } else if (field === 'pv_temporanei') {
        currentVal = pg.pv_temporanei || 0;
        maxVal = -1;
    } else if (field === 'punti_vita_max') {
        currentVal = pg.punti_vita_max || 10;
        maxVal = -1;
    }
    schedaOpenHpCalc(pgId, field, currentVal, maxVal);
}

window.schedaOpenHpCalc = function(pgId, field, currentVal, maxVal) {
    _hpCalcState = { pgId, field, currentVal, maxVal, inputBuffer: '0' };
    const labels = { pv_attuali: 'Punti Vita Attuali', pv_temporanei: 'Punti Vita Temporanei', punti_vita_max: 'Punti Vita Massimi' };
    const label = labels[field] || 'Punti Vita';
    const maxDisplay = (maxVal > 0 && field !== 'punti_vita_max') ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';

    const isDirectEdit = field === 'punti_vita_max';

    let pvMedioHint = '';
    let actionButtons;
    if (isDirectEdit) {
        const pgRef = _schedaPgCache;
        const medio = (typeof _calcPVMedio === 'function') ? _calcPVMedio(pgRef) : 0;
        const reale = (typeof _getPvMaxReale === 'function') ? _getPvMaxReale(pgRef) : 0;
        const hintParts = [];
        if (medio > 0) {
            hintParts.push(`<div class="hp-calc-hint-cell"><span class="hp-calc-hint-lbl">PV medio</span><strong class="hp-calc-medio">${medio}</strong></div>`);
        }
        if (reale > 0) {
            hintParts.push(`<div class="hp-calc-hint-cell"><span class="hp-calc-hint-lbl">Max reale</span><strong class="hp-calc-reale">${reale}</strong></div>`);
        }
        if (hintParts.length > 0) {
            pvMedioHint = `<div class="hp-calc-hint hp-calc-hint-grid">${hintParts.join('')}</div>`;
        }
        actionButtons = `<div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaHpSetDirect()">Conferma</button>
            </div>
            <div class="hp-calc-buttons hp-calc-buttons-extra">
                <button class="hp-calc-btn neutral hp-calc-btn-full" onclick="schedaHpSetMaxReale()" title="Imposta il valore digitato come nuovo Max Reale">Imposta come Max Reale</button>
            </div>`;
    } else {
        actionButtons = `<div class="hp-calc-buttons">
            <button class="hp-calc-btn damage" onclick="schedaHpApply(-1)">− Danno</button>
            <button class="hp-calc-btn heal" onclick="schedaHpApply(1)">+ Cura</button>
           </div>`;
    }

    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
            ${pvMedioHint}
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            ${actionButtons}
        </div>
    `;
    document.body.appendChild(overlay);
}

window.hpCalcNumpad = function(key) {
    if (!_hpCalcState) return;
    if (key === 'C') {
        _hpCalcState.inputBuffer = '0';
    } else if (key === '⌫') {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.length > 1 ? _hpCalcState.inputBuffer.slice(0, -1) : '0';
    } else {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer === '0' ? key : _hpCalcState.inputBuffer + key;
    }
    const display = document.getElementById('hpCalcAmountDisplay');
    if (display) display.textContent = _hpCalcState.inputBuffer;
}

// Imposta il valore digitato come nuovo "Max Reale" del PG.
// Salva sia bonus_manuali._pv_max_reale sia pg.punti_vita_max,
// chiedendo prima conferma all'utente.
window.schedaHpSetMaxReale = async function() {
    if (!_hpCalcState) return;
    if (_hpCalcState.field !== 'punti_vita_max') return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const buf = parseInt(_hpCalcState.inputBuffer) || 0;
    if (buf <= 0) {
        showNotification('Digita un valore valido nel tastierino prima di impostare il Max Reale');
        return;
    }
    const oldReale = (typeof _getPvMaxReale === 'function') ? _getPvMaxReale(pg) : (parseInt(pg.punti_vita_max) || 0);
    const ok = await _schedaShowConfirmDialog({
        title: 'Aggiornare il Max Reale?',
        message: `Il Max Reale passera' da ${oldReale} a ${buf} PV. Anche il valore di PV massimi corrente verra' impostato a ${buf}.`,
        confirmLabel: 'Conferma',
    });
    if (!ok) return;

    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    bm._pv_max_reale = buf;
    pg.bonus_manuali = bm;
    pg.punti_vita_max = buf;

    _hpCalcState.currentVal = buf;
    _hpCalcState.inputBuffer = '0';
    const cur = document.getElementById('hpCalcCurrent');
    if (cur) cur.textContent = buf;
    const amt = document.getElementById('hpCalcAmountDisplay');
    if (amt) amt.textContent = '0';
    const realeEl = document.querySelector('#hpCalcOverlay .hp-calc-reale');
    if (realeEl) realeEl.textContent = buf;
    const pgDisplay = document.getElementById('schedaPvMax');
    if (pgDisplay) pgDisplay.textContent = buf;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({
            punti_vita_max: buf,
            bonus_manuali: pg.bonus_manuali,
            updated_at: new Date().toISOString(),
        }).eq('id', _hpCalcState.pgId);
    }
    showNotification('Max Reale aggiornato');
};

window.schedaHpSetDirect = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    _hpCalcState.inputBuffer = '0';
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

window.schedaHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = parseInt(_hpCalcState.inputBuffer) || 0;
    if (amount === 0) return;

    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

let _hpCalcClosedAt = 0;

window.schedaCloseHpCalc = async function() {
    const overlay = document.getElementById('hpCalcOverlay');
    if (overlay) overlay.remove();
    const wasMonster = _hpCalcState?.isMonster;
    const monsterId = _hpCalcState?.pgId;
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
        // Se il calcolatore HP era stato aperto dalla full-sheet del mostro
        // in combattimento, ricarichiamo quella modale per riflettere i PV
        // aggiornati senza chiuderla.
        const fullModal = document.getElementById('combatMonsterFullModal');
        if (fullModal && fullModal.classList.contains('active') && monsterId && typeof combatOpenMonsterFullSheet === 'function') {
            combatOpenMonsterFullSheet(monsterId, campagnaId, sessioneId);
        }
        // Stessa cosa per la dialog placeholder: re-render per aggiornare
        // i numeri delle box PV / CA al volo.
        const phModal = document.getElementById('combatPlaceholderModal');
        if (phModal && phModal.classList.contains('active') && monsterId && typeof combatOpenPlaceholderDialog === 'function') {
            combatOpenPlaceholderDialog(monsterId, campagnaId, sessioneId);
        }
    }
}

window.schedaOpenStatCalc = function(pgId, field) {
    const currentVal = _schedaPgCache?.[field] ?? 0;
    _hpCalcState = { pgId, field, currentVal, maxVal: -1, inputBuffer: '0' };
    const labels = { classe_armatura: 'Classe Armatura', iniziativa: 'Iniziativa' };
    const label = labels[field] || field;

    let breakdownHtml = '';
    if (field === 'classe_armatura' && _schedaPgCache) {
        const lines = getCABreakdown(_schedaPgCache);
        breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    }

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaOpenAbilityCalc = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentVal = pg[abilityKey] || 10;
    const abilityInfo = SCHEDA_ABILITIES.find(a => a.key === abilityKey);
    const label = abilityInfo ? abilityInfo.full : abilityKey;
    _hpCalcState = { pgId, field: abilityKey, currentVal, maxVal: -1, inputBuffer: String(currentVal), isAbility: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${escapeHtml(label)}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">${currentVal}</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaStatConfirm = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    const field = _hpCalcState.field;
    const pgId = _hpCalcState.pgId;
    const pg = _schedaPgCache;
    const oldVal = _hpCalcState.currentVal;

    if (pg) pg[field] = newVal;

    if (_hpCalcState.isAbility) {
        const clampedVal = Math.max(1, Math.min(30, newVal));
        if (pg) pg[field] = clampedVal;
        const abilEl = document.getElementById(`sAbil_${field}`);
        if (abilEl) abilEl.textContent = clampedVal;

        const updates = { [field]: clampedVal };

        // Propaga la variazione del modificatore di Destrezza al
        // valore di iniziativa salvato (che e' un totale: dex_mod +
        // factotum + bonus manuali). In questo modo cambiando la
        // caratteristica si aggiorna automaticamente l'iniziativa
        // mostrata e usata nei tiri.
        if (field === 'destrezza' && pg) {
            const oldDesMod = Math.floor(((parseInt(oldVal) || 10) - 10) / 2);
            const newDesMod = Math.floor((clampedVal - 10) / 2);
            const modDelta = newDesMod - oldDesMod;
            if (modDelta !== 0) {
                const baseInit = pg.iniziativa != null
                    ? pg.iniziativa
                    : oldDesMod + _getFactotumBonus(pg);
                pg.iniziativa = baseInit + modDelta;
                updates.iniziativa = pg.iniziativa;
            }
        }

        // Propaga la variazione del modificatore di Costituzione ai PV
        // massimi (e ai PV attuali) usando il livello totale del PG.
        // Esempio: passare da COS 14 a 16 a livello 5 aggiunge +5 PV max.
        if (field === 'costituzione' && pg) {
            const oldCosMod = Math.floor(((parseInt(oldVal) || 10) - 10) / 2);
            const newCosMod = Math.floor((clampedVal - 10) / 2);
            const cosDelta = newCosMod - oldCosMod;
            if (cosDelta !== 0) {
                const totalLevel = (pg.classi || []).reduce((s, c) => s + (parseInt(c.livello) || 0), 0)
                    || pg.livello || 1;
                const pvDelta = cosDelta * totalLevel;
                const oldPvMax = parseInt(pg.punti_vita_max) || 10;
                const newPvMax = Math.max(1, oldPvMax + pvDelta);
                pg.punti_vita_max = newPvMax;
                updates.punti_vita_max = newPvMax;

                const oldPvAttuali = pg.pv_attuali != null ? parseInt(pg.pv_attuali) : oldPvMax;
                const newPvAttuali = Math.max(0, Math.min(newPvMax, oldPvAttuali + pvDelta));
                if (newPvAttuali !== oldPvAttuali) {
                    pg.pv_attuali = newPvAttuali;
                    updates.pv_attuali = newPvAttuali;
                }

                // Anche il "Max Reale" (se gia' impostato esplicitamente)
                // deve seguire il delta di COS, perche' rappresenta i PV
                // massimi effettivi del PG comprensivi del bonus COS.
                const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
                const storedReale = parseInt(bm._pv_max_reale);
                if (Number.isFinite(storedReale) && storedReale > 0) {
                    bm._pv_max_reale = Math.max(1, storedReale + pvDelta);
                    pg.bonus_manuali = bm;
                    updates.bonus_manuali = pg.bonus_manuali;
                }

                const pvMaxEl = document.getElementById('schedaPvMax');
                if (pvMaxEl) pvMaxEl.textContent = newPvMax;
                const pvAttEl = document.getElementById('schedaPvAttuali');
                if (pvAttEl) pvAttEl.textContent = newPvAttuali;
            }
        }

        schedaRecalcAbility(field, clampedVal, pgId);
        await schedaInstantSave(pgId, updates);
        _recalcEquipFromStats(pgId);
    } else {
        const displayIds = { classe_armatura: 'schedaCA', iniziativa: 'schedaInit' };
        const el = document.getElementById(displayIds[field]);
        if (el) {
            el.textContent = field === 'iniziativa' ? (newVal >= 0 ? '+' + newVal : '' + newVal) : newVal;
        }
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('personaggi').update({ [field]: newVal, updated_at: new Date().toISOString() }).eq('id', pgId);
        }
    }
    schedaCloseHpCalc();
};

window.schedaOpenSpeedCalc = function(pgId) {
    const currentVal = _schedaPgCache?.velocita ?? 9;
    _hpCalcState = { pgId, field: 'velocita', currentVal, maxVal: -1, inputBuffer: '0', isSpeed: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">Velocità</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span><span class="hp-calc-max">m</span></div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn damage" onclick="schedaSpeedAdjust(-1.5)">− 1.5</button>
                <button class="hp-calc-btn heal" onclick="schedaSpeedAdjust(1.5)">+ 1.5</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaSpeedAdjust = async function(delta) {
    if (!_hpCalcState) return;
    let newVal = _hpCalcState.currentVal + delta;
    if (newVal < 0) newVal = 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;

    if (_schedaPgCache) _schedaPgCache.velocita = newVal;
    const el = document.getElementById('schedaSpeed');
    if (el) el.textContent = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ velocita: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
};

window.schedaToggleConcentrazione = async function(pgId, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ concentrazione: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
    if (_schedaPgCache) _schedaPgCache.concentrazione = !isActive;
};

/* ── Ispirazione (contatore semplice, illimitato, >= 0) ── */
window.schedaIspChange = function(pgId, delta) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = parseInt(pg.ispirazione || 0) || 0;
    const newVal = Math.max(0, current + delta);
    if (newVal === current && delta < 0) return;
    pg.ispirazione = newVal;
    const el = document.getElementById('sIsp');
    if (el) el.textContent = newVal;
    schedaInstantSave(pgId, { ispirazione: newVal });
};

/* ── Level Up ────────────────────────────────────────────────────────────────
   Aumenta di 1 il livello di una classe del PG. Per i PV chiede al giocatore
   se usare il valore medio (fisso) oppure tirare il dado vita. Aggiorna anche
   dadi vita disponibili, livello totale, e indirettamente risorse di classe
   e privilegi (calcolati dinamicamente in fase di render in base al livello).
   ────────────────────────────────────────────────────────────────────────── */
window.schedaLevelUp = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) {
        // Carica il PG se non e' in cache (es. clic dalla tab Inventario senza prima aver caricato la scheda).
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
            if (data) _schedaPgCache = data;
        }
    }
    const cur = _schedaPgCache;
    if (!cur) return;
    const classi = Array.isArray(cur.classi) ? cur.classi : [];
    if (classi.length === 0) {
        showNotification('Nessuna classe configurata');
        return;
    }
    const totLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);
    if (totLevel >= 20) {
        showNotification('Livello massimo raggiunto (20)');
        return;
    }

    // Sempre picker: scegli quale classe far salire oppure aggiungi multiclasse.
    _showLevelUpPicker(pgId, classi);
};

function _showLevelUpPicker(pgId, classi) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rows = classi.map((c, i) => {
        const lvl = parseInt(c.livello) || 1;
        const disabled = lvl >= 20;
        return `<button class="levelup-pick-row${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : ''} data-idx="${i}">
            <span class="levelup-pick-name">${escapeHtml(c.nome)}</span>
            <span class="levelup-pick-arrow">${lvl} → ${disabled ? lvl : lvl + 1}</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Level Up</h3>
        <p class="levelup-sub">Quale classe vuoi aumentare di livello?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-multiclass" id="luMulticlassBtn">
            <span class="levelup-pick-name">+ Multiclasse</span>
            <span class="levelup-pick-arrow">aggiungi nuova classe</span>
        </button>
    </div>`;
    overlay.querySelectorAll('.levelup-pick-row[data-idx]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            overlay.remove();
            _showLevelUpHpChoice(pgId, idx);
        };
    });
    overlay.querySelector('#luMulticlassBtn').onclick = () => {
        overlay.remove();
        _showMulticlassPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showMulticlassPicker(pgId, classi) {
    const owned = new Set(classi.map(c => c.nome));
    const all = Object.keys(CLASS_HIT_DIE).sort((a, b) => a.localeCompare(b));
    const available = all.filter(n => !owned.has(n));

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    if (available.length === 0) {
        overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="levelup-title">Multiclasse</h3>
            <p class="levelup-sub">Hai gia' tutte le classi disponibili.</p>
            <div class="levelup-pf-actions">
                <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
                <button type="button" class="levelup-pf-confirm" onclick="this.closest('.hp-calc-overlay').remove();_showLevelUpPicker('${pgId}', ${JSON.stringify(classi).replace(/'/g, '&#39;')});">Indietro</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        return;
    }

    const rows = available.map(nome => {
        const die = CLASS_HIT_DIE[nome] || 8;
        return `<button class="levelup-pick-row" data-nome="${escapeHtml(nome)}">
            <span class="levelup-pick-name">${escapeHtml(nome)}</span>
            <span class="levelup-pick-arrow">d${die} · liv 1</span>
        </button>`;
    }).join('');

    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Multiclasse</h3>
        <p class="levelup-sub">Quale classe vuoi aggiungere al livello 1?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-back" id="luBackBtn">
            <span class="levelup-pick-name">← Indietro</span>
            <span class="levelup-pick-arrow">scegli classe esistente</span>
        </button>
    </div>`;

    overlay.querySelectorAll('.levelup-pick-row[data-nome]').forEach(btn => {
        btn.onclick = () => {
            const nome = btn.dataset.nome;
            overlay.remove();
            _showLevelUpHpChoice(pgId, -1, { newClassName: nome });
        };
    });
    overlay.querySelector('#luBackBtn').onclick = () => {
        overlay.remove();
        _showLevelUpPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showLevelUpHpChoice(pgId, classIdx, opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const isNewClass = !!opts.newClassName;
    const cls = isNewClass
        ? { nome: opts.newClassName, livello: 0 }
        : (pg.classi || [])[classIdx];
    if (!cls) return;

    const die = CLASS_HIT_DIE[cls.nome] || 8;
    const conMod = Math.floor((((pg.costituzione) || 10) - 10) / 2);
    const avgGain = Math.max(1, dieAvg(die) + conMod);
    const conSign = conMod >= 0 ? '+' : '';
    const conLabel = `${conSign}${conMod}`;
    const newLvl = (parseInt(cls.livello) || 0) + 1;

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal levelup-pf-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Punti Ferita</h3>
        <p class="levelup-sub">${escapeHtml(cls.nome)}: Liv ${cls.livello || 1} → ${newLvl}<br><small>Dado: 1d${die} · COS ${conLabel}</small></p>
        <button type="button" class="levelup-pf-avg-btn" id="lupfAvgBtn">Tiro medio (+${avgGain})</button>
        <div class="levelup-pf-roll-row">
            <input type="number" class="levelup-pf-input" id="lupfInput" placeholder="—" min="1" inputmode="numeric">
            <button type="button" class="levelup-pf-roll-btn" id="lupfRollBtn">Tira il dado</button>
        </div>
        <div class="levelup-pf-detail" id="lupfDetail"></div>
        <div class="levelup-pf-actions">
            <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button type="button" class="levelup-pf-confirm" id="lupfConfirmBtn" disabled>Conferma</button>
        </div>
    </div>`;

    const input = overlay.querySelector('#lupfInput');
    const detail = overlay.querySelector('#lupfDetail');
    const avgBtn = overlay.querySelector('#lupfAvgBtn');
    const rollBtn = overlay.querySelector('#lupfRollBtn');
    const confirmBtn = overlay.querySelector('#lupfConfirmBtn');

    const refreshConfirm = () => {
        const v = parseInt(input.value);
        confirmBtn.disabled = !(Number.isFinite(v) && v >= 1);
    };

    avgBtn.onclick = () => {
        input.value = avgGain;
        detail.textContent = `Tiro medio: ${dieAvg(die)} ${conLabel} COS = ${avgGain} PV`;
        refreshConfirm();
    };
    rollBtn.onclick = () => {
        const roll = 1 + Math.floor(Math.random() * die);
        const total = Math.max(1, roll + conMod);
        input.value = total;
        detail.textContent = `1d${die} = ${roll} ${conLabel} COS = ${total} PV`;
        refreshConfirm();
    };
    input.addEventListener('input', () => {
        // Se l'utente edita a mano, rimuovi il dettaglio (non corrisponde piu' al calcolo automatico).
        if (detail.textContent && !detail.dataset.locked) detail.textContent = '';
        refreshConfirm();
    });
    confirmBtn.onclick = async () => {
        const pvGain = parseInt(input.value);
        if (!Number.isFinite(pvGain) || pvGain < 1) return;
        const extra = detail.textContent ? ` (${detail.textContent})` : '';
        overlay.remove();
        await _doLevelUp(pgId, classIdx, pvGain, extra, opts);
    };

    document.body.appendChild(overlay);
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

async function _doLevelUp(pgId, classIdx, pvGain, extraMsg = '', opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const classi = (pg.classi || []).map(c => ({ ...c }));

    let cls;
    let isNewClass = false;
    if (opts && opts.newClassName) {
        // Multiclasse: aggiungo la nuova classe a livello 0 (verra' portata a 1 sotto).
        if (classi.some(c => c.nome === opts.newClassName)) {
            showNotification(`${opts.newClassName} e' gia' una classe del personaggio`);
            return;
        }
        cls = { nome: opts.newClassName, livello: 0 };
        classi.push(cls);
        classIdx = classi.length - 1;
        isNewClass = true;
    } else {
        cls = classi[classIdx];
        if (!cls) return;
    }

    const newLvl = (parseInt(cls.livello) || 0) + 1;
    if (newLvl > 20) { showNotification('Livello massimo raggiunto (20)'); return; }
    cls.livello = newLvl;
    classi[classIdx] = cls;

    const oldPvMax = parseInt(pg.punti_vita_max) || 0;
    const newPvMax = oldPvMax + pvGain;
    const newPvAttuali = (pg.pv_attuali != null ? parseInt(pg.pv_attuali) : oldPvMax) + pvGain;

    // Anche il "Max Reale" cresce del valore registrato al level-up.
    // Se non era ancora stato impostato esplicitamente, viene
    // inizializzato al valore corrente prima del level-up + pvGain
    // (così non assorbe variazioni manuali sul punti_vita_max).
    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    const storedReale = parseInt(bm._pv_max_reale);
    const baseReale = (Number.isFinite(storedReale) && storedReale > 0) ? storedReale : oldPvMax;
    bm._pv_max_reale = Math.max(1, baseReale + pvGain);
    pg.bonus_manuali = bm;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    const currentDadi = dadi[cls.nome] != null ? parseInt(dadi[cls.nome]) : (newLvl - 1);
    dadi[cls.nome] = Math.min(newLvl, currentDadi + 1);

    const totalLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);

    // Ricalcola gli slot incantesimo in base al nuovo livello, preservando "used".
    const newAutoSlots = calcSpellSlotsFromClassi(classi);
    const prevSlots = (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') ? pg.slot_incantesimo : {};
    const newSlotIncantesimo = {};
    Object.keys(newAutoSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = newAutoSlots[lvKey];
        const prev = prevSlots[lv] || prevSlots[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used)) ? Math.min(parseInt(prev.used), max) : 0;
        newSlotIncantesimo[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
    });

    // Aggiorna anche il display "classe" per coerenza con la stringa multiclasse.
    const classeDisplay = classi.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const updates = {
        classi,
        classe: classeDisplay,
        livello: totalLevel,
        punti_vita_max: newPvMax,
        pv_attuali: newPvAttuali,
        dadi_vita_disponibili: dadi,
        slot_incantesimo: newSlotIncantesimo,
        bonus_manuali: pg.bonus_manuali,
    };

    pg.classi = classi;
    pg.classe = classeDisplay;
    pg.livello = totalLevel;
    pg.punti_vita_max = newPvMax;
    pg.pv_attuali = newPvAttuali;
    pg.dadi_vita_disponibili = dadi;
    pg.slot_incantesimo = newSlotIncantesimo;

    await schedaInstantSave(pgId, updates);
    if (isNewClass) {
        showNotification(`Aggiunto ${cls.nome} (multiclasse, liv 1) +${pvGain} PV${extraMsg}`);
    } else {
        showNotification(`${cls.nome} salito al livello ${newLvl} (+${pvGain} PV${extraMsg})`);
    }
    renderSchedaPersonaggio(pgId);
}

window.schedaHdChange = function(pgId, className, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let newVal = current + delta;
    if (newVal < 0) newVal = 0;
    if (max != null && newVal > max) newVal = max;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    dadi[className] = newVal;
    pg.dadi_vita_disponibili = dadi;

    const el = document.getElementById(`sHd_${className}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { dadi_vita_disponibili: dadi });
}

window.schedaClassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, max != null ? Math.min(max, current + delta) : current + delta);
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    pg.risorse_classe[key] = newVal;

    const el = document.getElementById(`sCRes_${key}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

// Cambio current per le risorse di sottoclasse (counter / dice_pool / ward_pool).
// Persistite in pg.risorse_classe._subclass[key].
window.schedaSubclassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._subclass) pg.risorse_classe._subclass = {};
    pg.risorse_classe._subclass[key] = newVal;
    const el = document.getElementById(`sSubRes_${key}`);
    if (el) {
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

// Click su uno slot Portento: se vuoto chiede il valore (1-20),
// se pieno offre di "spendere" (svuotare) il dado salvato.
window.schedaPortentSlotClick = async function(pgId, key, idx, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    const cur = arr[idx];
    if (cur != null && cur >= 1 && cur <= 20) {
        // Pieno → conferma "spendi" con dialog custom (no browser confirm).
        const ok = await _schedaShowConfirmDialog({
            title: 'Spendere il Portento?',
            message: `Vuoi spendere il dado salvato con valore ${cur}?`,
            confirmLabel: 'Spendi',
            cancelLabel: 'Annulla',
            danger: true,
        });
        if (ok) {
            arr[idx] = null;
            await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
            openSchedaPersonaggio(pgId);
        }
    } else {
        // Vuoto → input valore (tastierino numerico custom, niente keyboard nativa).
        const n = await _schedaShowNumpadDialog({
            title: `Portento - Slot ${idx + 1}`,
            initial: '',
            min: 1,
            max: 20,
        });
        if (n == null) return;
        arr[idx] = n;
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        openSchedaPersonaggio(pgId);
    }
};

// Tira tutti gli slot Portento ancora vuoti (utile al riposo lungo).
window.schedaPortentRollAll = async function(pgId, key, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    for (let i = 0; i < max; i++) {
        if (arr[i] == null) arr[i] = 1 + Math.floor(Math.random() * 20);
    }
    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    openSchedaPersonaggio(pgId);
};

// Apre l'editor per una risorsa di classe (auto-derivata): permette di
// sovrascrivere il nome e il valore massimo. Gli override sono
// memorizzati in pg.risorse_classe._overrides[key] e applicati al
// rendering. "Reset" li rimuove riportando i valori di default.
window.schedaOpenEditClassRes = function(pgId, key, defaultName, defaultMax) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const overrides = (pg.risorse_classe && pg.risorse_classe._overrides && pg.risorse_classe._overrides[key]) || {};
    const curNome = overrides.nome || defaultName || '';
    const curMax = (typeof overrides.max === 'number' && overrides.max > 0) ? overrides.max : defaultMax;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Modifica risorsa</h3>
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Nome (opzionale)</label>
        <input type="text" id="schedaCResNome" class="hp-calc-input" value="${escapeHtml(curNome)}" placeholder="${escapeHtml(defaultName || '')}">
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Massimo</label>
        <input type="number" id="schedaCResMax" class="hp-calc-input" value="${curMax}" min="1" max="99">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">Default: ${escapeHtml(defaultName || '')} / ${defaultMax}</div>
        <div class="dialog-actions">
            <button class="btn-secondary" id="schedaCResReset" style="background:#a55;color:#fff;border-color:#a55;">Reset</button>
            <button class="btn-secondary" id="schedaCResCancel">Annulla</button>
            <button class="btn-primary" id="schedaCResSave">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('schedaCResCancel').onclick = close;
    document.getElementById('schedaCResReset').onclick = async () => {
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        delete pg.risorse_classe._overrides[key];
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    document.getElementById('schedaCResSave').onclick = async () => {
        const nome = (document.getElementById('schedaCResNome').value || '').trim();
        const maxRaw = parseInt(document.getElementById('schedaCResMax').value, 10);
        const maxVal = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        const ov = {};
        if (nome && nome !== defaultName) ov.nome = nome;
        if (maxVal && maxVal !== defaultMax) ov.max = maxVal;
        if (Object.keys(ov).length === 0) {
            delete pg.risorse_classe._overrides[key];
        } else {
            pg.risorse_classe._overrides[key] = ov;
        }
        // Se il max e' cambiato, clamp del current
        if (maxVal && pg.risorse_classe[key] != null && pg.risorse_classe[key] > maxVal) {
            pg.risorse_classe[key] = maxVal;
        }
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
};

window.schedaRaceResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._race) pg.risorse_classe._race = {};
    pg.risorse_classe._race[key] = newVal;
    const el = document.getElementById(`sRRes_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInnateSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._innate) pg.risorse_classe._innate = {};
    pg.risorse_classe._innate[key] = newVal;
    const el = document.getElementById(`sInnSlot_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInvocationSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._invocations) pg.risorse_classe._invocations = {};
    pg.risorse_classe._invocations[key] = newVal;
    // Lo stesso slot puo' essere mostrato sia in pagina incantesimi
    // (sInvSlot_) sia nelle risorse di pagina 1 (sInvRes_): aggiorniamo
    // entrambe le viste.
    [`sInvSlot_${key}`, `sInvRes_${key}`].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    });
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaCustomResChange = function(pgId, index, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];
    const cr = pg.risorse_classe._custom[index];
    if (!cr) return;
    cr.current = newVal;

    const el = document.getElementById(`sCusRes_${index}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},1,${max})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

window.schedaOpenAddCustomRes = function(pgId, editIndex) {
    // editIndex opzionale: se passato, modifica una risorsa custom esistente
    const pg = _schedaPgCache;
    const editing = (editIndex != null && editIndex >= 0);
    const existing = editing ? (pg?.risorse_classe?._custom?.[editIndex] || null) : null;

    const initialType = (existing && existing.tipo === 'dadi') ? 'dadi' : 'punti';
    const initialDado = (existing && existing.dado) ? existing.dado : 'd8';
    const initialNome = existing ? (existing.nome || '') : '';
    const initialMax  = existing && Number.isFinite(parseInt(existing.max)) ? parseInt(existing.max) : 1;

    const dadiBtns = ['d4','d6','d8','d10','d12','d20'].map(d =>
        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === initialDado ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
    ).join('');

    const confirmFn = editing
        ? `schedaConfirmCustomRes('${pgId}', ${editIndex})`
        : `schedaConfirmCustomRes('${pgId}')`;
    const deleteBtn = editing
        ? `<button type="button" class="btn-danger" onclick="schedaDeleteCustomResFromEdit('${pgId}',${editIndex})">Elimina</button>`
        : '';

    const modalHtml = `
    <div class="modal active" id="customResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="schedaCloseCustomResModal()">&times;</button>
            <h2>${editing ? 'Modifica Risorsa' : 'Aggiungi Risorsa'}</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="customResNome" class="form-input" placeholder="Es. Dadi di Superiorità" value="${escapeHtml(initialNome)}">
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
                <input type="number" id="customResMax" class="form-input" min="1" value="${initialMax}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>${deleteBtn}</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary" onclick="schedaCloseCustomResModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="${confirmFn}">${editing ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = initialType;
    window._crDado = initialDado;
}

window.schedaCrTypeSelect = function(tipo) {
    window._crType = tipo;
    document.getElementById('crTypePunti')?.classList.toggle('active', tipo === 'punti');
    document.getElementById('crTypeDadi')?.classList.toggle('active', tipo === 'dadi');
    document.getElementById('crDadoGroup').style.display = tipo === 'dadi' ? '' : 'none';
}

window.schedaCrDadoSelect = function(dado) {
    window._crDado = dado;
    document.querySelectorAll('.custom-res-dice-btn').forEach(b => b.classList.toggle('active', b.textContent === dado));
}

window.schedaConfirmCustomRes = async function(pgId, editIndex) {
    const nome = document.getElementById('customResNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('customResMax')?.value) || 1;
    const tipo = window._crType || 'punti';

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];

    const editing = (editIndex != null && editIndex >= 0 && pg.risorse_classe._custom[editIndex]);
    if (editing) {
        // Modifica preservando il "current" (clampato al nuovo max).
        const prev = pg.risorse_classe._custom[editIndex];
        const prevCurrent = Number.isFinite(parseInt(prev.current)) ? parseInt(prev.current) : max;
        const updated = { nome, tipo, max, current: Math.max(0, Math.min(prevCurrent, max)) };
        if (tipo === 'dadi') updated.dado = window._crDado || 'd8';
        pg.risorse_classe._custom[editIndex] = updated;
    } else {
        const newRes = { nome, tipo, max, current: max };
        if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';
        pg.risorse_classe._custom.push(newRes);
    }

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    schedaCloseCustomResModal();

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification(editing ? 'Risorsa aggiornata' : 'Risorsa aggiunta');
}

window.schedaDeleteCustomResFromEdit = async function(pgId, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare risorsa?',
        message: 'La risorsa verra\' eliminata definitivamente.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    schedaCloseCustomResModal();
    await schedaDeleteCustomRes(pgId, index);
};

window.schedaDeleteCustomRes = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.risorse_classe?._custom) return;
    pg.risorse_classe._custom.splice(index, 1);

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification('Risorsa rimossa');
}

window.schedaCloseCustomResModal = function() {
    const modal = document.getElementById('customResModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// =====================================================
// EQUIPAGGIAMENTO
// =====================================================
async function _recalcEquipFromStats(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const equip = Array.isArray(pg.equipaggiamento) ? pg.equipaggiamento : [];
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    let equipChanged = false;
    equip.forEach(e => {
        if (e.tipo === 'arma') {
            const armaRef = DND_ARMI.find(a => a.nome === e.nome);
            const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
            const isRanged = armaRef ? armaRef.cat.includes('distanza') : e.proprieta?.some(p => p.includes('Munizioni'));
            const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
            const magic = e.magic_bonus || 0;
            const newColpire = profBonus + atkMod + magic;
            const newDanno = atkMod + magic;
            if (e.bonus_colpire !== newColpire || e.bonus_danno !== newDanno) {
                e.bonus_colpire = newColpire;
                e.bonus_danno = newDanno;
                equipChanged = true;
            }
        }
    });
    const newCA = calcCAFromEquip(pg);
    const caChanged = pg.classe_armatura !== newCA;
    if (caChanged) {
        pg.classe_armatura = newCA;
        const caEl = document.getElementById('schedaCA');
        if (caEl) caEl.textContent = newCA;
    }
    if (equipChanged || caChanged) {
        const updates = { classe_armatura: pg.classe_armatura };
        if (equipChanged) updates.equipaggiamento = pg.equipaggiamento;
        await schedaInstantSave(pgId, updates);
        if (equipChanged) renderSchedaPersonaggio(pgId);
    }
}

function formatEquipName(e) {
    const magic = e.magic_bonus ? ` +${e.magic_bonus}` : '';
    return escapeHtml(e.nome) + magic;
}

function buildEquipSection(pg) {
    const equip = pg.equipaggiamento || [];
    const armiRows = equip.filter(e => e.tipo === 'arma').map((e, i) => {
        const idx = equip.indexOf(e);
        const bonus = e.bonus_colpire != null ? (e.bonus_colpire >= 0 ? `+${e.bonus_colpire}` : e.bonus_colpire) : '-';
        const dmgBonus = e.bonus_danno || 0;
        const dannoStr = e.danni ? `${e.danni}${dmgBonus !== 0 ? (dmgBonus > 0 ? '+' + dmgBonus : dmgBonus) : ''}` : '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${bonus}</td>
            <td class="text-center">${dannoStr} ${e.tipo_danno ? escapeHtml(e.tipo_danno.slice(0,3)) + '.' : ''}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const armaturaItems = equip.filter(e => e.tipo === 'armatura' || e.tipo === 'scudo');
    const armaturaRows = armaturaItems.map(e => {
        const idx = equip.indexOf(e);
        const totalCA = (e.ca_base || 0) + (e.magic_bonus || 0);
        const magicStr = e.magic_bonus ? ` (+${e.magic_bonus})` : '';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${totalCA}${magicStr}</td>
            <td class="text-center">${e.categoria || '-'}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const FOCUS_LABELS_SHORT = {
        'arcano': 'Arcano',
        'druidico': 'Druidico',
        'sacro': 'Sacro',
        'componenti': 'Componenti',
        'altro': 'Altro',
    };
    const focusItems = equip.filter(e => e.tipo === 'focus');
    const focusRows = focusItems.map(e => {
        const idx = equip.indexOf(e);
        const tipoLabel = FOCUS_LABELS_SHORT[e.categoria] || '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${tipoLabel}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Equipaggiamento
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddEquip('${pg.id}')" title="Aggiungi">&#9998;</button>
        </div>
        <div class="scheda-section-body">
        ${armiRows ? `<table class="scheda-equip-table">
            <thead><tr><th>Arma</th><th>Colpire</th><th>Danno</th><th></th></tr></thead>
            <tbody>${armiRows}</tbody>
        </table>` : ''}
        ${armaturaRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Armatura</th><th>CA</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${armaturaRows}</tbody>
        </table>` : ''}
        ${focusRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Focus</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${focusRows}</tbody>
        </table>` : ''}
        ${!armiRows && !armaturaRows && !focusRows ? '<span class="scheda-empty">Nessun equipaggiamento</span>' : ''}
        </div>
    </div>`;
}

// Bonus extra inseriti manualmente dall'utente (oggetti che non sono armatura/scudo,
// privilegi non auto-applicati, ecc.). Sempre normalizzato per evitare null-checks.
//
// Nuovo schema (lista di bonus singoli):
//   { ca: [{nome, valore}, ...],
//     incantatori: { "Mago": { atk: [...], dc: [...] }, ... },
//     spells_prepared_max: 0 }
//
// Schema legacy (numero singolo): viene migrato al volo a un'unica entry
// con nome "Manuale".
function _normalizeBonusList(v) {
    if (Array.isArray(v)) {
        return v
            .map(b => ({
                nome: String(b?.nome ?? '').trim().slice(0, 80) || 'Manuale',
                valore: parseInt(b?.valore) || 0,
            }))
            .filter(b => b.valore !== 0);
    }
    const n = parseInt(v) || 0;
    if (n) return [{ nome: 'Manuale', valore: n }];
    return [];
}

function _sumBonusList(arr) {
    return (arr || []).reduce((s, b) => s + (parseInt(b.valore) || 0), 0);
}

function _getBonusManuali(pg) {
    const bm = (pg && typeof pg.bonus_manuali === 'object' && pg.bonus_manuali) ? pg.bonus_manuali : {};
    const incRaw = (bm.incantatori && typeof bm.incantatori === 'object') ? bm.incantatori : {};
    const inc = {};
    for (const cn of Object.keys(incRaw)) {
        const e = incRaw[cn] || {};
        inc[cn] = {
            atk: _normalizeBonusList(e.atk),
            dc: _normalizeBonusList(e.dc),
        };
    }
    const tsRaw = (bm.tiri_salvezza && typeof bm.tiri_salvezza === 'object') ? bm.tiri_salvezza : {};
    const ts = {};
    for (const ab of Object.keys(tsRaw)) {
        ts[ab] = _normalizeBonusList(tsRaw[ab]);
    }
    return {
        ca: _normalizeBonusList(bm.ca),
        incantatori: inc,
        tiri_salvezza: ts,
        spells_prepared_max: parseInt(bm.spells_prepared_max) || 0,
    };
}

function _getCasterBonusFor(pg, classeNome) {
    const inc = _getBonusManuali(pg).incantatori;
    const e = inc[classeNome] || { atk: [], dc: [] };
    return { atk: _sumBonusList(e.atk), dc: _sumBonusList(e.dc) };
}

function _getSaveBonusFor(pg, abilityKey) {
    const ts = _getBonusManuali(pg).tiri_salvezza;
    return _sumBonusList(ts[abilityKey] || []) + _sumBonusList(ts._all || []);
}

// Confeziona l'oggetto da salvare a partire da una versione normalizzata di
// bonus_manuali, preservando spells_prepared_max e altre chiavi future.
function _buildBonusManualiPayload(parsed) {
    return {
        ca: parsed.ca || [],
        incantatori: parsed.incantatori || {},
        tiri_salvezza: parsed.tiri_salvezza || {},
        spells_prepared_max: parsed.spells_prepared_max || 0,
    };
}

function calcCAFromEquip(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    let ca;
    if (armor) {
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            ca = armor.ca_base + desBonus;
        } else {
            ca = armor.ca_base;
        }
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            ca = 10 + desMod + calcMod(pg.costituzione || 10);
        } else if (classNames.includes('Monaco')) {
            ca = 10 + desMod + calcMod(pg.saggezza || 10);
        } else {
            ca = 10 + desMod;
        }
    }
    if (armor?.magic_bonus) ca += armor.magic_bonus;
    if (shield) ca += shield.ca_base + (shield.magic_bonus || 0);
    ca += _sumBonusList(_getBonusManuali(pg).ca);
    return ca;
}

function _caModStr(val, statLabel) {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val} <span class="ca-stat-label">(${statLabel})</span>`;
}

function getCABreakdown(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    const lines = [];
    if (armor) {
        const magic = armor.magic_bonus ? ` +${armor.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        let desc = `${escapeHtml(armor.nome)}: ${armor.ca_base}`;
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            const maxNote = armor.max_des < 99 ? ` max ${armor.max_des}` : '';
            desc += ` ${_caModStr(desBonus, 'des' + maxNote)}`;
        }
        desc += magic;
        lines.push(desc);
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            const cosMod = calcMod(pg.costituzione || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(cosMod, 'cos')}`);
        } else if (classNames.includes('Monaco')) {
            const sagMod = calcMod(pg.saggezza || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(sagMod, 'sag')}`);
        } else {
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')}`);
        }
    }
    if (shield) {
        const shieldMagic = shield.magic_bonus ? ` +${shield.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        lines.push(`${escapeHtml(shield.nome)}: +${shield.ca_base}${shieldMagic}`);
    }
    const extras = _getBonusManuali(pg).ca;
    extras.forEach(b => {
        const sign = b.valore >= 0 ? '+' : '';
        lines.push(`${escapeHtml(b.nome)}: ${sign}${b.valore} <span class="ca-stat-label">(manuale)</span>`);
    });
    return lines;
}

// =====================================================
// BONUS MANUALI: CA e Statistiche Incantatore
// =====================================================
// =====================================================
// MODAL: lista editabile di bonus manuali (riusabile)
// =====================================================
// La dialog principale (CA / Save / Caster) mostra solo CHIP cliccabili.
// L'add/edit di un singolo bonus avviene in una dialog secondaria
// sovrapposta che modifica direttamente lo stato condiviso e fa re-render.
let _bonusListState = null;
let _bonusEditState = null;

// Sostituite dal nuovo flusso a chip; mantenute come stub vuoti per
// retro-compatibilita' con eventuali handler inline (no-op).
function _bonusListSyncFromInputs() {}
function _bonusGroupSyncFromInputs() {}

function _bonusChipHtml(b, onClickCall, opts = {}) {
    const v = parseInt(b.valore) || 0;
    const sign = v >= 0 ? '+' : '';
    const cls = ['bonus-chip'];
    if (v < 0) cls.push('negative');
    if (opts.global) cls.push('is-global');
    const tagHtml = opts.tag ? `<span class="bonus-chip-tag">${escapeHtml(opts.tag)}</span>` : '';
    const safeOnClick = onClickCall.replace(/"/g, '&quot;');
    return `<button type="button" class="${cls.join(' ')}" onclick="${safeOnClick}" title="Modifica bonus">
        <span class="bonus-chip-name">${escapeHtml(b.nome || 'Manuale')}</span>
        <span class="bonus-chip-val">${sign}${v}</span>
        ${tagHtml}
    </button>`;
}

function _bonusListRender() {
    if (!_bonusListState) return;
    const container = document.getElementById('bonusListContainer');
    if (!container) return;

    let html = '';
    let tot = 0;
    if (_bonusListState.kind === 'ca') {
        const items = _bonusListState.items;
        tot = _sumBonusList(items);
        html = items.length
            ? items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCA(${i})`)).join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    } else if (_bonusListState.kind === 'save') {
        const local = _bonusListState.items;
        const global = _bonusListState.globalItems;
        tot = _sumBonusList(local) + _sumBonusList(global);
        const localChips = local.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'single')`));
        const globalChips = global.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'all')`, { global: true, tag: 'A tutti i TS' }));
        const all = [...localChips, ...globalChips];
        html = all.length
            ? all.join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    }
    container.innerHTML = html;

    const totEl = document.getElementById('bonusListTotal');
    if (totEl) totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
}

window.schedaBonusListAdd = function() {
    if (!_bonusListState) return;
    if (_bonusListState.kind === 'ca') _bonusEditOpen({ parentKind: 'ca', isNew: true });
    else if (_bonusListState.kind === 'save') _bonusEditOpen({ parentKind: 'save', isNew: true, scope: 'single' });
};

window.schedaBonusEditCA = function(idx) {
    if (!_bonusListState?.items?.[idx]) return;
    _bonusEditOpen({ parentKind: 'ca', isNew: false, itemIdx: idx, item: { ..._bonusListState.items[idx] } });
};

window.schedaBonusEditSave = function(idx, scope) {
    if (!_bonusListState) return;
    const arr = scope === 'all' ? _bonusListState.globalItems : _bonusListState.items;
    if (!arr?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'save',
        isNew: false,
        itemIdx: idx,
        scope,
        originalScope: scope,
        item: { ...arr[idx] },
    });
};

window.schedaBonusEditCaster = function(gi, idx) {
    if (!_bonusListState?.groups?.[gi]?.items?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'caster',
        isNew: false,
        groupIdx: gi,
        itemIdx: idx,
        item: { ..._bonusListState.groups[gi].items[idx] },
    });
};

// =====================================================
// MODAL secondaria: editor di un singolo bonus
// =====================================================
function _bonusEditOpen(state) {
    _bonusEditState = {
        item: { nome: '', valore: 1 },
        ...state,
    };
    if (!_bonusEditState.item.nome && !_bonusEditState.item.valore) {
        _bonusEditState.item = { nome: '', valore: 1 };
    }
    _bonusEditRender();
}

function _bonusEditRender() {
    const existing = document.getElementById('bonusEditOverlay');
    if (existing) existing.remove();
    if (!_bonusEditState) return;

    const e = _bonusEditState;
    const title = e.isNew ? 'Aggiungi bonus' : 'Modifica bonus';

    let scopeHtml = '';
    if (e.parentKind === 'save') {
        const abilityLabel = _ABILITY_LABELS[_bonusListState?.abilityKey] || _bonusListState?.abilityKey || '';
        const scope = e.scope || 'single';
        scopeHtml = `
        <div class="bonus-edit-field">
            <label>Applica a</label>
            <div class="bonus-edit-scope">
                <label class="bonus-edit-scope-opt ${scope==='single'?'selected':''}">
                    <input type="radio" name="bonusScope" value="single" ${scope==='single'?'checked':''} onchange="schedaBonusEditorSetScope('single')">
                    <span>Solo TS ${escapeHtml(abilityLabel)}</span>
                </label>
                <label class="bonus-edit-scope-opt ${scope==='all'?'selected':''}">
                    <input type="radio" name="bonusScope" value="all" ${scope==='all'?'checked':''} onchange="schedaBonusEditorSetScope('all')">
                    <span>Tutti i TS</span>
                </label>
            </div>
        </div>`;
    }

    const deleteBtn = e.isNew ? '' : '<button class="hp-calc-btn dmg" onclick="schedaBonusEditorDelete()">Elimina</button>';
    const v = parseInt(e.item.valore) || 0;
    const placeholderName = e.parentKind === 'caster' ? 'Es. Bastone del Potere'
        : e.parentKind === 'save' ? 'Es. Mantello della Protezione'
        : 'Es. Anello di Protezione';

    const overlay = document.createElement('div');
    overlay.id = 'bonusEditOverlay';
    overlay.className = 'hp-calc-overlay bonus-edit-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-edit-modal">
            <button class="hp-calc-close" onclick="schedaBonusEditorClose()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-edit-field">
                <label>Nome</label>
                <input type="text" id="bonusEditName" value="${escapeHtml(e.item.nome)}" placeholder="${placeholderName}" maxlength="80">
            </div>
            <div class="bonus-edit-field">
                <label>Valore</label>
                <div class="bonus-edit-val-row">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(-1)">−</button>
                    <input type="number" id="bonusEditValue" value="${v}" step="1">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(1)">+</button>
                </div>
            </div>
            ${scopeHtml}
            <div class="hp-calc-buttons bonus-edit-buttons">
                ${deleteBtn}
                <button class="hp-calc-btn heal" onclick="schedaBonusEditorSave()">Salva</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('bonusEditName')?.focus(), 50);
}

window.schedaBonusEditorSetScope = function(scope) {
    if (!_bonusEditState) return;
    _bonusEditState.scope = scope;
    // Aggiorna le classi visive senza ricostruire l'intera modal.
    document.querySelectorAll('#bonusEditOverlay .bonus-edit-scope-opt').forEach(el => {
        const inp = el.querySelector('input');
        el.classList.toggle('selected', inp?.value === scope);
    });
};

window.schedaBonusEditorStep = function(delta) {
    const inp = document.getElementById('bonusEditValue');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = cur + delta;
};

window.schedaBonusEditorClose = function() {
    const o = document.getElementById('bonusEditOverlay');
    if (o) o.remove();
    _bonusEditState = null;
};

window.schedaBonusEditorSave = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const nameEl = document.getElementById('bonusEditName');
    const valEl = document.getElementById('bonusEditValue');
    const nome = (nameEl?.value || '').trim().slice(0, 80) || 'Manuale';
    const valore = parseInt(valEl?.value) || 0;

    if (valore === 0) {
        showNotification('Inserisci un valore diverso da 0');
        return;
    }

    const e = _bonusEditState;
    const newItem = { nome, valore };

    if (e.parentKind === 'ca') {
        if (e.isNew) _bonusListState.items.push(newItem);
        else _bonusListState.items[e.itemIdx] = newItem;
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const newScope = e.scope || 'single';
        const newArrName = newScope === 'all' ? 'globalItems' : 'items';
        if (e.isNew) {
            _bonusListState[newArrName].push(newItem);
        } else {
            const origScope = e.originalScope || newScope;
            const origArrName = origScope === 'all' ? 'globalItems' : 'items';
            if (origArrName === newArrName) {
                _bonusListState[newArrName][e.itemIdx] = newItem;
            } else {
                _bonusListState[origArrName].splice(e.itemIdx, 1);
                _bonusListState[newArrName].push(newItem);
            }
        }
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (!g) return;
        if (e.isNew) g.items.push(newItem);
        else g.items[e.itemIdx] = newItem;
        _bonusGroupRender(e.groupIdx);
    }

    schedaBonusEditorClose();
};

window.schedaBonusEditorDelete = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const e = _bonusEditState;
    if (e.isNew) { schedaBonusEditorClose(); return; }

    if (e.parentKind === 'ca') {
        _bonusListState.items.splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const origArrName = (e.originalScope || e.scope) === 'all' ? 'globalItems' : 'items';
        _bonusListState[origArrName].splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (g) g.items.splice(e.itemIdx, 1);
        _bonusGroupRender(e.groupIdx);
    }
    schedaBonusEditorClose();
};

// =====================================================
// MODAL CA
// =====================================================
window.schedaOpenCABonus = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const lines = getCABreakdown(pg);
    const breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    const totalCA = pg.classe_armatura || 10;

    _bonusListState = { kind: 'ca', pgId, items: bm.ca.map(b => ({ ...b })) };

    // Pulsante Armatura Magica: visibile solo se conosciuto/preparato e
    // il PG NON indossa armatura (la cui presenza la disattiverebbe).
    const armorEquipped = (pg.equipaggiamento || []).some(e => e.tipo === 'armatura');
    const knowsMageArmor = _pgKnowsSpellByName(pg, 'Armatura Magica', 'Mage Armor');
    const alreadyApplied = _bonusListState.items.some(b => /armatura\s*magica/i.test(b.nome || ''));
    const desMod = Math.floor(((pg.destrezza || 10) - 10) / 2);
    let mageArmorBtn = '';
    if (knowsMageArmor && !armorEquipped && !alreadyApplied) {
        mageArmorBtn = `<button type="button" class="bonus-quick-btn small" onclick="schedaApplyMageArmor()" title="Aggiunge un bonus +3 (Armatura Magica = 13 + Des)">
            ✦ Applica Armatura Magica (CA ${13 + desMod})
        </button>`;
    } else if (knowsMageArmor && armorEquipped) {
        mageArmorBtn = `<div class="bonus-modal-hint" style="color:#d29c2a;">Armatura Magica disponibile ma stai indossando un'armatura: rimuovila per applicarla.</div>`;
    }

    const existing = document.getElementById('caBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'caBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseCABonus()">&times;</button>
            <div class="hp-calc-title">Classe Armatura</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current">${totalCA}</span></div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                ${mageArmorBtn}
                <div class="bonus-modal-hint">Inserisci ogni bonus separatamente: Anello di Protezione +1, Mantello del Mago Battagliero +1, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaCABonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseCABonus = function() {
    const o = document.getElementById('caBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaApplyMageArmor = function() {
    if (!_bonusListState || _bonusListState.kind !== 'ca') return;
    _bonusListSyncFromInputs();
    // Armatura Magica: CA = 13 + Des (sostituisce il 10 base senza armatura).
    // Equivalente a un bonus piatto di +3 alla CA base.
    _bonusListState.items.push({ nome: 'Armatura Magica', valore: 3 });
    _bonusListRender();
    showNotification('Armatura Magica applicata (+3)');
};

window.schedaCABonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    _bonusListSyncFromInputs();

    const cleaned = (_bonusListState?.items || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: cleaned,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;

    const caEl = document.getElementById('schedaCA');
    if (caEl) caEl.textContent = newCA;

    schedaCloseCABonus();
    await schedaInstantSave(pgId, { bonus_manuali: next, classe_armatura: newCA });
    showNotification(`CA aggiornata: ${newCA}`);
};

// =====================================================
// MODAL Bonus Tiri Salvezza
// =====================================================
const _ABILITY_LABELS = {
    forza: 'Forza',
    destrezza: 'Destrezza',
    costituzione: 'Costituzione',
    intelligenza: 'Intelligenza',
    saggezza: 'Saggezza',
    carisma: 'Carisma',
};

window.schedaOpenSaveBonus = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const items = (bm.tiri_salvezza[abilityKey] || []).map(b => ({ ...b }));
    const globalItems = (bm.tiri_salvezza._all || []).map(b => ({ ...b }));

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const mod = Math.floor((val - 10) / 2);
    const isProf = (pg.tiri_salvezza || []).includes(abilityKey);
    const profPart = isProf ? ` + comp +${bonusComp}` : '';
    const baseTot = mod + (isProf ? bonusComp : 0);
    const baseStr = baseTot >= 0 ? `+${baseTot}` : `${baseTot}`;

    _bonusListState = { kind: 'save', pgId, abilityKey, items, globalItems };

    const labelAb = _ABILITY_LABELS[abilityKey] || abilityKey;
    const headerInfo = `Base: mod ${mod >= 0 ? '+' : ''}${mod}${profPart} = <b>${baseStr}</b>`;

    const existing = document.getElementById('saveBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'saveBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSaveBonus()">&times;</button>
            <div class="hp-calc-title">Bonus TS – ${escapeHtml(labelAb)}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                <div class="bonus-modal-hint">Es. <i>Mantello della Protezione</i> +1, <i>Privilegio di classe</i> +2, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSaveBonusConfirm('${pgId}','${abilityKey}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseSaveBonus = function() {
    const o = document.getElementById('saveBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaSaveBonusConfirm = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;

    const cleanList = arr => (arr || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const cleanedLocal = cleanList(_bonusListState?.items);
    const cleanedGlobal = cleanList(_bonusListState?.globalItems);

    const bm = _getBonusManuali(pg);
    const ts = { ...(bm.tiri_salvezza || {}) };
    if (cleanedLocal.length) ts[abilityKey] = cleanedLocal;
    else delete ts[abilityKey];
    if (cleanedGlobal.length) ts._all = cleanedGlobal;
    else delete ts._all;

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: ts,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSaveBonus();

    // Aggiorna inline tutti i 6 TS (perche' i bonus globali influenzano tutti).
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    SCHEDA_ABILITIES.forEach(a => {
        const v = pg[a.key] || 10;
        const m = Math.floor((v - 10) / 2);
        const isP = (pg.tiri_salvezza || []).includes(a.key);
        const extra = _getSaveBonusFor(pg, a.key);
        const sm = m + (isP ? bonusComp : 0) + extra;
        const ss = sm >= 0 ? `+${sm}` : `${sm}`;
        const mark = extra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const el = document.getElementById(`sSave_${a.key}`);
        if (el) el.innerHTML = `${ss}${mark}`;
    });

    await schedaInstantSave(pgId, { bonus_manuali: next });
    showNotification(`TS ${labelOrKey(abilityKey)} aggiornato`);
};

function labelOrKey(k) {
    return _ABILITY_LABELS[k] || k;
}

// =====================================================
// MODAL Bonus Incantatore (Atk e DC separate)
// =====================================================
function _pgKnowsSpellByName(pg, nameIt, nameEn) {
    const list = pg?.incantesimi_conosciuti || [];
    if (!list.length) return false;
    const norm = s => String(s || '').toLowerCase();
    const targets = [norm(nameIt), norm(nameEn)].filter(Boolean);
    return list.some(n => {
        const sp = _resolveSpell(n);
        if (!sp) return targets.includes(norm(n));
        return targets.includes(norm(sp.name)) || targets.includes(norm(sp.name_en));
    });
}

function _openSpellBonusGeneric(pgId, classiArg, kind) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let classi = [];
    try { classi = JSON.parse(decodeURIComponent(classiArg)); } catch (_) { classi = []; }
    if (!Array.isArray(classi) || classi.length === 0) return;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const ability = CLASS_SPELL_ABILITY[classi[0]];
    const abilVal = pg[ability] || 10;
    const mod = Math.floor((abilVal - 10) / 2);

    const bm = _getBonusManuali(pg);
    // _bonusListState multiplo: una entry per ciascuna classe del gruppo.
    _bonusListState = {
        kind: 'caster',
        pgId,
        casterKind: kind,
        classi: [...classi],
        groups: classi.map(cn => ({
            classe: cn,
            items: ((bm.incantatori[cn] || {})[kind] || []).map(b => ({ ...b })),
        })),
    };

    const title = kind === 'atk' ? 'Bonus tiro per colpire' : 'Bonus CD incantesimi';
    const baseInfo = kind === 'atk'
        ? `Base: mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${(mod + bonusComp) >= 0 ? '+' : ''}${mod + bonusComp}</b>`
        : `Base: 8 + mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${8 + mod + bonusComp}</b>`;
    const headerInfo = `${escapeHtml(classi.join(' / '))} · Caratteristica: <b>${ability}</b><br>${baseInfo}`;

    const groupsHtml = _bonusListState.groups.map((g, gi) => `
        <div class="bonus-list-group" data-gidx="${gi}">
            <div class="bonus-list-group-head">
                <span class="bonus-list-group-name">${escapeHtml(g.classe)}</span>
                <span class="bonus-list-total-label">Tot: <span id="bonusListGroupTotal_${gi}">+0</span></span>
            </div>
            <div id="bonusListGroupContainer_${gi}" class="bonus-list-container"></div>
            <button type="button" class="bonus-list-add-btn" onclick="schedaBonusGroupAdd(${gi})">+ Aggiungi bonus</button>
        </div>
    `).join('');

    const existing = document.getElementById('spellBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'spellBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSpellCasterBonus()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            ${groupsHtml}
            <div class="bonus-modal-hint">Inserisci ogni bonus separatamente con il suo nome (es. <i>Bastone del Potere</i> +2, <i>Stella della Notte</i> +1).</div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSpellCasterBonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusGroupRenderAll();
}

window.schedaOpenSpellAtkBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'atk');
};

window.schedaOpenSpellDcBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'dc');
};

function _bonusGroupRender(gi) {
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;
    const g = _bonusListState.groups[gi];
    if (!g) return;
    const c = document.getElementById(`bonusListGroupContainer_${gi}`);
    if (!c) return;
    c.innerHTML = g.items.length
        ? g.items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCaster(${gi},${i})`)).join('')
        : '<div class="bonus-list-empty">Nessun bonus.</div>';
    const totEl = document.getElementById(`bonusListGroupTotal_${gi}`);
    if (totEl) {
        const tot = _sumBonusList(g.items);
        totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
    }
}

function _bonusGroupRenderAll() {
    if (!_bonusListState?.groups) return;
    _bonusListState.groups.forEach((_, gi) => _bonusGroupRender(gi));
}

window.schedaBonusGroupAdd = function(gi) {
    if (!_bonusListState?.groups?.[gi]) return;
    _bonusEditOpen({ parentKind: 'caster', isNew: true, groupIdx: gi });
};

window.schedaCloseSpellCasterBonus = function() {
    const o = document.getElementById('spellBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaTogglePrepared = async function(pgId, spellName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_pgUsesPreparedSystem(pg)) return;
    const sp = _resolveSpell(spellName);
    if (!sp || sp.level === 0) return;

    let list = Array.isArray(pg.incantesimi_preparati) ? [...pg.incantesimi_preparati] : [];
    const idx = list.indexOf(spellName);
    const willPrepare = idx === -1;

    if (willPrepare) {
        // Controlla il limite massimo prima di aggiungere.
        const autoMax = _calcMaxPreparedAuto(pg);
        const overrideMax = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
        const maxPrep = overrideMax > 0 ? overrideMax : autoMax;
        const currentCount = list
            .map(n => _resolveSpell(n))
            .filter(s => s && s.level > 0).length;
        if (maxPrep > 0 && currentCount >= maxPrep) {
            showNotification(`Limite raggiunto: ${currentCount}/${maxPrep} preparati`);
            return;
        }
        list.push(spellName);
    } else {
        list.splice(idx, 1);
    }

    pg.incantesimi_preparati = list;
    await schedaInstantSave(pgId, { incantesimi_preparati: list });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
};

window.schedaOpenPreparedMax = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const override = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
    const auto = _calcMaxPreparedAuto(pg);
    // Pre-compila con override se presente, altrimenti con il calcolo automatico
    // (cosi' al primo accesso l'utente vede subito il valore standard).
    const initial = override > 0 ? override : auto;

    const existing = document.getElementById('preparedMaxOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'preparedMaxOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal">
            <button class="hp-calc-close" onclick="schedaClosePreparedMax()">&times;</button>
            <div class="hp-calc-title">Incantesimi preparati</div>
            <div class="bonus-modal-info">
                Numero massimo di incantesimi che il personaggio può preparare.<br>
                <b>Calcolo automatico</b>: <span style="color:var(--accent,#6c5ce7);font-weight:700;">${auto}</span>
                ${override > 0 ? ` · <b>Manuale attuale</b>: <span style="color:var(--warning,#d29c2a);font-weight:700;">${override}</span>` : ''}
            </div>
            <div class="bonus-modal-row">
                <label class="bonus-modal-label">Massimo preparati</label>
                <div class="bonus-modal-input-row">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(-1)">−</button>
                    <input type="number" id="preparedMaxInput" class="bonus-modal-input" value="${initial}" step="1" min="0">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(1)">+</button>
                </div>
                <div class="bonus-modal-hint">Regola standard: modificatore caratteristica + livello di classe (Paladino: livello/2). Imposta 0 per tornare al calcolo automatico.</div>
            </div>
            <div class="hp-calc-buttons">
                ${override > 0 ? `<button class="btn-secondary" onclick="schedaPreparedMaxReset('${pgId}')">Ripristina auto</button>` : ''}
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaPreparedMaxConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { document.getElementById('preparedMaxInput')?.focus(); }, 50);
};

window.schedaPreparedMaxReset = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: 0,
    });
    pg.bonus_manuali = next;
    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Ripristinato calcolo automatico');
};

window.schedaClosePreparedMax = function() {
    const o = document.getElementById('preparedMaxOverlay');
    if (o) o.remove();
};

window.schedaPreparedMaxStep = function(delta) {
    const inp = document.getElementById('preparedMaxInput');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = Math.max(0, cur + delta);
};

window.schedaPreparedMaxConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const inp = document.getElementById('preparedMaxInput');
    const val = Math.max(0, parseInt(inp?.value) || 0);
    const auto = _calcMaxPreparedAuto(pg);

    const bm = _getBonusManuali(pg);
    // Se il valore inserito coincide con quello automatico, salviamo 0 per tornare
    // alla modalita' "auto" (cosi' resta agganciato al livello/caratteristica).
    const stored = (val === auto) ? 0 : val;
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: stored,
    });
    pg.bonus_manuali = next;

    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification(stored ? `Massimo preparati: ${val} (manuale)` : `Massimo preparati: ${auto} (automatico)`);
};

window.schedaSpellCasterBonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;

    _bonusGroupSyncFromInputs();

    const bm = _getBonusManuali(pg);
    const inc = {};
    // Copia tutti i dati esistenti per non perdere l'altro kind (atk vs dc).
    for (const cn of Object.keys(bm.incantatori || {})) {
        inc[cn] = {
            atk: (bm.incantatori[cn].atk || []).map(b => ({ ...b })),
            dc: (bm.incantatori[cn].dc || []).map(b => ({ ...b })),
        };
    }
    // Sovrascrive solo il kind editato per ogni classe del gruppo.
    const kind = _bonusListState.casterKind;
    _bonusListState.groups.forEach(g => {
        const cleaned = (g.items || [])
            .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
            .filter(b => b.valore !== 0);
        inc[g.classe] = inc[g.classe] || { atk: [], dc: [] };
        inc[g.classe][kind] = cleaned;
        if (!inc[g.classe].atk?.length && !inc[g.classe].dc?.length) delete inc[g.classe];
    });

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: inc,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSpellCasterBonus();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Bonus salvato');
};

window.schedaOpenAddEquip = function(pgId) {
    const ARMA_CATS = {
        'semplice_mischia': 'Armi da Mischia Semplici',
        'semplice_distanza': 'Armi a Distanza Semplici',
        'guerra_mischia': 'Armi da Mischia da Guerra',
        'guerra_distanza': 'Armi a Distanza da Guerra'
    };

    // Sezione "Dal tuo Inventario": oggetti magici/homebrew dell'inventario
    // classificati come Arma/Armatura/Scudo. Cliccandoli si avvia un
    // flusso di equip (con scelta del tipo D&D di base se ambiguo).
    const invSplit = _schedaInvWeaponsArmors(_schedaPgCache);
    const _invRowHtml = (handler, view, index) => {
        const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
        const ench = view.magic_bonus || view._homebrew_incantamento || 0;
        const rar = view._homebrew_rarita || view.rarita || '';
        const rarClass = _invRarityClass(rar);
        const subText = [sub, rar].filter(Boolean).join(' · ') || 'Oggetto magico';
        return `<div class="pg-talento-item pg-talento-item-treasure ${rarClass}" onclick="${handler}('${pgId}',${index})">
            <span class="pg-talento-name">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${ench ? ' +' + ench : ''}</span>
            <span class="option-source">${escapeHtml(subText)}</span>
        </div>`;
    };
    const tesoroArmiHtml = invSplit.armi.length
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            invSplit.armi.map(({ index, view }) => _invRowHtml('schedaAddArmaFromInventory', view, index)).join('')
        }` : '';
    const tesoroArmatureHtml = (invSplit.armature.length || invSplit.scudi.length)
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            [...invSplit.scudi, ...invSplit.armature]
                .map(({ index, view }) => _invRowHtml('schedaAddArmaturaFromInventory', view, index)).join('')
        }` : '';

    const customArmaHtml = `
        <div class="scheda-picker-cat">Creazione rapida</div>
        <div class="pg-talento-item pg-talento-item-custom" onclick="schedaOpenCustomWeaponDialog('${pgId}')">
            <span class="pg-talento-name">Arma personalizzata…</span>
            <span class="option-source">Nome, danni e proprietà a scelta</span>
        </div>`;

    const armiHtml = tesoroArmiHtml + customArmaHtml + Object.entries(ARMA_CATS).map(([cat, label]) => {
        const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArma('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">${a.danni} ${a.tipo_danno}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const ARMATURA_LABELS = {
        'leggera': 'Armature Leggere',
        'media': 'Armature Medie',
        'pesante': 'Armature Pesanti',
        'scudo': 'Scudi'
    };
    const armatureHtml = tesoroArmatureHtml + ['leggera','media','pesante','scudo'].map(cat => {
        const label = ARMATURA_LABELS[cat];
        const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArmatura('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">CA ${a.ca_base}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const FOCUS_LABELS = {
        'arcano': 'Focus Arcano',
        'druidico': 'Focus Druidico',
        'sacro': 'Simbolo Sacro',
        'componenti': 'Borsa con Componenti',
    };
    const focusCatHtml = ['arcano','druidico','sacro','componenti'].map(cat => {
        const label = FOCUS_LABELS[cat];
        const items = DND_FOCUS.filter(f => f.cat === cat).map(f =>
            `<div class="pg-talento-item" onclick="schedaAddFocus('${pgId}','${escapeHtml(f.nome)}')">
                <span class="pg-talento-name">${escapeHtml(f.nome)}</span>
                <span class="option-source">${escapeHtml(label)}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');
    // "Altro" → input libero del nome, senza dover creare un oggetto homebrew.
    const altroHtml = `
        <div class="scheda-picker-cat">Altro</div>
        <div class="pg-talento-item" onclick="schedaAddFocusAltro('${pgId}')">
            <span class="pg-talento-name">Focus Personalizzato…</span>
            <span class="option-source">Inserisci il nome (es. amuleto, bracciale)</span>
        </div>`;
    const focusHtml = focusCatHtml + altroHtml;

    const modalHtml = `
    <div class="modal active" id="equipModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2>Aggiungi Equipaggiamento</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="armi" onclick="schedaPickerSwitchTab(this,'armi')">Armi</button>
                <button type="button" class="picker-tab" data-panel="armature" onclick="schedaPickerSwitchTab(this,'armature')">Armature</button>
                <button type="button" class="picker-tab" data-panel="focus" onclick="schedaPickerSwitchTab(this,'focus')">Focus</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="armi">${armiHtml}</div>
                <div class="picker-tab-panel" data-panel="armature">${armatureHtml}</div>
                <div class="picker-tab-panel" data-panel="focus">${focusHtml}</div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaAddFocus = async function(pgId, nome) {
    const focus = DND_FOCUS.find(f => f.nome === nome);
    if (!focus) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: focus.nome,
        tipo: 'focus',
        categoria: focus.cat,
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${focus.nome} aggiunto`);
}

// Aggiunge un focus personalizzato chiedendo all'utente il nome.
// Utile per oggetti non standard (amuleto, bracciale, ecc.) senza dover
// creare un homebrew completo.
window.schedaAddFocusAltro = async function(pgId) {
    const nome = await _schedaShowInputDialog({
        title: 'Focus personalizzato',
        placeholder: 'Es. Amuleto, Bracciale, Anello…',
    });
    if (!nome) return;
    const trimmed = nome.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: trimmed,
        tipo: 'focus',
        categoria: 'altro',
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${trimmed} aggiunto`);
}

// Helper condiviso per i picker della scheda con tab a 2 vie (Armi/Armature, Linguaggi/Strumenti, ...)
window.schedaPickerSwitchTab = function(btn, panelId) {
    // Funziona sia per .modal-content (modal standard) sia per .hp-calc-modal
    // (overlay tipo dialog dell'inventario/sintonia).
    const modal = btn.closest('.modal-content, .hp-calc-modal');
    if (!modal) return;
    modal.querySelectorAll('.picker-tab').forEach(b => b.classList.toggle('active', b === btn));
    modal.querySelectorAll('.picker-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === panelId));
};

window.schedaAddArma = async function(pgId, nome) {
    const arma = DND_ARMI.find(a => a.nome === nome);
    if (!arma) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    pg.equipaggiamento.push({
        nome: arma.nome, tipo: 'arma', danni: arma.danni, tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta, bonus_colpire: profBonus + atkMod, bonus_danno: dmgMod
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arma.nome} aggiunta`);
}

window.schedaAddArmatura = async function(pgId, nome) {
    const arm = DND_ARMATURE.find(a => a.nome === nome);
    if (!arm) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    if (arm.cat !== 'scudo') {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    pg.equipaggiamento.push({
        nome: arm.nome, tipo: arm.cat === 'scudo' ? 'scudo' : 'armatura',
        ca_base: arm.ca_base, categoria: arm.cat, mod_des: arm.mod_des, max_des: arm.max_des
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arm.nome} equipaggiata — CA: ${newCA}`);
}

// ──────────────────────────────────────────────────────────────────────
// Equipaggia direttamente un'arma/armatura/scudo presa dall'inventario
// (oggetto magico SRD o homebrew). Se l'oggetto specifica univocamente
// il tipo D&D di base (es. "spada lunga"), equipaggia subito; altrimenti
// apre un picker per scegliere il tipo specifico (es. "qualsiasi spada").
// Il bonus magico (+N) si propaga ad attacco/danni o alla CA.
// ──────────────────────────────────────────────────────────────────────
function _schedaInvWeaponsArmors(pg) {
    const result = { armi: [], armature: [], scudi: [] };
    if (!pg || !Array.isArray(pg.inventario)) return result;
    pg.inventario.forEach((entry, index) => {
        const view = (typeof window._invResolveLive === 'function')
            ? window._invResolveLive(entry) : entry;
        const tipo = view._homebrew_tipo || view.tipo || '';
        const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
        const nameLow = (view.nome || '').toLowerCase();
        if (tipo === 'Arma') {
            result.armi.push({ index, view });
        } else if (tipo === 'Scudo' || (tipo === 'Armatura' && sub.includes('scudo'))
                || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
            result.scudi.push({ index, view });
        } else if (tipo === 'Armatura') {
            result.armature.push({ index, view });
        }
    });
    return result;
}

// Trova candidati nel dataset DND per il sotto_tipo dato. Restituisce
// l'array di voci compatibili (potrebbe essere 0, 1 o N).
function _schedaMatchDndCandidates(dataset, subRaw, opts = {}) {
    if (!Array.isArray(dataset) || !dataset.length) return [];
    const sub = (subRaw || '').toLowerCase().trim();
    if (!sub) return [];
    // 1) match esatto sul nome
    const exact = dataset.filter(x => (x.nome || '').toLowerCase() === sub);
    if (exact.length) return exact;
    // 2) "qualsiasi X" o "X qualsiasi" -> match per parola chiave
    const cleaned = sub.replace(/\b(qualsiasi|qualunque|ogni|tutte le|tutti gli)\b/g, '').trim();
    // 3) per le armi: "spada", "ascia", "martello", ...
    if (cleaned) {
        const tokens = cleaned.split(/[\s,()\/]+/).filter(t => t && t.length >= 3);
        if (tokens.length) {
            const matches = dataset.filter(x => {
                const n = (x.nome || '').toLowerCase();
                return tokens.some(t => n.includes(t));
            });
            if (matches.length) return matches;
        }
    }
    // 4) per le armature: matcha per categoria (leggera/media/pesante)
    if (opts.armatura) {
        const cats = ['leggera','media','pesante'].filter(c => sub.includes(c));
        if (cats.length) {
            return dataset.filter(x => cats.includes(x.cat) && x.cat !== 'scudo');
        }
    }
    return [];
}

// Ricostruisce il "view" dell'oggetto inventario per index.
function _schedaInvViewAt(pg, index) {
    if (!pg || !Array.isArray(pg.inventario)) return null;
    const entry = pg.inventario[index];
    if (!entry) return null;
    return (typeof window._invResolveLive === 'function')
        ? window._invResolveLive(entry) : entry;
}

window.schedaAddArmaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
    const armi = (typeof DND_ARMI !== 'undefined') ? DND_ARMI : [];
    const candidates = _schedaMatchDndCandidates(armi, sub);
    if (candidates.length === 1) {
        return _schedaApplyInvArmaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvWeaponBase(pgId, invIndex, candidates.length ? candidates : armi, view, sub);
};

window.schedaAddArmaturaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const tipo = view._homebrew_tipo || view.tipo || '';
    const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
    const nameLow = (view.nome || '').toLowerCase();
    const armature = (typeof DND_ARMATURE !== 'undefined') ? DND_ARMATURE : [];
    // Caso scudo: equipaggio subito lo scudo standard.
    if (tipo === 'Scudo' || sub.includes('scudo') || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
        const scudo = armature.find(a => a.cat === 'scudo');
        if (!scudo) return;
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, scudo.nome);
    }
    const candidates = _schedaMatchDndCandidates(
        armature.filter(a => a.cat !== 'scudo'),
        sub,
        { armatura: true }
    );
    if (candidates.length === 1) {
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvArmorBase(pgId, invIndex, candidates.length ? candidates : armature.filter(a => a.cat !== 'scudo'), view, sub);
};

function _schedaPickInvWeaponBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['semplice_mischia','semplice_distanza','guerra_mischia','guerra_distanza'];
    const groupLabels = {
        semplice_mischia: 'Semplici da Mischia',
        semplice_distanza: 'Semplici a Distanza',
        guerra_mischia: 'Da Guerra (Mischia)',
        guerra_distanza: 'Da Guerra (Distanza)',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(`${o.danni} ${o.tipo_danno}`)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    const customRow = `<button type="button" class="generic-magic-type-row generic-magic-type-row-custom"
        onclick="schedaOpenCustomWeaponDialog('${pgId}', { invIndex: ${invIndex} })">
        <span class="generic-magic-type-name">Arma personalizzata…</span>
        <span class="generic-magic-type-sub">Nome, danni e proprietà custom</span>
    </button>`;
    const bodyWithCustom = `<div class="generic-magic-group-label">Personalizzata</div>${customRow}${body}`;
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Arma')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di arma di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${bodyWithCustom}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function _schedaPickInvArmorBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['leggera','media','pesante'];
    const groupLabels = {
        leggera: 'Armatura Leggera',
        media: 'Armatura Media',
        pesante: 'Armatura Pesante',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaturaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">CA ${o.ca_base} · ${escapeHtml(o.cat)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Armatura')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di armatura di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${body}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

// Costruisce il display name per un'entry equipaggiamento creata da un
// oggetto dell'inventario. Rimuove il "+N" finale (sara' riapplicato da
// formatEquipName via magic_bonus) e omette "(Tipo Base)" quando il
// nome dell'oggetto contiene gia' il nome della base D&D (evita
// duplicati tipo "Pugnale (Pugnale)" o "Pugnale +2 (Pugnale) +2").
function _schedaBuildEquipDisplayName(invName, baseName) {
    const stripped = (invName || '').replace(/\s*\+\d+\s*$/, '').trim();
    const lowName = stripped.toLowerCase();
    const lowBase = (baseName || '').toLowerCase().trim();
    if (!stripped) return baseName || 'Oggetto';
    if (!lowBase || lowName === lowBase || lowName.includes(lowBase)) {
        return stripped;
    }
    return `${stripped} (${baseName})`;
}

// Garantisce che l'entry inventario abbia un uid stabile per essere
// referenziata dall'equipaggiamento. Lo crea on-the-fly se mancante.
function _schedaEnsureInvUid(inventario, idx) {
    const it = inventario && inventario[idx];
    if (!it || typeof it !== 'object') return null;
    if (it._treasure_uid) return it._treasure_uid;
    const uid = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    it._treasure_uid = uid;
    return uid;
}

window._schedaApplyInvArmaEquip = async function(pgId, invIndex, dndArmaNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arma = DND_ARMI.find(a => a.nome === dndArmaNome);
    if (!arma) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arma.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: 'arma',
        danni: arma.danni,
        tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta,
        bonus_colpire: profBonus + atkMod + ench,
        bonus_danno: dmgMod + ench,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata`);
};

window._schedaApplyInvArmaturaEquip = async function(pgId, invIndex, dndArmNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arm = DND_ARMATURE.find(a => a.nome === dndArmNome);
    if (!arm) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const isShield = arm.cat === 'scudo';
    if (!isShield) {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arm.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: isShield ? 'scudo' : 'armatura',
        ca_base: arm.ca_base,
        categoria: arm.cat,
        mod_des: arm.mod_des,
        max_des: arm.max_des,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    const updates = { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata — CA: ${newCA}`);
};

window.schedaRemoveEquip = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento) return;
    const removed = pg.equipaggiamento[index];
    pg.equipaggiamento.splice(index, 1);
    const isArmor = removed?.tipo === 'armatura' || removed?.tipo === 'scudo';
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (isArmor) {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    showNotification('Oggetto rimosso');
}

window.schedaEditEquip = function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const currentBonus = e.magic_bonus || 0;
    const currentDesc = e.descrizione || '';

    // Se l'oggetto è collegato a una entry dell'inventario (via
    // from_treasure_uid o, in fallback, per nome) recuperiamo la
    // descrizione live dell'oggetto: così cliccando l'arma/armatura
    // nell'equipaggiamento si vede sempre la descrizione completa
    // dell'oggetto homebrew/SRD da cui è stata equipaggiata, senza
    // dover andare nell'inventario.
    let inventoryDesc = '';
    let inventoryName = '';
    if (Array.isArray(pg.inventario) && pg.inventario.length) {
        const stripBonus = (s) => String(s || '')
            .replace(/\s*\+\d+\s*$/, '')
            .replace(/\s*\([^)]+\)\s*$/, '')
            .trim()
            .toLowerCase();
        const equipBase = stripBonus(e.nome);
        let invItem = null;
        if (e.from_treasure_uid) {
            invItem = pg.inventario.find(it => it && typeof it === 'object' && it._treasure_uid === e.from_treasure_uid) || null;
        }
        if (!invItem && equipBase) {
            // Fallback per oggetti equipaggiati prima del meccanismo
            // from_treasure_uid: matching per nome (case-insensitive,
            // ignorando bonus magici e parentesi tipo "(pugnale)").
            invItem = pg.inventario.find(it => {
                if (!it || typeof it !== 'object') return false;
                const invName = stripBonus(it.nome);
                return invName && (invName === equipBase || equipBase.startsWith(invName) || invName.startsWith(equipBase));
            }) || null;
        }
        if (invItem) {
            const view = (typeof window._invResolveLive === 'function')
                ? window._invResolveLive(invItem) : invItem;
            inventoryDesc = view?.descrizione || view?.proprieta || '';
            inventoryName = view?.nome || '';
        }
    }
    const inventoryDescHtml = inventoryDesc
        ? `<div class="equip-inv-desc-section">
                <div class="equip-inv-desc-label">Descrizione${inventoryName ? ` — ${escapeHtml(inventoryName)}` : ''} (dall'inventario)</div>
                <div class="equip-inv-desc-body">${(typeof window.formatRichText === 'function' ? window.formatRichText(inventoryDesc) : escapeHtml(inventoryDesc))}</div>
            </div>`
        : '';

    const modalHtml = `
    <div class="modal active" id="editEquipModal">
        <div class="modal-content modal-content-xl">
            <button class="modal-close" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2 id="editEquipTitle">${formatEquipName(e)}</h2>
            ${e.proprieta ? `<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:12px;">${e.proprieta.join(', ')}</p>` : ''}
            <div class="equip-ench-row">
                <span class="equip-ench-label">Incantamento</span>
                <div class="custom-res-dice-row">
                    ${[0,1,2,3].map(b =>
                        `<button type="button" class="btn-secondary custom-res-dice-btn ${b === currentBonus ? 'active' : ''}" onclick="schedaSetMagicBonus('${pgId}',${index},${b})">${b === 0 ? 'No' : '+' + b}</button>`
                    ).join('')}
                </div>
            </div>
            ${inventoryDescHtml}
            <label class="equip-desc-label">${inventoryDesc ? 'Note personali' : 'Descrizione'}</label>
            <textarea id="editEquipDesc" class="equip-desc-textarea" placeholder="${inventoryDesc ? 'Note aggiuntive su questo oggetto…' : 'Aggiungi una descrizione, effetti magici, note...'}">${escapeHtml(currentDesc)}</textarea>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveEquipDesc('${pgId}',${index})">Salva</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaSaveEquipDesc = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const ta = document.getElementById('editEquipDesc');
    e.descrizione = ta?.value || '';
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    document.getElementById('editEquipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification('Descrizione aggiornata');
}

// ──────────────────────────────────────────────────────────────────────
// Arma personalizzata: l'utente sceglie nome, categoria (mischia/distanza),
// danni, tipo danno e proprietà a piacere. Usato sia in fase di
// "creazione rapida" dall'aggiunta equipaggiamento, sia per equipaggiare
// un oggetto homebrew dell'inventario senza essere vincolati ai tipi
// standard di D&D (es. lama-pistola, frusta a catena, ecc.).
// opts: { invIndex?: number }
// ──────────────────────────────────────────────────────────────────────
window.schedaOpenCustomWeaponDialog = function(pgId, opts) {
    opts = opts || {};
    const pg = _schedaPgCache;
    if (!pg) return;

    let prefilledName = '';
    let prefilledMagic = 0;
    let invIndex = (typeof opts.invIndex === 'number') ? opts.invIndex : null;
    if (invIndex != null) {
        const view = _schedaInvViewAt(pg, invIndex);
        if (view) {
            prefilledName = (_invDisplayName(view) || view.nome || '').replace(/\s*\+\d+\s*$/, '').trim();
            prefilledMagic = view.magic_bonus || view._homebrew_incantamento || 0;
        }
    }

    document.querySelectorAll('#schedaCustomWeaponOverlay').forEach(o => o.remove());

    const propsList = ['Accurata','Due Mani','Leggera','Pesante','Portata','Lancio','Munizioni','Ricarica','Versatile','Speciale'];
    const propsHtml = propsList.map(p => `
        <label class="custom-weapon-prop">
            <input type="checkbox" data-prop="${escapeHtml(p)}">
            <span>${escapeHtml(p)}</span>
        </label>`).join('');

    const dmgTypes = ['taglienti','perforanti','contundenti','fuoco','freddo','elettricità','acido','veleno','radiante','necrotico','psichico','tuono','forza'];
    const dmgTypeOpts = `<option value="">— nessuno —</option>` + dmgTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'schedaCustomWeaponOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="hp-calc-modal custom-weapon-modal">
            <button class="modal-close" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">&times;</button>
            <h3 class="custom-weapon-title">${invIndex != null ? 'Definisci arma personalizzata' : 'Crea arma personalizzata'}</h3>
            ${invIndex != null ? '<p class="custom-weapon-sub">Definisci come usare questo oggetto dell\'inventario</p>' : '<p class="custom-weapon-sub">Specifica nome, danni e proprietà</p>'}
            <div class="custom-weapon-form">
                <div class="custom-weapon-row">
                    <label>Nome</label>
                    <input type="text" id="cwName" maxlength="80" placeholder="Es. Lama-pistola, Frusta a catena…" value="${escapeHtml(prefilledName)}" />
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Categoria</label>
                        <select id="cwCategory">
                            <option value="mischia" selected>Mischia (Forza)</option>
                            <option value="distanza">Distanza (Destrezza)</option>
                        </select>
                    </div>
                    <div>
                        <label>Incantamento</label>
                        <select id="cwMagic">
                            <option value="0"${prefilledMagic === 0 ? ' selected' : ''}>Nessuno</option>
                            <option value="1"${prefilledMagic === 1 ? ' selected' : ''}>+1</option>
                            <option value="2"${prefilledMagic === 2 ? ' selected' : ''}>+2</option>
                            <option value="3"${prefilledMagic === 3 ? ' selected' : ''}>+3</option>
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Danni</label>
                        <input type="text" id="cwDamage" maxlength="20" placeholder="1d8" value="1d6" />
                    </div>
                    <div>
                        <label>Tipo danno</label>
                        <select id="cwDamageType">
                            ${dmgTypeOpts}
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row">
                    <label>Proprietà</label>
                    <div class="custom-weapon-props" id="cwProps">${propsHtml}</div>
                </div>
                <div class="custom-weapon-row">
                    <label>Altre proprietà <span class="custom-weapon-hint">(es. Gittata 9/27, Speciale)</span></label>
                    <input type="text" id="cwExtraProps" maxlength="120" placeholder="Separate da virgola" />
                </div>
            </div>
            <div class="dialog-actions custom-weapon-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveCustomWeapon('${pgId}', ${invIndex != null ? invIndex : 'null'})">Aggiungi</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
};

window.schedaSaveCustomWeapon = async function(pgId, invIndex) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const overlay = document.getElementById('schedaCustomWeaponOverlay');
    if (!overlay) return;

    const nome = (overlay.querySelector('#cwName')?.value || '').trim();
    if (!nome) {
        showNotification('Inserisci un nome per l\'arma');
        return;
    }
    const categoria = overlay.querySelector('#cwCategory')?.value || 'mischia';
    const danni = (overlay.querySelector('#cwDamage')?.value || '').trim() || '1d4';
    const tipoDanno = overlay.querySelector('#cwDamageType')?.value || '';
    const magic = parseInt(overlay.querySelector('#cwMagic')?.value) || 0;

    const checkedProps = Array.from(overlay.querySelectorAll('#cwProps input[type="checkbox"]:checked'))
        .map(el => el.dataset.prop);
    const extraRaw = (overlay.querySelector('#cwExtraProps')?.value || '').trim();
    const extraProps = extraRaw ? extraRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const proprieta = [...checkedProps, ...extraProps];

    const isRanged = categoria === 'distanza';
    const isFinesse = proprieta.some(p => p.toLowerCase().includes('accurata'));
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;

    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const entry = {
        nome,
        tipo: 'arma',
        danni,
        tipo_danno: tipoDanno,
        proprieta,
        bonus_colpire: profBonus + atkMod + magic,
        bonus_danno: dmgMod + magic,
        magic_bonus: magic,
        custom: true,
    };

    let updates = { equipaggiamento: pg.equipaggiamento };
    if (typeof invIndex === 'number' && invIndex >= 0) {
        const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
        if (treasureUid) {
            entry.from_treasure_uid = treasureUid;
            updates.inventario = pg.inventario;
        }
    }
    pg.equipaggiamento.push(entry);

    await schedaInstantSave(pgId, updates);

    overlay.remove();
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification(`${nome} aggiunta all'equipaggiamento`);
};

window.schedaSetMagicBonus = async function(pgId, index, bonus) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const oldBonus = e.magic_bonus || 0;
    if (oldBonus === bonus) return;
    e.magic_bonus = bonus;

    if (e.tipo === 'arma') {
        e.bonus_colpire = (e.bonus_colpire || 0) - oldBonus + bonus;
        e.bonus_danno = (e.bonus_danno || 0) - oldBonus + bonus;
    }

    const updates = { equipaggiamento: pg.equipaggiamento };
    if (e.tipo === 'armatura' || e.tipo === 'scudo') {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }

    await schedaInstantSave(pgId, updates);
    // Aggiorna lo stato visivo dei pulsanti senza chiudere il dialog,
    // cosi' l'utente puo' continuare a modificare la descrizione.
    const modal = document.getElementById('editEquipModal');
    if (modal) {
        modal.querySelectorAll('.custom-res-dice-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btns = modal.querySelectorAll('.custom-res-dice-btn');
        if (btns[bonus]) btns[bonus].classList.add('active');
        const titleEl = modal.querySelector('h2');
        if (titleEl) titleEl.innerHTML = formatEquipName(e);
    }
    showNotification(`${e.nome} ${bonus > 0 ? '+' + bonus : ''} aggiornato`);
}

// =====================================================
// LINGUAGGI E COMPETENZE
// =====================================================
function _parseToolEntry(t) {
    if (typeof t === 'object' && t !== null) return t;
    return { nome: t, maestria: false };
}

function _toolsByGroup(compStrum) {
    const parsed = (compStrum || []).map(_parseToolEntry);
    const grouped = {};
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = parsed.filter(t => groupDef.items.includes(t.nome));
        if (items.length > 0) grouped[groupName] = items;
    }
    return grouped;
}

function buildLangProfSection(pg) {
    const linguaggi = pg.linguaggi || [];
    const compStrum = pg.competenze_strumenti || [];
    const langHtml = linguaggi.length > 0 ?
        linguaggi.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';

    const grouped = _toolsByGroup(compStrum);
    let toolSectionsHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolSectionsHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolSectionsHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }

    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Linguaggi e Competenze
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenLangProfEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-section-body">
            <div class="scheda-res-imm-display" id="schedaLangProfDisplay">
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Linguaggi</span><div class="scheda-tags" id="schedaLangDisplay">${langHtml}</div></div>
                ${toolSectionsHtml}
            </div>
        </div>
    </div>`;
}

window.schedaOpenLangProfEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentLangs = pg.linguaggi ? [...pg.linguaggi] : [];
    const currentToolsRaw = pg.competenze_strumenti || [];
    const currentTools = currentToolsRaw.map(_parseToolEntry);

    const langCheckboxes = DND_LINGUAGGI.map(l => {
        const checked = currentLangs.includes(l) ? 'checked' : '';
        return `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(l)}" ${checked} onchange="schedaLangToggle(this)"><span>${escapeHtml(l)}</span></label>`;
    }).join('');

    let toolSectionsHtml = '';
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = groupDef.items.map(t => {
            const entry = currentTools.find(e => e.nome === t);
            const checked = entry ? 'checked' : '';
            const hasMastery = entry?.maestria ? 'checked' : '';
            let html = `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(t)}" ${checked} onchange="schedaToolToggle(this)"><span>${escapeHtml(t)}</span>`;
            if (groupDef.allowMastery) {
                html += `<label class="scheda-mastery-toggle" title="Maestria"><input type="checkbox" data-tool="${escapeHtml(t)}" ${hasMastery} onchange="schedaToolMasteryToggle(this)" ${!entry ? 'disabled' : ''}>★</label>`;
            }
            html += `</label>`;
            return html;
        }).join('');
        toolSectionsHtml += `<div class="scheda-picker-cat">${escapeHtml(groupName)}</div><div class="scheda-checkbox-grid">${items}</div>`;
    }

    const modalHtml = `
    <div class="modal active" id="langProfModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseLangProfEdit()">&times;</button>
            <h2>Linguaggi e Competenze</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="linguaggi" onclick="schedaPickerSwitchTab(this,'linguaggi')">Linguaggi</button>
                <button type="button" class="picker-tab" data-panel="competenze" onclick="schedaPickerSwitchTab(this,'competenze')">Competenze</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="linguaggi">
                    <div class="scheda-checkbox-grid">${langCheckboxes}</div>
                </div>
                <div class="picker-tab-panel" data-panel="competenze">
                    ${toolSectionsHtml}
                </div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseLangProfEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaLangEditPgId = pgId;
    window._schedaLangList = currentLangs;
    window._schedaToolList = currentTools;
}

window.schedaLangToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const lang = cb.value;
    if (cb.checked) {
        if (!window._schedaLangList.includes(lang)) window._schedaLangList.push(lang);
    } else {
        window._schedaLangList = window._schedaLangList.filter(l => l !== lang);
    }
    const pg = _schedaPgCache;
    if (pg) pg.linguaggi = [...window._schedaLangList];
    const display = document.getElementById('schedaLangDisplay');
    if (display) display.innerHTML = window._schedaLangList.length > 0 ?
        window._schedaLangList.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';
    await schedaInstantSave(pgId, { linguaggi: window._schedaLangList });
}

function _refreshToolDisplay() {
    const pg = _schedaPgCache;
    if (!pg) return;
    pg.competenze_strumenti = window._schedaToolList.map(t => ({ ...t }));
    const container = document.getElementById('schedaLangProfDisplay');
    if (!container) return;
    const langDisplay = document.getElementById('schedaLangDisplay');
    const langRow = langDisplay ? langDisplay.closest('.scheda-res-imm-row') : null;
    const grouped = _toolsByGroup(window._schedaToolList);
    let toolHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }
    container.innerHTML = (langRow ? langRow.outerHTML : '') + toolHtml;
}

window.schedaToolToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.value;
    if (cb.checked) {
        if (!window._schedaToolList.find(t => t.nome === toolName)) {
            window._schedaToolList.push({ nome: toolName, maestria: false });
        }
    } else {
        window._schedaToolList = window._schedaToolList.filter(t => t.nome !== toolName);
    }
    const masteryInput = cb.closest('.scheda-checkbox-item')?.querySelector('[data-tool]');
    if (masteryInput) {
        masteryInput.disabled = !cb.checked;
        if (!cb.checked) masteryInput.checked = false;
    }
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaToolMasteryToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.dataset.tool;
    const entry = window._schedaToolList.find(t => t.nome === toolName);
    if (entry) entry.maestria = cb.checked;
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaCloseLangProfEdit = function() {
    document.getElementById('langProfModal')?.remove();
    document.body.style.overflow = '';
}

// =====================================================
// AUTO-POPULATE LINGUAGGI FROM RACE
// =====================================================
function autoPopulateLinguaggi(razzaNome, sottorazzaNome) {
    const merged = razzaNome ? buildMergedRaceData(razzaNome, sottorazzaNome || null) : null;
    if (merged && merged.linguaggi && merged.linguaggi.length > 0) {
        return [...merged.linguaggi];
    }
    const raceData = getRaceData(razzaNome);
    if (!raceData) return ['Comune'];
    return raceData.linguaggi && raceData.linguaggi.length > 0 ? [...raceData.linguaggi] : ['Comune'];
}

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
    const form = elements.personaggioForm;
    if (!form) return;

    // Refresh delle sottoclassi homebrew (proprie + amici abilitati) ad
    // ogni apertura della modale: kick-off in background, NIENTE re-render
    // dopo (per non sfarfallare il bottone). Quando l'utente cliccherà
    // "Sottoclasse...", il click handler aspetterà la fine della load
    // se ancora in volo.
    if (typeof loadHomebrewSottoclassi === 'function') {
        loadHomebrewSottoclassi();
    }

    form.reset();
    pgSelectedClasses = [];
    pgCurrentSkillProficiencies = new Set();
    pgCurrentSkillExpertise = new Set();
    pgCurrentResistenze = [];
    pgCurrentImmunita = [];
    pgCurrentSlotIncantesimo = {};
    pgCurrentTalenti = [];
    window._featPickerFilters['wizard'] = _defaultFeatFilters();
    window._featPickerSearch['wizard'] = '';
    pgSelectedEquipment = [];
    _pgRaceSkills = [];
    _pgBgSkills = [];
    _pgBgTools = [];
    _pgBgLangs = [];
    pgCurrentBgTools = new Set();
    pgCurrentBgLanguages = new Set();
    _pgRaceResistances = [];
    pgRenderClassi();
    pgWizardGoTo(0);

    const razzaBtn = document.getElementById('pgRazzaBtn');
    const razzaInput = document.getElementById('pgRazza');
    if (razzaBtn) razzaBtn.textContent = 'Seleziona razza...';
    if (razzaInput) razzaInput.value = '';
    const sottoBtn = document.getElementById('pgSottorazzaBtn');
    const sottoInput = document.getElementById('pgSottorazza');
    if (sottoBtn) sottoBtn.textContent = 'Seleziona sottorazza...';
    if (sottoInput) sottoInput.value = '';
    const sottoGroup = document.getElementById('pgSottorazzaGroup');
    if (sottoGroup) sottoGroup.style.display = 'none';
    const bgBtn = document.getElementById('pgBackgroundBtn');
    const bgInput = document.getElementById('pgBackground');
    if (bgBtn) bgBtn.textContent = 'Seleziona background...';
    if (bgInput) bgInput.value = '';

    // Reset saving throws
    ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'].forEach(s => {
        const cb = document.getElementById(`save${s}`);
        if (cb) cb.checked = false;
    });

    if (personaggioId) {
        elements.personaggioModalTitle.textContent = 'Modifica Personaggio';
        elements.savePersonaggioBtn.textContent = 'Salva';

        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data, error }) => {
                if (data && !error) {
                    document.getElementById('pgNome').value = data.nome || '';
                    const razzaVal = data.razza || '';
                    document.getElementById('pgRazza').value = razzaVal;
                    const rBtn = document.getElementById('pgRazzaBtn');
                    if (rBtn) rBtn.textContent = razzaVal || 'Seleziona razza...';
                    const sottoVal = data.sottorazza || '';
                    const sottoInputEl = document.getElementById('pgSottorazza');
                    if (sottoInputEl) sottoInputEl.value = sottoVal;
                    _pgUpdateSottorazzaUI();
                    const bgVal = data.background || '';
                    document.getElementById('pgBackground').value = bgVal;
                    const bBtn = document.getElementById('pgBackgroundBtn');
                    if (bBtn) bBtn.textContent = bgVal || 'Seleziona background...';
                    // Inizializza tracking del bg corrente (cosi' se l'utente lo cambia
                    // nel wizard, le competenze auto-popolate vengono rimosse correttamente).
                    _pgApplyBackgroundAutoPopulate();

                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        pgSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        pgSelectedClasses = [{ nome: data.classe, livello: data.livello || 1 }];
                    }
                    pgRenderClassi();
                    pgUpdateTotalLevel();

                    document.getElementById('pgForza').value = data.forza || 10;
                    document.getElementById('pgDestrezza').value = data.destrezza || 10;
                    document.getElementById('pgCostituzione').value = data.costituzione || 10;
                    document.getElementById('pgIntelligenza').value = data.intelligenza || 10;
                    document.getElementById('pgSaggezza').value = data.saggezza || 10;
                    document.getElementById('pgCarisma').value = data.carisma || 10;

                    if (data.tiri_salvezza && Array.isArray(data.tiri_salvezza)) {
                        data.tiri_salvezza.forEach(s => {
                            const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
                            if (cb) cb.checked = true;
                        });
                    } else {
                        pgUpdateSavingThrows();
                    }

                    if (data.competenze_abilita && Array.isArray(data.competenze_abilita)) {
                        pgCurrentSkillProficiencies = new Set(data.competenze_abilita);
                    }
                    if (data.maestrie_abilita && Array.isArray(data.maestrie_abilita)) {
                        pgCurrentSkillExpertise = new Set(data.maestrie_abilita);
                    }
                    if (data.talenti && Array.isArray(data.talenti)) {
                        pgCurrentTalenti = [...data.talenti];
                    }
                    if (data.equipaggiamento && Array.isArray(data.equipaggiamento)) {
                        pgSelectedEquipment = [...data.equipaggiamento];
                    }

                    if (data.resistenze && Array.isArray(data.resistenze)) {
                        pgCurrentResistenze = [...data.resistenze];
                    }
                    if (data.immunita && Array.isArray(data.immunita)) {
                        pgCurrentImmunita = [...data.immunita];
                    }
                    if (data.slot_incantesimo && typeof data.slot_incantesimo === 'object') {
                        pgCurrentSlotIncantesimo = {};
                        Object.keys(data.slot_incantesimo).forEach(k => {
                            pgCurrentSlotIncantesimo[parseInt(k)] = { ...data.slot_incantesimo[k] };
                        });
                    }

                    const pvF = document.getElementById('pgPV');
                    if (pvF) { pvF.value = data.punti_vita_max || 10; pvF.dataset.autoHp = 'false'; }
                    document.getElementById('pgIniziativa').value = data.iniziativa != null ? data.iniziativa : calcMod(data.destrezza || 10);
                    document.getElementById('pgCA').value = data.classe_armatura || 10;
                    document.getElementById('pgVelocita').value = data.velocita || 9;
                    updateAllAbilityMods();
                }
            });
        }
    } else {
        elements.personaggioModalTitle.textContent = 'Nuovo Personaggio';
        elements.savePersonaggioBtn.textContent = 'Crea';
        document.getElementById('pgCA').value = '';
        document.getElementById('pgIniziativa').value = '';
        const pvField = document.getElementById('pgPV');
        if (pvField) { pvField.value = 10; pvField.dataset.autoHp = 'true'; }
        updateAllAbilityMods();
        updateBonusCompetenza();
    }

    elements.personaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePersonaggioModal() {
    if (elements.personaggioModal) {
        elements.personaggioModal.classList.remove('active');
        document.body.style.overflow = '';
        editingPersonaggioId = null;
    }
}

let pgSaving = false;
async function handleSavePersonaggio(e) {
    e.preventDefault();
    if (pgSaving) return;
    pgSaving = true;
    const saveBtn = document.getElementById('savePersonaggioBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }
    const supabase = getSupabaseClient();
    if (!supabase) { pgSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; } return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) {
        showNotification('Errore: utente non trovato');
        return;
    }

    const destrezza = parseInt(document.getElementById('pgDestrezza').value) || 10;
    const desMod = calcMod(destrezza);
    const iniziativaVal = document.getElementById('pgIniziativa').value;
    const iniziativa = iniziativaVal !== '' ? parseInt(iniziativaVal) : desMod;
    const caVal = document.getElementById('pgCA').value;
    let caDefault = 10 + desMod;
    const classNames = pgSelectedClasses.map(c => c.nome);
    if (classNames.includes('Barbaro')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgCostituzione').value) || 10);
    else if (classNames.includes('Monaco')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgSaggezza').value) || 10);
    const classeArmatura = caVal !== '' ? parseInt(caVal) : caDefault;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const classeDisplay = pgSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');
    const totalLevel = pgGetTotalLevel();

    let pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
        sottorazza: document.getElementById('pgSottorazza').value || null,
        background: document.getElementById('pgBackground').value || null,
        classe: classeDisplay || null,
        classi: pgSelectedClasses,
        livello: totalLevel,
        forza: clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30),
        destrezza: clamp(destrezza, 1, 30),
        costituzione: clamp(parseInt(document.getElementById('pgCostituzione').value) || 10, 1, 30),
        intelligenza: clamp(parseInt(document.getElementById('pgIntelligenza').value) || 10, 1, 30),
        saggezza: clamp(parseInt(document.getElementById('pgSaggezza').value) || 10, 1, 30),
        carisma: clamp(parseInt(document.getElementById('pgCarisma').value) || 10, 1, 30),
        tiri_salvezza: pgGetSelectedSaves(),
        competenze_abilita: Array.from(pgCurrentSkillProficiencies),
        maestrie_abilita: Array.from(pgCurrentSkillExpertise),
        talenti: pgCurrentTalenti,
        resistenze: pgCurrentResistenze,
        immunita: pgCurrentImmunita,
        equipaggiamento: pgSelectedEquipment.map(e => {
            if (e.tipo === 'arma') {
                const forza = clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30);
                const modFor = calcMod(forza);
                const modDes = desMod;
                const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
                const isRanged = e.proprieta?.some(p => p.includes('Munizioni')) || e.proprieta?.some(p => p.includes('Lancio'));
                const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
                const profBonus = calcBonusCompetenza(totalLevel);
                return { ...e, bonus_colpire: profBonus + atkMod, bonus_danno: atkMod };
            }
            return e;
        }),
        slot_incantesimo: pgBuildSlotIncantesimo(),
        punti_vita_max: parseInt(document.getElementById('pgPV').value) || 10,
        pv_attuali: parseInt(document.getElementById('pgPV').value) || 10,
        iniziativa: iniziativa,
        classe_armatura: classeArmatura,
        percezione_passiva: pgCalcPercPassiva(),
        velocita: parseFloat(document.getElementById('pgVelocita').value) || 9,
        updated_at: new Date().toISOString()
    };

    if (!pgData.nome) {
        showNotification('Inserisci un nome per il personaggio');
        return;
    }

    // Auto-popola dati derivati da razza/background SOLO IN CREAZIONE: in
    // modifica non li tocchiamo per non sovrascrivere quanto l'utente ha
    // gia' personalizzato in scheda (lingue aggiunte, strumenti, oggetti,
    // monete spese). Cosi' i background del dataset locale spingono
    // direttamente al PG strumenti, linguaggi specifici, oggetti iniziali e
    // oro di partenza.
    if (!editingPersonaggioId) {
        const _razzaVal = document.getElementById('pgRazza').value || '';
        const _sottoVal = document.getElementById('pgSottorazza').value || '';
        pgData.linguaggi = autoPopulateLinguaggi(_razzaVal, _sottoVal);

        const _bgVal = document.getElementById('pgBackground').value || '';
        const _bgData = _bgVal ? getBackgroundData(_bgVal) : null;
        if (_bgData) {
            const _bgTools = (_bgData.competenze_strumenti || [])
                .map(t => ({ nome: t, maestria: false }));
            if (_bgTools.length > 0) pgData.competenze_strumenti = _bgTools;
            if (_bgData.linguaggi_specifici && _bgData.linguaggi_specifici.length > 0) {
                pgData.linguaggi = Array.from(new Set([
                    ...(pgData.linguaggi || []),
                    ..._bgData.linguaggi_specifici,
                ]));
            }
            if (_bgData.equipaggiamento_iniziale && _bgData.equipaggiamento_iniziale.length > 0) {
                pgData.inventario = _bgData.equipaggiamento_iniziale.map(name => ({
                    nome: name,
                    descrizione: 'Equipaggiamento iniziale del background',
                    quantita: 1,
                    magico: false,
                }));
            }
            if (_bgData.oro_iniziale) {
                pgData.monete = { mr: 0, ma: 0, me: 0, mo: _bgData.oro_iniziale, mp: 0 };
            }
        }
    }

    // Helper: alcune colonne (es. 'sottorazza') potrebbero non esistere
    // ancora a DB se l'utente non ha eseguito sql/add-sottorazza.sql.
    // Riproviamo senza la colonna problematica per non bloccare il salvataggio.
    const _stripMissingColumns = (data, errMsg) => {
        const m = (errMsg || '').match(/'?([a-z_]+)'? column/i)
              || (errMsg || '').match(/find ['"]?([a-z_]+)['"]? column/i)
              || (errMsg || '').match(/column ['"]?([a-z_]+)['"]?/i);
        if (!m) return null;
        const col = m[1];
        if (!(col in data)) return null;
        const cleaned = { ...data };
        delete cleaned[col];
        console.warn(`[pg save] Colonna '${col}' mancante a DB: salvo senza. Esegui sql/add-${col.replace(/_/g, '-')}.sql per abilitarla.`);
        return cleaned;
    };

    try {
        if (editingPersonaggioId) {
            let { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            // Retry escludendo colonne mancanti a DB
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').update(pgData).eq('id', editingPersonaggioId));
            }
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            let { error } = await supabase
                .from('personaggi')
                .insert(pgData);
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').insert(pgData));
            }
            if (error) throw error;
            showNotification('Personaggio creato');
        }

        const wasEditing = editingPersonaggioId;
        closePersonaggioModal();
        if (wasEditing && AppState.currentPage === 'scheda') {
            await renderSchedaPersonaggio(wasEditing);
        } else {
            await loadPersonaggi();
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: wasEditing ? 'update' : 'insert' });
    } catch (error) {
        console.error('Errore salvataggio personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    } finally {
        pgSaving = false;
        const btn = document.getElementById('savePersonaggioBtn');
        if (btn) { btn.disabled = false; btn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; }
    }
}

window.deletePersonaggio = async function(personaggioId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questo personaggio? Verrà rimosso anche da tutte le campagne associate.');
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi')
            .delete()
            .eq('id', personaggioId);
        if (error) throw error;

        showNotification('Personaggio eliminato');
        if (AppState.currentPage === 'scheda') {
            navigateToPage('personaggi');
        }
        await loadPersonaggi();
        await sendAppEventBroadcast({ table: 'personaggi', action: 'delete' });
    } catch (error) {
        console.error('Errore eliminazione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ─────────────────────────────────────────────────────────────────────
// Cambio sottoclasse dalla card (lista personaggi)
// Permette di cambiare la sottoclasse di un personaggio gia' creato.
// I privilegi auto-derivati e le risorse di sottoclasse vengono ricalcolati
// automaticamente al successivo render (sono derivati da CLASSES_DATA +
// SUBCLASS_RESOURCES in base a sottoclasseSlug/sottoclasse_homebrew_id).
// ─────────────────────────────────────────────────────────────────────
window.pgChangeSubclassFromCard = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let pg;
    try {
        const { data, error } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
        if (error) throw error;
        pg = data;
    } catch (e) {
        console.error('Errore caricamento personaggio:', e);
        showNotification('Errore nel caricamento del personaggio');
        return;
    }
    if (!pg) return;

    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }

    let classi = Array.isArray(pg.classi) && pg.classi.length > 0
        ? pg.classi
        : (pg.classe ? [{ nome: pg.classe, livello: pg.livello || 1 }] : []);

    if (!classi.length) {
        showNotification('Nessuna classe trovata per questo personaggio');
        return;
    }

    const eligible = classi.map((c, i) => {
        const opts = pgGetSubclassOptions(c.nome);
        const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
        return { c, i, opts, hbOpts, hasOpts: opts.length > 0 || hbOpts.length > 0 };
    }).filter(x => x.hasOpts);

    if (!eligible.length) {
        showNotification('Nessuna sottoclasse disponibile per le classi di questo personaggio');
        return;
    }

    if (eligible.length === 1) {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, eligible[0].i);
        return;
    }

    const items = eligible.map(({ c, i }) => ({
        value: String(i),
        label: `${c.nome} (Liv. ${c.livello || 1})${c.sottoclasse ? ' — ' + c.sottoclasse : ''}`
    }));
    openCustomSelect(items, (value) => {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, parseInt(value));
    }, 'Per quale classe?');
};

async function _pgOpenSubclassPickerForSavedPg(pgId, pg, classIdx) {
    if (!Array.isArray(pg.classi) || !pg.classi[classIdx]) return;
    const c = pg.classi[classIdx];
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello || 1);
    const allOpts = [...opts, ...hbOpts];

    openCustomSelect(items, async (value) => {
        const newClassi = pg.classi.map(x => ({ ...x }));
        const target = newClassi[classIdx];
        if (value === '__none__') {
            delete target.sottoclasse;
            delete target.sottoclasseSlug;
            delete target.sottoclasse_homebrew_id;
            delete target.sottoclasse_homebrew_author;
            target.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (!sel) return;
            target.sottoclasse = sel.name;
            target.sottoclasseSlug = sel.slug;
            if (sel.isHomebrew) {
                target.sottoclasse_homebrew_id = sel._hbId;
                if (sel._hbAuthor) target.sottoclasse_homebrew_author = sel._hbAuthor;
                target.thirdCaster = false;
            } else {
                delete target.sottoclasse_homebrew_id;
                delete target.sottoclasse_homebrew_author;
                target.thirdCaster = (typeof isThirdCasterSubclass === 'function')
                    ? isThirdCasterSubclass(sel.slug, sel.name) : false;
            }
        }

        // Pulisce dai privilegi salvati le voci "hidden_auto" legate alla
        // vecchia sottoclasse di questa stessa classe (prefisso
        // "<classSlug>:<oldSubSlug>:"), per non lasciare fantasmi che, in
        // teoria, potrebbero collidere se l'utente tornasse alla stessa
        // sottoclasse in futuro. Le custom_features (tabelle utente) restano
        // intatte.
        const oldSubSlug = c.sottoclasseSlug || '';
        let privilegi = pg.privilegi && typeof pg.privilegi === 'object' ? { ...pg.privilegi } : null;
        if (privilegi && Array.isArray(privilegi.hidden_auto) && oldSubSlug) {
            privilegi.hidden_auto = privilegi.hidden_auto.filter(k => {
                if (typeof k !== 'string') return true;
                return !k.includes(`:${oldSubSlug}:`);
            });
        }

        const updates = { classi: newClassi, updated_at: new Date().toISOString() };
        if (privilegi) updates.privilegi = privilegi;

        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const { error } = await supabase.from('personaggi').update(updates).eq('id', pgId);
            if (error) throw error;
            showNotification(target.sottoclasse
                ? `Sottoclasse di ${c.nome} aggiornata: ${target.sottoclasse}`
                : `Sottoclasse di ${c.nome} rimossa`);
            await loadPersonaggi();
            // Se la scheda di questo PG e' aperta, ricarica.
            if (AppState.currentPersonaggioId === pgId && AppState.currentPage === 'scheda') {
                if (typeof renderSchedaPersonaggio === 'function') {
                    await renderSchedaPersonaggio(pgId);
                }
            }
            try { await sendAppEventBroadcast({ table: 'personaggi', action: 'update', id: pgId }); } catch (_) {}
        } catch (e) {
            console.error('Errore aggiornamento sottoclasse:', e);
            showNotification('Errore nel salvataggio della sottoclasse');
        }
    }, `Sottoclasse di ${c.nome}`);
}

// --- Scegli personaggio per campagna ---

window.openScegliPersonaggioModal = async function(campagnaId) {
    if (!elements.scegliPersonaggioModal || !elements.scegliPersonaggioList) return;

    elements.scegliPersonaggioList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
    elements.scegliPersonaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) throw new Error('Utente non trovato');

        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const { data: assoc } = await supabase
            .from('personaggi_campagna')
            .select('personaggio_id')
            .eq('campagna_id', campagnaId)
            .eq('user_id', userData.id)
            .maybeSingle();

        const currentPgId = assoc?.personaggio_id || null;

        if (!personaggi || personaggi.length === 0) {
            elements.scegliPersonaggioList.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai personaggi. Creane uno prima!</p>
                    <button class="btn-primary btn-small" onclick="closeScegliPersonaggioModal(); navigateToPage('personaggi');">Vai a Personaggi</button>
                </div>`;
            return;
        }

        elements.scegliPersonaggioList.innerHTML = personaggi.map(pg => {
            const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
            const isSelected = pg.id === currentPgId;
            return `
            <div class="scegli-pg-item ${isSelected ? 'selected' : ''}" onclick="selectPersonaggioCampagna('${campagnaId}', '${pg.id}', '${userData.id}')">
                <div class="scegli-pg-item-avatar">${escapeHtml(initials)}</div>
                <div class="scegli-pg-item-info">
                    <div class="scegli-pg-item-name">${escapeHtml(pg.nome)}${isSelected ? ' (attuale)' : ''}</div>
                    <div class="scegli-pg-item-detail">${escapeHtml(pg.razza || '')} ${escapeHtml(pg.classe || '')} - Lv ${pg.livello || 1}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Errore caricamento personaggi per selezione:', error);
        elements.scegliPersonaggioList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento</p></div>';
    }
}

function closeScegliPersonaggioModal() {
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.selectPersonaggioCampagna = async function(campagnaId, personaggioId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi_campagna')
            .upsert({
                campagna_id: campagnaId,
                user_id: userId,
                personaggio_id: personaggioId,
                created_at: new Date().toISOString()
            }, { onConflict: 'campagna_id,user_id' });

        if (error) throw error;

        showNotification('Personaggio selezionato!');
        closeScegliPersonaggioModal();
        await sendAppEventBroadcast({ table: 'personaggi_campagna', action: 'upsert', campagnaId });

        if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId === campagnaId) {
            await loadCampagnaDetails(campagnaId);
        }
    } catch (error) {
        console.error('Errore selezione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ============================================================================
// TIPO SCHEDA MODAL
// ============================================================================

window.openTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
};

// ============================================================================
// MICRO SCHEDA CREATION
// ============================================================================

let _microEditingId = null;
let _microSelectedClasses = [];

function microRenderClassi() {
    const container = document.getElementById('microClassiList');
    if (!container) return;
    const chipsHtml = _microSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'microOpenSubclassDropdown');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="microRemoveClass(${i})">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="microOpenClasseSelect()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
    microUpdateTotalLevel();
}

window.microOpenSubclassDropdown = async function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    // Refresh cache homebrew sempre prima del picker (la dedup interna evita
    // doppie query). Cache vuota non significa "già provato": potrebbe essere
    // un'inizializzazione precedente fatta senza utente loggato.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            delete c.sottoclasse;
            delete c.sottoclasseSlug;
            delete c.sottoclasse_homebrew_id;
            delete c.sottoclasse_homebrew_author;
            c.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (sel) {
                c.sottoclasse = sel.name;
                c.sottoclasseSlug = sel.slug;
                if (sel.isHomebrew) {
                    c.sottoclasse_homebrew_id = sel._hbId;
                    if (sel._hbAuthor) c.sottoclasse_homebrew_author = sel._hbAuthor;
                    c.thirdCaster = false;
                } else {
                    delete c.sottoclasse_homebrew_id;
                    delete c.sottoclasse_homebrew_author;
                    c.thirdCaster = isThirdCasterSubclass(sel.slug, sel.name);
                }
            }
        }
        microRenderClassi();
    }, `Sottoclasse di ${c.nome}`);
};

window.microClearSubclass = function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
    microRenderClassi();
};

function microUpdateTotalLevel() {
    const total = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const field = document.getElementById('microLivello');
    if (field) field.value = total;
}

window.microOpenClasseSelect = function() {
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    const classOptions = available.map(c => ({ value: c, label: c }));
    openCustomSelect(classOptions, (value) => {
        _microSelectedClasses.push({ nome: value, livello: 1, thirdCaster: false });
        microRenderClassi();
    }, 'Seleziona Classe');
};

window.microRemoveClass = function(i) {
    _microSelectedClasses.splice(i, 1);
    microRenderClassi();
};

window.microClassLevelChange = function(i, delta) {
    const c = _microSelectedClasses[i];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    microRenderClassi();
};

window.openMicroSchedaModal = function(personaggioId) {
    _microEditingId = personaggioId || null;
    const form = document.getElementById('microSchedaForm');
    if (form) form.reset();
    _microSelectedClasses = [];

    const title = document.getElementById('microSchedaModalTitle');
    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (_microEditingId) {
        if (title) title.textContent = 'Modifica Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Salva';
        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data }) => {
                if (data) {
                    document.getElementById('microNome').value = data.nome || '';
                    document.getElementById('microPVMax').value = data.punti_vita_max || 10;
                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        _microSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        _microSelectedClasses = [{ nome: data.classe, livello: data.livello || 1, thirdCaster: false }];
                    }
                    microRenderClassi();
                }
            });
        }
    } else {
        if (title) title.textContent = 'Nuova Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Crea';
    }
    microRenderClassi();

    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeMicroSchedaModal = function() {
    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    _microEditingId = null;
};

async function handleSaveMicroScheda(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nome = document.getElementById('microNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }
    if (_microSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }

    const pvMax = parseInt(document.getElementById('microPVMax')?.value) || 10;
    const totalLevel = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const classeDisplay = _microSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) { showNotification('Errore: utente non trovato'); return; }

    const autoSlots = calcSpellSlotsFromClassi(_microSelectedClasses);
    const slotIncantesimo = {};
    Object.keys(autoSlots).forEach(lv => {
        slotIncantesimo[lv] = { max: autoSlots[lv], current: autoSlots[lv], used: 0 };
    });

    const pgData = {
        nome,
        classe: classeDisplay,
        classi: _microSelectedClasses,
        livello: totalLevel,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        slot_incantesimo: slotIncantesimo,
        tipo_scheda: 'micro',
        updated_at: new Date().toISOString()
    };

    try {
        if (_microEditingId) {
            const { error } = await supabase.from('personaggi').update(pgData).eq('id', _microEditingId);
            if (error) throw error;
            showNotification('Micro Scheda aggiornata');
        } else {
            pgData.user_id = userData.id;
            pgData.forza = 10; pgData.destrezza = 10; pgData.costituzione = 10;
            pgData.intelligenza = 10; pgData.saggezza = 10; pgData.carisma = 10;
            pgData.classe_armatura = 10; pgData.iniziativa = 0; pgData.velocita = 9;
            pgData.percezione_passiva = 10;
            const { error } = await supabase.from('personaggi').insert(pgData);
            if (error) throw error;
            showNotification('Micro Scheda creata');
        }
        closeMicroSchedaModal();
        loadPersonaggi();
    } catch (err) {
        console.error('Errore salvataggio micro scheda:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _microEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// MICRO SCHEDA RENDERING
// ============================================================================

async function renderMicroScheda(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore</p>'; return; }

    const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
    if (error || !pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }
    _schedaPgCache = pg;

    let classeDisplay = pg.classe || '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
    }

    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const pvTemp = pg.pv_temporanei || 0;
    const initDisplay = pg.iniziativa != null ? pg.iniziativa : 0;
    const initStr = initDisplay >= 0 ? `+${initDisplay}` : `${initDisplay}`;

    const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
    const dadiDisp = pg.dadi_vita_disponibili || {};
    let hitDiceHtml = '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        hitDiceHtml = `<div class="scheda-hd-table">
            ${pg.classi.map(c => {
                const die = CLASS_HD[c.nome] || 8;
                const total = c.livello || 1;
                const key = c.nome;
                const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',-1,${total})">−</button>
                        <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',1,${total})">+</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Micro scheda: class resources
    const microClassRes = pg.risorse_classe || {};
    const microResItems = [];
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        pg.classi.forEach(c => {
            const resList = CLASS_RESOURCES[c.nome];
            if (!resList) return;
            resList.forEach((res, rIdx) => {
                if (c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = rIdx === 0 ? `${c.nome}_res` : `${c.nome}_res_${rIdx}`;
                const current = Math.min(maxVal, microClassRes[key] != null ? microClassRes[key] : maxVal);
                microResItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
        });
    }
    _pgRaceResources(pg).forEach(rr => {
        const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                <span class="scheda-hd-max">/ ${rr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
            </div>
        </div>`);
    });
    const microCustomRes = microClassRes._custom || [];
    microCustomRes.forEach((cr, i) => {
        const current = cr.current != null ? cr.current : cr.max;
        const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                <span class="scheda-hd-max">/ ${cr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
            </div>
        </div>`);
    });
    const microClassResHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Risorse di Classe
            <button class="scheda-edit-btn" onclick="schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
        </div>
        ${microResItems.length > 0 ? `<div class="scheda-hd-table">${microResItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
    </div>`;

    const isConcentrating = !!pg.concentrazione;
    const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
    const conditionsHtml = conditionsActive.length > 0 ?
        conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';

    const resistenze = pg.resistenze || [];
    const immunita = pg.immunita || [];
    const microResHtml = resistenze.length > 0 ?
        resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const microImmHtml = immunita.length > 0 ?
        immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const resImmHtml = `<div class="scheda-section">
        <div class="scheda-section-title">
            Resistenze e Immunità
            <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-res-imm-display" id="schedaResImmDisplay">
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${microResHtml}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${microImmHtml}</div></div>
        </div>
        <div id="schedaResImmEditGrid" style="display:none;"></div>
    </div>`;

    const slots = pg.slot_incantesimo || {};
    let slotsHtml = '';
    const sortedLevels = Object.keys(slots).map(Number).filter(l => l > 0 && slots[l]?.max > 0).sort((a, b) => a - b);
    const slotRows = sortedLevels.map(lv => {
        const s = slots[lv];
        const currentAvail = s.current != null ? s.current : (s.max - (s.used || 0));
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < currentAvail ? 'filled' : ''}" data-lvl="${lv}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lv}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count">${currentAvail}/${s.max}</span>
        </div>`;
    }).join('');
    slotsHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo <button class="scheda-edit-btn" onclick="microOpenSlotConfig('${pg.id}')" title="Configura">&#9998;</button></div>
        ${slotRows ? `<div class="scheda-slots-table">${slotRows}</div>` : '<span class="scheda-empty">Nessuno slot configurato</span>'}
    </div>`;

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = 'none';

    // La micro-scheda non ha la struttura con il divisore "Statistiche": nascondi il bottone spada.
    const scrollBtn = document.getElementById('btnScrollStats');
    if (scrollBtn) scrollBtn.style.display = 'none';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>

    <div class="scheda-three-boxes">
        <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
            <div class="scheda-box-val" id="schedaInit">${initStr}</div>
            <div class="scheda-box-label">Iniziativa</div>
        </div>
    </div>

    <div class="scheda-hp-section">
        <div class="scheda-hp-left">
            <div class="scheda-hp-pair">
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','punti_vita_max',${pg.punti_vita_max},-1)">
                    <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                    <div class="scheda-hp-label">PV Massimi</div>
                </div>
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max})">
                    <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                    <div class="scheda-hp-label">PV Attuali</div>
                </div>
            </div>
        </div>
        <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pvTemp},-1)">
            <div class="scheda-hp-display" id="schedaPvTemp">${pvTemp}</div>
            <div class="scheda-hp-label">PV Temp</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title">Dadi Vita</div>
        ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
    </div>

    ${microClassResHtml}

    <div class="scheda-section">
        <div class="scheda-section-title">Condizioni</div>
        <div class="scheda-concentrazione-row">
            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
        </div>
        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
        <div class="scheda-condition-extra">
            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
        </div>
        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
    </div>

    ${resImmHtml}

    ${slotsHtml}
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            microSlotToggle(pg.id, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    // Se richiesto, centra la vista sul blocco PV/PV temp/Iniziativa.
    if (window._schedaPendingScrollToStats) {
        window._schedaPendingScrollToStats = false;
        setTimeout(() => {
            const target = content.querySelector('.scheda-hp-section')
                        || content.querySelector('.scheda-three-boxes');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }
}

window.microSlotToggle = async function(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg?.slot_incantesimo?.[level]) return;
    const slot = pg.slot_incantesimo[level];
    const currentAvail = slot.current != null ? slot.current : (slot.max - (slot.used || 0));
    slot.current = index < currentAvail ? index : index + 1;
    slot.used = slot.max - slot.current;
    await schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
    renderMicroScheda(pgId);
}

window.microHdChange = async function(pgId, key, delta, max) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('dadi_vita_disponibili').eq('id', pgId).single();
    const dadiDisp = pg?.dadi_vita_disponibili || {};
    const current = dadiDisp[key] != null ? dadiDisp[key] : max;
    const newVal = Math.max(0, Math.min(max, current + delta));
    dadiDisp[key] = newVal;
    await supabase.from('personaggi').update({ dadi_vita_disponibili: dadiDisp, updated_at: new Date().toISOString() }).eq('id', pgId);
    renderMicroScheda(pgId);
};

window.microToggleCondition = async function(pgId, key, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ [key]: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
};

window.microSlotChange = async function(pgId, level, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const slots = pg.slot_incantesimo || {};
    if (!slots[level]) slots[level] = { max, current: max, used: 0 };
    const avail = slots[level].current != null ? slots[level].current : (max - (slots[level].used || 0));
    const newAvail = Math.max(0, Math.min(max, avail - delta));
    slots[level].current = newAvail;
    slots[level].used = max - newAvail;
    await schedaInstantSave(pgId, { slot_incantesimo: slots });
    renderMicroScheda(pgId);
};

window.microOpenSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    let rows = '';
    for (let lv = 1; lv <= 9; lv++) {
        const maxVal = slots[lv]?.max || 0;
        rows += `<div class="micro-slot-config-row">
            <span>${lv}° Livello</span>
            <input type="number" min="0" max="20" value="${maxVal}" id="microSlotMax_${lv}" class="form-control" style="width:60px;text-align:center;" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
        </div>`;
    }

    const modalHtml = `
    <div class="modal active" id="microSlotConfigModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeMicroSlotConfig()">&times;</button>
            <h2>Configura Slot Incantesimo</h2>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">Imposta il numero massimo di slot per livello</p>
            <div class="micro-slot-config-grid">${rows}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeMicroSlotConfig()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveMicroSlotConfig('${pgId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
};

window.closeMicroSlotConfig = function() {
    const m = document.getElementById('microSlotConfigModal');
    if (m) m.remove();
    document.body.style.overflow = '';
};

window.saveMicroSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    for (let lv = 1; lv <= 9; lv++) {
        const input = document.getElementById(`microSlotMax_${lv}`);
        const maxVal = parseInt(input?.value) || 0;
        if (maxVal > 0) {
            if (!slots[lv]) slots[lv] = { max: maxVal, used: 0 };
            else slots[lv].max = maxVal;
        } else {
            delete slots[lv];
        }
    }

    await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', pgId);
    closeMicroSlotConfig();
    renderMicroScheda(pgId);
    showNotification('Slot incantesimo aggiornati');
};
