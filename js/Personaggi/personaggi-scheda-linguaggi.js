// ============================================================================
// CHARACTER SHEET LANGUAGES AND TOOL PROFICIENCIES
// ============================================================================

window.schedaOpenLangProfEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentLangs = pg.linguaggi ? [...pg.linguaggi] : [];
    const currentToolsRaw = pg.competenze_strumenti || [];
    const currentTools = currentToolsRaw.map(_parseToolEntry);

    const langCheckboxes = DND_LINGUAGGI.map(l => {
        const checked = currentLangs.includes(l) ? 'checked' : '';
        return `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(l)}" ${checked} onchange="schedaLangToggle(this)"><span>${escapeHtml(l)}</span></label>`;
    }).join('');

    let toolSectionsHtml = '';
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = groupDef.items.map(t => {
            const entry = currentTools.find(e => e.nome === t);
            const checked = entry ? 'checked' : '';
            const hasMastery = entry?.maestria ? 'checked' : '';
            let html = `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(t)}" ${checked} onchange="schedaToolToggle(this)"><span>${escapeHtml(t)}</span>`;
            if (groupDef.allowMastery) {
                html += `<label class="scheda-mastery-toggle" title="Maestria"><input type="checkbox" data-tool="${escapeHtml(t)}" ${hasMastery} onchange="schedaToolMasteryToggle(this)" ${!entry ? 'disabled' : ''}>★</label>`;
            }
            html += `</label>`;
            return html;
        }).join('');
        toolSectionsHtml += `<div class="scheda-picker-cat">${escapeHtml(groupName)}</div><div class="scheda-checkbox-grid">${items}</div>`;
    }

    const modalHtml = `
    <div class="modal active" id="langProfModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseLangProfEdit()">&times;</button>
            <h2>Linguaggi e Competenze</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="linguaggi" onclick="schedaPickerSwitchTab(this,'linguaggi')">Linguaggi</button>
                <button type="button" class="picker-tab" data-panel="competenze" onclick="schedaPickerSwitchTab(this,'competenze')">Competenze</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="linguaggi">
                    <div class="scheda-checkbox-grid">${langCheckboxes}</div>
                </div>
                <div class="picker-tab-panel" data-panel="competenze">
                    ${toolSectionsHtml}
                </div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseLangProfEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaLangEditPgId = pgId;
    window._schedaLangList = currentLangs;
    window._schedaToolList = currentTools;
}

window.schedaLangToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const lang = cb.value;
    if (cb.checked) {
        if (!window._schedaLangList.includes(lang)) window._schedaLangList.push(lang);
    } else {
        window._schedaLangList = window._schedaLangList.filter(l => l !== lang);
    }
    const pg = _schedaPgCache;
    if (pg) pg.linguaggi = [...window._schedaLangList];
    const display = document.getElementById('schedaLangDisplay');
    if (display) display.innerHTML = window._schedaLangList.length > 0 ?
        window._schedaLangList.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';
    await schedaInstantSave(pgId, { linguaggi: window._schedaLangList });
}

function _refreshToolDisplay() {
    const pg = _schedaPgCache;
    if (!pg) return;
    pg.competenze_strumenti = window._schedaToolList.map(t => ({ ...t }));
    const container = document.getElementById('schedaLangProfDisplay');
    if (!container) return;
    const langDisplay = document.getElementById('schedaLangDisplay');
    const langRow = langDisplay ? langDisplay.closest('.scheda-res-imm-row') : null;
    const grouped = _toolsByGroup(window._schedaToolList);
    let toolHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }
    container.innerHTML = (langRow ? langRow.outerHTML : '') + toolHtml;
}

window.schedaToolToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.value;
    if (cb.checked) {
        if (!window._schedaToolList.find(t => t.nome === toolName)) {
            window._schedaToolList.push({ nome: toolName, maestria: false });
        }
    } else {
        window._schedaToolList = window._schedaToolList.filter(t => t.nome !== toolName);
    }
    const masteryInput = cb.closest('.scheda-checkbox-item')?.querySelector('[data-tool]');
    if (masteryInput) {
        masteryInput.disabled = !cb.checked;
        if (!cb.checked) masteryInput.checked = false;
    }
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaToolMasteryToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.dataset.tool;
    const entry = window._schedaToolList.find(t => t.nome === toolName);
    if (entry) entry.maestria = cb.checked;
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaCloseLangProfEdit = function() {
    document.getElementById('langProfModal')?.remove();
    document.body.style.overflow = '';
}

// =====================================================
// AUTO-POPULATE LINGUAGGI FROM RACE
// =====================================================
function autoPopulateLinguaggi(razzaNome, sottorazzaNome) {
    const merged = razzaNome ? buildMergedRaceData(razzaNome, sottorazzaNome || null) : null;
    if (merged && merged.linguaggi && merged.linguaggi.length > 0) {
        return [...merged.linguaggi];
    }
    const raceData = getRaceData(razzaNome);
    if (!raceData) return ['Comune'];
    return raceData.linguaggi && raceData.linguaggi.length > 0 ? [...raceData.linguaggi] : ['Comune'];
}

window.pgEnsureWizardPageMount = function() {
    const mount = document.getElementById('personaggioCreateMount');
    const modal = elements.personaggioModal || document.getElementById('personaggioModal');
    if (!mount || !modal) return false;

    const panel = document.getElementById('personaggioWizardPanel')
        || modal.querySelector('.modal-content-lg');
    if (!panel) return false;

    panel.id = 'personaggioWizardPanel';
    panel.classList.add('personaggio-create-panel');
    if (panel.parentElement !== mount) {
        mount.appendChild(panel);
    }
    return true;
};

function _pgSetWizardTitle(title) {
    if (elements.personaggioModalTitle) elements.personaggioModalTitle.textContent = title;
    window._pgWizardPageTitle = title;
    window.dispatchEvent(new CustomEvent('companion:character-wizard-title', { detail: { title } }));
}

function _pgHasWizardDraftChanges() {
    if (editingPersonaggioId) return true;
    const valueOf = id => document.getElementById(id)?.value || '';
    const defaultAbility = ['pgForza', 'pgDestrezza', 'pgCostituzione', 'pgIntelligenza', 'pgSaggezza', 'pgCarisma']
        .every(id => (parseInt(valueOf(id)) || 10) === 10);
    const hasIdentity = !!(
        valueOf('pgNome').trim()
        || valueOf('pgRazza')
        || valueOf('pgSottorazza')
        || valueOf('pgBackground')
    );
    return !!(
        hasIdentity
        || pgSelectedClasses.length
        || pgSelectedEquipment.length
        || pgCurrentTalenti.length
        || pgCurrentResistenze.length
        || pgCurrentImmunita.length
        || !defaultAbility
        || window.pgHitPointHistoryDraft
    );
}

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
    window.pgEnsureWizardPageMount?.();
    if (AppState.currentPage !== 'personaggioCreate') {
        window._pgWizardReturnPage = AppState.currentPage || 'personaggi';
        window._pgWizardReturnPersonaggioId = AppState.currentPersonaggioId || null;
    }
    const form = elements.personaggioForm;
    if (!form) return;

    // Refresh delle sottoclassi homebrew (proprie + amici abilitati) ad
    // ogni apertura della modale: kick-off in background, NIENTE re-render
    // dopo (per non sfarfallare il bottone). Quando l'utente cliccherà
    // "Sottoclasse...", il click handler aspetterà la fine della load
    // se ancora in volo.
    if (typeof loadHomebrewSottoclassi === 'function') {
        loadHomebrewSottoclassi();
    }

    form.reset();
    pgSelectedClasses = [];
    pgCurrentSkillProficiencies = new Set();
    pgCurrentSkillExpertise = new Set();
    pgCurrentResistenze = [];
    pgCurrentImmunita = [];
    pgCurrentSlotIncantesimo = {};
    pgCurrentTalenti = [];
    window._featPickerFilters['wizard'] = _defaultFeatFilters();
    window._featPickerSearch['wizard'] = '';
    pgSelectedEquipment = [];
    _pgRaceSkills = [];
    _pgBgSkills = [];
    _pgBgTools = [];
    _pgBgLangs = [];
    pgCurrentBgTools = new Set();
    pgCurrentBgLanguages = new Set();
    _pgRaceResistances = [];
    pgRenderClassi();
    pgWizardGoTo(0);

    const razzaBtn = document.getElementById('pgRazzaBtn');
    const razzaInput = document.getElementById('pgRazza');
    if (razzaBtn) razzaBtn.textContent = 'Seleziona razza...';
    if (razzaInput) razzaInput.value = '';
    const sottoBtn = document.getElementById('pgSottorazzaBtn');
    const sottoInput = document.getElementById('pgSottorazza');
    if (sottoBtn) sottoBtn.textContent = 'Seleziona sottorazza...';
    if (sottoInput) sottoInput.value = '';
    const sottoGroup = document.getElementById('pgSottorazzaGroup');
    if (sottoGroup) sottoGroup.style.display = 'none';
    const bgBtn = document.getElementById('pgBackgroundBtn');
    const bgInput = document.getElementById('pgBackground');
    if (bgBtn) bgBtn.textContent = 'Seleziona background...';
    if (bgInput) bgInput.value = '';

    // Reset saving throws
    ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'].forEach(s => {
        const cb = document.getElementById(`save${s}`);
        if (cb) cb.checked = false;
    });

    if (personaggioId) {
        _pgSetWizardTitle('Modifica Personaggio');
        elements.savePersonaggioBtn.textContent = 'Salva';

        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data, error }) => {
                if (data && !error) {
                    document.getElementById('pgNome').value = data.nome || '';
                    const razzaVal = data.razza || '';
                    document.getElementById('pgRazza').value = razzaVal;
                    const rBtn = document.getElementById('pgRazzaBtn');
                    if (rBtn) rBtn.textContent = razzaVal || 'Seleziona razza...';
                    const sottoVal = data.sottorazza || '';
                    const sottoInputEl = document.getElementById('pgSottorazza');
                    if (sottoInputEl) sottoInputEl.value = sottoVal;
                    _pgUpdateSottorazzaUI();
                    const bgVal = data.background || '';
                    document.getElementById('pgBackground').value = bgVal;
                    const bBtn = document.getElementById('pgBackgroundBtn');
                    if (bBtn) bBtn.textContent = bgVal || 'Seleziona background...';
                    // Inizializza tracking del bg corrente (cosi' se l'utente lo cambia
                    // nel wizard, le competenze auto-popolate vengono rimosse correttamente).
                    _pgApplyBackgroundAutoPopulate();

                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        pgSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        pgSelectedClasses = [{ nome: data.classe, livello: data.livello || 1 }];
                    }
                    pgRenderClassi();
                    pgUpdateTotalLevel();

                    document.getElementById('pgForza').value = data.forza || 10;
                    document.getElementById('pgDestrezza').value = data.destrezza || 10;
                    document.getElementById('pgCostituzione').value = data.costituzione || 10;
                    document.getElementById('pgIntelligenza').value = data.intelligenza || 10;
                    document.getElementById('pgSaggezza').value = data.saggezza || 10;
                    document.getElementById('pgCarisma').value = data.carisma || 10;

                    if (data.tiri_salvezza && Array.isArray(data.tiri_salvezza)) {
                        data.tiri_salvezza.forEach(s => {
                            const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
                            if (cb) cb.checked = true;
                        });
                    } else {
                        pgUpdateSavingThrows();
                    }

                    if (data.competenze_abilita && Array.isArray(data.competenze_abilita)) {
                        pgCurrentSkillProficiencies = new Set(data.competenze_abilita);
                    }
                    if (data.maestrie_abilita && Array.isArray(data.maestrie_abilita)) {
                        pgCurrentSkillExpertise = new Set(data.maestrie_abilita);
                    }
                    if (data.talenti && Array.isArray(data.talenti)) {
                        pgCurrentTalenti = [...data.talenti];
                    }
                    if (data.equipaggiamento && Array.isArray(data.equipaggiamento)) {
                        pgSelectedEquipment = [...data.equipaggiamento];
                    }

                    if (data.resistenze && Array.isArray(data.resistenze)) {
                        pgCurrentResistenze = [...data.resistenze];
                    }
                    if (data.immunita && Array.isArray(data.immunita)) {
                        pgCurrentImmunita = [...data.immunita];
                    }
                    if (data.slot_incantesimo && typeof data.slot_incantesimo === 'object') {
                        pgCurrentSlotIncantesimo = {};
                        Object.keys(data.slot_incantesimo).forEach(k => {
                            pgCurrentSlotIncantesimo[parseInt(k)] = { ...data.slot_incantesimo[k] };
                        });
                    }

                    const pvF = document.getElementById('pgPV');
                    if (pvF) { pvF.value = data.punti_vita_max || 10; pvF.dataset.autoHp = 'false'; }
                    window.pgHitPointHistoryDraft = null;
                    document.getElementById('pgIniziativa').value = data.iniziativa != null ? data.iniziativa : calcMod(data.destrezza || 10);
                    document.getElementById('pgCA').value = data.classe_armatura || 10;
                    document.getElementById('pgVelocita').value = data.velocita || 9;
                    updateAllAbilityMods();
                }
            });
        }
    } else {
        _pgSetWizardTitle('Nuovo Personaggio');
        elements.savePersonaggioBtn.textContent = 'Crea';
        document.getElementById('pgCA').value = '';
        document.getElementById('pgIniziativa').value = '';
        const pvField = document.getElementById('pgPV');
        if (pvField) { pvField.value = 10; pvField.dataset.autoHp = 'true'; }
        window.pgHitPointHistoryDraft = null;
        updateAllAbilityMods();
        updateBonusCompetenza();
    }

    navigateToPage('personaggioCreate');
}

async function closePersonaggioModal({ force = false } = {}) {
    if (!force && AppState.currentPage === 'personaggioCreate' && _pgHasWizardDraftChanges()) {
        const confirmed = await showConfirm('Vuoi uscire dalla creazione del personaggio? Le modifiche non salvate andranno perse.');
        if (!confirmed) return;
    }
    if (elements.personaggioModal) {
        elements.personaggioModal.classList.remove('active');
    }
    document.body.style.overflow = '';
    const returnPage = window._pgWizardReturnPage || 'personaggi';
    const returnPersonaggioId = window._pgWizardReturnPersonaggioId || null;
    editingPersonaggioId = null;

    if (AppState.currentPage === 'personaggioCreate') {
        if (returnPage === 'scheda' && returnPersonaggioId) {
            AppState.currentPersonaggioId = returnPersonaggioId;
        }
        navigateToPage(returnPage);
    }
}
