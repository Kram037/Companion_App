// ============================================================================
// CHARACTER SHEET MANUAL BONUSES
// ============================================================================

function _normalizeBonusList(v) {
    if (Array.isArray(v)) {
        return v
            .map(b => ({
                nome: String(b?.nome ?? '').trim().slice(0, 80) || 'Manuale',
                valore: parseInt(b?.valore) || 0,
            }))
            .filter(b => b.valore !== 0);
    }
    const n = parseInt(v) || 0;
    if (n) return [{ nome: 'Manuale', valore: n }];
    return [];
}

function _sumBonusList(arr) {
    return (arr || []).reduce((s, b) => s + (parseInt(b.valore) || 0), 0);
}

function _getBonusManuali(pg) {
    const bm = (pg && typeof pg.bonus_manuali === 'object' && pg.bonus_manuali) ? pg.bonus_manuali : {};
    const incRaw = (bm.incantatori && typeof bm.incantatori === 'object') ? bm.incantatori : {};
    const inc = {};
    for (const cn of Object.keys(incRaw)) {
        const e = incRaw[cn] || {};
        inc[cn] = {
            atk: _normalizeBonusList(e.atk),
            dc: _normalizeBonusList(e.dc),
        };
    }
    const tsRaw = (bm.tiri_salvezza && typeof bm.tiri_salvezza === 'object') ? bm.tiri_salvezza : {};
    const ts = {};
    for (const ab of Object.keys(tsRaw)) {
        ts[ab] = _normalizeBonusList(tsRaw[ab]);
    }
    return {
        ca: _normalizeBonusList(bm.ca),
        incantatori: inc,
        tiri_salvezza: ts,
        spells_prepared_max: parseInt(bm.spells_prepared_max) || 0,
    };
}

function _getCasterBonusFor(pg, classeNome) {
    const inc = _getBonusManuali(pg).incantatori;
    const e = inc[classeNome] || { atk: [], dc: [] };
    return { atk: _sumBonusList(e.atk), dc: _sumBonusList(e.dc) };
}

function _getSaveBonusFor(pg, abilityKey) {
    const ts = _getBonusManuali(pg).tiri_salvezza;
    return _sumBonusList(ts[abilityKey] || []) + _sumBonusList(ts._all || []);
}

// Confeziona l'oggetto da salvare a partire da una versione normalizzata di
// bonus_manuali, preservando spells_prepared_max e altre chiavi future.
function _buildBonusManualiPayload(parsed) {
    return {
        ca: parsed.ca || [],
        incantatori: parsed.incantatori || {},
        tiri_salvezza: parsed.tiri_salvezza || {},
        spells_prepared_max: parsed.spells_prepared_max || 0,
    };
}

function calcCAFromEquip(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    let ca;
    if (armor) {
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            ca = armor.ca_base + desBonus;
        } else {
            ca = armor.ca_base;
        }
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            ca = 10 + desMod + calcMod(pg.costituzione || 10);
        } else if (classNames.includes('Monaco')) {
            ca = 10 + desMod + calcMod(pg.saggezza || 10);
        } else {
            ca = 10 + desMod;
        }
    }
    if (armor?.magic_bonus) ca += armor.magic_bonus;
    if (shield) ca += shield.ca_base + (shield.magic_bonus || 0);
    ca += _sumBonusList(_getBonusManuali(pg).ca);
    return ca;
}

