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

    function _ensurePfMaxStyles() {
        if (document.getElementById('pfMaxModifiersStyles')) return;
        const style = document.createElement('style');
        style.id = 'pfMaxModifiersStyles';
        style.textContent = `
            .hp-calc-modal.pf-max-modal {
                width: min(560px, 94vw);
                max-width: 94vw;
                max-height: calc(100dvh - 84px);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                gap: 9px;
                padding: 18px 16px 14px;
                box-sizing: border-box;
            }
            .pf-max-modal .hp-calc-title { margin-bottom: 2px; }
            .pf-max-main-scroll {
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                gap: 9px;
                padding-right: 2px;
            }
            .pf-max-summary-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 8px;
            }
            .pf-max-summary-card {
                min-width: 0;
                padding: 9px 6px 8px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: rgba(255,255,255,0.04);
                color: var(--text);
                text-align: center;
                box-sizing: border-box;
            }
            button.pf-max-summary-card {
                cursor: pointer;
                font-family: inherit;
            }
            button.pf-max-summary-card:hover {
                border-color: var(--accent);
                background: rgba(var(--accent-rgb, 139,92,246), 0.12);
            }
            .pf-max-summary-card strong {
                display: block;
                font-size: clamp(1.18rem, 7vw, 1.7rem);
                line-height: 1;
                margin-bottom: 4px;
                color: var(--accent);
            }
            .pf-max-summary-card span {
                display: block;
                min-height: 2.1em;
                font-size: 0.62rem;
                line-height: 1.05;
                color: var(--text-secondary, #bbb);
                text-transform: uppercase;
                letter-spacing: 0.04em;
                font-weight: 800;
            }
            .pf-max-effective-card {
                border-color: color-mix(in srgb, var(--accent) 70%, var(--border));
                background: rgba(var(--accent-rgb, 139,92,246), 0.10);
            }
            .pf-max-modal .bonus-list-section { margin-top: 0; }
            .pf-max-modal .bonus-list-header { margin-bottom: 5px; }
            .pf-max-modal .bonus-list-total-label { white-space: normal; text-align: right; }
            .pf-max-modal .bonus-list-container {
                max-height: min(22dvh, 130px);
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 0;
                padding-right: 2px;
            }
            .pf-max-modal .bonus-list-empty {
                width: 100%;
                padding: 8px 10px;
                font-size: 0.78rem;
            }
            .pf-max-actions-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                align-items: stretch;
            }
            .pf-max-actions-row .bonus-list-add-btn,
            .pf-max-actions-row .hp-calc-btn {
                width: 100%;
                margin: 0;
                padding: 9px 8px;
                min-height: 40px;
                font-size: 0.82rem;
                line-height: 1.1;
            }
            .pf-max-compact-hint {
                margin: 0;
                font-size: 0.72rem;
                line-height: 1.25;
                color: var(--text-light, #888);
                text-align: center;
            }
            .pf-max-base-editor[hidden] { display: none !important; }
            .pf-max-base-editor {
                border-top: 1px solid var(--border);
                padding-top: 8px;
                display: flex;
                flex-direction: column;
                gap: 7px;
            }
            .pf-max-base-editor .hp-calc-input-display {
                margin: 0;
                min-height: 40px;
                padding: 8px 10px;
                font-size: 1.35rem;
            }
            .pf-max-base-editor .hp-calc-numpad,
            .pf-max-value-keypad {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 6px;
            }
            .pf-max-base-editor .hp-calc-numpad-btn,
            .pf-max-value-keypad .hp-calc-numpad-btn {
                min-height: 36px;
                height: 36px;
                padding: 0;
                font-size: 1rem;
            }
            .pf-max-base-editor .hp-calc-buttons { margin-top: 0; }
            .pf-max-base-editor .hp-calc-btn { padding: 9px 10px; }
            .pf-max-sign-row {
                display: grid !important;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            .pf-max-sign-row .bonus-edit-scope-opt {
                justify-content: center;
                padding: 10px 8px;
                text-align: center;
            }
            .pf-max-value-display {
                min-width: 112px;
                min-height: 42px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--surface);
                color: var(--text);
                font: inherit;
                font-size: 1.25rem;
                font-weight: 800;
                text-align: center;
                cursor: pointer;
            }
            .pf-max-value-display:hover,
            .pf-max-value-display.active {
                border-color: var(--accent);
                background: rgba(var(--accent-rgb, 139,92,246), 0.12);
            }
            .pf-max-value-keypad[hidden] { display: none !important; }
            .pf-max-value-keypad { margin-top: 8px; }
            .pf-max-edit-modal .bonus-edit-field { margin: 9px 0; }
            @media (max-width: 380px) {
                .hp-calc-modal.pf-max-modal { padding: 16px 12px 12px; gap: 7px; }
                .pf-max-summary-grid { gap: 6px; }
                .pf-max-summary-card { padding: 8px 4px 7px; }
                .pf-max-actions-row { gap: 6px; }
            }
        `;
        document.head.appendChild(style);
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

    function _getEditablePfMaxModifiers(pg) {
        return schedaGetPvMaxModifiers(pg).map((mod) => {
            if (mod.id !== 'legacy-pvmax-temp') return { ...mod };
            return { ...mod, id: _newPfMaxModifierId(), created_at: new Date().toISOString() };
        });
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
                : `Totale: ${_formatPfMaxMod(total)}`;
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
        _ensurePfMaxStyles();
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
            <div class="hp-calc-modal pf-max-modal">
                <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
                <div class="hp-calc-title">Punti Ferita Massimi</div>
                <div class="pf-max-summary-grid">
                    <button type="button" class="pf-max-summary-card" onclick="schedaPfMaxToggleBaseEditor()" title="Modifica PF max base">
                        <strong id="hpCalcCurrent">${baseMax}</strong>
                        <span>PF max base</span>
                    </button>
                    <div class="pf-max-summary-card" title="Somma dei modificatori PF max attivi">
                        <strong id="hpCalcModifierTotal">${_formatPfMaxMod(total)}</strong>
                        <span>Modificatori</span>
                    </div>
                    <div class="pf-max-summary-card pf-max-effective-card">
                        <strong id="hpCalcEffectiveMax">${effective}</strong>
                        <span>Massimo effettivo</span>
                    </div>
                </div>
                <div class="pf-max-main-scroll">
                    <div class="bonus-list-section">
                        <div class="bonus-list-header">
                            <label class="bonus-modal-label">Mod. PF max</label>
                            <span class="bonus-list-total-label" id="pfMaxModifierHint">${total === 0 ? 'Nessun modificatore attivo.' : `Totale: ${_formatPfMaxMod(total)}`}</span>
                        </div>
                        <div id="pfMaxModifierList" class="bonus-list-container">${_pfMaxModifiersHtml(mods)}</div>
                    </div>
                    <div class="pf-max-actions-row">
                        <button type="button" class="bonus-list-add-btn" onclick="schedaPfMaxModifierAdd()">+ Aggiungi mod.</button>
                        <button class="hp-calc-btn neutral" onclick="schedaOpenPfHistory()">Storico PF</button>
                    </div>
                    <p class="pf-max-compact-hint">Tocca PF max base per modificarlo. I modificatori restano separati e possono essere bonus o malus.</p>
                    <div class="pf-max-base-editor" id="pfMaxBaseEditor" hidden>
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
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window.schedaPfMaxToggleBaseEditor = function() {
        const editor = document.getElementById('pfMaxBaseEditor');
        if (!editor) return;
        const shouldShow = editor.hasAttribute('hidden');
        editor.toggleAttribute('hidden', !shouldShow);
        if (shouldShow) {
            _hpCalcState.inputBuffer = '0';
            _hpCalcState.hasInput = false;
            const display = document.getElementById('hpCalcAmountDisplay');
            if (display) display.textContent = '0';
            setTimeout(() => editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
        }
    };

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
        document.getElementById('pfMaxBaseEditor')?.setAttribute('hidden', '');
        await _savePfMaxState({ baseMax, notify: 'PF max base aggiornati' });
    };

    window.schedaPfMaxModifierAdd = function() {
        _pfMaxEditState = { isNew: true, itemIdx: -1, item: { nome: '', valore: 1, durata: '' }, valueBuffer: '1' };
        _renderPfMaxModifierEditor();
    };

    window.schedaPfMaxModifierEdit = function(index) {
        const pg = _schedaPgCache;
        if (!pg) return;
        const mods = schedaGetPvMaxModifiers(pg);
        const item = mods[index];
        if (!item) return;
        _pfMaxEditState = { isNew: false, itemIdx: index, item: { ...item }, valueBuffer: String(Math.abs(parseInt(item.valore) || 1)) };
        _renderPfMaxModifierEditor();
    };

    function _renderPfMaxModifierEditor() {
        document.getElementById('pfMaxModifierEditOverlay')?.remove();
        if (!_pfMaxEditState) return;
        _ensurePfMaxStyles();
        const item = _pfMaxEditState.item || {};
        const rawValue = parseInt(item.valore) || 1;
        const sign = rawValue < 0 ? 'negative' : 'positive';
        const amount = Math.abs(parseInt(_pfMaxEditState.valueBuffer || rawValue) || 1);
        _pfMaxEditState.valueBuffer = String(amount);
        const title = _pfMaxEditState.isNew ? 'Aggiungi mod. PF max' : 'Modifica mod. PF max';
        const deleteBtn = _pfMaxEditState.isNew ? '' : '<button class="hp-calc-btn dmg" onclick="schedaPfMaxModifierDelete()">Elimina</button>';
        const overlay = document.createElement('div');
        overlay.id = 'pfMaxModifierEditOverlay';
        overlay.className = 'hp-calc-overlay bonus-edit-overlay';
        overlay.onclick = event => { if (event.target === overlay) schedaPfMaxModifierEditorClose(); };
        overlay.innerHTML = `
            <div class="hp-calc-modal bonus-edit-modal pf-max-edit-modal">
                <button class="hp-calc-close" onclick="schedaPfMaxModifierEditorClose()">&times;</button>
                <div class="hp-calc-title">${title}</div>
                <div class="bonus-edit-field">
                    <label>Nome / fonte</label>
                    <input type="text" id="pfMaxModName" value="${escapeHtml(item.nome || '')}" placeholder="Es. Aiuto, Maledizione, Talento" maxlength="80">
                </div>
                <div class="bonus-edit-field">
                    <label>Segno</label>
                    <div class="bonus-edit-scope pf-max-sign-row">
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
                        <button type="button" id="pfMaxModValueDisplay" class="pf-max-value-display" onclick="schedaPfMaxModifierToggleKeypad()">${amount}</button>
                        <button type="button" class="bonus-modal-step" onclick="schedaPfMaxModifierStep(1)">+</button>
                    </div>
                    <div id="pfMaxModKeypad" class="pf-max-value-keypad" hidden>
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" class="hp-calc-numpad-btn" onclick="schedaPfMaxModifierKeypad('${n}')">${n}</button>`).join('')}
                        <button type="button" class="hp-calc-numpad-btn" onclick="schedaPfMaxModifierKeypad('C')">C</button>
                        <button type="button" class="hp-calc-numpad-btn" onclick="schedaPfMaxModifierKeypad('0')">0</button>
                        <button type="button" class="hp-calc-numpad-btn" onclick="schedaPfMaxModifierKeypad('BS')">⌫</button>
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

    function _setPfMaxModifierDisplay(value) {
        const amount = Math.max(1, Math.min(9999, parseInt(value) || 1));
        if (_pfMaxEditState) _pfMaxEditState.valueBuffer = String(amount);
        const display = document.getElementById('pfMaxModValueDisplay');
        if (display) display.textContent = String(amount);
    }

    window.schedaPfMaxModifierSetSign = function(sign) {
        document.querySelectorAll('#pfMaxModifierEditOverlay .bonus-edit-scope-opt').forEach(el => {
            const input = el.querySelector('input');
            el.classList.toggle('selected', input?.value === sign);
        });
    };

    window.schedaPfMaxModifierStep = function(delta) {
        const current = parseInt(_pfMaxEditState?.valueBuffer) || 1;
        _setPfMaxModifierDisplay(current + delta);
    };

    window.schedaPfMaxModifierToggleKeypad = function() {
        const keypad = document.getElementById('pfMaxModKeypad');
        const display = document.getElementById('pfMaxModValueDisplay');
        if (!keypad) return;
        const show = keypad.hasAttribute('hidden');
        keypad.toggleAttribute('hidden', !show);
        display?.classList.toggle('active', show);
    };

    window.schedaPfMaxModifierKeypad = function(key) {
        if (!_pfMaxEditState) return;
        let buffer = String(_pfMaxEditState.valueBuffer || '1');
        if (key === 'C') {
            buffer = '1';
        } else if (key === 'BS') {
            buffer = buffer.length > 1 ? buffer.slice(0, -1) : '1';
        } else {
            buffer = buffer === '1' && !_pfMaxEditState.manualValueStarted ? String(key) : `${buffer}${key}`;
            _pfMaxEditState.manualValueStarted = true;
        }
        const amount = Math.max(1, Math.min(9999, parseInt(buffer) || 1));
        _pfMaxEditState.valueBuffer = String(amount);
        _setPfMaxModifierDisplay(amount);
    };

    window.schedaPfMaxModifierEditorClose = function() {
        document.getElementById('pfMaxModifierEditOverlay')?.remove();
        _pfMaxEditState = null;
    };

    window.schedaPfMaxModifierSave = async function() {
        const pg = _schedaPgCache;
        if (!pg || !_pfMaxEditState) return;
        const name = (document.getElementById('pfMaxModName')?.value || '').trim().slice(0, 80) || 'Modificatore PF max';
        const amount = Math.max(1, parseInt(_pfMaxEditState.valueBuffer) || 1);
        const sign = document.querySelector('input[name="pfMaxModSign"]:checked')?.value === 'negative' ? -1 : 1;
        const durata = (document.getElementById('pfMaxModDuration')?.value || '').trim().slice(0, 120);
        const mods = _getEditablePfMaxModifiers(pg);
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
        const mods = _getEditablePfMaxModifiers(pg);
        mods.splice(_pfMaxEditState.itemIdx, 1);
        schedaPfMaxModifierEditorClose();
        await _savePfMaxState({ modifiers: mods, notify: 'Modificatore PF max rimosso' });
    };

    function patchedOpenHpCalcLive(pgId, field) {
        const pg = _schedaPgCache;
        if ((field === 'punti_vita_max' || field === 'pv_max_temporaneo') && pg) return _openPfMaxDialog(pgId);
        if (field === 'pv_attuali' && pg) {
            const maxVal = patchedSchedaGetPvMaxEffettivo(pg);
            const currentVal = Math.min(maxVal, pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10));
            return patchedOpenHpCalc(pgId, field, currentVal, maxVal);
        }
        return originalOpenHpCalcLive ? originalOpenHpCalcLive.apply(this, arguments) : undefined;
    }

    function patchedOpenHpCalc(pgId, field, currentVal, maxVal) {
        if (field === 'punti_vita_max' || field === 'pv_max_temporaneo') return _openPfMaxDialog(pgId);
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
