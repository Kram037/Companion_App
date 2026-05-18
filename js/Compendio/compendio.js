// ============================================================================
// COMPENDIO - D&D reference browser
// ============================================================================

let _compCurrentTab = 'classi';
window._compState = window._compState || {};

const COMP_TABS = {
    classi: { label: 'Classi e Sottoclassi', icon: '📚' },
    oggetti: { label: 'Oggetti ed Equipaggiamento', icon: '🎒' },
    razze: { label: 'Razze', icon: '🧬' },
    background: { label: 'Background', icon: '📜' },
    talenti: { label: 'Talenti', icon: '⭐' },
    stili: { label: 'Stili di Combattimento', icon: '🛡️' },
    suppliche: { label: 'Suppliche Occulte', icon: '🔮' },
    incantesimi: { label: 'Incantesimi', icon: '✨' },
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

const COMP_CLASS_ALIASES = {
    artefice: ['artificer'],
    artificer: ['artefice'],
    bardo: ['bard'],
    bard: ['bardo'],
    chierico: ['cleric'],
    cleric: ['chierico'],
    druido: ['druid'],
    druid: ['druido'],
    guerriero: ['fighter'],
    fighter: ['guerriero'],
    ladro: ['rogue'],
    rogue: ['ladro'],
    mago: ['wizard'],
    wizard: ['mago'],
    monaco: ['monk'],
    monk: ['monaco'],
    paladino: ['paladin'],
    paladin: ['paladino'],
    ranger: ['ranger'],
    stregone: ['sorcerer'],
    sorcerer: ['stregone'],
    warlock: ['warlock'],
};

const COMP_CLASS_LABELS = {
    artefice: { it: 'Artefice', en: 'Artificer' },
    bardo: { it: 'Bardo', en: 'Bard' },
    chierico: { it: 'Chierico', en: 'Cleric' },
    druido: { it: 'Druido', en: 'Druid' },
    guerriero: { it: 'Guerriero', en: 'Fighter' },
    ladro: { it: 'Ladro', en: 'Rogue' },
    mago: { it: 'Mago', en: 'Wizard' },
    monaco: { it: 'Monaco', en: 'Monk' },
    paladino: { it: 'Paladino', en: 'Paladin' },
    ranger: { it: 'Ranger', en: 'Ranger' },
    stregone: { it: 'Stregone', en: 'Sorcerer' },
    warlock: { it: 'Warlock', en: 'Warlock' },
};

const COMP_ARTIFICER_SPELLS = new Set([
    'absorb elements',
    'acid splash',
    'aid',
    'alarm',
    'alter self',
    'animate objects',
    'arcane eye',
    'arcane lock',
    'bigby\'s hand',
    'blink',
    'blur',
    'booming blade',
    'catapult',
    'catnap',
    'continual flame',
    'create bonfire',
    'create food and water',
    'creation',
    'cure wounds',
    'dancing lights',
    'darkvision',
    'detect magic',
    'disguise self',
    'dispel magic',
    'elemental bane',
    'elemental weapon',
    'enhance ability',
    'enlarge/reduce',
    'expeditious retreat',
    'fabricate',
    'faerie fire',
    'false life',
    'feather fall',
    'fire bolt',
    'flame arrows',
    'fly',
    'freedom of movement',
    'frostbite',
    'grease',
    'greater restoration',
    'guidance',
    'haste',
    'heat metal',
    'identify',
    'invisibility',
    'jump',
    'lesser restoration',
    'levitate',
    'light',
    'lightning lure',
    'longstrider',
    'mage hand',
    'magic mouth',
    'magic stone',
    'magic weapon',
    'mending',
    'message',
    'poison spray',
    'prestidigitation',
    'protection from energy',
    'protection from poison',
    'purify food and drink',
    'pyrotechnics',
    'ray of frost',
    'resistance',
    'revivify',
    'rope trick',
    'sanctuary',
    'see invisibility',
    'shocking grasp',
    'skill empowerment',
    'skywrite',
    'snare',
    'spare the dying',
    'spider climb',
    'stone shape',
    'stoneskin',
    'summon construct',
    'sword burst',
    'tasha\'s caustic brew',
    'thorn whip',
    'thunderclap',
    'tiny servant',
    'transmute rock',
    'true strike',
    'vitriolic sphere',
    'wall of stone',
    'water breathing',
    'water walk',
    'web',
]);

function compendioRenderHub() {
    const grid = document.getElementById('compendioHubGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(COMP_TABS).map(([key, tab]) => `
        <button type="button" class="comp-hub-card" onclick="compendioOpenTab('${key}')">
            <span class="comp-hub-card-icon" aria-hidden="true">${tab.icon}</span>
            <span class="comp-hub-card-label">${escapeHtml(tab.label)}</span>
        </button>
    `).join('');
}

window.compendioBackToHub = function() {
    const state = _compStateFor(_compCurrentTab);
    if (state.detail) {
        state.detail = null;
        const title = document.getElementById('compendioSubTitle');
        if (title) title.textContent = COMP_TABS[_compCurrentTab]?.label || 'Compendio';
        compendioRenderTab();
        _compScrollToTop();
        return;
    }
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    _compScrollToTop();
};

window.compendioShowHub = function() {
    Object.keys(COMP_TABS).forEach(tab => {
        _compStateFor(tab).detail = null;
    });
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    _compScrollToTop();
};

window.compendioOpenTab = function(tab) {
    if (!COMP_TABS[tab]) return;
    _compCurrentTab = tab;
    _compStateFor(tab).detail = null;
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = 'none';
    if (sub) sub.style.display = '';
    const title = document.getElementById('compendioSubTitle');
    if (title) title.textContent = COMP_TABS[tab].label;
    compendioRenderTab();
    _compScrollToTop();
};

function loadCompendio() {
    compendioRenderHub();
    if (document.getElementById('compendioSubPage')?.style.display !== 'none') {
        compendioRenderTab();
    }
}

function _compStateFor(tab) {
    if (!window._compState[tab]) {
        window._compState[tab] = { search: '', filters: {}, detail: null, openGroups: {} };
    }
    return window._compState[tab];
}

function compendioRenderTab() {
    const container = document.getElementById('compendioContent');
    if (!container) return;
    if (_compCurrentTab === 'oggetti') {
        container.innerHTML = _compObjectsPageHtml();
        _compScrollToTop();
        return;
    }
    const items = _compItems(_compCurrentTab);
    const state = _compStateFor(_compCurrentTab);
    if (state.detail) {
        const item = items.find(x => String(x.id) === String(state.detail.id));
        if (item) {
            const title = document.getElementById('compendioSubTitle');
            if (title) title.textContent = item.title;
            container.innerHTML = _compDetailPageHtml(item);
            return;
        }
        state.detail = null;
    }
    const filtered = items.filter(item => _compMatches(item, state));
    container.innerHTML = `
        ${_compToolbarHtml(_compCurrentTab, state, items)}
        <p class="comp-count">${filtered.length} risultati su ${items.length}</p>
        ${filtered.length ? _compListHtml(_compCurrentTab, filtered) : '<div class="comp-empty">Nessun elemento trovato</div>'}
    `;
}

window.compendioSetSearch = function(value) {
    _compStateFor(_compCurrentTab).search = value || '';
    compendioRenderTab();
};

window.compendioSetFilter = function(key, value) {
    const filters = _compStateFor(_compCurrentTab).filters;
    const values = _compFilterValues(value).filter(Boolean);
    if (values.length) filters[key] = values;
    else delete filters[key];
    compendioRenderTab();
};

window.compendioPickFilter = function(key, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const current = _compFilterValues(_compStateFor(_compCurrentTab).filters[key]);
    if (mode === 'single') {
        openCustomSelect(options, value => {
            window.compendioSetFilter(key, value);
            const overlay = document.querySelector('.comp-filter-overlay');
            if (overlay) {
                overlay.querySelector('.comp-filter-panel').innerHTML = _compFiltersHtml(_compCurrentTab, _compStateFor(_compCurrentTab), _compItems(_compCurrentTab));
            }
        }, title || 'Filtro');
        return;
    }
    openMultiSelect(options, current, values => {
        window.compendioSetFilter(key, values);
        const overlay = document.querySelector('.comp-filter-overlay');
        if (overlay) {
            overlay.querySelector('.comp-filter-panel').innerHTML = _compFiltersHtml(_compCurrentTab, _compStateFor(_compCurrentTab), _compItems(_compCurrentTab));
        }
    }, title || 'Filtro');
};

window.compendioResetFilters = function() {
    _compStateFor(_compCurrentTab).filters = {};
    compendioRenderTab();
};

window.compendioOpenFilters = function() {
    const state = _compStateFor(_compCurrentTab);
    const items = _compItems(_compCurrentTab);
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_compFiltersHtml(_compCurrentTab, state, items)}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="compendioResetFilters();this.closest('.hp-calc-overlay').remove()">Reset</button>
                <button type="button" class="btn-primary" onclick="this.closest('.hp-calc-overlay').remove()">Applica</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

function _compItems(tab) {
    if (tab === 'classi') {
        return (window.CLASSES_DATA || []).map(cls => ({
            type: tab,
            id: cls.slug || cls.name,
            title: _compName(cls) || 'Classe',
            subtitle: '',
            source: 'Manuale',
            search: [cls.name, cls.name_en, cls.prof_skills, cls.prof_skills_en, cls.prof_saving_throws, cls.prof_saving_throws_en, cls.spellcasting_ability, cls.spellcasting_ability_en].join(' '),
            tags: [cls.hit_dice, _compField(cls, 'prof_saving_throws')].filter(Boolean),
            desc: '',
            data: cls,
        }));
    }
    if (tab === 'oggetti') {
        return [];
    }
    if (tab === 'sottoclassi') {
        return (window.CLASSES_DATA || []).flatMap(cls => (cls.subclasses || []).map(sub => ({
            type: tab,
            id: `${cls.slug || cls.name}:${sub.slug || sub.name}`,
            title: _compName(sub) || 'Sottoclasse',
            subtitle: _compName(cls) || '',
            source: _compName(cls) || '',
            group: _compName(cls) || '',
            search: [sub.name, sub.name_en, cls.name, cls.name_en, ...(sub.features || []).map(f => `${f.name} ${f.description}`)].join(' '),
            tags: [],
            desc: '',
            data: { ...sub, className: cls.name, classNameEn: cls.name_en, classLabel: _compName(cls) },
        })));
    }
    if (tab === 'razze') {
        return Object.entries(window.RACES_DATA || {}).flatMap(([key, race]) => {
            const raceLabel = _compLang() === 'en' ? (race.name_en || key) : (race.name || key);
            const base = {
                type: tab,
                source: race.source_short || race.source || '',
                search: [key, race.name, race.name_en, race.description, race.description_en, race.asi_text, race.asi_text_en, (race.traits || []).map(t => `${t.name} ${t.name_en} ${t.description} ${t.description_en}`).join(' ')].join(' '),
            };
            if (Array.isArray(race.subraces) && race.subraces.length) {
                return race.subraces.map(sub => ({
                    ...base,
                    id: `${key}:${sub.name || sub.name_en}`,
                    title: _compName(sub) || 'Sottorazza',
                    subtitle: raceLabel,
                    group: raceLabel,
                    tags: [race.source_short || race.source].filter(Boolean),
                    desc: '',
                    data: { ...sub, baseRaceKey: key, baseRace: race, isSubrace: true },
                }));
            }
            return [{
                ...base,
                id: key,
                title: raceLabel,
                subtitle: '',
                group: 'Razze senza sottorazze',
                tags: [_compField(race, 'asi_text')].filter(Boolean),
                desc: '',
                data: { ...race, baseRaceKey: key, baseRace: race, isSubrace: false },
            }];
        });
    }
    if (tab === 'background') {
        return Object.entries(window.BACKGROUNDS_DATA || {}).map(([key, bg]) => ({
            type: tab,
            id: key,
            title: _compName(bg) || key,
            subtitle: '',
            source: bg.source_short || bg.source || '',
            search: [bg.name, bg.name_en, bg.description, bg.feature_name, bg.feature?.name, bg.feature_description, bg.feature?.description, bg.skill_proficiencies].join(' '),
            tags: [_compArrayLabel(bg.skill_proficiencies)].filter(Boolean),
            desc: '',
            data: bg,
        }));
    }
    if (tab === 'talenti') {
        return Object.entries(window.FEATS_DATA || {}).map(([key, feat]) => ({
            type: tab,
            id: key,
            title: _compName(feat) || key,
            subtitle: '',
            source: feat.source_short || feat.source || '',
            search: [feat.name, feat.name_en, feat.prerequisites, feat.description].join(' '),
            tags: [feat.prerequisites ? `Prereq: ${feat.prerequisites}` : 'Nessun prerequisito'].filter(Boolean),
            desc: '',
            data: feat,
        }));
    }
    if (tab === 'stili') {
        return _compObjectValues(window.FIGHTING_STYLES_DATA).map(style => ({
            type: tab,
            id: style.slug || style.name || style.name_en,
            title: _compName(style) || style.name_it || 'Stile',
            subtitle: '',
            source: style.source_short || style.source || '',
            search: [style.name, style.name_it, style.name_en, style.description, style.classes].join(' '),
            tags: [_compArrayLabel(style.classes)].filter(Boolean),
            desc: '',
            data: style,
        }));
    }
    if (tab === 'suppliche') {
        return _compObjectValues(window.INVOCATIONS_DATA).map(inv => ({
            type: tab,
            id: inv.id || inv.slug || inv.name || inv.name_en,
            title: _compName(inv) || inv.name_it || 'Supplica',
            subtitle: '',
            source: inv.source_short || inv.source || '',
            search: [inv.name, inv.name_it, inv.name_en, inv.description, inv.prerequisites].join(' '),
            tags: [_compPrereqLabel(inv.prerequisites)].filter(Boolean),
            desc: '',
            data: inv,
        }));
    }
    if (tab === 'incantesimi') {
        return Object.entries(window.SPELLS_DATA || {}).map(([key, sp]) => ({
            type: tab,
            id: key,
            title: _compSpellField(sp, 'name') || key,
            subtitle: '',
            source: _compSpellSource(sp),
            group: _compSpellLevel(sp.level),
            sortLevel: Number(sp.level) || 0,
            search: [sp.name, sp.name_en, sp.school_it, sp.school, sp.components, sp.components_en, sp.duration, sp.duration_en, (sp.classes || []).join(' '), (sp.classes_en || []).join(' '), sp.description, sp.description_en].join(' '),
            tags: [_compSpellField(sp, 'school'), _compSpellField(sp, 'duration')].filter(Boolean),
            desc: '',
            data: sp,
        }));
    }
    return [];
}

function _compToolbarHtml(tab, state, allItems) {
    const activeFilters = Object.values(state.filters || {}).reduce((count, value) => count + _compFilterValues(value).length, 0);
    const filtersHtml = _compFiltersHtml(tab, state, allItems);
    return `
        <div class="comp-toolbar">
            <label class="comp-search-wrap">
                ${_compIcon('search')}
                <input class="comp-search" type="search" placeholder="Cerca in ${escapeHtml(COMP_TABS[tab].label.toLowerCase())}..."
                    value="${escapeHtml(state.search || '')}" oninput="compendioSetSearch(this.value)">
            </label>
            ${filtersHtml ? `<button type="button" class="comp-filter-btn" onclick="compendioOpenFilters()">
                ${_compIcon('sliders')}
                <span>Filtri</span>
                ${activeFilters ? `<strong>${activeFilters}</strong>` : ''}
            </button>` : ''}
        </div>
    `;
}

function _compFiltersHtml(tab, state, allItems) {
    const f = state.filters || {};
    if (tab === 'incantesimi') {
        const schools = _compUnique(allItems.map(i => i.data.school_it || i.data.school).filter(Boolean));
        const classes = _compSpellClassOptions(allItems);
        const sources = _compUnique(allItems.map(i => i.source).filter(Boolean));
        return [
            _compSelect('level', f.level, [['', 'Tutti'], ['0', 'Trucchetti'], ...Array.from({ length: 9 }, (_, i) => [String(i + 1), `Livello ${i + 1}`])], 'Livello'),
            _compSelect('school', f.school, [['', 'Tutte'], ...schools.map(v => [v, v])], 'Scuola'),
            _compSelect('component', f.component, [['', 'Tutte'], ['V', 'V'], ['S', 'S'], ['M', 'M']], 'Componenti'),
            _compSelect('concentration', f.concentration, [['', 'Tutti'], ['yes', 'Si'], ['no', 'No']], 'Concentrazione'),
            _compSelect('ritual', f.ritual, [['', 'Tutti'], ['yes', 'Si'], ['no', 'No']], 'Rituale'),
            _compSelect('class', f.class, [['', 'Tutte'], ...classes.map(v => [v, v])], 'Classe'),
            _compSelect('source', f.source, [['', 'Tutte'], ...sources.map(v => [v, v])], 'Fonte'),
        ].join('');
    }
    const sources = _compUnique(allItems.map(i => i.source).filter(Boolean));
    const base = sources.length > 1 ? _compSelect('source', f.source, [['', 'Tutte'], ...sources.map(v => [v, v])], 'Fonte') : '';
    if (tab === 'sottoclassi') {
        const classes = _compUnique(allItems.map(i => i.data.className).filter(Boolean));
        return base + _compSelect('class', f.class, [['', 'Tutte'], ...classes.map(v => [v, v])], 'Classe');
    }
    if (tab === 'razze') {
        const groups = _compUnique(allItems.map(i => i.group).filter(Boolean));
        return base + _compSelect('group', f.group, [['', 'Tutti'], ...groups.map(v => [v, v])], 'Gruppo');
    }
    return base;
}

function _compSelect(key, value, options, title) {
    const selected = _compFilterValues(value);
    const nonEmpty = options.filter(([v]) => String(v || '') !== '');
    const isSingle = nonEmpty.length === 2;
    const normalized = (isSingle ? options : nonEmpty).map(([v, label]) => ({ value: String(v || ''), label }));
    const encoded = encodeURIComponent(JSON.stringify(normalized)).replace(/'/g, '%27');
    const selectedLabel = isSingle && selected.length
        ? normalized.find(opt => opt.value === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="compendioPickFilter('${key}','${encoded}','${_compEscapeAttr(title || 'Filtro')}','${isSingle ? 'single' : 'multi'}')" data-value="${_compEscapeAttr(selected.join(','))}">
        ${escapeHtml(title || 'Filtro')}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _compMatches(item, state) {
    const q = (state.search || '').trim().toLowerCase();
    if (q && !String(item.search || '').toLowerCase().includes(q) && !String(item.title || '').toLowerCase().includes(q)) {
        return false;
    }
    const f = state.filters || {};
    const sources = _compFilterValues(f.source);
    const groups = _compFilterValues(f.group);
    const classes = _compFilterValues(f.class);
    if (sources.length && !sources.includes(item.source)) return false;
    if (groups.length && !groups.includes(item.group)) return false;
    if (classes.length) {
        if (item.type === 'sottoclassi' && !classes.some(cls => item.data.className === cls || item.data.classNameEn === cls)) return false;
        if (item.type === 'incantesimi' && !classes.some(cls => _compSpellMatchesClass(item.data, cls))) return false;
    }
    if (item.type === 'incantesimi') {
        const sp = item.data;
        const levels = _compFilterValues(f.level);
        const schools = _compFilterValues(f.school);
        const components = _compFilterValues(f.component);
        const concentrations = _compFilterValues(f.concentration);
        const rituals = _compFilterValues(f.ritual);
        if (levels.length && !levels.includes(String(sp.level))) return false;
        if (schools.length && !schools.includes(sp.school_it || sp.school)) return false;
        if (components.length && !components.some(component => _compSpellHasComponent(sp, component))) return false;
        if (concentrations.length === 1 && concentrations[0] === 'yes' && !_compSpellIsConcentration(sp)) return false;
        if (concentrations.length === 1 && concentrations[0] === 'no' && _compSpellIsConcentration(sp)) return false;
        if (rituals.length === 1 && rituals[0] === 'yes' && !_compSpellIsRitual(sp)) return false;
        if (rituals.length === 1 && rituals[0] === 'no' && _compSpellIsRitual(sp)) return false;
    }
    return true;
}

function _compListHtml(tab, items) {
    const sorted = _compSortItems(tab, items);
    if (tab === 'sottoclassi' || tab === 'razze' || tab === 'incantesimi') {
        const groups = _compGroupItems(sorted);
        const state = _compStateFor(tab);
        return `<div class="comp-grouped-list">${groups.map(group => `
            <section class="comp-group">
                <button type="button" class="comp-group-divider ${_compGroupOpen(tab, group.label, state) ? 'open' : ''}" onclick="compendioToggleGroup('${_compEscapeAttr(group.label)}')">
                    ${_compIcon('chevron-right')}
                    <span>${escapeHtml(group.label)}</span>
                    <small>${group.items.length}</small>
                </button>
                <div class="comp-list" ${_compGroupOpen(tab, group.label, state) ? '' : 'style="display:none;"'}>${group.items.map(item => _compCardHtml(item)).join('')}</div>
            </section>
        `).join('')}</div>`;
    }
    return `<div class="comp-list">${sorted.map(item => _compCardHtml(item)).join('')}</div>`;
}

function _compGroupOpen(tab, label, state) {
    if (Object.prototype.hasOwnProperty.call(state.openGroups || {}, label)) return !!state.openGroups[label];
    return tab === 'incantesimi';
}

window.compendioToggleGroup = function(label) {
    const state = _compStateFor(_compCurrentTab);
    state.openGroups = state.openGroups || {};
    state.openGroups[label] = !_compGroupOpen(_compCurrentTab, label, state);
    compendioRenderTab();
};

function _compSortItems(tab, items) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...items].sort((a, b) => {
        if (tab === 'incantesimi') {
            const lvl = (a.sortLevel || 0) - (b.sortLevel || 0);
            if (lvl !== 0) return lvl;
        }
        if (tab === 'razze') {
            const aLoose = a.group === 'Razze senza sottorazze' ? 1 : 0;
            const bLoose = b.group === 'Razze senza sottorazze' ? 1 : 0;
            if (aLoose !== bLoose) return aLoose - bLoose;
        }
        const g = collator.compare(a.group || '', b.group || '');
        if (g !== 0) return g;
        return collator.compare(a.title || '', b.title || '');
    });
}

function _compGroupItems(items) {
    const groups = [];
    items.forEach(item => {
        const label = item.group || 'Altro';
        let group = groups.find(g => g.label === label);
        if (!group) {
            group = { label, items: [] };
            groups.push(group);
        }
        group.items.push(item);
    });
    return groups;
}

function _compCardHtml(item) {
    if (item.type === 'incantesimi') return _compSpellCardHtml(item);
    if (item.type === 'sottoclassi' || (item.type === 'razze' && item.data.isSubrace)) {
        return `
            <article class="comp-card comp-card-compact" onclick="compendioOpenDetail('${item.type}', '${_compEscapeAttr(item.id)}')">
                <div class="comp-card-main">
                    <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                </div>
            </article>
        `;
    }
    return `
        <article class="comp-card" onclick="compendioOpenDetail('${item.type}', '${_compEscapeAttr(item.id)}')">
            <div class="comp-card-main">
                <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                ${item.source ? `<span class="comp-card-source">${escapeHtml(item.source)}</span>` : ''}
            </div>
            <div class="comp-card-meta">${(item.tags || []).slice(0, item.type === 'classi' ? 2 : 4).map(t => `<span class="comp-tag">${escapeHtml(t)}</span>`).join('')}</div>
            ${item.desc ? `<p class="comp-card-desc">${escapeHtml(_compPlain(item.desc))}</p>` : ''}
        </article>
    `;
}

function _compSpellCardHtml(item) {
    const sp = item.data;
    return `
        <article class="comp-card comp-spell-card" onclick="compendioOpenDetail('${item.type}', '${_compEscapeAttr(item.id)}')">
            <div class="comp-spell-card-body">
                <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                <div class="comp-spell-card-meta">
                    <span>${escapeHtml(_compSpellField(sp, 'school'))}</span>
                    <span>${escapeHtml(_compSpellField(sp, 'duration'))}</span>
                </div>
            </div>
            <div class="comp-spell-level">${escapeHtml(_compSpellLevelShort(sp.level))}</div>
        </article>
    `;
}

window.compendioOpenDetail = function(type, id) {
    const item = _compItems(type).find(x => String(x.id) === String(id));
    if (!item) return;
    _compCurrentTab = type;
    _compStateFor(type).detail = { id };
    compendioRenderTab();
    _compScrollToTop();
};

function _compDetailPageHtml(item) {
    return `
        <div class="comp-detail-page">
            ${_compDetailHtml(item)}
        </div>
    `;
}

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
        ['Tiri salvezza', _compField(cls, 'prof_saving_throws')],
        ['Armature', _compField(cls, 'prof_armor')],
        ['Armi', _compField(cls, 'prof_weapons')],
        ['Strumenti', _compField(cls, 'prof_tools')],
        ['Incantesimi', _compField(cls, 'spellcasting_ability') || 'Non incantatore'],
    ];
    return `
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
            <div class="comp-rich">${_compRich(_compField(cls, 'prof_skills') || '')}</div>
        </section>
        <section class="comp-detail-section">
            <h3>Equipaggiamento</h3>
            <div class="comp-rich">${_compRich(_compField(cls, 'equipment') || '')}</div>
        </section>
        ${_compFeaturesSection(cls.features || [])}
        ${_compClassSubclassesSection(cls)}
    `;
}

function _compClassSubclassesSection(cls) {
    const subclasses = _compSortedSubclasses(cls.subclasses || []);
    if (!subclasses.length) return '';
    const clsId = cls.slug || cls.name || cls.name_en || 'classe';
    return `<section class="comp-detail-section">
        <h3>Sottoclassi</h3>
        <div class="comp-subclass-accordion-list">
            ${subclasses.map(sub => _compSubclassAccordionHtml(clsId, sub)).join('')}
        </div>
    </section>`;
}

function _compObjectsPageHtml() {
    const state = _compStateFor('oggetti');
    state.subTab = state.subTab || 'equipaggiamento';
    return `
        <div class="comp-inner-tabs">
            <button type="button" class="comp-inner-tab ${state.subTab === 'equipaggiamento' ? 'active' : ''}" onclick="compendioSetObjectsSubTab('equipaggiamento')">Equipaggiamento</button>
            <button type="button" class="comp-inner-tab ${state.subTab === 'oggetti' ? 'active' : ''}" onclick="compendioSetObjectsSubTab('oggetti')">Oggetti e Veleni</button>
        </div>
        ${state.subTab === 'oggetti' ? _compObjectsInventoryHtml(state) : _compEquipmentTablesHtml()}
    `;
}

window.compendioSetObjectsSubTab = function(tab) {
    const state = _compStateFor('oggetti');
    state.subTab = tab === 'oggetti' ? 'oggetti' : 'equipaggiamento';
    compendioRenderTab();
    _compScrollToTop();
};

window.compendioSetObjectsSearch = function(value) {
    const state = _compStateFor('oggetti');
    state.objectsSearch = value || '';
    compendioRenderTab();
};

function _compEquipmentTablesHtml() {
    const weapons = typeof DND_ARMI !== 'undefined' && Array.isArray(DND_ARMI) ? DND_ARMI : [];
    const armors = typeof DND_ARMATURE !== 'undefined' && Array.isArray(DND_ARMATURE) ? DND_ARMATURE : [];
    return `
        <section class="comp-detail-section">
            <h3>Armi</h3>
            <div class="comp-table-wrap">
                <table class="comp-equipment-table">
                    <thead><tr><th>Nome</th><th>Categoria</th><th>Danni</th><th>Tipo</th><th>Proprieta</th></tr></thead>
                    <tbody>${weapons.map(w => `
                        <tr>
                            <td>${escapeHtml(w.nome || '')}</td>
                            <td>${escapeHtml(_compEquipmentCategory(w.cat))}</td>
                            <td>${escapeHtml(w.danni || '-')}</td>
                            <td>${escapeHtml(w.tipo_danno || '-')}</td>
                            <td>${escapeHtml(_compArrayLabel(w.proprieta) || '-')}</td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </section>
        <section class="comp-detail-section">
            <h3>Armature e Scudi</h3>
            <div class="comp-table-wrap">
                <table class="comp-equipment-table">
                    <thead><tr><th>Nome</th><th>Categoria</th><th>CA</th><th>Forza</th><th>Furtivita</th></tr></thead>
                    <tbody>${armors.map(a => `
                        <tr>
                            <td>${escapeHtml(a.nome || '')}</td>
                            <td>${escapeHtml(_compEquipmentCategory(a.cat))}</td>
                            <td>${escapeHtml(_compArmorClassLabel(a))}</td>
                            <td>${escapeHtml(a.forza ? String(a.forza) : '-')}</td>
                            <td>${escapeHtml(a.furtivita || '-')}</td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </section>
    `;
}

function _compObjectsInventoryHtml(state) {
    const q = String(state.objectsSearch || '').trim().toLowerCase();
    const magicItems = (Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [])
        .map(item => _compInventoryItem('catalog', item))
        .filter(Boolean);
    const poisons = (Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [])
        .map(item => _compInventoryItem('veleni', item))
        .filter(Boolean);
    const all = [...magicItems, ...poisons]
        .filter(item => !q || item.search.includes(q))
        .sort((a, b) => a.group.localeCompare(b.group, 'it') || a.title.localeCompare(b.title, 'it'));
    const groups = _compGroupItems(all);
    return `
        <div class="comp-toolbar">
            <label class="comp-search-wrap">
                ${_compIcon('search')}
                <input class="comp-search" type="search" placeholder="Cerca oggetto o veleno..."
                    value="${escapeHtml(state.objectsSearch || '')}" oninput="compendioSetObjectsSearch(this.value)">
            </label>
        </div>
        <p class="comp-count">${all.length} risultati su ${magicItems.length + poisons.length}</p>
        ${all.length ? `<div class="comp-grouped-list">${groups.map(group => `
            <section class="comp-group">
                <button type="button" class="comp-group-divider ${_compObjectsGroupOpen(group.label, state) ? 'open' : ''}" onclick="compendioToggleObjectsGroup('${_compEscapeAttr(group.label)}')">
                    ${_compIcon('chevron-right')}
                    <span>${escapeHtml(group.label)}</span>
                    <small>${group.items.length}</small>
                </button>
                <div class="comp-list" ${_compObjectsGroupOpen(group.label, state) ? '' : 'style="display:none;"'}>
                    ${group.items.map(_compInventoryCardHtml).join('')}
                </div>
            </section>
        `).join('')}</div>` : '<div class="comp-empty">Nessun elemento trovato</div>'}
    `;
}

function _compInventoryItem(source, item) {
    if (!item) return null;
    if (source === 'veleni') {
        const title = item.nome_it || item.nome_en || 'Veleno';
        const meta = `${item.sotto_tipo_it || ''}${item.categoria_it ? ' (' + item.categoria_it + ')' : ''} · ${item.rarita_it || ''} · ${item.prezzo_mo || 0} mo`;
        return {
            source,
            id: item.id,
            title,
            subtitle: item.nome_en && item.nome_en !== item.nome_it ? item.nome_en : '',
            meta,
            group: 'Veleni',
            rarity: item.rarita_it || '',
            search: [title, item.nome_en, item.sotto_tipo_it, item.categoria_it, item.rarita_it, item.descrizione_it, item.descrizione_en].join(' ').toLowerCase(),
        };
    }
    const title = item.nome || item.nome_en || 'Oggetto';
    const meta = typeof window.formatOggettoMeta === 'function'
        ? window.formatOggettoMeta(item)
        : [item.tipo, item.sotto_tipo, item.rarita].filter(Boolean).join(' · ');
    return {
        source,
        id: item.id,
        title,
        subtitle: item.nome_en && item.nome_en !== item.nome ? item.nome_en : '',
        meta,
        group: 'Oggetti Magici',
        rarity: item.rarita || '',
        search: [title, item.nome_en, item.tipo, item.sotto_tipo, item.rarita, item.descrizione, item.descrizione_en].join(' ').toLowerCase(),
    };
}

function _compInventoryCardHtml(item) {
    const rarClass = typeof _invRarityClass === 'function' ? _invRarityClass(item.rarity) : '';
    return `<article class="comp-card comp-inventory-card ${rarClass}">
        <div class="comp-card-main">
            <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
            <span class="comp-card-source">${escapeHtml(item.rarity || item.group)}</span>
        </div>
        ${item.subtitle ? `<div class="comp-card-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
        ${item.meta ? `<div class="comp-card-meta comp-inventory-meta">${escapeHtml(item.meta)}</div>` : ''}
    </article>`;
}

function _compObjectsGroupOpen(label, state) {
    if (Object.prototype.hasOwnProperty.call(state.openGroups || {}, label)) return !!state.openGroups[label];
    return true;
}

window.compendioToggleObjectsGroup = function(label) {
    const state = _compStateFor('oggetti');
    state.openGroups = state.openGroups || {};
    state.openGroups[label] = !_compObjectsGroupOpen(label, state);
    compendioRenderTab();
};

function _compEquipmentCategory(value) {
    const labels = {
        semplice_mischia: 'Semplice da mischia',
        semplice_distanza: 'Semplice a distanza',
        guerra_mischia: 'Da guerra da mischia',
        guerra_distanza: 'Da guerra a distanza',
        leggera: 'Leggera',
        media: 'Media',
        pesante: 'Pesante',
        scudo: 'Scudo',
    };
    return labels[value] || value || '';
}

function _compArmorClassLabel(armor) {
    if (!armor) return '';
    if (armor.cat === 'scudo') return '+2';
    if (!armor.mod_des) return String(armor.ca_base || '');
    if (armor.max_des === 2) return `${armor.ca_base} + Des (max 2)`;
    return `${armor.ca_base} + Des`;
}

function _compSubclassAccordionHtml(clsId, sub) {
    const subId = sub.slug || sub.name || sub.name_en || _compName(sub);
    const key = _compSubclassOpenKey(clsId, subId);
    const state = _compStateFor('classi');
    const isOpen = !!state.openSubclasses?.[key];
    const features = sub.features || [];
    return `<section class="comp-subclass-accordion">
        <button type="button" class="comp-group-divider comp-subclass-toggle ${isOpen ? 'open' : ''}" onclick="compendioToggleClassSubclass('${_compEscapeAttr(clsId)}','${_compEscapeAttr(subId)}')">
            ${_compIcon('chevron-right')}
            <span>${escapeHtml(_compName(sub) || 'Sottoclasse')}</span>
            <small>${features.length}</small>
        </button>
        <div class="comp-subclass-body" ${isOpen ? '' : 'style="display:none;"'}>
            ${_compFeaturesSection(features)}
        </div>
    </section>`;
}

window.compendioToggleClassSubclass = function(clsId, subId) {
    const state = _compStateFor('classi');
    state.openSubclasses = state.openSubclasses || {};
    const key = _compSubclassOpenKey(clsId, subId);
    state.openSubclasses[key] = !state.openSubclasses[key];
    compendioRenderTab();
};

function _compSubclassOpenKey(clsId, subId) {
    return `${clsId}::${subId}`;
}

function _compSortedSubclasses(subclasses) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...subclasses].sort((a, b) => {
        const an = _compSubclassSortLabel(a);
        const bn = _compSubclassSortLabel(b);
        const byClean = collator.compare(an, bn);
        if (byClean !== 0) return byClean;
        return collator.compare(_compName(a) || '', _compName(b) || '');
    });
}

function _compSubclassSortLabel(sub) {
    let name = String(_compName(sub) || '').trim();
    name = name.replace(/^(via|cammino|giuramento|circolo|dominio|collegio|scuola|tradizione|archetipo|sentiero)\s+(dell'|della|dello|degli|delle|del|dei|di|de)\s*/i, '');
    name = name.replace(/^(way|path|oath|circle|domain|college|school|tradition|archetype)\s+of\s+(the\s+)?/i, '');
    return name.trim() || String(_compName(sub) || '').trim();
}

function _compFeatureDetail(title, subtitle, features, data) {
    return `
        <div class="comp-detail-subtitle">${escapeHtml(subtitle || data.name_en || '')}</div>
        ${_compFeaturesSection(features)}
    `;
}

function _compRaceDetail(race, title, subtitle) {
    const base = race.baseRace || race;
    const mergedTraits = [
        ...(base.traits || base.features || []),
        ...(race.isSubrace ? (race.traits || race.features || []) : []),
    ];
    const description = race.isSubrace
        ? [_compField(base, 'description'), _compField(race, 'description')].filter(Boolean).join('\n\n')
        : _compField(base, 'description');
    return `
        <div class="comp-detail-subtitle">${escapeHtml([subtitle, base.source_short || base.source].filter(Boolean).join(' - '))}</div>
        ${_compBoxes([
            ['Taglia', base.size],
            ['Velocita', base.speed != null ? `${base.speed} m` : ''],
            ['Incrementi', [base.asi_text, race.isSubrace ? race.asi_text : ''].filter(Boolean).join('; ')],
            ['Linguaggi', _compArrayLabel([...(base.languages || []), ...(race.isSubrace ? (race.languages || []) : [])])],
        ])}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(description || '')}</div></section>
        ${_compFeaturesSection(mergedTraits)}
    `;
}

function _compBackgroundDetail(bg, title, subtitle) {
    return `
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
    const lvlText = _compSpellLevel(sp.level);
    return `
        <article class="comp-spell-detail">
            <header class="comp-spell-detail-head">
                <div>
                    <div class="spell-detail-sub">${escapeHtml(lvlText)} &middot; ${escapeHtml(_compSpellField(sp, 'school'))}</div>
                </div>
                <div class="comp-spell-level comp-spell-level-large">${escapeHtml(_compSpellLevelShort(sp.level))}</div>
            </header>
            <div class="spell-detail-meta">
                <div><span class="spell-meta-label">Tempo</span><span>${escapeHtml(_compSpellField(sp, 'casting_time'))}</span></div>
                <div><span class="spell-meta-label">Gittata</span><span>${escapeHtml(_compSpellField(sp, 'range'))}</span></div>
                <div><span class="spell-meta-label">Componenti</span><span>${escapeHtml(_compSpellField(sp, 'components'))}</span></div>
                <div><span class="spell-meta-label">Durata</span><span>${escapeHtml(_compSpellField(sp, 'duration'))}</span></div>
            </div>
            <div class="spell-detail-desc">${_compRich(_compSpellField(sp, 'description'))}</div>
            <div class="spell-detail-classes">${(_compSpellField(sp, 'classes') || []).map(c => `<span class="scheda-tag">${escapeHtml(c)}</span>`).join('')}</div>
            ${_compSpellSource(sp) ? `<div class="spell-detail-source">${escapeHtml(_compSpellSource(sp))}</div>` : ''}
        </article>
    `;
}

function _compSimpleDetail(item, boxes) {
    return `
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
                <h4 class="comp-feature-title">${escapeHtml(_compName(f) || 'Privilegio')}${f.level != null ? ` - Livello ${escapeHtml(String(f.level))}` : ''}</h4>
                <div class="comp-rich">${_compRich(_compField(f, 'description') || f.description_it || f.description_en || '')}</div>
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

function _compScrollToTop() {
    requestAnimationFrame(() => {
        document.getElementById('mainContent')?.scrollTo({ top: 0, left: 0 });
        document.getElementById('compendioContent')?.scrollTo?.({ top: 0, left: 0 });
        window.scrollTo?.({ top: 0, left: 0 });
    });
}

function _compLang() {
    try { return typeof getAppLang === 'function' ? getAppLang() : 'it'; }
    catch { return 'it'; }
}

function _compField(entry, field) {
    if (!entry) return '';
    if (_compLang() === 'en') return entry[`${field}_en`] || entry[field] || '';
    return entry[field] || entry[`${field}_en`] || '';
}

function _compName(entry) {
    if (!entry) return '';
    if (_compLang() === 'en') return entry.name_en || entry.name || entry.name_it || '';
    return entry.name || entry.name_it || entry.name_en || '';
}

function _compSpellField(sp, key) {
    if (!sp) return '';
    if (_compLang() === 'en') {
        switch (key) {
            case 'name': return sp.name_en || sp.name || '';
            case 'school': return (sp.school || sp.school_it || '').replace(/^./, c => c.toUpperCase());
            case 'casting_time': return sp.casting_time_en || sp.casting_time || '';
            case 'range': return sp.range_en || sp.range || '';
            case 'components': return sp.components_en || sp.components || '';
            case 'duration': return sp.duration_en || sp.duration || '';
            case 'description': return sp.description_en || sp.description || '';
            case 'classes': return sp.classes_en || sp.classes || [];
        }
    }
    switch (key) {
        case 'name': return sp.name || sp.name_en || '';
        case 'school': return sp.school_it || (sp.school || '').replace(/^./, c => c.toUpperCase());
        case 'casting_time': return sp.casting_time || sp.casting_time_en || '';
        case 'range': return sp.range || sp.range_en || '';
        case 'components': return sp.components || sp.components_en || '';
        case 'duration': return sp.duration || sp.duration_en || '';
        case 'description': return sp.description || sp.description_en || '';
        case 'classes': return sp.classes || sp.classes_en || [];
    }
    return '';
}

function _compSpellSource(sp) {
    const source = String(sp?.source || '').trim();
    if (!source) return '';
    const classExpansion = source.match(/^(?:Artificer|Bard|Cleric|Druid|Paladin|Ranger|Sorcerer|Warlock|Wizard|Artefice|Bardo|Chierico|Druido|Paladino|Stregone|Mago|Ladro)\s+\[([A-Za-z0-9+]+)\]$/i);
    if (classExpansion) {
        return _compSourceFromAbbrev(classExpansion[1]);
    }
    return source;
}

function _compSpellClassOptions(allItems) {
    const spellClasses = allItems.flatMap(item => _compSpellClassLabels(item.data));
    const casterClasses = (window.CLASSES_DATA || [])
        .filter(cls => cls.spellcasting_ability || cls.spellcasting_ability_en)
        .map(cls => _compName(cls));
    return _compUnique([...spellClasses, ...casterClasses]);
}

function _compSpellClassLabels(sp) {
    if (!sp) return [];
    const labels = _compLang() === 'en' ? (sp.classes_en || sp.classes || []) : (sp.classes || sp.classes_en || []);
    const sourceClass = _compSpellSourceClass(sp, _compLang());
    const virtualClasses = _compSpellVirtualClasses(sp);
    return [...labels, sourceClass, ...virtualClasses].filter(Boolean);
}

function _compSpellMatchesClass(sp, className) {
    const wanted = _compClassAliasSet(className);
    const labels = [
        ...(sp?.classes || []),
        ...(sp?.classes_en || []),
        _compSpellSourceClass(sp, 'it'),
        _compSpellSourceClass(sp, 'en'),
        ..._compSpellVirtualClasses(sp, 'it'),
        ..._compSpellVirtualClasses(sp, 'en'),
    ].filter(Boolean);
    return labels.some(label => {
        const aliases = _compClassAliasSet(label);
        return [...aliases].some(alias => wanted.has(alias));
    });
}

function _compSpellVirtualClasses(sp, lang = _compLang()) {
    const name = String(sp?.name_en || sp?.name || '').trim().toLowerCase();
    if (!COMP_ARTIFICER_SPELLS.has(name)) return [];
    return [COMP_CLASS_LABELS.artefice[lang]];
}

function _compSpellSourceClass(sp, lang = _compLang()) {
    const match = String(sp?.source || '').trim().match(/^(.+?)\s+\[[A-Za-z0-9+]+\]$/);
    if (!match) return '';
    const key = _compClassKey(match[1]);
    return key ? COMP_CLASS_LABELS[key]?.[lang] || match[1] : match[1];
}

function _compClassAliasSet(value) {
    const key = _compClassKey(value);
    if (!key) return new Set();
    return new Set([key, ...(COMP_CLASS_ALIASES[key] || [])]);
}

function _compClassKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    if (COMP_CLASS_LABELS[key]) return key;
    const labelKey = Object.entries(COMP_CLASS_ALIASES)
        .find(([canonical, aliases]) => COMP_CLASS_LABELS[canonical] && (canonical === key || aliases.includes(key)))?.[0];
    if (labelKey) return labelKey;
    if (COMP_CLASS_ALIASES[key]) return key;
    return Object.entries(COMP_CLASS_ALIASES).find(([canonical, aliases]) => aliases.includes(key) || canonical === key)?.[0] || key;
}

function _compSourceFromAbbrev(abbrev) {
    const key = String(abbrev || '').trim().toUpperCase();
    const sources = {
        TCOE: "Tasha's Cauldron of Everything",
        XGTE: "Xanathar's Guide to Everything",
        FTD: "Fizban's Treasury of Dragons",
        PHB: "Player's Handbook",
        SRD: "Player's Handbook (SRD)",
        BR: "Player's Handbook (BR+)",
        'BR+': "Player's Handbook (BR+)",
    };
    return sources[key] || abbrev;
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

function _compFilterValues(value) {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    if (value == null || value === '') return [];
    return [String(value).trim()].filter(Boolean);
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
    if (_compLang() === 'en') return n === 0 ? 'Cantrip' : `Level ${n}`;
    return n === 0 ? 'Trucchetto' : `Livello ${n}`;
}

function _compSpellLevelShort(level) {
    const n = Number(level);
    return n === 0 ? (_compLang() === 'en' ? 'C' : 'T') : String(n);
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
        sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
        'arrow-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>',
        'chevron-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>',
    };
    return icons[name] || icons['book-open'];
}

document.addEventListener('appLangChanged', () => {
    if (window.AppState?.currentPage === 'compendio') loadCompendio();
});
