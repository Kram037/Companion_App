// ============================================================================
// CHARACTER HP AND NUMERIC KEYPAD HELPERS
// ============================================================================

// --- Hit Dice & HP Calculation ---
const CLASS_HIT_DIE = {
    'Artefice': 8, 'Bardo': 8, 'Chierico': 8, 'Druido': 8,
    'Ladro': 8, 'Monaco': 8, 'Warlock': 8,
    'Barbaro': 12,
    'Mago': 6, 'Stregone': 6,
    'Guerriero': 10, 'Paladino': 10, 'Ranger': 10
};

function dieAvg(die) {
    return Math.ceil(die / 2) + 1;
}

// Calcola i PV massimi "medi" per un PG gia' creato, usando la stessa
// formula della creazione (1 livello max + livelli successivi al valor
// medio del dado, sommato a livello totale * mod COS). Considera la
// prima classe in pg.classi come quella di livello 1.
function _calcPVMedio(pg) {
    if (!pg) return 0;
    const classi = Array.isArray(pg.classi) ? pg.classi.filter(Boolean) : [];
    if (classi.length === 0) return 0;
    const cosMod = calcMod(pg.costituzione || 10);
    let hp = 0;
    let totalLevel = 0;
    classi.forEach((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        const lvl = parseInt(cls.livello) || 0;
        totalLevel += lvl;
        if (idx === 0) {
            hp += die + Math.max(0, lvl - 1) * avg;
        } else {
            hp += lvl * avg;
        }
    });
    if (totalLevel === 0) totalLevel = pg.livello || 1;
    hp += totalLevel * cosMod;
    return Math.max(1, hp);
}
window._calcPVMedio = _calcPVMedio;

// Restituisce il "Max reale" salvato in bonus_manuali._pv_max_reale.
// Se non e' mai stato impostato, fa fallback al valore corrente di
// pg.punti_vita_max (ipotesi: il PG e' stato creato con un suo
// massimo che non era ancora tracciato come "reale").
// Cresce automaticamente al level-up (+pvGain registrato) e quando
// cambia la Costituzione (delta_mod_COS * livello_totale).
function _getPvMaxReale(pg) {
    if (!pg) return 0;
    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
    const stored = parseInt(bm._pv_max_reale);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return parseInt(pg.punti_vita_max) || 0;
}
window._getPvMaxReale = _getPvMaxReale;

function pgCalcHP() {
    if (pgSelectedClasses.length === 0) return 0;
    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();
    let hp = 0;

    pgSelectedClasses.forEach((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        if (idx === 0) {
            hp += die + (cls.livello - 1) * avg;
        } else {
            hp += cls.livello * avg;
        }
    });

    hp += totalLevel * cosMod;
    return Math.max(1, hp);
}

function _pgBuildHpCreationPlan() {
    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const levels = [];
    let characterLevel = 0;
    (pgSelectedClasses || []).forEach(cls => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const lvl = parseInt(cls.livello) || 0;
        for (let classLevel = 1; classLevel <= lvl; classLevel++) {
            characterLevel += 1;
            levels.push({
                character_level: characterLevel,
                class_name: cls.nome,
                class_level: classLevel,
                die,
                con_mod: cosMod,
            });
        }
    });
    return levels;
}

function _pgConLabel(conMod) {
    return conMod >= 0 ? `+${conMod}` : String(conMod);
}

function _pgHpGainFromRoll(roll, conMod) {
    return Math.max(1, (parseInt(roll) || 0) + (parseInt(conMod) || 0));
}

function _pgBuildHpHistoryFromRolls(levels, rolls) {
    let total = 0;
    const rows = levels.map((level, idx) => {
        const fallback = idx === 0 ? level.die : dieAvg(level.die);
        const roll = Math.max(1, Math.min(level.die, parseInt(rolls[idx]) || fallback));
        const gained = _pgHpGainFromRoll(roll, level.con_mod);
        total += gained;
        return {
            ...level,
            roll,
            method: idx === 0 ? 'max' : (roll === dieAvg(level.die) ? 'average' : 'manual'),
            gained,
            total_after: total,
            source: 'creation',
            created_at: new Date().toISOString(),
        };
    });
    return {
        start_level: rows[0]?.character_level || null,
        first_level: rows[0] || null,
        entries: rows.slice(1),
    };
}

function _pgApplyHpHistoryDraft(history) {
    if (!history) return;
    const rows = [history.first_level, ...(history.entries || [])].filter(Boolean);
    const total = rows.length ? rows[rows.length - 1].total_after : 0;
    const pvField = document.getElementById('pgPV');
    if (pvField) {
        pvField.value = Math.max(1, total);
        pvField.dataset.autoHp = 'false';
    }
    const hintPV = document.getElementById('hintPV');
    if (hintPV) hintPV.textContent = `(storico PF: totale ${Math.max(1, total)})`;
}

