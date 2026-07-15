// ============================================================================
// CHARACTER SPELL SLOT HELPERS
// ============================================================================

// --- Spell Slots ---
let pgCurrentSlotIncantesimo = {};

const CLASS_SPELL_SLOTS = {
    'full': {
        1: {1:2}, 2: {1:3}, 3: {1:4,2:2}, 4: {1:4,2:3}, 5: {1:4,2:3,3:2},
        6: {1:4,2:3,3:3}, 7: {1:4,2:3,3:3,4:1}, 8: {1:4,2:3,3:3,4:2},
        9: {1:4,2:3,3:3,4:3,5:1}, 10: {1:4,2:3,3:3,4:3,5:2},
        11: {1:4,2:3,3:3,4:3,5:2,6:1}, 12: {1:4,2:3,3:3,4:3,5:2,6:1},
        13: {1:4,2:3,3:3,4:3,5:2,6:1,7:1}, 14: {1:4,2:3,3:3,4:3,5:2,6:1,7:1},
        15: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1}, 16: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1},
        17: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1,9:1}, 18: {1:4,2:3,3:3,4:3,5:3,6:1,7:1,8:1,9:1},
        19: {1:4,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1}, 20: {1:4,2:3,3:3,4:3,5:3,6:2,7:2,8:1,9:1}
    },
    'half': {
        2: {1:2}, 3: {1:3}, 4: {1:3}, 5: {1:4,2:2}, 6: {1:4,2:2},
        7: {1:4,2:3}, 8: {1:4,2:3}, 9: {1:4,2:3,3:2}, 10: {1:4,2:3,3:2},
        11: {1:4,2:3,3:3}, 12: {1:4,2:3,3:3}, 13: {1:4,2:3,3:3,4:1}, 14: {1:4,2:3,3:3,4:1},
        15: {1:4,2:3,3:3,4:2}, 16: {1:4,2:3,3:3,4:2}, 17: {1:4,2:3,3:3,4:3,5:1}, 18: {1:4,2:3,3:3,4:3,5:1},
        19: {1:4,2:3,3:3,4:3,5:2}, 20: {1:4,2:3,3:3,4:3,5:2}
    },
    'third': {
        3: {1:2}, 4: {1:3}, 5: {1:3}, 6: {1:3},
        7: {1:4,2:2}, 8: {1:4,2:2}, 9: {1:4,2:2},
        10: {1:4,2:3}, 11: {1:4,2:3}, 12: {1:4,2:3},
        13: {1:4,2:3,3:2}, 14: {1:4,2:3,3:2}, 15: {1:4,2:3,3:2},
        16: {1:4,2:3,3:3}, 17: {1:4,2:3,3:3}, 18: {1:4,2:3,3:3},
        19: {1:4,2:3,3:3,4:1}, 20: {1:4,2:3,3:3,4:1}
    }
};

const CLASS_CASTER_TYPE = {
    'Bardo': 'full', 'Chierico': 'full', 'Druido': 'full', 'Mago': 'full',
    'Stregone': 'full', 'Warlock': 'pact',
    'Paladino': 'half', 'Ranger': 'half',
    'Artefice': 'half',
    'Barbaro': null, 'Guerriero': null, 'Ladro': null, 'Monaco': null
};

/**
 * Calcola gli slot incantesimo dato un array di classi del PG.
 *
 * Regole D&D 5e:
 *  - Single-class full caster (Bardo/Chierico/Druido/Mago/Stregone): tabella 'full' al livello reale.
 *  - Single-class half caster (Paladino/Ranger/Artefice): tabella 'half' al livello reale.
 *  - Single-class third caster (Eldritch Knight, Arcane Trickster): tabella 'third' al livello reale.
 *  - Multiclass: somma "effective caster level" = livelli full + floor(livelli half / 2)
 *    + floor(livelli third / 3) e si consulta SEMPRE la tabella 'full' (tabella Multiclass Spellcaster).
 *  - Pact Magic (Warlock): slot dedicati che si AGGIUNGONO sopra agli altri (se warlock multiclassato)
 *    o sostituiscono (se single-class warlock).
 */
