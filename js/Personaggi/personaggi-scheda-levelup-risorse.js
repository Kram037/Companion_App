// ============================================================================
// CHARACTER SHEET LEVEL UP AND RESOURCE ACTIONS
// ============================================================================

/* ── Level Up ────────────────────────────────────────────────────────────────
   Aumenta di 1 il livello di una classe del PG. Per i PV chiede al giocatore
   se usare il valore medio (fisso) oppure tirare il dado vita. Aggiorna anche
   dadi vita disponibili, livello totale, e indirettamente risorse di classe
   e privilegi (calcolati dinamicamente in fase di render in base al livello).
   ────────────────────────────────────────────────────────────────────────── */
window.schedaLevelUp = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) {
        // Carica il PG se non e' in cache (es. clic dalla tab Inventario senza prima aver caricato la scheda).
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
            if (data) _schedaPgCache = data;
        }
    }
    const cur = _schedaPgCache;
    if (!cur) return;
    const classi = Array.isArray(cur.classi) ? cur.classi : [];
    if (classi.length === 0) {
        showNotification('Nessuna classe configurata');
        return;
    }
    const totLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);
    if (totLevel >= 20) {
        showNotification('Livello massimo raggiunto (20)');
        return;
    }

    // Sempre picker: scegli quale classe far salire oppure aggiungi multiclasse.
    _showLevelUpPicker(pgId, classi);
};

