// ============================================================================
// PERSONAGGI RAZZE E BACKGROUND
// ============================================================================

// --- Race/Background selects ---

// Mappa nome IT abilita' -> chiave usata in DND_SKILLS
function _normSkillKey(n) {
    if (!n) return '';
    return String(n).toLowerCase()
        .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
        .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u')
        .replace(/'/g, '').replace(/\s+/g, '_');
}

// Restituisce la lista delle razze locali (window.RACES_DATA) ordinata
// alfabeticamente, con divider per fonte.
function buildRaceOptionsLocal() {
    const RD = window.RACES_DATA || {};
    const names = Object.keys(RD);
    if (names.length === 0) {
        // Fallback al vecchio elenco hardcoded (no auto-populate)
        return DND_RACES_GROUPED.map(r => typeof r === 'object' ? r : { value: r, label: r });
    }
    // Lista flat in ordine alfabetico italiano. La fonte rimane come metadato
    // sull'option per il filtro/badge.
    return names
        .slice()
        .sort((a, b) => a.localeCompare(b, 'it'))
        .map(name => {
            const r = RD[name];
            return { value: name, label: name, source: r.source_short || '' };
        });
}

function buildSubraceOptionsLocal(raceName) {
    const RD = window.RACES_DATA || {};
    const race = RD[raceName];
    if (!race || !Array.isArray(race.subraces) || race.subraces.length === 0) return [];
    const opts = race.subraces
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'))
        .map(sr => ({
            value: sr.name,
            label: sr.name,
            source: sr.source_short || race.source_short || ''
        }));
    return opts;
}

function buildBackgroundOptionsFromDB() {
    const bgs = AppState.cachedBackground;
    if (!bgs || bgs.length === 0) {
        return DND_BACKGROUNDS.map(b => ({ value: b, label: b }));
    }
    return bgs.map(b => ({ value: b.nome, label: b.nome, source: b.fonte || '' }));
}

// Lista dei background dal dataset locale (window.BACKGROUNDS_DATA),
// in ordine alfabetico italiano. Fallback al cache DB / hardcoded.
function buildBackgroundOptionsLocal() {
    const BG = window.BACKGROUNDS_DATA || {};
    const names = Object.keys(BG);
    if (names.length === 0) return buildBackgroundOptionsFromDB();
    return names
        .slice()
        .sort((a, b) => a.localeCompare(b, 'it'))
        .map(name => {
            const b = BG[name];
            return { value: name, label: name, source: b.source_short || '' };
        });
}

function getBackgroundLocal(nome) {
    const BG = window.BACKGROUNDS_DATA || {};
    return BG[nome] || null;
}

// Lookup razza nel dataset locale. Restituisce la struttura completa
// (vedere risorse/razze/build_races.py per lo schema).
function getRaceLocal(nome) {
    const RD = window.RACES_DATA || {};
    return RD[nome] || null;
}

function getSubraceLocal(raceName, subraceName) {
    const r = getRaceLocal(raceName);
    if (!r || !subraceName) return null;
    return (r.subraces || []).find(s => s.name === subraceName) || null;
}

// Ritorna un oggetto normalizzato con i campi che il wizard si aspetta
// (velocita, resistenze, competenze_abilita, linguaggi, ...) combinando
// razza + sottorazza. Mantiene il formato compatibile con cachedRazze.
function buildMergedRaceData(raceName, subraceName) {
    const race = getRaceLocal(raceName);
    if (!race) return null;
    const sub = subraceName ? getSubraceLocal(raceName, subraceName) : null;
    const allTraits = [
        ...(race.traits || []),
        ...((sub && sub.traits) || []),
    ];
    const merged = {
        nome: race.name || raceName,
        sottorazza: sub ? sub.name : null,
        fonte: race.source_short || '',
        velocita: race.speed || 9,
        resistenze: [...(race.resistances || []), ...((sub && sub.resistances) || [])],
        competenze_abilita: [
            ...((race.skill_proficiencies || []).map(_normSkillKey)),
            ...((sub && (sub.skill_proficiencies || []).map(_normSkillKey)) || []),
        ],
        linguaggi: [...(race.languages || []), ...((sub && sub.languages) || [])],
        darkvision: (sub && sub.darkvision != null) ? sub.darkvision : (race.darkvision || 0),
        creature_type: (sub && sub.creature_type) || race.creature_type || 'Umanoide',
        asi_text: race.asi_text || '',
        subrace_asi_text: sub ? (sub.asi_text || '') : null,
        traits: allTraits,
        innate_spells: allTraits.flatMap(t => t.innate_spells || []),
        race_resources: allTraits.filter(t => t.uses).map(t => ({
            name: t.name,
            uses: t.uses,
        })),
        size: race.size,
    };
    return merged;
}

// Compat: getRaceData consultato dal codice esistente. Prima tenta dataset
// locale (window.RACES_DATA), poi fallback al cache DB.
function getRaceData(nome) {
    if (!nome) return null;
    const local = buildMergedRaceData(nome, null);
    if (local) return local;
    if (AppState.cachedRazze) {
    return AppState.cachedRazze.find(r => r.nome === nome) || null;
    }
    return null;
}

// Tratti di razza+sottorazza per un PG salvato (oggetto pg dal DB).
function _pgRaceMergedTraits(pg) {
    if (!pg || !pg.razza) return [];
    const merged = buildMergedRaceData(pg.razza, pg.sottorazza || null);
    return merged ? (merged.traits || []) : [];
}

// Risorse derivate dai tratti razziali con `uses`. Persistite in
// pg.risorse_classe._race[key] = current.
// Chiave: name_en o name slugificato.
function _pgRaceResourceKey(trait) {
    const base = trait.name_en || trait.name || '';
    return base.replace(/[^A-Za-z0-9]+/g, '_');
}

function _pgRaceResources(pg) {
    const traits = _pgRaceMergedTraits(pg);
    const lvl = pg.livello || 1;
    const profBonus = calcBonusCompetenza(lvl);
    const stored = (pg.risorse_classe && pg.risorse_classe._race) || {};
    const out = [];
    traits.forEach(t => {
        if (!t.uses) return;
        let max = t.uses.amount;
        if (max === 'prof_bonus') max = profBonus;
        max = parseInt(max) || 1;
        if (max <= 0) return;
        const key = _pgRaceResourceKey(t);
        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        let rechargeLabel = '';
        if (t.uses.recharge === 'long_rest') rechargeLabel = 'r. lungo';
        else if (t.uses.recharge === 'short_rest') rechargeLabel = 'r. breve';
        else if (t.uses.recharge === 'dawn') rechargeLabel = "all'alba";
        out.push({ key, name: t.name, max, current, recharge: rechargeLabel });
    });
    return out;
}

// Incantesimi innati razziali disponibili al livello PG.
function _pgRaceInnateSpells(pg) {
    const traits = _pgRaceMergedTraits(pg);
    const lvl = pg.livello || 1;
    const out = [];
    traits.forEach(t => {
        (t.innate_spells || []).forEach(sp => {
            const minLvl = sp.min_pg_level || 1;
            if (lvl >= minLvl) out.push({ ...sp, trait: t.name });
        });
    });
    return out;
}

// Chiave stabile per tracciare gli usi di un incantesimo innato a slot.
// Basata su nome inglese (canonico) + ricarica, evitando collisioni quando
// piu' tratti danno lo stesso spell con ricariche diverse.
function _pgInnateSpellKey(sp) {
    const base = sp.name_en || sp.name || '';
    const rec = sp.recharge || 'long_rest';
    return (base + '_' + rec).replace(/[^A-Za-z0-9]+/g, '_');
}

// Risorse "Slot magia innata": una per ogni incantesimo innato non a volonta'
// e non trucchetto. Persistite in pg.risorse_classe._innate[key] = current.
function _pgRaceInnateSlots(pg) {
    const list = _pgRaceInnateSpells(pg);
    const stored = (pg.risorse_classe && pg.risorse_classe._innate) || {};
    const out = [];
    list.forEach(sp => {
        if (sp.recharge === 'at_will') return;
        if ((sp.level || 0) === 0) return;
        const key = _pgInnateSpellKey(sp);
        const max = 1;
        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        let rechargeLabel = '';
        if (sp.recharge === 'long_rest') rechargeLabel = 'r. lungo';
        else if (sp.recharge === 'short_rest') rechargeLabel = 'r. breve';
        else if (sp.recharge === 'dawn') rechargeLabel = "all'alba";
        out.push({
            key,
            name: sp.name,
            name_en: sp.name_en,
            level: sp.level,
            level_cast: sp.level_cast || sp.level,
            ability: sp.ability,
            trait: sp.trait,
            recharge: rechargeLabel,
            max,
            current,
        });
    });
    return out;
}

// ─────────────────────────────────────────────────────────────────────────

function getBackgroundData(nome) {
    if (!nome) return null;
    // Prima il dataset locale (window.BACKGROUNDS_DATA): mappa lo schema
    // hardcoded (build_backgrounds.py) ai campi attesi dal codice esistente
    // (nome, fonte, competenze_abilita, competenze_strumenti, ...).
    const local = getBackgroundLocal(nome);
    if (local) {
        return {
            nome: local.name,
            fonte: local.source_short || '',
            competenze_abilita: local.skill_proficiencies || [],
            competenze_strumenti: local.tool_proficiencies || [],
            linguaggi_specifici: local.languages_specific || [],
            linguaggi_a_scelta: local.languages_choice || 0,
            scelte_abilita_testo: local.skill_choices_text || '',
            scelte_strumenti_testo: local.tool_choices_text || '',
            linguaggi_testo: local.languages_text || '',
            equipaggiamento_iniziale: local.starting_equipment || [],
            oro_iniziale: local.starting_gold || 0,
            privilegio_nome: (local.feature && local.feature.name) || '',
            privilegio_descrizione: (local.feature && local.feature.description) || '',
            descrizione: local.description || '',
            _local: true,
        };
    }
    if (AppState.cachedBackground) {
    return AppState.cachedBackground.find(b => b.nome === nome) || null;
    }
    return null;
}

// Applica/rimuove l'auto-popolamento (skills, resistenze, velocita') in base
// alla razza+sottorazza correntemente selezionate. Richiamato dopo qualsiasi
// modifica.
function _pgApplyRaceAutoPopulate() {
    // Rimuove i contributi della precedente selezione
    _pgRaceSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
    _pgRaceResistances.forEach(r => {
        const i = pgCurrentResistenze.indexOf(r);
        if (i >= 0) pgCurrentResistenze.splice(i, 1);
    });
    _pgRaceSkills = [];
    _pgRaceResistances = [];
    const raceName = document.getElementById('pgRazza').value || '';
    const subName = document.getElementById('pgSottorazza').value || '';
    if (!raceName) return;
    const merged = buildMergedRaceData(raceName, subName) || getRaceData(raceName);
    if (!merged) return;
    const velField = document.getElementById('pgVelocita');
    if (velField) velField.value = merged.velocita || 9;
    if (Array.isArray(merged.resistenze) && merged.resistenze.length > 0) {
        _pgRaceResistances = [...merged.resistenze];
        merged.resistenze.forEach(r => { if (!pgCurrentResistenze.includes(r)) pgCurrentResistenze.push(r); });
    }
    if (Array.isArray(merged.competenze_abilita) && merged.competenze_abilita.length > 0) {
        _pgRaceSkills = [...merged.competenze_abilita];
        merged.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
    }
}

// Mostra/nasconde il selettore sottorazza in base alla razza scelta.
function _pgUpdateSottorazzaUI() {
    const raceName = document.getElementById('pgRazza').value || '';
    const group = document.getElementById('pgSottorazzaGroup');
    const btn = document.getElementById('pgSottorazzaBtn');
    const subInput = document.getElementById('pgSottorazza');
    if (!group) return;
    const subOpts = raceName ? buildSubraceOptionsLocal(raceName) : [];
    if (subOpts.length === 0) {
        group.style.display = 'none';
        if (subInput) subInput.value = '';
        if (btn) btn.textContent = 'Seleziona sottorazza...';
        return;
    }
    group.style.display = '';
    const currentSub = subInput ? subInput.value : '';
    const exists = currentSub && subOpts.some(o => o.value === currentSub);
    if (!exists && subInput) subInput.value = '';
    if (btn) btn.textContent = exists ? currentSub : 'Seleziona sottorazza...';
}

// Stato persistente per i picker (razza/sottorazza/background) e' inizializzato
// on-demand in openRazzaPicker, basato su stateKey: window._pgPickerSearch_<key>,
// window._pgPickerSources_<key>, window._pgPickerShow_<key>.

window.pgOpenRazzaSelect = function() {
    openRazzaPicker(
        buildRaceOptionsLocal(),
        'Seleziona Razza',
        (value) => {
            document.getElementById('pgRazza').value = value;
            const btn = document.getElementById('pgRazzaBtn');
            if (btn) btn.textContent = value;
            // Reset sottorazza se si cambia razza
            const subInput = document.getElementById('pgSottorazza');
            if (subInput) subInput.value = '';
            _pgUpdateSottorazzaUI();
            _pgApplyRaceAutoPopulate();
            // Se ci sono sottorazze, apri subito il selettore
            const subOpts = buildSubraceOptionsLocal(value);
            if (subOpts.length > 0) {
                setTimeout(() => window.pgOpenSottorazzaSelect(), 100);
            }
        },
        {
            stateKey: 'razza',
            placeholder: 'Cerca razza...',
            emptyText: 'Nessuna razza corrisponde ai filtri.',
        }
    );
}

window.pgOpenSottorazzaSelect = function() {
    const raceName = document.getElementById('pgRazza').value || '';
    if (!raceName) return;
    const opts = buildSubraceOptionsLocal(raceName);
    if (opts.length === 0) return;
    // Picker con sola ricerca (niente filtro fonte: tutte le sottorazze
    // appartengono comunque a un'unica razza ed e' utile vederle insieme).
    openRazzaPicker(
        opts,
        'Seleziona Sottorazza',
        (value) => {
            document.getElementById('pgSottorazza').value = value;
            const btn = document.getElementById('pgSottorazzaBtn');
            if (btn) btn.textContent = value;
            _pgApplyRaceAutoPopulate();
        },
        {
            stateKey: 'sottorazza',
            placeholder: 'Cerca sottorazza...',
            emptyText: 'Nessuna sottorazza corrisponde alla ricerca.',
            hideSourceFilter: opts.every(o => !o.source || o.source === opts[0].source),
        }
    );
}

// Picker razze/sottorazze con barra di ricerca + filtri per fonte (manuale).
// Le opzioni devono essere flat (no divider): ogni option ha { value, label,
// source }. Lo stato di ricerca/filtro e' globale (window._pgRazza*) per
// preservare l'ultima selezione tra aperture nella stessa sessione.
function openRazzaPicker(options, title, onSelect, opts = {}) {
    closeCustomSelect();
    // Stato indipendente per contesto: razza, sottorazza, background, ...
    // Cosi' search/filtri non si mescolano fra picker diversi.
    const stateKey = opts.stateKey || 'razza';
    const SK_SEARCH = '_pgPickerSearch_' + stateKey;
    const SK_SOURCES = '_pgPickerSources_' + stateKey;
    const SK_SHOW = '_pgPickerShow_' + stateKey;
    if (!window[SK_SOURCES]) window[SK_SOURCES] = new Set();
    const placeholder = opts.placeholder || 'Cerca per nome...';
    const emptyText = opts.emptyText || 'Nessuna voce corrisponde ai filtri.';
    const flat = options.filter(o => o.type !== 'divider');
    const allSources = Array.from(new Set(flat.map(o => o.source).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'it'));
    const hideFilters = !!opts.hideSourceFilter || allSources.length <= 1;
    if (hideFilters) {
        window[SK_SOURCES] = new Set();
    } else {
        const valid = new Set(allSources);
        window[SK_SOURCES] = new Set(
            Array.from(window[SK_SOURCES]).filter(s => valid.has(s))
        );
    }

    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    setSafeHtml(overlay, `
        <div class="custom-select-panel razza-picker-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" data-razza-picker-action="close">&times;</button>
            </div>
            <div class="razza-picker-body">
                <div class="spell-picker-search-row">
                    <input type="text" id="razzaPickerSearch" class="hp-calc-input spell-picker-search" placeholder="${escapeAttr(placeholder)}" autocomplete="off">
                    ${hideFilters ? '' : `<button type="button" class="spell-picker-filter-btn" id="razzaPickerFilterBtn" title="Filtri">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        <span class="spell-picker-filter-badge" id="razzaPickerFilterBadge" style="display:none;">0</span>
                    </button>`}
                </div>
                <div class="spell-filter-panel" id="razzaPickerFilterPanel" style="display:none;">
                    <div class="spell-filter-group">
                        <div class="spell-filter-label">Manuale</div>
                        <div class="spell-filter-chips" id="razzaPickerSourceChips"></div>
                    </div>
                    <div class="spell-filter-actions">
                        <button type="button" class="btn-secondary btn-small" id="razzaPickerResetBtn">Reset</button>
                    </div>
                </div>
                <div class="custom-select-list" id="razzaPickerList"></div>
                <div class="razza-picker-empty" id="razzaPickerEmpty" style="display:none;">${escapeHtml(emptyText)}</div>
            </div>
        </div>`);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('[data-razza-picker-action="close"]')) {
            closeCustomSelect();
        }
    });

    const searchInput = overlay.querySelector('#razzaPickerSearch');
    const listEl = overlay.querySelector('#razzaPickerList');
    const emptyEl = overlay.querySelector('#razzaPickerEmpty');
    const filterBtn = overlay.querySelector('#razzaPickerFilterBtn');
    const filterPanel = overlay.querySelector('#razzaPickerFilterPanel');
    const filterBadge = overlay.querySelector('#razzaPickerFilterBadge');
    const sourceChipsEl = overlay.querySelector('#razzaPickerSourceChips');
    const resetBtn = overlay.querySelector('#razzaPickerResetBtn');

    if (window[SK_SEARCH]) searchInput.value = window[SK_SEARCH];

    function renderSourceChips() {
        if (!sourceChipsEl) return;
        setSafeHtml(sourceChipsEl, allSources.map(src => {
            const active = window[SK_SOURCES].has(src);
            return `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" data-src="${escapeAttr(src)}">${escapeHtml(src)}</button>`;
        }).join(''));
        sourceChipsEl.querySelectorAll('.spell-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const src = chip.dataset.src;
                if (window[SK_SOURCES].has(src)) window[SK_SOURCES].delete(src);
                else window[SK_SOURCES].add(src);
                chip.classList.toggle('active');
                renderList();
                updateFilterBadge();
            });
        });
    }

    function updateFilterBadge() {
        if (!filterBadge) return;
        const n = window[SK_SOURCES].size;
        if (n > 0) {
            filterBadge.style.display = '';
            filterBadge.textContent = n;
            filterBtn.classList.add('active');
        } else {
            filterBadge.style.display = 'none';
            filterBtn.classList.remove('active');
        }
    }

    function renderList() {
        const q = (searchInput.value || '').trim().toLowerCase();
        window[SK_SEARCH] = searchInput.value || '';
        const selSrc = window[SK_SOURCES];
        const filtered = flat.filter(o => {
            if (q && !(o.label || '').toLowerCase().includes(q)) return false;
            if (selSrc.size > 0 && !selSrc.has(o.source)) return false;
            return true;
        });
        if (filtered.length === 0) {
            setSafeHtml(listEl, '');
            emptyEl.style.display = '';
            return;
        }
        emptyEl.style.display = 'none';
        setSafeHtml(listEl, filtered.map(o => {
            const srcHtml = o.source ? ` <span class="option-source">(${escapeHtml(o.source)})</span>` : '';
            return `<button type="button" class="custom-select-item" data-val="${escapeAttr(o.value)}">${escapeHtml(o.label)}${srcHtml}</button>`;
        }).join(''));
        listEl.querySelectorAll('.custom-select-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.val;
                closeCustomSelect();
                if (typeof onSelect === 'function') onSelect(val);
            });
        });
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            window[SK_SHOW] = !window[SK_SHOW];
            filterPanel.style.display = window[SK_SHOW] ? '' : 'none';
        });
        if (window[SK_SHOW]) filterPanel.style.display = '';
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            window[SK_SOURCES] = new Set();
            renderSourceChips();
            updateFilterBadge();
            renderList();
        });
    }

    searchInput.addEventListener('input', () => renderList());
    renderSourceChips();
    updateFilterBadge();
    renderList();
    // NIENTE auto-focus: l'utente decide se attivare la tastiera cliccando.
}

