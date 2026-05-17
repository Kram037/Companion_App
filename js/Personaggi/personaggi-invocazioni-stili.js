// ============================================================================
// PERSONAGGI INVOCAZIONI E STILI
// ============================================================================

// Invocazioni Occulte (Eldritch Invocations) del Warlock.
// Dataset in window.INVOCATIONS_DATA generato da
// risorse/invocazioni/build_invocations.py.
//
// Per ogni invocazione:
//   id, name, name_en, source, source_short, prerequisites (lista),
//   description, effect, effect_data
//
// pg.invocazioni: array di id (stringhe slug, es. "agonizing-blast").
// ─────────────────────────────────────────────────────────────────────────
function _invocationsAll() { return window.INVOCATIONS_DATA || []; }

function _invocationById(id) {
    if (!id) return null;
    return _invocationsAll().find(i => i.id === id) || null;
}

// ─── Stili di Combattimento (Fighting Styles) ───────────────────────────
function _fightingStylesData() { return window.FIGHTING_STYLES_DATA || {}; }
function _fightingStyleById(slug) {
    if (!slug) return null;
    return _fightingStylesData()[slug] || null;
}
// Restrizioni di stili di combattimento per sottoclasse: alcune sottoclassi
// (es. Bardo del Collegio delle Spade) consentono di scegliere uno stile da
// una lista limitata. La chiave e' lo slug della sottoclasse; il valore
// definisce sotto quale "etichetta classe" salvare la scelta, da quale
// livello e quanti stili, oltre all'elenco di slug disponibili.
const FIGHTING_STYLES_SUBCLASS_RULES = {
    'college-of-swords': {
        className: 'Bardo (Collegio delle Spade)',
        from_level: 3,
        count: 1,
        allowedSlugs: ['dueling', 'two-weapon-fighting'],
    },
    'sword-bard': {
        className: 'Bardo (Collegio delle Spade)',
        from_level: 3,
        count: 1,
        allowedSlugs: ['dueling', 'two-weapon-fighting'],
    },
};

// Chiave della "slot custom" sempre presente: permette a qualsiasi PG di
// scegliere stili anche se la sua classe non glielo concederebbe, e di
// aumentare liberamente quanti stili possiede.
const FS_CUSTOM_SLOT_KEY = 'Personalizzato';

