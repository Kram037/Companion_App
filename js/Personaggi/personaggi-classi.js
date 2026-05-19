// ============================================================================
// PERSONAGGI CLASSI WIZARD
// ============================================================================

window.pgOpenClassDropdown = function() {
    const available = DND_CLASSES.filter(c => !pgSelectedClasses.find(s => s.nome === c));
    if (available.length === 0) { showNotification('Tutte le classi sono già selezionate'); return; }
    openCustomSelect(
        available.map(c => ({ value: c, label: c })),
        (value) => {
            if (pgSelectedClasses.find(c => c.nome === value)) return;
            pgSelectedClasses.push({ nome: value, livello: 1 });
            pgRenderClassi();
            pgUpdateTotalLevel();
            pgUpdateSavingThrows();
            pgResetAutoHP();
        },
        'Seleziona Classe'
    );
}

window.pgRemoveClasse = function(index) {
    pgSelectedClasses.splice(index, 1);
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgUpdateSavingThrows();
    pgResetAutoHP();
}

window.pgUpdateClassLevel = function(index, value) {
    const lv = Math.max(1, Math.min(20, parseInt(value) || 1));
    pgSelectedClasses[index].livello = lv;
    _pgEnsureSubclassAllowed(pgSelectedClasses[index]);
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

function pgResetAutoHP() {
    const pvField = document.getElementById('pgPV');
    if (pvField) pvField.dataset.autoHp = 'true';
    pgRenderDadiVita();
}

// Sottoclassi "third caster" (1/3 incantatore): l'attributo thirdCaster
// di una classe del PG viene derivato automaticamente quando il giocatore
// seleziona una di queste sottoclassi nel dropdown.
const THIRD_CASTER_SUBCLASS_KEYS = new Set([
    'eldritch-knight', 'arcane-trickster',
    'eldritch knight', 'arcane trickster',
    'cavaliere mistico', 'mistificatore arcano',
]);

function isThirdCasterSubclass(slug, name) {
    return THIRD_CASTER_SUBCLASS_KEYS.has(String(slug || '').toLowerCase()) ||
           THIRD_CASTER_SUBCLASS_KEYS.has(String(name || '').toLowerCase());
}

// Restituisce le sottoclassi disponibili nei dati per una data classe (per nome IT/EN)
function pgGetSubclassOptions(className) {
    const data = window.CLASSES_DATA || [];
    const cls = data.find(c =>
        (c.name || '').toLowerCase() === String(className).toLowerCase() ||
        (c.name_en || '').toLowerCase() === String(className).toLowerCase() ||
        (c.slug || '').toLowerCase() === String(className).toLowerCase()
    );
    if (!cls || !Array.isArray(cls.subclasses)) return [];
    return cls.subclasses.map(s => {
        const lvls = (s.features || []).map(f => f.level || 99);
        const minLevel = lvls.length ? Math.min(...lvls) : 3;
        return {
            slug: s.slug,
            name: s.name || s.name_en,
            minLevel: minLevel || 3,
            isHomebrew: false,
        };
    });
}

// Restituisce le sottoclassi HOMEBREW visibili (proprie + amici abilitati)
// per una data classe. Le voci contengono _hbId, _hbAuthor, _hbIsOwn per
// permettere alla scheda di risalire a tutti i privilegi/incantesimi.
function pgGetHomebrewSubclassOptions(className) {
    // Sync getter: se la cache non è popolata, restituisce []. Il preload
    // viene gestito nel click-handler async (pgOpenSubclassDropdown) e
    // all'apertura della modale, così evitiamo re-render side-effect che
    // farebbero sfarfallare il bottone Sottoclasse.
    if (typeof AppState === 'undefined' || !Array.isArray(AppState.cachedHomebrewSottoclassi)) {
        return [];
    }
    const all = AppState.cachedHomebrewSottoclassi;
    if (all.length === 0) return [];
    const data = window.CLASSES_DATA || [];
    const targetLower = String(className || '').toLowerCase().trim();
    const cls = data.find(c =>
        (c.name || '').toLowerCase() === targetLower ||
        (c.name_en || '').toLowerCase() === targetLower ||
        (c.slug || '').toLowerCase() === targetLower
    );
    const slug = cls ? cls.slug : null;
    // Filtro robusto: accetta match per slug (se trovato) E anche per
    // parent_class_name salvato nel record homebrew (case/spaces-insensitive).
    // In questo modo eventuali disallineamenti CLASSES_DATA <-> nome PG non
    // ci bloccano la visibilità della sottoclasse homebrew.
    const matches = all.filter(r => {
        const slugMatch = slug && r.parent_class_slug === slug;
        const nameMatch = (r.parent_class_name || '').toLowerCase().trim() === targetLower;
        return slugMatch || nameMatch;
    });
    try {
        appDebug('[homebrew][picker] richiesta sottoclassi homebrew:', {
            className, targetLower, classeSlugTrovato: slug,
            sottoclassiInCache: all.length,
            sottoclassiPerQuestaClasse: matches.length,
            tutteLeCacheItems: all.map(r => `${r.parent_class_slug || '?'} (${r.parent_class_name || '?'}): ${r.nome}`)
        });
    } catch (_) {}
    if (matches.length === 0) return [];
    return matches
        .map(r => {
            // Min level = il minimo livello tra le feature definite (default 3)
            const lvls = Array.isArray(r.sottoclasse_features)
                ? r.sottoclasse_features.map(f => parseInt(f.level) || 99)
                : [];
            const minLevel = lvls.length ? Math.min(...lvls) : 3;
            return {
                slug: 'hb:' + r.id,
                name: r.nome || 'Sottoclasse',
                minLevel: minLevel || 3,
                isHomebrew: true,
                _hbId: r.id,
                _hbAuthor: r._author_name || '',
                _hbIsOwn: !!r._is_own,
            };
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
}

function _pgSubclassFieldsClear(c) {
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
}

function _pgAllSubclassOptions(className) {
    return [
        ...pgGetSubclassOptions(className),
        ...pgGetHomebrewSubclassOptions(className),
    ];
}

function _pgSubclassMinLevel(className) {
    const all = _pgAllSubclassOptions(className);
    if (all.length === 0) return null;
    return Math.min(...all.map(o => parseInt(o.minLevel) || 3));
}

function _pgUnlockedSubclassOptions(className, livello) {
    const lv = parseInt(livello) || 1;
    return {
        opts: pgGetSubclassOptions(className).filter(o => lv >= (parseInt(o.minLevel) || 3)),
        hbOpts: pgGetHomebrewSubclassOptions(className).filter(o => lv >= (parseInt(o.minLevel) || 3)),
    };
}

function _pgFindSubclassOption(c) {
    if (!c?.sottoclasse && !c?.sottoclasseSlug) return null;
    const slug = String(c.sottoclasseSlug || '').toLowerCase();
    const name = String(c.sottoclasse || '').toLowerCase();
    return _pgAllSubclassOptions(c.nome).find(o =>
        (slug && String(o.slug || '').toLowerCase() === slug) ||
        (name && String(o.name || '').toLowerCase() === name)
    ) || null;
}

function _pgEnsureSubclassAllowed(c) {
    const selected = _pgFindSubclassOption(c);
    if (!selected) return false;
    const level = parseInt(c.livello) || 1;
    if (level >= (parseInt(selected.minLevel) || 3)) return false;
    _pgSubclassFieldsClear(c);
    return true;
}

window.pgNormalizeSelectedClassesForLevel = function(notify = false) {
    let changed = false;
    pgSelectedClasses.forEach(c => {
        changed = _pgEnsureSubclassAllowed(c) || changed;
    });
    if (changed && notify) {
        showNotification('Ho rimosso le sottoclassi non disponibili al livello attuale');
    }
    return changed;
};

function pgRebuildSlotsForClassi(classi, previousSlots = {}) {
    if (typeof calcSpellSlotsFromClassi !== 'function') return previousSlots || {};
    const autoSlots = calcSpellSlotsFromClassi(classi || []);
    const rebuilt = {};
    Object.keys(autoSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = autoSlots[lvKey];
        const prev = previousSlots?.[lv] || previousSlots?.[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used))
            ? Math.min(parseInt(prev.used), max)
            : 0;
        rebuilt[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
    });
    return rebuilt;
}

function _renderSubclassSelector(c, index, onclickFn, mode = 'inline') {
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    const allOpts = [...opts, ...hbOpts];
    try {
        appDebug('[homebrew][selector] _renderSubclassSelector chiamata:', {
            classeNome: c.nome,
            classeSlug: c.slug,
            optsNative: opts.length,
            optsHomebrew: hbOpts.length,
            cacheArray: Array.isArray(window.AppState?.cachedHomebrewSottoclassi)
                ? window.AppState.cachedHomebrewSottoclassi.length
                : 'NULL'
        });
    } catch (_) {}
    if (allOpts.length === 0) return '';
    _pgEnsureSubclassAllowed(c);
    const level = parseInt(c.livello) || 1;
    const minLevel = _pgSubclassMinLevel(c.nome);
    const unlocked = _pgUnlockedSubclassOptions(c.nome, level);
    if (unlocked.opts.length === 0 && unlocked.hbOpts.length === 0) {
        return `
        <button type="button" class="pg-subclass-trigger pg-subclass-trigger-locked" disabled>
            <span class="pg-subclass-trigger-empty">Sottoclasse dal liv. ${minLevel || 3}</span>
        </button>`;
    }
    const label = c.sottoclasse
        ? escapeHtml(c.sottoclasse)
        : '<span class="pg-subclass-trigger-empty">Sottoclasse…</span>';
    const isDelegated = mode === 'pg';
    const clearBtn = c.sottoclasse
        ? isDelegated
            ? `<button type="button" class="pg-subclass-clear" data-action="clear-subclass" data-index="${index}" title="Rimuovi sottoclasse">×</button>`
            : `<button type="button" class="pg-subclass-clear" onclick="event.stopPropagation();${onclickFn.replace('pgOpenSubclassDropdown','pgClearSubclass').replace('microOpenSubclassDropdown','microClearSubclass')}(${index})" title="Rimuovi sottoclasse">×</button>`
        : '';
    const triggerAttrs = isDelegated
        ? `data-action="open-subclass" data-index="${index}"`
        : `onclick="${onclickFn}(${index})"`;
    return `
        <button type="button" class="pg-subclass-trigger" ${triggerAttrs}>
            ${label}
            ${clearBtn}
        </button>`;
}

function pgSetupClassiDelegation(container) {
    if (!container || container.dataset.pgClassiDelegated === '1') return;
    container.dataset.pgClassiDelegated = '1';
    container.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl || !container.contains(actionEl)) return;

        const index = Number(actionEl.dataset.index);
        switch (actionEl.dataset.action) {
            case 'level-down':
                pgClassLevelChange(index, -1);
                break;
            case 'level-up':
                pgClassLevelChange(index, 1);
                break;
            case 'remove-class':
                pgRemoveClasse(index);
                break;
            case 'open-subclass':
                pgOpenSubclassDropdown(index);
                break;
            case 'clear-subclass':
                event.stopPropagation();
                pgClearSubclass(index);
                break;
            case 'add-class':
                pgOpenClassDropdown();
                break;
            default:
                break;
        }
    });
}

