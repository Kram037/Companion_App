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

function _privSubclassHasGrantedSpellTable(classSlug, subclassSlug) {
    const table = window.SUBCLASS_SPELLS_DATA?.[classSlug]?.[subclassSlug];
    if (!table || typeof table !== 'object') return false;
    return Object.entries(table).some(([level, spells]) =>
        !String(level).startsWith('_') && Array.isArray(spells) && spells.some(Boolean)
    ) || Object.values(table._variants || {}).some(byLevel =>
        byLevel && typeof byLevel === 'object' && Object.values(byLevel).some(spells =>
            Array.isArray(spells) && spells.some(Boolean)
        )
    );
}

function _privIsGrantedSpellFeature(feature) {
    const name = `${feature?.name_en || ''} ${feature?.name || ''}`.toLowerCase();
    if (!name.trim()) return false;
    if (name.includes('spellcasting') || name.includes('lancio di incantesimi')) return false;
    return /\b(domain spells|oath spells|circle spells|expanded spell list|psionic spells|clockwork magic|artificer spells|alchemist spells|armorer spells|artillerist spells|battle smith spells)\b/.test(name)
        || /incantesimi (del|della|dello|dei|degli|delle|da|dell'|psionici|estesa|ampliata)|lista .*incantesimi|magia dell'orologeria/.test(name);
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
            const hasGrantedSpellTable = _privSubclassHasGrantedSpellTable(cls.slug, sub.slug);
            subFeatures = (sub.features || [])
                .filter(f => !f.level || f.level <= lvl)
                .filter(f => !(hasGrantedSpellTable && _privIsGrantedSpellFeature(f)))
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
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui backend/supabase/sql/add-all-missing-columns.sql');
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

window.schedaOpenPrivilegesPage = function(pgId) {
    _schedaRequestReactRefresh(pgId, 'privilegi');
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
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui backend/supabase/sql/add-all-missing-columns.sql');
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
