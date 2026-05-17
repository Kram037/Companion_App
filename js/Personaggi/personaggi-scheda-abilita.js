// ============================================================================
// CHARACTER SHEET ABILITY AND SKILL ACTIONS
// ============================================================================

window.schedaToggleSave = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const saves = [...(pg.tiri_salvezza || [])];
    const idx = saves.indexOf(abilityKey);
    if (idx >= 0) saves.splice(idx, 1); else saves.push(abilityKey);
    pg.tiri_salvezza = saves;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const m = Math.floor((val - 10) / 2);
    const isProf = saves.includes(abilityKey);
    const saveExtra = _getSaveBonusFor(pg, abilityKey);
    const saveMod = m + (isProf ? bonusComp : 0) + saveExtra;
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';

    const saveEl = document.querySelector(`.scheda-ability-save[data-save="${abilityKey}"]`);
    if (saveEl) {
        saveEl.classList.toggle('proficient', isProf);
        saveEl.querySelector('.scheda-save-dot').textContent = isProf ? '●' : '○';
        saveEl.querySelector('.scheda-save-val').innerHTML = `${saveStr}${saveMark}`;
    }
    schedaInstantSave(pgId, { tiri_salvezza: saves });
}

window.schedaToggleSkillProf = async function(pgId, skillKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const skills = [...(pg.competenze_abilita || [])];
    const idx = skills.indexOf(skillKey);
    if (idx >= 0) skills.splice(idx, 1); else skills.push(skillKey);
    pg.competenze_abilita = skills;

    schedaRefreshSkill(pg, skillKey);
    schedaInstantSave(pgId, { competenze_abilita: skills });
}

window.schedaToggleSkillExpert = async function(pgId, skillKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const experts = [...(pg.maestrie_abilita || [])];
    const idx = experts.indexOf(skillKey);
    const adding = idx < 0;
    if (adding) experts.push(skillKey); else experts.splice(idx, 1);
    pg.maestrie_abilita = experts;

    const updates = { maestrie_abilita: experts };

    if (adding && !(pg.competenze_abilita || []).includes(skillKey)) {
        const skills = [...(pg.competenze_abilita || []), skillKey];
        pg.competenze_abilita = skills;
        updates.competenze_abilita = skills;
    }

    schedaRefreshSkill(pg, skillKey);
    schedaInstantSave(pgId, updates);
}

function schedaRefreshSkill(pg, skillKey) {
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const factotum = _getFactotumBonus(pg);
    const sk = SCHEDA_SKILLS.find(s => s.key === skillKey);
    if (!sk) return;

    const abilityVal = pg[sk.ability] || 10;
    const abilityMod = Math.floor((abilityVal - 10) / 2);
    const isProf = (pg.competenze_abilita || []).includes(skillKey);
    const isExpert = (pg.maestrie_abilita || []).includes(skillKey);
    const jot = (!isProf && !isExpert) ? factotum : 0;
    const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0) + jot;
    const totalStr = total >= 0 ? `+${total}` : `${total}`;

    const el = document.getElementById(`sSkill_${skillKey}`);
    if (el) el.textContent = totalStr;

    const row = el?.closest('.scheda-skill');
    if (row) {
        const dots = row.querySelectorAll('.scheda-skill-dot');
        if (dots[0]) dots[0].classList.toggle('active', isProf);
        if (dots[1]) dots[1].classList.toggle('active', isExpert);
    }

    if (skillKey === 'percezione') {
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const pp = 10 + sagMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0) + jot;
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }
}