function _caModStr(val, statLabel) {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val} <span class="ca-stat-label">(${statLabel})</span>`;
}

function getCABreakdown(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    const lines = [];
    if (armor) {
        const magic = armor.magic_bonus ? ` +${armor.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        let desc = `${escapeHtml(armor.nome)}: ${armor.ca_base}`;
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            const maxNote = armor.max_des < 99 ? ` max ${armor.max_des}` : '';
            desc += ` ${_caModStr(desBonus, 'des' + maxNote)}`;
        }
        desc += magic;
        lines.push(desc);
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            const cosMod = calcMod(pg.costituzione || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(cosMod, 'cos')}`);
        } else if (classNames.includes('Monaco')) {
            const sagMod = calcMod(pg.saggezza || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(sagMod, 'sag')}`);
        } else {
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')}`);
        }
    }
    if (shield) {
        const shieldMagic = shield.magic_bonus ? ` +${shield.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        lines.push(`${escapeHtml(shield.nome)}: +${shield.ca_base}${shieldMagic}`);
    }
    const extras = _getBonusManuali(pg).ca;
    extras.forEach(b => {
        const sign = b.valore >= 0 ? '+' : '';
        lines.push(`${escapeHtml(b.nome)}: ${sign}${b.valore} <span class="ca-stat-label">(manuale)</span>`);
    });
    return lines;
}

// =====================================================
// BONUS MANUALI: CA e Statistiche Incantatore
// =====================================================
// =====================================================
// MODAL: lista editabile di bonus manuali (riusabile)
// =====================================================
// La dialog principale (CA / Save / Caster) mostra solo CHIP cliccabili.
// L'add/edit di un singolo bonus avviene in una dialog secondaria
// sovrapposta che modifica direttamente lo stato condiviso e fa re-render.
let _bonusListState = null;
let _bonusEditState = null;

// Sostituite dal nuovo flusso a chip; mantenute come stub vuoti per
// retro-compatibilita' con eventuali handler inline (no-op).
function _bonusListSyncFromInputs() {}
function _bonusGroupSyncFromInputs() {}

function _bonusChipHtml(b, onClickCall, opts = {}) {
    const v = parseInt(b.valore) || 0;
    const sign = v >= 0 ? '+' : '';
    const cls = ['bonus-chip'];
    if (v < 0) cls.push('negative');
    if (opts.global) cls.push('is-global');
    const tagHtml = opts.tag ? `<span class="bonus-chip-tag">${escapeHtml(opts.tag)}</span>` : '';
    const safeOnClick = onClickCall.replace(/"/g, '&quot;');
    return `<button type="button" class="${cls.join(' ')}" onclick="${safeOnClick}" title="Modifica bonus">
        <span class="bonus-chip-name">${escapeHtml(b.nome || 'Manuale')}</span>
        <span class="bonus-chip-val">${sign}${v}</span>
        ${tagHtml}
    </button>`;
}

function _bonusListRender() {
    if (!_bonusListState) return;
    const container = document.getElementById('bonusListContainer');
    if (!container) return;

    let html = '';
    let tot = 0;
    if (_bonusListState.kind === 'ca') {
        const items = _bonusListState.items;
        tot = _sumBonusList(items);
        html = items.length
            ? items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCA(${i})`)).join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    } else if (_bonusListState.kind === 'save') {
        const local = _bonusListState.items;
        const global = _bonusListState.globalItems;
        tot = _sumBonusList(local) + _sumBonusList(global);
        const localChips = local.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'single')`));
        const globalChips = global.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'all')`, { global: true, tag: 'A tutti i TS' }));
        const all = [...localChips, ...globalChips];
        html = all.length
            ? all.join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    }
    container.innerHTML = html;

    const totEl = document.getElementById('bonusListTotal');
    if (totEl) totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
}

window.schedaBonusListAdd = function() {
    if (!_bonusListState) return;
    if (_bonusListState.kind === 'ca') _bonusEditOpen({ parentKind: 'ca', isNew: true });
    else if (_bonusListState.kind === 'save') _bonusEditOpen({ parentKind: 'save', isNew: true, scope: 'single' });
};

window.schedaBonusEditCA = function(idx) {
    if (!_bonusListState?.items?.[idx]) return;
    _bonusEditOpen({ parentKind: 'ca', isNew: false, itemIdx: idx, item: { ..._bonusListState.items[idx] } });
};

window.schedaBonusEditSave = function(idx, scope) {
    if (!_bonusListState) return;
    const arr = scope === 'all' ? _bonusListState.globalItems : _bonusListState.items;
    if (!arr?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'save',
        isNew: false,
        itemIdx: idx,
        scope,
        originalScope: scope,
        item: { ...arr[idx] },
    });
};

window.schedaBonusEditCaster = function(gi, idx) {
    if (!_bonusListState?.groups?.[gi]?.items?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'caster',
        isNew: false,
        groupIdx: gi,
        itemIdx: idx,
        item: { ..._bonusListState.groups[gi].items[idx] },
    });
};