function pgRenderClassi() {
    const container = document.getElementById('pgClassiList');
    if (!container) return;
    pgSetupClassiDelegation(container);
    const chipsHtml = pgSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'pgOpenSubclassDropdown', 'pg');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" data-action="level-down" data-index="${i}">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" data-action="level-up" data-index="${i}">+</button>
                </div>
                <button type="button" class="pg-classe-remove" data-action="remove-class" data-index="${i}">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" data-action="add-class">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    setSafeHtml(container, chipsHtml + addBtn);
}

window.pgOpenSubclassDropdown = async function(index) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    // Sicurezza: assicurati che le sottoclassi homebrew siano in cache
    // FRESCA prima di mostrare il picker (importante subito dopo aver
    // creato una sottoclasse nel laboratorio o cambiato utente).
    // La dedup interna del loader evita doppie query concorrenti.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const available = _pgAllSubclassOptions(c.nome);
    if (available.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const level = parseInt(c.livello) || 1;
    const { opts, hbOpts } = _pgUnlockedSubclassOptions(c.nome, level);
    if (opts.length === 0 && hbOpts.length === 0) {
        const minLevel = _pgSubclassMinLevel(c.nome) || 3;
        showNotification(`La sottoclasse di ${c.nome} si sceglie dal livello ${minLevel}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            _pgSubclassFieldsClear(c);
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
        pgRenderClassi();
        pgResetAutoHP();
    }, `Sottoclasse di ${c.nome}`);
};

// Helper condiviso fra scheda completa e micro-scheda: costruisce gli
// item del custom-select per le sottoclassi, separando con un divider
// le voci homebrew dalle ufficiali.
function _buildSubclassPickerItems(opts, hbOpts, livello) {
    const items = [
        { value: '__none__', label: 'Nessuna sottoclasse' },
        ...opts.map(o => ({
            value: o.slug,
            label: o.name + (livello < o.minLevel ? ` (dal liv. ${o.minLevel})` : '')
        }))
    ];
    if (hbOpts.length > 0) {
        items.push({ type: 'divider', label: 'Homebrew' });
        hbOpts.forEach(o => {
            const tag = o._hbIsOwn ? 'tuo' : (o._hbAuthor || 'amico');
            items.push({
                value: o.slug,
                label: o.name + (livello < o.minLevel ? ` (dal liv. ${o.minLevel})` : ''),
                source: tag,
            });
        });
    }
    return items;
}

window.pgClearSubclass = function(index) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    _pgSubclassFieldsClear(c);
    pgRenderClassi();
    pgResetAutoHP();
};

window.pgClassLevelChange = function(index, delta) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    _pgEnsureSubclassAllowed(c);
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

// --- Saving Throws ---
function pgUpdateSavingThrows() {
    if (pgSelectedClasses.length === 0) return;
    const primaryClass = pgSelectedClasses[0].nome;
    const saves = CLASS_SAVES[primaryClass] || [];
    const allSaves = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma'];
    allSaves.forEach(s => {
        const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
        if (cb) cb.checked = saves.includes(s);
    });
}

function pgGetSelectedSaves() {
    const allSaves = ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'];
    return allSaves.filter(s => {
        const cb = document.getElementById(`save${s}`);
        return cb && cb.checked;
    }).map(s => s.toLowerCase());
}