window.pgOpenBackgroundSelect = function() {
    openRazzaPicker(
        buildBackgroundOptionsLocal(),
        'Seleziona Background',
        (value) => {
            document.getElementById('pgBackground').value = value;
            const btn = document.getElementById('pgBackgroundBtn');
            if (btn) btn.textContent = value;
            _pgApplyBackgroundAutoPopulate();
        },
        {
            stateKey: 'background',
            placeholder: 'Cerca background...',
            emptyText: 'Nessun background corrisponde ai filtri.',
        }
    );
}

// Applica/rimuove l'auto-popolamento (skills, tools, languages) in base al
// background correntemente selezionato. Idempotente: rimuove sempre prima
// i contributi della precedente selezione.
function _pgApplyBackgroundAutoPopulate() {
    _pgBgSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
    _pgBgTools.forEach(t => pgCurrentBgTools.delete(t));
    _pgBgLangs.forEach(l => pgCurrentBgLanguages.delete(l));
    _pgBgSkills = [];
    _pgBgTools = [];
    _pgBgLangs = [];

    const value = document.getElementById('pgBackground').value || '';
    if (!value) return;
            const data = getBackgroundData(value);
    if (!data) return;
    if (Array.isArray(data.competenze_abilita) && data.competenze_abilita.length > 0) {
        _pgBgSkills = [...data.competenze_abilita];
                data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
            }
    if (Array.isArray(data.competenze_strumenti) && data.competenze_strumenti.length > 0) {
        _pgBgTools = [...data.competenze_strumenti];
        data.competenze_strumenti.forEach(t => pgCurrentBgTools.add(t));
    }
    if (Array.isArray(data.linguaggi_specifici) && data.linguaggi_specifici.length > 0) {
        _pgBgLangs = [...data.linguaggi_specifici];
        data.linguaggi_specifici.forEach(l => pgCurrentBgLanguages.add(l));
    }
}