// =====================================================
// MODAL secondaria: editor di un singolo bonus
// =====================================================
function _bonusEditOpen(state) {
    _bonusEditState = {
        item: { nome: '', valore: 1 },
        ...state,
    };
    if (!_bonusEditState.item.nome && !_bonusEditState.item.valore) {
        _bonusEditState.item = { nome: '', valore: 1 };
    }
    _bonusEditRender();
}

function _bonusEditRender() {
    const existing = document.getElementById('bonusEditOverlay');
    if (existing) existing.remove();
    if (!_bonusEditState) return;

    const e = _bonusEditState;
    const title = e.isNew ? 'Aggiungi bonus' : 'Modifica bonus';

    let scopeHtml = '';
    if (e.parentKind === 'save') {
        const abilityLabel = _ABILITY_LABELS[_bonusListState?.abilityKey] || _bonusListState?.abilityKey || '';
        const scope = e.scope || 'single';
        scopeHtml = `
        <div class="bonus-edit-field">
            <label>Applica a</label>
            <div class="bonus-edit-scope">
                <label class="bonus-edit-scope-opt ${scope==='single'?'selected':''}">
                    <input type="radio" name="bonusScope" value="single" ${scope==='single'?'checked':''} onchange="schedaBonusEditorSetScope('single')">
                    <span>Solo TS ${escapeHtml(abilityLabel)}</span>
                </label>
                <label class="bonus-edit-scope-opt ${scope==='all'?'selected':''}">
                    <input type="radio" name="bonusScope" value="all" ${scope==='all'?'checked':''} onchange="schedaBonusEditorSetScope('all')">
                    <span>Tutti i TS</span>
                </label>
            </div>
        </div>`;
    }

    const deleteBtn = e.isNew ? '' : '<button class="hp-calc-btn dmg" onclick="schedaBonusEditorDelete()">Elimina</button>';
    const v = parseInt(e.item.valore) || 0;
    const placeholderName = e.parentKind === 'caster' ? 'Es. Bastone del Potere'
        : e.parentKind === 'save' ? 'Es. Mantello della Protezione'
        : 'Es. Anello di Protezione';

    const overlay = document.createElement('div');
    overlay.id = 'bonusEditOverlay';
    overlay.className = 'hp-calc-overlay bonus-edit-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-edit-modal">
            <button class="hp-calc-close" onclick="schedaBonusEditorClose()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-edit-field">
                <label>Nome</label>
                <input type="text" id="bonusEditName" value="${escapeHtml(e.item.nome)}" placeholder="${placeholderName}" maxlength="80">
            </div>
            <div class="bonus-edit-field">
                <label>Valore</label>
                <div class="bonus-edit-val-row">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(-1)">−</button>
                    <input type="number" id="bonusEditValue" value="${v}" step="1">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(1)">+</button>
                </div>
            </div>
            ${scopeHtml}
            <div class="hp-calc-buttons bonus-edit-buttons">
                ${deleteBtn}
                <button class="hp-calc-btn heal" onclick="schedaBonusEditorSave()">Salva</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('bonusEditName')?.focus(), 50);
}

window.schedaBonusEditorSetScope = function(scope) {
    if (!_bonusEditState) return;
    _bonusEditState.scope = scope;
    // Aggiorna le classi visive senza ricostruire l'intera modal.
    document.querySelectorAll('#bonusEditOverlay .bonus-edit-scope-opt').forEach(el => {
        const inp = el.querySelector('input');
        el.classList.toggle('selected', inp?.value === scope);
    });
};

window.schedaBonusEditorStep = function(delta) {
    const inp = document.getElementById('bonusEditValue');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = cur + delta;
};

window.schedaBonusEditorClose = function() {
    const o = document.getElementById('bonusEditOverlay');
    if (o) o.remove();
    _bonusEditState = null;
};

