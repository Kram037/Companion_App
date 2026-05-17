// ============================================================================
// COMPENDIO - D&D reference browser
// ============================================================================

let _compCurrentTab = 'classi';
window._compState = window._compState || {};

const COMP_TABS = {
    classi: { label: 'Classi', icon: 'book-open' },
    sottoclassi: { label: 'Sottoclassi', icon: 'layers' },
    razze: { label: 'Razze', icon: 'users' },
    background: { label: 'Background', icon: 'scroll' },
    talenti: { label: 'Talenti', icon: 'star' },
    stili: { label: 'Stili di Combattimento', icon: 'shield' },
    suppliche: { label: 'Suppliche Occulte', icon: 'sparkles' },
    incantesimi: { label: 'Incantesimi', icon: 'wand' },
};

const COMP_MULTICLASS_REQUIREMENTS = {
    Artefice: 'Intelligenza 13',
    Barbaro: 'Forza 13',
    Bardo: 'Carisma 13',
    Chierico: 'Saggezza 13',
    Druido: 'Saggezza 13',
    Guerriero: 'Forza 13 o Destrezza 13',
    Ladro: 'Destrezza 13',
    Mago: 'Intelligenza 13',
    Monaco: 'Destrezza 13 e Saggezza 13',
    Paladino: 'Forza 13 e Carisma 13',
    Ranger: 'Destrezza 13 e Saggezza 13',
    Stregone: 'Carisma 13',
    Warlock: 'Carisma 13',
};

const COMP_MULTICLASS_PROFICIENCIES = {
    Artefice: 'Armature leggere, armature medie, scudi, arnesi da scasso, attrezzi da inventore',
    Barbaro: 'Scudi, armi semplici, armi da guerra',
    Bardo: 'Armature leggere, una abilita a scelta, uno strumento musicale a scelta',
    Chierico: 'Armature leggere, armature medie, scudi',
    Druido: 'Armature leggere, armature medie, scudi',
    Guerriero: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra',
    Ladro: 'Armature leggere, una abilita dalla lista del Ladro, arnesi da scasso',
    Mago: 'Nessuna competenza aggiuntiva',
    Monaco: 'Armi semplici, spade corte',
    Paladino: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra',
    Ranger: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra, una abilita dalla lista del Ranger',
    Stregone: 'Nessuna competenza aggiuntiva',
    Warlock: 'Armature leggere, armi semplici',
};