function _computeSpellSlots(classi) {
    if (!Array.isArray(classi) || classi.length === 0) return {};

    // Categorizza ogni classe per tipo caster
    const fullClasses = [];
    const halfClasses = [];
    const thirdClasses = [];
    const pactClasses = [];
    const nonCasters = [];
    classi.forEach(cls => {
        const type = CLASS_CASTER_TYPE[cls.nome];
        if (type === 'full') fullClasses.push(cls);
        else if (type === 'half') halfClasses.push(cls);
        else if (type === 'pact') pactClasses.push(cls);
        else if (type === null && cls.thirdCaster) thirdClasses.push(cls);
        else nonCasters.push(cls);
    });

    const casterClassesCount = fullClasses.length + halfClasses.length + thirdClasses.length;
    const isMulticlass = casterClassesCount > 1;

    let slots = {};

    if (!isMulticlass && casterClassesCount === 1) {
        // SINGLE-CLASS caster: usa la tabella dedicata sul livello reale.
        let table = null, lv = 0;
        if (fullClasses.length === 1) { table = CLASS_SPELL_SLOTS.full;  lv = fullClasses[0].livello; }
        else if (halfClasses.length === 1) { table = CLASS_SPELL_SLOTS.half;  lv = halfClasses[0].livello; }
        else if (thirdClasses.length === 1) { table = CLASS_SPELL_SLOTS.third; lv = thirdClasses[0].livello; }
        if (table) {
            const level = Math.min(Math.max(lv, 0), 20);
        slots = table[level] ? { ...table[level] } : {};
        }
    } else if (isMulticlass) {
        // MULTICLASS: regola PHB - tabella 'full' sul livello effettivo.
        let effectiveLevel = 0;
        fullClasses.forEach(c => { effectiveLevel += c.livello; });
        halfClasses.forEach(c => { effectiveLevel += Math.floor(c.livello / 2); });
        thirdClasses.forEach(c => { effectiveLevel += Math.floor(c.livello / 3); });
        if (effectiveLevel > 0) {
            const level = Math.min(effectiveLevel, 20);
            const table = CLASS_SPELL_SLOTS.full;
            slots = table[level] ? { ...table[level] } : {};
        }
    }

    // Pact Magic (Warlock) - sempre additivo.
    if (pactClasses.length > 0) {
        const pactLevel = pactClasses.reduce((s, c) => s + c.livello, 0);
        if (pactLevel > 0) {
        const pactSlotLevel = Math.min(Math.ceil(pactLevel / 2), 5);
            const pactSlotCount = pactLevel >= 17 ? 4 : pactLevel >= 11 ? 3 : pactLevel >= 2 ? 2 : 1;
            slots[pactSlotLevel] = (slots[pactSlotLevel] || 0) + pactSlotCount;

            // Mystic Arcanum: 1 incantesimo conoscibile per ciascuno dei livelli
            // 6/7/8/9 sbloccati a livello Warlock 11/13/15/17 (lanciabile 1/giorno).
            // Lo modelliamo come 1 slot dedicato per ogni livello sbloccato,
            // additivo agli eventuali slot multiclass dello stesso livello.
            if (pactLevel >= 11) slots[6] = (slots[6] || 0) + 1;
            if (pactLevel >= 13) slots[7] = (slots[7] || 0) + 1;
            if (pactLevel >= 15) slots[8] = (slots[8] || 0) + 1;
            if (pactLevel >= 17) slots[9] = (slots[9] || 0) + 1;
        }
    }

    return slots;
}

function calcSpellSlotsFromClassi(classi) { return _computeSpellSlots(classi); }
function pgCalcSpellSlots() { return _computeSpellSlots(pgSelectedClasses); }

/**
 * Restituisce il massimo livello di incantesimo a cui il PG ha accesso
 * (per visualizzare la lista incantesimi conoscibili, anche se non ha slot).
 *
 * Particolarmente importante per il Warlock: pur avendo solo slot di livello
 * fino a 5, ottiene il Mystic Arcanum a lv 11/13/15/17 che gli permette di
 * conoscere e lanciare un incantesimo di livello 6/7/8/9. La lista degli
 * incantesimi accessibili deve quindi includere tutti i livelli da 0 al
 * massimo conoscibile, indipendentemente dalla presenza di slot.
 */
