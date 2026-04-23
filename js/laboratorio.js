// ============================================================================
// LABORATORIO - Homebrew content management
// ============================================================================

let _labCurrentTab = 'classi';
let _labEditingId = null;

const LAB_CATEGORIES = {
    classi: {
        table: 'homebrew_classi',
        label: 'Sottoclasse',
        labelPlural: 'Sottoclassi',
        icon: '⚔',
        fields: () => ''
    },
    razze: {
        table: 'homebrew_razze',
        label: 'Razza',
        labelPlural: 'Razze',
        icon: '🧬',
        fields: () => ''
    },
    background: {
        table: 'homebrew_background',
        label: 'Background',
        labelPlural: 'Background',
        icon: '📜',
        fields: () => labFieldsBackground()
    },
    incantesimi: {
        table: 'homebrew_incantesimi',
        label: 'Incantesimo',
        labelPlural: 'Incantesimi',
        icon: '✨',
        fields: () => labFieldsIncantesimi()
    },
    nemici: {
        table: 'homebrew_nemici',
        label: 'Nemico',
        labelPlural: 'Nemici e Combattimenti',
        icon: '💀',
        fields: () => labFieldsNemici()
    },
    talenti: {
        table: 'homebrew_talenti',
        label: 'Talento',
        labelPlural: 'Talenti',
        icon: '⭐',
        fields: () => labFieldsTalenti()
    },
    oggetti: {
        table: 'homebrew_oggetti',
        label: 'Oggetto',
        labelPlural: 'Oggetti',
        icon: '🎒',
        fields: () => labFieldsOggetti()
    },
    impostazioni: {
        label: 'Impostazioni',
        labelPlural: 'Impostazioni',
        icon: '⚙',
        isSettings: true
    }
};

// ============================================================================
// HUB & SUB-PAGE NAVIGATION
// ============================================================================

function labRenderHub() {
    const grid = document.getElementById('labHubGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(LAB_CATEGORIES).map(([key, cat]) => `
        <div class="lab-hub-card" onclick="labOpenCategory('${key}')">
            <span class="lab-hub-card-icon">${cat.icon}</span>
            <span class="lab-hub-card-label">${cat.labelPlural || cat.label + 'i'}</span>
        </div>
    `).join('');
    document.getElementById('laboratorioPage')?.classList.add('lab-hub-active');
}

window.labOpenCategory = function(tab) {
    _labCurrentTab = tab;
    const cat = LAB_CATEGORIES[tab];
    if (!cat) return;

    const hub = document.getElementById('labHub');
    const sub = document.getElementById('labSubPage');
    if (hub) hub.style.display = 'none';
    if (sub) sub.style.display = '';

    document.getElementById('laboratorioPage')?.classList.remove('lab-hub-active');

    const title = document.getElementById('labSubTitle');
    if (title) title.textContent = cat.labelPlural || cat.label;

    const addBtn = document.getElementById('addHomebrewBtn');
    if (addBtn) addBtn.style.visibility = cat.isSettings ? 'hidden' : '';

    if (cat.isSettings) {
        labRenderSettings();
    } else {
        loadLabContent();
    }
};

window.labBackToHub = function() {
    const hub = document.getElementById('labHub');
    const sub = document.getElementById('labSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    document.getElementById('laboratorioPage')?.classList.add('lab-hub-active');
};

async function loadLabContent() {
    const container = document.getElementById('labContent');
    if (!container) return;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) {
        container.innerHTML = '<div class="content-placeholder"><p>Accedi per creare i tuoi contenuti homebrew</p></div>';
        return;
    }

    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    if (!AppState.currentUser?.uid) return;

    container.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const { data, error } = await supabase
        .from(cat.table)
        .select('*')
        .eq('user_id', AppState.currentUser.uid)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Errore caricamento laboratorio:', error);
        container.innerHTML = '<div class="lab-empty">Errore nel caricamento</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="lab-empty">Nessun contenuto homebrew. Premi <strong>+</strong> per crearne uno!</div>`;
        return;
    }

    container.innerHTML = `<div class="lab-list">${data.map(item => labRenderCard(item, cat)).join('')}</div>`;
}

function labRenderCard(item, cat) {
    const detail = labGetCardDetail(item, _labCurrentTab);
    const clickAction = _labCurrentTab === 'nemici' ? `onclick="labViewNemico('${item.id}')"` : '';
    return `
    <div class="lab-card" data-id="${item.id}" ${clickAction} style="${clickAction ? 'cursor:pointer' : ''}">
        <div class="lab-card-icon">${cat.icon}</div>
        <div class="lab-card-info">
            <p class="lab-card-name">${escapeHtml(item.nome)}</p>
            ${detail ? `<p class="lab-card-detail">${escapeHtml(detail)}</p>` : ''}
        </div>
        <div class="lab-card-actions">
            <button onclick="event.stopPropagation();labEditItem('${item.id}')" title="Modifica">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="lab-delete" onclick="event.stopPropagation();labDeleteItem('${item.id}')" title="Elimina">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    </div>`;
}

function labGetCardDetail(item, tab) {
    switch (tab) {
        case 'classi': {
            const parts = [];
            const cls = item.parent_class_name || item.parent_class_slug;
            if (cls) parts.push(`Classe: ${cls}`);
            const feats = Array.isArray(item.sottoclasse_features) ? item.sottoclasse_features : [];
            if (feats.length) parts.push(`${feats.length} privileg${feats.length === 1 ? 'io' : 'i'}`);
            return parts.join(' · ');
        }
        case 'razze': {
            const parts = [`${item.taglia || 'Media'}`, `${item.velocita || 9}m`];
            const nRes = (item.resistenze || []).length;
            if (nRes > 0) parts.push(`${nRes} res.`);
            const nLang = (item.linguaggi || []).length;
            if (nLang > 0) parts.push(`${nLang} ling.`);
            return parts.join(' · ');
        }
        case 'background': return '';
        case 'incantesimi': {
            const lvl = item.livello === 0 ? 'Trucchetto' : `Livello ${item.livello}`;
            return `${lvl}${item.scuola ? ' · ' + item.scuola : ''}`;
        }
        case 'nemici': return `CA ${item.classe_armatura || 10} · PV ${item.punti_vita_max || 10} · GS ${item.grado_sfida || '0'}`;
        case 'talenti': return item.prerequisiti || '';
        case 'oggetti': {
            const parts = [];
            if (item.tipo) parts.push(item.tipo);
            if (item.rarita) parts.push(item.rarita);
            return parts.join(' · ');
        }
        default: return '';
    }
}

// ============================================================================
// FORM FIELD GENERATORS
// ============================================================================

// ============================================================================
// SOTTOCLASSI HOMEBREW - Wizard creazione sottoclassi (sostituisce classi)
// ============================================================================

// Livelli a cui ogni classe ottiene i privilegi di sottoclasse (D&D 5e canon).
const SUBCLASS_FEATURE_LEVELS_BY_SLUG = {
    'artificer':  [3, 5, 9, 15],
    'barbarian':  [3, 6, 10, 14],
    'bard':       [3, 6, 14],
    'cleric':     [1, 2, 6, 8, 17],
    'druid':      [2, 6, 10, 14],
    'fighter':    [3, 7, 10, 15, 18],
    'monk':       [3, 6, 11, 17],
    'paladin':    [3, 7, 15, 20],
    'ranger':     [3, 7, 11, 15],
    'rogue':      [3, 9, 13, 17],
    'sorcerer':   [1, 6, 14, 18],
    'warlock':    [1, 6, 10, 14],
    'wizard':     [2, 6, 10, 14]
};

// Lista classi base supportate per le sottoclassi homebrew.
function _labStandardClasses() {
    const data = (typeof window !== 'undefined' && Array.isArray(window.CLASSES_DATA)) ? window.CLASSES_DATA : [];
    const allowed = Object.keys(SUBCLASS_FEATURE_LEVELS_BY_SLUG);
    const list = data
        .filter(c => allowed.includes(c.slug))
        .map(c => ({ slug: c.slug, name: c.name || c.slug }));
    // Fallback nel caso in cui CLASSES_DATA non sia ancora caricato.
    if (!list.length) {
        const labels = {
            artificer:'Artefice', barbarian:'Barbaro', bard:'Bardo', cleric:'Chierico',
            druid:'Druido', fighter:'Guerriero', monk:'Monaco', paladin:'Paladino',
            ranger:'Ranger', rogue:'Ladro', sorcerer:'Stregone', warlock:'Warlock', wizard:'Mago'
        };
        return allowed.map(s => ({ slug: s, name: labels[s] || s }));
    }
    list.sort((a, b) => a.name.localeCompare(b.name, 'it'));
    return list;
}

// Stato del wizard sottoclasse.
let _labSubState = null;

function _labSubInitState(editData) {
    const e = editData || {};
    const slotsBuf = {}; // {level: [feature, feature, ...]}
    if (Array.isArray(e.sottoclasse_features)) {
        for (const f of e.sottoclasse_features) {
            const lv = parseInt(f.level) || 1;
            if (!slotsBuf[lv]) slotsBuf[lv] = [];
            slotsBuf[lv].push({
                level: lv,
                slotIdx: slotsBuf[lv].length,
                nome: f.nome || '',
                descrizione: f.descrizione || '',
                has_resource: !!f.risorsa,
                risorsa: f.risorsa ? {
                    nome: f.risorsa.nome || '',
                    max: f.risorsa.max ?? '',
                    recharge: f.risorsa.recharge || 'long_rest',
                    tipo: f.risorsa.tipo || 'counter',
                    dado: f.risorsa.dado || 'd6'
                } : _labSubEmptyRisorsa(),
                grants_spells: Array.isArray(f.grants_spells) && f.grants_spells.length > 0,
                spells: Array.isArray(f.grants_spells) ? f.grants_spells.slice() : [],
                spells_uses: f.spells_uses ? {
                    recharge: f.spells_uses.recharge || 'unlimited',
                    max: f.spells_uses.max ?? ''
                } : _labSubEmptySpellsUses()
            });
        }
    }
    // Calcola counts per livello dalle feature esistenti, default 1 per livello se vuoto.
    const slug = e.parent_class_slug || null;
    const lvls = slug ? (SUBCLASS_FEATURE_LEVELS_BY_SLUG[slug] || []) : [];
    const countsByLevel = {};
    for (const lv of lvls) countsByLevel[lv] = Math.max(1, (slotsBuf[lv] || []).length || 1);

    // Costruisce features ordinate.
    const features = [];
    for (const lv of lvls) {
        const cnt = countsByLevel[lv];
        for (let i = 0; i < cnt; i++) {
            const existing = (slotsBuf[lv] || [])[i];
            features.push(existing || _labSubMakeEmptyFeature(lv, i));
        }
    }

    const grantedRows = Array.isArray(e.granted_spells) ? e.granted_spells.map(r => ({
        level: parseInt(r.level) || 1,
        spells: Array.isArray(r.spells) ? r.spells.slice() : []
    })) : [];
    return {
        editingId: e.id || null,
        page: e.parent_class_slug ? 'setup' : 'pick-class',
        parentSlug: slug,
        parentName: e.parent_class_name || null,
        subclassName: e.nome || '',
        countsByLevel,
        features,
        currentIdx: 0,
        grantsSpells: grantedRows.length > 0,
        grantedSpellsByLevel: grantedRows
    };
}

function _labSubEmptyRisorsa() {
    return { nome: '', max: '', recharge: 'long_rest', tipo: 'counter', dado: 'd6' };
}

function _labSubEmptySpellsUses() {
    return { recharge: 'unlimited', max: '' };
}

function _labSubMakeEmptyFeature(level, slotIdx) {
    return {
        level: level || 1,
        slotIdx: slotIdx || 0,
        nome: '',
        descrizione: '',
        has_resource: false,
        risorsa: _labSubEmptyRisorsa(),
        grants_spells: false,
        spells: [],
        spells_uses: _labSubEmptySpellsUses()
    };
}

function _labSubLevelsForCurrentClass() {
    if (!_labSubState?.parentSlug) return [];
    return SUBCLASS_FEATURE_LEVELS_BY_SLUG[_labSubState.parentSlug] || [];
}

// Ricostruisce l'array features in base a countsByLevel, preservando i dati
// già inseriti per (level, slotIdx) ancora presenti.
function _labSubRebuildFeatures() {
    const lvls = _labSubLevelsForCurrentClass();
    const oldByKey = {};
    for (const f of _labSubState.features) oldByKey[`${f.level}#${f.slotIdx}`] = f;
    const next = [];
    for (const lv of lvls) {
        const cnt = Math.max(1, parseInt(_labSubState.countsByLevel[lv]) || 1);
        for (let i = 0; i < cnt; i++) {
            const old = oldByKey[`${lv}#${i}`];
            next.push(old || _labSubMakeEmptyFeature(lv, i));
        }
    }
    _labSubState.features = next;
    if (_labSubState.currentIdx >= next.length) _labSubState.currentIdx = Math.max(0, next.length - 1);
}

// Tutti i privilegi pianificati hanno nome+descrizione?
function _labSubAllFeaturesComplete() {
    if (!_labSubState.features.length) return false;
    return _labSubState.features.every(f => (f.nome || '').trim() && (f.descrizione || '').trim());
}