function _showLevelUpPicker(pgId, classi) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rows = classi.map((c, i) => {
        const lvl = parseInt(c.livello) || 1;
        const disabled = lvl >= 20;
        return `<button class="levelup-pick-row${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : ''} data-idx="${i}">
            <span class="levelup-pick-name">${escapeHtml(c.nome)}</span>
            <span class="levelup-pick-arrow">${lvl} → ${disabled ? lvl : lvl + 1}</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Level Up</h3>
        <p class="levelup-sub">Quale classe vuoi aumentare di livello?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-multiclass" id="luMulticlassBtn">
            <span class="levelup-pick-name">+ Multiclasse</span>
            <span class="levelup-pick-arrow">aggiungi nuova classe</span>
        </button>
    </div>`;
    overlay.querySelectorAll('.levelup-pick-row[data-idx]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            overlay.remove();
            _showLevelUpHpChoice(pgId, idx);
        };
    });
    overlay.querySelector('#luMulticlassBtn').onclick = () => {
        overlay.remove();
        _showMulticlassPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showMulticlassPicker(pgId, classi) {
    const owned = new Set(classi.map(c => c.nome));
    const all = Object.keys(CLASS_HIT_DIE).sort((a, b) => a.localeCompare(b));
    const available = all.filter(n => !owned.has(n));

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    if (available.length === 0) {
        overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="levelup-title">Multiclasse</h3>
            <p class="levelup-sub">Hai gia' tutte le classi disponibili.</p>
            <div class="levelup-pf-actions">
                <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
                <button type="button" class="levelup-pf-confirm" onclick="this.closest('.hp-calc-overlay').remove();_showLevelUpPicker('${pgId}', ${JSON.stringify(classi).replace(/'/g, '&#39;')});">Indietro</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        return;
    }

    const rows = available.map(nome => {
        const die = CLASS_HIT_DIE[nome] || 8;
        return `<button class="levelup-pick-row" data-nome="${escapeHtml(nome)}">
            <span class="levelup-pick-name">${escapeHtml(nome)}</span>
            <span class="levelup-pick-arrow">d${die} · liv 1</span>
        </button>`;
    }).join('');

    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Multiclasse</h3>
        <p class="levelup-sub">Quale classe vuoi aggiungere al livello 1?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-back" id="luBackBtn">
            <span class="levelup-pick-name">← Indietro</span>
            <span class="levelup-pick-arrow">scegli classe esistente</span>
        </button>
    </div>`;

    overlay.querySelectorAll('.levelup-pick-row[data-nome]').forEach(btn => {
        btn.onclick = () => {
            const nome = btn.dataset.nome;
            overlay.remove();
            _showLevelUpHpChoice(pgId, -1, { newClassName: nome });
        };
    });
    overlay.querySelector('#luBackBtn').onclick = () => {
        overlay.remove();
        _showLevelUpPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showLevelUpHpChoice(pgId, classIdx, opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const isNewClass = !!opts.newClassName;
    const cls = isNewClass
        ? { nome: opts.newClassName, livello: 0 }
        : (pg.classi || [])[classIdx];
    if (!cls) return;

    const die = CLASS_HIT_DIE[cls.nome] || 8;
    const conMod = Math.floor((((pg.costituzione) || 10) - 10) / 2);
    const avgGain = Math.max(1, dieAvg(die) + conMod);
    const conSign = conMod >= 0 ? '+' : '';
    const conLabel = `${conSign}${conMod}`;
    const newLvl = (parseInt(cls.livello) || 0) + 1;

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal levelup-pf-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Punti Ferita</h3>
        <p class="levelup-sub">${escapeHtml(cls.nome)}: Liv ${cls.livello || 1} → ${newLvl}<br><small>Dado: 1d${die} · COS ${conLabel}</small></p>
        <button type="button" class="levelup-pf-avg-btn" id="lupfAvgBtn">Tiro medio (+${avgGain})</button>
        <div class="levelup-pf-roll-row">
            <input type="number" class="levelup-pf-input" id="lupfInput" placeholder="—" min="1" inputmode="numeric">
            <button type="button" class="levelup-pf-roll-btn" id="lupfRollBtn">Tira il dado</button>
        </div>
        <div class="levelup-pf-detail" id="lupfDetail"></div>
        <div class="levelup-pf-actions">
            <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button type="button" class="levelup-pf-confirm" id="lupfConfirmBtn" disabled>Conferma</button>
        </div>
    </div>`;

    const input = overlay.querySelector('#lupfInput');
    const detail = overlay.querySelector('#lupfDetail');
    const avgBtn = overlay.querySelector('#lupfAvgBtn');
    const rollBtn = overlay.querySelector('#lupfRollBtn');
    const confirmBtn = overlay.querySelector('#lupfConfirmBtn');

    const refreshConfirm = () => {
        const v = parseInt(input.value);
        confirmBtn.disabled = !(Number.isFinite(v) && v >= 1);
    };

    avgBtn.onclick = () => {
        input.value = avgGain;
        detail.textContent = `Tiro medio: ${dieAvg(die)} ${conLabel} COS = ${avgGain} PV`;
        refreshConfirm();
    };
    rollBtn.onclick = () => {
        const roll = 1 + Math.floor(Math.random() * die);
        const total = Math.max(1, roll + conMod);
        input.value = total;
        detail.textContent = `1d${die} = ${roll} ${conLabel} COS = ${total} PV`;
        refreshConfirm();
    };
    input.addEventListener('input', () => {
        // Se l'utente edita a mano, rimuovi il dettaglio (non corrisponde piu' al calcolo automatico).
        if (detail.textContent && !detail.dataset.locked) detail.textContent = '';
        refreshConfirm();
    });
    confirmBtn.onclick = async () => {
        const pvGain = parseInt(input.value);
        if (!Number.isFinite(pvGain) || pvGain < 1) return;
        const extra = detail.textContent ? ` (${detail.textContent})` : '';
        overlay.remove();
        await _doLevelUp(pgId, classIdx, pvGain, extra, opts);
    };

    document.body.appendChild(overlay);
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

async function _doLevelUp(pgId, classIdx, pvGain, extraMsg = '', opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const classi = (pg.classi || []).map(c => ({ ...c }));

    let cls;
    let isNewClass = false;
    if (opts && opts.newClassName) {
        // Multiclasse: aggiungo la nuova classe a livello 0 (verra' portata a 1 sotto).
        if (classi.some(c => c.nome === opts.newClassName)) {
            showNotification(`${opts.newClassName} e' gia' una classe del personaggio`);
            return;
        }
        cls = { nome: opts.newClassName, livello: 0 };
        classi.push(cls);
        classIdx = classi.length - 1;
        isNewClass = true;
    } else {
        cls = classi[classIdx];
        if (!cls) return;
    }

    const newLvl = (parseInt(cls.livello) || 0) + 1;
    if (newLvl > 20) { showNotification('Livello massimo raggiunto (20)'); return; }
    cls.livello = newLvl;
    classi[classIdx] = cls;

    const oldPvMax = parseInt(pg.punti_vita_max) || 0;
    const newPvMax = oldPvMax + pvGain;
    const newPvAttuali = (pg.pv_attuali != null ? parseInt(pg.pv_attuali) : oldPvMax) + pvGain;

    // Anche il "Max Reale" cresce del valore registrato al level-up.
    // Se non era ancora stato impostato esplicitamente, viene
    // inizializzato al valore corrente prima del level-up + pvGain
    // (così non assorbe variazioni manuali sul punti_vita_max).
    const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? { ...pg.bonus_manuali } : {};
    const storedReale = parseInt(bm._pv_max_reale);
    const baseReale = (Number.isFinite(storedReale) && storedReale > 0) ? storedReale : oldPvMax;
    bm._pv_max_reale = Math.max(1, baseReale + pvGain);
    pg.bonus_manuali = bm;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    const currentDadi = dadi[cls.nome] != null ? parseInt(dadi[cls.nome]) : (newLvl - 1);
    dadi[cls.nome] = Math.min(newLvl, currentDadi + 1);

    const totalLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);

    // Ricalcola gli slot incantesimo in base al nuovo livello, preservando "used".
    const newAutoSlots = calcSpellSlotsFromClassi(classi);
    const prevSlots = (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') ? pg.slot_incantesimo : {};
    const newSlotIncantesimo = {};
    Object.keys(newAutoSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = newAutoSlots[lvKey];
        const prev = prevSlots[lv] || prevSlots[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used)) ? Math.min(parseInt(prev.used), max) : 0;
        newSlotIncantesimo[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
    });

    // Aggiorna anche il display "classe" per coerenza con la stringa multiclasse.
    const classeDisplay = classi.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const updates = {
        classi,
        classe: classeDisplay,
        livello: totalLevel,
        punti_vita_max: newPvMax,
        pv_attuali: newPvAttuali,
        dadi_vita_disponibili: dadi,
        slot_incantesimo: newSlotIncantesimo,
        bonus_manuali: pg.bonus_manuali,
    };

    pg.classi = classi;
    pg.classe = classeDisplay;
    pg.livello = totalLevel;
    pg.punti_vita_max = newPvMax;
    pg.pv_attuali = newPvAttuali;
    pg.dadi_vita_disponibili = dadi;
    pg.slot_incantesimo = newSlotIncantesimo;

    await schedaInstantSave(pgId, updates);
    if (isNewClass) {
        showNotification(`Aggiunto ${cls.nome} (multiclasse, liv 1) +${pvGain} PV${extraMsg}`);
    } else {
        showNotification(`${cls.nome} salito al livello ${newLvl} (+${pvGain} PV${extraMsg})`);
    }
    await renderSchedaPersonaggio(pgId);
    setTimeout(() => _schedaMaybePromptSubclassAfterLevelUp(pgId, classIdx), 120);
}

async function _schedaMaybePromptSubclassAfterLevelUp(pgId, classIdx) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const classi = Array.isArray(pg.classi) ? pg.classi.map(c => ({ ...c })) : [];
    const cls = classi[classIdx];
    if (!cls || cls.sottoclasse) return;

    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }

    if (typeof _pgUnlockedSubclassOptions !== 'function' || typeof _buildSubclassPickerItems !== 'function') return;
    const level = parseInt(cls.livello) || 1;
    const { opts, hbOpts } = _pgUnlockedSubclassOptions(cls.nome, level);
    if (opts.length === 0 && hbOpts.length === 0) return;

    const items = _buildSubclassPickerItems(opts, hbOpts, level);
    const allOpts = [...opts, ...hbOpts];
    showNotification(`Ora puoi scegliere la sottoclasse di ${cls.nome}`);
    openCustomSelect(items, async (value) => {
        if (value === '__none__') return;
        const selected = allOpts.find(o => o.slug === value);
        if (!selected) return;

        const currentPg = _schedaPgCache;
        const nextClassi = Array.isArray(currentPg?.classi)
            ? currentPg.classi.map(c => ({ ...c }))
            : classi;
        const target = nextClassi[classIdx];
        if (!target) return;

        target.sottoclasse = selected.name;
        target.sottoclasseSlug = selected.slug;
        if (selected.isHomebrew) {
            target.sottoclasse_homebrew_id = selected._hbId;
            if (selected._hbAuthor) target.sottoclasse_homebrew_author = selected._hbAuthor;
            target.thirdCaster = false;
        } else {
            delete target.sottoclasse_homebrew_id;
            delete target.sottoclasse_homebrew_author;
            target.thirdCaster = isThirdCasterSubclass(selected.slug, selected.name);
        }

        const classeDisplay = nextClassi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        const slotIncantesimo = typeof pgRebuildSlotsForClassi === 'function'
            ? pgRebuildSlotsForClassi(nextClassi, currentPg?.slot_incantesimo || {})
            : (currentPg?.slot_incantesimo || {});
        await schedaInstantSave(pgId, {
            classi: nextClassi,
            classe: classeDisplay,
            slot_incantesimo: slotIncantesimo,
        });
        if (_schedaPgCache?.id === pgId) {
            _schedaPgCache.classi = nextClassi;
            _schedaPgCache.classe = classeDisplay;
            _schedaPgCache.slot_incantesimo = slotIncantesimo;
        }
        showNotification(`Sottoclasse scelta: ${selected.name}`);
        renderSchedaPersonaggio(pgId);
    }, `Sottoclasse di ${cls.nome}`);
}