// Quanti stili di combattimento puo' selezionare il PG per ciascuna delle
// sue classi/sottoclassi. Restituisce un oggetto:
//   { 'Guerriero': { max: 1, baseMax: 1, allowedSlugs: null, baseClass: 'Guerriero' }, ... }
// allowedSlugs === null significa "tutti gli stili della classe base".
// La slot 'Personalizzato' e' sempre presente: di default permette 0 stili,
// ma se il PG non ha alcuna allowance concessa dalle classi parte da 1,
// e il giocatore puo' modificare il massimo a piacere via override.
function _pgFightingStylesAllowance(pg) {
    const out = {};
    if (!pg) return out;
    const overrides = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object'
        && pg.stile_combattimento._maxOverrides && typeof pg.stile_combattimento._maxOverrides === 'object')
        ? pg.stile_combattimento._maxOverrides : {};
    const applyOverride = (key, baseMax) => {
        const ov = Number.isFinite(overrides[key]) ? overrides[key] : 0;
        return Math.max(0, baseMax + ov);
    };
    if (Array.isArray(pg.classi)) {
        pg.classi.forEach(c => {
            const lvl = parseInt(c.livello) || 0;
            const subSlug = c.sottoclasseSlug || '';
            if (c.nome === 'Guerriero') {
                let n = lvl >= 1 ? 1 : 0;
                if (lvl >= 10 && subSlug === 'champion') n += 1;
                if (n > 0) out[c.nome] = { baseMax: n, max: applyOverride(c.nome, n), allowedSlugs: null, baseClass: 'Guerriero' };
            } else if (c.nome === 'Paladino') {
                if (lvl >= 2) out[c.nome] = { baseMax: 1, max: applyOverride(c.nome, 1), allowedSlugs: null, baseClass: 'Paladino' };
            } else if (c.nome === 'Ranger') {
                if (lvl >= 2) out[c.nome] = { baseMax: 1, max: applyOverride(c.nome, 1), allowedSlugs: null, baseClass: 'Ranger' };
            }
            // Sottoclassi che concedono stili limitati.
            const rule = FIGHTING_STYLES_SUBCLASS_RULES[subSlug];
            if (rule && lvl >= (rule.from_level || 1)) {
                const cnt = rule.count || 1;
                out[rule.className] = {
                    baseMax: cnt,
                    max: applyOverride(rule.className, cnt),
                    allowedSlugs: rule.allowedSlugs ? [...rule.allowedSlugs] : null,
                    baseClass: c.nome,
                };
            }
        });
    }
    // Slot 'Personalizzato' sempre presente: garantisce che qualsiasi PG
    // possa scegliere uno stile e che l'utente possa estendere il numero.
    const hasClassAllowance = Object.keys(out).length > 0;
    const customBase = hasClassAllowance ? 0 : 1;
    out[FS_CUSTOM_SLOT_KEY] = {
        baseMax: customBase,
        max: applyOverride(FS_CUSTOM_SLOT_KEY, customBase),
        allowedSlugs: null,
        baseClass: null, // null = qualsiasi stile da qualsiasi classe.
        custom: true,
    };
    return out;
}
// Slug degli stili disponibili per una classe specifica (filtrabili poi da
// allowedSlugs della sottoclasse).
function _fightingStylesForClass(className) {
    const data = _fightingStylesData();
    return Object.values(data)
        .filter(fs => Array.isArray(fs.classes) && fs.classes.includes(className))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
// Stili effettivamente selezionabili per una "voce di allowance" del PG.
// Regole:
//   - Se l'allowance ha allowedSlugs (lista esplicita), si usa SEMPRE quella
//     lista (lookup diretto sui dati globali). Questo evita il problema in
//     cui la classe base non e' tra le classes degli stili (es. Bardo
//     Collegio delle Spade: i suoi stili "Duellare" e "Combattere con due
//     armi" non hanno 'Bardo' tra le loro classes).
//   - Se baseClass e' null (slot Personalizzato) si elencano TUTTI gli stili.
//   - Altrimenti si filtra per la classe base.
function _fightingStylesForSlot(slotKey, allowanceEntry) {
    const data = _fightingStylesData();
    if (allowanceEntry && Array.isArray(allowanceEntry.allowedSlugs)) {
        const allowed = new Set(allowanceEntry.allowedSlugs);
        return Object.values(data)
            .filter(fs => allowed.has(fs.slug))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (!allowanceEntry || allowanceEntry.baseClass == null) {
        return Object.values(data)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return _fightingStylesForClass(allowanceEntry.baseClass);
}

// Numero massimo di invocazioni che un Warlock conosce in base al livello,
// come da PHB pag. 110 (tabella Warlock).
function _pgWarlockLevel(pg) {
    if (!pg || !Array.isArray(pg.classi)) return 0;
    const w = pg.classi.find(c => {
        const cls = _getClassData(c?.nome || '');
        return cls && cls.slug === 'warlock';
    });
    return w ? (parseInt(w.livello) || 0) : 0;
}

function _maxInvocationsForLevel(lvl) {
    if (lvl < 2) return 0;
    if (lvl < 5) return 2;
    if (lvl < 7) return 3;
    if (lvl < 9) return 4;
    if (lvl < 12) return 5;
    if (lvl < 15) return 6;
    if (lvl < 18) return 7;
    return 8;
}

function _pgMaxInvocations(pg) {
    return _maxInvocationsForLevel(_pgWarlockLevel(pg));
}

// Verifica se il PG soddisfa i prerequisiti dell'invocazione. Usato per
// abilitare/disabilitare voci nel picker.
function _pgMeetsInvocationPrereqs(pg, inv, opts = {}) {
    if (!inv || !Array.isArray(inv.prerequisites)) return true;
    const wlvl = _pgWarlockLevel(pg);
    const subSlug = (() => {
        const w = (pg.classi || []).find(c => {
            const cls = _getClassData(c?.nome || '');
            return cls && cls.slug === 'warlock';
        });
        return w ? (w.sottoclasseSlug || '') : '';
    })();
    const subName = (() => {
        const cls = _getClassData('Warlock');
        if (!cls) return '';
        const sc = (cls.subclasses || []).find(s => s.slug === subSlug);
        return sc ? (sc.name_en || sc.name || '') : '';
    })().toLowerCase();
    // Pact non e' modellato direttamente nel PG (e' un privilegio scelto a
    // livello 3). Per ora consideriamo i pact prereq come "informativi"
    // (non bloccano la selezione, ma restituiamo un warning testuale).
    for (const pr of inv.prerequisites) {
        if (pr.type === 'level') {
            if (wlvl < (pr.value || 0)) return false;
        } else if (pr.type === 'patron') {
            const want = (pr.value || '').toLowerCase();
            if (!subName.includes(want)) return false;
        }
        // Per spell/feature/feature_or_curse non blocchiamo (sono difficili
        // da validare a runtime senza modellare i pact); se opts.strict,
        // applichiamo comunque la validazione testuale piu' avanti.
    }
    return true;
}

// Etichetta leggibile dei prerequisiti (per il picker).
function _formatInvocationPrereqs(inv) {
    if (!inv.prerequisites || inv.prerequisites.length === 0) return '';
    return inv.prerequisites.map(pr => {
        if (pr.type === 'level') return `${pr.value}° livello`;
        if (pr.type === 'spell') {
            const it = pr.value_it || pr.value;
            return `trucchetto ${it}`;
        }
        if (pr.type === 'feature') return pr.value;
        if (pr.type === 'patron') return `patrono ${pr.value}`;
        if (pr.type === 'feature_or_curse') return 'incantesimo maledizione o privilegio da warlock che maledice';
        return pr.value || '';
    }).join(', ');
}

// Lista degli "spell at will" e "spell per long rest" garantiti dalle
// invocazioni selezionate (analogo razziale: appariranno nella pagina
// incantesimi del PG con tag invocazione).
function _pgInvocationGrantedSpells(pg) {
    const ids = (pg && pg.invocazioni) || [];
    const out = [];
    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv) return;
        const d = inv.effect_data || {};
        if (!d.spell_en || !d.spell_it) return;
        const eff = inv.effect;
        if (eff !== 'spell_at_will' && eff !== 'spell_per_long_rest') return;
        out.push({
            name: d.spell_it,
            name_en: d.spell_en,
            level_cast: d.level_cast || 1,
            recharge: eff === 'spell_at_will' ? 'at_will' : 'long_rest',
            invocation_id: id,
            invocation_name: inv.name,
        });
    });
    return out;
}

