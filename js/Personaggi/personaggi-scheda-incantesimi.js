// ============================================================================
// CHARACTER SHEET SPELLS
// ============================================================================

// Spell Page
window.schedaOpenSpellPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const classi = pg.classi || [];

    // Aggrega per caratteristica (come prima) ma mantieni TUTTI i nomi delle classi
    // che condividono quella caratteristica: l'utente potrebbe voler aggiungere bonus
    // separati per classi diverse (es. oggetto che potenzia solo gli incantesimi da Mago).
    const spellAbilities = [];
    classi.forEach(c => {
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (!ab) return;
        const existing = spellAbilities.find(s => s.ability === ab);
        if (existing) {
            if (!existing.classi.includes(c.nome)) existing.classi.push(c.nome);
        } else {
            const val = pg[ab] || 10;
            const m = Math.floor((val - 10) / 2);
            spellAbilities.push({ classi: [c.nome], ability: ab, mod: m });
        }
    });

    const spellStatsHtml = spellAbilities.length > 0 ? spellAbilities.map(sa => {
        const atkBase = sa.mod + bonusComp;
        const dcBase = 8 + bonusComp + sa.mod;
        // Somma bonus manuali di tutte le classi che condividono questa caratteristica.
        let atkExtra = 0, dcExtra = 0;
        sa.classi.forEach(cn => {
            const b = _getCasterBonusFor(pg, cn);
            atkExtra += b.atk;
            dcExtra += b.dc;
        });
        const atkTot = atkBase + atkExtra;
        const dcTot = dcBase + dcExtra;
        const atkStr = atkTot >= 0 ? `+${atkTot}` : `${atkTot}`;
        const modStr = sa.mod >= 0 ? `+${sa.mod}` : `${sa.mod}`;
        const atkMark = atkExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const dcMark = dcExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const classiArg = encodeURIComponent(JSON.stringify(sa.classi));
        const onAtk = `onclick="schedaOpenSpellAtkBonus('${pg.id}','${classiArg}')"`;
        const onDc = `onclick="schedaOpenSpellDcBonus('${pg.id}','${classiArg}')"`;
        const classesLabel = sa.classi.join(' / ');
        const titleAtk = `title="${escapeHtml(classesLabel)} – bonus tiro per colpire"`;
        const titleDc = `title="${escapeHtml(classesLabel)} – bonus CD"`;
        return `
        <div class="scheda-spell-stats-row" data-classi="${escapeHtml(classesLabel)}">
            <div class="scheda-box"><div class="scheda-box-val">${modStr}</div><div class="scheda-box-label">Car. (${sa.ability.substring(0,3).toUpperCase()})</div></div>
            <div class="scheda-box clickable" ${onAtk} ${titleAtk}><div class="scheda-box-val">${atkStr}${atkMark}</div><div class="scheda-box-label">Attacco Inc.</div></div>
            <div class="scheda-box clickable" ${onDc} ${titleDc}><div class="scheda-box-val">${dcTot}${dcMark}</div><div class="scheda-box-label">CD Inc.</div></div>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuna classe incantatrice</p>';

    // Counter "Incantesimi preparati": visibile solo per le classi che usano
    // la preparazione (Mago/Chierico/Druido/Paladino/Artefice). Il conteggio
    // include solo gli incantesimi marcati come preparati di livello >= 1
    // (i trucchetti non si preparano). Il massimo e' precompilato con la
    // formula standard (mod + livello), sovrascrivibile manualmente.
    const usesPrepared = _pgUsesPreparedSystem(pg);
    const preparedCount = usesPrepared
        ? (pg.incantesimi_preparati || [])
            .map(n => _resolveSpell(n))
            .filter(sp => sp && sp.level > 0).length
        : 0;
    const autoMax = _calcMaxPreparedAuto(pg);
    const overrideMax = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
    const preparedMax = overrideMax > 0 ? overrideMax : autoMax;
    const preparedRatio = preparedMax > 0 ? `${preparedCount} / ${preparedMax}` : `${preparedCount} / —`;
    const preparedOver = preparedMax > 0 && preparedCount > preparedMax;
    const preparedHint = overrideMax > 0
        ? '<span class="scheda-prepared-hint">manuale</span>'
        : (autoMax > 0 ? '<span class="scheda-prepared-hint">auto</span>' : '');
    const preparedBlock = usesPrepared ? `
        <div class="scheda-prepared-block ${preparedOver ? 'over' : ''}" onclick="schedaOpenPreparedMax('${pg.id}')" title="Clicca per modificare il massimo">
            <div class="scheda-prepared-label">Incantesimi preparati ${preparedHint}</div>
            <div class="scheda-prepared-value" id="schedaPreparedRatio">${preparedRatio}</div>
        </div>` : '';

    // Sincronizza gli slot salvati con quelli calcolati dalle classi correnti.
    // Necessario per allineare PG esistenti dopo modifiche alle regole di calcolo
    // (es. aggiunta Mystic Arcanum del Warlock o tabelle half/third caster fixate).
    // Preserva "used" clampato al nuovo max e salva solo se ci sono differenze.
    const expectedSlots = calcSpellSlotsFromClassi(classi);
    const prevSlots = (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') ? pg.slot_incantesimo : {};
    const reconciled = {};
    let needsSync = false;
    Object.keys(expectedSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = expectedSlots[lvKey];
        const prev = prevSlots[lv] || prevSlots[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used)) ? Math.min(parseInt(prev.used), max) : 0;
        reconciled[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
        if (!prev || parseInt(prev.max) !== max) needsSync = true;
    });
    Object.keys(prevSlots).forEach(lv => { if (!(lv in reconciled)) needsSync = true; });
    if (needsSync) {
        pg.slot_incantesimo = reconciled;
        schedaInstantSave(pgId, { slot_incantesimo: reconciled });
    }

    const slots = pg.slot_incantesimo || {};
    const levels = Object.keys(slots).map(Number).sort((a, b) => a - b);
    const slotsHtml = levels.length > 0 ? levels.map(lvl => {
        const s = slots[lvl];
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lvl}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count" id="sSlotCount_${lvl}">${s.current}/${s.max}</span>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuno slot disponibile</p>';

    // Sezione "Slot magia innata" (solo se la razza fornisce incantesimi
    // innati con ricarica, esclusi i trucchetti / a volonta').
    const innateSlots = _pgRaceInnateSlots(pg);
    let innateSlotsBlock = '';
    if (innateSlots.length > 0) {
        const rows = innateSlots.map(is => {
            const lvlLabel = `Lv ${is.level_cast}`;
            const sub = is.recharge ? ` <small>(${is.recharge})</small>` : '';
            return `<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(is.name)} <small class="scheda-innate-lvl">${lvlLabel}</small>${sub}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaInnateSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                    <span class="scheda-hd-val" id="sInnSlot_${is.key}">${is.current}</span>
                    <span class="scheda-hd-max">/ ${is.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaInnateSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                </div>
            </div>`;
        }).join('');
        innateSlotsBlock = `
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot magia innata</div>
        <div class="scheda-section-body">
            <div class="scheda-hd-list">${rows}</div>
        </div>
    </div>`;
    }

    // Slot invocazioni 1/lungo (Warlock).
    const invocationSlots = _pgInvocationSlots(pg);
    let invocationSlotsBlock = '';
    if (invocationSlots.length > 0) {
        // Sulla pagina incantesimi mostra solo gli "slot invocazione"
        // che corrispondono a un incantesimo (1/lungo). Le altre risorse
        // limitate (es. Cloak of Flies, Tomb of Levistus) sono trattate
        // come "risorse" e mostrate sulla pagina 1.
        const spellInvSlots = invocationSlots.filter(is => is.is_spell);
        if (spellInvSlots.length > 0) {
            const rows = spellInvSlots.map(is => {
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${escapeHtml(is.name)} <small class="scheda-innate-lvl">${escapeHtml(is.level_label)}</small> <small>(${escapeHtml(is.recharge)})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                        <span class="scheda-hd-val" id="sInvSlot_${is.key}">${is.current}</span>
                        <span class="scheda-hd-max">/ ${is.max}</span>
                        <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                    </div>
                </div>`;
            }).join('');
            invocationSlotsBlock = `
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot suppliche</div>
        <div class="scheda-section-body">
            <div class="scheda-hd-list">${rows}</div>
        </div>
    </div>`;
        }
    }

    const classeDisplay = classi.map(c => c.nome + (c.livello ? ' ' + c.livello : '')).join(' / ') || pg.classe || '';

    // Determina quali livelli mostrare:
    //   - trucchetti sempre,
    //   - ogni livello con slot,
    //   - ogni livello con almeno un incantesimo conosciuto,
    //   - tutti i livelli da 0 al massimo conoscibile per le classi del PG
    //     (fondamentale per il Warlock: ha solo slot di liv 5 ma conosce
    //     incantesimi 1-5, e con il Mystic Arcanum 6/7/8/9 a partire da lv 11).
    const ALL_DATA = _spellsData();
    const knownLevels = new Set();
    (pg.incantesimi_conosciuti || []).forEach(n => {
        const sp = _resolveSpell(n);
        if (sp) knownLevels.add(sp.level);
    });
    // Livelli con incantesimi razziali innati (devono apparire anche se la
    // classe del PG non darebbe accesso a quel livello).
    const innateLevels = new Set();
    _pgRaceInnateSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name) || _resolveSpell(s.name_en);
        if (sp) innateLevels.add(sp.level);
    });
    // Livelli con incantesimi auto-garantiti da sottoclasse (Domini,
    // Giuramenti, Patroni con lista espansa, ecc.).
    const subclassLevels = new Set();
    _pgSubclassGrantedSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name);
        if (sp) subclassLevels.add(sp.level);
    });
    // Livelli con incantesimi conferiti dalle invocazioni del Warlock.
    const invocationLevels = new Set();
    _pgInvocationGrantedSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name) || _resolveSpell(s.name_en);
        if (sp) invocationLevels.add(sp.level);
    });
    const maxKnowableLevel = _maxKnownSpellLevel(classi);
    const knowableLevels = [];
    for (let l = 0; l <= maxKnowableLevel; l++) knowableLevels.push(l);
    const levelsToShow = new Set([0, ...knowableLevels, ...levels, ...knownLevels, ...innateLevels, ...subclassLevels, ...invocationLevels]);
    // Mostra fino al massimo livello disponibile nel dataset
    const maxAvail = Math.max(0, ...Object.values(ALL_DATA).map(s => s.level));
    const orderedLevels = Array.from(levelsToShow)
        .filter(l => l <= maxAvail)
        .sort((a, b) => a - b);
    // Split per layout 2-colonne su tablet/desktop:
    //   colonna sinistra = trucchetti + livelli 1..4
    //   colonna destra   = livelli 5..9 (+ eventuali successivi)
    const leftLevels = orderedLevels.filter(l => l <= 4);
    const rightLevels = orderedLevels.filter(l => l > 4);
    const spellsLeftHtml = leftLevels.map(l => buildSpellLevelSection(pg, l)).join('');
    const spellsRightHtml = rightLevels.map(l => buildSpellLevelSection(pg, l)).join('');

    // Memorizza tab/personaggio corrente per il rerender al cambio lingua
    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'incantesimi';

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Incantesimi')}
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche Incantatore</div>
        <div class="scheda-section-body">${spellStatsHtml}${preparedBlock}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot Incantesimo</div>
        <div class="scheda-section-body">
        <div class="scheda-slots-table">${slotsHtml}</div>
        </div>
    </div>
    ${innateSlotsBlock}
    ${invocationSlotsBlock}

    <hr class="scheda-divider">

    <div class="scheda-spells-grid">
        <div class="scheda-spells-col scheda-spells-col-left">${spellsLeftHtml}</div>
        <div class="scheda-spells-col scheda-spells-col-right">${spellsRightHtml || ''}</div>
    </div>
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            schedaSlotToggleInline(pgId, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    schedaSetActiveTab('incantesimi');
    schedaWireTabBar(pgId);
}

