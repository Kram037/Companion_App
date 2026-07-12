// ============================================================================
// CHARACTER SHEET PF MAX MODIFIERS
// ============================================================================
// Loaded after the legacy sheet calculators. It keeps the existing PF max base
// workflow, but replaces the old single positive temporary bonus with a
// persisted list of positive/negative modifiers stored in
// personaggi.bonus_manuali._pv_max_modificatori.

(function initPfMaxModifiersFeature() {
    if (window.__pfMaxModifiersFeatureLoaded) return;
    window.__pfMaxModifiersFeatureLoaded = true;

    const originalOpenHpCalcLive = window.schedaOpenHpCalcLive;
    const originalOpenHpCalc = window.schedaOpenHpCalc;
    const originalBuildBonusManualiPayload = window._buildBonusManualiPayload || (typeof _buildBonusManualiPayload === 'function' ? _buildBonusManualiPayload : null);

    let _pfMaxEditState = null;

    function _assignGlobal(name, fn) {
        window[name] = fn;
        try { globalThis[name] = fn; } catch (_) {}
    }

    function _safeBonusManuali(pg) {
        return (pg?.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
    }

    function _newPfMaxModifierId() {
        return `pfmax_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    function _normalizePfMaxModifier(raw, index = 0) {
        const value = Math.max(-9999, Math.min(9999, parseInt(raw?.valore) || 0));
        if (value === 0) return null;
        return {
            id: String(raw?.id || _newPfMaxModifierId()),
            nome: String(raw?.nome || 'Modificatore PF max').trim().slice(0, 80) || 'Modificatore PF max',
            valore: value,
            durata: String(raw?.durata || raw?.note || '').trim().slice(0, 120),
            created_at: raw?.created_at || new Date(Date.now() + index).toISOString(),
        };
    }

    function _getStoredPfMaxModifiers(pg, { includeLegacy = true } = {}) {
        const bm = _safeBonusManuali(pg);
        const list = Array.isArray(bm._pv_max_modificatori)
            ? bm._pv_max_modificatori.map(_normalizePfMaxModifier).filter(Boolean)
            : [];

        // Compatibilita' con il vecchio singolo bonus positivo.
        const legacyBonus = Math.max(0, parseInt(bm._pv_max_temporaneo) || 0);
        if (includeLegacy && legacyBonus > 0 && !list.some(m => m.id === 'legacy-pvmax-temp')) {
            list.unshift({
                id: 'legacy-pvmax-temp',
                nome: 'Bonus PF max precedente',
                valore: legacyBonus,
                durata: 'Migrato dal vecchio campo bonus',
                created_at: bm._pv_max_temporaneo_created_at || new Date(0).toISOString(),
            });
        }
        return list;
    }

    function schedaGetPvMaxModifiers(pg) {
        return _getStoredPfMaxModifiers(pg);
    }

    function schedaGetPvMaxModifierTotal(pg) {
        return schedaGetPvMaxModifiers(pg).reduce((sum, mod) => sum + (parseInt(mod.valore) || 0), 0);
    }

    function patchedSchedaGetPvMaxTemporaneo(pg) {
        return schedaGetPvMaxModifierTotal(pg);
    }

    function patchedSchedaGetPvMaxEffettivo(pg) {
        const base = Math.max(1, parseInt(pg?.punti_vita_max) || 10);
        return Math.max(1, base + schedaGetPvMaxModifierTotal(pg));
    }

    function _formatPfMaxMod(value) {
        const v = parseInt(value) || 0;
        return v >= 0 ? `+${v}` : `${v}`;
    }

    function _pfMaxModifiersHtml(mods) {
        if (!mods.length) {
            return '<div class="bonus-list-empty">Nessun modificatore PF max. Aggiungi bonus, malus, effetti temporanei o permanenti.</div>';
        }
        return mods.map((mod, idx) => {
            const value = parseInt(mod.valore) || 0;
            const cls = value < 0 ? 'bonus-chip negative' : 'bonus-chip';
            const durata = mod.durata ? `<span class="bonus-chip-tag">${escapeHtml(mod.durata)}</span>` : '';
            return `<button type="button" class="${cls}" onclick="schedaPfMaxModifierEdit(${idx})" title="Modifica modificatore PF max">
                <span class="bonus-chip-name">${escapeHtml(mod.nome)}</span>
                <span class="bonus-chip-val">${_formatPfMaxMod(value)}</span>
                ${durata}
            </button>`;
        }).join('');
    }

    function _renderPfMaxModifierList() {
        const pg = _schedaPgCache;
        if (!pg) return;
        const mods = schedaGetPvMaxModifiers(pg);
        const total = schedaGetPvMaxModifierTotal(pg);
        const effective = patchedSchedaGetPvMaxEffettivo(pg);
        const list = document.getElementById('pfMaxModifierList');
        if (list) list.innerHTML = _pfMaxModifiersHtml(mods);
        const totalEl = document.getElementById('hpCalcModifierTotal');
        if (totalEl) totalEl.textContent = _formatPfMaxMod(total);
        const effectiveEl = document.getElementById('hpCalcEffectiveMax');
        if (effectiveEl) effectiveEl.textContent = effective;
        const hint = document.getElementById('pfMaxModifierHint');
        if (hint) {
            hint.textContent = total === 0
                ? 'Nessun modificatore attivo.'
                : `Totale modificatori PF max: ${_formatPfMaxMod(total)}.`;
        }
        patchedSchedaUpdateHpDisplays(pg);
    }

    function patchedSchedaUpdateHpDisplays(pg) {
        if (!pg) return;
        const baseMax = Math.max(1, parseInt(pg.punti_vita_max) || 10);
        const modTotal = schedaGetPvMaxModifierTotal(pg);
        const effectiveMax = patchedSchedaGetPvMaxEffettivo(pg);
        const pvMaxEl = document.getElementById('schedaPvMax');
        if (pvMaxEl) {
            pvMaxEl.textContent = effectiveMax;
            pvMaxEl.dataset.pfBase = String(baseMax);
            pvMaxEl.dataset.pfMaxTemp = String(modTotal);
            pvMaxEl.classList.toggle('pv-max-temp', modTotal !== 0);
        }
        const pvAttualiEl = document.getElementById('schedaPvAttuali');
        if (pvAttualiEl) {
            const current = pg.pv_attuali != null ? parseInt(pg.pv_attuali) || 0 : effectiveMax;
            pvAttualiEl.textContent = Math.min(effectiveMax, Math.max(0, current));
        }
        const pvTempEl = document.getElementById('schedaPvTemp');
        if (pvTempEl) pvTempEl.textContent = pg.pv_temporanei || 0;
    }

    async function _savePfMaxState({ baseMax = null, modifiers = null, notify = '' } = {}) {
        const pg = _schedaPgCache;
        if (!pg) return false;
        const bm = { ..._safeBonusManuali(pg) };

        if (baseMax != null) {
            const parsedBase = Math.max(1, parseInt(baseMax) || 1);
            pg.punti_vita_max = parsedBase;
            bm._pv_max_reale = parsedBase;
        }

        if (modifiers) {
            const cleaned = modifiers.map(_normalizePfMaxModifier).filter(Boolean);
            if (cleaned.length) bm._pv_max_modificatori = cleaned;
            else delete bm._pv_max_modificatori;
            // Il vecchio campo singolo viene assorbito dalla lista.
            delete bm._pv_max_temporaneo;
        }

        pg.bonus_manuali = bm;
        const effectiveMax = patchedSchedaGetPvMaxEffettivo(pg);
        const curPv = pg.pv_attuali != null ? parseInt(pg.pv_attuali) || 0 : effectiveMax;
        const clampedPv = Math.min(effectiveMax, Math.max(0, curPv));
        pg.pv_attuali = clampedPv;

        patchedSchedaUpdateHpDisplays(pg);
        _renderPfMaxModifierList();

        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase.from('personaggi').update({
                punti_vita_max: pg.punti_vita_max,
                pv_attuali: clampedPv,
                bonus_manuali: pg.bonus_manuali,
                updated_at: new Date().toISOString(),
            }).eq('id', pg.id || _hpCalcState?.pgId);
            if (error) {
                showNotification?.('Errore salvataggio modificatori PF max: ' + (error.message || error));
                return false;
            }
        }

        if (notify) showNotification?.(notify);
        return true;
    }

    function _openPfMaxDialog(pgId) {
        const pg = _schedaPgCache;
        if (!pg) return;
        const baseMax = Math.max(1, parseInt(pg.punti_vita_max) || 10);
        const mods = schedaGetPvMaxModifiers(pg);
        const total = schedaGetPvMaxModifierTotal(pg);
        const effective = patchedSchedaGetPvMaxEffettivo(pg);

        _hpCalcState = {
            pgId,
            field: 'punti_vita_max',
            currentVal: baseMax,
            maxVal: -1,
            inputBuffer: '0',
            hasInput: false,
            maxBase: baseMax,
        };

        document.getElementById('hpCalcOverlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'hpCalcOverlay';
        overlay.className = 'hp-calc-overlay';
        overlay.innerHTML = `
            <div class="hp-calc-modal bonus-list-modal">
                <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
                <div class="hp-calc-title">Punti Ferita Massimi</div>
                <div class="hp-calc-max-row">
                    <button type="button" class="hp-calc-max-box hp-calc-max-choice selected" id="hpCalcMaxBaseBox" title="Usa il tastierino e conferma per cambiare i PF max base">
                        <strong id="hpCalcCurrent">${baseMax}</strong>
                        <span>PF max base</span>
                    </button>
                    <div class="hp-calc-max-box" title="Somma dei modificatori PF max attivi">
                        <strong id="hpCalcModifierTotal">${_formatPfMaxMod(total)}</strong>
                        <span>Modificatori</span>
                    </div>
                </div>
                <div class="hp-calc-hint">Massimo effettivo: <strong id="hpCalcEffectiveMax">${effective}</strong> PF</div>
                <div class="bonus-list-section">
                    <div class="bonus-list-header">
                        <label class="bonus-modal-label">Mod. PF max</label>
                        <span class="bonus-list-total-label" id="pfMaxModifierHint">${total === 0 ? 'Nessun modificatore attivo.' : `Totale: ${_formatPfMaxMod(total)}`}</span>
                    </div>
                    <div id="pfMaxModifierList" class="bonus-list-container">${_pfMaxModifiersHtml(mods)}</div>
                    <button type="button" class="bonus-list-add-btn" onclick="schedaPfMaxModifierAdd()">+ Aggiungi mod. PF max</button>
                    <div class="bonus-modal-hint">Usa modificatori separati per effetti diversi: talenti, maledizioni, incantesimi, condizioni temporanee o bonus permanenti.</div>
                </div>
                <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
                <div class="hp-calc-numpad">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('${n}')">${n}</button>`).join('')}
                    <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                    <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                    <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
                </div>
                <div class="hp-calc-buttons">
                    <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaPfMaxSetBase()">Conferma PF max base</button>
                </div>
                <div class="hp-calc-buttons hp-calc-buttons-extra">
                    <button class="hp-calc-btn neutral hp-calc-btn-full" onclick="schedaOpenPfHistory()">Storico PF</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window.schedaPfMaxSetBase = async function() {
        if (!_hpCalcState || _hpCalcState.field !== 'punti_vita_max') return;
        const pg = _schedaPgCache;
        if (!pg) return;
        const typed = parseInt(_hpCalcState.inputBuffer) || 0;
        if (!_hpCalcState.hasInput || typed <= 0) {
            showNotification?.('Digita un valore PF max base valido');
            return;
        }
        const baseMax = Math.max(1, typed);
        _hpCalcState.currentVal = baseMax;
        _hpCalcState.maxBase = baseMax;
        _hpCalcState.inputBuffer = '0';
        _hpCalcState.hasInput = false;
        const current = document.getElementById('hpCalcCurrent');
        if (current) current.textContent = baseMax;
        const amount = document.getElementById('hpCalcAmountDisplay');
        if (amount) amount.textContent = '0';
        await _savePfMaxState({ baseMax, notify: 'PF max base aggiornati' });
    };

    window.schedaPfMaxModifierAdd = function() {
        _pfMaxEditState = { isNew: true, itemIdx: -1, item: { nome: '', valore: 1, durata: '' } };
        _renderPfMaxModifierEditor();
    };

    window.schedaPfMaxModifierEdit = function(index) {
        const pg = _schedaPgCache;
        if (!pg) return;
        const mods = schedaGetPvMaxModifiers(pg);
        const item = mods[index];
        if (!item) return;
        _pfMaxEditState = { isNew: false, itemIdx: index, item: { ...item } };
        _renderPfMaxModifierEditor();
    };

    function _renderPfMaxModifierEditor() {
        document.getElementById('pfMaxModifierEditOverlay')?.remove();
        if (!_pfMaxEditState) return;
        const item = _pfMaxEditState.item || {};
        const rawValue = parseInt(item.valore) || 1;
        const sign = rawValue < 0 ? 'negative' : 'positive';
        const amount = Math.abs(rawValue) || 1;
        const title = _pfMaxEditState.isNew ? 'Aggiungi mod. PF max' : 'Modifica mod. PF max';
        const deleteBtn = _pfMaxEditState.isNew ? '' : '<button class="hp-calc-btn dmg" onclick="schedaPfMaxModifierDelete()">Elimina</button>';
        const overlay = document.createElement('div');
        overlay.id = 'pfMaxModifierEditOverlay';
        overlay.className = 'hp-calc-overlay bonus-edit-overlay';
        overlay.onclick = event => { if (event.target === overlay) schedaPfMaxModifierEditorClose(); };
        overlay.innerHTML = `
            <div class="hp-calc-modal bonus-edit-modal">
                <button class="hp-calc-close" onclick="schedaPfMaxModifierEditorClose()">&times;</button>
                <div class="hp-calc-title">${title}</div>
                <div class="bonus-edit-field">
                    <label>Nome / fonte</label>
                    <input type="text" id="pfMaxModName" value="${escapeHtml(item.nome || '')}" placeholder="Es. Aiuto, Maledizione, Talento" maxlength="80">
                </div>
                <div class="bonus-edit-field">
                    <label>Segno</label>
                    <div class="bonus-edit-scope">
                        <label class="bonus-edit-scope-opt ${sign === 'positive' ? 'selected' : ''}">
                            <input type="radio" name="pfMaxModSign" value="positive" ${sign === 'positive' ? 'checked' : ''} onchange="schedaPfMaxModifierSetSign('positive')">
                            <span>Bonus (+)</span>
                        </label>
                        <label class="bonus-edit-scope-opt ${sign === 'negative' ? 'selected' : ''}">
                            <input type="radio" name="pfMaxModSign" value="negative" ${sign === 'negative' ? 'checked' : ''} onchange="schedaPfMaxModifierSetSign('negative')">
                            <span>Malus (−)</span>
                        </label>
                    </div>
                </div>
                <div class="bonus-edit-field">
                    <label>Valore</label>
                    <div class="bonus-edit-val-row">
                        <button type="button" class="bonus-modal-step" onclick="schedaPfMaxModifierStep(-1)">−</button>
                        <input type="number" id="pfMaxModValue" value="${amount}" min="1" step="1">
                        <button type="button" class="bonus-modal-step" onclick="schedaPfMaxModifierStep(1)">+</button>
                    </div>
                </div>
                <div class="bonus-edit-field">
                    <label>Durata / note</label>
                    <input type="text" id="pfMaxModDuration" value="${escapeHtml(item.durata || '')}" placeholder="Es. 8 ore, fino al riposo, permanente" maxlength="120">
                </div>
                <div class="hp-calc-buttons bonus-edit-buttons">
                    ${deleteBtn}
                    <button class="hp-calc-btn heal" onclick="schedaPfMaxModifierSave()">Salva</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('pfMaxModName')?.focus(), 50);
    }

    window.schedaPfMaxModifierSetSign = function(sign) {
        document.querySelectorAll('#pfMaxModifierEditOverlay .bonus-edit-scope-opt').forEach(el => {
            const input = el.querySelector('input');
            el.classList.toggle('selected', input?.value === sign);
        });
    };

    window.schedaPfMaxModifierStep = function(delta) {
        const input = document.getElementById('pfMaxModValue');
        if (!input) return;
        input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
    };

    window.schedaPfMaxModifierEditorClose = function() {
        document.getElementById('pfMaxModifierEditOverlay')?.remove();
        _pfMaxEditState = null;
    };

    window.schedaPfMaxModifierSave = async function() {
        const pg = _schedaPgCache;
        if (!pg || !_pfMaxEditState) return;
        const name = (document.getElementById('pfMaxModName')?.value || '').trim().slice(0, 80) || 'Modificatore PF max';
        const amount = Math.max(1, parseInt(document.getElementById('pfMaxModValue')?.value) || 1);
        const sign = document.querySelector('input[name="pfMaxModSign"]:checked')?.value === 'negative' ? -1 : 1;
        const durata = (document.getElementById('pfMaxModDuration')?.value || '').trim().slice(0, 120);
        const mods = schedaGetPvMaxModifiers(pg).filter(m => m.id !== 'legacy-pvmax-temp');
        const item = {
            id: _pfMaxEditState.item?.id && _pfMaxEditState.item.id !== 'legacy-pvmax-temp' ? _pfMaxEditState.item.id : _newPfMaxModifierId(),
            nome: name,
            valore: amount * sign,
            durata,
            created_at: _pfMaxEditState.item?.created_at || new Date().toISOString(),
        };
        if (_pfMaxEditState.isNew) mods.push(item);
        else mods[_pfMaxEditState.itemIdx] = item;
        schedaPfMaxModifierEditorClose();
        await _savePfMaxState({ modifiers: mods, notify: 'Modificatori PF max aggiornati' });
    };

    window.schedaPfMaxModifierDelete = async function() {
        const pg = _schedaPgCache;
        if (!pg || !_pfMaxEditState || _pfMaxEditState.isNew) { schedaPfMaxModifierEditorClose(); return; }
        const mods = schedaGetPvMaxModifiers(pg).filter(m => m.id !== 'legacy-pvmax-temp');
        mods.splice(_pfMaxEditState.itemIdx, 1);
        schedaPfMaxModifierEditorClose();
        await _savePfMaxState({ modifiers: mods, notify: 'Modificatore PF max rimosso' });
    };

    function patchedOpenHpCalcLive(pgId, field) {
        if (field === 'punti_vita_max') return _openPfMaxDialog(pgId);
        return originalOpenHpCalcLive ? originalOpenHpCalcLive.apply(this, arguments) : undefined;
    }

    function patchedOpenHpCalc(pgId, field, currentVal, maxVal) {
        if (field === 'punti_vita_max') return _openPfMaxDialog(pgId);
        return originalOpenHpCalc ? originalOpenHpCalc.apply(this, arguments) : undefined;
    }

    // Preserve PF max modifiers and PF history when legacy bonus dialogs rebuild
    // bonus_manuali for CA / saves / caster bonuses.
    function patchedBuildBonusManualiPayload(parsed) {
        const current = (_schedaPgCache?.bonus_manuali && typeof _schedaPgCache.bonus_manuali === 'object')
            ? { ..._schedaPgCache.bonus_manuali }
            : {};
        return {
            ...current,
            ca: parsed.ca || [],
            incantatori: parsed.incantatori || {},
            tiri_salvezza: parsed.tiri_salvezza || {},
            spells_prepared_max: parsed.spells_prepared_max || 0,
        };
    }

    _assignGlobal('schedaGetPvMaxModifiers', schedaGetPvMaxModifiers);
    _assignGlobal('schedaGetPvMaxModifierTotal', schedaGetPvMaxModifierTotal);
    _assignGlobal('schedaGetPvMaxTemporaneo', patchedSchedaGetPvMaxTemporaneo);
    _assignGlobal('schedaGetPvMaxEffettivo', patchedSchedaGetPvMaxEffettivo);
    _assignGlobal('schedaUpdateHpDisplays', patchedSchedaUpdateHpDisplays);
    _assignGlobal('schedaOpenHpCalcLive', patchedOpenHpCalcLive);
    _assignGlobal('schedaOpenHpCalc', patchedOpenHpCalc);
    _assignGlobal('_buildBonusManualiPayload', patchedBuildBonusManualiPayload);

    // Keep a handle for debugging without changing the public API.
    window.__pfMaxModifiersFeature = {
        originalOpenHpCalcLive,
        originalOpenHpCalc,
        originalBuildBonusManualiPayload,
    };
})();
