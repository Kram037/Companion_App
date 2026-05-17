// ============================================================================
// PERSONAGGI EQUIPAGGIAMENTO WIZARD
// ============================================================================

// =====================================================
// WIZARD STEP 6: EQUIPAGGIAMENTO
// =====================================================
function pgCloseEquipSelectModal() {
    document.getElementById('pgEquipSelectModal')?.remove();
    document.body.style.overflow = 'hidden';
}

function pgSetupEquipSelectedDelegation(container) {
    if (!container || container.dataset.equipSelectedDelegationReady === 'true') return;
    container.dataset.equipSelectedDelegationReady = 'true';
    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-equip-action="remove"]');
        if (!button) return;
        event.preventDefault();
        window.pgRemoveEquip(parseInt(button.dataset.equipIndex, 10));
    });
}

function pgSetupEquipModalDelegation(modal) {
    if (!modal) return;
    modal.addEventListener('click', (event) => {
        const closeButton = event.target.closest('[data-equip-modal-action="close"]');
        if (closeButton || event.target === modal) {
            event.preventDefault();
            pgCloseEquipSelectModal();
            return;
        }

        const item = event.target.closest('[data-equip-select-type][data-equip-name]');
        if (!item) return;
        event.preventDefault();
        if (item.dataset.equipSelectType === 'arma') {
            window.pgSelectEquipArma(item.dataset.equipName);
        } else if (item.dataset.equipSelectType === 'armatura') {
            window.pgSelectEquipArmatura(item.dataset.equipName);
        }
    });
}

function pgRenderEquipSelected() {
    const container = document.getElementById('pgEquipSelected');
    if (!container) return;
    pgSetupEquipSelectedDelegation(container);
    if (pgSelectedEquipment.length === 0) {
        setSafeHtml(container, '<span class="scheda-empty">Nessun equipaggiamento selezionato</span>');
        return;
    }
    setSafeHtml(container, pgSelectedEquipment.map((e, i) => `
        <div class="pg-talento-item selected">
            <span class="pg-talento-name">${escapeHtml(e.nome)}${e.tipo === 'arma' ? ` <small>(${e.danni} ${e.tipo_danno})</small>` : e.ca_base ? ` <small>(CA ${e.ca_base})</small>` : ''}</span>
            <button type="button" class="pg-talento-remove" data-equip-action="remove" data-equip-index="${i}">✕</button>
        </div>
    `).join(''));
}

window.pgOpenEquipSelect = function(tipo) {
    let listHtml = '';
    if (tipo === 'arma') {
        const ARMA_CATS = {
            'semplice_mischia': 'Armi da Mischia Semplici',
            'semplice_distanza': 'Armi a Distanza Semplici',
            'guerra_mischia': 'Armi da Mischia da Guerra',
            'guerra_distanza': 'Armi a Distanza da Guerra'
        };
        listHtml = Object.entries(ARMA_CATS).map(([cat, label]) => {
            const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
                `<div class="pg-talento-item" data-equip-select-type="arma" data-equip-name="${safeAttr(a.nome)}">
                    <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                    <span class="option-source">${a.danni} ${a.tipo_danno}</span>
                </div>`
            ).join('');
            return `<div class="form-section-label">${label}</div>${items}`;
        }).join('');
    } else {
        listHtml = ['leggera','media','pesante','scudo'].map(cat => {
            const label = cat === 'scudo' ? 'Scudi' : `Armature ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
            const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
                `<div class="pg-talento-item" data-equip-select-type="armatura" data-equip-name="${safeAttr(a.nome)}">
                    <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                    <span class="option-source">CA ${a.ca_base}</span>
                </div>`
            ).join('');
            return `<div class="form-section-label">${label}</div>${items}`;
        }).join('');
    }
    const modalHtml = `
    <div class="modal active" id="pgEquipSelectModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" data-equip-modal-action="close">&times;</button>
            <h2>${tipo === 'arma' ? 'Scegli Arma' : 'Scegli Armatura'}</h2>
            <div class="wizard-page-scroll">${listHtml}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" data-equip-modal-action="close">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    pgSetupEquipModalDelegation(document.getElementById('pgEquipSelectModal'));
}

window.pgSelectEquipArma = function(nome) {
    const arma = DND_ARMI.find(a => a.nome === nome);
    if (!arma) return;
    pgSelectedEquipment.push({
        nome: arma.nome, tipo: 'arma', danni: arma.danni, tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta, bonus_colpire: 0, bonus_danno: 0
    });
    document.getElementById('pgEquipSelectModal')?.remove();
    pgRenderEquipSelected();
}

window.pgSelectEquipArmatura = function(nome) {
    const arm = DND_ARMATURE.find(a => a.nome === nome);
    if (!arm) return;
    pgSelectedEquipment.push({
        nome: arm.nome, tipo: arm.cat === 'scudo' ? 'scudo' : 'armatura',
        ca_base: arm.ca_base, categoria: arm.cat, mod_des: arm.mod_des, max_des: arm.max_des
    });
    document.getElementById('pgEquipSelectModal')?.remove();
    pgRenderEquipSelected();
}

window.pgRemoveEquip = function(index) {
    pgSelectedEquipment.splice(index, 1);
    pgRenderEquipSelected();
}
