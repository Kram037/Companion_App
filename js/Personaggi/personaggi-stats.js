// ============================================================================
// PERSONAGGI STATS
// ============================================================================

function calcMod(score) {
    return Math.floor((score - 10) / 2);
}

function calcBonusCompetenza(livello) {
    return Math.floor((livello - 1) / 4) + 2;
}

// Bonus "Factotum" (Jack of All Trades) del Bardo: dal 2° livello da Bardo
// puoi aggiungere meta' del bonus di competenza (arrotondato per difetto)
// a ogni prova di caratteristica in cui non sei competente. Si applica anche
// alla Percezione Passiva e al tiro di Iniziativa (entrambe prove di
// caratteristica). Ritorna 0 se il PG non e' un Bardo o e' < 2.
function _getFactotumBonus(pg) {
    if (!pg || !Array.isArray(pg.classi)) return 0;
    const bardoLvl = pg.classi
        .filter(c => c && (c.nome === 'Bardo' || c.nome === 'Bard'))
        .reduce((s, c) => s + (parseInt(c.livello) || 0), 0);
    if (bardoLvl < 2) return 0;
    const totLvl = pg.classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0)
        || pg.livello || 1;
    return Math.floor(calcBonusCompetenza(totLvl) / 2);
}
window._getFactotumBonus = _getFactotumBonus;

function updateBonusCompetenza() {
    const livello = pgGetTotalLevel();
    const bonus = calcBonusCompetenza(livello);
    const field = document.getElementById('pgBonusCompetenza');
    if (field) field.value = `+${bonus}`;
}

function pgGetTotalLevel() {
    return pgSelectedClasses.reduce((sum, c) => sum + (c.livello || 1), 0) || 1;
}

function pgUpdateTotalLevel() {
    const total = pgGetTotalLevel();
    const lvField = document.getElementById('pgLivello');
    if (lvField) lvField.value = total;
    updateBonusCompetenza();
}

function formatModPlain(mod) {
    if (mod >= 0) return `+${mod}`;
    return `${mod}`;
}

function updateAbilityMod(input, modEl) {
    const val = parseInt(input.value) || 10;
    const mod = calcMod(val);
    modEl.textContent = formatModPlain(mod);
    modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
    updateAllSaveValues();
}

function updateAllAbilityMods() {
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const modEl = document.getElementById(`mod${name}`);
        if (input && modEl) updateAbilityMod(input, modEl);
    });
    updateAllSaveValues();
}

function updateAllSaveValues() {
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const cb = document.getElementById(`save${name}`);
        const valEl = document.getElementById(`saveVal${name}`);
        if (!input || !valEl) return;
        const mod = calcMod(parseInt(input.value) || 10);
        const isProf = cb && cb.checked;
        const total = mod + (isProf ? bonus : 0);
        valEl.textContent = formatModPlain(total);
    });
}