function _maxSpellLevelForClass(cls) {
    const type = CLASS_CASTER_TYPE[cls.nome];
    const lv = parseInt(cls.livello) || 0;
    if (lv <= 0) return 0;
    if (type === 'full') {
        const t = CLASS_SPELL_SLOTS.full[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    if (type === 'half') {
        const t = CLASS_SPELL_SLOTS.half[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    if (type === 'pact') {
        // Slot Pact (max 5) + Mystic Arcanum (lv 11/13/15/17 -> 6/7/8/9)
        let max = Math.min(Math.ceil(lv / 2), 5);
        if (lv >= 11) max = Math.max(max, 6);
        if (lv >= 13) max = Math.max(max, 7);
        if (lv >= 15) max = Math.max(max, 8);
        if (lv >= 17) max = Math.max(max, 9);
        return max;
    }
    if (type === null && cls.thirdCaster) {
        const t = CLASS_SPELL_SLOTS.third[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    return 0;
}

function _maxKnownSpellLevel(classi) {
    return (classi || []).reduce((m, c) => Math.max(m, _maxSpellLevelForClass(c)), 0);
}

function pgBuildSlotIncantesimo() {
    const defaultSlots = pgCalcSpellSlots();
    const levels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);
    if (levels.length === 0) return {};

    const result = {};
    levels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            result[lvl] = { max: maxDefault, current: Math.min(existing.current != null ? existing.current : maxDefault, maxDefault) };
        } else {
            result[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    return result;
}

function pgSetupSlotIncantesimoDelegation(container) {
    if (!container || container.dataset.pgSlotDelegated === '1') return;
    container.dataset.pgSlotDelegated = '1';
    container.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-slot-action]');
        if (!actionEl || !container.contains(actionEl)) return;

        const level = Number(actionEl.dataset.slotLevel);
        if (!Number.isFinite(level)) return;
        if (actionEl.dataset.slotAction === 'decrement') {
            pgSlotDecrement(level);
        } else if (actionEl.dataset.slotAction === 'increment') {
            pgSlotIncrement(level);
        }
    });
}

function pgRenderSlotIncantesimo() {
    const container = document.getElementById('pgSlotIncantesimoList');
    if (!container) return;
    pgSetupSlotIncantesimoDelegation(container);

    const defaultSlots = pgCalcSpellSlots();
    const slotLevels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);

    if (slotLevels.length === 0) {
        setSafeHtml(container, '<p style="color:var(--text-secondary);font-size:0.85rem;">Nessun incantesimo disponibile per questa classe</p>');
        pgCurrentSlotIncantesimo = {};
        return;
    }

    const merged = {};
    slotLevels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            merged[lvl] = { max: existing.max != null ? existing.max : maxDefault, current: existing.current != null ? existing.current : maxDefault };
        } else {
            merged[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    pgCurrentSlotIncantesimo = merged;

    const html = slotLevels.map(lvl => {
        const s = merged[lvl];
        return `
        <div class="pg-slot-row">
            <span class="pg-slot-label">Livello ${lvl}</span>
            <div class="pg-slot-controls">
                <button type="button" class="pg-slot-btn" data-slot-action="decrement" data-slot-level="${lvl}">−</button>
                <span class="pg-slot-value" id="slotCurrent${lvl}">${s.current}</span>
                <span class="pg-slot-sep">/</span>
                <span class="pg-slot-max">${s.max}</span>
                <button type="button" class="pg-slot-btn" data-slot-action="increment" data-slot-level="${lvl}">+</button>
            </div>
        </div>`;
    }).join('');
    setSafeHtml(container, html);
}

window.pgSlotDecrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current > 0) {
        pgCurrentSlotIncantesimo[lvl].current--;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}

window.pgSlotIncrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current < pgCurrentSlotIncantesimo[lvl].max) {
        pgCurrentSlotIncantesimo[lvl].current++;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}