function _openLabSottoclasseWizard(editData) {
    _labEditingId = editData?.id || null;
    _labSubState = _labSubInitState(editData);
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    _labSubRender();
}

function _labSubRender() {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;
    if (_labSubState.page === 'pick-class') {
        mlg.innerHTML = _labSubRenderPickClass();
    } else if (_labSubState.page === 'setup') {
        mlg.innerHTML = _labSubRenderSetupPage();
    } else if (_labSubState.page === 'spells') {
        mlg.innerHTML = _labSubRenderSpellsPage();
    } else {
        _labSubRebuildFeatures();
        if (!_labSubState.features.length) {
            // Non dovrebbe mai accadere (almeno 1 per livello), ma per sicurezza torna al setup.
            _labSubState.page = 'setup';
            mlg.innerHTML = _labSubRenderSetupPage();
            return;
        }
        mlg.innerHTML = _labSubRenderFeaturePage();
    }
}

function _labSubStepperHtml(active) {
    const steps = ['Classe', 'Sottoclasse', 'Incantesimi', 'Privilegi'];
    return `<div class="lab-sub-stepper">${steps.map((s, i) => `
        <div class="lab-sub-stepper-item${i === active ? ' active' : ''}${i < active ? ' done' : ''}">
            <span class="lab-sub-stepper-num">${i + 1}</span>
            <span class="lab-sub-stepper-name">${s}</span>
        </div>
    `).join('')}</div>`;
}

function _labSubRenderPickClass() {
    const classes = _labStandardClasses();
    const title = _labSubState.editingId ? 'Modifica Sottoclasse' : 'Nuova Sottoclasse';
    const cards = classes.map(c => `
        <button type="button" class="lab-sub-class-card${_labSubState.parentSlug === c.slug ? ' active' : ''}"
                data-slug="${c.slug}" onclick="labSubPickClass('${c.slug}', '${escapeHtml(c.name)}')">
            <span class="lab-sub-class-name">${escapeHtml(c.name)}</span>
            <span class="lab-sub-class-levels">Liv ${(SUBCLASS_FEATURE_LEVELS_BY_SLUG[c.slug] || []).join(', ')}</span>
        </button>
    `).join('');
    return `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${title}</h2>
        ${_labSubStepperHtml(0)}
        <div class="lab-sub-step-label">Scegli la classe madre</div>
        <div class="wizard-page-scroll" style="max-height:55vh;">
            <div class="lab-sub-class-grid">${cards}</div>
        </div>
        <div class="lab-sub-actions">
            <div class="lab-sub-actions-row">
                <button type="button" class="btn-secondary" onclick="closeHomebrewModal()">Annulla</button>
                <button type="button" class="btn-primary" id="labSubNextFromPick" ${_labSubState.parentSlug ? '' : 'disabled'} onclick="labSubGoToSetup()">Avanti</button>
            </div>
        </div>`;
}

function _labSubRenderSetupPage() {
    const lvls = _labSubLevelsForCurrentClass();
    // Assicura che countsByLevel abbia sempre tutti i livelli della classe scelta.
    for (const lv of lvls) {
        if (!_labSubState.countsByLevel[lv]) _labSubState.countsByLevel[lv] = 1;
    }
    const stepperRows = lvls.map(lv => {
        const c = parseInt(_labSubState.countsByLevel[lv]) || 1;
        return `
        <div class="lab-sub-count-row">
            <span class="lab-sub-count-level">${lv}° livello</span>
            <div class="lab-sub-count-stepper">
                <button type="button" class="lab-sub-count-btn" onclick="labSubChangeCount(${lv}, -1)" ${c <= 1 ? 'disabled' : ''}>−</button>
                <span class="lab-sub-count-val" id="labSubCount_${lv}">${c}</span>
                <button type="button" class="lab-sub-count-btn" onclick="labSubChangeCount(${lv}, 1)">+</button>
            </div>
        </div>`;
    }).join('');
    return `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${escapeHtml(_labSubState.parentName || 'Sottoclasse')}</h2>
        ${_labSubStepperHtml(1)}
        <div class="lab-sub-step-label">Nome della sottoclasse</div>
        <div class="form-group">
            <input type="text" id="labSubNome" value="${escapeHtml(_labSubState.subclassName || '')}" placeholder="es. Cavaliere della Tempesta" oninput="labSubSetupChange()">
        </div>
        <div class="lab-sub-step-label">Numero di privilegi per livello</div>
        <div class="lab-sub-counts-list">${stepperRows}</div>
        <div class="lab-sub-actions">
            <div class="lab-sub-actions-row">
                <button type="button" class="btn-secondary" onclick="labSubBackFromSetup()">Indietro</button>
                <button type="button" class="btn-primary" id="labSubSetupNext" ${(_labSubState.subclassName || '').trim() ? '' : 'disabled'} onclick="labSubGoToSpells()">Avanti</button>
            </div>
        </div>`;
}

function _labSubRenderSpellsPage() {
    const isOn = !!_labSubState.grantsSpells;
    const rows = (_labSubState.grantedSpellsByLevel || []).map((row, i) => {
        const chips = (row.spells || []).map((sp, sIdx) => `
            <span class="lab-sub-spell-chip">
                <span class="lab-sub-spell-chip-name">${escapeHtml(sp)}</span>
                <button type="button" class="lab-sub-spell-chip-x" onclick="labSubRemoveSpell(${i}, ${sIdx})" title="Rimuovi">×</button>
            </span>
        `).join('');
        const lvOptions = Array.from({length: 20}, (_, k) => k + 1).map(lv => `<option value="${lv}" ${row.level === lv ? 'selected' : ''}>${lv}° livello</option>`).join('');
        return `
        <div class="lab-sub-spell-row" data-row="${i}">
            <div class="lab-sub-spell-row-head">
                <select class="lab-sub-spell-row-level" onchange="labSubSpellRowLevelChange(${i}, this.value)">${lvOptions}</select>
                <button type="button" class="btn-secondary lab-sub-spell-row-remove" onclick="labSubRemoveSpellRow(${i})">Rimuovi livello</button>
            </div>
            <div class="lab-sub-spell-chips">
                ${chips}
                <button type="button" class="lab-sub-spell-add" onclick="labSubAddSpellToRow(${i})">+ Aggiungi incantesimo</button>
            </div>
        </div>`;
    }).join('');
    const empty = `<p class="lab-sub-hint" style="margin:8px 0 0;">Nessuna progressione configurata. Clicca <strong>+ Aggiungi livello</strong> per definire gli incantesimi conferiti per livello (es. Paladino: 3°, 5°, 9°, 13°, 17°).</p>`;

    // Quando il toggle è attivo, comprimo la spiegazione per dare spazio al picker.
    const help = isOn
        ? `<p class="lab-sub-hint lab-sub-hint-compact">Definisci la progressione di incantesimi conferiti per livello.</p>`
        : `<p class="lab-sub-hint" style="text-align:left;margin:0 0 8px;">Esempi: incantesimi di Dominio del Chierico, di Giuramento del Paladino, di Patrono del Warlock. Lascia vuoto se la sottoclasse non conferisce incantesimi automaticamente.</p>`;

    return `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${escapeHtml(_labSubState.subclassName || _labSubState.parentName || 'Sottoclasse')}</h2>
        ${_labSubStepperHtml(2)}
        ${isOn ? '' : '<div class="lab-sub-step-label">Progressione di incantesimi della sottoclasse</div>'}
        ${help}
        <div class="form-group lab-sub-toggle-row">
            <label class="lab-sub-toggle">
                <input type="checkbox" id="labSubGrantsSpells" ${isOn ? 'checked' : ''} onchange="labSubToggleGrantsSpells(this.checked)">
                <span>Questa sottoclasse conferisce incantesimi automaticamente</span>
            </label>
        </div>
        ${isOn ? `
        <div class="wizard-page-scroll lab-sub-feature-scroll lab-sub-feature-scroll-tall">
            <div class="lab-sub-spell-rows">${rows || empty}</div>
            <button type="button" class="lab-sub-spell-add-row" onclick="labSubAddSpellRow()">+ Aggiungi livello</button>
        </div>
        ` : '<div style="height:8px;"></div>'}
        <div class="lab-sub-actions">
            <div class="lab-sub-actions-row">
                <button type="button" class="btn-secondary" onclick="labSubBackFromSpells()">Indietro</button>
                <button type="button" class="btn-primary" onclick="labSubGoToFeatures()">Avanti</button>
            </div>
        </div>`;
}