window.schedaBonusEditorSave = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const nameEl = document.getElementById('bonusEditName');
    const valEl = document.getElementById('bonusEditValue');
    const nome = (nameEl?.value || '').trim().slice(0, 80) || 'Manuale';
    const valore = parseInt(valEl?.value) || 0;

    if (valore === 0) {
        showNotification('Inserisci un valore diverso da 0');
        return;
    }

    const e = _bonusEditState;
    const newItem = { nome, valore };

    if (e.parentKind === 'ca') {
        if (e.isNew) _bonusListState.items.push(newItem);
        else _bonusListState.items[e.itemIdx] = newItem;
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const newScope = e.scope || 'single';
        const newArrName = newScope === 'all' ? 'globalItems' : 'items';
        if (e.isNew) {
            _bonusListState[newArrName].push(newItem);
        } else {
            const origScope = e.originalScope || newScope;
            const origArrName = origScope === 'all' ? 'globalItems' : 'items';
            if (origArrName === newArrName) {
                _bonusListState[newArrName][e.itemIdx] = newItem;
            } else {
                _bonusListState[origArrName].splice(e.itemIdx, 1);
                _bonusListState[newArrName].push(newItem);
            }
        }
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (!g) return;
        if (e.isNew) g.items.push(newItem);
        else g.items[e.itemIdx] = newItem;
        _bonusGroupRender(e.groupIdx);
    }

    schedaBonusEditorClose();
};

window.schedaBonusEditorDelete = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const e = _bonusEditState;
    if (e.isNew) { schedaBonusEditorClose(); return; }

    if (e.parentKind === 'ca') {
        _bonusListState.items.splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const origArrName = (e.originalScope || e.scope) === 'all' ? 'globalItems' : 'items';
        _bonusListState[origArrName].splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (g) g.items.splice(e.itemIdx, 1);
        _bonusGroupRender(e.groupIdx);
    }
    schedaBonusEditorClose();
};