window.schedaHdChange = function(pgId, className, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let newVal = current + delta;
    if (newVal < 0) newVal = 0;
    if (max != null && newVal > max) newVal = max;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    dadi[className] = newVal;
    pg.dadi_vita_disponibili = dadi;

    const el = document.getElementById(`sHd_${className}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { dadi_vita_disponibili: dadi });
}

window.schedaClassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, max != null ? Math.min(max, current + delta) : current + delta);
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    pg.risorse_classe[key] = newVal;

    const el = document.getElementById(`sCRes_${key}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

// Cambio current per le risorse di sottoclasse (counter / dice_pool / ward_pool).
// Persistite in pg.risorse_classe._subclass[key].
window.schedaSubclassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._subclass) pg.risorse_classe._subclass = {};
    pg.risorse_classe._subclass[key] = newVal;
    const el = document.getElementById(`sSubRes_${key}`);
    if (el) {
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

// Click su uno slot Portento: se vuoto chiede il valore (1-20),
// se pieno offre di "spendere" (svuotare) il dado salvato.
window.schedaPortentSlotClick = async function(pgId, key, idx, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    const cur = arr[idx];
    if (cur != null && cur >= 1 && cur <= 20) {
        // Pieno → conferma "spendi" con dialog custom (no browser confirm).
        const ok = await _schedaShowConfirmDialog({
            title: 'Spendere il Portento?',
            message: `Vuoi spendere il dado salvato con valore ${cur}?`,
            confirmLabel: 'Spendi',
            cancelLabel: 'Annulla',
            danger: true,
        });
        if (ok) {
            arr[idx] = null;
            await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
            openSchedaPersonaggio(pgId);
        }
    } else {
        // Vuoto → input valore (tastierino numerico custom, niente keyboard nativa).
        const n = await _schedaShowNumpadDialog({
            title: `Portento - Slot ${idx + 1}`,
            initial: '',
            min: 1,
            max: 20,
        });
        if (n == null) return;
        arr[idx] = n;
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        openSchedaPersonaggio(pgId);
    }
};

// Tira tutti gli slot Portento ancora vuoti (utile al riposo lungo).
window.schedaPortentRollAll = async function(pgId, key, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    for (let i = 0; i < max; i++) {
        if (arr[i] == null) arr[i] = 1 + Math.floor(Math.random() * 20);
    }
    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    openSchedaPersonaggio(pgId);
};

// Apre l'editor per una risorsa di classe (auto-derivata): permette di
// sovrascrivere il nome e il valore massimo. Gli override sono
// memorizzati in pg.risorse_classe._overrides[key] e applicati al
// rendering. "Reset" li rimuove riportando i valori di default.
window.schedaOpenEditClassRes = function(pgId, key, defaultName, defaultMax) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const overrides = (pg.risorse_classe && pg.risorse_classe._overrides && pg.risorse_classe._overrides[key]) || {};
    const curNome = overrides.nome || defaultName || '';
    const curMax = (typeof overrides.max === 'number' && overrides.max > 0) ? overrides.max : defaultMax;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Modifica risorsa</h3>
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Nome (opzionale)</label>
        <input type="text" id="schedaCResNome" class="hp-calc-input" value="${escapeHtml(curNome)}" placeholder="${escapeHtml(defaultName || '')}">
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Massimo</label>
        <input type="number" id="schedaCResMax" class="hp-calc-input" value="${curMax}" min="1" max="99">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">Default: ${escapeHtml(defaultName || '')} / ${defaultMax}</div>
        <div class="dialog-actions">
            <button class="btn-secondary" id="schedaCResReset" style="background:#a55;color:#fff;border-color:#a55;">Reset</button>
            <button class="btn-secondary" id="schedaCResCancel">Annulla</button>
            <button class="btn-primary" id="schedaCResSave">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('schedaCResCancel').onclick = close;
    document.getElementById('schedaCResReset').onclick = async () => {
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        delete pg.risorse_classe._overrides[key];
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    document.getElementById('schedaCResSave').onclick = async () => {
        const nome = (document.getElementById('schedaCResNome').value || '').trim();
        const maxRaw = parseInt(document.getElementById('schedaCResMax').value, 10);
        const maxVal = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        const ov = {};
        if (nome && nome !== defaultName) ov.nome = nome;
        if (maxVal && maxVal !== defaultMax) ov.max = maxVal;
        if (Object.keys(ov).length === 0) {
            delete pg.risorse_classe._overrides[key];
        } else {
            pg.risorse_classe._overrides[key] = ov;
        }
        // Se il max e' cambiato, clamp del current
        if (maxVal && pg.risorse_classe[key] != null && pg.risorse_classe[key] > maxVal) {
            pg.risorse_classe[key] = maxVal;
        }
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
};

window.schedaRaceResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._race) pg.risorse_classe._race = {};
    pg.risorse_classe._race[key] = newVal;
    const el = document.getElementById(`sRRes_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInnateSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._innate) pg.risorse_classe._innate = {};
    pg.risorse_classe._innate[key] = newVal;
    const el = document.getElementById(`sInnSlot_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInvocationSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._invocations) pg.risorse_classe._invocations = {};
    pg.risorse_classe._invocations[key] = newVal;
    // Lo stesso slot puo' essere mostrato sia in pagina incantesimi
    // (sInvSlot_) sia nelle risorse di pagina 1 (sInvRes_): aggiorniamo
    // entrambe le viste.
    [`sInvSlot_${key}`, `sInvRes_${key}`].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    });
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaCustomResChange = function(pgId, index, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];
    const cr = pg.risorse_classe._custom[index];
    if (!cr) return;
    cr.current = newVal;

    const el = document.getElementById(`sCusRes_${index}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},1,${max})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

window.schedaOpenAddCustomRes = function(pgId, editIndex) {
    // editIndex opzionale: se passato, modifica una risorsa custom esistente
    const pg = _schedaPgCache;
    const editing = (editIndex != null && editIndex >= 0);
    const existing = editing ? (pg?.risorse_classe?._custom?.[editIndex] || null) : null;

    const initialType = (existing && existing.tipo === 'dadi') ? 'dadi' : 'punti';
    const initialDado = (existing && existing.dado) ? existing.dado : 'd8';
    const initialNome = existing ? (existing.nome || '') : '';
    const initialMax  = existing && Number.isFinite(parseInt(existing.max)) ? parseInt(existing.max) : 1;

    const dadiBtns = ['d4','d6','d8','d10','d12','d20'].map(d =>
        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === initialDado ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
    ).join('');

    const confirmFn = editing
        ? `schedaConfirmCustomRes('${pgId}', ${editIndex})`
        : `schedaConfirmCustomRes('${pgId}')`;
    const deleteBtn = editing
        ? `<button type="button" class="btn-danger" onclick="schedaDeleteCustomResFromEdit('${pgId}',${editIndex})">Elimina</button>`
        : '';

    const modalHtml = `
    <div class="modal active" id="customResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="schedaCloseCustomResModal()">&times;</button>
            <h2>${editing ? 'Modifica Risorsa' : 'Aggiungi Risorsa'}</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="customResNome" class="form-input" placeholder="Es. Dadi di Superiorità" value="${escapeHtml(initialNome)}">
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="custom-res-type-row">
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'punti' ? 'active' : ''}" id="crTypePunti" onclick="schedaCrTypeSelect('punti')">Punti</button>
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'dadi'  ? 'active' : ''}" id="crTypeDadi" onclick="schedaCrTypeSelect('dadi')">Dadi</button>
                </div>
            </div>
            <div class="form-group" id="crDadoGroup" style="display:${initialType === 'dadi' ? '' : 'none'};">
                <label class="form-label">Tipo di dado</label>
                <div class="custom-res-dice-row">${dadiBtns}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Utilizzi massimi</label>
                <input type="number" id="customResMax" class="form-input" min="1" value="${initialMax}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>${deleteBtn}</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary" onclick="schedaCloseCustomResModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="${confirmFn}">${editing ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = initialType;
    window._crDado = initialDado;
}

