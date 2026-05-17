// ============================================================================
// PERSONAGGI SOTTOCLASSI
// ============================================================================

// Incantesimi auto-garantiti da sottoclasse (Chierico Domini, Paladino
// Giuramenti, Warlock Patroni con Lista Espansa, Stregone Aberrant Mind /
// Clockwork Soul, Druido Cerchi, Ranger Conclavi, Artefice specialisti...).
// I dati vivono in window.SUBCLASS_SPELLS_DATA e sono generati da
// risorse/classi/build_subclass_spells.py.
//
// Schema (vedi script):
//   { class_slug: { subclass_slug: { pgLvlMin: ["Nome IT", ...] } } }
//
// Il PG ottiene una voce quando livello_classe >= pgLvlMin. La funzione
// restituisce { name, source, source_label, sub_label } per ogni
// incantesimo, deduplicando se lo stesso spell appare in piu' classi.
// ─────────────────────────────────────────────────────────────────────────
function _pgSubclassGrantedSpells(pg) {
    const data = window.SUBCLASS_SPELLS_DATA || {};
    if (!pg || !Array.isArray(pg.classi)) return [];
    const seen = new Set();
    const out = [];
    const hbCache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewSottoclassi))
        ? AppState.cachedHomebrewSottoclassi : [];
    pg.classi.forEach(c => {
        if (!c || !c.nome) return;
        const cls = _getClassData(c.nome);
        if (!cls) return;
        const subSlug = c.sottoclasseSlug || '';
        if (!subSlug) return;
        const lvl = parseInt(c.livello) || 1;

        // ── Caso HOMEBREW: lo slug e' 'hb:<id>' ──
        if (c.sottoclasse_homebrew_id || subSlug.startsWith('hb:')) {
            const hbId = c.sottoclasse_homebrew_id || subSlug.replace(/^hb:/, '');
            const hb = hbCache.find(r => String(r.id) === String(hbId));
            if (!hb) return;
            const subLabel = hb.nome || c.sottoclasse || 'Sottoclasse Homebrew';
            // 1. granted_spells a livello sottoclasse: [{ level, spells:[...] }]
            (Array.isArray(hb.granted_spells) ? hb.granted_spells : []).forEach(g => {
                if ((parseInt(g.level) || 99) > lvl) return;
                (g.spells || []).forEach(name => {
                    const key = (name || '').toLowerCase();
                    if (!key || seen.has(key)) return;
                    seen.add(key);
                    out.push({
                        name,
                        source: cls.slug + ':hb:' + hbId,
                        source_label: subLabel,
                    });
                });
            });
            // 2. spells per singolo privilegio (feature.grants_spells)
            (Array.isArray(hb.sottoclasse_features) ? hb.sottoclasse_features : []).forEach(f => {
                if ((parseInt(f.level) || 99) > lvl) return;
                if (!Array.isArray(f.grants_spells) || f.grants_spells.length === 0) return;
                f.grants_spells.forEach(name => {
                    const key = (name || '').toLowerCase();
                    if (!key || seen.has(key)) return;
                    seen.add(key);
                    out.push({
                        name,
                        source: cls.slug + ':hb:' + hbId + ':' + (f.nome || 'priv'),
                        source_label: subLabel + (f.nome ? ' • ' + f.nome : ''),
                    });
                });
            });
            return;
        }

        // ── Caso NATIVO ──
        const subData = (data[cls.slug] || {})[subSlug];
        if (!subData) return;
        // Etichetta: "Dominio della Vita", "Giuramento di Devozione",
        // "Patrono del Demonio", ecc. — usa il nome IT della sottoclasse
        // se disponibile, altrimenti il name_en.
        const sub = (cls.subclasses || []).find(x => x.slug === subSlug);
        const subLabel = sub ? (sub.name || sub.name_en || c.sottoclasse) : (c.sottoclasse || subSlug);
        Object.entries(subData).forEach(([reqLvlStr, spellNames]) => {
            const reqLvl = parseInt(reqLvlStr);
            if (lvl < reqLvl) return;
            (spellNames || []).forEach(name => {
                const key = (name || '').toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                out.push({
                    name,
                    source: cls.slug + ':' + subSlug,
                    source_label: subLabel,
                });
            });
        });
    });
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Auto-effetti dei privilegi di sottoclasse (resistenze, immunita',
// ecc.) che dovrebbero essere applicati automaticamente al PG quando
// raggiunge il livello richiesto.
//
// Mappa: classe slug -> sottoclasse slug -> array di
//   { level, resistances?: [...], immunities?: [...] }
const SUBCLASS_AUTO_EFFECTS = {
    sorcerer: {
        'aberrant-mind': [
            { level: 6, resistances: ['psichico'] },  // Difese Psichiche
        ],
        'storm-sorcery': [
            { level: 6, resistances: ['fulmine', 'tuono'] },  // Heart of the Storm
        ],
        'divine-soul': [],
    },
    barbarian: {
        'path-of-the-totem-warrior': [
            { level: 3, resistances: [] }, // Spirit Seeker - resistance only while raging (gestito separatamente)
        ],
    },
    monk: {
        'way-of-the-sun-soul': [],
    },
    paladin: {
        'oath-of-the-ancients': [
            { level: 7, resistances: [] }, // Aura of Warding - aura, gestita separatamente
        ],
    },
};

// Restituisce i tipi di danno a cui il PG ottiene resistenza
// automaticamente in base ai privilegi delle sue sottoclassi e al
// livello attuale.
function _pgSubclassAutoResistances(pg) {
    const out = new Set();
    if (!pg || !Array.isArray(pg.classi)) return [];
    pg.classi.forEach(c => {
        const cls = _getClassData(c?.nome || '');
        if (!cls) return;
        const subSlug = c.sottoclasseSlug;
        if (!subSlug) return;
        const map = SUBCLASS_AUTO_EFFECTS[cls.slug];
        if (!map) return;
        const entries = map[subSlug];
        if (!entries) return;
        const lvl = parseInt(c.livello) || 0;
        entries.forEach(e => {
            if (lvl >= (e.level || 0)) {
                (e.resistances || []).forEach(r => out.add(r));
            }
        });
    });
    return Array.from(out);
}

// Inietta in pg.resistenze (e analogamente immunita') eventuali
// resistenze auto-derivate da privilegi di sottoclasse mancanti.
// Idempotente: aggiunge solo cio' che manca.
function _ensureSubclassAutoEffectsApplied(pg) {
    if (!pg) return false;
    const auto = _pgSubclassAutoResistances(pg);
    if (auto.length === 0) return false;
    if (!Array.isArray(pg.resistenze)) pg.resistenze = [];
    let changed = false;
    auto.forEach(r => {
        if (!pg.resistenze.includes(r)) {
            pg.resistenze.push(r);
            changed = true;
        }
    });
    return changed;
}

// ─────────────────────────────────────────────────────────────────────────
