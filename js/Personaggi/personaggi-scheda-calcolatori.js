// ============================================================================
// CHARACTER SHEET CALCULATORS
// ============================================================================

let _hpCalcState = null;
let _xpCalcState = null;

const CHARACTER_XP_THRESHOLDS = [
    0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
    305000, 355000
];

function schedaGetPvMaxTemporaneo(pg) {
    const bm = (pg?.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
    return Math.max(0, parseInt(bm._pv_max_temporaneo) || 0);
}

function schedaGetPvMaxEffettivo(pg) {
    const base = Math.max(1, parseInt(pg?.punti_vita_max) || 10);
    return base + schedaGetPvMaxTemporaneo(pg);
}

window.schedaGetPvMaxTemporaneo = schedaGetPvMaxTemporaneo;
window.schedaGetPvMaxEffettivo = schedaGetPvMaxEffettivo;

function schedaGetTotalLevel(pg) {
    const classLevel = Array.isArray(pg?.classi)
        ? pg.classi.reduce((sum, cls) => sum + (parseInt(cls?.livello) || 0), 0)
        : 0;
    return Math.max(1, classLevel || parseInt(pg?.livello) || 1);
}

function schedaGetEsperienza(pg) {
    const bm = (pg?.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
    if (pg && Object.prototype.hasOwnProperty.call(pg, 'esperienza')) {
        return Math.max(0, parseInt(pg.esperienza) || 0);
    }
    return Math.max(0, parseInt(bm._esperienza) || 0);
}

function schedaGetXpSummary(pg, xpOverride = null) {
    const livello = Math.min(20, schedaGetTotalLevel(pg));
    const current = Math.max(0, parseInt(xpOverride ?? schedaGetEsperienza(pg)) || 0);
    const currentLevelXp = CHARACTER_XP_THRESHOLDS[livello] ?? 0;
    const nextLevelXp = livello >= 20 ? null : CHARACTER_XP_THRESHOLDS[livello + 1];
    const needed = nextLevelXp == null ? 0 : Math.max(0, nextLevelXp - current);
    const span = nextLevelXp == null ? 0 : Math.max(1, nextLevelXp - currentLevelXp);
    const progress = nextLevelXp == null ? 100 : Math.max(0, Math.min(100, ((current - currentLevelXp) / span) * 100));
    return { livello, current, currentLevelXp, nextLevelXp, needed, progress };
}

window.schedaGetEsperienza = schedaGetEsperienza;
window.schedaGetXpSummary = schedaGetXpSummary;

function schedaFormatNumber(value) {
    return new Intl.NumberFormat('it-IT').format(parseInt(value) || 0);
}
window.schedaFormatNumber = schedaFormatNumber;

function schedaUpdateHpDisplays(pg) {
    if (!pg) return;
    const baseMax = Math.max(1, parseInt(pg.punti_vita_max) || 10);
    const tempMax = schedaGetPvMaxTemporaneo(pg);
    const effectiveMax = schedaGetPvMaxEffettivo(pg);
    const pvMaxEl = document.getElementById('schedaPvMax');
    if (pvMaxEl) {
        pvMaxEl.textContent = effectiveMax;
        pvMaxEl.dataset.pfBase = String(baseMax);
        pvMaxEl.dataset.pfMaxTemp = String(tempMax);
        pvMaxEl.classList.toggle('pv-max-temp', tempMax > 0);
    }
    const pvAttualiEl = document.getElementById('schedaPvAttuali');
    if (pvAttualiEl) {
        const current = pg.pv_attuali != null ? parseInt(pg.pv_attuali) || 0 : effectiveMax;
        pvAttualiEl.textContent = Math.min(effectiveMax, Math.max(0, current));
    }
    const pvTempEl = document.getElementById('schedaPvTemp');
    if (pvTempEl) pvTempEl.textContent = pg.pv_temporanei || 0;
}

function schedaRefreshHpMaxPreview() {
    const current = parseInt(_hpCalcState?.maxBase ?? document.getElementById('hpCalcCurrent')?.textContent) || 0;
    const bonus = Math.max(0, parseInt(_hpCalcState?.maxTemp ?? document.getElementById('hpCalcTempBonus')?.textContent) || 0);
    const el = document.getElementById('hpCalcEffectiveMax');
    if (el) el.textContent = current + bonus;
}

function schedaGetPfHistory(pg) {
    const bm = (pg?.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
    const raw = bm._pf_storico;
    if (!raw || typeof raw !== 'object') return { entries: [] };
    return {
        ...raw,
        entries: Array.isArray(raw.entries) ? raw.entries : [],
    };
}

function schedaFormatPfHistoryRoll(entry) {
    if (!entry) return '-';
    if (entry.method === 'average') return `medio ${entry.roll}`;
    if (entry.method === 'manual') return `manuale`;
    if (entry.roll != null) return `1d${entry.die} = ${entry.roll}`;
    return '-';
}

function schedaBuildPfVirtualRows(pg) {
    const classi = Array.isArray(pg?.classi) ? pg.classi.filter(Boolean) : [];
    const rows = [];
    let characterLevel = 0;
    classi.forEach(cls => {
        const die = CLASS_HIT_DIE?.[cls.nome] || 8;
        const lvl = parseInt(cls.livello) || 0;
        for (let classLevel = 1; classLevel <= lvl; classLevel++) {
            characterLevel += 1;
            rows.push({
                character_level: characterLevel,
                class_name: cls.nome,
                class_level: classLevel,
                die,
                roll: characterLevel === 1 ? die : dieAvg(die),
                method: characterLevel === 1 ? 'max' : 'average',
                source: 'virtual',
            });
        }
    });
    return rows;
}

function schedaEntryRollValue(entry, fallback) {
    const die = parseInt(entry?.die || fallback?.die) || 8;
    const directRoll = parseInt(entry?.roll);
    if (Number.isFinite(directRoll) && directRoll > 0) return Math.max(1, Math.min(die, directRoll));
    const gained = parseInt(entry?.gained);
    const oldCon = parseInt(entry?.con_mod) || 0;
    if (Number.isFinite(gained) && gained > 0) return Math.max(1, Math.min(die, gained - oldCon));
    const fallbackRoll = parseInt(fallback?.roll);
    if (Number.isFinite(fallbackRoll) && fallbackRoll > 0) return Math.max(1, Math.min(die, fallbackRoll));
    return dieAvg(die);
}

function schedaBuildPfHistoryRows(pg) {
    const history = schedaGetPfHistory(pg);
    const virtualRows = schedaBuildPfVirtualRows(pg);
    const historyRows = [history.first_level, ...(history.entries || [])]
        .filter(Boolean)
        .filter(row => parseInt(row.character_level) > 0);
    const byLevel = new Map(historyRows.map(row => [parseInt(row.character_level), row]));
    const baseRows = virtualRows.length
        ? virtualRows
        : historyRows.sort((a, b) => (parseInt(a.character_level) || 0) - (parseInt(b.character_level) || 0));
    const conMod = calcMod(parseInt(pg?.costituzione) || 10);
    let cumulativeRoll = 0;
    return baseRows.map(base => {
        const characterLevel = parseInt(base.character_level) || 1;
        const entry = byLevel.get(characterLevel) || base;
        const die = parseInt(entry.die || base.die) || 8;
        const roll = schedaEntryRollValue(entry, base);
        cumulativeRoll += roll;
        return {
            character_level: characterLevel,
            die,
            roll,
            total_with_con: Math.max(1, cumulativeRoll + (conMod * characterLevel)),
        };
    });
}

window.schedaOpenPfHistory = function() {
    const pg = _schedaPgCache;
    if (!pg) return;
    document.querySelector('.pf-history-overlay')?.remove();
    const conMod = calcMod(parseInt(pg.costituzione) || 10);
    const conLabel = conMod >= 0 ? `+${conMod}` : String(conMod);
    const rows = schedaBuildPfHistoryRows(pg);
    const rowsHtml = rows.length ? rows.map(row => `
        <tr>
            <td>${row.character_level}</td>
            <td>d${row.die}</td>
            <td>${row.roll}</td>
            <td>${row.total_with_con}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">Nessuno storico disponibile.</td></tr>';

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay pf-history-overlay';
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal pf-history-modal">
            <button class="hp-calc-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <div class="hp-calc-title">Storico PF</div>
            <p class="pf-history-summary">Costituzione attuale: <strong>${escapeHtml(conLabel)}</strong></p>
            <div class="comp-table-wrap pf-history-table-wrap">
                <table class="comp-equipment-table pf-history-table">
                    <thead>
                        <tr>
                            <th>Liv.</th>
                            <th>Dado</th>
                            <th>Tiro</th>
                            <th>Tot. COS</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.schedaOpenHpCalcLive = function(pgId, field) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let currentVal, maxVal;
    if (field === 'pv_attuali') {
        maxVal = schedaGetPvMaxEffettivo(pg);
        currentVal = Math.min(maxVal, pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10));
    } else if (field === 'pv_temporanei') {
        currentVal = pg.pv_temporanei || 0;
        maxVal = -1;
    } else if (field === 'punti_vita_max') {
        currentVal = pg.punti_vita_max || 10;
        maxVal = -1;
    } else if (field === 'pv_max_temporaneo') {
        currentVal = schedaGetPvMaxTemporaneo(pg);
        maxVal = -1;
    }
    schedaOpenHpCalc(pgId, field, currentVal, maxVal);
}

window.schedaOpenHpCalc = function(pgId, field, currentVal, maxVal) {
    _hpCalcState = { pgId, field, currentVal, maxVal, inputBuffer: '0' };
    const labels = {
        pv_attuali: 'Punti Ferita Attuali',
        pv_temporanei: 'Punti Ferita Temporanei',
        punti_vita_max: 'Punti Ferita Massimi',
        pv_max_temporaneo: 'Bonus PF Max Temporaneo',
    };
    const label = labels[field] || 'Punti Ferita';
    const maxDisplay = (maxVal > 0 && field !== 'punti_vita_max') ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';

    const isDirectEdit = field === 'punti_vita_max' || field === 'pv_max_temporaneo';
    const useOperators = field === 'pv_attuali' && !isDirectEdit;

    let pvMedioHint = '';
    let actionButtons;
    let currentDisplayHtml = `<div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>`;
    if (isDirectEdit) {
        let extraButtons = '';
        if (field === 'punti_vita_max') {
            const pgRef = _schedaPgCache;
            const tempBonus = (typeof schedaGetPvMaxTemporaneo === 'function') ? schedaGetPvMaxTemporaneo(pgRef) : 0;
            const effectiveMax = (parseInt(currentVal) || 0) + tempBonus;
            _hpCalcState.maxTarget = 'base';
            _hpCalcState.maxBase = parseInt(currentVal) || 1;
            _hpCalcState.maxTemp = tempBonus;
            currentDisplayHtml = `<div class="hp-calc-max-row">
                <button type="button" class="hp-calc-max-box hp-calc-max-choice selected" id="hpCalcMaxBaseBox" onclick="schedaHpSelectMaxTarget('base')">
                    <strong id="hpCalcCurrent">${currentVal}</strong>
                    <span>PF max</span>
                </button>
                <button type="button" class="hp-calc-max-box hp-calc-max-choice" id="hpCalcMaxTempBox" onclick="schedaHpSelectMaxTarget('temp')">
                    <strong id="hpCalcTempBonus">${tempBonus}</strong>
                    <span>Bonus temp</span>
                </button>
            </div>
            <div class="hp-calc-hint">Massimo effettivo: <strong id="hpCalcEffectiveMax">${effectiveMax}</strong> PF</div>`;
            extraButtons = `<div class="hp-calc-buttons hp-calc-buttons-extra">
                <button class="hp-calc-btn neutral hp-calc-btn-full" onclick="schedaOpenPfHistory()">Storico PF</button>
            </div>`;
        }
        actionButtons = `<div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaHpSetDirect()">Conferma</button>
            </div>
            ${extraButtons}`;
    } else {
        actionButtons = `<div class="hp-calc-buttons">
            <button class="hp-calc-btn damage" onclick="schedaHpApply(-1)">− Danno</button>
            <button class="hp-calc-btn heal" onclick="schedaHpApply(1)">+ Cura</button>
           </div>`;
    }

    const operatorButtonsHtml = useOperators ? `
                <button class="hp-calc-numpad-btn operator" onclick="hpCalcNumpad('+')">+</button>
                <button class="hp-calc-numpad-btn operator" onclick="hpCalcNumpad('-')">-</button>
                <button class="hp-calc-numpad-btn operator" onclick="hpCalcNumpad('*')">x</button>
                <button class="hp-calc-numpad-btn operator" onclick="hpCalcNumpad('/')">/</button>` : '';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            ${currentDisplayHtml}
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
            ${useOperators ? `<div class="hp-calc-numpad hp-calc-numpad-ops">${operatorButtonsHtml}</div>` : ''}
            ${actionButtons}
        </div>
    `;
    document.body.appendChild(overlay);
}

window.schedaHpSelectMaxTarget = function(target) {
    if (!_hpCalcState || _hpCalcState.field !== 'punti_vita_max') return;
    _hpCalcState.maxTarget = target === 'temp' ? 'temp' : 'base';
    _hpCalcState.inputBuffer = '0';
    _hpCalcState.hasInput = false;
    document.getElementById('hpCalcMaxBaseBox')?.classList.toggle('selected', _hpCalcState.maxTarget === 'base');
    document.getElementById('hpCalcMaxTempBox')?.classList.toggle('selected', _hpCalcState.maxTarget === 'temp');
    hpCalcRenderAmountDisplay();
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

window.hpCalcNumpad = function(key) {
    if (!_hpCalcState) return;
    _hpCalcState.hasInput = true;
    if (key === 'C') {
        _hpCalcState.inputBuffer = '0';
    } else if (key === 'âŒ«' || key === '⌫') {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.length > 1 ? _hpCalcState.inputBuffer.slice(0, -1) : '0';
    } else if (['+','-','*','/'].includes(key)) {
        if (_hpCalcState.inputBuffer === '0') return;
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.replace(/\s*[+\-*/]\s*$/, '') + ` ${key} `;
    } else {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer === '0' ? key : _hpCalcState.inputBuffer + key;
    }
    hpCalcRenderAmountDisplay();
}

function hpCalcRenderAmountDisplay() {
    const display = document.getElementById('hpCalcAmountDisplay');
    if (!display || !_hpCalcState) return;
    const expr = _hpCalcState.inputBuffer || '0';
    const amount = hpCalcGetAmount();
    if (/[+\-*/]/.test(expr.replace(/^\d+$/, ''))) {
        display.innerHTML = `<span class="hp-calc-expression">${escapeHtml(expr)}</span><span class="hp-calc-result">${amount}</span>`;
    } else {
        display.textContent = expr;
    }
}

function hpCalcGetAmount() {
    if (!_hpCalcState) return 0;
    const expr = String(_hpCalcState.inputBuffer || '0').replace(/\s*[+\-*/]\s*$/, '');
    if (!/^[0-9+\-*/\s.()]+$/.test(expr)) return 0;
    try {
        const value = Function(`"use strict"; return (${expr});`)();
        if (!Number.isFinite(value)) return 0;
        return Math.max(0, Math.floor(value));
    } catch (_) {
        return 0;
    }
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
        message: `Il Max Reale passera' da ${oldReale} a ${buf} PF. Anche il valore di PF massimi corrente verra' impostato a ${buf}.`,
        confirmLabel: 'Conferma',
    });
    if (!ok) return;

    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    bm._pv_max_reale = buf;
    pg.bonus_manuali = bm;
    pg.punti_vita_max = buf;
    const effectiveMax = schedaGetPvMaxEffettivo(pg);
    const clampedPv = Math.min(effectiveMax, Math.max(0, parseInt(pg.pv_attuali) || effectiveMax));
    pg.pv_attuali = clampedPv;

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
    const pvAttualiDisplay = document.getElementById('schedaPvAttuali');
    if (pvAttualiDisplay) pvAttualiDisplay.textContent = clampedPv;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({
            punti_vita_max: buf,
            pv_attuali: clampedPv,
            bonus_manuali: pg.bonus_manuali,
            updated_at: new Date().toISOString(),
        }).eq('id', _hpCalcState.pgId);
    }
    showNotification('Max Reale aggiornato');
};

window.schedaHpSetDirect = async function() {
    if (!_hpCalcState) return;
    const field = _hpCalcState.field;
    const pg = _schedaPgCache;
    const newVal = (field === 'punti_vita_max' && _hpCalcState.inputBuffer === '0')
        ? (parseInt(_hpCalcState.currentVal) || 1)
        : (parseInt(_hpCalcState.inputBuffer) || 0);

    if (field === 'punti_vita_max') {
        if (!pg) return;
        const target = _hpCalcState.maxTarget === 'temp' ? 'temp' : 'base';
        const typed = parseInt(_hpCalcState.inputBuffer) || 0;
        const currentBase = Math.max(1, parseInt(_hpCalcState.maxBase ?? pg.punti_vita_max) || 1);
        const currentTemp = Math.max(0, parseInt(_hpCalcState.maxTemp ?? schedaGetPvMaxTemporaneo(pg)) || 0);
        const baseMax = target === 'base'
            ? Math.max(1, _hpCalcState.hasInput ? typed : currentBase)
            : currentBase;
        const bonus = target === 'temp'
            ? Math.max(0, _hpCalcState.hasInput ? typed : currentTemp)
            : currentTemp;
        const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
        if (target === 'base') bm._pv_max_reale = baseMax;
        if (target === 'temp') {
            if (bonus > 0) bm._pv_max_temporaneo = bonus;
            else delete bm._pv_max_temporaneo;
        } else if (currentTemp > 0) {
            bm._pv_max_temporaneo = currentTemp;
        }

        pg.bonus_manuali = bm;
        pg.punti_vita_max = baseMax;
        const effectiveMax = schedaGetPvMaxEffettivo(pg);
        const curPv = pg.pv_attuali != null ? parseInt(pg.pv_attuali) || 0 : effectiveMax;
        const clampedPv = Math.min(effectiveMax, Math.max(0, curPv));
        pg.pv_attuali = clampedPv;

        _hpCalcState.currentVal = baseMax;
        _hpCalcState.maxBase = baseMax;
        _hpCalcState.maxTemp = bonus;
        _hpCalcState.inputBuffer = '0';
        _hpCalcState.hasInput = false;
        const display = document.getElementById('hpCalcCurrent');
        if (display) display.textContent = baseMax;
        const tempDisplay = document.getElementById('hpCalcTempBonus');
        if (tempDisplay) tempDisplay.textContent = bonus;
        const amountDisplay = document.getElementById('hpCalcAmountDisplay');
        if (amountDisplay) amountDisplay.textContent = '0';
        const effectiveDisplay = document.getElementById('hpCalcEffectiveMax');
        if (effectiveDisplay) effectiveDisplay.textContent = effectiveMax;
        schedaUpdateHpDisplays(pg);

        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('personaggi').update({
                punti_vita_max: baseMax,
                pv_attuali: clampedPv,
                bonus_manuali: pg.bonus_manuali,
                updated_at: new Date().toISOString(),
            }).eq('id', _hpCalcState.pgId);
        }
        return;
    }

    if (field === 'pv_max_temporaneo') {
        if (!pg) return;
        const bonus = Math.max(0, newVal);
        const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
        if (bonus > 0) bm._pv_max_temporaneo = bonus;
        else delete bm._pv_max_temporaneo;

        pg.bonus_manuali = bm;
        const effectiveMax = schedaGetPvMaxEffettivo(pg);
        const curPv = pg.pv_attuali != null ? parseInt(pg.pv_attuali) || 0 : effectiveMax;
        const clampedPv = Math.min(effectiveMax, Math.max(0, curPv));
        pg.pv_attuali = clampedPv;

        _hpCalcState.currentVal = bonus;
        _hpCalcState.inputBuffer = '0';
        const display = document.getElementById('hpCalcCurrent');
        if (display) display.textContent = bonus;
        const amountDisplay = document.getElementById('hpCalcAmountDisplay');
        if (amountDisplay) amountDisplay.textContent = '0';
        schedaUpdateHpDisplays(pg);

        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('personaggi').update({
                bonus_manuali: pg.bonus_manuali,
                pv_attuali: clampedPv,
                updated_at: new Date().toISOString(),
            }).eq('id', _hpCalcState.pgId);
        }
        return;
    }

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

    const updates = { [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() };
    if (_hpCalcState.field === 'punti_vita_max' && _schedaPgCache) {
        const effectiveMax = schedaGetPvMaxEffettivo(_schedaPgCache);
        const currentPv = _schedaPgCache.pv_attuali != null ? parseInt(_schedaPgCache.pv_attuali) || 0 : effectiveMax;
        const clampedPv = Math.min(effectiveMax, Math.max(0, currentPv));
        _schedaPgCache.pv_attuali = clampedPv;
        updates.pv_attuali = clampedPv;
        const currentDisplay = document.getElementById('schedaPvAttuali');
        if (currentDisplay) currentDisplay.textContent = clampedPv;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update(updates).eq('id', _hpCalcState.pgId);
    }
}

window.schedaHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = hpCalcGetAmount();
    if (amount === 0) return;

    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    hpCalcRenderAmountDisplay();

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

function xpCalcRender() {
    if (!_xpCalcState) return;
    const pg = _schedaPgCache;
    const xp = Math.max(0, parseInt(_xpCalcState.currentXp) || 0);
    const delta = Math.max(0, parseInt(_xpCalcState.inputBuffer) || 0);
    const summary = schedaGetXpSummary(pg, xp);
    const current = document.getElementById('xpCalcCurrentPreview');
    const input = document.getElementById('xpCalcAmountDisplay');
    const next = document.getElementById('xpCalcNextInfo');
    const progress = document.getElementById('xpCalcProgress');
    if (current) current.textContent = schedaFormatNumber(summary.current);
    if (input) input.textContent = schedaFormatNumber(delta);
    if (next) {
        next.innerHTML = summary.nextLevelXp == null
            ? 'Livello massimo'
            : `Prossimo livello: <strong>${schedaFormatNumber(summary.nextLevelXp)}</strong><br>Mancano: <strong>${schedaFormatNumber(summary.needed)}</strong> PE`;
    }
    if (progress) progress.style.width = `${summary.progress}%`;
}

window.schedaOpenXpCalc = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    document.getElementById('xpCalcOverlay')?.remove();
    const current = schedaGetEsperienza(pg);
    _xpCalcState = { pgId, currentXp: current, inputBuffer: '0', manualStarted: false };

    const overlay = document.createElement('div');
    overlay.id = 'xpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = event => { if (event.target === overlay) schedaCloseXpCalc(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal xp-calc-modal">
            <button class="hp-calc-close" type="button" onclick="schedaCloseXpCalc()">&times;</button>
            <div class="hp-calc-title">Punti Esperienza</div>
            <div class="hp-calc-hp-display xp-calc-current">
                <span class="hp-calc-current" id="xpCalcCurrentPreview">${schedaFormatNumber(current)}</span>
                <span class="hp-calc-max">PE</span>
            </div>
            <div class="xp-calc-next" id="xpCalcNextInfo"></div>
            <div class="xp-calc-progress"><span id="xpCalcProgress"></span></div>
            <div class="hp-calc-input-display" id="xpCalcAmountDisplay">0</div>
            <div class="xp-calc-delta-actions">
                <button type="button" class="levelup-pf-confirm" onclick="xpCalcApplyDelta(1)">+</button>
                <button type="button" class="levelup-pf-cancel" onclick="xpCalcApplyDelta(-1)">-</button>
            </div>
            <div class="hp-calc-numpad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-calc-numpad-btn" type="button" onclick="xpCalcNumpad('${n}')">${n}</button>`).join('')}
                <button class="hp-calc-numpad-btn" type="button" onclick="xpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" type="button" onclick="xpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" type="button" onclick="xpCalcNumpad('BS')">⌫</button>
            </div>
            <button type="button" class="levelup-pf-confirm xp-levelup-btn" onclick="schedaStartLevelUpFromXp()">Avanzamento di livello</button>
        </div>`;
    document.body.appendChild(overlay);
    xpCalcRender();
};