function _labSubRenderFeaturePage() {
    const idx = _labSubState.currentIdx;
    const total = _labSubState.features.length;
    const f = _labSubState.features[idx];
    // Conta quanti privilegi ci sono per quel livello e qual è la posizione del corrente al suo interno.
    const sameLevelFeatures = _labSubState.features.filter(x => x.level === f.level);
    const levelLocalIdx = sameLevelFeatures.findIndex(x => x === f) + 1;
    const levelLocalTot = sameLevelFeatures.length;
    const isLast = idx === total - 1;
    const canCreate = _labSubAllFeaturesComplete() && (_labSubState.subclassName || '').trim();

    const recOpts = [
        ['short_rest', 'Riposo Breve'],
        ['long_rest', 'Riposo Lungo'],
        ['day', 'Al Giorno'],
        ['none', 'Nessun recupero']
    ].map(([v, l]) => `<option value="${v}" ${f.risorsa.recharge === v ? 'selected' : ''}>${l}</option>`).join('');
    const maxOpts = [
        ['', '— manuale —'],
        ['prof_bonus', 'Pari al Bonus di Competenza'],
        ['cha_mod', 'Modificatore di Carisma'],
        ['wis_mod', 'Modificatore di Saggezza'],
        ['int_mod', 'Modificatore di Intelligenza'],
        ['con_mod', 'Modificatore di Costituzione'],
        ['str_mod', 'Modificatore di Forza'],
        ['dex_mod', 'Modificatore di Destrezza']
    ].map(([v, l]) => `<option value="${v}" ${String(f.risorsa.max) === v ? 'selected' : ''}>${l}</option>`).join('');
    const isManualMax = !['prof_bonus','cha_mod','wis_mod','int_mod','con_mod','str_mod','dex_mod'].includes(String(f.risorsa.max));
    const tipoOpts = [
        ['counter', 'Contatore (usi)'],
        ['dice_pool', 'Pool di Dadi'],
        ['portent', 'Portento (dadi salvati)']
    ].map(([v, l]) => `<option value="${v}" ${f.risorsa.tipo === v ? 'selected' : ''}>${l}</option>`).join('');
    const dadoOpts = ['d4','d6','d8','d10','d12'].map(d => `<option value="${d}" ${f.risorsa.dado === d ? 'selected' : ''}>${d}</option>`).join('');

    const resourceBlock = f.has_resource ? `
        <div class="lab-sub-resource-box">
            <div class="lab-sub-step-label" style="margin-top:0;">Risorsa consumabile</div>
            <div class="lab-sub-field">
                <label for="labSubResNome">Nome risorsa</label>
                <input type="text" id="labSubResNome" value="${escapeHtml(f.risorsa.nome || '')}" placeholder="es. Dadi di Energia Psionica">
            </div>
            <div class="lab-sub-field-grid">
                <div class="lab-sub-field">
                    <label for="labSubResTipo">Tipo</label>
                    <select id="labSubResTipo" onchange="labSubFieldChange()">${tipoOpts}</select>
                </div>
                <div class="lab-sub-field">
                    <label for="labSubResRecharge">Recupero</label>
                    <select id="labSubResRecharge">${recOpts}</select>
                </div>
            </div>
            <div class="lab-sub-field-grid">
                <div class="lab-sub-field">
                    <label for="labSubResMaxPreset">Massimo (formula)</label>
                    <select id="labSubResMaxPreset" onchange="labSubMaxPresetChange()">${maxOpts}</select>
                </div>
                <div class="lab-sub-field">
                    <label for="labSubResMaxManual">Massimo (manuale)</label>
                    <input type="number" id="labSubResMaxManual" min="0" value="${isManualMax ? escapeHtml(String(f.risorsa.max ?? '')) : ''}" ${isManualMax ? '' : 'disabled'} placeholder="es. 4">
                </div>
            </div>
            ${(f.risorsa.tipo === 'dice_pool' || f.risorsa.tipo === 'portent') ? `
            <div class="lab-sub-field">
                <label for="labSubResDado">Tipo di dado</label>
                <select id="labSubResDado">${dadoOpts}</select>
            </div>` : ''}
        </div>
    ` : '';

    const subTitle = `${escapeHtml(_labSubState.subclassName || _labSubState.parentName || 'Sottoclasse')}`;
    const progressBar = _labSubProgressBarHtml();
    const featChips = (f.spells || []).map((sp, sIdx) => `
        <span class="lab-sub-spell-chip">
            <span class="lab-sub-spell-chip-name">${escapeHtml(sp)}</span>
            <button type="button" class="lab-sub-spell-chip-x" onclick="labSubFeatSpellRemove(${sIdx})" title="Rimuovi">×</button>
        </span>
    `).join('');
    const su = f.spells_uses || _labSubEmptySpellsUses();
    const usesRecOpts = [
        ['unlimited', 'Illimitato'],
        ['short_rest', 'Riposo Breve'],
        ['long_rest', 'Riposo Lungo'],
        ['day', 'Al Giorno']
    ].map(([v, l]) => `<option value="${v}" ${su.recharge === v ? 'selected' : ''}>${l}</option>`).join('');
    const usesMaxOpts = [
        ['', '— manuale —'],
        ['prof_bonus', 'Pari al Bonus di Competenza'],
        ['cha_mod', 'Modificatore di Carisma'],
        ['wis_mod', 'Modificatore di Saggezza'],
        ['int_mod', 'Modificatore di Intelligenza'],
        ['con_mod', 'Modificatore di Costituzione'],
        ['str_mod', 'Modificatore di Forza'],
        ['dex_mod', 'Modificatore di Destrezza']
    ].map(([v, l]) => `<option value="${v}" ${String(su.max) === v ? 'selected' : ''}>${l}</option>`).join('');
    const isUnlimited = su.recharge === 'unlimited';
    const isManualUsesMax = !['prof_bonus','cha_mod','wis_mod','int_mod','con_mod','str_mod','dex_mod'].includes(String(su.max));
    const featureSpellsBlock = f.grants_spells ? `
        <div class="lab-sub-resource-box">
            <div class="lab-sub-step-label" style="margin-top:0;">Incantesimi conferiti da questo privilegio</div>
            <div class="lab-sub-spell-chips">
                ${featChips}
                <button type="button" class="lab-sub-spell-add" onclick="labSubFeatSpellAdd()">+ Aggiungi incantesimo</button>
            </div>
            <div class="lab-sub-uses-divider">Utilizzi</div>
            <div class="lab-sub-field">
                <label for="labSubFeatSpellsRecharge">Recupero</label>
                <select id="labSubFeatSpellsRecharge" onchange="labSubFeatSpellsUsesChange()">${usesRecOpts}</select>
            </div>
            <div class="lab-sub-field-grid" ${isUnlimited ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <div class="lab-sub-field">
                    <label for="labSubFeatSpellsMaxPreset">Massimo (formula)</label>
                    <select id="labSubFeatSpellsMaxPreset" onchange="labSubFeatSpellsUsesMaxPresetChange()" ${isUnlimited ? 'disabled' : ''}>${usesMaxOpts}</select>
                </div>
                <div class="lab-sub-field">
                    <label for="labSubFeatSpellsMaxManual">Massimo (manuale)</label>
                    <input type="number" id="labSubFeatSpellsMaxManual" min="0" value="${isManualUsesMax ? escapeHtml(String(su.max ?? '')) : ''}" ${(isUnlimited || !isManualUsesMax) ? 'disabled' : ''} placeholder="es. 1" onchange="labSubFeatSpellsUsesChange()" oninput="labSubFeatSpellsUsesChange()">
                </div>
            </div>
            ${isUnlimited ? '<p class="lab-sub-hint lab-sub-hint-compact" style="margin-top:6px;">Gli incantesimi possono essere lanciati senza limiti di utilizzo (oltre agli slot incantesimo standard se applicabile).</p>' : ''}
        </div>` : '';
    return `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${subTitle}</h2>
        ${_labSubStepperHtml(3)}
        ${progressBar}
        <div class="lab-sub-feature-header">
            <span class="lab-sub-feature-level">${f.level}° livello</span>
            <span class="lab-sub-feature-pos">Privilegio ${levelLocalIdx} di ${levelLocalTot}</span>
            <span class="lab-sub-feature-global">(${idx + 1}/${total})</span>
        </div>
        <div class="wizard-page-scroll lab-sub-feature-scroll">
            <div class="form-group">
                <label for="labSubFeatNome">Nome del privilegio</label>
                <input type="text" id="labSubFeatNome" value="${escapeHtml(f.nome || '')}" placeholder="es. Tonante Carica" onchange="labSubFieldChange()" oninput="labSubFieldChange()">
            </div>
            <div class="form-group">
                <label for="labSubFeatDesc">Descrizione</label>
                <textarea id="labSubFeatDesc" rows="6" placeholder="Descrivi l'effetto del privilegio..." onchange="labSubFieldChange()" oninput="labSubFieldChange()">${escapeHtml(f.descrizione || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="lab-sub-toggle">
                    <input type="checkbox" id="labSubHasRes" ${f.has_resource ? 'checked' : ''} onchange="labSubToggleResource(this.checked)">
                    <span>Questo privilegio ha effetti consumabili (verrà aggiunto come risorsa)</span>
                </label>
            </div>
            ${resourceBlock}
            <div class="form-group">
                <label class="lab-sub-toggle">
                    <input type="checkbox" id="labSubGrantsSpellsFeat" ${f.grants_spells ? 'checked' : ''} onchange="labSubToggleFeatSpells(this.checked)">
                    <span>Questo privilegio conferisce incantesimi specifici</span>
                </label>
            </div>
            ${featureSpellsBlock}
        </div>
        <div class="lab-sub-actions">
            <div class="lab-sub-actions-row">
                <button type="button" class="btn-secondary" onclick="labSubBack()">Indietro</button>
                <button type="button" class="btn-primary" onclick="labSubNext()" ${isLast ? 'disabled' : ''}>Avanti</button>
            </div>
            <button type="button" class="btn-primary lab-sub-create-btn" id="labSubCreateBtn" ${canCreate ? '' : 'disabled'} onclick="labSaveSottoclasse()">${_labSubState.editingId ? 'Salva modifiche' : 'Crea Sottoclasse'}</button>
            ${!canCreate ? `<p class="lab-sub-hint">${_labSubCreateHint()}</p>` : ''}
        </div>`;
}

function _labSubCreateHint() {
    if (!(_labSubState.subclassName || '').trim()) return 'Inserisci un nome per la sottoclasse.';
    const missing = _labSubState.features.filter(f => !(f.nome || '').trim() || !(f.descrizione || '').trim());
    if (missing.length) return `Compila tutti i privilegi (mancano ${missing.length} su ${_labSubState.features.length}).`;
    return '';
}

function _labSubProgressBarHtml() {
    const total = _labSubState.features.length;
    const done = _labSubState.features.filter(f => (f.nome || '').trim() && (f.descrizione || '').trim()).length;
    return `<div class="lab-sub-progress">
        <div class="lab-sub-progress-bar"><div class="lab-sub-progress-fill" style="width:${total ? Math.round(done/total*100) : 0}%"></div></div>
        <span class="lab-sub-progress-label">${done}/${total} privilegi compilati</span>
    </div>`;
}

window.labSubPickClass = function(slug, name) {
    if (_labSubState.parentSlug && _labSubState.parentSlug !== slug) {
        // Cambio classe: i livelli disponibili sono diversi, reset di counts e features.
        _labSubState.countsByLevel = {};
        _labSubState.features = [];
        _labSubState.currentIdx = 0;
    }
    _labSubState.parentSlug = slug;
    _labSubState.parentName = name;
    document.querySelectorAll('.lab-sub-class-card').forEach(c => c.classList.toggle('active', c.dataset.slug === slug));
    const btn = document.getElementById('labSubNextFromPick');
    if (btn) btn.disabled = false;
};

window.labSubGoToSetup = function() {
    if (!_labSubState.parentSlug) { showNotification('Seleziona una classe madre'); return; }
    _labSubState.page = 'setup';
    _labSubRender();
};

window.labSubBackFromSetup = function() {
    _labSubReadSetupFromDOM();
    _labSubState.page = 'pick-class';
    _labSubRender();
};

window.labSubGoToSpells = function() {
    _labSubReadSetupFromDOM();
    if (!(_labSubState.subclassName || '').trim()) {
        showNotification('Inserisci il nome della sottoclasse');
        return;
    }
    _labSubState.page = 'spells';
    _labSubRender();
};

window.labSubBackFromSpells = function() {
    _labSubReadSpellsFromDOM();
    _labSubState.page = 'setup';
    _labSubRender();
};

window.labSubGoToFeatures = function() {
    if (_labSubState.page === 'setup') _labSubReadSetupFromDOM();
    if (_labSubState.page === 'spells') _labSubReadSpellsFromDOM();
    if (!(_labSubState.subclassName || '').trim()) {
        showNotification('Inserisci il nome della sottoclasse');
        return;
    }
    _labSubState.page = 'features';
    _labSubRebuildFeatures();
    _labSubState.currentIdx = 0;
    _labSubRender();
};

function _labSubReadSpellsFromDOM() {
    if (!_labSubState || _labSubState.page !== 'spells') return;
    const tg = document.getElementById('labSubGrantsSpells');
    if (tg) _labSubState.grantsSpells = tg.checked;
    // I valori dei singoli input vengono salvati on-the-fly dai loro handler.
}

window.labSubToggleGrantsSpells = function(checked) {
    _labSubState.grantsSpells = checked;
    if (checked && (!_labSubState.grantedSpellsByLevel || _labSubState.grantedSpellsByLevel.length === 0)) {
        _labSubState.grantedSpellsByLevel = [{ level: (_labSubLevelsForCurrentClass()[0] || 1), spells: [] }];
    }
    _labSubRender();
};

window.labSubAddSpellRow = function() {
    if (!_labSubState.grantedSpellsByLevel) _labSubState.grantedSpellsByLevel = [];
    const used = new Set(_labSubState.grantedSpellsByLevel.map(r => r.level));
    let nextLv = 1;
    for (let lv = 1; lv <= 20; lv++) { if (!used.has(lv)) { nextLv = lv; break; } }
    _labSubState.grantedSpellsByLevel.push({ level: nextLv, spells: [] });
    _labSubRender();
};

window.labSubRemoveSpellRow = function(rowIdx) {
    if (!_labSubState.grantedSpellsByLevel) return;
    _labSubState.grantedSpellsByLevel.splice(rowIdx, 1);
    _labSubRender();
};

window.labSubAddSpellToRow = function(rowIdx) {
    const row = _labSubState.grantedSpellsByLevel?.[rowIdx];
    if (!row) return;
    _labSubOpenSpellPickerDialog(row.spells, (selected) => {
        row.spells = selected;
        _labSubRender();
    });
};

window.labSubRemoveSpell = function(rowIdx, spellIdx) {
    const row = _labSubState.grantedSpellsByLevel?.[rowIdx];
    if (!row) return;
    row.spells.splice(spellIdx, 1);
    _labSubRender();
};

window.labSubSpellRowLevelChange = function(rowIdx, val) {
    const row = _labSubState.grantedSpellsByLevel?.[rowIdx];
    if (!row) return;
    row.level = parseInt(val) || 1;
};

window.labSubToggleFeatSpells = function(checked) {
    _labSubReadCurrentFromDOM();
    const f = _labSubState.features[_labSubState.currentIdx];
    if (!f) return;
    f.grants_spells = checked;
    if (!Array.isArray(f.spells)) f.spells = [];
    _labSubRender();
};

window.labSubFeatSpellAdd = function() {
    const f = _labSubState.features[_labSubState.currentIdx];
    if (!f) return;
    if (!Array.isArray(f.spells)) f.spells = [];
    _labSubReadCurrentFromDOM();
    _labSubOpenSpellPickerDialog(f.spells, (selected) => {
        f.spells = selected;
        _labSubRender();
    });
};

window.labSubFeatSpellRemove = function(spellIdx) {
    const f = _labSubState.features[_labSubState.currentIdx];
    if (!f || !f.spells) return;
    f.spells.splice(spellIdx, 1);
    _labSubRender();
};

