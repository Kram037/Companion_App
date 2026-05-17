// ============================================================================
// CHARACTER SPELL PREPARATION HELPERS
// ============================================================================

const CLASS_SPELL_ABILITY = {
    'Bardo': 'carisma', 'Chierico': 'saggezza', 'Druido': 'saggezza', 'Mago': 'intelligenza',
    'Stregone': 'carisma', 'Warlock': 'carisma', 'Paladino': 'carisma', 'Ranger': 'saggezza',
    'Artefice': 'intelligenza'
};

// Classi che usano la "preparazione" (devono scegliere ogni giorno quali
// incantesimi conosciuti rendere disponibili). Le altre classi
// (Bardo, Stregone, Warlock, Ranger) hanno un numero fisso di
// "incantesimi conosciuti" che sono sempre considerati preparati.
const PREPARED_CASTER_CLASSES = ['Mago', 'Chierico', 'Druido', 'Paladino', 'Artefice'];

function _pgUsesPreparedSystem(pg) {
    return (pg?.classi || []).some(c => PREPARED_CASTER_CLASSES.includes(c.nome));
}

// Calcolo "regola standard" del numero massimo di incantesimi preparati.
// - Mago/Chierico/Druido/Artefice: mod caratteristica + livello di classe
// - Paladino: mod CAR + (livello/2 floor), minimo 1
// - In multiclass si sommano i contributi delle singole classi (semplificazione).
function _calcMaxPreparedAuto(pg) {
    if (!pg) return 0;
    let total = 0;
    for (const c of (pg.classi || [])) {
        if (!PREPARED_CASTER_CLASSES.includes(c.nome)) continue;
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (!ab) continue;
        const mod = Math.floor(((pg[ab] || 10) - 10) / 2);
        const lvl = c.livello || 1;
        const lvlContrib = c.nome === 'Paladino' ? Math.floor(lvl / 2) : lvl;
        total += Math.max(1, mod + lvlContrib);
    }
    return total;
}

function _spellIsPrepared(pg, spellName, spellLevel) {
    if (spellLevel === 0) return true;
    if (!_pgUsesPreparedSystem(pg)) return true;
    const list = Array.isArray(pg.incantesimi_preparati) ? pg.incantesimi_preparati : [];
    return list.includes(spellName);
}