/* ── Spells / Trucchetti ── */
// Restituisce SOLO gli incantesimi del catalogo "ufficiale" (file js/Personaggi/data/spells_data.js).
function _spellsDataNative() { return window.SPELLS_DATA || {}; }

// Adatta una riga di homebrew_incantesimi al formato usato dal picker
// (chiavi: name, name_en, school, school_it, casting_time, range,
//  components, duration, description, classes, source, ...).
function _hbSpellToCatalog(hb) {
    const schoolIt = hb.scuola || '';
    const schoolKey = (schoolIt || '').toLowerCase().trim();
    // Per le scuole canoniche IT, mappo alla key EN cosi' i filtri standard
    // funzionano correttamente; per le homebrew lascio la stringa lower.
    const schoolEn = _SPELL_SCHOOL_IT_TO_EN[schoolKey] || schoolKey;
    const sourceLabel = hb._author_name ? `Homebrew · ${hb._author_name}` : 'Homebrew';
    return {
        // Chiave logica univoca per il picker (non confligge con quelle native)
        _hb_id: hb.id,
        _is_homebrew: true,
        _author_uid: hb._author_uid,
        _author_name: hb._author_name,
        _is_own: hb._is_own,
        name: hb.nome || '',
        name_en: hb.nome || '',
        level: typeof hb.livello === 'number' ? hb.livello : 0,
        school: schoolEn,
        school_it: schoolIt,
        casting_time: hb.tempo_lancio || '',
        casting_time_en: hb.tempo_lancio || '',
        range: hb.gittata || '',
        range_en: hb.gittata || '',
        components: hb.componenti || '',
        components_en: hb.componenti || '',
        duration: hb.durata || '',
        duration_en: hb.durata || '',
        description: hb.descrizione || '',
        description_en: hb.descrizione || '',
        classes: [],
        classes_en: [],
        source: sourceLabel,
        ritual: false,
    };
}