// ─────────────────────────────────────────────────────────────────────────
// Picker incantesimi: dialog modale che mostra la lista completa con
// ricerca, filtro per livello/scuola e selezione multipla. Restituisce
// (via callback) l'array dei nomi (italiani) selezionati.
// ─────────────────────────────────────────────────────────────────────────
function _labSubOpenSpellPickerDialog(initialSelected, onConfirm) {
    const allSpells = window.SPELLS_DATA || {};
    const allNames = Object.keys(allSpells).sort((a, b) => a.localeCompare(b, 'it'));
    if (allNames.length === 0) {
        if (typeof showNotification === 'function') showNotification('Lista incantesimi non disponibile');
        return;
    }
    // Stato locale del picker
    const state = {
        q: '',
        level: 'any',
        school: 'any',
        selected: new Set(Array.isArray(initialSelected) ? initialSelected : [])
    };
    // Raccoglie le scuole disponibili (in italiano)
    const schoolSet = new Set();
    allNames.forEach(n => {
        const s = allSpells[n]?.school_it || allSpells[n]?.school;
        if (s) schoolSet.add(s);
    });
    const schools = Array.from(schoolSet).sort((a, b) => a.localeCompare(b, 'it'));

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay lab-sub-spell-picker-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    const renderList = () => {
        const listEl = overlay.querySelector('.lab-sub-spell-picker-list');
        if (!listEl) return;
        const ql = state.q.toLowerCase().trim();
        const filtered = allNames.filter(name => {
            const sp = allSpells[name];
            if (ql) {
                const enName = (sp?.name_en || '').toLowerCase();
                if (!name.toLowerCase().includes(ql) && !enName.includes(ql)) return false;
            }
            if (state.level !== 'any') {
                const lv = parseInt(sp?.level);
                if (Number.isNaN(lv)) return false;
                if (state.level === 'cantrip' && lv !== 0) return false;
                if (state.level !== 'cantrip' && lv !== parseInt(state.level)) return false;
            }
            if (state.school !== 'any') {
                const s = sp?.school_it || sp?.school || '';
                if (s !== state.school) return false;
            }
            return true;
        });
        if (filtered.length === 0) {
            listEl.innerHTML = '<p class="scheda-empty">Nessun incantesimo trovato</p>';
            updateCounter();
            return;
        }
        const cap = 250;
        const shown = filtered.slice(0, cap);
        listEl.innerHTML = shown.map((name, idx) => {
            const sp = allSpells[name];
            const lv = parseInt(sp?.level);
            const lvLabel = Number.isNaN(lv) ? '' : (lv === 0 ? 'Tr.' : `Liv ${lv}`);
            const sch = sp?.school_it || sp?.school || '';
            const isSel = state.selected.has(name);
            return `<label class="lab-sub-spell-picker-row${isSel ? ' selected' : ''}">
                <input type="checkbox" data-name-idx="${idx}" ${isSel ? 'checked' : ''}>
                <span class="lab-sub-spell-picker-row-name">${escapeHtml(name)}</span>
                <span class="lab-sub-spell-picker-row-meta">${lvLabel}${sch ? ' · ' + escapeHtml(sch) : ''}</span>
            </label>`;
        }).join('') + (filtered.length > cap ? `<p class="scheda-empty" style="margin-top:8px;">Altri ${filtered.length - cap} risultati. Restringi la ricerca.</p>` : '');
        listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', e => {
                const idx = parseInt(e.target.dataset.nameIdx);
                const nm = shown[idx];
                if (e.target.checked) state.selected.add(nm);
                else state.selected.delete(nm);
                e.target.closest('.lab-sub-spell-picker-row')?.classList.toggle('selected', e.target.checked);
                updateCounter();
            });
        });
        updateCounter();
    };

    const updateCounter = () => {
        const c = overlay.querySelector('.lab-sub-spell-picker-count');
        if (c) c.textContent = `${state.selected.size} selezionati`;
    };

    const lvOptions = `
        <option value="any">Tutti i livelli</option>
        <option value="cantrip">Trucchetti</option>
        ${[1,2,3,4,5,6,7,8,9].map(l => `<option value="${l}">Livello ${l}</option>`).join('')}
    `;
    const schOptions = `<option value="any">Tutte le scuole</option>${schools.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}`;

    overlay.innerHTML = `<div class="hp-calc-modal lab-sub-spell-picker-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 style="margin:0 0 8px;">Scegli gli incantesimi</h3>
        <div class="lab-sub-spell-picker-controls">
            <input type="text" class="hp-calc-input lab-sub-spell-picker-search" placeholder="Cerca per nome..." autocomplete="off">
            <select class="lab-sub-spell-picker-level">${lvOptions}</select>
            <select class="lab-sub-spell-picker-school">${schOptions}</select>
        </div>
        <div class="lab-sub-spell-picker-meta">
            <span class="lab-sub-spell-picker-count">0 selezionati</span>
        </div>
        <div class="lab-sub-spell-picker-list"></div>
        <div class="dialog-actions">
            <button type="button" class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button type="button" class="btn-primary lab-sub-spell-picker-confirm">Conferma</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    const sIn = overlay.querySelector('.lab-sub-spell-picker-search');
    sIn.addEventListener('input', () => { state.q = sIn.value; renderList(); });
    const lvSel = overlay.querySelector('.lab-sub-spell-picker-level');
    lvSel.addEventListener('change', () => { state.level = lvSel.value; renderList(); });
    const schSel = overlay.querySelector('.lab-sub-spell-picker-school');
    schSel.addEventListener('change', () => { state.school = schSel.value; renderList(); });
    overlay.querySelector('.lab-sub-spell-picker-confirm').addEventListener('click', () => {
        const out = Array.from(state.selected);
        out.sort((a, b) => a.localeCompare(b, 'it'));
        overlay.remove();
        if (typeof onConfirm === 'function') onConfirm(out);
    });

    renderList();
    setTimeout(() => sIn.focus(), 50);
}

function _labSubReadSetupFromDOM() {
    if (!_labSubState || _labSubState.page !== 'setup') return;
    const sn = document.getElementById('labSubNome');
    if (sn) _labSubState.subclassName = sn.value;
}

window.labSubSetupChange = function() {
    _labSubReadSetupFromDOM();
    const btn = document.getElementById('labSubSetupNext');
    if (btn) btn.disabled = !(_labSubState.subclassName || '').trim();
};

window.labSubChangeCount = function(level, delta) {
    _labSubReadSetupFromDOM();
    const cur = parseInt(_labSubState.countsByLevel[level]) || 1;
    const next = Math.max(1, Math.min(8, cur + delta));
    _labSubState.countsByLevel[level] = next;
    const valEl = document.getElementById(`labSubCount_${level}`);
    if (valEl) valEl.textContent = next;
    // Re-render solo del blocco counts per aggiornare i bottoni −/+.
    _labSubRender();
    // Mantiene il focus dell'input nome se possibile.
    const nm = document.getElementById('labSubNome');
    if (nm) nm.focus();
};

function _labSubReadCurrentFromDOM() {
    if (!_labSubState || _labSubState.page !== 'features') return;
    const f = _labSubState.features[_labSubState.currentIdx];
    if (!f) return;
    const nm = document.getElementById('labSubFeatNome');
    if (nm) f.nome = nm.value;
    const ds = document.getElementById('labSubFeatDesc');
    if (ds) f.descrizione = ds.value;
    const hr = document.getElementById('labSubHasRes');
    if (hr) f.has_resource = hr.checked;
    if (f.has_resource) {
        const rn = document.getElementById('labSubResNome'); if (rn) f.risorsa.nome = rn.value;
        const rt = document.getElementById('labSubResTipo'); if (rt) f.risorsa.tipo = rt.value;
        const rr = document.getElementById('labSubResRecharge'); if (rr) f.risorsa.recharge = rr.value;
        const rmp = document.getElementById('labSubResMaxPreset');
        const rmm = document.getElementById('labSubResMaxManual');
        if (rmp && rmp.value) f.risorsa.max = rmp.value;
        else if (rmm) f.risorsa.max = rmm.value === '' ? '' : (parseInt(rmm.value) || 0);
        const rd = document.getElementById('labSubResDado'); if (rd) f.risorsa.dado = rd.value;
    }
    const gs = document.getElementById('labSubGrantsSpellsFeat');
    if (gs) f.grants_spells = gs.checked;
    if (f.grants_spells) {
        if (!f.spells_uses) f.spells_uses = _labSubEmptySpellsUses();
        const rch = document.getElementById('labSubFeatSpellsRecharge');
        if (rch) f.spells_uses.recharge = rch.value;
        if (f.spells_uses.recharge !== 'unlimited') {
            const mp = document.getElementById('labSubFeatSpellsMaxPreset');
            const mm = document.getElementById('labSubFeatSpellsMaxManual');
            if (mp && mp.value) f.spells_uses.max = mp.value;
            else if (mm) f.spells_uses.max = mm.value === '' ? '' : (parseInt(mm.value) || 0);
        } else {
            f.spells_uses.max = '';
        }
    }
}

window.labSubFieldChange = function() {
    _labSubReadCurrentFromDOM();
    // Aggiorna progress bar e stato bottone Crea senza re-render completo.
    const progEl = document.querySelector('.lab-sub-progress');
    if (progEl) progEl.outerHTML = _labSubProgressBarHtml();
    const btn = document.getElementById('labSubCreateBtn');
    if (btn) btn.disabled = !_labSubAllFeaturesComplete() || !(_labSubState.subclassName || '').trim();
    let hint = document.querySelector('.lab-sub-hint');
    const text = _labSubCreateHint();
    if (text) {
        if (!hint) {
            const wrap = document.querySelector('.lab-sub-actions');
            if (wrap) wrap.insertAdjacentHTML('beforeend', `<p class="lab-sub-hint">${text}</p>`);
        } else hint.textContent = text;
    } else if (hint) hint.remove();
};

window.labSubToggleResource = function(checked) {
    _labSubReadCurrentFromDOM();
    const f = _labSubState.features[_labSubState.currentIdx];
    if (f) f.has_resource = checked;
    _labSubRender();
};

window.labSubMaxPresetChange = function() {
    const preset = document.getElementById('labSubResMaxPreset');
    const manual = document.getElementById('labSubResMaxManual');
    if (!preset || !manual) return;
    if (preset.value) {
        manual.disabled = true;
        manual.value = '';
    } else {
        manual.disabled = false;
    }
    if (typeof window.labSubFieldChange === 'function') window.labSubFieldChange();
};

window.labSubFeatSpellsUsesChange = function() {
    _labSubReadCurrentFromDOM();
    // Se è cambiato il toggle "unlimited" rerendero per riflettere disabled/opacity.
    const f = _labSubState.features[_labSubState.currentIdx];
    if (!f) return;
    const wasUnlimited = (document.getElementById('labSubFeatSpellsRecharge')?.value === 'unlimited');
    // Re-render solo della sezione spells (basta un render completo, è leggero).
    _labSubRender();
};

window.labSubFeatSpellsUsesMaxPresetChange = function() {
    const preset = document.getElementById('labSubFeatSpellsMaxPreset');
    const manual = document.getElementById('labSubFeatSpellsMaxManual');
    if (!preset || !manual) return;
    if (preset.value) {
        manual.disabled = true;
        manual.value = '';
    } else {
        manual.disabled = false;
    }
    if (typeof window.labSubFeatSpellsUsesChange === 'function') window.labSubFeatSpellsUsesChange();
};

window.labSubBack = function() {
    _labSubReadCurrentFromDOM();
    if (_labSubState.currentIdx > 0) {
        _labSubState.currentIdx -= 1;
        _labSubRender();
    } else {
        // Torna allo step degli incantesimi.
        _labSubState.page = 'spells';
        _labSubRender();
    }
};

window.labSubNext = function() {
    _labSubReadCurrentFromDOM();
    if (_labSubState.currentIdx < _labSubState.features.length - 1) {
        _labSubState.currentIdx += 1;
        _labSubRender();
    }
};

window.labSaveSottoclasse = async function() {
    _labSubReadCurrentFromDOM();
    if (!(_labSubState.subclassName || '').trim()) { showNotification('Inserisci il nome della sottoclasse'); return; }
    if (!_labSubAllFeaturesComplete()) {
        showNotification('Compila nome e descrizione di tutti i privilegi prima di salvare');
        return;
    }

    // Compatta i privilegi (rimuove eventuali bozze vuote oltre quelli validi).
    const cleanFeatures = _labSubState.features
        .filter(f => (f.nome || '').trim() && (f.descrizione || '').trim())
        .map(f => {
            const out = {
                level: parseInt(f.level) || 1,
                nome: (f.nome || '').trim(),
                descrizione: (f.descrizione || '').trim()
            };
            if (f.has_resource) {
                const r = f.risorsa || {};
                const maxStr = String(r.max ?? '').trim();
                const isFormula = ['prof_bonus','cha_mod','wis_mod','int_mod','con_mod','str_mod','dex_mod'].includes(maxStr);
                out.risorsa = {
                    nome: (r.nome || out.nome).trim(),
                    max: isFormula ? maxStr : (parseInt(maxStr) || 0),
                    recharge: r.recharge || 'long_rest',
                    tipo: r.tipo || 'counter'
                };
                if (r.tipo === 'dice_pool' || r.tipo === 'portent') out.risorsa.dado = r.dado || 'd6';
            }
            if (f.grants_spells && Array.isArray(f.spells)) {
                const cleanSpells = f.spells.map(s => (s || '').trim()).filter(Boolean);
                if (cleanSpells.length) {
                    out.grants_spells = cleanSpells;
                    const su = f.spells_uses || {};
                    const rch = su.recharge || 'unlimited';
                    if (rch !== 'unlimited') {
                        const maxStr = String(su.max ?? '').trim();
                        const isFormula = ['prof_bonus','cha_mod','wis_mod','int_mod','con_mod','str_mod','dex_mod'].includes(maxStr);
                        const maxVal = isFormula ? maxStr : (parseInt(maxStr) || 0);
                        if (maxVal) {
                            out.spells_uses = { recharge: rch, max: maxVal };
                        } else {
                            out.spells_uses = { recharge: 'unlimited', max: null };
                        }
                    } else {
                        out.spells_uses = { recharge: 'unlimited', max: null };
                    }
                }
            }
            return out;
        });

    // Compatta gli incantesimi conferiti dalla sottoclasse (per livello).
    let cleanGrantedSpells = [];
    if (_labSubState.grantsSpells && Array.isArray(_labSubState.grantedSpellsByLevel)) {
        cleanGrantedSpells = _labSubState.grantedSpellsByLevel
            .map(r => ({
                level: parseInt(r.level) || 1,
                spells: (Array.isArray(r.spells) ? r.spells : []).map(s => (s || '').trim()).filter(Boolean)
            }))
            .filter(r => r.spells.length > 0)
            .sort((a, b) => a.level - b.level);
    }

    if (!AppState.currentUser?.uid) { showNotification('Errore: utente non trovato'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { showNotification('Errore: connessione DB non disponibile'); return; }

    const record = {
        nome: _labSubState.subclassName.trim(),
        parent_class_slug: _labSubState.parentSlug,
        parent_class_name: _labSubState.parentName,
        sottoclasse_features: cleanFeatures,
        granted_spells: cleanGrantedSpells,
        updated_at: new Date().toISOString()
    };

    try {
        if (_labSubState.editingId) {
            const { error } = await supabase.from('homebrew_classi').update(record).eq('id', _labSubState.editingId);
            if (error) throw error;
            showNotification('Sottoclasse aggiornata');
        } else {
            record.user_id = AppState.currentUser.uid;
            const { error } = await supabase.from('homebrew_classi').insert(record);
            if (error) throw error;
            showNotification('Sottoclasse creata');
        }
        closeHomebrewModal();
        _labSubState = null;
        loadLabContent();
        if (typeof loadHomebrewSottoclassi === 'function') loadHomebrewSottoclassi();
    } catch (err) {
        console.error('Errore salvataggio sottoclasse:', err);
        // Se le colonne non esistono ancora nel DB, mostra un messaggio chiaro.
        const msg = (err && err.message) || '';
        if (/column .* does not exist|schema cache/i.test(msg)) {
            showNotification('Colonne mancanti su DB: esegui sql/add-sottoclassi-columns.sql');
        } else {
            showNotification('Errore nel salvataggio della sottoclasse');
        }
    }
};

let _labRazzeWizardStep = 0;
const _LAB_RAZZE_STEPS = ['Identità', 'Resistenze', 'Competenze', 'Linguaggi', 'Abilità Speciali'];

function _openLabRazzeWizard(editData) {
    _labEditingId = editData?.id || null;
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;
    const p = editData || {};
    const pRes = p.resistenze || [];
    const pSkills = p.competenze_abilita || [];
    const pLangs = p.linguaggi || [];
    const pAbil = p.abilita_speciali || [];
    const langOptions = [...DND_LINGUAGGI, 'A scelta'];
    const genericAbil = pAbil.filter(a => a.tipo !== 'incantesimo');
    const innateSpells = pAbil.filter(a => a.tipo === 'incantesimo');

    _labRazzeWizardStep = 0;
    mlg.innerHTML = `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${_labEditingId ? 'Modifica Razza' : 'Nuova Razza'}</h2>
        <div class="wizard-steps" id="razzeWizardSteps">${_LAB_RAZZE_STEPS.map((s,i) => `<span class="wizard-step ${i===0?'active':''}" title="${s}"></span>`).join('')}</div>
            <div class="wizard-page active" id="hbRStep0">
                <div class="form-section-label">Identità</div>
                <div class="wizard-page-scroll">
                    <div class="form-group">
                        <label for="hbNome">Nome</label>
                        <input type="text" id="hbNome" required placeholder="Nome della razza" value="${escapeHtml(p.nome || '')}">
                    </div>
                    <div class="form-row form-row-2">
                        <div class="form-group">
                            <label for="hbTaglia">Taglia</label>
                            <select id="hbTaglia">
                                ${['Piccola','Media','Grande'].map(t => `<option value="${t}" ${(p.taglia || 'Media') === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="hbVelocita">Velocità (m)</label>
                            <input type="number" id="hbVelocita" step="1.5" value="${p.velocita || 9}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeHomebrewModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep1">
                <div class="form-section-label">Resistenze</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeResGrid">
                        ${DAMAGE_TYPES.map(dt => `<label class="scheda-checkbox-item"><input type="checkbox" value="${dt.value}" ${pRes.includes(dt.value) ? 'checked' : ''}><span>${dt.label}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep2">
                <div class="form-section-label">Competenze Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeSkillGrid">
                        ${SCHEDA_SKILLS.map(sk => `<label class="scheda-checkbox-item"><input type="checkbox" value="${sk.key}" ${pSkills.includes(sk.key) ? 'checked' : ''}><span>${sk.label}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep3">
                <div class="form-section-label">Linguaggi</div>
                <div class="wizard-page-scroll">
                    <div class="hb-checkbox-grid" id="hbRazzeLangGrid">
                        ${langOptions.map(l => `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(l)}" ${pLangs.includes(l) ? 'checked' : ''}><span>${escapeHtml(l)}</span></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labRazzeWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbRStep4">
                <div class="form-section-label">Abilità Speciali <button type="button" class="btn-icon" onclick="labRazzeAddAbilita()" title="Aggiungi abilità">＋</button></div>
                <div class="wizard-page-scroll">
                    <div id="hbRazzeAbilitaList">
                        ${genericAbil.map(a => _labRazzeAbilitaRow(a)).join('')}
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm)">Incantesimi Innati <button type="button" class="btn-icon" onclick="labRazzeAddInnato()" title="Aggiungi incantesimo innato">＋</button></div>
                    <div id="hbRazzeInnatiList">
                        ${innateSpells.map(a => _labRazzeInnatoRow(a)).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labRazzeWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labSaveRazza()">Salva</button>
                </div>
            </div>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.labRazzeWizardNav = function(dir) {
    const step = Math.max(0, Math.min(_LAB_RAZZE_STEPS.length - 1, _labRazzeWizardStep + dir));
    if (step === _labRazzeWizardStep) return;
    if (dir > 0 && _labRazzeWizardStep === 0) {
        const nome = document.getElementById('hbNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci il nome della razza'); return; }
    }
    document.getElementById(`hbRStep${_labRazzeWizardStep}`)?.classList.remove('active');
    _labRazzeWizardStep = step;
    document.getElementById(`hbRStep${step}`)?.classList.add('active');
    const stepsBar = document.getElementById('razzeWizardSteps');
    if (stepsBar) stepsBar.querySelectorAll('.wizard-step').forEach((dot, i) => dot.classList.toggle('active', i <= step));
};

window.labSaveRazza = async function() {
    const record = {
        nome: document.getElementById('hbNome')?.value?.trim(),
        taglia: document.getElementById('hbTaglia')?.value || 'Media',
        velocita: parseFloat(document.getElementById('hbVelocita')?.value) || 9,
        resistenze: Array.from(document.querySelectorAll('#hbRazzeResGrid input:checked')).map(cb => cb.value),
        competenze_abilita: Array.from(document.querySelectorAll('#hbRazzeSkillGrid input:checked')).map(cb => cb.value),
        linguaggi: Array.from(document.querySelectorAll('#hbRazzeLangGrid input:checked')).map(cb => cb.value)
    };
    if (!record.nome) { showNotification('Inserisci il nome della razza'); return; }
    const abilita = [];
    document.querySelectorAll('#hbRazzeAbilitaList .hb-action-card').forEach(card => {
        const nome = card.querySelector('.hbRAbilNome')?.value?.trim();
        if (!nome) return;
        const usi = card.querySelector('.hbRAbilUsi')?.value;
        abilita.push({
            tipo: 'abilita',
            nome,
            descrizione: card.querySelector('.hbRAbilDesc')?.value?.trim() || '',
            bonus: card.querySelector('.hbRAbilHit')?.value?.trim() || '',
            usi: usi !== '' && usi !== undefined ? parseInt(usi) : null
        });
    });
    document.querySelectorAll('#hbRazzeInnatiList .hb-action-card').forEach(card => {
        const nome = card.querySelector('.hbRInnNome')?.value?.trim();
        if (!nome) return;
        const usi = card.querySelector('.hbRInnUsi')?.value;
        abilita.push({
            tipo: 'incantesimo',
            nome,
            livello: parseInt(card.querySelector('.hbRInnLvl')?.value) || 0,
            usi: usi !== '' && usi !== undefined ? parseInt(usi) : null
        });
    });
    record.abilita_speciali = abilita;
    if (!_labEditingId) record.user_id = AppState.currentUser.id;
    try {
        if (_labEditingId) {
            const { error } = await supabase.from('homebrew_razze').update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification('Razza aggiornata!');
        } else {
            const { error } = await supabase.from('homebrew_razze').insert(record);
            if (error) throw error;
            showNotification('Razza creata!');
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (e) { showNotification('Errore: ' + e.message); }
};

function _labActionCard(data, prefix, hasDesc) {
    data = data || {};
    const nome = data.nome || '';
    const bonus = data.bonus || '';
    const usi = data.usi ?? '';
    const desc = data.descrizione || '';
    return `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" class="${prefix}Nome" placeholder="Nome" value="${escapeHtml(nome)}">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <div class="hb-action-card-row">
            <div class="form-group" style="flex:1"><label>Tiro</label><input type="text" class="${prefix}Hit" placeholder="+5" value="${escapeHtml(bonus)}"></div>
            <div class="form-group" style="width:70px"><label>Usi</label><input type="number" class="${prefix}Usi" min="0" value="${usi}" placeholder="∞" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
        </div>
        ${hasDesc ? `<textarea class="${prefix}Desc" placeholder="Descrizione..." rows="2">${escapeHtml(desc)}</textarea>` : ''}
    </div>`;
}

function _labRazzeAbilitaRow(data) {
    return _labActionCard(data, 'hbRAbil', true);
}

function _labRazzeInnatoRow(data) {
    data = data || {};
    const nome = data.nome || '';
    const livello = data.livello ?? 0;
    const usi = data.usi ?? '';
    return `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" class="hbRInnNome" placeholder="Nome incantesimo" value="${escapeHtml(nome)}">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <div class="hb-action-card-row">
            <div class="form-group" style="flex:1"><label>Livello</label><input type="number" class="hbRInnLvl" min="0" max="9" value="${livello}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
            <div class="form-group" style="width:70px"><label>Usi</label><input type="number" class="hbRInnUsi" min="0" value="${usi}" placeholder="∞" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
        </div>
    </div>`;
}

window.labRazzeAddAbilita = function() {
    const list = document.getElementById('hbRazzeAbilitaList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', _labRazzeAbilitaRow());
};

window.labRazzeAddInnato = function() {
    const list = document.getElementById('hbRazzeInnatiList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', _labRazzeInnatoRow());
};

function labFieldsBackground(data) {
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome del background" value="${escapeHtml(data?.nome || '')}">
    </div>`;
}

function labFieldsIncantesimi(data) {
    const scuole = ['Abiurazione','Ammaliamento','Divinazione','Evocazione','Illusione','Invocazione','Necromanzia','Trasmutazione'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome dell'incantesimo" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbLivello">Livello</label>
            <select id="hbLivello">
                <option value="0" ${(data?.livello ?? 0) === 0 ? 'selected' : ''}>Trucchetto</option>
                ${[1,2,3,4,5,6,7,8,9].map(l => `<option value="${l}" ${data?.livello === l ? 'selected' : ''}>${l}°</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbScuola">Scuola</label>
            <select id="hbScuola">
                <option value="">-</option>
                ${scuole.map(s => `<option value="${s}" ${data?.scuola === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTempoLancio">Tempo di Lancio</label>
            <input type="text" id="hbTempoLancio" placeholder="1 azione" value="${escapeHtml(data?.tempo_lancio || '')}">
        </div>
        <div class="form-group">
            <label for="hbGittata">Gittata</label>
            <input type="text" id="hbGittata" placeholder="36m" value="${escapeHtml(data?.gittata || '')}">
        </div>
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbComponenti">Componenti</label>
            <input type="text" id="hbComponenti" placeholder="V, S, M" value="${escapeHtml(data?.componenti || '')}">
        </div>
        <div class="form-group">
            <label for="hbDurata">Durata</label>
            <input type="text" id="hbDurata" placeholder="Istantaneo" value="${escapeHtml(data?.durata || '')}">
        </div>
    </div>
    <div class="form-group">
        <label for="hbDescrizione">Descrizione</label>
        <textarea id="hbDescrizione" rows="3" placeholder="Descrizione breve...">${escapeHtml(data?.descrizione || '')}</textarea>
    </div>`;
}

function _openLabNemiciWizard(data) {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;

    const p = data || {};
    const pSaves = p.tiri_salvezza || [];
    const pSkills = p.competenze_abilita || [];
    const pExpert = p.maestrie_abilita || [];
    const pSlots = p.slot_incantesimo || {};
    const SPELL_ABILITIES = ['intelligenza','saggezza','carisma'];
    const SPELL_AB_LABELS = { intelligenza:'Intelligenza', saggezza:'Saggezza', carisma:'Carisma' };

    window._labNemResistenze = (p.resistenze || []).slice();
    window._labNemImmunita = (p.immunita || []).slice();
    window._labNemWizardStep = 0;

    mlg.innerHTML = `
        <button class="modal-close" onclick="closeHomebrewModal()">&times;</button>
        <h2>${_labEditingId ? 'Modifica Nemico' : 'Nemico Homebrew'}</h2>
        <div class="wizard-steps">
            ${[0,1,2,3,4,5,6,7].map(i => `<div class="wizard-step ${i===0?'active':''}" data-step="${i}"></div>`).join('')}
        </div>
        <form id="labNemiciForm" onsubmit="return false;">
            <div class="wizard-page active" id="hbNStep0">
                <div class="form-section-label">Identità</div>
                <div class="form-group">
                    <label for="hbNome">Nome</label>
                    <input type="text" id="hbNome" required placeholder="Nome del nemico" value="${escapeHtml(p.nome || '')}">
                </div>
                <div class="form-group">
                    <label>Tipologia</label>
                    <button type="button" class="custom-select-trigger" id="hbTipo" data-value="${p.tipo || MONSTER_TYPES[0]}" onclick="openMonsterFieldSelect('hbTipo',MONSTER_TYPES,'Tipologia')">${p.tipo || MONSTER_TYPES[0]}</button>
                </div>
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <label>Taglia</label>
                        <button type="button" class="custom-select-trigger" id="hbTaglia" data-value="${p.taglia || 'Media'}" onclick="openMonsterFieldSelect('hbTaglia',MONSTER_SIZES,'Taglia')">${p.taglia || 'Media'}</button>
                    </div>
                    <div class="form-group">
                        <label for="hbGS">Grado Sfida</label>
                        <input type="text" id="hbGS" placeholder="1" value="${escapeHtml(p.grado_sfida || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Allineamento</label>
                    <button type="button" class="custom-select-trigger" id="hbAllineamento" data-value="${p.allineamento || MONSTER_ALIGNMENTS[0]}" onclick="openMonsterFieldSelect('hbAllineamento',MONSTER_ALIGNMENTS,'Allineamento')">${p.allineamento || MONSTER_ALIGNMENTS[0]}</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeHomebrewModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep1">
                <div class="form-section-label">Caratteristiche e Tiri Salvezza</div>
                <div class="wizard-page-scroll">
                    <div class="pg-abilities-grid">
                        ${SCHEDA_ABILITIES.map(a => {
                            const val = p[a.key] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            const fmod = mod >= 0 ? '+' + mod : '' + mod;
                            return `
                        <div class="pg-ability-block">
                            <label>${a.full}</label>
                            <div class="pg-ability-row"><input type="number" id="hb${a.key}" class="pg-ability-input" min="1" max="30" value="${val}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="labUpdateMods()"><span class="pg-ability-mod" id="hbMod_${a.key}">${fmod}</span></div>
                            <label class="pg-save-item"><input type="checkbox" id="hbSave_${a.key}" ${pSaves.includes(a.key)?'checked':''} onchange="labUpdateMods()"> <span class="pg-save-val" id="hbSaveVal_${a.key}">${fmod}</span></label>
                        </div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep2">
                <div class="form-section-label">Statistiche</div>
                <div class="wizard-page-scroll">
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label for="hbCA">CA</label><input type="number" id="hbCA" value="${p.classe_armatura || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="hbVelocita">Velocità</label><input type="number" id="hbVelocita" value="${parseFloat(p.velocita) || 9}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="hbInitMod">Mod. Iniz.</label><input type="number" id="hbInitMod" value="${p.mod_iniziativa ?? ''}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm)">Punti Vita</div>
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label>N° Dadi</label><input type="number" id="hbDadiVitaNum" min="1" value="${p.dadi_vita_num || Math.max(1, parseInt(p.grado_sfida)||1)}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="labRecalcHP()"></div>
                        <div class="form-group"><label>Dado</label><button type="button" class="custom-select-trigger" id="hbDadoVita" data-value="${p.dado_vita || _monsterSizeHitDie(p.taglia)}" onclick="openLabHitDieSelect()">${p.dado_vita ? 'd'+p.dado_vita : 'd'+_monsterSizeHitDie(p.taglia)}</button></div>
                        <div class="form-group"><label>PV Max</label><input type="number" id="hbPV" min="1" value="${p.punti_vita_max || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <p class="monster-hp-formula" id="hbHPFormula"></p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep3">
                <div class="form-section-label">Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="pg-skills-list" id="hbSkillsList">${SCHEDA_SKILLS.map(sk => {
                        const isProf = pSkills.includes(sk.key);
                        const isExp = pExpert.includes(sk.key);
                        const abilMod = Math.floor(((p[sk.ability]||10)-10)/2);
                        const bonus = _monsterProfBonus(p.grado_sfida);
                        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
                        const fval = total >= 0 ? '+' + total : '' + total;
                        return `<div class="pg-skill-item ${isProf ? 'proficient' : ''} ${isExp ? 'expert' : ''}" id="hbSkillRow_${sk.key}">
                            <span class="pg-skill-dot ${isProf ? 'active' : ''}" onclick="labToggleSkill('${sk.key}')" title="Competenza">●</span>
                            <span class="pg-skill-dot expert ${isExp ? 'active' : ''}" onclick="labToggleSkillExpert('${sk.key}')" title="Maestria">★</span>
                            <span class="pg-skill-value" id="hbSkillVal_${sk.key}">${fval}</span>
                            <span class="pg-skill-name">${sk.label}</span>
                            <span class="pg-skill-ability">(${sk.ability.substring(0, 3).toUpperCase()})</span>
                        </div>`;
                    }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep4">
                <div class="form-section-label">Resistenze e Immunità</div>
                <div class="pg-res-header"><span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span></div>
                <div class="wizard-page-scroll"><div id="hbResImmGrid" class="pg-res-grid"></div></div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep5">
                <div class="form-section-label">Azioni</div>
                <div class="wizard-page-scroll">
                    <div id="hbAttacchiList">${labRenderAttacchi(p.attacchi || [])}</div>
                    <button type="button" class="hb-add-btn" onclick="labAddAttacco()">+ Aggiungi azione</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep6">
                <div class="form-section-label">Leggendario</div>
                <div class="wizard-page-scroll">
                    <div class="form-group"><label for="hbResLegg">Resistenze Leggendarie</label><input type="number" id="hbResLegg" min="0" value="${p.resistenze_leggendarie || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group"><label for="hbAzLeggMax">Azioni Leggendarie per turno</label><input type="number" id="hbAzLeggMax" min="0" value="${p.azioni_legg_max || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group" style="margin-top:var(--spacing-sm);">
                        <label>Azioni Leggendarie</label>
                        <div id="hbAzioniLeggList">${labRenderAzioniLegg(p.azioni_leggendarie || [])}</div>
                        <button type="button" class="hb-add-btn" onclick="labAddAzioneLegg()">+ Aggiungi azione</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="labNemWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="hbNStep7">
                <div class="form-section-label">Incantesimi (opzionale)</div>
                <div class="wizard-page-scroll">
                    <div class="form-group">
                        <label>Caratteristica da incantatore</label>
                        <button type="button" class="custom-select-trigger" id="hbCarInc" data-value="${p.caratteristica_incantatore || ''}" onclick="openSpellAbilitySelect('hbCarInc')">${p.caratteristica_incantatore ? SPELL_AB_LABELS[p.caratteristica_incantatore] : 'Nessuna'}</button>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm);">Slot per livello</div>
                    <div class="hb-stats-grid">
                        ${[1,2,3,4,5,6,7,8,9].map(lv => `<div class="form-group"><label>Lv ${lv}</label><input type="number" id="hbSlot${lv}" min="0" value="${pSlots[lv]?.max || 0}"></div>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="labNemWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="saveLabNemico()">${_labEditingId ? 'Salva' : 'Crea'}</button>
                </div>
            </div>
        </form>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function labFieldsNemici(data) { return ''; }

window.labNemWizardNav = function(dir) {
    if (dir > 0 && window._labNemWizardStep === 0) {
        const nome = document.getElementById('hbNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci un nome'); return; }
    }
    const total = 8, maxStep = total - 1;
    window._labNemWizardStep = Math.max(0, Math.min(maxStep, (window._labNemWizardStep || 0) + dir));
    const step = window._labNemWizardStep;
    for (let i = 0; i <= maxStep; i++) {
        const page = document.getElementById(`hbNStep${i}`);
        if (page) page.classList.toggle('active', i === step);
    }
    if (step === 1) labUpdateMods();
    if (step === 2) labAutoCompileStats();
    if (step === 3) labUpdateSkillValues();
    if (step === 4) labRenderResImmGrid();
    const modal = document.getElementById('homebrewModal');
    if (modal) modal.querySelectorAll('.wizard-step').forEach((dot, i) => dot.classList.toggle('active', i <= step));
};

window.labNemToggleRes = function(val, checked) {
    if (!window._labNemResistenze) window._labNemResistenze = [];
    if (checked) { if (!window._labNemResistenze.includes(val)) window._labNemResistenze.push(val); }
    else { window._labNemResistenze = window._labNemResistenze.filter(r => r !== val); }
};
window.labNemToggleImm = function(val, checked) {
    if (!window._labNemImmunita) window._labNemImmunita = [];
    if (checked) { if (!window._labNemImmunita.includes(val)) window._labNemImmunita.push(val); }
    else { window._labNemImmunita = window._labNemImmunita.filter(r => r !== val); }
};

function labRenderAttacchi(attacchi) {
    if (!attacchi.length) return '';
    return attacchi.map((a, i) => _monsterActionCard(a, i, 'hb')).join('');
}

function labRenderAzioniLegg(azioni) {
    if (!azioni || !azioni.length) return '';
    return azioni.map((a, i) => `<div class="hb-action-card" data-idx="${i}">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" value="${escapeHtml(a.nome || '')}" class="hbLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="hbLeggDesc" placeholder="Descrizione..." rows="2">${escapeHtml(a.descrizione || '')}</textarea>
    </div>`).join('');
}

window.labAddAzioneLegg = function() {
    const list = document.getElementById('hbAzioniLeggList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" class="hbLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="hbLeggDesc" placeholder="Descrizione..." rows="2"></textarea>
    </div>`);
};

window.labAddAttacco = function() {
    const list = document.getElementById('hbAttacchiList');
    if (!list) return;
    const idx = list.querySelectorAll('.hb-action-card').length;
    list.insertAdjacentHTML('beforeend', _monsterActionCard({}, idx, 'hb'));
};

window.openLabHitDieSelect = function() {
    const dieOptions = [4,6,8,10,12,20].map(d => ({ value: String(d), label: 'd' + d }));
    openCustomSelect(dieOptions, (value) => {
        const btn = document.getElementById('hbDadoVita');
        if (btn) { btn.dataset.value = value; btn.textContent = 'd' + value; }
        labRecalcHP();
    }, 'Dado Vita');
};

window.labRecalcHP = function() {
    const numDice = parseInt(document.getElementById('hbDadiVitaNum')?.value) || 1;
    const die = parseInt(document.getElementById('hbDadoVita')?.dataset?.value) || 8;
    const con = parseInt(document.getElementById('hbcostituzione')?.value) || 10;
    const conMod = Math.floor((con - 10) / 2);
    const avgDie = (die + 1) / 2;
    const hp = Math.floor(numDice * avgDie + numDice * conMod);
    const pvInput = document.getElementById('hbPV');
    if (pvInput) pvInput.value = Math.max(1, hp);
    const formula = document.getElementById('hbHPFormula');
    if (formula) {
        const conPart = conMod !== 0 ? ` ${conMod > 0 ? '+' : '−'} ${Math.abs(numDice * conMod)}` : '';
        formula.textContent = `${numDice}d${die}${conPart} = ${Math.max(1, hp)} PV`;
    }
};

window.labAutoCompileStats = function() {
    const dex = parseInt(document.getElementById('hbdestrezza')?.value) || 10;
    const initInput = document.getElementById('hbInitMod');
    if (initInput && !initInput.dataset.userEdited) initInput.value = Math.floor((dex - 10) / 2);

    const taglia = document.getElementById('hbTaglia')?.dataset?.value || 'Media';
    const dieBtn = document.getElementById('hbDadoVita');
    if (dieBtn && !dieBtn.dataset.userEdited) {
        const die = _monsterSizeHitDie(taglia);
        dieBtn.dataset.value = die;
        dieBtn.textContent = 'd' + die;
    }

    const gs = parseInt(document.getElementById('hbGS')?.value) || 1;
    const numInput = document.getElementById('hbDadiVitaNum');
    if (numInput && !numInput.dataset.userEdited) numInput.value = Math.max(1, gs);

    labRecalcHP();
};

window.labUpdateMods = function() {
    const gs = document.getElementById('hbGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_ABILITIES.forEach(a => {
        const val = parseInt(document.getElementById(`hb${a.key}`)?.value) || 10;
        const mod = Math.floor((val - 10) / 2);
        const fmod = mod >= 0 ? '+' + mod : '' + mod;
        const modEl = document.getElementById(`hbMod_${a.key}`);
        if (modEl) {
            modEl.textContent = fmod;
            modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
        }
        const cb = document.getElementById(`hbSave_${a.key}`);
        const saveEl = document.getElementById(`hbSaveVal_${a.key}`);
        if (saveEl) {
            const saveTot = mod + (cb?.checked ? bonus : 0);
            saveEl.textContent = saveTot >= 0 ? '+' + saveTot : '' + saveTot;
        }
    });
    labUpdateSkillValues();
};

window.labUpdateSkillValues = function() {
    const gs = document.getElementById('hbGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_SKILLS.forEach(sk => {
        const row = document.getElementById(`hbSkillRow_${sk.key}`);
        if (!row) return;
        const abilVal = parseInt(document.getElementById(`hb${sk.ability}`)?.value) || 10;
        const abilMod = Math.floor((abilVal - 10) / 2);
        const isProf = row.classList.contains('proficient');
        const isExp = row.classList.contains('expert');
        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
        const valEl = document.getElementById(`hbSkillVal_${sk.key}`);
        if (valEl) valEl.textContent = total >= 0 ? '+' + total : '' + total;
    });
};

window.labToggleSkill = function(skillKey) {
    const row = document.getElementById(`hbSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    const isActive = dot?.classList.toggle('active');
    row.classList.toggle('proficient', isActive);
    if (!isActive) {
        const star = row.querySelector('.pg-skill-dot.expert');
        if (star) star.classList.remove('active');
        row.classList.remove('expert');
    }
    labUpdateSkillValues();
};

window.labToggleSkillExpert = function(skillKey) {
    const row = document.getElementById(`hbSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    if (!dot?.classList.contains('active')) {
        dot?.classList.add('active');
        row.classList.add('proficient');
    }
    const star = row.querySelector('.pg-skill-dot.expert');
    const isActive = star?.classList.toggle('active');
    row.classList.toggle('expert', isActive);
    labUpdateSkillValues();
};

function labRenderResImmGrid() {
    const container = document.getElementById('hbResImmGrid');
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = (window._labNemResistenze || []).includes(dt.value);
        const isImm = (window._labNemImmunita || []).includes(dt.value);
        return `<div class="pg-res-row"><span class="pg-res-label">${dt.label}</span><input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="labNemToggleRes('${dt.value}', this.checked)"><input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="labNemToggleImm('${dt.value}', this.checked)"></div>`;
    }).join('');
}

window.saveLabNemico = async function() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    if (!AppState.currentUser?.uid) { showNotification('Errore: utente non trovato'); return; }

    const nome = document.getElementById('hbNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }

    const record = {
        nome,
        updated_at: new Date().toISOString(),
        tipo: document.getElementById('hbTipo')?.dataset?.value || null,
        taglia: document.getElementById('hbTaglia')?.dataset?.value || 'Media',
        allineamento: document.getElementById('hbAllineamento')?.dataset?.value || null,
        classe_armatura: parseInt(document.getElementById('hbCA')?.value) || 10,
        punti_vita_max: parseInt(document.getElementById('hbPV')?.value) || 10,
        grado_sfida: document.getElementById('hbGS')?.value?.trim() || '0',
        velocita: document.getElementById('hbVelocita')?.value?.trim() || '9',
        forza: parseInt(document.getElementById('hbforza')?.value) || 10,
        destrezza: parseInt(document.getElementById('hbdestrezza')?.value) || 10,
        costituzione: parseInt(document.getElementById('hbcostituzione')?.value) || 10,
        intelligenza: parseInt(document.getElementById('hbintelligenza')?.value) || 10,
        saggezza: parseInt(document.getElementById('hbsaggezza')?.value) || 10,
        carisma: parseInt(document.getElementById('hbcarisma')?.value) || 10,
        tiri_salvezza: SCHEDA_ABILITIES.filter(a => document.getElementById(`hbSave_${a.key}`)?.checked).map(a => a.key),
        competenze_abilita: SCHEDA_SKILLS.filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('proficient')).map(sk => sk.key),
        maestrie_abilita: SCHEDA_SKILLS.filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('expert')).map(sk => sk.key),
        dadi_vita_num: parseInt(document.getElementById('hbDadiVitaNum')?.value) || 1,
        dado_vita: parseInt(document.getElementById('hbDadoVita')?.dataset?.value) || 8,
        resistenze: window._labNemResistenze || [],
        immunita: window._labNemImmunita || [],
        mod_iniziativa: parseInt(document.getElementById('hbInitMod')?.value) || null,
        resistenze_leggendarie: parseInt(document.getElementById('hbResLegg')?.value) || 0,
        azioni_legg_max: parseInt(document.getElementById('hbAzLeggMax')?.value) || 0,
        caratteristica_incantatore: document.getElementById('hbCarInc')?.dataset?.value || null,
    };

    record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-action-card')].map(card => {
        const usiVal = card.querySelector('.hbAtkUsiMax')?.value;
        const usiMax = usiVal !== '' && usiVal !== undefined ? (parseInt(usiVal) || 0) : 0;
        return {
            nome: card.querySelector('.hbAtkNome')?.value || '',
            bonus: card.querySelector('.hbAtkBonus')?.value || '',
            danno: card.querySelector('.hbAtkDanno')?.value || '',
            descrizione: card.querySelector('.hbAtkDesc')?.value || '',
            usi_max: usiMax
        };
    }).filter(a => a.nome);

    record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-action-card')].map(card => ({
        nome: card.querySelector('.hbLeggNome')?.value || '',
        descrizione: card.querySelector('.hbLeggDesc')?.value || ''
    })).filter(a => a.nome);

    const carInc = record.caratteristica_incantatore;
    let slotInc = null;
    if (carInc) {
        slotInc = {};
        for (let lv = 1; lv <= 9; lv++) {
            const max = parseInt(document.getElementById(`hbSlot${lv}`)?.value) || 0;
            if (max > 0) slotInc[lv] = { max, current: max };
        }
        if (Object.keys(slotInc).length === 0) slotInc = null;
    }
    record.slot_incantesimo = slotInc;

    try {
        if (_labEditingId) {
            const { error } = await supabase.from('homebrew_nemici').update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification('Nemico aggiornato');
        } else {
            record.user_id = AppState.currentUser.uid;
            const { error } = await supabase.from('homebrew_nemici').insert(record);
            if (error) throw error;
            showNotification('Nemico creato');
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (err) {
        console.error('Errore salvataggio nemico:', err);
        showNotification('Errore nel salvataggio');
    }
};

function labFieldsTalenti(data) {
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome del talento" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-group">
        <label for="hbPrerequisiti">Prerequisiti</label>
        <input type="text" id="hbPrerequisiti" placeholder="Es. Forza 13+" value="${escapeHtml(data?.prerequisiti || '')}">
    </div>
    <div class="form-group">
        <label for="hbEffetti">Effetti</label>
        <textarea id="hbEffetti" rows="3" placeholder="Descrizione degli effetti...">${escapeHtml(data?.effetti || '')}</textarea>
    </div>`;
}

function labFieldsOggetti(data) {
    const tipi = ['Arma','Armatura','Pozione','Pergamena','Anello','Bacchetta','Bastone','Oggetto Meraviglioso','Altro'];
    const rarita = ['Comune','Non Comune','Raro','Molto Raro','Leggendario','Artefatto'];
    return `
    <div class="form-group">
        <label for="hbNome">Nome</label>
        <input type="text" id="hbNome" required placeholder="Nome dell'oggetto" value="${escapeHtml(data?.nome || '')}">
    </div>
    <div class="form-row form-row-2">
        <div class="form-group">
            <label for="hbTipoOgg">Tipo</label>
            <select id="hbTipoOgg">
                <option value="">-</option>
                ${tipi.map(t => `<option value="${t}" ${data?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="hbRarita">Rarità</label>
            <select id="hbRarita">
                ${rarita.map(r => `<option value="${r}" ${(data?.rarita || 'Comune') === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
        </div>
    </div>
    <div class="form-group">
        <label for="hbProprieta">Proprietà</label>
        <textarea id="hbProprieta" rows="3" placeholder="Descrizione proprietà...">${escapeHtml(data?.proprieta || '')}</textarea>
    </div>`;
}

// ============================================================================
// MODAL OPEN / CLOSE / SAVE
// ============================================================================

window.openHomebrewModal = function(editData) {
    _labEditingId = editData?.id || null;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    if (_labCurrentTab === 'nemici') {
        _openLabNemiciWizard(editData);
        return;
    }
    if (_labCurrentTab === 'razze') {
        _openLabRazzeWizard(editData);
        return;
    }
    if (_labCurrentTab === 'classi') {
        _openLabSottoclasseWizard(editData);
        return;
    }

    const modal = document.getElementById('homebrewModal');
    _restoreHomebrewModalStructure();
    const title = document.getElementById('homebrewModalTitle');
    const content = document.getElementById('homebrewFormContent');
    const saveBtn = document.getElementById('saveHomebrewBtn');

    title.textContent = _labEditingId ? `Modifica ${cat.label}` : `${cat.label} Homebrew`;
    saveBtn.textContent = _labEditingId ? 'Salva' : 'Crea';
    content.innerHTML = cat.fields(editData);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

const _HOMEBREW_MODAL_ORIGINAL_HTML = null;

function _restoreHomebrewModalStructure() {
    const modal = document.getElementById('homebrewModal');
    if (!modal) return;
    const mlg = modal.querySelector('.modal-content-lg');
    if (!mlg) return;
    if (!document.getElementById('homebrewForm')) {
        mlg.innerHTML = `
            <button class="modal-close" id="closeHomebrewModal">&times;</button>
            <h2 id="homebrewModalTitle">Nuovo Contenuto</h2>
            <form id="homebrewForm">
                <div id="homebrewFormContent"></div>
                <div class="form-actions" id="homebrewDefaultActions">
                    <button type="button" class="btn-secondary" id="cancelHomebrewBtn">Annulla</button>
                    <button type="submit" class="btn-primary" id="saveHomebrewBtn">Crea</button>
                </div>
            </form>`;
        document.getElementById('closeHomebrewModal')?.addEventListener('click', closeHomebrewModal);
        document.getElementById('cancelHomebrewBtn')?.addEventListener('click', closeHomebrewModal);
        document.getElementById('homebrewForm')?.addEventListener('submit', handleSaveHomebrew);
        document.getElementById('homebrewForm')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    }
}

window.closeHomebrewModal = function() {
    const modal = document.getElementById('homebrewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        _labEditingId = null;
        _labSubState = null;
    }
};

window.labEditItem = async function(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;
    const { data, error } = await supabase.from(cat.table).select('*').eq('id', id).single();
    if (error || !data) { showNotification('Errore nel caricamento'); return; }
    openHomebrewModal(data);
};

window.labDeleteItem = async function(id) {
    const confirmed = await showConfirm('Eliminare questo contenuto homebrew?');
    if (!confirmed) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;
    const { error } = await supabase.from(cat.table).delete().eq('id', id);
    if (error) { showNotification('Errore nella cancellazione'); return; }
    showNotification('Eliminato');
    loadLabContent();
    if (cat.table === 'homebrew_classi' && typeof loadHomebrewSottoclassi === 'function') {
        loadHomebrewSottoclassi();
    }
};

async function handleSaveHomebrew(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const cat = LAB_CATEGORIES[_labCurrentTab];
    if (!cat) return;

    const nome = document.getElementById('hbNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }

    if (!AppState.currentUser?.uid) { showNotification('Errore: utente non trovato'); return; }

    const saveBtn = document.getElementById('saveHomebrewBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    let record = { nome, updated_at: new Date().toISOString() };

    switch (_labCurrentTab) {
        case 'classi':
            // Le sottoclassi sono salvate dal wizard dedicato (labSaveSottoclasse)
            return;
        case 'razze':
            break;
        case 'background':
            break;
        case 'incantesimi':
            record.livello = parseInt(document.getElementById('hbLivello')?.value) || 0;
            record.scuola = document.getElementById('hbScuola')?.value || null;
            record.tempo_lancio = document.getElementById('hbTempoLancio')?.value?.trim() || null;
            record.gittata = document.getElementById('hbGittata')?.value?.trim() || null;
            record.componenti = document.getElementById('hbComponenti')?.value?.trim() || null;
            record.durata = document.getElementById('hbDurata')?.value?.trim() || null;
            record.descrizione = document.getElementById('hbDescrizione')?.value?.trim() || null;
            break;
        case 'nemici':
            record.tipo = document.getElementById('hbTipo')?.dataset?.value || document.getElementById('hbTipo')?.value || null;
            record.taglia = document.getElementById('hbTaglia')?.dataset?.value || document.getElementById('hbTaglia')?.value || 'Media';
            record.allineamento = document.getElementById('hbAllineamento')?.dataset?.value || null;
            record.classe_armatura = parseInt(document.getElementById('hbCA')?.value) || 10;
            record.punti_vita_max = parseInt(document.getElementById('hbPV')?.value) || 10;
            record.grado_sfida = document.getElementById('hbGS')?.value?.trim() || '0';
            record.velocita = document.getElementById('hbVelocita')?.value?.trim() || '9m';
            record.forza = parseInt(document.getElementById('hbFor')?.value) || 10;
            record.destrezza = parseInt(document.getElementById('hbDes')?.value) || 10;
            record.costituzione = parseInt(document.getElementById('hbCos')?.value) || 10;
            record.intelligenza = parseInt(document.getElementById('hbInt')?.value) || 10;
            record.saggezza = parseInt(document.getElementById('hbSag')?.value) || 10;
            record.carisma = parseInt(document.getElementById('hbCar')?.value) || 10;
            record.tiri_salvezza = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma']
                .filter(s => document.getElementById(`hbSave_${s}`)?.checked);
            record.competenze_abilita = SCHEDA_SKILLS
                .filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('proficient')).map(sk => sk.key);
            record.maestrie_abilita = SCHEDA_SKILLS
                .filter(sk => document.getElementById(`hbSkillRow_${sk.key}`)?.classList.contains('expert')).map(sk => sk.key);
            record.resistenze = window._labNemResistenze || [];
            record.immunita = window._labNemImmunita || [];
            record.attacchi = [...document.querySelectorAll('#hbAttacchiList .hb-action-card')].map(card => {
                const usiVal = card.querySelector('.hbAtkUsiMax')?.value;
                const usiMax = usiVal !== '' && usiVal !== undefined ? (parseInt(usiVal) || 0) : 0;
                return {
                    nome: card.querySelector('.hbAtkNome')?.value || '',
                    bonus: card.querySelector('.hbAtkBonus')?.value || '',
                    danno: card.querySelector('.hbAtkDanno')?.value || '',
                    descrizione: card.querySelector('.hbAtkDesc')?.value || '',
                    usi_max: usiMax
                };
            }).filter(a => a.nome);
            record.resistenze_leggendarie = parseInt(document.getElementById('hbResLegg')?.value) || 0;
            record.azioni_legg_max = parseInt(document.getElementById('hbAzLeggMax')?.value) || 0;
            record.azioni_leggendarie = [...document.querySelectorAll('#hbAzioniLeggList .hb-action-card')].map(card => ({
                nome: card.querySelector('.hbLeggNome')?.value || '',
                descrizione: card.querySelector('.hbLeggDesc')?.value || ''
            })).filter(a => a.nome);
            record.caratteristica_incantatore = document.getElementById('hbCarInc')?.dataset?.value || null;
            {
                const carInc = record.caratteristica_incantatore;
                let slotInc = null;
                if (carInc) {
                    slotInc = {};
                    for (let lv = 1; lv <= 9; lv++) {
                        const max = parseInt(document.getElementById(`hbSlot${lv}`)?.value) || 0;
                        if (max > 0) slotInc[lv] = { max, current: max };
                    }
                    if (Object.keys(slotInc).length === 0) slotInc = null;
                }
                record.slot_incantesimo = slotInc;
            }
            break;
        case 'talenti':
            record.prerequisiti = document.getElementById('hbPrerequisiti')?.value?.trim() || null;
            record.effetti = document.getElementById('hbEffetti')?.value?.trim() || null;
            break;
        case 'oggetti':
            record.tipo = document.getElementById('hbTipoOgg')?.value || null;
            record.rarita = document.getElementById('hbRarita')?.value || 'Comune';
            record.proprieta = document.getElementById('hbProprieta')?.value?.trim() || null;
            break;
    }

    try {
        if (_labEditingId) {
            const { error } = await supabase.from(cat.table).update(record).eq('id', _labEditingId);
            if (error) throw error;
            showNotification(`${cat.label} aggiornato`);
        } else {
            record.user_id = AppState.currentUser.uid;
            const { error } = await supabase.from(cat.table).insert(record);
            if (error) throw error;
            showNotification(`${cat.label} creato`);
        }
        closeHomebrewModal();
        loadLabContent();
    } catch (err) {
        console.error('Errore salvataggio homebrew:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _labEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// SETTINGS PAGE
// ============================================================================

async function labRenderSettings() {
    const container = document.getElementById('labContent');
    if (!container) return;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser?.uid) {
        container.innerHTML = '<div class="lab-empty">Accedi per gestire le impostazioni</div>';
        return;
    }

    container.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const userData = await findUserByUid(AppState.currentUser.uid);
    if (!userData) { container.innerHTML = '<div class="lab-empty">Errore</div>'; return; }

    const hbSettings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    const isEnabled = hbSettings.enabled !== false;

    const { data: amici } = await supabase.rpc('get_amici');
    const amiciList = amici || [];

    const amiciHtml = amiciList.length > 0 ? amiciList.map(a => {
        const checked = (hbSettings.amici_abilitati || []).includes(a.amico_id) ? 'checked' : '';
        return `<label class="lab-settings-friend">
            <input type="checkbox" value="${a.amico_id}" ${checked} onchange="labToggleFriendHb(this)">
            <span>${escapeHtml(a.nome_utente || 'Amico')}${a.cid ? ' #' + a.cid : ''}</span>
        </label>`;
    }).join('') : '<p class="lab-empty" style="padding:8px 0;">Nessun amico aggiunto</p>';

    container.innerHTML = `
    <div class="lab-settings">
        <div class="lab-settings-section">
            <div class="lab-settings-row">
                <span class="lab-settings-label">Mostra contenuti homebrew</span>
                <label class="lab-toggle">
                    <input type="checkbox" id="labHbEnabled" ${isEnabled ? 'checked' : ''} onchange="labToggleHbEnabled(this)">
                    <span class="lab-toggle-slider"></span>
                </label>
            </div>
            <p class="lab-settings-hint">Quando attivo, i contenuti homebrew tuoi e degli amici selezionati saranno visibili durante la creazione dei personaggi.</p>
        </div>

        <div class="lab-settings-section">
            <div class="lab-settings-section-title">Homebrew degli amici</div>
            <p class="lab-settings-hint">Seleziona gli amici di cui vuoi visualizzare i contenuti homebrew.</p>
            <div class="lab-settings-friends" id="labFriendsList">
                ${amiciHtml}
            </div>
        </div>
    </div>`;
}

window.labToggleHbEnabled = async function(cb) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;
    const settings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    settings.enabled = cb.checked;
    await supabase.from('utenti').update({ homebrew_settings: settings, updated_at: new Date().toISOString() }).eq('id', userData.id);
    userData.homebrew_settings = settings;
    if (typeof loadHomebrewSottoclassi === 'function') loadHomebrewSottoclassi();
};

window.labToggleFriendHb = async function(cb) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;
    const settings = userData.homebrew_settings || { enabled: false, amici_abilitati: [] };
    if (!settings.amici_abilitati) settings.amici_abilitati = [];
    const friendId = cb.value;
    if (cb.checked) {
        if (!settings.amici_abilitati.includes(friendId)) settings.amici_abilitati.push(friendId);
    } else {
        settings.amici_abilitati = settings.amici_abilitati.filter(id => id !== friendId);
    }
    await supabase.from('utenti').update({ homebrew_settings: settings, updated_at: new Date().toISOString() }).eq('id', userData.id);
    userData.homebrew_settings = settings;
    if (typeof loadHomebrewSottoclassi === 'function') loadHomebrewSottoclassi();
};

// ============================================================================
// VIEW NEMICO (scheda read-only in modal)
// ============================================================================

window.labViewNemico = async function(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('homebrew_nemici').select('*').eq('id', id).single();
    if (!m) return;

    const fMod = (v) => { const mod = Math.floor(((v||10)-10)/2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const bonusComp = Math.max(2, Math.floor(((parseInt(m.grado_sfida)||0)-1)/4)+2);
    const saves = m.tiri_salvezza || [];
    const skills = m.competenze_abilita || [];

    const resistenzeHtml = (m.resistenze?.length) ? m.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r)}</span>`).join('') : '';
    const immunitaHtml = (m.immunita?.length) ? m.immunita.map(r => `<span class="scheda-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">${escapeHtml(r)}</span>`).join('') : '';

    const attacks = m.attacchi || [];
    const attacksHtml = attacks.length > 0 ? attacks.map(a => {
        const hasUsi = a.usi_max > 0;
        const usiPips = hasUsi ? `<span class="monster-action-uses">${Array.from({length: a.usi_max}, () =>
            `<span class="monster-action-use-pip filled"></span>`).join('')}</span>` : '';
        return `<div class="monster-attack-row"><span class="monster-attack-name">${escapeHtml(a.nome)}</span><span class="monster-attack-hit">${escapeHtml(a.bonus || '')}</span><span class="monster-attack-dmg">${escapeHtml(a.danno || '')}</span>${usiPips}</div>`;
    }).join('') : '';

    const leggActions = m.azioni_leggendarie || [];
    const leggActionsHtml = leggActions.length > 0 ? leggActions.map(a =>
        `<div class="monster-legg-row"><span class="monster-legg-name">${escapeHtml(a.nome)}</span><span class="monster-legg-desc">${escapeHtml(a.descrizione || '')}</span></div>`
    ).join('') : '';

    const resLeggMax = m.resistenze_leggendarie || 0;
    const azLeggMax = m.azioni_legg_max || 0;

    const expert = m.maestrie_abilita || [];
    const skillsHtml = skills.length > 0 ? SCHEDA_SKILLS.filter(sk => skills.includes(sk.key)).map(sk => {
        const abilityMod = Math.floor(((m[sk.ability]||10)-10)/2);
        const isExp = expert.includes(sk.key);
        const total = abilityMod + bonusComp + (isExp ? bonusComp : 0);
        const expLabel = isExp ? ' ★' : '';
        return `<span class="scheda-tag">${sk.label} ${total >= 0 ? '+' + total : total}${expLabel}</span>`;
    }).join('') : '';

    let spellHtml = '';
    const slots = m.slot_incantesimo;
    const hasSpells = slots && typeof slots === 'object' && Object.keys(slots).length > 0;
    if (hasSpells) {
        const carInc = m.caratteristica_incantatore;
        const incVal = m[carInc] || 10;
        const incMod = Math.floor((incVal - 10) / 2);
        const atkBonus = incMod + bonusComp;
        const dc = 8 + bonusComp + incMod;
        const levels = Object.keys(slots).map(Number).sort((a,b) => a-b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const pips = Array.from({length: s.max}, () => `<span class="scheda-slot-pip filled"></span>`).join('');
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips}</div><span class="scheda-slot-count">${s.max}/${s.max}</span></div>`;
        }).join('');
        spellHtml = `
            <div class="combat-section-label">Incantesimi</div>
            <div class="scheda-three-boxes" style="margin-bottom:10px;">
                <div class="scheda-box"><div class="scheda-box-val">${incMod >= 0 ? '+'+incMod : incMod}</div><div class="scheda-box-label">${(carInc||'').substring(0,3).toUpperCase()}</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>
            </div>
            <div class="scheda-slots-table">${slotsHtml}</div>`;
    }

    const modal = document.getElementById('homebrewModal');
    const content = modal?.querySelector('.modal-content-lg');
    if (!content) return;

    content.innerHTML = `
        <h2 style="flex-shrink:0;">${escapeHtml(m.nome)} <button class="modal-close" onclick="closeHomebrewModal()">&times;</button></h2>
        <div style="flex:1;overflow-y:auto;padding:0 2px;">
            <p style="color:var(--text-secondary);margin:0 0 12px;font-size:0.85rem;">${escapeHtml(m.tipologia||'')} · ${escapeHtml(m.taglia||'Media')} · GS ${m.grado_sfida||0}</p>
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${m.classe_armatura||10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.punti_vita_max||10}</div><div class="scheda-box-label">PV</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.velocita||9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            ${m.mod_iniziativa != null ? `<p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin:6px 0;">Mod. Iniziativa: ${m.mod_iniziativa >= 0 ? '+' + m.mod_iniziativa : m.mod_iniziativa}</p>` : ''}
            <div class="combat-abilities-grid" style="margin:12px 0;">
                ${SCHEDA_ABILITIES.map(a => {
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor(((m[a.key]||10)-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${m[a.key]||10}</span><span class="combat-ability-mod">${fMod(m[a.key])}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${skillsHtml ? `<div class="combat-section-label">Competenze</div><div class="scheda-tags">${skillsHtml}</div>` : ''}
            ${attacksHtml ? `<div class="combat-section-label">Azioni</div><div class="monster-attacks-list">${attacksHtml}</div>` : ''}
            ${resLeggMax > 0 ? `<div class="combat-section-label">Resistenze Leggendarie</div><div class="monster-res-legg-counter">${Array.from({length: resLeggMax}, () => `<span class="monster-res-legg-pip filled"></span>`).join('')}<span class="monster-res-legg-label">${resLeggMax}/${resLeggMax}</span></div>` : ''}
            ${azLeggMax > 0 || leggActionsHtml ? `<div class="combat-section-label">Azioni Leggendarie${azLeggMax > 0 ? ` (${azLeggMax}/turno)` : ''}</div>` : ''}
            ${leggActionsHtml ? `<div class="monster-legg-list">${leggActionsHtml}</div>` : ''}
            ${resistenzeHtml ? `<div class="combat-section-label">Resistenze</div><div class="scheda-tags">${resistenzeHtml}</div>` : ''}
            ${immunitaHtml ? `<div class="combat-section-label">Immunità</div><div class="scheda-tags">${immunitaHtml}</div>` : ''}
            ${spellHtml}
        </div>`;

    modal.style.display = 'flex';
};

// ============================================================================
// INIT BINDINGS (called from init.js)
// ============================================================================

function initLaboratorio() {
    labRenderHub();

    const addBtn = document.getElementById('addHomebrewBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openHomebrewModal());
    }

    const closeBtn = document.getElementById('closeHomebrewModal');
    if (closeBtn) closeBtn.addEventListener('click', closeHomebrewModal);

    const cancelBtn = document.getElementById('cancelHomebrewBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeHomebrewModal);

    const modal = document.getElementById('homebrewModal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeHomebrewModal(); });
    }

    const form = document.getElementById('homebrewForm');
    if (form) {
        form.addEventListener('submit', handleSaveHomebrew);
        form.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    }
}
