// ============================================================================
// CHARACTER SHEET MAIN RENDER
// ============================================================================

async function renderSchedaPersonaggio(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { setSafeHtml(content, '<p>Errore: Supabase non disponibile</p>'); return; }

    // Check tipo_scheda to route to micro view
    const { data: checkPg } = await supabase.from('personaggi').select('tipo_scheda').eq('id', personaggioId).single();
    if (checkPg?.tipo_scheda === 'micro') {
        return renderMicroScheda(personaggioId);
    }

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = '';

    window._schedaCurrentPgId = personaggioId;
    window._schedaCurrentTab = 'scheda';
    if (typeof updateScrollStatsBtn === 'function') updateScrollStatsBtn();

    if (!_schedaPgCache || _schedaPgCache.id !== personaggioId) {
        setSafeHtml(content, '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento scheda...</p></div>');
    }

    try {
        const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
        if (error || !pg) throw error || new Error('Personaggio non trovato');
        if (_hpCalcState && _hpCalcState.pgId === personaggioId) {
            pg[_hpCalcState.field] = _hpCalcState.currentVal;
        }
        _schedaPgCache = pg;

        // ── Auto-applica/aggiorna il bonus "Factotum" del Bardo (livello 2+)
        //    sull'iniziativa salvata. Si traccia in bonus_manuali._jack_iniz_v
        //    il bonus attualmente gia' incluso nel valore iniziativa, in modo
        //    da applicare solo il delta quando il PG sale di livello (e il
        //    Factotum aumenta) o quando, per un PG esistente, il bonus non
        //    era ancora stato sommato.
        try {
            const desiredJot = _getFactotumBonus(pg);
            const bm = (pg.bonus_manuali && typeof pg.bonus_manuali === 'object') ? pg.bonus_manuali : {};
            const appliedJot = parseInt(bm._jack_iniz_v) || 0;
            if (desiredJot !== appliedJot) {
                const delta = desiredJot - appliedJot;
                const baseInit = (pg.iniziativa != null) ? pg.iniziativa : Math.floor(((pg.destrezza || 10) - 10) / 2);
                pg.iniziativa = baseInit + delta;
                pg.bonus_manuali = { ...bm, _jack_iniz_v: desiredJot };
                schedaInstantSave(personaggioId, {
                    iniziativa: pg.iniziativa,
                    bonus_manuali: pg.bonus_manuali,
                });
            }
        } catch (e) { console.warn('[scheda] Factotum auto-apply skipped:', e); }

        // Auto-injection di resistenze derivate da privilegi di sottoclasse
        // (es. Difese Psichiche dello Stregone Mente Aberrante a liv 6).
        // Persistite a DB se mancanti, in modo che siano visibili anche da
        // altri dispositivi.
        if (_ensureSubclassAutoEffectsApplied(pg)) {
            try {
                await supabase.from('personaggi')
                    .update({ resistenze: pg.resistenze, updated_at: new Date().toISOString() })
                    .eq('id', personaggioId);
            } catch (e) {
                console.warn('[auto-resistance] save failed', e);
            }
        }

        const fMod = (val) => { const m = Math.floor(((val || 10) - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
        const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
        const saves = pg.tiri_salvezza || [];
        const skillProf = pg.competenze_abilita || [];
        const skillExpert = pg.maestrie_abilita || [];
        const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;

        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }

        // 1. Abilities + Saves
        const abilitiesHtml = SCHEDA_ABILITIES.map(a => {
            const val = pg[a.key] || 10;
            const m = fMod(val);
            const isSaveProf = saves.includes(a.key);
            const saveExtra = _getSaveBonusFor(pg, a.key);
            const saveMod = Math.floor((val - 10) / 2) + (isSaveProf ? bonusComp : 0) + saveExtra;
            const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
            const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
            return `
            <div class="scheda-ability">
                <div class="scheda-ability-label">${a.full}</div>
                <div class="scheda-ability-input clickable" id="sAbil_${a.key}" data-field="${a.key}" data-pgid="${pg.id}" onclick="schedaOpenAbilityCalc('${pg.id}','${a.key}')">${val}</div>
                <div class="scheda-ability-mod" id="sMod_${a.key}">${m}</div>
                <div class="scheda-ability-save ${isSaveProf ? 'proficient' : ''}" data-save="${a.key}" data-pgid="${pg.id}">
                    <span class="scheda-save-dot" onclick="schedaToggleSave('${pg.id}','${a.key}')" title="Tocca per attivare/disattivare la competenza">${isSaveProf ? '●' : '○'}</span>
                    <span class="scheda-save-clickable" onclick="schedaOpenSaveBonus('${pg.id}','${a.key}')" title="Modifica bonus extra ai TS">
                        <span class="scheda-save-label">TS</span>
                        <span class="scheda-save-val" id="sSave_${a.key}">${saveStr}${saveMark}</span>
                    </span>
                </div>
            </div>`;
        }).join('');

        // 2. Four boxes
        const initDisplay = pg.iniziativa != null ? pg.iniziativa : Math.floor(((pg.destrezza || 10) - 10) / 2);

        // 4. Skills with proficiency + expertise
        const factotum = _getFactotumBonus(pg);
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const percJot = (!percProf && !percExpert) ? factotum : 0;
        const percPassiva = 10 + sagMod + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0) + percJot;

        const skillsHtml = SCHEDA_SKILLS.map(sk => {
            const abilityVal = pg[sk.ability] || 10;
            const abilityMod = Math.floor((abilityVal - 10) / 2);
            const isProf = skillProf.includes(sk.key);
            const isExpert = skillExpert.includes(sk.key);
            const jot = (!isProf && !isExpert) ? factotum : 0;
            const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0) + jot;
            const totalStr = total >= 0 ? `+${total}` : `${total}`;
            return `
            <div class="scheda-skill">
                <span class="scheda-skill-dot ${isProf ? 'active' : ''}" tabindex="-1" onmousedown="event.preventDefault();schedaToggleSkillProf('${pg.id}','${sk.key}')" ontouchend="event.preventDefault();schedaToggleSkillProf('${pg.id}','${sk.key}')" title="Competenza">●</span>
                <span class="scheda-skill-dot expert ${isExpert ? 'active' : ''}" tabindex="-1" onmousedown="event.preventDefault();schedaToggleSkillExpert('${pg.id}','${sk.key}')" ontouchend="event.preventDefault();schedaToggleSkillExpert('${pg.id}','${sk.key}')" title="Maestria">★</span>
                <span class="scheda-skill-mod" id="sSkill_${sk.key}">${totalStr}</span>
                <span class="scheda-skill-name">${sk.label} <small>(${sk.ability.substring(0, 3).toUpperCase()})</small></span>
            </div>`;
        }).join('');

        // Hit dice
        const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
        const dadiDisp = pg.dadi_vita_disponibili || {};
        let hitDiceHtml = '';
        if (pg.classi && pg.classi.length > 0) {
            hitDiceHtml = `<div class="scheda-hd-table">
                ${pg.classi.map(c => {
                    const die = CLASS_HD[c.nome] || 8;
                    const total = c.livello;
                    const key = c.nome;
                    const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                    return `<div class="scheda-hd-row">
                        <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                        <div class="scheda-hd-avail">
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},-1,${total})">−</button>
                            <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},1,${total})">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }

        // Class Resources (built-in + custom)
        const classResources = pg.risorse_classe || {};
        let classResourcesHtml = '';
            const resItems = [];
        if (pg.classi && pg.classi.length > 0) {
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
                    // Applica eventuali override utente (nome / max).
                    const overrides = (classResources._overrides && classResources._overrides[key]) || {};
                    const dispNome = overrides.nome || res.nome;
                    if (typeof overrides.max === 'number' && overrides.max > 0) maxVal = overrides.max;
                const current = Math.min(maxVal, classResources[key] != null ? classResources[key] : maxVal);
                resItems.push(`<div class="scheda-hd-row">
                        <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenEditClassRes('${pg.id}','${key}','${escapeHtml(res.nome).replace(/'/g, '&#39;')}',${maxVal})" title="Modifica">${escapeHtml(dispNome)} <small>(${escapeHtml(c.nome)})</small></span>
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
        // Risorse di sottoclasse (auto-derivate da SUBCLASS_RESOURCES)
        _pgSubclassResources(pg).forEach(sr => {
            // Override utente (rinomina o cambio max).
            const overrides = (classResources._overrides && classResources._overrides[sr.key]) || {};
            const dispNome = overrides.nome || sr.nome;
            let maxVal = sr.max;
            if (typeof overrides.max === 'number' && overrides.max > 0) maxVal = overrides.max;
            const current = Math.min(maxVal, sr.current);
            const sub = sr.recharge ? ` <small>(${escapeHtml(sr.sottoclasseNome)}, ${sr.recharge})</small>` : ` <small>(${escapeHtml(sr.sottoclasseNome)})</small>`;
            const dieBadge = sr.die ? ` <small style="color:var(--accent);font-weight:700;">${sr.die}</small>` : '';
            const editBtn = `onclick="schedaOpenEditClassRes('${pg.id}','${sr.key}','${escapeHtml(sr.nome).replace(/'/g, '&#39;')}',${sr.defaultMax})" title="Modifica"`;
            if (sr.tipo === 'portent') {
                // Render specifico Portento (slot di dadi con valore salvato).
                const stored = (pg.risorse_classe && pg.risorse_classe._portent && pg.risorse_classe._portent[sr.key]) || [];
                const slots = [];
                for (let i = 0; i < maxVal; i++) {
                    const v = stored[i];
                    const filled = v != null && v >= 1 && v <= 20;
                    slots.push(`<button class="scheda-portent-slot${filled ? ' filled' : ''}" onclick="schedaPortentSlotClick('${pg.id}','${sr.key}',${i},${maxVal})" title="Click: imposta/usa">${filled ? v : '—'}</button>`);
                }
                const rollBtn = `<button class="scheda-portent-roll" onclick="schedaPortentRollAll('${pg.id}','${sr.key}',${maxVal})" title="Tira tutti">🎲</button>`;
                resItems.push(`<div class="scheda-hd-row scheda-hd-row-portent">
                    <span class="scheda-hd-total scheda-hd-total-clickable" ${editBtn}>${escapeHtml(dispNome)}${sub}</span>
                    <div class="scheda-hd-avail scheda-portent-slots">
                        ${slots.join('')}
                        ${rollBtn}
                    </div>
                </div>`);
            } else if (sr.tipo === 'ward_pool') {
                // Distorsione Arcana (Abjuration): pool di PF = 2*livMago + IntMod.
                const wizardLvl = (pg.classi || []).filter(c => c.nome === 'Mago').reduce((a,c) => a + (c.livello||0), 0);
                const intMod = calcMod(pg.intelligenza || 10);
                const wardMax = (typeof overrides.max === 'number' && overrides.max > 0) ? overrides.max : Math.max(0, 2 * wizardLvl + intMod);
                const wardCur = Math.min(wardMax, current);
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenEditClassRes('${pg.id}','${sr.key}','${escapeHtml(sr.nome).replace(/'/g, '&#39;')}',${Math.max(0, 2 * wizardLvl + intMod)})" title="Modifica">${escapeHtml(dispNome)}${sub}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${wardCur},-1,${wardMax})">−</button>
                        <span class="scheda-hd-val" id="sSubRes_${sr.key}">${wardCur}</span>
                        <span class="scheda-hd-max">/ ${wardMax}</span>
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${wardCur},1,${wardMax})">+</button>
                    </div>
                </div>`);
            } else {
                // Counter standard / dice_pool (con badge dado se presente).
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" ${editBtn}>${escapeHtml(dispNome)}${dieBadge}${sub}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sSubRes_${sr.key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            }
        });
        // Risorse razziali (auto-derivate dai tratti con `uses`)
        _pgRaceResources(pg).forEach(rr => {
            const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                    <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                    <span class="scheda-hd-max">/ ${rr.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
                </div>
            </div>`);
        });
        // Risorse derivate dalle invocazioni occulte (non-spell): es. Cloak
        // of Flies (1/breve), Tomb of Levistus, Bond of the Talisman
        // (prof_bonus/lungo), Gift of the Protectors, Protection of the
        // Talisman, ecc.
        _pgInvocationSlots(pg).filter(is => !is.is_spell).forEach(is => {
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(is.name)} <small>(supplica, ${escapeHtml(is.recharge)})</small></span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                    <span class="scheda-hd-val" id="sInvRes_${is.key}">${is.current}</span>
                    <span class="scheda-hd-max">/ ${is.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                </div>
            </div>`);
        });
        const customRes = classResources._custom || [];
        customRes.forEach((cr, i) => {
            const current = cr.current != null ? cr.current : cr.max;
            const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                    <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                    <span class="scheda-hd-max">/ ${cr.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
                </div>
            </div>`);
        });
        classResourcesHtml = `<div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Risorse
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
            </div>
            <div class="scheda-section-body">
            ${resItems.length > 0 ? `<div class="scheda-hd-table">${resItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
            </div>
        </div>`;

        // Resistenze, Immunita', Vulnerabilita' (inline: 3 segnalini R/I/V con mutua esclusione fra loro)
        const curRes = Array.isArray(pg.resistenze) ? pg.resistenze : [];
        const curImm = Array.isArray(pg.immunita) ? pg.immunita : [];
        const curVul = Array.isArray(pg.vulnerabilita) ? pg.vulnerabilita : [];
        const nRes = curRes.length, nImm = curImm.length, nVul = curVul.length;
        const resImmInlineHtml = `<div class="scheda-resimm-grid">${DAMAGE_TYPES.map(dt => {
            const isRes = curRes.includes(dt.value);
            const isImm = curImm.includes(dt.value);
            const isVul = curVul.includes(dt.value);
            return `<div class="scheda-resimm-row" id="sResImmRow_${dt.value}">
                <span class="scheda-resimm-marker res ${isRes ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleResInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleResInline('${pg.id}','${dt.value}')"
                      title="Resistenza">R</span>
                <span class="scheda-resimm-marker imm ${isImm ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleImmInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleImmInline('${pg.id}','${dt.value}')"
                      title="Immunità">I</span>
                <span class="scheda-resimm-marker vul ${isVul ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleVulInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleVulInline('${pg.id}','${dt.value}')"
                      title="Vulnerabilità">V</span>
                <span class="scheda-resimm-name">${escapeHtml(dt.label)}</span>
            </div>`;
        }).join('')}</div>
        <div class="scheda-resimm-legend">
            <span><span class="scheda-resimm-marker res active">R</span> Resistenza</span>
            <span><span class="scheda-resimm-marker imm active">I</span> Immunità</span>
            <span><span class="scheda-resimm-marker vul active">V</span> Vulnerabilità</span>
        </div>`;
        const resImmCount = nRes + nImm + nVul;

        // Conditions (excluding concentrazione which is shown separately)
        const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
        const conditionsHtml = conditionsActive.length > 0 ?
            conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const isConcentrating = !!pg.concentrazione;

        // Check if spellcaster
        const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

        content.innerHTML = `
        ${buildSchedaHeader(pg)}

        <div class="scheda-page-grid">
        <div class="scheda-col scheda-col-left">

        <div class="scheda-perc-passiva scheda-prof-bonus">
            <span class="scheda-perc-val" id="sBonusComp">+${calcBonusCompetenza(pg.livello || 1)}</span>
            <span class="scheda-perc-label">Bonus di Competenza</span>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Caratteristiche e Tiri Salvezza</div>
            <div class="scheda-section-body">
                <div class="scheda-abilities">${abilitiesHtml}</div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Abilità</div>
            <div class="scheda-section-body">
                <div class="scheda-skills" id="schedaSkillsList">${skillsHtml}</div>
                <div class="scheda-perc-passiva">
                    <span class="scheda-perc-val" id="sPercPassiva">${percPassiva}</span>
                    <span class="scheda-perc-label">Percezione Passiva</span>
                </div>
            </div>
        </div>

        ${buildLangProfSection(pg)}

        </div><!-- /scheda-col-left -->
        <hr class="scheda-divider">
        <div class="scheda-col scheda-col-right">

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche</div>
            <div class="scheda-section-body">
        <div class="scheda-three-boxes">
                    <div class="scheda-box clickable" onclick="schedaOpenCABonus('${pg.id}')">
                        <div class="scheda-box-val" id="schedaCA">${pg.classe_armatura || 10}</div>
                <div class="scheda-box-label">CA</div>
            </div>
                    <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
                        <div class="scheda-box-val" id="schedaInit">${initDisplay >= 0 ? '+' + initDisplay : initDisplay}</div>
                <div class="scheda-box-label">Iniziativa</div>
            </div>
                    <div class="scheda-box clickable" onclick="schedaOpenSpeedCalc('${pg.id}')">
                        <div class="scheda-box-val" id="schedaSpeed">${pg.velocita || 9}</div>
                <div class="scheda-box-label">Velocità</div>
            </div>
        </div>
        <div class="scheda-hp-section">
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','punti_vita_max')">
                        <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                        <div class="scheda-hp-label">PV Max</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_attuali')">
                        <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                        <div class="scheda-hp-label">PV Attuali</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_temporanei')">
                        <div class="scheda-hp-display" id="schedaPvTemp">${pg.pv_temporanei || 0}</div>
                        <div class="scheda-hp-label">PV Temp</div>
                </div>
            </div>
                <div class="scheda-subsection collapsed">
                    <div class="scheda-subsection-title" onclick="schedaToggleSubsection(this)">
                        <span>Difese</span>
                        <span class="scheda-subsection-meta" id="sResImmCount">${resImmCount > 0 ? resImmCount : ''}</span>
                        <span class="scheda-subsection-arrow">▾</span>
            </div>
                    <div class="scheda-subsection-body">${resImmInlineHtml}</div>
        </div>
                <div class="scheda-subsection collapsed">
                    <div class="scheda-subsection-title" onclick="schedaToggleSubsection(this)">
                        <span>Condizioni</span>
                        <span class="scheda-subsection-meta">${conditionsActive.length > 0 ? conditionsActive.length : ''}${isConcentrating ? ' • C' : ''}</span>
                        <span class="scheda-subsection-arrow">▾</span>
                    </div>
                    <!-- Pinned: sempre visibile e interagibile anche con la tendina chiusa -->
                    <div class="scheda-subsection-pinned">
                        <div class="scheda-concentrazione-row">
                            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="event.stopPropagation();schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
                        </div>
                    </div>
                    <div class="scheda-subsection-body">
                        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
                        <div class="scheda-condition-extra">
                            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
                        </div>
                        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Dadi Vita</div>
            <div class="scheda-section-body">
            ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
            </div>
        </div>

        ${buildEquipSection(pg)}

        ${classResourcesHtml}

        ${_buildP1CustomTablesHtml(pg)}

        <div class="priv-add-tab-wrap">
            <button class="btn-secondary priv-add-tab-btn" onclick="p1AddTab()">
                <span class="priv-add-tab-plus">+</span> Nuova tabella
            </button>
        </div>

        </div><!-- /scheda-col-right -->
        </div><!-- /scheda-page-grid -->
        `;

        // Wire up editable inputs
        const backBtn = document.getElementById('schedaBackBtn');
        if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

        schedaSetActiveTab('scheda');
        schedaWireTabBar(pg.id);

        // Se richiesto (es. ritorno da combattimento), centra la vista sulla
        // tabella delle statistiche (PV / PV temp / CA / iniziativa).
        if (window._schedaPendingScrollToStats) {
            window._schedaPendingScrollToStats = false;
            setTimeout(() => { try { _scrollSchedaDividerIntoView(); } catch(_){} }, 60);
        }

    } catch (e) {
        console.error('Errore caricamento scheda:', e);
        content.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento della scheda</p></div>';
    }
}

function schedaRecalcAbility(abilityKey, val, pgId) {
    const m = Math.floor((val - 10) / 2);
    const mStr = m >= 0 ? `+${m}` : `${m}`;
    const modEl = document.getElementById(`sMod_${abilityKey}`);
    if (modEl) modEl.textContent = mStr;

    const pg = _schedaPgCache;
    if (!pg) return;
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const factotum = _getFactotumBonus(pg);
    const saves = pg.tiri_salvezza || [];
    const isSaveProf = saves.includes(abilityKey);
    const saveExtra = _getSaveBonusFor(pg, abilityKey);
    const saveMod = m + (isSaveProf ? bonusComp : 0) + saveExtra;
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
    const saveEl = document.getElementById(`sSave_${abilityKey}`);
    if (saveEl) saveEl.innerHTML = `${saveStr}${saveMark}`;

    const skillProf = pg.competenze_abilita || [];
    const skillExpert = pg.maestrie_abilita || [];
    SCHEDA_SKILLS.filter(sk => sk.ability === abilityKey).forEach(sk => {
        const isProf = skillProf.includes(sk.key);
        const isExpert = skillExpert.includes(sk.key);
        const jot = (!isProf && !isExpert) ? factotum : 0;
        const total = m + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0) + jot;
        const totalStr = total >= 0 ? `+${total}` : `${total}`;
        const el = document.getElementById(`sSkill_${sk.key}`);
        if (el) el.textContent = totalStr;
    });

    if (abilityKey === 'saggezza') {
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const percJot = (!percProf && !percExpert) ? factotum : 0;
        const pp = 10 + m + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0) + percJot;
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }

    if (abilityKey === 'destrezza') {
        const initEl = document.getElementById('schedaInit');
        if (initEl && pg.iniziativa != null) {
            const initStr = pg.iniziativa >= 0 ? `+${pg.iniziativa}` : `${pg.iniziativa}`;
            initEl.textContent = initStr;
        }
    }
}