window.schedaCrTypeSelect = function(tipo) {
    window._crType = tipo;
    document.getElementById('crTypePunti')?.classList.toggle('active', tipo === 'punti');
    document.getElementById('crTypeDadi')?.classList.toggle('active', tipo === 'dadi');
    document.getElementById('crDadoGroup').style.display = tipo === 'dadi' ? '' : 'none';
}

window.schedaCrDadoSelect = function(dado) {
    window._crDado = dado;
    document.querySelectorAll('.custom-res-dice-btn').forEach(b => b.classList.toggle('active', b.textContent === dado));
}

window.schedaConfirmCustomRes = async function(pgId, editIndex) {
    const nome = document.getElementById('customResNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('customResMax')?.value) || 1;
    const tipo = window._crType || 'punti';

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];

    const editing = (editIndex != null && editIndex >= 0 && pg.risorse_classe._custom[editIndex]);
    if (editing) {
        // Modifica preservando il "current" (clampato al nuovo max).
        const prev = pg.risorse_classe._custom[editIndex];
        const prevCurrent = Number.isFinite(parseInt(prev.current)) ? parseInt(prev.current) : max;
        const updated = { nome, tipo, max, current: Math.max(0, Math.min(prevCurrent, max)) };
        if (tipo === 'dadi') updated.dado = window._crDado || 'd8';
        pg.risorse_classe._custom[editIndex] = updated;
    } else {
        const newRes = { nome, tipo, max, current: max };
        if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';
        pg.risorse_classe._custom.push(newRes);
    }

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    schedaCloseCustomResModal();

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification(editing ? 'Risorsa aggiornata' : 'Risorsa aggiunta');
}

