// ============================================================================
// PERSONAGGI COMPETENZE WIZARD
// ============================================================================

// --- Skills ---
let pgCurrentSkillProficiencies = new Set();
let pgCurrentSkillExpertise = new Set();

function pgSetupSkillsDelegation(container) {
    if (!container || container.dataset.pgSkillsDelegated === '1') return;
    container.dataset.pgSkillsDelegated = '1';
    container.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-skill-action]');
        if (!actionEl || !container.contains(actionEl)) return;

        const skillKey = actionEl.dataset.skillKey;
        if (!skillKey) return;
        if (actionEl.dataset.skillAction === 'toggle-prof') {
            pgToggleSkill(skillKey);
        } else if (actionEl.dataset.skillAction === 'toggle-expert') {
            pgToggleSkillExpert(skillKey);
        }
    });
}

function pgRenderSkills() {
    const container = document.getElementById('pgSkillsList');
    if (!container) return;
    pgSetupSkillsDelegation(container);
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    const html = DND_SKILLS.map(skill => {
        const abilityInput = document.getElementById(`pg${skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)}`);
        const abilityScore = parseInt(abilityInput?.value) || 10;
        const abilityMod = calcMod(abilityScore);
        const isProf = pgCurrentSkillProficiencies.has(skill.key);
        const isExpert = pgCurrentSkillExpertise.has(skill.key);
        const totalVal = abilityMod + (isProf ? bonus : 0) + (isExpert ? bonus : 0);
        return `
        <div class="pg-skill-item ${isProf ? 'proficient' : ''} ${isExpert ? 'expert' : ''}">
            <span class="pg-skill-dot ${isProf ? 'active' : ''}" data-skill-action="toggle-prof" data-skill-key="${skill.key}" title="Competenza">●</span>
            <span class="pg-skill-dot expert ${isExpert ? 'active' : ''}" data-skill-action="toggle-expert" data-skill-key="${skill.key}" title="Maestria">★</span>
            <span class="pg-skill-value">${formatModPlain(totalVal)}</span>
            <span class="pg-skill-name">${skill.nome}</span>
            <span class="pg-skill-ability">(${skill.abbr})</span>
        </div>`;
    }).join('');
    setSafeHtml(container, html);
}

window.pgToggleSkill = function(skillKey) {
    if (pgCurrentSkillProficiencies.has(skillKey)) {
        pgCurrentSkillProficiencies.delete(skillKey);
        pgCurrentSkillExpertise.delete(skillKey);
    } else {
        pgCurrentSkillProficiencies.add(skillKey);
    }
    pgRenderSkills();
    pgUpdatePercezionPassiva();
}

window.pgToggleSkillExpert = function(skillKey) {
    if (pgCurrentSkillExpertise.has(skillKey)) {
        pgCurrentSkillExpertise.delete(skillKey);
    } else {
        pgCurrentSkillProficiencies.add(skillKey);
        pgCurrentSkillExpertise.add(skillKey);
    }
    pgRenderSkills();
    pgUpdatePercezionPassiva();
}

function pgCalcPercPassiva() {
    const sagScore = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
    const sagMod = calcMod(sagScore);
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    const isProf = pgCurrentSkillProficiencies.has('percezione');
    const isExpert = pgCurrentSkillExpertise.has('percezione');
    return 10 + sagMod + (isProf ? bonus : 0) + (isExpert ? bonus : 0);
}

// --- Resistenze ---
let pgCurrentResistenze = [];
let pgCurrentImmunita = [];

function pgSetupResImmDelegation(container) {
    if (!container || container.dataset.pgResImmDelegated === '1') return;
    container.dataset.pgResImmDelegated = '1';
    container.addEventListener('change', (event) => {
        const input = event.target.closest('[data-res-action]');
        if (!input || !container.contains(input)) return;

        const value = input.dataset.damageType;
        if (!value) return;
        if (input.dataset.resAction === 'res') {
            pgToggleRes(value, input.checked);
        } else if (input.dataset.resAction === 'imm') {
            pgToggleImm(value, input.checked);
        }
    });
}

function pgRenderResImmGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    pgSetupResImmDelegation(container);
    const html = DAMAGE_TYPES.map(dt => {
        const isRes = pgCurrentResistenze.includes(dt.value);
        const isImm = pgCurrentImmunita.includes(dt.value);
        return `
        <div class="pg-res-row">
            <span class="pg-res-label">${dt.label}</span>
            <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} data-res-action="res" data-damage-type="${dt.value}" title="Resistenza">
            <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} data-res-action="imm" data-damage-type="${dt.value}" title="Immunità">
        </div>`;
    }).join('');
    setSafeHtml(container, html);
}

window.pgToggleRes = function(val, checked) {
    if (checked) { if (!pgCurrentResistenze.includes(val)) pgCurrentResistenze.push(val); }
    else { pgCurrentResistenze = pgCurrentResistenze.filter(r => r !== val); }
}

window.pgToggleImm = function(val, checked) {
    if (checked) { if (!pgCurrentImmunita.includes(val)) pgCurrentImmunita.push(val); }
    else { pgCurrentImmunita = pgCurrentImmunita.filter(r => r !== val); }
}

