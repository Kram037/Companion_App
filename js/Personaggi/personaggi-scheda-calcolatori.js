// ============================================================================
// CHARACTER SHEET CALCULATORS
// ============================================================================

let _hpCalcState = null;

window.schedaOpenHpCalcLive = function(pgId, field) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let currentVal, maxVal;
    if (field === 'pv_attuali') {
        currentVal = pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10);
        maxVal = pg.punti_vita_max || 10;
    } else if (field === 'pv_temporanei') {
        currentVal = pg.pv_temporanei || 0;
        maxVal = -1;
    } else if (field === 'punti_vita_max') {
        currentVal = pg.punti_vita_max || 10;
        maxVal = -1;
    }
    schedaOpenHpCalc(pgId, field, currentVal, maxVal);
}

window.schedaOpenHpCalc = function(pgId, field, currentVal, maxVal) {
    _hpCalcState = { pgId, field, currentVal, maxVal, inputBuffer: '0' };
    const labels = { pv_attuali: 'Punti Vita Attuali', pv_temporanei: 'Punti Vita Temporanei', punti_vita_max: 'Punti Vita Massimi' };
    const label = labels[field] || 'Punti Vita';
    const maxDisplay = (maxVal > 0 && field !== 'punti_vita_max') ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';

    const isDirectEdit = field === 'punti_vita_max';

    let pvMedioHint = '';
    let actionButtons;
    if (isDirectEdit) {
        const pgRef = _schedaPgCache;
        const medio = (typeof _calcPVMedio === 'function') ? _calcPVMedio(pgRef) : 0;
        const reale = (typeof _getPvMaxReale === 'function') ? _getPvMaxReale(pgRef) : 0;
        const hintParts = [];
        if (medio > 0) {
            hintParts.push(`<div class="hp-calc-hint-cell"><span class="hp-calc-hint-lbl">PV medio</span><strong class="hp-calc-medio">${medio}</strong></div>`);
        }
        if (reale > 0) {
            hintParts.push(`<div class="hp-calc-hint-cell"><span class="hp-calc-hint-lbl">Max reale</span><strong class="hp-calc-reale">${reale}</strong></div>`);
        }
        if (hintParts.length > 0) {
            pvMedioHint = `<div class="hp-calc-hint hp-calc-hint-grid">${hintParts.join('')}</div>`;
        }
        actionButtons = `<div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaHpSetDirect()">Conferma</button>
            </div>
            <div class="hp-calc-buttons hp-calc-buttons-extra">
                <button class="hp-calc-btn neutral hp-calc-btn-full" onclick="schedaHpSetMaxReale()" title="Imposta il valore digitato come nuovo Max Reale">Imposta come Max Reale</button>
            </div>`;
    } else {
        actionButtons = `<div class="hp-calc-buttons">
            <button class="hp-calc-btn damage" onclick="schedaHpApply(-1)">− Danno</button>
            <button class="hp-calc-btn heal" onclick="schedaHpApply(1)">+ Cura</button>
           </div>`;
    }

    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
            ${pvMedioHint}
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            ${actionButtons}
        </div>
    `;
    document.body.appendChild(overlay);
}

window.hpCalcNumpad = function(key) {
    if (!_hpCalcState) return;
    if (key === 'C') {
        _hpCalcState.inputBuffer = '0';
    } else if (key === '⌫') {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.length > 1 ? _hpCalcState.inputBuffer.slice(0, -1) : '0';
    } else {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer === '0' ? key : _hpCalcState.inputBuffer + key;
    }
    const display = document.getElementById('hpCalcAmountDisplay');
    if (display) display.textContent = _hpCalcState.inputBuffer;
}

// Imposta il valore digitato come nuovo "Max Reale" del PG.
// Salva sia bonus_manuali._pv_max_reale sia pg.punti_vita_max,
// chiedendo prima conferma all'utente.
window.schedaHpSetMaxReale = async function() {
    if (!_hpCalcState) return;
    if (_hpCalcState.field !== 'punti_vita_max') return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const buf = parseInt(_hpCalcState.inputBuffer) || 0;
    if (buf <= 0) {
        showNotification('Digita un valore valido nel tastierino prima di impostare il Max Reale');
        return;
    }
    const oldReale = (typeof _getPvMaxReale === 'function') ? _getPvMaxReale(pg) : (parseInt(pg.punti_vita_max) || 0);
    const ok = await _schedaShowConfirmDialog({
        title: 'Aggiornare il Max Reale?',
        message: `Il Max Reale passera' da ${oldReale} a ${buf} PV. Anche il valore di PV massimi corrente verra' impostato a ${buf}.`,
        confirmLabel: 'Conferma',
    });
    if (!ok) return;

    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    bm._pv_max_reale = buf;
    pg.bonus_manuali = bm;
    pg.punti_vita_max = buf;

    _hpCalcState.currentVal = buf;
    _hpCalcState.inputBuffer = '0';
    const cur = document.getElementById('hpCalcCurrent');
    if (cur) cur.textContent = buf;
    const amt = document.getElementById('hpCalcAmountDisplay');
    if (amt) amt.textContent = '0';
    const realeEl = document.querySelector('#hpCalcOverlay .hp-calc-reale');
    if (realeEl) realeEl.textContent = buf;
    const pgDisplay = document.getElementById('schedaPvMax');
    if (pgDisplay) pgDisplay.textContent = buf;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({
            punti_vita_max: buf,
            bonus_manuali: pg.bonus_manuali,
            updated_at: new Date().toISOString(),
        }).eq('id', _hpCalcState.pgId);
    }
    showNotification('Max Reale aggiornato');
};

window.schedaHpSetDirect = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    _hpCalcState.inputBuffer = '0';
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

window.schedaHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = parseInt(_hpCalcState.inputBuffer) || 0;
    if (amount === 0) return;

    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

let _hpCalcClosedAt = 0;

window.schedaCloseHpCalc = async function() {
    const overlay = document.getElementById('hpCalcOverlay');
    if (overlay) overlay.remove();
    const wasMonster = _hpCalcState?.isMonster;
    const monsterId = _hpCalcState?.pgId;
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
        // Se il calcolatore HP era stato aperto dalla full-sheet del mostro
        // in combattimento, ricarichiamo quella modale per riflettere i PV
        // aggiornati senza chiuderla.
        const fullModal = document.getElementById('combatMonsterFullModal');
        if (fullModal && fullModal.classList.contains('active') && monsterId && typeof combatOpenMonsterFullSheet === 'function') {
            combatOpenMonsterFullSheet(monsterId, campagnaId, sessioneId);
        }
        // Stessa cosa per la dialog placeholder: re-render per aggiornare
        // i numeri delle box PV / CA al volo.
        const phModal = document.getElementById('combatPlaceholderModal');
        if (phModal && phModal.classList.contains('active') && monsterId && typeof combatOpenPlaceholderDialog === 'function') {
            combatOpenPlaceholderDialog(monsterId, campagnaId, sessioneId);
        }
    }
}

window.schedaOpenStatCalc = function(pgId, field) {
    const currentVal = _schedaPgCache?.[field] ?? 0;
    _hpCalcState = { pgId, field, currentVal, maxVal: -1, inputBuffer: '0' };
    const labels = { classe_armatura: 'Classe Armatura', iniziativa: 'Iniziativa' };
    const label = labels[field] || field;

    let breakdownHtml = '';
    if (field === 'classe_armatura' && _schedaPgCache) {
        const lines = getCABreakdown(_schedaPgCache);
        breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    }

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaOpenAbilityCalc = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentVal = pg[abilityKey] || 10;
    const abilityInfo = SCHEDA_ABILITIES.find(a => a.key === abilityKey);
    const label = abilityInfo ? abilityInfo.full : abilityKey;
    _hpCalcState = { pgId, field: abilityKey, currentVal, maxVal: -1, inputBuffer: String(currentVal), isAbility: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${escapeHtml(label)}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">${currentVal}</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaStatConfirm = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    const field = _hpCalcState.field;
    const pgId = _hpCalcState.pgId;
    const pg = _schedaPgCache;
    const oldVal = _hpCalcState.currentVal;

    if (pg) pg[field] = newVal;

    if (_hpCalcState.isAbility) {
        const clampedVal = Math.max(1, Math.min(30, newVal));
        if (pg) pg[field] = clampedVal;
        const abilEl = document.getElementById(`sAbil_${field}`);
        if (abilEl) abilEl.textContent = clampedVal;

        const updates = { [field]: clampedVal };

        // Propaga la variazione del modificatore di Destrezza al
        // valore di iniziativa salvato (che e' un totale: dex_mod +
        // factotum + bonus manuali). In questo modo cambiando la
        // caratteristica si aggiorna automaticamente l'iniziativa
        // mostrata e usata nei tiri.
        if (field === 'destrezza' && pg) {
            const oldDesMod = Math.floor(((parseInt(oldVal) || 10) - 10) / 2);
            const newDesMod = Math.floor((clampedVal - 10) / 2);
            const modDelta = newDesMod - oldDesMod;
            if (modDelta !== 0) {
                const baseInit = pg.iniziativa != null
                    ? pg.iniziativa
                    : oldDesMod + _getFactotumBonus(pg);
                pg.iniziativa = baseInit + modDelta;
                updates.iniziativa = pg.iniziativa;
            }
        }

        // Propaga la variazione del modificatore di Costituzione ai PV
        // massimi (e ai PV attuali) usando il livello totale del PG.
        // Esempio: passare da COS 14 a 16 a livello 5 aggiunge +5 PV max.
        if (field === 'costituzione' && pg) {
            const oldCosMod = Math.floor(((parseInt(oldVal) || 10) - 10) / 2);
            const newCosMod = Math.floor((clampedVal - 10) / 2);
            const cosDelta = newCosMod - oldCosMod;
            if (cosDelta !== 0) {
                const totalLevel = (pg.classi || []).reduce((s, c) => s + (parseInt(c.livello) || 0), 0)
                    || pg.livello || 1;
                const pvDelta = cosDelta * totalLevel;
                const oldPvMax = parseInt(pg.punti_vita_max) || 10;
                const newPvMax = Math.max(1, oldPvMax + pvDelta);
                pg.punti_vita_max = newPvMax;
                updates.punti_vita_max = newPvMax;

                const oldPvAttuali = pg.pv_attuali != null ? parseInt(pg.pv_attuali) : oldPvMax;
                const newPvAttuali = Math.max(0, Math.min(newPvMax, oldPvAttuali + pvDelta));
                if (newPvAttuali !== oldPvAttuali) {
                    pg.pv_attuali = newPvAttuali;
                    updates.pv_attuali = newPvAttuali;
                }

                // Anche il "Max Reale" (se gia' impostato esplicitamente)
                // deve seguire il delta di COS, perche' rappresenta i PV
                // massimi effettivi del PG comprensivi del bonus COS.
                const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
                const storedReale = parseInt(bm._pv_max_reale);
                if (Number.isFinite(storedReale) && storedReale > 0) {
                    bm._pv_max_reale = Math.max(1, storedReale + pvDelta);
                    pg.bonus_manuali = bm;
                    updates.bonus_manuali = pg.bonus_manuali;
                }

                const pvMaxEl = document.getElementById('schedaPvMax');
                if (pvMaxEl) pvMaxEl.textContent = newPvMax;
                const pvAttEl = document.getElementById('schedaPvAttuali');
                if (pvAttEl) pvAttEl.textContent = newPvAttuali;
            }
        }

        schedaRecalcAbility(field, clampedVal, pgId);
        await schedaInstantSave(pgId, updates);
        _recalcEquipFromStats(pgId);
    } else {
        const displayIds = { classe_armatura: 'schedaCA', iniziativa: 'schedaInit' };
        const el = document.getElementById(displayIds[field]);
        if (el) {
            el.textContent = field === 'iniziativa' ? (newVal >= 0 ? '+' + newVal : '' + newVal) : newVal;
        }
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('personaggi').update({ [field]: newVal, updated_at: new Date().toISOString() }).eq('id', pgId);
        }
    }
    schedaCloseHpCalc();
};

window.schedaOpenSpeedCalc = function(pgId) {
    const currentVal = _schedaPgCache?.velocita ?? 9;
    _hpCalcState = { pgId, field: 'velocita', currentVal, maxVal: -1, inputBuffer: '0', isSpeed: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">Velocità</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span><span class="hp-calc-max">m</span></div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn damage" onclick="schedaSpeedAdjust(-1.5)">− 1.5</button>
                <button class="hp-calc-btn heal" onclick="schedaSpeedAdjust(1.5)">+ 1.5</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaSpeedAdjust = async function(delta) {
    if (!_hpCalcState) return;
    let newVal = _hpCalcState.currentVal + delta;
    if (newVal < 0) newVal = 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;

    if (_schedaPgCache) _schedaPgCache.velocita = newVal;
    const el = document.getElementById('schedaSpeed');
    if (el) el.textContent = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ velocita: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
};

window.schedaToggleConcentrazione = async function(pgId, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ concentrazione: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
    if (_schedaPgCache) _schedaPgCache.concentrazione = !isActive;
};

/* ── Ispirazione (contatore semplice, illimitato, >= 0) ── */
window.schedaIspChange = function(pgId, delta) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = parseInt(pg.ispirazione || 0) || 0;
    const newVal = Math.max(0, current + delta);
    if (newVal === current && delta < 0) return;
    pg.ispirazione = newVal;
    const el = document.getElementById('sIsp');
    if (el) el.textContent = newVal;
    schedaInstantSave(pgId, { ispirazione: newVal });
};