function _pgRecalculateHpHistoryDraftForCurrentCon() {
    if (!window.pgHitPointHistoryDraft) return;
    const levels = _pgBuildHpCreationPlan();
    const savedRows = [
        window.pgHitPointHistoryDraft.first_level,
        ...(window.pgHitPointHistoryDraft.entries || []),
    ].filter(Boolean);
    if (levels.length !== savedRows.length) {
        window.pgHitPointHistoryDraft = null;
        return;
    }
    const rolls = savedRows.map((row, idx) => row.roll ?? (idx === 0 ? levels[idx].die : dieAvg(levels[idx].die)));
    window.pgHitPointHistoryDraft = _pgBuildHpHistoryFromRolls(levels, rolls);
    _pgApplyHpHistoryDraft(window.pgHitPointHistoryDraft);
}

window.pgRollHitDiceForCreation = function() {
    if (!pgSelectedClasses || pgSelectedClasses.length === 0) {
        showNotification('Seleziona una classe prima di tirare i dadi vita');
        return;
    }
    const levels = _pgBuildHpCreationPlan();
    if (!levels.length) return;

    document.getElementById('pgHpRollWizard')?.remove();
    const rolls = levels.map((level, idx) => idx === 0 ? level.die : dieAvg(level.die));
    let step = 0;
    let buffer = String(rolls[step]);
    let manualStarted = false;

    const overlay = document.createElement('div');
    overlay.id = 'pgHpRollWizard';
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };

    const render = () => {
        const level = levels[step];
        const roll = Math.max(1, Math.min(level.die, parseInt(buffer) || 0));
        const gained = _pgHpGainFromRoll(roll, level.con_mod);
        const conLabel = _pgConLabel(level.con_mod);
        setSafeHtml(overlay, `
            <div class="hp-calc-modal pg-hp-roll-modal">
                <button class="hp-calc-close" type="button" data-action="close">&times;</button>
                <div class="hp-calc-title">Dado vita ${step + 1}/${levels.length}</div>
                <div class="pg-hp-roll-context">
                    <strong>${escapeHtml(level.class_name)} ${level.class_level}</strong>
                    <span>Livello totale ${level.character_level} · d${level.die} · COS ${conLabel}</span>
                </div>
                <div class="pg-hp-roll-preview">
                    <button type="button" class="levelup-pf-avg-btn" data-action="average" ${step === 0 ? 'disabled' : ''}>Tiro medio (${dieAvg(level.die)})</button>
                    <button type="button" class="levelup-pf-roll-btn" data-action="${step === 0 ? 'max' : 'roll'}">${step === 0 ? `Massimo (${level.die})` : `Tira d${level.die}`}</button>
                </div>
                <div class="hp-calc-input-display" id="pgHpRollDisplay">${escapeHtml(String(roll))}</div>
                <div class="hp-calc-hint">Dado ${roll} ${conLabel} COS = <strong>${gained}</strong> PF</div>
                <div class="hp-calc-numpad">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-calc-numpad-btn" type="button" data-action="key" data-key="${n}">${n}</button>`).join('')}
                    <button class="hp-calc-numpad-btn" type="button" data-action="key" data-key="C">C</button>
                    <button class="hp-calc-numpad-btn" type="button" data-action="key" data-key="0">0</button>
                    <button class="hp-calc-numpad-btn" type="button" data-action="key" data-key="BS">⌫</button>
                </div>
                <div class="levelup-pf-actions">
                    <button type="button" class="levelup-pf-cancel" data-action="back">${step === 0 ? 'Annulla' : 'Indietro'}</button>
                    <button type="button" class="levelup-pf-confirm" data-action="next">${step === levels.length - 1 ? 'Conferma' : 'Avanti'}</button>
                </div>
            </div>
        `);
    };

    overlay.addEventListener('click', event => {
        const btn = event.target.closest('[data-action]');
        if (!btn || !overlay.contains(btn)) return;
        const action = btn.dataset.action;
        const level = levels[step];
        if (action === 'close') {
            overlay.remove();
        } else if (action === 'average' && step > 0) {
            buffer = String(dieAvg(level.die));
            rolls[step] = parseInt(buffer);
            manualStarted = false;
            render();
        } else if (action === 'max') {
            buffer = String(level.die);
            rolls[step] = parseInt(buffer);
            manualStarted = false;
            render();
        } else if (action === 'roll' && step > 0) {
            buffer = String(1 + Math.floor(Math.random() * level.die));
            rolls[step] = parseInt(buffer);
            manualStarted = false;
            render();
        } else if (action === 'key') {
            const key = btn.dataset.key || '';
            if (key === 'C') {
                buffer = '0';
                manualStarted = true;
            } else if (key === 'BS') {
                buffer = manualStarted && buffer.length > 1 ? buffer.slice(0, -1) : '0';
                manualStarted = true;
            } else {
                buffer = !manualStarted || buffer === '0' ? key : buffer + key;
                manualStarted = true;
            }
            rolls[step] = Math.max(1, Math.min(level.die, parseInt(buffer) || 0));
            buffer = String(rolls[step]);
            render();
        } else if (action === 'back') {
            if (step === 0) {
                overlay.remove();
                return;
            }
            rolls[step] = Math.max(1, Math.min(level.die, parseInt(buffer) || 0));
            step -= 1;
            buffer = String(rolls[step]);
            manualStarted = false;
            render();
        } else if (action === 'next') {
            rolls[step] = Math.max(1, Math.min(level.die, parseInt(buffer) || 0));
            if (step < levels.length - 1) {
                step += 1;
                buffer = String(rolls[step]);
                manualStarted = false;
                render();
                return;
            }
            window.pgHitPointHistoryDraft = _pgBuildHpHistoryFromRolls(levels, rolls);
            _pgApplyHpHistoryDraft(window.pgHitPointHistoryDraft);
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
    render();
};

function pgRenderDadiVita() {
    const container = document.getElementById('pgDadiVitaList');
    if (!container) return;

    if (pgSelectedClasses.length === 0) {
        setSafeHtml(container, '<p style="color:var(--text-muted); font-size:0.85rem;">Seleziona una classe per vedere i dadi vita</p>');
        return;
    }

    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();

    const html = pgSelectedClasses.map((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        let detail;
        if (idx === 0) {
            detail = `${die} + ${cls.livello - 1}×${avg}`;
        } else {
            detail = `${cls.livello}×${avg}`;
        }
        return `
        <div class="pg-dado-vita-item">
            <span class="pg-dado-vita-classe">${escapeHtml(cls.nome)}</span>
            <span class="pg-dado-vita-dice">${cls.livello}d${die}</span>
            <span class="pg-dado-vita-detail">${detail}</span>
        </div>`;
    }).join('');
    setSafeHtml(container, html);

    const hp = pgCalcHP();
    const cosTotal = totalLevel * cosMod;
    const cosSign = cosTotal >= 0 ? '+' : '';
    const hintPV = document.getElementById('hintPV');
    if (hintPV) hintPV.textContent = `(calcolato: ${hp - cosTotal} ${cosSign}${cosTotal} COS = ${hp})`;

    const pvField = document.getElementById('pgPV');
    if (pvField && pvField.dataset.autoHp !== 'false') {
        pvField.value = hp;
    }
}

// --- Generic numeric keypad for inputs ---
window.pgOpenAbilityKeypad = function(inputEl) {
    const existing = document.getElementById('pgKeypadOverlay');
    if (existing) existing.remove();

    const currentVal = inputEl.value || '0';
    window._kpTarget = inputEl;
    window._kpBuffer = currentVal;

    const label = inputEl.closest('.form-group')?.querySelector('label')?.textContent
              || inputEl.closest('.pg-ability-block')?.querySelector('label')?.textContent
              || '';

    const overlay = document.createElement('div');
    overlay.id = 'pgKeypadOverlay';
    overlay.className = 'hp-calc-overlay';
    const keypadKeys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];
    setSafeHtml(overlay, `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" data-keypad-action="close">&times;</button>
            <div class="hp-calc-title">${escapeHtml(label)}</div>
            <div class="hp-calc-input-display" id="kpDisplay">${escapeHtml(currentVal)}</div>
            <div class="hp-calc-numpad">
                ${keypadKeys.map(key => `<button class="hp-calc-numpad-btn" data-keypad-action="input" data-keypad-key="${safeAttr(key)}">${escapeHtml(key)}</button>`).join('')}
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" data-keypad-action="confirm">Conferma</button>
            </div>
        </div>
    `);
    overlay.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-keypad-action]');
        if (!actionEl || !overlay.contains(actionEl)) return;

        const action = actionEl.dataset.keypadAction;
        if (action === 'close') {
            pgCloseKeypad();
        } else if (action === 'confirm') {
            pgKeypadConfirm();
        } else if (action === 'input') {
            pgKeypadInput(actionEl.dataset.keypadKey || '');
        }
    });
    document.body.appendChild(overlay);
};

window.pgKeypadInput = function(key) {
    if (key === 'C') { window._kpBuffer = '0'; }
    else if (key === '⌫') { window._kpBuffer = window._kpBuffer.length > 1 ? window._kpBuffer.slice(0, -1) : '0'; }
    else { window._kpBuffer = window._kpBuffer === '0' ? key : window._kpBuffer + key; }
    const disp = document.getElementById('kpDisplay');
    if (disp) disp.textContent = window._kpBuffer;
};

window.pgKeypadConfirm = function() {
    const input = window._kpTarget;
    if (input) {
        const val = parseInt(window._kpBuffer) || 0;
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (input.id === 'pgPV') {
            input.dataset.autoHp = 'false';
            window.pgHitPointHistoryDraft = null;
        }
        if (input.classList.contains('pg-ability-input')) {
            updateAllAbilityMods();
            if (input.id === 'pgCostituzione' && window.pgHitPointHistoryDraft) _pgRecalculateHpHistoryDraftForCurrentCon();
        }
    }
    pgCloseKeypad();
};

window.pgCloseKeypad = function() {
    const o = document.getElementById('pgKeypadOverlay');
    if (o) o.remove();
    window._kpTarget = null;
    window._kpBuffer = '0';
};
