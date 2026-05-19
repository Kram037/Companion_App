// ============================================================================
// CHARACTER WIZARD NAVIGATION
// ============================================================================

function _pgRequiresSubrace(raceName) {
    if (!raceName || typeof buildSubraceOptionsLocal !== 'function') return false;
    return buildSubraceOptionsLocal(raceName).length > 0;
}

window.pgValidateIdentityStep = function({ requireIdentity = true } = {}) {
    const nome = document.getElementById('pgNome')?.value?.trim() || '';
    if (!nome) {
        showNotification('Inserisci un nome per il personaggio');
        return false;
    }
    if (!requireIdentity) return true;

    const razza = document.getElementById('pgRazza')?.value || '';
    if (!razza) {
        showNotification('Seleziona una razza');
        return false;
    }

    const sottorazza = document.getElementById('pgSottorazza')?.value || '';
    if (_pgRequiresSubrace(razza) && !sottorazza) {
        showNotification('Seleziona una sottorazza');
        return false;
    }

    const background = document.getElementById('pgBackground')?.value || '';
    if (!background) {
        showNotification('Seleziona un background');
        return false;
    }

    return true;
};

// --- Wizard Navigation ---
window.pgWizardNext = function() {
    if (pgWizardCurrentStep === 0) {
        if (!pgValidateIdentityStep({ requireIdentity: !editingPersonaggioId })) return;
    }
    if (pgWizardCurrentStep === 1) {
        if (pgSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }
    }
    pgWizardGoTo(pgWizardCurrentStep + 1);
}

window.pgWizardPrev = function() {
    pgWizardGoTo(pgWizardCurrentStep - 1);
}

function pgWizardGoTo(step) {
    if (step < 0 || step > 7) return;
    pgWizardCurrentStep = step;

    document.querySelectorAll('#personaggioForm .wizard-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#personaggioModal .wizard-step').forEach((s, i) => {
        s.classList.toggle('active', i <= step);
    });

    const target = document.getElementById(`pgStep${step}`);
    if (target) target.classList.add('active');

    if (step === 2) {
        updateAllAbilityMods();
        if (!editingPersonaggioId && pgSelectedClasses.length > 0) {
            pgUpdateSavingThrows();
        }
        updateAllSaveValues();
    }
    if (step === 3) {
        pgRenderSkills();
    }
    if (step === 4) {
        pgRenderResImmGrid('pgResImmGrid');
    }
    if (step === 5) {
        pgRenderTalenti();
    }
    if (step === 6) {
        pgRenderEquipSelected();
    }
    if (step === 7) {
        const des = parseInt(document.getElementById('pgDestrezza')?.value) || 10;
        const cos = parseInt(document.getElementById('pgCostituzione')?.value) || 10;
        const sag = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
        const desMod = calcMod(des);

        const initField = document.getElementById('pgIniziativa');
        if (initField && !initField.value) {
            initField.value = desMod;
        }

        const fakePg = {
            destrezza: des, costituzione: cos, saggezza: sag,
            classi: pgSelectedClasses, equipaggiamento: pgSelectedEquipment
        };
        const caBase = calcCAFromEquip(fakePg);
        const breakdownLines = getCABreakdown(fakePg);
        const caHint = breakdownLines.join(' | ');

        const caField = document.getElementById('pgCA');
        if (caField) caField.value = caBase;
        const hintCA = document.getElementById('hintCA');
        if (hintCA) hintCA.innerHTML = caHint;
        const hintInit = document.getElementById('hintIniziativa');
        if (hintInit) hintInit.textContent = `(des = ${formatModPlain(desMod)})`;

        pgRenderDadiVita();
    }
}
