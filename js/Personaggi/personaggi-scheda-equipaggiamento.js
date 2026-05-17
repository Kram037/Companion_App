// ============================================================================
// CHARACTER SHEET EQUIPMENT
// ============================================================================

function buildEquipSection(pg) {
    const equip = pg.equipaggiamento || [];
    const armiRows = equip.filter(e => e.tipo === 'arma').map((e, i) => {
        const idx = equip.indexOf(e);
        const bonus = e.bonus_colpire != null ? (e.bonus_colpire >= 0 ? `+${e.bonus_colpire}` : e.bonus_colpire) : '-';
        const dmgBonus = e.bonus_danno || 0;
        const dannoStr = e.danni ? `${e.danni}${dmgBonus !== 0 ? (dmgBonus > 0 ? '+' + dmgBonus : dmgBonus) : ''}` : '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${bonus}</td>
            <td class="text-center">${dannoStr} ${e.tipo_danno ? escapeHtml(e.tipo_danno.slice(0,3)) + '.' : ''}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const armaturaItems = equip.filter(e => e.tipo === 'armatura' || e.tipo === 'scudo');
    const armaturaRows = armaturaItems.map(e => {
        const idx = equip.indexOf(e);
        const totalCA = (e.ca_base || 0) + (e.magic_bonus || 0);
        const magicStr = e.magic_bonus ? ` (+${e.magic_bonus})` : '';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${totalCA}${magicStr}</td>
            <td class="text-center">${e.categoria || '-'}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const FOCUS_LABELS_SHORT = {
        'arcano': 'Arcano',
        'druidico': 'Druidico',
        'sacro': 'Sacro',
        'componenti': 'Componenti',
        'altro': 'Altro',
    };
    const focusItems = equip.filter(e => e.tipo === 'focus');
    const focusRows = focusItems.map(e => {
        const idx = equip.indexOf(e);
        const tipoLabel = FOCUS_LABELS_SHORT[e.categoria] || '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${tipoLabel}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Equipaggiamento
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddEquip('${pg.id}')" title="Aggiungi">&#9998;</button>
        </div>
        <div class="scheda-section-body">
        ${armiRows ? `<table class="scheda-equip-table">
            <thead><tr><th>Arma</th><th>Colpire</th><th>Danno</th><th></th></tr></thead>
            <tbody>${armiRows}</tbody>
        </table>` : ''}
        ${armaturaRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Armatura</th><th>CA</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${armaturaRows}</tbody>
        </table>` : ''}
        ${focusRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Focus</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${focusRows}</tbody>
        </table>` : ''}
        ${!armiRows && !armaturaRows && !focusRows ? '<span class="scheda-empty">Nessun equipaggiamento</span>' : ''}
        </div>
    </div>`;
}

// Bonus extra inseriti manualmente dall'utente (oggetti che non sono armatura/scudo,
// privilegi non auto-applicati, ecc.). Sempre normalizzato per evitare null-checks.
//
// Nuovo schema (lista di bonus singoli):
//   { ca: [{nome, valore}, ...],
//     incantatori: { "Mago": { atk: [...], dc: [...] }, ... },
//     spells_prepared_max: 0 }
//
// Schema legacy (numero singolo): viene migrato al volo a un'unica entry
// con nome "Manuale".
window.schedaOpenAddEquip = function(pgId) {
    const ARMA_CATS = {
        'semplice_mischia': 'Armi da Mischia Semplici',
        'semplice_distanza': 'Armi a Distanza Semplici',
        'guerra_mischia': 'Armi da Mischia da Guerra',
        'guerra_distanza': 'Armi a Distanza da Guerra'
    };

    // Sezione "Dal tuo Inventario": oggetti magici/homebrew dell'inventario
    // classificati come Arma/Armatura/Scudo. Cliccandoli si avvia un
    // flusso di equip (con scelta del tipo D&D di base se ambiguo).
    const invSplit = _schedaInvWeaponsArmors(_schedaPgCache);
    const _invRowHtml = (handler, view, index) => {
        const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
        const ench = view.magic_bonus || view._homebrew_incantamento || 0;
        const rar = view._homebrew_rarita || view.rarita || '';
        const rarClass = _invRarityClass(rar);
        const subText = [sub, rar].filter(Boolean).join(' · ') || 'Oggetto magico';
        return `<div class="pg-talento-item pg-talento-item-treasure ${rarClass}" onclick="${handler}('${pgId}',${index})">
            <span class="pg-talento-name">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${ench ? ' +' + ench : ''}</span>
            <span class="option-source">${escapeHtml(subText)}</span>
        </div>`;
    };
    const tesoroArmiHtml = invSplit.armi.length
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            invSplit.armi.map(({ index, view }) => _invRowHtml('schedaAddArmaFromInventory', view, index)).join('')
        }` : '';
    const tesoroArmatureHtml = (invSplit.armature.length || invSplit.scudi.length)
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            [...invSplit.scudi, ...invSplit.armature]
                .map(({ index, view }) => _invRowHtml('schedaAddArmaturaFromInventory', view, index)).join('')
        }` : '';

    const customArmaHtml = `
        <div class="scheda-picker-cat">Creazione rapida</div>
        <div class="pg-talento-item pg-talento-item-custom" onclick="schedaOpenCustomWeaponDialog('${pgId}')">
            <span class="pg-talento-name">Arma personalizzata…</span>
            <span class="option-source">Nome, danni e proprietà a scelta</span>
        </div>`;

    const armiHtml = tesoroArmiHtml + customArmaHtml + Object.entries(ARMA_CATS).map(([cat, label]) => {
        const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArma('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">${a.danni} ${a.tipo_danno}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const ARMATURA_LABELS = {
        'leggera': 'Armature Leggere',
        'media': 'Armature Medie',
        'pesante': 'Armature Pesanti',
        'scudo': 'Scudi'
    };
    const armatureHtml = tesoroArmatureHtml + ['leggera','media','pesante','scudo'].map(cat => {
        const label = ARMATURA_LABELS[cat];
        const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArmatura('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">CA ${a.ca_base}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const FOCUS_LABELS = {
        'arcano': 'Focus Arcano',
        'druidico': 'Focus Druidico',
        'sacro': 'Simbolo Sacro',
        'componenti': 'Borsa con Componenti',
    };
    const focusCatHtml = ['arcano','druidico','sacro','componenti'].map(cat => {
        const label = FOCUS_LABELS[cat];
        const items = DND_FOCUS.filter(f => f.cat === cat).map(f =>
            `<div class="pg-talento-item" onclick="schedaAddFocus('${pgId}','${escapeHtml(f.nome)}')">
                <span class="pg-talento-name">${escapeHtml(f.nome)}</span>
                <span class="option-source">${escapeHtml(label)}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');
    // "Altro" → input libero del nome, senza dover creare un oggetto homebrew.
    const altroHtml = `
        <div class="scheda-picker-cat">Altro</div>
        <div class="pg-talento-item" onclick="schedaAddFocusAltro('${pgId}')">
            <span class="pg-talento-name">Focus Personalizzato…</span>
            <span class="option-source">Inserisci il nome (es. amuleto, bracciale)</span>
        </div>`;
    const focusHtml = focusCatHtml + altroHtml;

    const modalHtml = `
    <div class="modal active" id="equipModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2>Aggiungi Equipaggiamento</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="armi" onclick="schedaPickerSwitchTab(this,'armi')">Armi</button>
                <button type="button" class="picker-tab" data-panel="armature" onclick="schedaPickerSwitchTab(this,'armature')">Armature</button>
                <button type="button" class="picker-tab" data-panel="focus" onclick="schedaPickerSwitchTab(this,'focus')">Focus</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="armi">${armiHtml}</div>
                <div class="picker-tab-panel" data-panel="armature">${armatureHtml}</div>
                <div class="picker-tab-panel" data-panel="focus">${focusHtml}</div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaAddFocus = async function(pgId, nome) {
    const focus = DND_FOCUS.find(f => f.nome === nome);
    if (!focus) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: focus.nome,
        tipo: 'focus',
        categoria: focus.cat,
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${focus.nome} aggiunto`);
}

// Aggiunge un focus personalizzato chiedendo all'utente il nome.
// Utile per oggetti non standard (amuleto, bracciale, ecc.) senza dover
// creare un homebrew completo.
window.schedaAddFocusAltro = async function(pgId) {
    const nome = await _schedaShowInputDialog({
        title: 'Focus personalizzato',
        placeholder: 'Es. Amuleto, Bracciale, Anello…',
    });
    if (!nome) return;
    const trimmed = nome.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: trimmed,
        tipo: 'focus',
        categoria: 'altro',
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${trimmed} aggiunto`);
}

// Helper condiviso per i picker della scheda con tab a 2 vie (Armi/Armature, Linguaggi/Strumenti, ...)
window.schedaPickerSwitchTab = function(btn, panelId) {
    // Funziona sia per .modal-content (modal standard) sia per .hp-calc-modal
    // (overlay tipo dialog dell'inventario/sintonia).
    const modal = btn.closest('.modal-content, .hp-calc-modal');
    if (!modal) return;
    modal.querySelectorAll('.picker-tab').forEach(b => b.classList.toggle('active', b === btn));
    modal.querySelectorAll('.picker-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === panelId));
};

window.schedaAddArma = async function(pgId, nome) {
    const arma = DND_ARMI.find(a => a.nome === nome);
    if (!arma) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    pg.equipaggiamento.push({
        nome: arma.nome, tipo: 'arma', danni: arma.danni, tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta, bonus_colpire: profBonus + atkMod, bonus_danno: dmgMod
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arma.nome} aggiunta`);
}

window.schedaAddArmatura = async function(pgId, nome) {
    const arm = DND_ARMATURE.find(a => a.nome === nome);
    if (!arm) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    if (arm.cat !== 'scudo') {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    pg.equipaggiamento.push({
        nome: arm.nome, tipo: arm.cat === 'scudo' ? 'scudo' : 'armatura',
        ca_base: arm.ca_base, categoria: arm.cat, mod_des: arm.mod_des, max_des: arm.max_des
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arm.nome} equipaggiata — CA: ${newCA}`);
}

// ──────────────────────────────────────────────────────────────────────
// Equipaggia direttamente un'arma/armatura/scudo presa dall'inventario
// (oggetto magico SRD o homebrew). Se l'oggetto specifica univocamente
// il tipo D&D di base (es. "spada lunga"), equipaggia subito; altrimenti
// apre un picker per scegliere il tipo specifico (es. "qualsiasi spada").
// Il bonus magico (+N) si propaga ad attacco/danni o alla CA.
// ──────────────────────────────────────────────────────────────────────
function _schedaInvWeaponsArmors(pg) {
    const result = { armi: [], armature: [], scudi: [] };
    if (!pg || !Array.isArray(pg.inventario)) return result;
    pg.inventario.forEach((entry, index) => {
        const view = (typeof window._invResolveLive === 'function')
            ? window._invResolveLive(entry) : entry;
        const tipo = view._homebrew_tipo || view.tipo || '';
        const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
        const nameLow = (view.nome || '').toLowerCase();
        if (tipo === 'Arma') {
            result.armi.push({ index, view });
        } else if (tipo === 'Scudo' || (tipo === 'Armatura' && sub.includes('scudo'))
                || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
            result.scudi.push({ index, view });
        } else if (tipo === 'Armatura') {
            result.armature.push({ index, view });
        }
    });
    return result;
}

// Trova candidati nel dataset DND per il sotto_tipo dato. Restituisce
// l'array di voci compatibili (potrebbe essere 0, 1 o N).
function _schedaMatchDndCandidates(dataset, subRaw, opts = {}) {
    if (!Array.isArray(dataset) || !dataset.length) return [];
    const sub = (subRaw || '').toLowerCase().trim();
    if (!sub) return [];
    // 1) match esatto sul nome
    const exact = dataset.filter(x => (x.nome || '').toLowerCase() === sub);
    if (exact.length) return exact;
    // 2) "qualsiasi X" o "X qualsiasi" -> match per parola chiave
    const cleaned = sub.replace(/\b(qualsiasi|qualunque|ogni|tutte le|tutti gli)\b/g, '').trim();
    // 3) per le armi: "spada", "ascia", "martello", ...
    if (cleaned) {
        const tokens = cleaned.split(/[\s,()\/]+/).filter(t => t && t.length >= 3);
        if (tokens.length) {
            const matches = dataset.filter(x => {
                const n = (x.nome || '').toLowerCase();
                return tokens.some(t => n.includes(t));
            });
            if (matches.length) return matches;
        }
    }
    // 4) per le armature: matcha per categoria (leggera/media/pesante)
    if (opts.armatura) {
        const cats = ['leggera','media','pesante'].filter(c => sub.includes(c));
        if (cats.length) {
            return dataset.filter(x => cats.includes(x.cat) && x.cat !== 'scudo');
        }
    }
    return [];
}

// Ricostruisce il "view" dell'oggetto inventario per index.
function _schedaInvViewAt(pg, index) {
    if (!pg || !Array.isArray(pg.inventario)) return null;
    const entry = pg.inventario[index];
    if (!entry) return null;
    return (typeof window._invResolveLive === 'function')
        ? window._invResolveLive(entry) : entry;
}

window.schedaAddArmaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
    const armi = (typeof DND_ARMI !== 'undefined') ? DND_ARMI : [];
    const candidates = _schedaMatchDndCandidates(armi, sub);
    if (candidates.length === 1) {
        return _schedaApplyInvArmaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvWeaponBase(pgId, invIndex, candidates.length ? candidates : armi, view, sub);
};

window.schedaAddArmaturaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const tipo = view._homebrew_tipo || view.tipo || '';
    const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
    const nameLow = (view.nome || '').toLowerCase();
    const armature = (typeof DND_ARMATURE !== 'undefined') ? DND_ARMATURE : [];
    // Caso scudo: equipaggio subito lo scudo standard.
    if (tipo === 'Scudo' || sub.includes('scudo') || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
        const scudo = armature.find(a => a.cat === 'scudo');
        if (!scudo) return;
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, scudo.nome);
    }
    const candidates = _schedaMatchDndCandidates(
        armature.filter(a => a.cat !== 'scudo'),
        sub,
        { armatura: true }
    );
    if (candidates.length === 1) {
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvArmorBase(pgId, invIndex, candidates.length ? candidates : armature.filter(a => a.cat !== 'scudo'), view, sub);
};

function _schedaPickInvWeaponBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['semplice_mischia','semplice_distanza','guerra_mischia','guerra_distanza'];
    const groupLabels = {
        semplice_mischia: 'Semplici da Mischia',
        semplice_distanza: 'Semplici a Distanza',
        guerra_mischia: 'Da Guerra (Mischia)',
        guerra_distanza: 'Da Guerra (Distanza)',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(`${o.danni} ${o.tipo_danno}`)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    const customRow = `<button type="button" class="generic-magic-type-row generic-magic-type-row-custom"
        onclick="schedaOpenCustomWeaponDialog('${pgId}', { invIndex: ${invIndex} })">
        <span class="generic-magic-type-name">Arma personalizzata…</span>
        <span class="generic-magic-type-sub">Nome, danni e proprietà custom</span>
    </button>`;
    const bodyWithCustom = `<div class="generic-magic-group-label">Personalizzata</div>${customRow}${body}`;
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Arma')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di arma di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${bodyWithCustom}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function _schedaPickInvArmorBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['leggera','media','pesante'];
    const groupLabels = {
        leggera: 'Armatura Leggera',
        media: 'Armatura Media',
        pesante: 'Armatura Pesante',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaturaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">CA ${o.ca_base} · ${escapeHtml(o.cat)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Armatura')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di armatura di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${body}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

// Costruisce il display name per un'entry equipaggiamento creata da un
// oggetto dell'inventario. Rimuove il "+N" finale (sara' riapplicato da
// formatEquipName via magic_bonus) e omette "(Tipo Base)" quando il
// nome dell'oggetto contiene gia' il nome della base D&D (evita
// duplicati tipo "Pugnale (Pugnale)" o "Pugnale +2 (Pugnale) +2").
function _schedaBuildEquipDisplayName(invName, baseName) {
    const stripped = (invName || '').replace(/\s*\+\d+\s*$/, '').trim();
    const lowName = stripped.toLowerCase();
    const lowBase = (baseName || '').toLowerCase().trim();
    if (!stripped) return baseName || 'Oggetto';
    if (!lowBase || lowName === lowBase || lowName.includes(lowBase)) {
        return stripped;
    }
    return `${stripped} (${baseName})`;
}

// Garantisce che l'entry inventario abbia un uid stabile per essere
// referenziata dall'equipaggiamento. Lo crea on-the-fly se mancante.
function _schedaEnsureInvUid(inventario, idx) {
    const it = inventario && inventario[idx];
    if (!it || typeof it !== 'object') return null;
    if (it._treasure_uid) return it._treasure_uid;
    const uid = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    it._treasure_uid = uid;
    return uid;
}

window._schedaApplyInvArmaEquip = async function(pgId, invIndex, dndArmaNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arma = DND_ARMI.find(a => a.nome === dndArmaNome);
    if (!arma) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arma.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: 'arma',
        danni: arma.danni,
        tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta,
        bonus_colpire: profBonus + atkMod + ench,
        bonus_danno: dmgMod + ench,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata`);
};

window._schedaApplyInvArmaturaEquip = async function(pgId, invIndex, dndArmNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arm = DND_ARMATURE.find(a => a.nome === dndArmNome);
    if (!arm) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const isShield = arm.cat === 'scudo';
    if (!isShield) {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arm.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: isShield ? 'scudo' : 'armatura',
        ca_base: arm.ca_base,
        categoria: arm.cat,
        mod_des: arm.mod_des,
        max_des: arm.max_des,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    const updates = { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata — CA: ${newCA}`);
};

window.schedaRemoveEquip = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento) return;
    const removed = pg.equipaggiamento[index];
    pg.equipaggiamento.splice(index, 1);
    const isArmor = removed?.tipo === 'armatura' || removed?.tipo === 'scudo';
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (isArmor) {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    showNotification('Oggetto rimosso');
}

window.schedaEditEquip = function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const currentBonus = e.magic_bonus || 0;
    const currentDesc = e.descrizione || '';

    // Se l'oggetto è collegato a una entry dell'inventario (via
    // from_treasure_uid o, in fallback, per nome) recuperiamo la
    // descrizione live dell'oggetto: così cliccando l'arma/armatura
    // nell'equipaggiamento si vede sempre la descrizione completa
    // dell'oggetto homebrew/SRD da cui è stata equipaggiata, senza
    // dover andare nell'inventario.
    let inventoryDesc = '';
    let inventoryName = '';
    if (Array.isArray(pg.inventario) && pg.inventario.length) {
        const stripBonus = (s) => String(s || '')
            .replace(/\s*\+\d+\s*$/, '')
            .replace(/\s*\([^)]+\)\s*$/, '')
            .trim()
            .toLowerCase();
        const equipBase = stripBonus(e.nome);
        let invItem = null;
        if (e.from_treasure_uid) {
            invItem = pg.inventario.find(it => it && typeof it === 'object' && it._treasure_uid === e.from_treasure_uid) || null;
        }
        if (!invItem && equipBase) {
            // Fallback per oggetti equipaggiati prima del meccanismo
            // from_treasure_uid: matching per nome (case-insensitive,
            // ignorando bonus magici e parentesi tipo "(pugnale)").
            invItem = pg.inventario.find(it => {
                if (!it || typeof it !== 'object') return false;
                const invName = stripBonus(it.nome);
                return invName && (invName === equipBase || equipBase.startsWith(invName) || invName.startsWith(equipBase));
            }) || null;
        }
        if (invItem) {
            const view = (typeof window._invResolveLive === 'function')
                ? window._invResolveLive(invItem) : invItem;
            inventoryDesc = view?.descrizione || view?.proprieta || '';
            inventoryName = view?.nome || '';
        }
    }
    const inventoryDescHtml = inventoryDesc
        ? `<div class="equip-inv-desc-section">
                <div class="equip-inv-desc-label">Descrizione${inventoryName ? ` — ${escapeHtml(inventoryName)}` : ''} (dall'inventario)</div>
                <div class="equip-inv-desc-body">${(typeof window.formatRichText === 'function' ? window.formatRichText(inventoryDesc) : escapeHtml(inventoryDesc))}</div>
            </div>`
        : '';

    const modalHtml = `
    <div class="modal active" id="editEquipModal">
        <div class="modal-content modal-content-xl">
            <button class="modal-close" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2 id="editEquipTitle">${formatEquipName(e)}</h2>
            ${e.proprieta ? `<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:12px;">${e.proprieta.join(', ')}</p>` : ''}
            <div class="equip-ench-row">
                <span class="equip-ench-label">Incantamento</span>
                <div class="custom-res-dice-row">
                    ${[0,1,2,3].map(b =>
                        `<button type="button" class="btn-secondary custom-res-dice-btn ${b === currentBonus ? 'active' : ''}" onclick="schedaSetMagicBonus('${pgId}',${index},${b})">${b === 0 ? 'No' : '+' + b}</button>`
                    ).join('')}
                </div>
            </div>
            ${inventoryDescHtml}
            <label class="equip-desc-label">${inventoryDesc ? 'Note personali' : 'Descrizione'}</label>
            <textarea id="editEquipDesc" class="equip-desc-textarea" placeholder="${inventoryDesc ? 'Note aggiuntive su questo oggetto…' : 'Aggiungi una descrizione, effetti magici, note...'}">${escapeHtml(currentDesc)}</textarea>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveEquipDesc('${pgId}',${index})">Salva</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaSaveEquipDesc = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const ta = document.getElementById('editEquipDesc');
    e.descrizione = ta?.value || '';
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    document.getElementById('editEquipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification('Descrizione aggiornata');
}

// ──────────────────────────────────────────────────────────────────────
// Arma personalizzata: l'utente sceglie nome, categoria (mischia/distanza),
// danni, tipo danno e proprietà a piacere. Usato sia in fase di
// "creazione rapida" dall'aggiunta equipaggiamento, sia per equipaggiare
// un oggetto homebrew dell'inventario senza essere vincolati ai tipi
// standard di D&D (es. lama-pistola, frusta a catena, ecc.).
// opts: { invIndex?: number }
// ──────────────────────────────────────────────────────────────────────
window.schedaOpenCustomWeaponDialog = function(pgId, opts) {
    opts = opts || {};
    const pg = _schedaPgCache;
    if (!pg) return;

    let prefilledName = '';
    let prefilledMagic = 0;
    let invIndex = (typeof opts.invIndex === 'number') ? opts.invIndex : null;
    if (invIndex != null) {
        const view = _schedaInvViewAt(pg, invIndex);
        if (view) {
            prefilledName = (_invDisplayName(view) || view.nome || '').replace(/\s*\+\d+\s*$/, '').trim();
            prefilledMagic = view.magic_bonus || view._homebrew_incantamento || 0;
        }
    }

    document.querySelectorAll('#schedaCustomWeaponOverlay').forEach(o => o.remove());

    const propsList = ['Accurata','Due Mani','Leggera','Pesante','Portata','Lancio','Munizioni','Ricarica','Versatile','Speciale'];
    const propsHtml = propsList.map(p => `
        <label class="custom-weapon-prop">
            <input type="checkbox" data-prop="${escapeHtml(p)}">
            <span>${escapeHtml(p)}</span>
        </label>`).join('');

    const dmgTypes = ['taglienti','perforanti','contundenti','fuoco','freddo','elettricità','acido','veleno','radiante','necrotico','psichico','tuono','forza'];
    const dmgTypeOpts = `<option value="">— nessuno —</option>` + dmgTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'schedaCustomWeaponOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="hp-calc-modal custom-weapon-modal">
            <button class="modal-close" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">&times;</button>
            <h3 class="custom-weapon-title">${invIndex != null ? 'Definisci arma personalizzata' : 'Crea arma personalizzata'}</h3>
            ${invIndex != null ? '<p class="custom-weapon-sub">Definisci come usare questo oggetto dell\'inventario</p>' : '<p class="custom-weapon-sub">Specifica nome, danni e proprietà</p>'}
            <div class="custom-weapon-form">
                <div class="custom-weapon-row">
                    <label>Nome</label>
                    <input type="text" id="cwName" maxlength="80" placeholder="Es. Lama-pistola, Frusta a catena…" value="${escapeHtml(prefilledName)}" />
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Categoria</label>
                        <select id="cwCategory">
                            <option value="mischia" selected>Mischia (Forza)</option>
                            <option value="distanza">Distanza (Destrezza)</option>
                        </select>
                    </div>
                    <div>
                        <label>Incantamento</label>
                        <select id="cwMagic">
                            <option value="0"${prefilledMagic === 0 ? ' selected' : ''}>Nessuno</option>
                            <option value="1"${prefilledMagic === 1 ? ' selected' : ''}>+1</option>
                            <option value="2"${prefilledMagic === 2 ? ' selected' : ''}>+2</option>
                            <option value="3"${prefilledMagic === 3 ? ' selected' : ''}>+3</option>
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Danni</label>
                        <input type="text" id="cwDamage" maxlength="20" placeholder="1d8" value="1d6" />
                    </div>
                    <div>
                        <label>Tipo danno</label>
                        <select id="cwDamageType">
                            ${dmgTypeOpts}
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row">
                    <label>Proprietà</label>
                    <div class="custom-weapon-props" id="cwProps">${propsHtml}</div>
                </div>
                <div class="custom-weapon-row">
                    <label>Altre proprietà <span class="custom-weapon-hint">(es. Gittata 9/27, Speciale)</span></label>
                    <input type="text" id="cwExtraProps" maxlength="120" placeholder="Separate da virgola" />
                </div>
            </div>
            <div class="dialog-actions custom-weapon-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveCustomWeapon('${pgId}', ${invIndex != null ? invIndex : 'null'})">Aggiungi</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
};

window.schedaSaveCustomWeapon = async function(pgId, invIndex) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const overlay = document.getElementById('schedaCustomWeaponOverlay');
    if (!overlay) return;

    const nome = (overlay.querySelector('#cwName')?.value || '').trim();
    if (!nome) {
        showNotification('Inserisci un nome per l\'arma');
        return;
    }
    const categoria = overlay.querySelector('#cwCategory')?.value || 'mischia';
    const danni = (overlay.querySelector('#cwDamage')?.value || '').trim() || '1d4';
    const tipoDanno = overlay.querySelector('#cwDamageType')?.value || '';
    const magic = parseInt(overlay.querySelector('#cwMagic')?.value) || 0;

    const checkedProps = Array.from(overlay.querySelectorAll('#cwProps input[type="checkbox"]:checked'))
        .map(el => el.dataset.prop);
    const extraRaw = (overlay.querySelector('#cwExtraProps')?.value || '').trim();
    const extraProps = extraRaw ? extraRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const proprieta = [...checkedProps, ...extraProps];

    const isRanged = categoria === 'distanza';
    const isFinesse = proprieta.some(p => p.toLowerCase().includes('accurata'));
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;

    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const entry = {
        nome,
        tipo: 'arma',
        danni,
        tipo_danno: tipoDanno,
        proprieta,
        bonus_colpire: profBonus + atkMod + magic,
        bonus_danno: dmgMod + magic,
        magic_bonus: magic,
        custom: true,
    };

    let updates = { equipaggiamento: pg.equipaggiamento };
    if (typeof invIndex === 'number' && invIndex >= 0) {
        const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
        if (treasureUid) {
            entry.from_treasure_uid = treasureUid;
            updates.inventario = pg.inventario;
        }
    }
    pg.equipaggiamento.push(entry);

    await schedaInstantSave(pgId, updates);

    overlay.remove();
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification(`${nome} aggiunta all'equipaggiamento`);
};

window.schedaSetMagicBonus = async function(pgId, index, bonus) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const oldBonus = e.magic_bonus || 0;
    if (oldBonus === bonus) return;
    e.magic_bonus = bonus;

    if (e.tipo === 'arma') {
        e.bonus_colpire = (e.bonus_colpire || 0) - oldBonus + bonus;
        e.bonus_danno = (e.bonus_danno || 0) - oldBonus + bonus;
    }

    const updates = { equipaggiamento: pg.equipaggiamento };
    if (e.tipo === 'armatura' || e.tipo === 'scudo') {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }

    await schedaInstantSave(pgId, updates);
    // Aggiorna lo stato visivo dei pulsanti senza chiudere il dialog,
    // cosi' l'utente puo' continuare a modificare la descrizione.
    const modal = document.getElementById('editEquipModal');
    if (modal) {
        modal.querySelectorAll('.custom-res-dice-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btns = modal.querySelectorAll('.custom-res-dice-btn');
        if (btns[bonus]) btns[bonus].classList.add('active');
        const titleEl = modal.querySelector('h2');
        if (titleEl) titleEl.innerHTML = formatEquipName(e);
    }
    showNotification(`${e.nome} ${bonus > 0 ? '+' + bonus : ''} aggiornato`);
}

// =====================================================
// LINGUAGGI E COMPETENZE
// =====================================================
function _parseToolEntry(t) {
    if (typeof t === 'object' && t !== null) return t;
    return { nome: t, maestria: false };
}

function _toolsByGroup(compStrum) {
    const parsed = (compStrum || []).map(_parseToolEntry);
    const grouped = {};
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = parsed.filter(t => groupDef.items.includes(t.nome));
        if (items.length > 0) grouped[groupName] = items;
    }
    return grouped;
}