window.schedaDeleteCustomResFromEdit = async function(pgId, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare risorsa?',
        message: 'La risorsa verra\' eliminata definitivamente.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    schedaCloseCustomResModal();
    await schedaDeleteCustomRes(pgId, index);
};

window.schedaDeleteCustomRes = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.risorse_classe?._custom) return;
    pg.risorse_classe._custom.splice(index, 1);

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification('Risorsa rimossa');
}

window.schedaCloseCustomResModal = function() {
    const modal = document.getElementById('customResModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// =====================================================
// EQUIPAGGIAMENTO
// =====================================================
async function _recalcEquipFromStats(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const equip = Array.isArray(pg.equipaggiamento) ? pg.equipaggiamento : [];
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    let equipChanged = false;
    equip.forEach(e => {
        if (e.tipo === 'arma') {
            const armaRef = DND_ARMI.find(a => a.nome === e.nome);
            const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
            const isRanged = armaRef ? armaRef.cat.includes('distanza') : e.proprieta?.some(p => p.includes('Munizioni'));
            const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
            const magic = e.magic_bonus || 0;
            const newColpire = profBonus + atkMod + magic;
            const newDanno = atkMod + magic;
            if (e.bonus_colpire !== newColpire || e.bonus_danno !== newDanno) {
                e.bonus_colpire = newColpire;
                e.bonus_danno = newDanno;
                equipChanged = true;
            }
        }
    });
    const newCA = calcCAFromEquip(pg);
    const caChanged = pg.classe_armatura !== newCA;
    if (caChanged) {
        pg.classe_armatura = newCA;
        const caEl = document.getElementById('schedaCA');
        if (caEl) caEl.textContent = newCA;
    }
    if (equipChanged || caChanged) {
        const updates = { classe_armatura: pg.classe_armatura };
        if (equipChanged) updates.equipaggiamento = pg.equipaggiamento;
        await schedaInstantSave(pgId, updates);
        if (equipChanged) renderSchedaPersonaggio(pgId);
    }
}

function formatEquipName(e) {
    const magic = e.magic_bonus ? ` +${e.magic_bonus}` : '';
    return escapeHtml(e.nome) + magic;
}
