// ============================================================================
// CHARACTER SHEET MAIN RENDER
// ============================================================================

async function renderSchedaPersonaggio(personaggioId) {
    _schedaRequestReactRefresh(personaggioId, 'scheda');
}

function schedaRecalcAbility(abilityKey, val, pgId) {
    const m = Math.floor((val - 10) / 2);
    const mStr = m >= 0 ? `+${m}` : `${m}`;
    const modEl = document.getElementById(`sMod_${abilityKey}`);
    if (modEl) modEl.textContent = mStr;

    const pg = _schedaPgCache;
    if (!pg) return;
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const factotum = _getFactotumBonus(pg);
    const saves = pg.tiri_salvezza || [];
    const isSaveProf = saves.includes(abilityKey);
    const saveExtra = _getSaveBonusFor(pg, abilityKey);
    const saveMod = m + (isSaveProf ? bonusComp : 0) + saveExtra;
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
    const saveEl = document.getElementById(`sSave_${abilityKey}`);
    if (saveEl) saveEl.innerHTML = `${saveStr}${saveMark}`;

    const skillProf = pg.competenze_abilita || [];
    const skillExpert = pg.maestrie_abilita || [];
    SCHEDA_SKILLS.filter(sk => sk.ability === abilityKey).forEach(sk => {
        const isProf = skillProf.includes(sk.key);
        const isExpert = skillExpert.includes(sk.key);
        const jot = (!isProf && !isExpert) ? factotum : 0;
        const total = m + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0) + jot;
        const totalStr = total >= 0 ? `+${total}` : `${total}`;
        const el = document.getElementById(`sSkill_${sk.key}`);
        if (el) el.textContent = totalStr;
    });

    if (abilityKey === 'saggezza') {
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const percJot = (!percProf && !percExpert) ? factotum : 0;
        const pp = 10 + m + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0) + percJot;
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }

    if (abilityKey === 'destrezza') {
        const initEl = document.getElementById('schedaInit');
        if (initEl && pg.iniziativa != null) {
            const initStr = pg.iniziativa >= 0 ? `+${pg.iniziativa}` : `${pg.iniziativa}`;
            initEl.textContent = initStr;
        }
    }
}
