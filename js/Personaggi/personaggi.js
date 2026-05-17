// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

// [BUILD-MARKER] Se vedi questa riga in console, hai la versione nuova del file.
appDebug('[homebrew][build] personaggi.js BUILD 2026-04-23-F integrazione sottoclassi homebrew nella scheda');

/* ──────────────────────────────────────────────────────────────────────
   Privilegi Tab
   Schema dati pg.privilegi:
   {
     hidden_auto: ['<class_slug>:<feature_name_en>', ...],   // privilegi auto-popolati nascosti
     custom_features: { '<TabName>': [{name, level, description}] },
     custom_tabs_order: ['Razza','Background', ...]          // ordine + presenza tabelle custom
   }
   ────────────────────────────────────────────────────────────────────── */

// Tabelle custom presenti di default nella pagina Privilegi.
// Nota: "Talenti" non e' qui perche' viene gestito come sezione speciale legata a pg.talenti.
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

function buildLangProfSection(pg) {
    const linguaggi = pg.linguaggi || [];
    const compStrum = pg.competenze_strumenti || [];
    const langHtml = linguaggi.length > 0 ?
        linguaggi.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';

    const grouped = _toolsByGroup(compStrum);
    let toolSectionsHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolSectionsHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolSectionsHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }

    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Linguaggi e Competenze
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenLangProfEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-section-body">
            <div class="scheda-res-imm-display" id="schedaLangProfDisplay">
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Linguaggi</span><div class="scheda-tags" id="schedaLangDisplay">${langHtml}</div></div>
                ${toolSectionsHtml}
            </div>
        </div>
    </div>`;
}

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

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
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
        elements.personaggioModalTitle.textContent = 'Modifica Personaggio';
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
                    document.getElementById('pgIniziativa').value = data.iniziativa != null ? data.iniziativa : calcMod(data.destrezza || 10);
                    document.getElementById('pgCA').value = data.classe_armatura || 10;
                    document.getElementById('pgVelocita').value = data.velocita || 9;
                    updateAllAbilityMods();
                }
            });
        }
    } else {
        elements.personaggioModalTitle.textContent = 'Nuovo Personaggio';
        elements.savePersonaggioBtn.textContent = 'Crea';
        document.getElementById('pgCA').value = '';
        document.getElementById('pgIniziativa').value = '';
        const pvField = document.getElementById('pgPV');
        if (pvField) { pvField.value = 10; pvField.dataset.autoHp = 'true'; }
        updateAllAbilityMods();
        updateBonusCompetenza();
    }

    elements.personaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePersonaggioModal() {
    if (elements.personaggioModal) {
        elements.personaggioModal.classList.remove('active');
        document.body.style.overflow = '';
        editingPersonaggioId = null;
    }
}

let pgSaving = false;
async function handleSavePersonaggio(e) {
    e.preventDefault();
    if (pgSaving) return;
    pgSaving = true;
    const saveBtn = document.getElementById('savePersonaggioBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }
    const supabase = getSupabaseClient();
    if (!supabase) { pgSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; } return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) {
        showNotification('Errore: utente non trovato');
        return;
    }

    const destrezza = parseInt(document.getElementById('pgDestrezza').value) || 10;
    const desMod = calcMod(destrezza);
    const iniziativaVal = document.getElementById('pgIniziativa').value;
    const iniziativa = iniziativaVal !== '' ? parseInt(iniziativaVal) : desMod;
    const caVal = document.getElementById('pgCA').value;
    let caDefault = 10 + desMod;
    const classNames = pgSelectedClasses.map(c => c.nome);
    if (classNames.includes('Barbaro')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgCostituzione').value) || 10);
    else if (classNames.includes('Monaco')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgSaggezza').value) || 10);
    const classeArmatura = caVal !== '' ? parseInt(caVal) : caDefault;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const classeDisplay = pgSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');
    const totalLevel = pgGetTotalLevel();

    let pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
        sottorazza: document.getElementById('pgSottorazza').value || null,
        background: document.getElementById('pgBackground').value || null,
        classe: classeDisplay || null,
        classi: pgSelectedClasses,
        livello: totalLevel,
        forza: clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30),
        destrezza: clamp(destrezza, 1, 30),
        costituzione: clamp(parseInt(document.getElementById('pgCostituzione').value) || 10, 1, 30),
        intelligenza: clamp(parseInt(document.getElementById('pgIntelligenza').value) || 10, 1, 30),
        saggezza: clamp(parseInt(document.getElementById('pgSaggezza').value) || 10, 1, 30),
        carisma: clamp(parseInt(document.getElementById('pgCarisma').value) || 10, 1, 30),
        tiri_salvezza: pgGetSelectedSaves(),
        competenze_abilita: Array.from(pgCurrentSkillProficiencies),
        maestrie_abilita: Array.from(pgCurrentSkillExpertise),
        talenti: pgCurrentTalenti,
        resistenze: pgCurrentResistenze,
        immunita: pgCurrentImmunita,
        equipaggiamento: pgSelectedEquipment.map(e => {
            if (e.tipo === 'arma') {
                const forza = clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30);
                const modFor = calcMod(forza);
                const modDes = desMod;
                const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
                const isRanged = e.proprieta?.some(p => p.includes('Munizioni')) || e.proprieta?.some(p => p.includes('Lancio'));
                const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
                const profBonus = calcBonusCompetenza(totalLevel);
                return { ...e, bonus_colpire: profBonus + atkMod, bonus_danno: atkMod };
            }
            return e;
        }),
        slot_incantesimo: pgBuildSlotIncantesimo(),
        punti_vita_max: parseInt(document.getElementById('pgPV').value) || 10,
        pv_attuali: parseInt(document.getElementById('pgPV').value) || 10,
        iniziativa: iniziativa,
        classe_armatura: classeArmatura,
        percezione_passiva: pgCalcPercPassiva(),
        velocita: parseFloat(document.getElementById('pgVelocita').value) || 9,
        updated_at: new Date().toISOString()
    };

    if (!pgData.nome) {
        showNotification('Inserisci un nome per il personaggio');
        return;
    }

    // Auto-popola dati derivati da razza/background SOLO IN CREAZIONE: in
    // modifica non li tocchiamo per non sovrascrivere quanto l'utente ha
    // gia' personalizzato in scheda (lingue aggiunte, strumenti, oggetti,
    // monete spese). Cosi' i background del dataset locale spingono
    // direttamente al PG strumenti, linguaggi specifici, oggetti iniziali e
    // oro di partenza.
    if (!editingPersonaggioId) {
        const _razzaVal = document.getElementById('pgRazza').value || '';
        const _sottoVal = document.getElementById('pgSottorazza').value || '';
        pgData.linguaggi = autoPopulateLinguaggi(_razzaVal, _sottoVal);

        const _bgVal = document.getElementById('pgBackground').value || '';
        const _bgData = _bgVal ? getBackgroundData(_bgVal) : null;
        if (_bgData) {
            const _bgTools = (_bgData.competenze_strumenti || [])
                .map(t => ({ nome: t, maestria: false }));
            if (_bgTools.length > 0) pgData.competenze_strumenti = _bgTools;
            if (_bgData.linguaggi_specifici && _bgData.linguaggi_specifici.length > 0) {
                pgData.linguaggi = Array.from(new Set([
                    ...(pgData.linguaggi || []),
                    ..._bgData.linguaggi_specifici,
                ]));
            }
            if (_bgData.equipaggiamento_iniziale && _bgData.equipaggiamento_iniziale.length > 0) {
                pgData.inventario = _bgData.equipaggiamento_iniziale.map(name => ({
                    nome: name,
                    descrizione: 'Equipaggiamento iniziale del background',
                    quantita: 1,
                    magico: false,
                }));
            }
            if (_bgData.oro_iniziale) {
                pgData.monete = { mr: 0, ma: 0, me: 0, mo: _bgData.oro_iniziale, mp: 0 };
            }
        }
    }

    // Helper: alcune colonne (es. 'sottorazza') potrebbero non esistere
    // ancora a DB se l'utente non ha eseguito sql/add-sottorazza.sql.
    // Riproviamo senza la colonna problematica per non bloccare il salvataggio.
    const _stripMissingColumns = (data, errMsg) => {
        const m = (errMsg || '').match(/'?([a-z_]+)'? column/i)
              || (errMsg || '').match(/find ['"]?([a-z_]+)['"]? column/i)
              || (errMsg || '').match(/column ['"]?([a-z_]+)['"]?/i);
        if (!m) return null;
        const col = m[1];
        if (!(col in data)) return null;
        const cleaned = { ...data };
        delete cleaned[col];
        console.warn(`[pg save] Colonna '${col}' mancante a DB: salvo senza. Esegui sql/add-${col.replace(/_/g, '-')}.sql per abilitarla.`);
        return cleaned;
    };

    try {
        if (editingPersonaggioId) {
            let { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            // Retry escludendo colonne mancanti a DB
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').update(pgData).eq('id', editingPersonaggioId));
            }
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            let { error } = await supabase
                .from('personaggi')
                .insert(pgData);
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').insert(pgData));
            }
            if (error) throw error;
            showNotification('Personaggio creato');
        }

        const wasEditing = editingPersonaggioId;
        closePersonaggioModal();
        if (wasEditing && AppState.currentPage === 'scheda') {
            await renderSchedaPersonaggio(wasEditing);
        } else {
            await loadPersonaggi();
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: wasEditing ? 'update' : 'insert' });
    } catch (error) {
        console.error('Errore salvataggio personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    } finally {
        pgSaving = false;
        const btn = document.getElementById('savePersonaggioBtn');
        if (btn) { btn.disabled = false; btn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; }
    }
}

window.deletePersonaggio = async function(personaggioId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questo personaggio? Verrà rimosso anche da tutte le campagne associate.');
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi')
            .delete()
            .eq('id', personaggioId);
        if (error) throw error;

        showNotification('Personaggio eliminato');
        if (AppState.currentPage === 'scheda') {
            navigateToPage('personaggi');
        }
        await loadPersonaggi();
        await sendAppEventBroadcast({ table: 'personaggi', action: 'delete' });
    } catch (error) {
        console.error('Errore eliminazione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ─────────────────────────────────────────────────────────────────────
// Cambio sottoclasse dalla card (lista personaggi)
// Permette di cambiare la sottoclasse di un personaggio gia' creato.
// I privilegi auto-derivati e le risorse di sottoclasse vengono ricalcolati
// automaticamente al successivo render (sono derivati da CLASSES_DATA +
// SUBCLASS_RESOURCES in base a sottoclasseSlug/sottoclasse_homebrew_id).
// ─────────────────────────────────────────────────────────────────────
window.pgChangeSubclassFromCard = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let pg;
    try {
        const { data, error } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
        if (error) throw error;
        pg = data;
    } catch (e) {
        console.error('Errore caricamento personaggio:', e);
        showNotification('Errore nel caricamento del personaggio');
        return;
    }
    if (!pg) return;

    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }

    let classi = Array.isArray(pg.classi) && pg.classi.length > 0
        ? pg.classi
        : (pg.classe ? [{ nome: pg.classe, livello: pg.livello || 1 }] : []);

    if (!classi.length) {
        showNotification('Nessuna classe trovata per questo personaggio');
        return;
    }

    const eligible = classi.map((c, i) => {
        const opts = pgGetSubclassOptions(c.nome);
        const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
        return { c, i, opts, hbOpts, hasOpts: opts.length > 0 || hbOpts.length > 0 };
    }).filter(x => x.hasOpts);

    if (!eligible.length) {
        showNotification('Nessuna sottoclasse disponibile per le classi di questo personaggio');
        return;
    }

    if (eligible.length === 1) {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, eligible[0].i);
        return;
    }

    const items = eligible.map(({ c, i }) => ({
        value: String(i),
        label: `${c.nome} (Liv. ${c.livello || 1})${c.sottoclasse ? ' — ' + c.sottoclasse : ''}`
    }));
    openCustomSelect(items, (value) => {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, parseInt(value));
    }, 'Per quale classe?');
};

async function _pgOpenSubclassPickerForSavedPg(pgId, pg, classIdx) {
    if (!Array.isArray(pg.classi) || !pg.classi[classIdx]) return;
    const c = pg.classi[classIdx];
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello || 1);
    const allOpts = [...opts, ...hbOpts];

    openCustomSelect(items, async (value) => {
        const newClassi = pg.classi.map(x => ({ ...x }));
        const target = newClassi[classIdx];
        if (value === '__none__') {
            delete target.sottoclasse;
            delete target.sottoclasseSlug;
            delete target.sottoclasse_homebrew_id;
            delete target.sottoclasse_homebrew_author;
            target.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (!sel) return;
            target.sottoclasse = sel.name;
            target.sottoclasseSlug = sel.slug;
            if (sel.isHomebrew) {
                target.sottoclasse_homebrew_id = sel._hbId;
                if (sel._hbAuthor) target.sottoclasse_homebrew_author = sel._hbAuthor;
                target.thirdCaster = false;
            } else {
                delete target.sottoclasse_homebrew_id;
                delete target.sottoclasse_homebrew_author;
                target.thirdCaster = (typeof isThirdCasterSubclass === 'function')
                    ? isThirdCasterSubclass(sel.slug, sel.name) : false;
            }
        }

        // Pulisce dai privilegi salvati le voci "hidden_auto" legate alla
        // vecchia sottoclasse di questa stessa classe (prefisso
        // "<classSlug>:<oldSubSlug>:"), per non lasciare fantasmi che, in
        // teoria, potrebbero collidere se l'utente tornasse alla stessa
        // sottoclasse in futuro. Le custom_features (tabelle utente) restano
        // intatte.
        const oldSubSlug = c.sottoclasseSlug || '';
        let privilegi = pg.privilegi && typeof pg.privilegi === 'object' ? { ...pg.privilegi } : null;
        if (privilegi && Array.isArray(privilegi.hidden_auto) && oldSubSlug) {
            privilegi.hidden_auto = privilegi.hidden_auto.filter(k => {
                if (typeof k !== 'string') return true;
                return !k.includes(`:${oldSubSlug}:`);
            });
        }

        const updates = { classi: newClassi, updated_at: new Date().toISOString() };
        if (privilegi) updates.privilegi = privilegi;

        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const { error } = await supabase.from('personaggi').update(updates).eq('id', pgId);
            if (error) throw error;
            showNotification(target.sottoclasse
                ? `Sottoclasse di ${c.nome} aggiornata: ${target.sottoclasse}`
                : `Sottoclasse di ${c.nome} rimossa`);
            await loadPersonaggi();
            // Se la scheda di questo PG e' aperta, ricarica.
            if (AppState.currentPersonaggioId === pgId && AppState.currentPage === 'scheda') {
                if (typeof renderSchedaPersonaggio === 'function') {
                    await renderSchedaPersonaggio(pgId);
                }
            }
            try { await sendAppEventBroadcast({ table: 'personaggi', action: 'update', id: pgId }); } catch (_) {}
        } catch (e) {
            console.error('Errore aggiornamento sottoclasse:', e);
            showNotification('Errore nel salvataggio della sottoclasse');
        }
    }, `Sottoclasse di ${c.nome}`);
}

// --- Scegli personaggio per campagna ---

window.openScegliPersonaggioModal = async function(campagnaId) {
    if (!elements.scegliPersonaggioModal || !elements.scegliPersonaggioList) return;

    elements.scegliPersonaggioList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
    elements.scegliPersonaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) throw new Error('Utente non trovato');

        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const { data: assoc } = await supabase
            .from('personaggi_campagna')
            .select('personaggio_id')
            .eq('campagna_id', campagnaId)
            .eq('user_id', userData.id)
            .maybeSingle();

        const currentPgId = assoc?.personaggio_id || null;

        if (!personaggi || personaggi.length === 0) {
            elements.scegliPersonaggioList.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai personaggi. Creane uno prima!</p>
                    <button class="btn-primary btn-small" onclick="closeScegliPersonaggioModal(); navigateToPage('personaggi');">Vai a Personaggi</button>
                </div>`;
            return;
        }

        elements.scegliPersonaggioList.innerHTML = personaggi.map(pg => {
            const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
            const isSelected = pg.id === currentPgId;
            return `
            <div class="scegli-pg-item ${isSelected ? 'selected' : ''}" onclick="selectPersonaggioCampagna('${campagnaId}', '${pg.id}', '${userData.id}')">
                <div class="scegli-pg-item-avatar">${escapeHtml(initials)}</div>
                <div class="scegli-pg-item-info">
                    <div class="scegli-pg-item-name">${escapeHtml(pg.nome)}${isSelected ? ' (attuale)' : ''}</div>
                    <div class="scegli-pg-item-detail">${escapeHtml(pg.razza || '')} ${escapeHtml(pg.classe || '')} - Lv ${pg.livello || 1}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Errore caricamento personaggi per selezione:', error);
        elements.scegliPersonaggioList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento</p></div>';
    }
}

function closeScegliPersonaggioModal() {
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.selectPersonaggioCampagna = async function(campagnaId, personaggioId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi_campagna')
            .upsert({
                campagna_id: campagnaId,
                user_id: userId,
                personaggio_id: personaggioId,
                created_at: new Date().toISOString()
            }, { onConflict: 'campagna_id,user_id' });

        if (error) throw error;

        showNotification('Personaggio selezionato!');
        closeScegliPersonaggioModal();
        await sendAppEventBroadcast({ table: 'personaggi_campagna', action: 'upsert', campagnaId });

        if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId === campagnaId) {
            await loadCampagnaDetails(campagnaId);
        }
    } catch (error) {
        console.error('Errore selezione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ============================================================================
// TIPO SCHEDA MODAL
// ============================================================================

window.openTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
};

// ============================================================================
// MICRO SCHEDA CREATION
// ============================================================================

let _microEditingId = null;
let _microSelectedClasses = [];

function microRenderClassi() {
    const container = document.getElementById('microClassiList');
    if (!container) return;
    const chipsHtml = _microSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'microOpenSubclassDropdown');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="microRemoveClass(${i})">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="microOpenClasseSelect()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
    microUpdateTotalLevel();
}

window.microOpenSubclassDropdown = async function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    // Refresh cache homebrew sempre prima del picker (la dedup interna evita
    // doppie query). Cache vuota non significa "già provato": potrebbe essere
    // un'inizializzazione precedente fatta senza utente loggato.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            delete c.sottoclasse;
            delete c.sottoclasseSlug;
            delete c.sottoclasse_homebrew_id;
            delete c.sottoclasse_homebrew_author;
            c.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (sel) {
                c.sottoclasse = sel.name;
                c.sottoclasseSlug = sel.slug;
                if (sel.isHomebrew) {
                    c.sottoclasse_homebrew_id = sel._hbId;
                    if (sel._hbAuthor) c.sottoclasse_homebrew_author = sel._hbAuthor;
                    c.thirdCaster = false;
                } else {
                    delete c.sottoclasse_homebrew_id;
                    delete c.sottoclasse_homebrew_author;
                    c.thirdCaster = isThirdCasterSubclass(sel.slug, sel.name);
                }
            }
        }
        microRenderClassi();
    }, `Sottoclasse di ${c.nome}`);
};

window.microClearSubclass = function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
    microRenderClassi();
};

function microUpdateTotalLevel() {
    const total = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const field = document.getElementById('microLivello');
    if (field) field.value = total;
}

window.microOpenClasseSelect = function() {
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    const classOptions = available.map(c => ({ value: c, label: c }));
    openCustomSelect(classOptions, (value) => {
        _microSelectedClasses.push({ nome: value, livello: 1, thirdCaster: false });
        microRenderClassi();
    }, 'Seleziona Classe');
};

window.microRemoveClass = function(i) {
    _microSelectedClasses.splice(i, 1);
    microRenderClassi();
};

window.microClassLevelChange = function(i, delta) {
    const c = _microSelectedClasses[i];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    microRenderClassi();
};

window.openMicroSchedaModal = function(personaggioId) {
    _microEditingId = personaggioId || null;
    const form = document.getElementById('microSchedaForm');
    if (form) form.reset();
    _microSelectedClasses = [];

    const title = document.getElementById('microSchedaModalTitle');
    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (_microEditingId) {
        if (title) title.textContent = 'Modifica Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Salva';
        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data }) => {
                if (data) {
                    document.getElementById('microNome').value = data.nome || '';
                    document.getElementById('microPVMax').value = data.punti_vita_max || 10;
                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        _microSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        _microSelectedClasses = [{ nome: data.classe, livello: data.livello || 1, thirdCaster: false }];
                    }
                    microRenderClassi();
                }
            });
        }
    } else {
        if (title) title.textContent = 'Nuova Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Crea';
    }
    microRenderClassi();

    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeMicroSchedaModal = function() {
    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    _microEditingId = null;
};

async function handleSaveMicroScheda(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nome = document.getElementById('microNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }
    if (_microSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }

    const pvMax = parseInt(document.getElementById('microPVMax')?.value) || 10;
    const totalLevel = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const classeDisplay = _microSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) { showNotification('Errore: utente non trovato'); return; }

    const autoSlots = calcSpellSlotsFromClassi(_microSelectedClasses);
    const slotIncantesimo = {};
    Object.keys(autoSlots).forEach(lv => {
        slotIncantesimo[lv] = { max: autoSlots[lv], current: autoSlots[lv], used: 0 };
    });

    const pgData = {
        nome,
        classe: classeDisplay,
        classi: _microSelectedClasses,
        livello: totalLevel,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        slot_incantesimo: slotIncantesimo,
        tipo_scheda: 'micro',
        updated_at: new Date().toISOString()
    };

    try {
        if (_microEditingId) {
            const { error } = await supabase.from('personaggi').update(pgData).eq('id', _microEditingId);
            if (error) throw error;
            showNotification('Micro Scheda aggiornata');
        } else {
            pgData.user_id = userData.id;
            pgData.forza = 10; pgData.destrezza = 10; pgData.costituzione = 10;
            pgData.intelligenza = 10; pgData.saggezza = 10; pgData.carisma = 10;
            pgData.classe_armatura = 10; pgData.iniziativa = 0; pgData.velocita = 9;
            pgData.percezione_passiva = 10;
            const { error } = await supabase.from('personaggi').insert(pgData);
            if (error) throw error;
            showNotification('Micro Scheda creata');
        }
        closeMicroSchedaModal();
        loadPersonaggi();
    } catch (err) {
        console.error('Errore salvataggio micro scheda:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _microEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// MICRO SCHEDA RENDERING
// ============================================================================

async function renderMicroScheda(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore</p>'; return; }

    const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
    if (error || !pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }
    _schedaPgCache = pg;

    let classeDisplay = pg.classe || '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
    }

    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const pvTemp = pg.pv_temporanei || 0;
    const initDisplay = pg.iniziativa != null ? pg.iniziativa : 0;
    const initStr = initDisplay >= 0 ? `+${initDisplay}` : `${initDisplay}`;

    const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
    const dadiDisp = pg.dadi_vita_disponibili || {};
    let hitDiceHtml = '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        hitDiceHtml = `<div class="scheda-hd-table">
            ${pg.classi.map(c => {
                const die = CLASS_HD[c.nome] || 8;
                const total = c.livello || 1;
                const key = c.nome;
                const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',-1,${total})">−</button>
                        <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',1,${total})">+</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Micro scheda: class resources
    const microClassRes = pg.risorse_classe || {};
    const microResItems = [];
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        pg.classi.forEach(c => {
            const resList = CLASS_RESOURCES[c.nome];
            if (!resList) return;
            resList.forEach((res, rIdx) => {
                if (c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = rIdx === 0 ? `${c.nome}_res` : `${c.nome}_res_${rIdx}`;
                const current = Math.min(maxVal, microClassRes[key] != null ? microClassRes[key] : maxVal);
                microResItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
        });
    }
    _pgRaceResources(pg).forEach(rr => {
        const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                <span class="scheda-hd-max">/ ${rr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
            </div>
        </div>`);
    });
    const microCustomRes = microClassRes._custom || [];
    microCustomRes.forEach((cr, i) => {
        const current = cr.current != null ? cr.current : cr.max;
        const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                <span class="scheda-hd-max">/ ${cr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
            </div>
        </div>`);
    });
    const microClassResHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Risorse di Classe
            <button class="scheda-edit-btn" onclick="schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
        </div>
        ${microResItems.length > 0 ? `<div class="scheda-hd-table">${microResItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
    </div>`;

    const isConcentrating = !!pg.concentrazione;
    const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
    const conditionsHtml = conditionsActive.length > 0 ?
        conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';

    const resistenze = pg.resistenze || [];
    const immunita = pg.immunita || [];
    const microResHtml = resistenze.length > 0 ?
        resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const microImmHtml = immunita.length > 0 ?
        immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const resImmHtml = `<div class="scheda-section">
        <div class="scheda-section-title">
            Resistenze e Immunità
            <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-res-imm-display" id="schedaResImmDisplay">
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${microResHtml}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${microImmHtml}</div></div>
        </div>
        <div id="schedaResImmEditGrid" style="display:none;"></div>
    </div>`;

    const slots = pg.slot_incantesimo || {};
    let slotsHtml = '';
    const sortedLevels = Object.keys(slots).map(Number).filter(l => l > 0 && slots[l]?.max > 0).sort((a, b) => a - b);
    const slotRows = sortedLevels.map(lv => {
        const s = slots[lv];
        const currentAvail = s.current != null ? s.current : (s.max - (s.used || 0));
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < currentAvail ? 'filled' : ''}" data-lvl="${lv}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lv}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count">${currentAvail}/${s.max}</span>
        </div>`;
    }).join('');
    slotsHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo <button class="scheda-edit-btn" onclick="microOpenSlotConfig('${pg.id}')" title="Configura">&#9998;</button></div>
        ${slotRows ? `<div class="scheda-slots-table">${slotRows}</div>` : '<span class="scheda-empty">Nessuno slot configurato</span>'}
    </div>`;

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = 'none';

    // La micro-scheda non ha la struttura con il divisore "Statistiche": nascondi il bottone spada.
    const scrollBtn = document.getElementById('btnScrollStats');
    if (scrollBtn) scrollBtn.style.display = 'none';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>

    <div class="scheda-three-boxes">
        <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
            <div class="scheda-box-val" id="schedaInit">${initStr}</div>
            <div class="scheda-box-label">Iniziativa</div>
        </div>
    </div>

    <div class="scheda-hp-section">
        <div class="scheda-hp-left">
            <div class="scheda-hp-pair">
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','punti_vita_max',${pg.punti_vita_max},-1)">
                    <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                    <div class="scheda-hp-label">PV Massimi</div>
                </div>
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max})">
                    <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                    <div class="scheda-hp-label">PV Attuali</div>
                </div>
            </div>
        </div>
        <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pvTemp},-1)">
            <div class="scheda-hp-display" id="schedaPvTemp">${pvTemp}</div>
            <div class="scheda-hp-label">PV Temp</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title">Dadi Vita</div>
        ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
    </div>

    ${microClassResHtml}

    <div class="scheda-section">
        <div class="scheda-section-title">Condizioni</div>
        <div class="scheda-concentrazione-row">
            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
        </div>
        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
        <div class="scheda-condition-extra">
            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
        </div>
        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
    </div>

    ${resImmHtml}

    ${slotsHtml}
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            microSlotToggle(pg.id, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    // Se richiesto, centra la vista sul blocco PV/PV temp/Iniziativa.
    if (window._schedaPendingScrollToStats) {
        window._schedaPendingScrollToStats = false;
        setTimeout(() => {
            const target = content.querySelector('.scheda-hp-section')
                        || content.querySelector('.scheda-three-boxes');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }
}

window.microSlotToggle = async function(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg?.slot_incantesimo?.[level]) return;
    const slot = pg.slot_incantesimo[level];
    const currentAvail = slot.current != null ? slot.current : (slot.max - (slot.used || 0));
    slot.current = index < currentAvail ? index : index + 1;
    slot.used = slot.max - slot.current;
    await schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
    renderMicroScheda(pgId);
}

window.microHdChange = async function(pgId, key, delta, max) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('dadi_vita_disponibili').eq('id', pgId).single();
    const dadiDisp = pg?.dadi_vita_disponibili || {};
    const current = dadiDisp[key] != null ? dadiDisp[key] : max;
    const newVal = Math.max(0, Math.min(max, current + delta));
    dadiDisp[key] = newVal;
    await supabase.from('personaggi').update({ dadi_vita_disponibili: dadiDisp, updated_at: new Date().toISOString() }).eq('id', pgId);
    renderMicroScheda(pgId);
};

window.microToggleCondition = async function(pgId, key, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ [key]: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
};

window.microSlotChange = async function(pgId, level, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const slots = pg.slot_incantesimo || {};
    if (!slots[level]) slots[level] = { max, current: max, used: 0 };
    const avail = slots[level].current != null ? slots[level].current : (max - (slots[level].used || 0));
    const newAvail = Math.max(0, Math.min(max, avail - delta));
    slots[level].current = newAvail;
    slots[level].used = max - newAvail;
    await schedaInstantSave(pgId, { slot_incantesimo: slots });
    renderMicroScheda(pgId);
};

window.microOpenSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    let rows = '';
    for (let lv = 1; lv <= 9; lv++) {
        const maxVal = slots[lv]?.max || 0;
        rows += `<div class="micro-slot-config-row">
            <span>${lv}° Livello</span>
            <input type="number" min="0" max="20" value="${maxVal}" id="microSlotMax_${lv}" class="form-control" style="width:60px;text-align:center;" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
        </div>`;
    }

    const modalHtml = `
    <div class="modal active" id="microSlotConfigModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeMicroSlotConfig()">&times;</button>
            <h2>Configura Slot Incantesimo</h2>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">Imposta il numero massimo di slot per livello</p>
            <div class="micro-slot-config-grid">${rows}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeMicroSlotConfig()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveMicroSlotConfig('${pgId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
};

window.closeMicroSlotConfig = function() {
    const m = document.getElementById('microSlotConfigModal');
    if (m) m.remove();
    document.body.style.overflow = '';
};

window.saveMicroSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    for (let lv = 1; lv <= 9; lv++) {
        const input = document.getElementById(`microSlotMax_${lv}`);
        const maxVal = parseInt(input?.value) || 0;
        if (maxVal > 0) {
            if (!slots[lv]) slots[lv] = { max: maxVal, used: 0 };
            else slots[lv].max = maxVal;
        } else {
            delete slots[lv];
        }
    }

    await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', pgId);
    closeMicroSlotConfig();
    renderMicroScheda(pgId);
    showNotification('Slot incantesimo aggiornati');
};