// Pool completo: nativi + homebrew abilitati. Indicizzato per nome IT
// (chiave usata altrove) e per chiave _hb_id se presente.
function _spellsData() {
    const base = window.SPELLS_DATA || {};
    const hbList = (window.AppState?.cachedHomebrewIncantesimi) || [];
    if (!hbList.length) return base;
    const merged = { ...base };
    hbList.forEach(hb => {
        const sp = _hbSpellToCatalog(hb);
        // Evito di sovrascrivere uno spell ufficiale con stesso nome.
        const key = sp.name && !merged[sp.name] ? sp.name : `__hb_${hb.id}`;
        merged[key] = sp;
    });
    return merged;
}

/** Lingua corrente per i contenuti tradotti (incantesimi/privilegi): 'it' | 'en'.
 *  Centralizzata: leggi sempre da window.getAppLang() (impostazione globale dell'app). */
function _spellLang() {
    try { return (typeof getAppLang === 'function' ? getAppLang() : 'it'); }
    catch { return 'it'; }
}

/** Estrae il campo localizzato di un incantesimo, con fallback all'altra lingua. */
function _spellField(sp, key) {
    if (!sp) return '';
    const lang = _spellLang();
    if (lang === 'en') {
        switch (key) {
            case 'name': return sp.name_en || sp.name || '';
            case 'school': return (sp.school || '').replace(/^./, c => c.toUpperCase());
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

function _pgSpellClasses(pg) {
    const out = new Set();
    (pg.classi || []).forEach(c => { if (c?.nome) out.add(c.nome); });
    if (pg.classe) out.add(pg.classe);
    return out;
}

function _spellMatchesClassName(spell, className) {
    const target = String(className || '').trim().toLowerCase();
    if (!target) return false;

    if ((target === 'artefice' || target === 'artificer') && window.COMPANION_ARTIFICER_SPELLS instanceof Set) {
        const spellName = String(spell.name_en || spell.name || '').trim().toLowerCase();
        if (window.COMPANION_ARTIFICER_SPELLS.has(spellName)) return true;
    }

    const lists = [spell.classes || [], spell.classes_en || []];
    for (const list of lists) {
        for (const c of list) {
            if (String(c || '').trim().toLowerCase() === target) return true;
        }
    }
    return false;
}

function _spellMatchesPg(spell, pgClasses) {
    if (!pgClasses.size) return true;
    for (const c of pgClasses) if (_spellMatchesClassName(spell, c)) return true;
    return false;
}

/**
 * Risolve un nome incantesimo (italiano corrente, vecchio italiano o inglese)
 * nei dati dell'incantesimo. Supporta backward compatibility per eventuali
 * record salvati nel DB con nomi obsoleti.
 */
function _resolveSpell(name) {
    if (!name) return null;
    const all = _spellsData();
    if (all[name]) return all[name];
    // Fallback: scorri tutti gli spell e confronta con name_en o legacy_names_it
    for (const k of Object.keys(all)) {
        const sp = all[k];
        if (sp.name_en === name) return sp;
        if (Array.isArray(sp.aliases) && sp.aliases.includes(name)) return sp;
    }
    return null;
}

const SPELL_LEVEL_LABELS = {
    0: 'Trucchetti',
    1: 'Incantesimi di Livello 1',
    2: 'Incantesimi di Livello 2',
    3: 'Incantesimi di Livello 3',
    4: 'Incantesimi di Livello 4',
    5: 'Incantesimi di Livello 5',
    6: 'Incantesimi di Livello 6',
    7: 'Incantesimi di Livello 7',
    8: 'Incantesimi di Livello 8',
    9: 'Incantesimi di Livello 9'
};

function _spellIsConcentration(sp) {
    if (!sp) return false;
    const d = String(sp.duration || sp.duration_en || '').toLowerCase();
    return d.includes('concentr');
}

function _spellConcMark(sp) {
    return _spellIsConcentration(sp)
        ? '<span class="spell-card-conc" title="Richiede concentrazione">C</span>'
        : '';
}

// Toggle "preparato" per le spell card. Visibile solo per le classi
// che usano la preparazione e per gli incantesimi conosciuti di livello >= 1
// (i trucchetti e gli incantesimi razziali/sottoclasse/invocazione sono
// sempre attivi).
function _spellPrepToggle(pg, sp) {
    if (!sp || sp.level === 0) return '';
    if (!_pgUsesPreparedSystem(pg)) return '';
    const prepared = _spellIsPrepared(pg, sp.name, sp.level);
    const cls = prepared ? 'is-prepared' : '';
    const tip = prepared ? 'Preparato (clicca per smarcare)' : 'Non preparato (clicca per preparare)';
    const safeName = escapeAttr(sp.name);
    return `<button type="button" class="spell-card-prep-btn ${cls}"
        onclick="event.stopPropagation();schedaTogglePrepared('${pg.id}','${safeName}')"
        title="${tip}" aria-label="${tip}"></button>`;
}

function buildSpellLevelSection(pg, level) {
    const known = (pg.incantesimi_conosciuti || [])
        .map(n => ({ raw: n, sp: _resolveSpell(n) }))
        .filter(x => x.sp && x.sp.level === level);
    const knownNames = new Set(known.map(x => x.sp.name));

    // Incantesimi razziali innati per questo livello, deduplicati e non
    // sovrapposti agli "incantesimi conosciuti" (in tal caso prevale
    // l'entry razziale che e' read-only).
    const innate = _pgRaceInnateSpells(pg)
        .map(s => ({ src: s, sp: _resolveSpell(s.name) || _resolveSpell(s.name_en) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenInnate = new Set();
    const innateUnique = [];
    innate.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key)) return;
        seenInnate.add(key);
        innateUnique.push(x);
    });

    // Incantesimi auto-garantiti da sottoclasse (Dominio Vita, Giuramento
    // di Devozione, Patrono Demonio, ecc.). Anche questi sono "locked":
    // non si possono rimuovere dal picker ma compaiono in lista come carte
    // con tag della sottoclasse.
    const subclassGranted = _pgSubclassGrantedSpells(pg)
        .map(g => ({ src: g, sp: _resolveSpell(g.name) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenSubclass = new Set();
    const subclassUnique = [];
    subclassGranted.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key)) return; // razza ha priorita'
        if (seenSubclass.has(key)) return;
        seenSubclass.add(key);
        subclassUnique.push(x);
    });

    // Incantesimi conferiti dalle invocazioni del Warlock (a volonta' o
    // 1/lungo). Anche questi sono "locked" (derivati dalla scelta delle
    // invocazioni nella pagina dei privilegi).
    const invocationGranted = _pgInvocationGrantedSpells(pg)
        .map(g => ({ src: g, sp: _resolveSpell(g.name) || _resolveSpell(g.name_en) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenInvocation = new Set();
    const invocationUnique = [];
    invocationGranted.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key) || seenSubclass.has(key)) return;
        if (seenInvocation.has(key)) return;
        seenInvocation.add(key);
        invocationUnique.push(x);
    });

    const knownCards = known
        .filter(({ sp }) => !seenInnate.has(sp.name) && !seenSubclass.has(sp.name) && !seenInvocation.has(sp.name))
        .map(({ sp }) => {
            const id = sp.name;
            const prepared = _spellIsPrepared(pg, sp.name, sp.level);
            const prepCls = (sp.level > 0 && _pgUsesPreparedSystem(pg) && !prepared) ? 'spell-card-unprepared' : '';
            return `<div class="spell-card ${prepCls}" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
                <div class="spell-card-name">${_spellPrepToggle(pg, sp)}${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)}</div>
                <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
            </div>`;
        }).join('');

    const innateCards = innateUnique.map(({ src, sp }) => {
        const id = sp.name;
        const tag = src.recharge === 'at_will' ? 'a volontà' : (sp.level === 0 ? 'razza' : `razza · ${src.ability}`);
        return `<div class="spell-card spell-card-innate" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag">${escapeHtml(tag)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const subclassCards = subclassUnique.map(({ src, sp }) => {
        const id = sp.name;
        const label = src.source_label || 'sottoclasse';
        return `<div class="spell-card spell-card-subclass" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag spell-card-tag-subclass" title="Garantito da: ${escapeHtml(label)}">${escapeHtml(label)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const invocationCards = invocationUnique.map(({ src, sp }) => {
        const id = sp.name;
        const tag = src.recharge === 'at_will' ? 'supplica · a volontà' : 'supplica · 1/lungo';
        return `<div class="spell-card spell-card-invocation" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag spell-card-tag-invocation" title="Conferito da: ${escapeHtml(src.invocation_name)}">${escapeHtml(tag)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const cardsHtml = (knownCards + innateCards + subclassCards + invocationCards) || `<span class="scheda-empty">Nessun ${level === 0 ? 'trucchetto' : 'incantesimo'} scelto</span>`;

    const label = SPELL_LEVEL_LABELS[level] || `Livello ${level}`;
    const title = level === 0 ? 'Scegli trucchetti' : `Scegli incantesimi di livello ${level}`;
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">
            ${escapeHtml(label)}
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenSpellPicker('${pg.id}', ${level})" title="${title}">&#9998;</button>
        </div>
        <div class="scheda-section-body">
            <div class="spell-cards-grid">${cardsHtml}</div>
        </div>
    </div>`;
}

// Backward compat (mantiene il nome storico)
function buildCantripsSection(pg) { return buildSpellLevelSection(pg, 0); }

function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

window.schedaShowSpellDetail = function(spellName) {
    const sp = _resolveSpell(spellName);
    if (!sp) return;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.dataset.spellId = sp.name;
    const renderBody = () => {
        const lang = _spellLang();
        const lvlText = sp.level === 0
            ? (lang === 'en' ? 'Cantrip' : 'Trucchetto')
            : (lang === 'en' ? `Level ${sp.level}` : `Livello ${sp.level}`);
        const lbl = lang === 'en'
            ? { time: 'Casting Time', range: 'Range', comp: 'Components', dur: 'Duration' }
            : { time: 'Tempo', range: 'Gittata', comp: 'Componenti', dur: 'Durata' };
        return `<div class="hp-calc-modal spell-detail-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="spell-detail-name">${escapeHtml(_spellField(sp, 'name'))}</h3>
            <div class="spell-detail-sub">${lvlText} · ${escapeHtml(_spellField(sp, 'school'))}</div>
            <div class="spell-detail-meta">
                <div><span class="spell-meta-label">${lbl.time}</span><span>${escapeHtml(_spellField(sp, 'casting_time'))}</span></div>
                <div><span class="spell-meta-label">${lbl.range}</span><span>${escapeHtml(_spellField(sp, 'range'))}</span></div>
                <div><span class="spell-meta-label">${lbl.comp}</span><span>${escapeHtml(_spellField(sp, 'components'))}</span></div>
                <div><span class="spell-meta-label">${lbl.dur}</span><span>${escapeHtml(_spellField(sp, 'duration'))}</span></div>
            </div>
            <div class="spell-detail-desc">${window.formatRichText(_spellField(sp, 'description'))}</div>
            <div class="spell-detail-classes">${(_spellField(sp, 'classes') || []).map(c => `<span class="scheda-tag">${escapeHtml(c)}</span>`).join('')}</div>
            ${sp.source ? `<div class="spell-detail-source">${escapeHtml(sp.source)}</div>` : ''}
        </div>`;
    };
    overlay.innerHTML = renderBody();
    overlay._rerender = () => { overlay.innerHTML = renderBody(); };
    document.body.appendChild(overlay);
};

// Re-render automatico della pagina corrente quando l'utente cambia la lingua
// dell'app dalle Impostazioni (evento globale `appLangChanged`).
document.addEventListener('appLangChanged', () => {
    // Rerenderizza eventuali overlay di dettaglio incantesimo aperti.
    document.querySelectorAll('.hp-calc-overlay').forEach(ov => {
        if (typeof ov._rerender === 'function') ov._rerender();
    });
    // Rerenderizza la tab corrente della scheda personaggio se rilevante.
    const pgId = window._schedaCurrentPgId;
    if (typeof pgId !== 'string') return;
    const tab = window._schedaCurrentTab;
    if (tab === 'incantesimi' && typeof schedaOpenSpellPage === 'function') {
        schedaOpenSpellPage(pgId);
    } else if (tab === 'privilegi' && typeof schedaOpenPrivilegesPage === 'function') {
        schedaOpenPrivilegesPage(pgId);
    }
});

// ── Helper per filtri spell picker ──────────────────────────────────
// Mappa nomi italiani delle 8 scuole canoniche → chiave EN usata dai filtri.
// Usata sia per gli incantesimi homebrew (che salvano la scuola in IT) sia
// come fallback quando un dataset vecchio ha solo school_it.
const _SPELL_SCHOOL_IT_TO_EN = {
    'abiurazione': 'abjuration',
    'evocazione': 'conjuration',
    'divinazione': 'divination',
    'ammaliamento': 'enchantment',
    'invocazione': 'evocation',
    'illusione': 'illusion',
    'necromanzia': 'necromancy',
    'trasmutazione': 'transmutation',
};
function _spellSchoolKey(sp) {
    const raw = (sp.school || sp.school_it || '').toLowerCase().trim();
    if (!raw) return '';
    if (_SPELL_SCHOOL_IT_TO_EN[raw]) return _SPELL_SCHOOL_IT_TO_EN[raw];
    return raw;
}
function _spellHasComponent(sp, c) {
    const txt = (sp.components || sp.components_en || '').toUpperCase();
    // Componenti separate da virgola: estraggo i token prima di parentesi e match esatti
    const tokens = txt.replace(/\(.*?\)/g, '').split(/[,\s]+/).filter(Boolean);
    return tokens.includes(c);
}
function _spellIsConcentration(sp) {
    const d = (sp.duration || sp.duration_en || '').toLowerCase();
    return d.startsWith('concentr');
}
function _spellIsRitual(sp) {
    if (sp.ritual === true) return true;
    const ct = (sp.casting_time || sp.casting_time_en || '').toLowerCase();
    return /\(\s*rit/.test(ct) || /ritual/.test(ct);
}
function _spellSourceShort(sp) {
    const src = sp.source || '';
    if (!src) return '';
    // Match abbreviazioni TRA PARENTESI QUADRE/TONDE PRIMA dei pattern testuali,
    // cosi' fonti tipo "Bard [TCoE]", "Wizard [TCoE]" finiscono in TCoE e non in "Bard".
    const bracket = src.match(/[\[(]\s*([A-Za-z+]{2,8})\s*[\])]/);
    if (bracket) {
        const code = bracket[1].toUpperCase();
        if (code === 'PHB' || code === 'BR+' || code === 'SRD') return 'PHB';
        if (code === 'XGTE') return 'XGtE';
        if (code === 'TCOE') return 'TCoE';
        if (code === 'SCAG') return 'SCAG';
        if (code === 'EBR' || code === 'ERLW') return 'EBR';
        if (code === 'MMM' || code === 'MOTM') return 'MMM';
        if (code === 'SCC') return 'SCC';
        if (code === 'BGG' || code === 'GOTG') return 'BGG';
    }
    if (/Player.{0,3}s Handbook/i.test(src)) return 'PHB';
    if (/Xanathar/i.test(src)) return 'XGtE';
    if (/Tasha|TCoE/i.test(src)) return 'TCoE';
    if (/Sword Coast/i.test(src)) return 'SCAG';
    if (/Eberron/i.test(src)) return 'EBR';
    if (/Mordenkainen.*Multiverse/i.test(src)) return 'MMM';
    if (/Strixhaven/i.test(src)) return 'SCC';
    if (/Bigby|Glory of (the )?Giants/i.test(src)) return 'BGG';
    // Fallback: niente abbreviazioni "improvvisate" - meglio "Altro" che un nome di classe scambiato per manuale.
    return 'Altro';
}
function _normCastingTime(ct) {
    const t = (ct || '').toLowerCase();
    if (/azione bonus/.test(t)) return 'Azione Bonus';
    if (/reazione/.test(t)) return 'Reazione';
    if (/^1 azione/.test(t)) return 'Azione';
    if (/minut/.test(t)) return 'Minuti';
    if (/\bor[ae]\b/.test(t)) return 'Ore';
    return 'Altro';
}
const _SPELL_SCHOOLS = [
    ['abjuration','Abiurazione'],['conjuration','Evocazione'],['divination','Divinazione'],
    ['enchantment','Ammaliamento'],['evocation','Invocazione'],['illusion','Illusione'],
    ['necromancy','Necromanzia'],['transmutation','Trasmutazione']
];
const _SPELL_CASTING_TIMES = ['Azione','Azione Bonus','Reazione','Minuti','Ore','Altro'];
const _SPELL_SOURCES_KNOWN = ['PHB','XGtE','TCoE','SCAG','EBR','MMM','SCC'];

function _defaultSpellFilters(_pg) {
    return {
        schools: [],            // array di chiavi school (es. 'evocation'); vuoto = tutte
        castingTimes: [],       // 'Azione','Azione Bonus','Reazione','Minuti','Ore','Altro'
        components: [],         // ['V','S','M']
        concentration: 'any',   // 'any' | 'yes' | 'no'
        ritual: 'any',          // 'any' | 'yes' | 'no'
        classes: [],            // vuoto = tutte (per visualizzare tutti gli spell)
        sources: []             // codici source (vuoto = tutti)
    };
}

function _applySpellPickerFilters(spell, f) {
    if (!f) return true;
    // Scuola
    if (f.schools && f.schools.length > 0) {
        if (!f.schools.includes(_spellSchoolKey(spell))) return false;
    }
    // Casting time
    if (f.castingTimes && f.castingTimes.length > 0) {
        if (!f.castingTimes.includes(_normCastingTime(spell.casting_time || spell.casting_time_en))) return false;
    }
    // Componenti (richiesti tutti i selezionati)
    if (f.components && f.components.length > 0) {
        for (const c of f.components) if (!_spellHasComponent(spell, c)) return false;
    }
    // Concentrazione
    if (f.concentration === 'yes' && !_spellIsConcentration(spell)) return false;
    if (f.concentration === 'no' && _spellIsConcentration(spell)) return false;
    // Rituale
    if (f.ritual === 'yes' && !_spellIsRitual(spell)) return false;
    if (f.ritual === 'no' && _spellIsRitual(spell)) return false;
    // Classi — vuoto = nessun filtro (tutte le classi). Gli homebrew vivono
    // nel loro tab dedicato e non hanno classi associate, quindi bypassano.
    if (f.classes && f.classes.length > 0 && !spell._is_homebrew) {
        if (!f.classes.some(c => _spellMatchesClassName(spell, c))) return false;
    }
    // Manuale (source)
    if (f.sources && f.sources.length > 0) {
        if (!f.sources.includes(_spellSourceShort(spell))) return false;
    }
    return true;
}

window.schedaOpenSpellPicker = function(pgId, level) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const all = _spellsData();
    // Conserva l'unione di tutti i conosciuti (di ogni livello), normalizzati a nome IT
    const knownAll = new Set((pg.incantesimi_conosciuti || []).map(n => {
        const sp = _resolveSpell(n);
        return sp ? sp.name : n;
    }));

    const lang = _spellLang();
    // Lista nativa (esclude gli homebrew, che vivono nel tab dedicato).
    const list = Object.values(all)
        .filter(s => s.level === level && !s._is_homebrew);
    list.sort((a, b) => _spellField(a, 'name').localeCompare(_spellField(b, 'name'), lang));

    // Lista homebrew separata
    const hbCache = (window.AppState?.cachedHomebrewIncantesimi) || [];
    const hbList = hbCache
        .map(_hbSpellToCatalog)
        .filter(s => s.level === level);
    hbList.sort((a, b) => _spellField(a, 'name').localeCompare(_spellField(b, 'name'), lang));
    const hasHomebrewTab = hbList.length > 0;

    window._spellPickerFilters = _defaultSpellFilters(pg);
    window._spellPickerSearchQ = '';
    window._spellPickerTab = 'catalog'; // 'catalog' | 'homebrew'
    window._spellPickerLists = { catalog: list, homebrew: hbList };
    // Stato selezioni: persiste fra cambi tab (le checkbox nel tab non
    // attivo non sono nel DOM, quindi serve un set lato JS).
    window._spellPickerSelected = new Set(knownAll);

    // Mappa incantesimi auto-garantiti (sottoclasse o invocazioni warlock):
    // selected + disabled nel picker, con badge "garantito".
    const grantedByName = new Map();
    _pgSubclassGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name);
        if (sp) grantedByName.set(sp.name, g.source_label || 'sottoclasse');
    });
    _pgInvocationGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name) || _resolveSpell(g.name_en);
        if (sp && !grantedByName.has(sp.name)) {
            grantedByName.set(sp.name, `supplica: ${g.invocation_name}`);
        }
    });

    const renderRow = (sp) => {
        const id = sp.name;
        const isKnown = (window._spellPickerSelected || knownAll).has(id);
        const grantedLabel = grantedByName.get(id);
        const isGranted = !!grantedLabel;
        const safeId = escapeAttr(id);
        const tags = [];
        if (_spellIsConcentration(sp)) tags.push('<span class="spell-pick-tag spell-pick-tag-c" title="Concentrazione">C</span>');
        if (_spellIsRitual(sp)) tags.push('<span class="spell-pick-tag spell-pick-tag-r" title="Rituale">R</span>');
        if (isGranted) tags.push(`<span class="spell-pick-tag spell-pick-tag-granted" title="Garantito da: ${escapeHtml(grantedLabel)}">${escapeHtml(grantedLabel)}</span>`);
        if (sp._is_homebrew) {
            const author = sp._author_name ? ` · ${sp._author_name}` : '';
            tags.push(`<span class="spell-pick-tag spell-pick-tag-hb" title="Homebrew${author}">HB</span>`);
        }
        const metaParts = [];
        const school = _spellField(sp, 'school');
        if (school) metaParts.push(escapeHtml(school));
        const classes = _spellField(sp, 'classes') || [];
        if (classes.length) metaParts.push(classes.join(', '));
        if (sp._is_homebrew && sp._author_name) metaParts.push(`Homebrew · ${escapeHtml(sp._author_name)}`);
        return `<label class="spell-pick-row${isGranted ? ' spell-pick-row-granted' : ''}${sp._is_homebrew ? ' spell-pick-row-hb' : ''}" data-spell-id="${safeId}">
            <input type="checkbox" class="spell-pick-cb" data-name="${safeId}" ${(isKnown || isGranted) ? 'checked' : ''} ${isGranted ? 'disabled' : ''}>
            <div class="spell-pick-info" onclick="event.preventDefault();schedaShowSpellDetail('${safeId}')">
                <div class="spell-pick-name">${escapeHtml(_spellField(sp, 'name'))} ${tags.join('')}</div>
                <div class="spell-pick-meta">${metaParts.join(' · ')}</div>
            </div>
        </label>`;
    };

    const titleLabel = lang === 'en'
        ? (level === 0 ? 'Cantrips' : `Level ${level} Spells`)
        : (SPELL_LEVEL_LABELS[level] || `Livello ${level}`);
    const emptyMsg = lang === 'en' ? 'No spells match the filters' : 'Nessun incantesimo corrisponde ai filtri';
    const placeholder = lang === 'en' ? 'Search…' : 'Cerca…';
    const cancelLbl = lang === 'en' ? 'Cancel' : 'Annulla';
    const saveLbl = lang === 'en' ? 'Save' : 'Salva';

    // Pannello filtri
    const f = window._spellPickerFilters;
    const allClassesSet = new Set();
    Object.values(all).forEach(sp => (sp.classes || []).forEach(c => allClassesSet.add(c)));
    const allClasses = Array.from(allClassesSet).sort((a, b) => a.localeCompare(b, lang));
    const allSourcesSet = new Set();
    Object.values(all).forEach(sp => { const s = _spellSourceShort(sp); if (s) allSourcesSet.add(s); });
    const allSources = Array.from(allSourcesSet).sort();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    // Scuole HOMEBREW: oltre alle 8 canoniche, aggiungo dinamicamente
    // tutte le scuole non standard incontrate negli incantesimi disponibili
    // (sia nel pool generale sia tra gli homebrew). La key del filtro e' la
    // stringa lower-case (uguale a quanto restituito da _spellSchoolKey).
    const _stdSchoolKeys = new Set(_SPELL_SCHOOLS.map(([k]) => k));
    const customSchoolMap = new Map(); // key → label
    const _addCustomSchool = sp => {
        const k = _spellSchoolKey(sp);
        if (!k || _stdSchoolKeys.has(k)) return;
        const lab = sp.school_it || sp.school || k;
        if (!customSchoolMap.has(k)) customSchoolMap.set(k, lab);
    };
    Object.values(all).forEach(_addCustomSchool);
    (window.AppState?.cachedHomebrewIncantesimi || []).forEach(_addCustomSchool);
    const customSchoolEntries = Array.from(customSchoolMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1], lang));
    window._spellPickerFilterOptions = {
        schools: _SPELL_SCHOOLS.concat(customSchoolEntries).map(([value, label]) => ({ value, label })),
        castingTimes: _SPELL_CASTING_TIMES.map(value => ({ value, label: value })),
        components: ['V', 'S', 'M'].map(value => ({ value, label: value })),
        concentration: [{ value: 'any', label: 'Tutti' }, { value: 'yes', label: 'Si' }, { value: 'no', label: 'No' }],
        ritual: [{ value: 'any', label: 'Tutti' }, { value: 'yes', label: 'Si' }, { value: 'no', label: 'No' }],
        classes: allClasses.map(value => ({ value, label: value })),
        sources: allSources.map(value => ({ value, label: value })),
    };

    const filtersPanelHtml = `<div class="spell-filter-panel" id="spellFilterPanel" style="display:none;">
        <div class="spell-filter-group">
            <div class="spell-filter-label">Scuola</div>
            <div class="spell-filter-chips">
                ${_SPELL_SCHOOLS.map(([k, lab]) => chip(lab, f.schools.includes(k), `spellFilterToggle('schools','${k}')`)).join('')}
                ${customSchoolEntries.map(([k, lab]) => chip(lab, f.schools.includes(k), `spellFilterToggle('schools','${k}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Tempo di lancio</div>
            <div class="spell-filter-chips">
                ${_SPELL_CASTING_TIMES.map(t => chip(t, f.castingTimes.includes(t), `spellFilterToggle('castingTimes','${t}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Componenti</div>
            <div class="spell-filter-chips">
                ${['V','S','M'].map(c => chip(c, f.components.includes(c), `spellFilterToggle('components','${c}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Concentrazione</div>
            <div class="spell-filter-chips">
                ${[['any','Tutti'],['yes','Sì'],['no','No']].map(([v, lab]) => chip(lab, f.concentration === v, `spellFilterSet('concentration','${v}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Rituale</div>
            <div class="spell-filter-chips">
                ${[['any','Tutti'],['yes','Sì'],['no','No']].map(([v, lab]) => chip(lab, f.ritual === v, `spellFilterSet('ritual','${v}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Classi <small style="color:var(--text-light);">(vuoto = tutte)</small></div>
            <div class="spell-filter-chips">
                ${allClasses.map(c => chip(c, f.classes.includes(c), `spellFilterToggle('classes',\`${c.replace(/`/g, '\\`')}\`)`)).join('')}
            </div>
        </div>
        ${allSources.length > 0 ? `<div class="spell-filter-group">
            <div class="spell-filter-label">Manuale</div>
            <div class="spell-filter-chips">
                ${allSources.map(s => chip(s, f.sources.includes(s), `spellFilterToggle('sources','${s}')`)).join('')}
            </div>
        </div>` : ''}
        <div class="spell-filter-actions">
            <button type="button" class="btn-secondary btn-small" onclick="spellFilterReset()">Reimposta</button>
        </div>
    </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const tabsHtml = hasHomebrewTab ? `
        <div class="spell-picker-tabs">
            <button type="button" class="spell-picker-tab active" data-tab="catalog" onclick="spellPickerSetTab('catalog')">Catalogo <span class="spell-picker-tab-count">${list.length}</span></button>
            <button type="button" class="spell-picker-tab" data-tab="homebrew" onclick="spellPickerSetTab('homebrew')">Homebrew <span class="spell-picker-tab-count">${hbList.length}</span></button>
        </div>` : '';
    overlay.innerHTML = `<div class="hp-calc-modal spell-picker-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 style="margin-bottom:6px;">${escapeHtml(titleLabel)}</h3>
        ${tabsHtml}
        <div class="filters-bar spell-picker-search-row">
            <div class="filter-search-wrap">
                <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="spellPickerSearch" class="filter-search" placeholder="${placeholder}">
            </div>
            <button type="button" class="comp-filter-btn" id="spellPickerFilterBtn" onclick="spellFilterTogglePanel()" aria-label="Filtri">
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
                <strong id="spellFilterBadge" style="display:none;">0</strong>
            </button>
        </div>
        <div class="spell-picker-list" id="spellPickerList"></div>
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">${cancelLbl}</button>
            <button class="btn-primary" onclick="schedaSaveSpellsForLevel('${pgId}', ${level})">${saveLbl}</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    window._spellPickerRenderRow = renderRow;
    window._spellPickerEmptyMsg = emptyMsg;
    _spellPickerRefresh();

    const search = document.getElementById('spellPickerSearch');
    if (search) {
        search.addEventListener('input', () => {
            window._spellPickerSearchQ = search.value.toLowerCase().trim();
            _spellPickerRefresh();
        });
    }

    // Event delegation: tieni traccia delle selezioni anche quando le
    // checkbox del tab non attivo non sono nel DOM.
    const listEl = document.getElementById('spellPickerList');
    if (listEl) {
        listEl.addEventListener('change', e => {
            const cb = e.target.closest('.spell-pick-cb');
            if (!cb || cb.disabled) return;
            const name = cb.dataset.name;
            if (!name || !window._spellPickerSelected) return;
            if (cb.checked) window._spellPickerSelected.add(name);
            else window._spellPickerSelected.delete(name);
        });
    }
};

function _spellPickerRefresh() {
    const lists = window._spellPickerLists || { catalog: [], homebrew: [] };
    const tab = window._spellPickerTab || 'catalog';
    const list = lists[tab] || [];
    const renderRow = window._spellPickerRenderRow;
    const emptyMsg = window._spellPickerEmptyMsg || '';
    const f = window._spellPickerFilters;
    const q = window._spellPickerSearchQ || '';
    const lang = _spellLang();
    const pg = _schedaPgCache;
    const pgClasses = pg ? _pgSpellClasses(pg) : new Set();

    const filtered = list.filter(sp => _applySpellPickerFilters(sp, f)).filter(sp => {
        if (!q) return true;
        const name = (_spellField(sp, 'name') || '').toLowerCase();
        const sch = (_spellField(sp, 'school') || '').toLowerCase();
        return name.includes(q) || sch.includes(q);
    });

    const listEl = document.getElementById('spellPickerList');
    if (!listEl) return;
    let html = '';
    if (tab === 'homebrew') {
        // Tab homebrew: niente raggruppamento per classe del PG; mostro la lista
        // come unico blocco ordinato. Aggiungo l'autore se non e' del PG stesso.
        if (filtered.length === 0) {
            html = `<p class="scheda-empty">${emptyMsg}</p>`;
        } else {
            html = filtered.map(renderRow).join('');
        }
    } else {
        const matching = filtered.filter(s => _spellMatchesPg(s, pgClasses));
        const others = filtered.filter(s => !_spellMatchesPg(s, pgClasses));
        const grpMatch = lang === 'en' ? 'Available for your class' : 'Disponibili per la tua classe';
        const grpOther = lang === 'en' ? 'Others' : 'Altri';
        if (matching.length > 0) html += `<div class="spell-pick-group-title">${grpMatch}</div>${matching.map(renderRow).join('')}`;
        if (others.length > 0) html += `<div class="spell-pick-group-title">${grpOther}</div>${others.map(renderRow).join('')}`;
        if (filtered.length === 0) html = `<p class="scheda-empty">${emptyMsg}</p>`;
    }
    listEl.innerHTML = html;

    _spellFilterUpdateBadge();
}

window.spellPickerSetTab = function(tab) {
    if (tab !== 'catalog' && tab !== 'homebrew') return;
    window._spellPickerTab = tab;
    document.querySelectorAll('.spell-picker-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    _spellPickerRefresh();
};

window.spellFilterTogglePanel = function() {
    const panel = document.getElementById('spellFilterPanel');
    const btn = document.getElementById('spellPickerFilterBtn');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window.spellFilterToggle = function(field, value) {
    const f = window._spellPickerFilters;
    if (!f || !Array.isArray(f[field])) return;
    const i = f[field].indexOf(value);
    if (i >= 0) f[field].splice(i, 1); else f[field].push(value);
    // Aggiorna lo stato visivo del chip
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

window.spellFilterSet = function(field, value) {
    const f = window._spellPickerFilters;
    if (!f) return;
    f[field] = value;
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

window.spellFilterReset = function() {
    const pg = _schedaPgCache;
    if (!pg) return;
    window._spellPickerFilters = _defaultSpellFilters(pg);
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

function _refreshSpellFilterChips() {
    const panel = document.getElementById('spellFilterPanel');
    if (!panel) return;
    const f = window._spellPickerFilters;
    panel.querySelectorAll('.spell-filter-chip').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/spellFilter(Toggle|Set)\('([^']+)',\s*[`']([^`']+)[`']\)/);
        if (!m) return;
        const action = m[1], field = m[2], value = m[3];
        let active = false;
        if (action === 'Toggle' && Array.isArray(f[field])) active = f[field].includes(value);
        else if (action === 'Set') active = f[field] === value;
        btn.classList.toggle('active', active);
    });
}

function _spellPickerActiveFilterCount() {
    const f = window._spellPickerFilters;
    if (!f) return 0;
    let n = 0;
    n += (f.schools || []).length;
    n += (f.castingTimes || []).length;
    n += (f.components || []).length;
    if (f.concentration && f.concentration !== 'any') n += 1;
    if (f.ritual && f.ritual !== 'any') n += 1;
    n += (f.classes || []).length;
    n += (f.sources || []).length;
    return n;
}

function _spellFilterBuildButton(field, label, options, value, mode = 'multi') {
    const selected = Array.isArray(value) ? value.map(String) : (value && value !== 'any' ? [String(value)] : []);
    const encoded = encodeURIComponent(JSON.stringify(options || [])).replace(/'/g, '%27');
    const selectedLabel = mode === 'single' && selected.length
        ? (options || []).find(o => String(o.value) === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="spellFilterPick('${field}','${encoded}','${safeAttr(label)}','${mode}')" data-value="${safeAttr(selected.join(','))}">
        ${escapeHtml(label)}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _spellFiltersHtml() {
    const f = window._spellPickerFilters || _defaultSpellFilters(_schedaPgCache || {});
    const opts = window._spellPickerFilterOptions || {};
    return [
        _spellFilterBuildButton('schools', 'Scuola', opts.schools || [], f.schools || []),
        _spellFilterBuildButton('castingTimes', 'Tempo di lancio', opts.castingTimes || [], f.castingTimes || []),
        _spellFilterBuildButton('components', 'Componenti', opts.components || [], f.components || []),
        _spellFilterBuildButton('concentration', 'Concentrazione', opts.concentration || [], f.concentration || 'any', 'single'),
        _spellFilterBuildButton('ritual', 'Rituale', opts.ritual || [], f.ritual || 'any', 'single'),
        _spellFilterBuildButton('classes', 'Classi', opts.classes || [], f.classes || []),
        (opts.sources || []).length ? _spellFilterBuildButton('sources', 'Manuale', opts.sources || [], f.sources || []) : '',
    ].filter(Boolean).join('');
}

function _spellFilterRerenderDialog() {
    const overlay = document.querySelector('.spell-filter-overlay');
    if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _spellFiltersHtml();
}

function _spellFilterUpdateBadge() {
    const badge = document.getElementById('spellFilterBadge');
    if (!badge) return;
    const n = _spellPickerActiveFilterCount();
    badge.textContent = n ? String(n) : '';
    badge.style.display = n ? 'inline-flex' : 'none';
    document.getElementById('spellPickerFilterBtn')?.classList.toggle('active', n > 0);
}

window.spellFilterTogglePanel = function() {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay spell-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_spellFiltersHtml()}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="spellFilterReset()">Reset</button>
                <button type="button" class="btn-primary" onclick="this.closest('.hp-calc-overlay').remove()">Applica</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.spellFilterPick = function(field, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const f = window._spellPickerFilters;
    if (!f) return;
    if (mode === 'single') {
        openCustomSelect(options, value => {
            f[field] = value || 'any';
            _spellPickerRefresh();
            _spellFilterRerenderDialog();
        }, title || 'Filtro');
        return;
    }
    const current = Array.isArray(f[field]) ? f[field] : [];
    openMultiSelect(options, current, values => {
        f[field] = values;
        _spellPickerRefresh();
        _spellFilterRerenderDialog();
    }, title || 'Filtro');
};

window.spellFilterReset = function() {
    const pg = _schedaPgCache;
    if (!pg) return;
    window._spellPickerFilters = _defaultSpellFilters(pg);
    _spellPickerRefresh();
    _spellFilterRerenderDialog();
};

// Alias storico
window.schedaOpenCantripsPicker = function(pgId) { return window.schedaOpenSpellPicker(pgId, 0); };

window.schedaSaveSpellsForLevel = async function(pgId, level) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    // Mantieni i conosciuti di altri livelli, sostituisci solo il livello corrente
    const all = _spellsData();
    const others = (pg.incantesimi_conosciuti || []).filter(n => {
        const sp = _resolveSpell(n);
        return !sp || sp.level !== level;
    }).map(n => {
        const sp = _resolveSpell(n);
        return sp ? sp.name : n;
    });
    // Escludi dal salvataggio gli incantesimi auto-garantiti dalla
    // sottoclasse o dalle invocazioni: sono derivati e verranno
    // re-iniettati a runtime.
    const grantedSet = new Set();
    _pgSubclassGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name);
        if (sp) grantedSet.add(sp.name);
    });
    _pgInvocationGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name) || _resolveSpell(g.name_en);
        if (sp) grantedSet.add(sp.name);
    });
    // Le selezioni vivono in _spellPickerSelected (persistono fra cambi tab).
    // Filtro mantenendo solo quelle che corrispondono a un incantesimo del
    // livello corrente (tab catalog + homebrew) e non sono auto-garantite.
    const allLevelNames = new Set([
        ...((window._spellPickerLists?.catalog) || []).map(s => s.name),
        ...((window._spellPickerLists?.homebrew) || []).map(s => s.name),
    ]);
    const checked = Array.from(window._spellPickerSelected || [])
        .filter(n => allLevelNames.has(n) && !grantedSet.has(n));
    const merged = Array.from(new Set([...others, ...checked]));
    pg.incantesimi_conosciuti = merged;

    // Sincronizza la lista dei preparati: rimuovi quelli che non sono piu' tra
    // i conosciuti (es. spell deselezionata dal picker).
    const updates = { incantesimi_conosciuti: merged };
    if (Array.isArray(pg.incantesimi_preparati) && pg.incantesimi_preparati.length > 0) {
        const knownSet = new Set(merged);
        const cleaned = pg.incantesimi_preparati.filter(n => knownSet.has(n));
        if (cleaned.length !== pg.incantesimi_preparati.length) {
            pg.incantesimi_preparati = cleaned;
            updates.incantesimi_preparati = cleaned;
        }
    }
    await supabase.from('personaggi').update(updates).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenSpellPage(pgId);
};

// Alias storico
window.schedaSaveCantrips = function(pgId) { return window.schedaSaveSpellsForLevel(pgId, 0); };