// Risorse limitate derivate dalle invocazioni: include sia gli spell
// "1/lungo" sia le invocazioni con uso limitato (es. cloak-of-flies,
// gift-of-the-protectors, bond-of-the-talisman). Restituisce una lista di
// "slot" tracciabili nella pagina incantesimi (Slot invocazioni) e nella
// pagina 1 (Risorse).
function _pgInvocationSlots(pg) {
    const stored = (pg && pg.risorse_classe && pg.risorse_classe._invocations) || {};
    const ids = (pg && pg.invocazioni) || [];
    const pb = (typeof getProficiencyBonus === 'function') ? (getProficiencyBonus(pg) || 2) : 2;
    const out = [];

    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv) return;
        const d = inv.effect_data || {};
        const eff = inv.effect;

        let recharge = null;
        let displayRecharge = '';
        let max = 1;
        let isSpell = false;
        let displayName = inv.name;
        let displayLevel = '';
        let key = id.replace(/[^A-Za-z0-9]+/g, '_');

        if (eff === 'spell_per_long_rest') {
            recharge = 'long_rest';
            displayRecharge = 'r. lungo';
            isSpell = true;
            displayName = d.spell_it || d.spell_en || inv.name;
            displayLevel = `Lv ${d.level_cast || 1}`;
            max = 1;
            key = (d.spell_en || id).replace(/[^A-Za-z0-9]+/g, '_');
        } else if (d.recharge === 'long_rest' || d.recharge === 'short_rest') {
            recharge = d.recharge;
            displayRecharge = d.recharge === 'short_rest' ? 'r. breve/lungo' : 'r. lungo';
            const usesSpec = d.uses;
            if (usesSpec === 'prof_bonus') max = pb;
            else if (typeof usesSpec === 'number') max = usesSpec;
            else max = 1;
        } else {
            return;
        }

        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        out.push({
            key,
            name: displayName,
            name_en: isSpell ? d.spell_en : null,
            level_cast: isSpell ? (d.level_cast || 1) : null,
            level_label: displayLevel,
            invocation_name: inv.name,
            invocation_id: id,
            is_spell: isSpell,
            recharge: displayRecharge,
            max,
            current,
        });
    });

    return out;
}

// Skill auto-conferite dalle invocazioni (es. Beguiling Influence).
function _pgInvocationGrantedSkills(pg) {
    const ids = (pg && pg.invocazioni) || [];
    const out = new Set();
    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv || inv.effect !== 'skill_proficiency') return;
        const skills = (inv.effect_data || {}).skills || [];
        skills.forEach(s => out.add(s));
    });
    return Array.from(out);
}