// =====================================================
// MODAL CA
// =====================================================
window.schedaOpenCABonus = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const lines = getCABreakdown(pg);
    const breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    const totalCA = pg.classe_armatura || 10;

    _bonusListState = { kind: 'ca', pgId, items: bm.ca.map(b => ({ ...b })) };

    // Pulsante Armatura Magica: visibile solo se conosciuto/preparato e
    // il PG NON indossa armatura (la cui presenza la disattiverebbe).
    const armorEquipped = (pg.equipaggiamento || []).some(e => e.tipo === 'armatura');
    const knowsMageArmor = _pgKnowsSpellByName(pg, 'Armatura Magica', 'Mage Armor');
    const alreadyApplied = _bonusListState.items.some(b => /armatura\s*magica/i.test(b.nome || ''));
    const desMod = Math.floor(((pg.destrezza || 10) - 10) / 2);
    let mageArmorBtn = '';
    if (knowsMageArmor && !armorEquipped && !alreadyApplied) {
        mageArmorBtn = `<button type="button" class="bonus-quick-btn small" onclick="schedaApplyMageArmor()" title="Aggiunge un bonus +3 (Armatura Magica = 13 + Des)">
            ✦ Applica Armatura Magica (CA ${13 + desMod})
        </button>`;
    } else if (knowsMageArmor && armorEquipped) {
        mageArmorBtn = `<div class="bonus-modal-hint" style="color:#d29c2a;">Armatura Magica disponibile ma stai indossando un'armatura: rimuovila per applicarla.</div>`;
    }

    const existing = document.getElementById('caBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'caBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseCABonus()">&times;</button>
            <div class="hp-calc-title">Classe Armatura</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current">${totalCA}</span></div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                ${mageArmorBtn}
                <div class="bonus-modal-hint">Inserisci ogni bonus separatamente: Anello di Protezione +1, Mantello del Mago Battagliero +1, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaCABonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseCABonus = function() {
    const o = document.getElementById('caBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaApplyMageArmor = function() {
    if (!_bonusListState || _bonusListState.kind !== 'ca') return;
    _bonusListSyncFromInputs();
    // Armatura Magica: CA = 13 + Des (sostituisce il 10 base senza armatura).
    // Equivalente a un bonus piatto di +3 alla CA base.
    _bonusListState.items.push({ nome: 'Armatura Magica', valore: 3 });
    _bonusListRender();
    showNotification('Armatura Magica applicata (+3)');
};

window.schedaCABonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    _bonusListSyncFromInputs();

    const cleaned = (_bonusListState?.items || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: cleaned,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;

    const caEl = document.getElementById('schedaCA');
    if (caEl) caEl.textContent = newCA;

    schedaCloseCABonus();
    await schedaInstantSave(pgId, { bonus_manuali: next, classe_armatura: newCA });
    showNotification(`CA aggiornata: ${newCA}`);
};

// =====================================================
// MODAL Bonus Tiri Salvezza
// =====================================================
const _ABILITY_LABELS = {
    forza: 'Forza',
    destrezza: 'Destrezza',
    costituzione: 'Costituzione',
    intelligenza: 'Intelligenza',
    saggezza: 'Saggezza',
    carisma: 'Carisma',
};

window.schedaOpenSaveBonus = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const items = (bm.tiri_salvezza[abilityKey] || []).map(b => ({ ...b }));
    const globalItems = (bm.tiri_salvezza._all || []).map(b => ({ ...b }));

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const mod = Math.floor((val - 10) / 2);
    const isProf = (pg.tiri_salvezza || []).includes(abilityKey);
    const profPart = isProf ? ` + comp +${bonusComp}` : '';
    const baseTot = mod + (isProf ? bonusComp : 0);
    const baseStr = baseTot >= 0 ? `+${baseTot}` : `${baseTot}`;

    _bonusListState = { kind: 'save', pgId, abilityKey, items, globalItems };

    const labelAb = _ABILITY_LABELS[abilityKey] || abilityKey;
    const headerInfo = `Base: mod ${mod >= 0 ? '+' : ''}${mod}${profPart} = <b>${baseStr}</b>`;

    const existing = document.getElementById('saveBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'saveBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSaveBonus()">&times;</button>
            <div class="hp-calc-title">Bonus TS – ${escapeHtml(labelAb)}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                <div class="bonus-modal-hint">Es. <i>Mantello della Protezione</i> +1, <i>Privilegio di classe</i> +2, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSaveBonusConfirm('${pgId}','${abilityKey}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseSaveBonus = function() {
    const o = document.getElementById('saveBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaSaveBonusConfirm = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;

    const cleanList = arr => (arr || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const cleanedLocal = cleanList(_bonusListState?.items);
    const cleanedGlobal = cleanList(_bonusListState?.globalItems);

    const bm = _getBonusManuali(pg);
    const ts = { ...(bm.tiri_salvezza || {}) };
    if (cleanedLocal.length) ts[abilityKey] = cleanedLocal;
    else delete ts[abilityKey];
    if (cleanedGlobal.length) ts._all = cleanedGlobal;
    else delete ts._all;

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: ts,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSaveBonus();

    // Aggiorna inline tutti i 6 TS (perche' i bonus globali influenzano tutti).
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    SCHEDA_ABILITIES.forEach(a => {
        const v = pg[a.key] || 10;
        const m = Math.floor((v - 10) / 2);
        const isP = (pg.tiri_salvezza || []).includes(a.key);
        const extra = _getSaveBonusFor(pg, a.key);
        const sm = m + (isP ? bonusComp : 0) + extra;
        const ss = sm >= 0 ? `+${sm}` : `${sm}`;
        const mark = extra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const el = document.getElementById(`sSave_${a.key}`);
        if (el) el.innerHTML = `${ss}${mark}`;
    });

    await schedaInstantSave(pgId, { bonus_manuali: next });
    showNotification(`TS ${labelOrKey(abilityKey)} aggiornato`);
};

function labelOrKey(k) {
    return _ABILITY_LABELS[k] || k;
}

// =====================================================
// MODAL Bonus Incantatore (Atk e DC separate)
// =====================================================
function _pgKnowsSpellByName(pg, nameIt, nameEn) {
    const list = pg?.incantesimi_conosciuti || [];
    if (!list.length) return false;
    const norm = s => String(s || '').toLowerCase();
    const targets = [norm(nameIt), norm(nameEn)].filter(Boolean);
    return list.some(n => {
        const sp = _resolveSpell(n);
        if (!sp) return targets.includes(norm(n));
        return targets.includes(norm(sp.name)) || targets.includes(norm(sp.name_en));
    });
}

function _openSpellBonusGeneric(pgId, classiArg, kind) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let classi = [];
    try { classi = JSON.parse(decodeURIComponent(classiArg)); } catch (_) { classi = []; }
    if (!Array.isArray(classi) || classi.length === 0) return;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const ability = CLASS_SPELL_ABILITY[classi[0]];
    const abilVal = pg[ability] || 10;
    const mod = Math.floor((abilVal - 10) / 2);

    const bm = _getBonusManuali(pg);
    // _bonusListState multiplo: una entry per ciascuna classe del gruppo.
    _bonusListState = {
        kind: 'caster',
        pgId,
        casterKind: kind,
        classi: [...classi],
        groups: classi.map(cn => ({
            classe: cn,
            items: ((bm.incantatori[cn] || {})[kind] || []).map(b => ({ ...b })),
        })),
    };

    const title = kind === 'atk' ? 'Bonus tiro per colpire' : 'Bonus CD incantesimi';
    const baseInfo = kind === 'atk'
        ? `Base: mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${(mod + bonusComp) >= 0 ? '+' : ''}${mod + bonusComp}</b>`
        : `Base: 8 + mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${8 + mod + bonusComp}</b>`;
    const headerInfo = `${escapeHtml(classi.join(' / '))} · Caratteristica: <b>${ability}</b><br>${baseInfo}`;

    const groupsHtml = _bonusListState.groups.map((g, gi) => `
        <div class="bonus-list-group" data-gidx="${gi}">
            <div class="bonus-list-group-head">
                <span class="bonus-list-group-name">${escapeHtml(g.classe)}</span>
                <span class="bonus-list-total-label">Tot: <span id="bonusListGroupTotal_${gi}">+0</span></span>
            </div>
            <div id="bonusListGroupContainer_${gi}" class="bonus-list-container"></div>
            <button type="button" class="bonus-list-add-btn" onclick="schedaBonusGroupAdd(${gi})">+ Aggiungi bonus</button>
        </div>
    `).join('');

    const existing = document.getElementById('spellBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'spellBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSpellCasterBonus()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            ${groupsHtml}
            <div class="bonus-modal-hint">Inserisci ogni bonus separatamente con il suo nome (es. <i>Bastone del Potere</i> +2, <i>Stella della Notte</i> +1).</div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSpellCasterBonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusGroupRenderAll();
}

window.schedaOpenSpellAtkBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'atk');
};

window.schedaOpenSpellDcBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'dc');
};

function _bonusGroupRender(gi) {
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;
    const g = _bonusListState.groups[gi];
    if (!g) return;
    const c = document.getElementById(`bonusListGroupContainer_${gi}`);
    if (!c) return;
    c.innerHTML = g.items.length
        ? g.items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCaster(${gi},${i})`)).join('')
        : '<div class="bonus-list-empty">Nessun bonus.</div>';
    const totEl = document.getElementById(`bonusListGroupTotal_${gi}`);
    if (totEl) {
        const tot = _sumBonusList(g.items);
        totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
    }
}

function _bonusGroupRenderAll() {
    if (!_bonusListState?.groups) return;
    _bonusListState.groups.forEach((_, gi) => _bonusGroupRender(gi));
}

window.schedaBonusGroupAdd = function(gi) {
    if (!_bonusListState?.groups?.[gi]) return;
    _bonusEditOpen({ parentKind: 'caster', isNew: true, groupIdx: gi });
};

window.schedaCloseSpellCasterBonus = function() {
    const o = document.getElementById('spellBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaTogglePrepared = async function(pgId, spellName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_pgUsesPreparedSystem(pg)) return;
    const sp = _resolveSpell(spellName);
    if (!sp || sp.level === 0) return;

    let list = Array.isArray(pg.incantesimi_preparati) ? [...pg.incantesimi_preparati] : [];
    const idx = list.indexOf(spellName);
    const willPrepare = idx === -1;

    if (willPrepare) {
        // Controlla il limite massimo prima di aggiungere.
        const autoMax = _calcMaxPreparedAuto(pg);
        const overrideMax = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
        const maxPrep = overrideMax > 0 ? overrideMax : autoMax;
        const currentCount = list
            .map(n => _resolveSpell(n))
            .filter(s => s && s.level > 0).length;
        if (maxPrep > 0 && currentCount >= maxPrep) {
            showNotification(`Limite raggiunto: ${currentCount}/${maxPrep} preparati`);
            return;
        }
        list.push(spellName);
    } else {
        list.splice(idx, 1);
    }

    pg.incantesimi_preparati = list;
    await schedaInstantSave(pgId, { incantesimi_preparati: list });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
};

window.schedaOpenPreparedMax = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const override = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
    const auto = _calcMaxPreparedAuto(pg);
    // Pre-compila con override se presente, altrimenti con il calcolo automatico
    // (cosi' al primo accesso l'utente vede subito il valore standard).
    const initial = override > 0 ? override : auto;

    const existing = document.getElementById('preparedMaxOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'preparedMaxOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal">
            <button class="hp-calc-close" onclick="schedaClosePreparedMax()">&times;</button>
            <div class="hp-calc-title">Incantesimi preparati</div>
            <div class="bonus-modal-info">
                Numero massimo di incantesimi che il personaggio può preparare.<br>
                <b>Calcolo automatico</b>: <span style="color:var(--accent,#6c5ce7);font-weight:700;">${auto}</span>
                ${override > 0 ? ` · <b>Manuale attuale</b>: <span style="color:var(--warning,#d29c2a);font-weight:700;">${override}</span>` : ''}
            </div>
            <div class="bonus-modal-row">
                <label class="bonus-modal-label">Massimo preparati</label>
                <div class="bonus-modal-input-row">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(-1)">−</button>
                    <input type="number" id="preparedMaxInput" class="bonus-modal-input" value="${initial}" step="1" min="0">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(1)">+</button>
                </div>
                <div class="bonus-modal-hint">Regola standard: modificatore caratteristica + livello di classe (Paladino: livello/2). Imposta 0 per tornare al calcolo automatico.</div>
            </div>
            <div class="hp-calc-buttons">
                ${override > 0 ? `<button class="btn-secondary" onclick="schedaPreparedMaxReset('${pgId}')">Ripristina auto</button>` : ''}
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaPreparedMaxConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { document.getElementById('preparedMaxInput')?.focus(); }, 50);
};

window.schedaPreparedMaxReset = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: 0,
    });
    pg.bonus_manuali = next;
    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Ripristinato calcolo automatico');
};

window.schedaClosePreparedMax = function() {
    const o = document.getElementById('preparedMaxOverlay');
    if (o) o.remove();
};

window.schedaPreparedMaxStep = function(delta) {
    const inp = document.getElementById('preparedMaxInput');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = Math.max(0, cur + delta);
};

window.schedaPreparedMaxConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const inp = document.getElementById('preparedMaxInput');
    const val = Math.max(0, parseInt(inp?.value) || 0);
    const auto = _calcMaxPreparedAuto(pg);

    const bm = _getBonusManuali(pg);
    // Se il valore inserito coincide con quello automatico, salviamo 0 per tornare
    // alla modalita' "auto" (cosi' resta agganciato al livello/caratteristica).
    const stored = (val === auto) ? 0 : val;
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: stored,
    });
    pg.bonus_manuali = next;

    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification(stored ? `Massimo preparati: ${val} (manuale)` : `Massimo preparati: ${auto} (automatico)`);
};

window.schedaSpellCasterBonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;

    _bonusGroupSyncFromInputs();

    const bm = _getBonusManuali(pg);
    const inc = {};
    // Copia tutti i dati esistenti per non perdere l'altro kind (atk vs dc).
    for (const cn of Object.keys(bm.incantatori || {})) {
        inc[cn] = {
            atk: (bm.incantatori[cn].atk || []).map(b => ({ ...b })),
            dc: (bm.incantatori[cn].dc || []).map(b => ({ ...b })),
        };
    }
    // Sovrascrive solo il kind editato per ogni classe del gruppo.
    const kind = _bonusListState.casterKind;
    _bonusListState.groups.forEach(g => {
        const cleaned = (g.items || [])
            .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
            .filter(b => b.valore !== 0);
        inc[g.classe] = inc[g.classe] || { atk: [], dc: [] };
        inc[g.classe][kind] = cleaned;
        if (!inc[g.classe].atk?.length && !inc[g.classe].dc?.length) delete inc[g.classe];
    });

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: inc,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSpellCasterBonus();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Bonus salvato');
};