window.xpCalcNumpad = function(key) {
    if (!_xpCalcState) return;
    if (key === 'C') {
        _xpCalcState.inputBuffer = '0';
        _xpCalcState.manualStarted = true;
    } else if (key === 'BS') {
        _xpCalcState.inputBuffer = _xpCalcState.inputBuffer.length > 1 ? _xpCalcState.inputBuffer.slice(0, -1) : '0';
        _xpCalcState.manualStarted = true;
    } else {
        _xpCalcState.inputBuffer = (!_xpCalcState.manualStarted || _xpCalcState.inputBuffer === '0')
            ? String(key)
            : `${_xpCalcState.inputBuffer}${key}`;
        _xpCalcState.manualStarted = true;
    }
    _xpCalcState.inputBuffer = String(Math.min(999999999, Math.max(0, parseInt(_xpCalcState.inputBuffer) || 0)));
    xpCalcRender();
};

async function xpCalcSaveCurrent() {
    if (!_xpCalcState || !_schedaPgCache) return false;
    const xp = Math.max(0, parseInt(_xpCalcState.currentXp) || 0);
    const pg = _schedaPgCache;
    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    delete bm._esperienza;
    pg.bonus_manuali = bm;
    pg.esperienza = xp;

    const supabase = getSupabaseClient();
    if (supabase) {
        const { error } = await supabase.from('personaggi').update({
            esperienza: xp,
            bonus_manuali: pg.bonus_manuali,
            updated_at: new Date().toISOString(),
        }).eq('id', _xpCalcState.pgId);
        if (error) {
            showNotification?.('Errore salvataggio esperienza');
            return false;
        }
    }

    return true;
}

window.xpCalcApplyDelta = async function(direction) {
    if (!_xpCalcState) return;
    const amount = parseInt(_xpCalcState.inputBuffer) || 0;
    if (amount <= 0) return;
    const previous = _xpCalcState.currentXp || 0;
    _xpCalcState.currentXp = Math.max(0, Math.min(999999999, previous + (amount * direction)));
    _xpCalcState.inputBuffer = '0';
    _xpCalcState.manualStarted = false;
    xpCalcRender();
    if (!await xpCalcSaveCurrent()) {
        _xpCalcState.currentXp = previous;
        if (_schedaPgCache) _schedaPgCache.esperienza = previous;
        xpCalcRender();
    }
};

window.schedaStartLevelUpFromXp = function() {
    const pgId = _xpCalcState?.pgId || _schedaPgCache?.id;
    schedaCloseXpCalc();
    if (pgId) schedaLevelUp(pgId);
};

window.schedaCloseXpCalc = function() {
    document.getElementById('xpCalcOverlay')?.remove();
    _xpCalcState = null;
};

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
        if (typeof window.ensureRuntimeScript === 'function') {
            await window.ensureRuntimeScript('combattimento');
        }
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