function compendioRenderHub() {
    const grid = document.getElementById('compendioHubGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(COMP_TABS).map(([key, tab]) => `
        <button type="button" class="comp-hub-card" onclick="compendioOpenTab('${key}')">
            <span class="comp-hub-card-icon" aria-hidden="true">${_compIcon(tab.icon)}</span>
            <span class="comp-hub-card-label">${escapeHtml(tab.label)}</span>
        </button>
    `).join('');
}

window.compendioBackToHub = function() {
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
};

window.compendioOpenTab = function(tab) {
    if (!COMP_TABS[tab]) return;
    _compCurrentTab = tab;
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = 'none';
    if (sub) sub.style.display = '';
    const title = document.getElementById('compendioSubTitle');
    if (title) title.textContent = COMP_TABS[tab].label;
    compendioRenderTab();
};

function loadCompendio() {
    compendioRenderHub();
    if (document.getElementById('compendioSubPage')?.style.display !== 'none') {
        compendioRenderTab();
    }
}

function _compStateFor(tab) {
    if (!window._compState[tab]) {
        window._compState[tab] = { search: '', filters: {} };
    }
    return window._compState[tab];
}

function compendioRenderTab() {
    const container = document.getElementById('compendioContent');
    if (!container) return;
    const items = _compItems(_compCurrentTab);
    const state = _compStateFor(_compCurrentTab);
    const filtered = items.filter(item => _compMatches(item, state));
    container.innerHTML = `
        ${_compToolbarHtml(_compCurrentTab, state, items)}
        <p class="comp-count">${filtered.length} risultati su ${items.length}</p>
        ${filtered.length ? `<div class="comp-list">${filtered.map(item => _compCardHtml(item)).join('')}</div>` : '<div class="comp-empty">Nessun elemento trovato</div>'}
    `;
}

window.compendioSetSearch = function(value) {
    _compStateFor(_compCurrentTab).search = value || '';
    compendioRenderTab();
};

window.compendioSetFilter = function(key, value) {
    const filters = _compStateFor(_compCurrentTab).filters;
    if (value) filters[key] = value;
    else delete filters[key];
    compendioRenderTab();
};

window.compendioToggleFilter = function(key, value) {
    const filters = _compStateFor(_compCurrentTab).filters;
    filters[key] = filters[key] === value ? '' : value;
    if (!filters[key]) delete filters[key];
    compendioRenderTab();
};

function _compItems(tab) {
    if (tab === 'classi') {
        return (window.CLASSES_DATA || []).map(cls => ({
            type: tab,
            id: cls.slug || cls.name,
            title: cls.name || cls.name_en || 'Classe',
            subtitle: cls.name_en || '',
            source: 'Manuale',
            search: [cls.name, cls.name_en, cls.prof_skills, cls.prof_saving_throws, cls.spellcasting_ability].join(' '),
            tags: [cls.hit_dice, cls.spellcasting_ability ? `Incantatore: ${cls.spellcasting_ability}` : '', cls.prof_saving_throws].filter(Boolean),
            desc: cls.features?.[0]?.description || cls.equipment || '',
            data: cls,
        }));
    }
    if (tab === 'sottoclassi') {
        return (window.CLASSES_DATA || []).flatMap(cls => (cls.subclasses || []).map(sub => ({
            type: tab,
            id: `${cls.slug || cls.name}:${sub.slug || sub.name}`,
            title: sub.name || sub.name_en || 'Sottoclasse',
            subtitle: `${cls.name || cls.name_en || ''}${sub.name_en ? ` - ${sub.name_en}` : ''}`,
            source: cls.name || '',
            search: [sub.name, sub.name_en, cls.name, cls.name_en, ...(sub.features || []).map(f => `${f.name} ${f.description}`)].join(' '),
            tags: [cls.name, _compFeatureLevels(sub.features)].filter(Boolean),
            desc: sub.features?.[0]?.description || '',
            data: { ...sub, className: cls.name, classNameEn: cls.name_en },
        })));
    }
    if (tab === 'razze') {
        return Object.entries(window.RACES_DATA || {}).map(([key, race]) => ({
            type: tab,
            id: key,
            title: race.name || key,
            subtitle: race.name_en || '',
            source: race.source_short || race.source || '',
            search: [race.name, race.name_en, race.description, race.asi_text, (race.traits || []).map(t => `${t.name} ${t.description}`).join(' ')].join(' '),
            tags: [race.source_short, race.size, race.speed != null ? `Vel. ${race.speed} m` : '', race.asi_text].filter(Boolean),
            desc: race.description || race.age || '',
            data: race,
        }));
    }
    if (tab === 'background') {
        return Object.entries(window.BACKGROUNDS_DATA || {}).map(([key, bg]) => ({
            type: tab,
            id: key,
            title: bg.name || key,
            subtitle: bg.name_en || '',
            source: bg.source_short || bg.source || '',
            search: [bg.name, bg.name_en, bg.description, bg.feature_name, bg.feature?.name, bg.feature_description, bg.feature?.description, bg.skill_proficiencies].join(' '),
            tags: [bg.source_short, _compArrayLabel(bg.skill_proficiencies), _compArrayLabel(bg.tool_proficiencies)].filter(Boolean),
            desc: bg.description || bg.feature_description || bg.feature?.description || '',
            data: bg,
        }));
    }
    if (tab === 'talenti') {
        return Object.entries(window.FEATS_DATA || {}).map(([key, feat]) => ({
            type: tab,
            id: key,
            title: feat.name || key,
            subtitle: feat.name_en || '',
            source: feat.source_short || feat.source || '',
            search: [feat.name, feat.name_en, feat.prerequisites, feat.description].join(' '),
            tags: [feat.source_short, feat.prerequisites ? `Prereq: ${feat.prerequisites}` : 'Nessun prerequisito'].filter(Boolean),
            desc: feat.description || '',
            data: feat,
        }));
    }
    if (tab === 'stili') {
        return _compObjectValues(window.FIGHTING_STYLES_DATA).map(style => ({
            type: tab,
            id: style.slug || style.name || style.name_en,
            title: style.name || style.name_it || style.name_en || 'Stile',
            subtitle: style.name_en || '',
            source: style.source_short || style.source || '',
            search: [style.name, style.name_it, style.name_en, style.description, style.classes].join(' '),
            tags: [style.source_short, _compArrayLabel(style.classes)].filter(Boolean),
            desc: style.description || style.description_it || style.description_en || '',
            data: style,
        }));
    }
    if (tab === 'suppliche') {
        return _compObjectValues(window.INVOCATIONS_DATA).map(inv => ({
            type: tab,
            id: inv.id || inv.slug || inv.name || inv.name_en,
            title: inv.name || inv.name_it || inv.name_en || 'Supplica',
            subtitle: inv.name_en || '',
            source: inv.source_short || inv.source || '',
            search: [inv.name, inv.name_it, inv.name_en, inv.description, inv.prerequisites].join(' '),
            tags: [inv.source_short, _compPrereqLabel(inv.prerequisites)].filter(Boolean),
            desc: inv.description || inv.description_it || inv.description_en || '',
            data: inv,
        }));
    }
    if (tab === 'incantesimi') {
        return Object.entries(window.SPELLS_DATA || {}).map(([key, sp]) => ({
            type: tab,
            id: key,
            title: sp.name || key,
            subtitle: sp.name_en || '',
            source: sp.source || '',
            search: [sp.name, sp.name_en, sp.school_it, sp.school, sp.components, sp.duration, (sp.classes || []).join(' '), sp.description].join(' '),
            tags: [_compSpellLevel(sp.level), sp.school_it || sp.school, sp.components, sp.duration, ...(sp.classes || []).slice(0, 3)].filter(Boolean),
            desc: sp.description || '',
            data: sp,
        }));
    }
    return [];
}

function _compToolbarHtml(tab, state, allItems) {
    return `
        <div class="comp-toolbar">
            <label class="comp-search-wrap">
                ${_compIcon('search')}
                <input class="comp-search" type="search" placeholder="Cerca in ${escapeHtml(COMP_TABS[tab].label.toLowerCase())}..."
                    value="${escapeHtml(state.search || '')}" oninput="compendioSetSearch(this.value)">
            </label>
            <div class="comp-filter-row">${_compFiltersHtml(tab, state, allItems)}</div>
        </div>
    `;
}

function _compFiltersHtml(tab, state, allItems) {
    const f = state.filters || {};
    if (tab === 'incantesimi') {
        const schools = _compUnique(allItems.map(i => i.data.school_it || i.data.school).filter(Boolean));
        const classes = _compUnique(allItems.flatMap(i => i.data.classes || []));
        const sources = _compUnique(allItems.map(i => i.data.source).filter(Boolean));
        return [
            _compSelect('level', f.level, [['', 'Livello: Tutti'], ['0', 'Trucchetti'], ...Array.from({ length: 9 }, (_, i) => [String(i + 1), `Livello ${i + 1}`])]),
            _compSelect('school', f.school, [['', 'Scuola: Tutte'], ...schools.map(v => [v, v])]),
            _compSelect('component', f.component, [['', 'Componenti: Tutte'], ['V', 'V'], ['S', 'S'], ['M', 'M']]),
            _compSelect('concentration', f.concentration, [['', 'Concentrazione: Tutti'], ['yes', 'Si'], ['no', 'No']]),
            _compSelect('ritual', f.ritual, [['', 'Rituale: Tutti'], ['yes', 'Si'], ['no', 'No']]),
            _compSelect('class', f.class, [['', 'Classe: Tutte'], ...classes.map(v => [v, v])]),
            _compSelect('source', f.source, [['', 'Fonte: Tutte'], ...sources.map(v => [v, v])]),
        ].join('');
    }
    const sources = _compUnique(allItems.map(i => i.source).filter(Boolean));
    const base = sources.length > 1 ? _compSelect('source', f.source, [['', 'Fonte: Tutte'], ...sources.map(v => [v, v])]) : '';
    if (tab === 'sottoclassi') {
        const classes = _compUnique(allItems.map(i => i.data.className).filter(Boolean));
        return base + _compSelect('class', f.class, [['', 'Classe: Tutte'], ...classes.map(v => [v, v])]);
    }
    return base;
}

function _compSelect(key, value, options) {
    return `<select onchange="compendioSetFilter('${key}', this.value)">
        ${options.map(([v, label]) => `<option value="${escapeHtml(v)}" ${String(value || '') === String(v) ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}
    </select>`;
}

function _compMatches(item, state) {
    const q = (state.search || '').trim().toLowerCase();
    if (q && !String(item.search || '').toLowerCase().includes(q) && !String(item.title || '').toLowerCase().includes(q)) {
        return false;
    }
    const f = state.filters || {};
    if (f.source && item.source !== f.source) return false;
    if (f.class) {
        if (item.type === 'sottoclassi' && item.data.className !== f.class) return false;
        if (item.type === 'incantesimi' && !(item.data.classes || []).includes(f.class)) return false;
    }
    if (item.type === 'incantesimi') {
        const sp = item.data;
        if (f.level && String(sp.level) !== String(f.level)) return false;
        if (f.school && (sp.school_it || sp.school) !== f.school) return false;
        if (f.component && !_compSpellHasComponent(sp, f.component)) return false;
        if (f.concentration === 'yes' && !_compSpellIsConcentration(sp)) return false;
        if (f.concentration === 'no' && _compSpellIsConcentration(sp)) return false;
        if (f.ritual === 'yes' && !_compSpellIsRitual(sp)) return false;
        if (f.ritual === 'no' && _compSpellIsRitual(sp)) return false;
    }
    return true;
}

function _compCardHtml(item) {
    return `
        <article class="comp-card" onclick="compendioOpenDetail('${item.type}', '${_compEscapeAttr(item.id)}')">
            <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
            ${item.subtitle ? `<div class="comp-card-desc">${escapeHtml(item.subtitle)}</div>` : ''}
            <div class="comp-card-meta">${(item.tags || []).slice(0, 5).map(t => `<span class="comp-tag">${escapeHtml(t)}</span>`).join('')}</div>
            ${item.desc ? `<p class="comp-card-desc">${escapeHtml(_compPlain(item.desc))}</p>` : ''}
        </article>
    `;
}

window.compendioOpenDetail = function(type, id) {
    const item = _compItems(type).find(x => String(x.id) === String(id));
    if (!item) return;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-detail-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            ${_compDetailHtml(item)}
        </div>
    `;
    document.body.appendChild(overlay);
};

function _compDetailHtml(item) {
    const d = item.data;
    if (item.type === 'classi') return _compClassDetail(d);
    if (item.type === 'sottoclassi') return _compFeatureDetail(item.title, item.subtitle, d.features || [], d);
    if (item.type === 'razze') return _compRaceDetail(d, item.title, item.subtitle);
    if (item.type === 'background') return _compBackgroundDetail(d, item.title, item.subtitle);
    if (item.type === 'talenti') return _compSimpleDetail(item, [['Prerequisiti', d.prerequisites || 'Nessuno'], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'stili') return _compSimpleDetail(item, [['Classi', _compArrayLabel(d.classes) || ''], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'suppliche') return _compSimpleDetail(item, [['Prerequisiti', _compPrereqLabel(d.prerequisites) || 'Nessuno'], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'incantesimi') return _compSpellDetail(d);
    return _compSimpleDetail(item, []);
}

function _compClassDetail(cls) {
    const boxes = [
        ['Dado vita', cls.hit_dice],
        ['Tiri salvezza', cls.prof_saving_throws],
        ['Armature', cls.prof_armor],
        ['Armi', cls.prof_weapons],
        ['Strumenti', cls.prof_tools],
        ['Incantesimi', cls.spellcasting_ability || 'Non incantatore'],
    ];
    return `
        <h2 class="comp-detail-title">${escapeHtml(cls.name || cls.name_en || 'Classe')}</h2>
        <div class="comp-detail-subtitle">${escapeHtml(cls.name_en || '')}</div>
        ${_compBoxes(boxes)}
        <section class="comp-detail-section">
            <h3>Multiclasse</h3>
            ${_compBoxes([
                ['Requisiti', COMP_MULTICLASS_REQUIREMENTS[cls.name] || 'Verifica sul manuale'],
                ['Competenze ottenute', COMP_MULTICLASS_PROFICIENCIES[cls.name] || 'Verifica sul manuale'],
            ])}
        </section>
        <section class="comp-detail-section">
            <h3>Competenze iniziali</h3>
            <div class="comp-rich">${_compRich(cls.prof_skills || '')}</div>
        </section>
        <section class="comp-detail-section">
            <h3>Equipaggiamento</h3>
            <div class="comp-rich">${_compRich(cls.equipment || '')}</div>
        </section>
        ${_compFeaturesSection(cls.features || [])}
        ${cls.subclasses?.length ? `<section class="comp-detail-section"><h3>Sottoclassi</h3><div class="comp-card-meta">${cls.subclasses.map(s => `<span class="comp-tag">${escapeHtml(s.name || s.name_en)}</span>`).join('')}</div></section>` : ''}
    `;
}

function _compFeatureDetail(title, subtitle, features, data) {
    return `
        <h2 class="comp-detail-title">${escapeHtml(title)}</h2>
        <div class="comp-detail-subtitle">${escapeHtml(subtitle || data.name_en || '')}</div>
        ${_compFeaturesSection(features)}
    `;
}

function _compRaceDetail(race, title, subtitle) {
    return `
        <h2 class="comp-detail-title">${escapeHtml(title)}</h2>
        <div class="comp-detail-subtitle">${escapeHtml([subtitle, race.source_short || race.source].filter(Boolean).join(' - '))}</div>
        ${_compBoxes([
            ['Taglia', race.size],
            ['Velocita', race.speed != null ? `${race.speed} m` : ''],
            ['Incrementi', race.asi_text],
            ['Linguaggi', _compArrayLabel(race.languages)],
        ])}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(race.description || '')}</div></section>
        ${_compFeaturesSection(race.traits || race.features || [])}
    `;
}

function _compBackgroundDetail(bg, title, subtitle) {
    return `
        <h2 class="comp-detail-title">${escapeHtml(title)}</h2>
        <div class="comp-detail-subtitle">${escapeHtml([subtitle, bg.source_short || bg.source].filter(Boolean).join(' - '))}</div>
        ${_compBoxes([
            ['Abilita', bg.skill_proficiencies],
            ['Strumenti', bg.tool_proficiencies],
            ['Linguaggi', bg.languages_text || bg.languages || bg.languages_specific],
            ['Equipaggiamento', bg.equipment || bg.starting_equipment],
            ['Monete iniziali', bg.starting_gold != null ? `${bg.starting_gold} mo` : ''],
        ])}
        <section class="comp-detail-section"><h3>${escapeHtml(bg.feature_name || bg.feature?.name || 'Privilegio')}</h3><div class="comp-rich">${_compRich(bg.feature_description || bg.feature?.description || bg.description || '')}</div></section>
    `;
}

function _compSpellDetail(sp) {
    return `
        <h2 class="comp-detail-title">${escapeHtml(sp.name || sp.name_en || 'Incantesimo')}</h2>
        <div class="comp-detail-subtitle">${escapeHtml([sp.name_en, _compSpellLevel(sp.level), sp.school_it || sp.school].filter(Boolean).join(' - '))}</div>
        ${_compBoxes([
            ['Tempo', sp.casting_time],
            ['Gittata', sp.range],
            ['Componenti', sp.components],
            ['Durata', sp.duration],
            ['Classi', _compArrayLabel(sp.classes)],
            ['Fonte', sp.source],
        ])}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(sp.description || '')}</div></section>
    `;
}

function _compSimpleDetail(item, boxes) {
    return `
        <h2 class="comp-detail-title">${escapeHtml(item.title)}</h2>
        <div class="comp-detail-subtitle">${escapeHtml(item.subtitle || '')}</div>
        ${_compBoxes(boxes)}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(item.data.description || item.data.description_it || item.data.description_en || '')}</div></section>
    `;
}

function _compFeaturesSection(features) {
    if (!features || !features.length) return '';
    return `<section class="comp-detail-section">
        <h3>Privilegi</h3>
        <div class="comp-feature-list">
            ${features.map(f => `<article class="comp-feature">
                <h4 class="comp-feature-title">${escapeHtml(f.name || f.name_it || f.name_en || 'Privilegio')}${f.level != null ? ` - Livello ${escapeHtml(String(f.level))}` : ''}</h4>
                <div class="comp-rich">${_compRich(f.description || f.description_it || f.description_en || '')}</div>
            </article>`).join('')}
        </div>
    </section>`;
}

function _compBoxes(boxes) {
    const clean = boxes.filter(([, value]) => value != null && String(value).trim() !== '');
    if (!clean.length) return '';
    return `<div class="comp-detail-grid">${clean.map(([label, value]) => `
        <div class="comp-detail-box">
            <div class="comp-detail-box-label">${escapeHtml(label)}</div>
            <div class="comp-detail-box-value">${escapeHtml(_compArrayLabel(value))}</div>
        </div>
    `).join('')}</div>`;
}

function _compRich(text) {
    const raw = String(text || '').trim();
    if (!raw) return '<p>Nessuna descrizione disponibile.</p>';
    if (typeof window.formatRichText === 'function') return window.formatRichText(raw);
    return raw.split(/\n{2,}/).map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

function _compPlain(text) {
    return String(text || '').replace(/\*\*/g, '').replace(/\n+/g, ' ').trim();
}

function _compEscapeAttr(value) {
    return String(value || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function _compObjectValues(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.values(value);
    return [];
}

function _compUnique(values) {
    return Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'it'));
}

function _compArrayLabel(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return value || '';
}

function _compPrereqLabel(value) {
    if (Array.isArray(value)) {
        if (!value.length) return 'Nessuno';
        return value.map(v => {
            if (typeof v === 'string') return v;
            if (!v || typeof v !== 'object') return String(v || '');
            if (v.type === 'level') return `Livello ${v.value}`;
            if (v.type === 'spell') return v.value_it || v.value || 'Incantesimo richiesto';
            if (v.type === 'feature') return v.value || 'Privilegio richiesto';
            return [v.type, v.value_it || v.value].filter(Boolean).join(': ');
        }).filter(Boolean).join(', ');
    }
    return value || 'Nessuno';
}

function _compFeatureLevels(features) {
    const levels = _compUnique((features || []).map(f => f.level != null ? String(f.level) : ''));
    return levels.length ? `Livelli ${levels.join(', ')}` : '';
}

function _compSpellLevel(level) {
    const n = Number(level);
    return n === 0 ? 'Trucchetto' : `Livello ${n}`;
}

function _compSpellHasComponent(sp, component) {
    const txt = String(sp.components || sp.components_en || '').toUpperCase();
    return txt.replace(/\(.*?\)/g, '').split(/[,\s]+/).filter(Boolean).includes(component);
}

function _compSpellIsConcentration(sp) {
    return String(sp.duration || sp.duration_en || '').toLowerCase().startsWith('concentr');
}

function _compSpellIsRitual(sp) {
    if (sp.ritual === true) return true;
    return /ritual|rituale/i.test(`${sp.casting_time || ''} ${sp.casting_time_en || ''}`);
}

function _compIcon(name) {
    const icons = {
        'book-open': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2z"></path><path d="M22 4h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z"></path></svg>',
        layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>',
        scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h12a2 2 0 0 0 2-2V5a3 3 0 0 0-3-3H8"></path><path d="M8 21a3 3 0 0 1-3-3V5a3 3 0 0 1 6 0v13a3 3 0 0 1-3 3z"></path></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"></path></svg>',
        wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 4l5 5"></path><path d="M14 5l-9 9 5 5 9-9"></path><path d="M4 20l2-2"></path></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    };
    return icons[name] || icons['book-open'];
}
