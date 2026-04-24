const MONSTER_TYPES = ['Aberrazione','Bestia','Celestiale','Costrutto','Drago','Elementale','Fatato','Immondo','Melma','Mostruosità','Non morto','Pianta','Gigante','Umanoide'];
const MONSTER_SIZES = ['Minuscola','Piccola','Media','Grande','Enorme','Mastodontica'];
const MONSTER_ALIGNMENTS = ['Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio','Senza allineamento'];

let _combatInitiativeOrder = [];
let _combatMonsters = [];
let _combatSelectedId = null;
let _combatSelectedType = null; // 'player' or 'monster'

async function renderCombattimentoContent(campagnaId, sessioneId) {
    const cardsCol = document.getElementById('combattimentoContent');
    const initCol = document.getElementById('combatInitCol');
    const roundInfo = document.getElementById('combatRoundInfo');
    const nextBtn = document.getElementById('combatNextTurnBtn');
    const toolbar = document.getElementById('combatToolbar');
    if (!cardsCol) return;

    const supabase = getSupabaseClient();
    if (!supabase) { cardsCol.innerHTML = '<p>Errore: Supabase non disponibile</p>'; return; }

    try {
        const [sessioneResult, tiriResult, monstersResult, charData, isDM, currentUserId] = await Promise.all([
            supabase.from('sessioni').select('combat_round, combat_turn_index').eq('id', sessioneId).single(),
            supabase.rpc('get_tiri_iniziativa', { p_sessione_id: sessioneId }),
            supabase.from('mostri_combattimento').select('*').eq('sessione_id', sessioneId).order('iniziativa', { ascending: false, nullsFirst: false }),
            getCampaignCharacterData(campagnaId),
            isCurrentUserDM(campagnaId),
            getCurrentInternalUserId()
        ]);

        const sessione = sessioneResult.data;
        const combatRound = sessione?.combat_round || 1;
        const combatTurnIdx = sessione?.combat_turn_index || 0;

        let tiriIniziativa = tiriResult.data;
        if (tiriResult.error || !tiriIniziativa) {
            const fallback = await supabase.from('richieste_tiro_iniziativa')
                .select(`*, utenti!richieste_tiro_iniziativa_giocatore_id_fkey(nome_utente, cid)`)
                .eq('sessione_id', sessioneId).order('valore', { ascending: false });
            tiriIniziativa = fallback.data;
        }
        const tiriCompleted = (tiriIniziativa || []).filter(t => t.stato === 'completed' && t.valore !== null);

        _combatMonsters = monstersResult.data || [];

        const pgNamesMap = charData.namesMap;
        const pgConditionsMap = charData.conditionsMap;

        // Build initiative order
        const order = [];
        tiriCompleted.forEach(t => {
            const pgName = pgNamesMap[t.giocatore_id];
            const cond = pgConditionsMap[t.giocatore_id];
            order.push({ type: 'player', id: t.giocatore_id, pgId: cond?.id || null, name: pgName || t.giocatore_nome || t.utenti?.nome_utente || '?', init: t.valore, conditions: cond });
        });
        _combatMonsters.forEach(m => {
            order.push({ type: 'monster', id: m.id, name: m.nome, init: m.iniziativa ?? 0, monster: m });
        });
        order.sort((a, b) => b.init - a.init);
        _combatInitiativeOrder = order;

        const turnIdx = Math.min(combatTurnIdx, Math.max(0, order.length - 1));

        // Round/turn header
        if (roundInfo) {
            const currentName = order[turnIdx]?.name || 'In attesa...';
            roundInfo.innerHTML = `<div class="combat-round-num">Round ${combatRound}</div><div class="combat-turn-name">${escapeHtml(currentName)}</div>`;
        }
        if (nextBtn) {
            nextBtn.style.display = isDM && order.length > 0 ? '' : 'none';
            nextBtn.onclick = () => combatNextTurn(campagnaId, sessioneId, order.length, combatRound, turnIdx);
        }

        // Helper: produce the click handler attribute for a given entry,
        // applying access rules (player can only open their own sheet; non-DM
        // cannot open monster sheets at all).
        const buildClickHandler = (entry) => {
            const isMonster = entry.type === 'monster';
            if (isMonster) {
                if (!isDM) return '';
                if (_isPlaceholderMonster(entry.monster)) {
                    return `onclick="combatOpenPlaceholderDialog('${entry.id}','${campagnaId}','${sessioneId}')"`;
                }
                return `onclick="combatOpenMonsterFullSheet('${entry.id}','${campagnaId}','${sessioneId}')"`;
            }
            const isOwner = entry.id === currentUserId;
            if (!isDM && !isOwner) return '';
            if (!entry.pgId) return '';
            // Apri la scheda PG e centra automaticamente la tabella
            // statistiche (PV / PV temp / CA) cosi' il DM/player vede subito
            // i dati piu' rilevanti durante il combattimento.
            return `onclick="openSchedaPersonaggio('${entry.pgId}',{scrollToStats:true})"`;
        };

        // Left icons column (square portraits, no initiative number)
        if (initCol) {
            initCol.innerHTML = order.map((entry, idx) => {
                const initials = entry.name.substring(0, 2).toUpperCase();
                const isTurn = idx === turnIdx;
                const click = buildClickHandler(entry);
                const clickable = click ? 'is-clickable' : 'is-locked';
                return `<div class="combat-icon ${isTurn ? 'active' : ''} ${entry.type === 'monster' ? 'monster' : ''} ${clickable}" data-idx="${idx}" ${click}>
                    <span class="combat-icon-initials">${escapeHtml(initials)}</span>
                </div>`;
            }).join('');
        }

        // Right cards column - always show all cards (no inline expansion)
        if (order.length === 0) {
            cardsCol.innerHTML = '<div class="content-placeholder"><p>In attesa dei tiri iniziativa...</p></div>';
        } else {
            cardsCol.innerHTML = order.map((entry, idx) => {
                const isTurn = idx === turnIdx;
                const isMonster = entry.type === 'monster';

                let condBadges = '';
                if (isMonster && entry.monster) {
                    const active = ALL_CONDITIONS.filter(c => entry.monster[c.key]);
                    if (active.length > 0) condBadges = active.map(c => `<span class="condition-badge-sm">${c.label}</span>`).join('');
                } else if (entry.conditions) {
                    const active = ALL_CONDITIONS.filter(c => entry.conditions[c.key]);
                    if (active.length > 0) condBadges = active.map(c => `<span class="condition-badge-sm">${c.label}</span>`).join('');
                }

                // Players can only see HP of fellow party members (not monsters).
                let hpDisplay = '';
                if (isMonster && isDM && entry.monster) {
                    const mHp = entry.monster.pv_attuali ?? entry.monster.punti_vita_max;
                    hpDisplay = `<span class="combat-card-hp">${mHp}/${entry.monster.punti_vita_max}</span>`;
                } else if (!isMonster && entry.conditions) {
                    const pHp = entry.conditions.pv_attuali != null ? entry.conditions.pv_attuali : entry.conditions.punti_vita_max;
                    const pMax = entry.conditions.punti_vita_max || '?';
                    hpDisplay = `<span class="combat-card-hp">${pHp}/${pMax}</span>`;
                }

                const click = buildClickHandler(entry);
                const clickable = click ? 'is-clickable' : 'is-locked';

                return `<div class="combat-card ${isTurn ? 'is-turn' : ''} ${isMonster ? 'monster-card' : ''} ${clickable}" ${click}>
                    <span class="combat-card-init" title="Iniziativa">${entry.init}</span>
                    <div class="combat-card-center">
                        <span class="combat-card-name">${escapeHtml(entry.name)}</span>
                        ${condBadges ? `<div class="combat-card-badges">${condBadges}</div>` : ''}
                    </div>
                    ${hpDisplay}
                </div>`;
            }).join('');
        }

        // DM Toolbar
        if (toolbar) {
            if (isDM) {
                toolbar.style.display = 'flex';
                toolbar.innerHTML = `
                    <button class="combat-toolbar-btn" onclick="openMonsterCreationModal('${campagnaId}','${sessioneId}')" title="Aggiungi mostro">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        <span>Mostro</span>
                    </button>
                    <button class="combat-toolbar-btn" onclick="combatDiceRoll()" title="Tira dadi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
                        <span>Dadi</span>
                    </button>
                    <button class="combat-toolbar-btn" onclick="combatCalcOpen()" title="Calcolatrice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
                        <span>Calc</span>
                    </button>
                    <button class="combat-toolbar-btn danger" onclick="terminaCombattimento('${campagnaId}','${sessioneId}')" title="Termina combattimento">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Fine</span>
                    </button>`;
            } else {
                toolbar.style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Errore rendering combattimento:', error);
        cardsCol.innerHTML = '<p>Errore nel caricamento del combattimento</p>';
    }
}

async function getCurrentInternalUserId() {
    if (AppState.cachedUserData?.id) return AppState.cachedUserData.id;
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser) return null;
    try {
        const { data } = await supabase.from('utenti').select('id').eq('uid', AppState.currentUser.uid).single();
        return data?.id || null;
    } catch (e) { return null; }
}

window.combatNextTurn = async function(campagnaId, sessioneId, orderLen, round, turnIdx) {
    if (orderLen === 0) return;
    let nextIdx = turnIdx + 1;
    let nextRound = round;
    if (nextIdx >= orderLen) {
        nextIdx = 0;
        nextRound = round + 1;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nextEntry = _combatInitiativeOrder[nextIdx];
    if (nextEntry && nextEntry.type === 'monster') {
        const m = nextEntry.monster;
        if (m) {
            const updates = {};
            if ((m.resistenze_leggendarie || 0) > 0) updates.res_legg_attuali = m.resistenze_leggendarie;
            if ((m.azioni_legg_max || 0) > 0) updates.azioni_legg_attuali = m.azioni_legg_max;
            if (Object.keys(updates).length > 0) {
                await supabase.from('mostri_combattimento').update(updates).eq('id', m.id);
            }
        }
    }

    await supabase.from('sessioni').update({ combat_round: nextRound, combat_turn_index: nextIdx }).eq('id', sessioneId);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'next_turn', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.combatSelectEntry = async function(type, id, campagnaId, sessioneId, isDM, isOwner) {
    if (_combatSelectedId === id && _combatSelectedType === type) {
        _combatSelectedId = null;
        _combatSelectedType = null;
    } else {
        _combatSelectedId = id;
        _combatSelectedType = type;
    }
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.combatCloseSheet = async function(campagnaId, sessioneId) {
    _combatSelectedId = null;
    _combatSelectedType = null;
    await renderCombattimentoContent(campagnaId, sessioneId);
}

// ===========================================================================
// FULL SHEET / PLACEHOLDER DIALOG (combat session)
// ===========================================================================

// Stabilisce se un mostro e' "placeholder" (segnaposto creato durante il
// combattimento con solo nome / PV / CA opzionale). Oltre al flag esplicito
// `is_placeholder` (richiede patch SQL applicata) usiamo un'euristica per
// retro-compatibilita': tutte le statistiche di base a 10, niente attacchi,
// niente azioni leggendarie, niente competenze, niente incantesimi.
function _isPlaceholderMonster(m) {
    if (!m) return false;
    if (m.is_placeholder === true) return true;
    const allTen = (['forza','destrezza','costituzione','intelligenza','saggezza','carisma'])
        .every(k => (m[k] == null || m[k] === 10));
    const noAttacks = !Array.isArray(m.attacchi) || m.attacchi.length === 0;
    const noLegg = !Array.isArray(m.azioni_leggendarie) || m.azioni_leggendarie.length === 0;
    const noSkills = !Array.isArray(m.competenze_abilita) || m.competenze_abilita.length === 0;
    const noSpells = !m.slot_incantesimo || (typeof m.slot_incantesimo === 'object' && Object.keys(m.slot_incantesimo).length === 0);
    return allTen && noAttacks && noLegg && noSkills && noSpells;
}
window._isPlaceholderMonster = _isPlaceholderMonster;

// Apre la scheda completa di un mostro presente in combattimento riusando il
// layout del viewer del laboratorio (labViewNemico). Funziona sia per mostri
// importati che creati da zero. Solo il DM dovrebbe poter chiamare questa
// funzione (gestito a livello di click handler).
window.combatOpenMonsterFullSheet = async function(monsterId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', monsterId).single();
    if (!m) { showNotification('Mostro non trovato'); return; }

    if (_isPlaceholderMonster(m)) {
        return combatOpenPlaceholderDialog(monsterId, campagnaId, sessioneId);
    }

    const fMod = (v) => { const mod = Math.floor(((v||10)-10)/2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const bonusComp = Math.max(2, Math.floor(((parseInt(m.grado_sfida)||0)-1)/4)+2);
    const saves = m.tiri_salvezza || [];
    const skills = m.competenze_abilita || [];
    const expert = m.maestrie_abilita || [];

    const resistenzeHtml = (m.resistenze?.length) ? m.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r)}</span>`).join('') : '';
    const immunitaHtml = (m.immunita?.length) ? m.immunita.map(r => `<span class="scheda-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">${escapeHtml(r)}</span>`).join('') : '';

    const attacks = m.attacchi || [];
    const attacksHtml = attacks.length > 0 ? attacks.map(a => {
        const hasUsi = a.usi_max > 0;
        const usiPips = hasUsi ? `<span class="monster-action-uses">${Array.from({length: a.usi_max}, (_, i) =>
            `<span class="monster-action-use-pip ${i < (a.usi_attuali ?? a.usi_max) ? 'filled' : ''}"></span>`).join('')}</span>` : '';
        return `<div class="monster-attack-row"><span class="monster-attack-name">${escapeHtml(a.nome)}</span><span class="monster-attack-hit">${escapeHtml(a.bonus || '')}</span><span class="monster-attack-dmg">${escapeHtml(a.danno || '')}</span>${usiPips}</div>`;
    }).join('') : '';

    const leggActions = m.azioni_leggendarie || [];
    const leggActionsHtml = leggActions.length > 0 ? leggActions.map(a =>
        `<div class="monster-legg-row"><span class="monster-legg-name">${escapeHtml(a.nome)}</span><span class="monster-legg-desc">${(window.formatRichText ? window.formatRichText(a.descrizione || '') : escapeHtml(a.descrizione || ''))}</span></div>`
    ).join('') : '';

    const resLeggMax = m.resistenze_leggendarie || 0;
    const resLeggCur = m.res_legg_attuali ?? resLeggMax;
    const azLeggMax = m.azioni_legg_max || 0;
    const azLeggCur = m.azioni_legg_attuali ?? azLeggMax;

    const skillsHtml = skills.length > 0 ? SCHEDA_SKILLS.filter(sk => skills.includes(sk.key)).map(sk => {
        const abilityMod = Math.floor(((m[sk.ability]||10)-10)/2);
        const isExp = expert.includes(sk.key);
        const total = abilityMod + bonusComp + (isExp ? bonusComp : 0);
        const expLabel = isExp ? ' ★' : '';
        return `<span class="scheda-tag">${sk.label} ${total >= 0 ? '+' + total : total}${expLabel}</span>`;
    }).join('') : '';

    let spellHtml = '';
    const slots = m.slot_incantesimo;
    const hasSpells = slots && typeof slots === 'object' && Object.keys(slots).length > 0;
    if (hasSpells) {
        const carInc = m.caratteristica_incantatore;
        const incVal = m[carInc] || 10;
        const incMod = Math.floor((incVal - 10) / 2);
        const atkBonus = incMod + bonusComp;
        const dc = 8 + bonusComp + incMod;
        const levels = Object.keys(slots).map(Number).sort((a,b) => a-b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const cur = s.current ?? s.max;
            const pips = Array.from({length: s.max}, (_, i) => `<span class="scheda-slot-pip ${i < cur ? 'filled' : ''}"></span>`).join('');
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips}</div><span class="scheda-slot-count">${cur}/${s.max}</span></div>`;
        }).join('');
        spellHtml = `
            <div class="combat-section-label">Incantesimi</div>
            <div class="scheda-three-boxes" style="margin-bottom:10px;">
                <div class="scheda-box"><div class="scheda-box-val">${incMod >= 0 ? '+'+incMod : incMod}</div><div class="scheda-box-label">${(carInc||'').substring(0,3).toUpperCase()}</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>
            </div>
            <div class="scheda-slots-table">${slotsHtml}</div>`;
    }

    const pvAttuali = m.pv_attuali ?? m.punti_vita_max;
    const pvMax = m.punti_vita_max || 10;

    let modal = document.getElementById('combatMonsterFullModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'combatMonsterFullModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content modal-content-lg" id="combatMonsterFullContent" style="max-height:92vh;display:flex;flex-direction:column;"></div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) closeCombatMonsterFullModal(); });
        document.body.appendChild(modal);
    }
    document.getElementById('combatMonsterFullContent').innerHTML = `
        <h2 style="flex-shrink:0;">${escapeHtml(m.nome)}
            <button class="modal-close" onclick="closeCombatMonsterFullModal()" style="position:absolute;right:12px;top:12px;">&times;</button>
        </h2>
        <div style="flex:1;overflow-y:auto;padding:0 2px;">
            <p style="color:var(--text-secondary);margin:0 0 12px;font-size:0.85rem;">${escapeHtml(m.tipologia||'')} · ${escapeHtml(m.taglia||'Media')} · GS ${m.grado_sfida||0}</p>
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${m.classe_armatura||10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${pvAttuali}/${pvMax}</div><div class="scheda-box-label">PV</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.velocita||9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            <div class="combat-abilities-grid" style="margin:12px 0;">
                ${SCHEDA_ABILITIES.map(a => {
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor(((m[a.key]||10)-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${m[a.key]||10}</span><span class="combat-ability-mod">${fMod(m[a.key])}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${skillsHtml ? `<div class="combat-section-label">Competenze</div><div class="scheda-tags">${skillsHtml}</div>` : ''}
            ${attacksHtml ? `<div class="combat-section-label">Azioni</div><div class="monster-attacks-list">${attacksHtml}</div>` : ''}
            ${resLeggMax > 0 ? `<div class="combat-section-label">Resistenze Leggendarie</div><div class="monster-res-legg-counter">${Array.from({length: resLeggMax}, (_, i) => `<span class="monster-res-legg-pip ${i < resLeggCur ? 'filled' : ''}"></span>`).join('')}<span class="monster-res-legg-label">${resLeggCur}/${resLeggMax}</span></div>` : ''}
            ${azLeggMax > 0 || leggActionsHtml ? `<div class="combat-section-label">Azioni Leggendarie${azLeggMax > 0 ? ` (${azLeggCur}/${azLeggMax})` : ''}</div>` : ''}
            ${leggActionsHtml ? `<div class="monster-legg-list">${leggActionsHtml}</div>` : ''}
            ${resistenzeHtml ? `<div class="combat-section-label">Resistenze</div><div class="scheda-tags">${resistenzeHtml}</div>` : ''}
            ${immunitaHtml ? `<div class="combat-section-label">Immunità</div><div class="scheda-tags">${immunitaHtml}</div>` : ''}
            ${spellHtml}
        </div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeCombatMonsterFullModal = function() {
    const modal = document.getElementById('combatMonsterFullModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Dialog rapida per i mostri "placeholder": mostra i PV (modificabili) e
// permette di togglare le condizioni standard. Niente caratteristiche, niente
// attacchi: il placeholder serve solo come segnaposto in iniziativa.
window.combatOpenPlaceholderDialog = async function(monsterId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', monsterId).single();
    if (!m) { showNotification('Mostro non trovato'); return; }

    const pvAttuali = m.pv_attuali ?? m.punti_vita_max;
    const pvMax = m.punti_vita_max || 10;
    const ca = m.classe_armatura || 10;

    let modal = document.getElementById('combatPlaceholderModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'combatPlaceholderModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content" id="combatPlaceholderContent" style="max-width:460px;"></div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) closeCombatPlaceholderModal(); });
        document.body.appendChild(modal);
    }

    const condRows = ALL_CONDITIONS.map(c => `
        <label class="placeholder-cond-row">
            <input type="checkbox" data-cond="${c.key}" ${m[c.key] ? 'checked' : ''}>
            <span>${c.label}</span>
        </label>`).join('');

    document.getElementById('combatPlaceholderContent').innerHTML = `
        <button class="modal-close" onclick="closeCombatPlaceholderModal()">&times;</button>
        <h2 style="margin:0 0 12px;">${escapeHtml(m.nome)}</h2>

        <div class="placeholder-stats-row">
            <div class="form-group placeholder-hp-group">
                <label>Punti Vita</label>
                <div class="placeholder-hp-row">
                    <button type="button" class="placeholder-hp-btn" id="phHpMinus">−</button>
                    <input type="number" id="phHpVal" value="${pvAttuali}" min="0" inputmode="numeric">
                    <span class="placeholder-hp-sep">/</span>
                    <input type="number" id="phHpMax" value="${pvMax}" min="1" inputmode="numeric">
                    <button type="button" class="placeholder-hp-btn" id="phHpPlus">+</button>
                </div>
            </div>
            <div class="form-group placeholder-ca-group">
                <label>CA</label>
                <input type="number" id="phCAVal" value="${ca}" min="1" inputmode="numeric" class="placeholder-ca-input">
            </div>
        </div>

        <div class="form-group">
            <label>Condizioni</label>
            <div class="placeholder-cond-grid" id="phCondGrid">${condRows}</div>
        </div>

        <div class="form-actions">
            <button type="button" class="btn-danger" onclick="combatPlaceholderDelete('${monsterId}','${campagnaId}','${sessioneId}')">Elimina</button>
            <button type="button" class="btn-primary" onclick="combatPlaceholderSave('${monsterId}','${campagnaId}','${sessioneId}')">Salva</button>
        </div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const valEl = document.getElementById('phHpVal');
    document.getElementById('phHpMinus').onclick = () => { valEl.value = Math.max(0, (parseInt(valEl.value)||0) - 1); };
    document.getElementById('phHpPlus').onclick = () => { valEl.value = (parseInt(valEl.value)||0) + 1; };
};

window.closeCombatPlaceholderModal = function() {
    const modal = document.getElementById('combatPlaceholderModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.combatPlaceholderSave = async function(monsterId, campagnaId, sessioneId) {
    const pvVal = Math.max(0, parseInt(document.getElementById('phHpVal')?.value) || 0);
    const pvMax = Math.max(1, parseInt(document.getElementById('phHpMax')?.value) || 1);
    const ca = Math.max(1, parseInt(document.getElementById('phCAVal')?.value) || 10);
    const updates = {
        pv_attuali: Math.min(pvVal, pvMax),
        punti_vita_max: pvMax,
        classe_armatura: ca
    };
    document.querySelectorAll('#phCondGrid input[type="checkbox"]').forEach(cb => {
        updates[cb.dataset.cond] = cb.checked;
    });

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('mostri_combattimento').update(updates).eq('id', monsterId);
    if (error) { showNotification('Errore salvataggio: ' + error.message); return; }
    closeCombatPlaceholderModal();
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_updated', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
};

window.combatPlaceholderDelete = async function(monsterId, campagnaId, sessioneId) {
    const ok = await showConfirm('Eliminare questo placeholder dal combattimento?');
    if (!ok) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('mostri_combattimento').delete().eq('id', monsterId);
    if (error) { showNotification('Errore eliminazione: ' + error.message); return; }
    closeCombatPlaceholderModal();
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_removed', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
};

async function renderCombatPlayerSheet(userId, isDM, isOwner, campagnaId, sessioneId) {
    const content = document.getElementById('combattimentoContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pcList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
    const pc = (pcList || []).find(p => p.player_user_id === userId);
    if (!pc) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }

    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pc.personaggio_id).single();
    if (!pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }

    const canEdit = isDM || isOwner;
    const fMod = (v) => { const m = Math.floor(((v||10)-10)/2); return m >= 0 ? `+${m}` : `${m}`; };
    const bonusComp = Math.floor(((pg.livello||1)-1)/4)+2;
    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const saves = pg.tiri_salvezza || [];

    const conditionsActive = ALL_CONDITIONS.filter(c => pg[c.key]);
    const condBadges = conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('');

    const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

    // Spell page content
    let spellPageHtml = '';
    if (hasSpellSlots) {
        const classi = pg.classi || [];
        const spellAbilities = [];
        classi.forEach(c => {
            const ab = CLASS_SPELL_ABILITY[c.nome];
            if (ab && !spellAbilities.find(s => s.ability === ab)) {
                const val = pg[ab] || 10;
                const m = Math.floor((val - 10) / 2);
                spellAbilities.push({ classe: c.nome, ability: ab, mod: m });
            }
        });
        const spellStatsHtml = spellAbilities.map(sa => {
            const atkBonus = sa.mod + bonusComp;
            const dc = 8 + bonusComp + sa.mod;
            return `<div class="scheda-box"><div class="scheda-box-val">${sa.mod >= 0 ? '+'+sa.mod : sa.mod}</div><div class="scheda-box-label">${sa.ability.substring(0,3).toUpperCase()}</div></div>
                    <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                    <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>`;
        }).join('');

        const slots = pg.slot_incantesimo;
        const levels = Object.keys(slots).map(Number).sort((a, b) => a - b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const pips = [];
            for (let i = 0; i < s.max; i++) {
                pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
            }
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips.join('')}</div><span class="scheda-slot-count" id="cSlotCount_${lvl}">${s.current}/${s.max}</span></div>`;
        }).join('');

        spellPageHtml = `
        <div id="combatSpellPage" class="combat-monster-scroll" style="display:none;">
            <div class="scheda-three-boxes" style="margin-bottom:10px;">${spellStatsHtml}</div>
            <div class="scheda-slots-table">${slotsHtml}</div>
        </div>`;
    }

    content.innerHTML = `
    <div class="combat-card-expanded">
        <div class="combat-sheet-header">
            <h3>${escapeHtml(pg.nome)}</h3>
            <span class="combat-sheet-sub">${escapeHtml(pg.razza || '')} · Lv ${pg.livello || 1}</span>
            <button class="combat-sheet-close" onclick="combatCloseSheet('${campagnaId}','${sessioneId}')">&times;</button>
        </div>
        ${hasSpellSlots ? `<div class="combat-sheet-tabs"><button class="combat-sheet-tab active" onclick="combatSheetTab(0)">Scheda</button><button class="combat-sheet-tab" onclick="combatSheetTab(1)">Incantesimi</button></div>` : ''}
        <div id="combatStatsPage" class="combat-monster-scroll">
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${pg.classe_armatura || 10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${pg.iniziativa != null ? pg.iniziativa : fMod(pg.destrezza)}</div><div class="scheda-box-label">Iniziativa</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${pg.velocita || 9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            <div class="combat-hp-bar">
                <div class="combat-hp-block" ${canEdit ? `onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max||10})"` : ''}>
                    <span class="combat-hp-val ${canEdit ? 'editable' : ''}">${pvAttuali}</span>/<span>${pg.punti_vita_max||10}</span>
                    <div class="scheda-hp-label">PV</div>
                </div>
                <div class="combat-hp-block" ${canEdit ? `onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pg.pv_temporanei||0},-1)"` : ''}>
                    <span class="combat-hp-val ${canEdit ? 'editable' : ''}">${pg.pv_temporanei||0}</span>
                    <div class="scheda-hp-label">PV Temp</div>
                </div>
            </div>
            <div class="combat-abilities-grid">
                ${SCHEDA_ABILITIES.map(a => {
                    const v = pg[a.key]||10;
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor((v-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${v}</span><span class="combat-ability-mod">${fMod(v)}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${condBadges || pg.esaustione > 0 ? `<div class="combat-conditions">${condBadges} ${pg.esaustione > 0 ? `<span class="condition-badge-sm exhaustion">Esaustione ${pg.esaustione}</span>` : ''}</div>` : ''}
            ${canEdit ? `<button class="btn-secondary btn-small" style="margin-top:10px;" onclick="openConditionsModal('${pg.id}')">Condizioni</button>` : ''}
        </div>
        ${spellPageHtml}
    </div>`;

    // Wire slot pips if caster
    if (hasSpellSlots && canEdit) {
        content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
            pip.addEventListener('click', () => {
                const lvl = parseInt(pip.dataset.lvl);
                const idx = parseInt(pip.dataset.idx);
                combatSlotToggle(pg.id, lvl, idx);
            });
        });
    }
}

window.combatSheetTab = function(tabIdx) {
    const statsPage = document.getElementById('combatStatsPage');
    const spellPage = document.getElementById('combatSpellPage');
    const tabs = document.querySelectorAll('.combat-sheet-tab');
    tabs.forEach((t, i) => t.classList.toggle('active', i === tabIdx));
    if (statsPage) statsPage.style.display = tabIdx === 0 ? '' : 'none';
    if (spellPage) spellPage.style.display = tabIdx === 1 ? '' : 'none';
}

function combatSlotToggle(pgId, level, index) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single().then(({ data: pg }) => {
        if (!pg || !pg.slot_incantesimo) return;
        const slot = pg.slot_incantesimo[level];
        if (!slot) return;
        slot.current = index < slot.current ? index : index + 1;
        const content = document.getElementById('combattimentoContent');
        if (content) {
            content.querySelectorAll(`.scheda-slot-pip[data-lvl="${level}"]`).forEach((p, i) => p.classList.toggle('filled', i < slot.current));
            const countEl = document.getElementById(`cSlotCount_${level}`);
            if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
        }
        supabase.from('personaggi').update({ slot_incantesimo: pg.slot_incantesimo, updated_at: new Date().toISOString() }).eq('id', pgId).then(() => {});
    });
}

async function renderCombatMonsterSheet(monsterId, isDM, campagnaId, sessioneId) {
    const content = document.getElementById('combattimentoContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', monsterId).single();
    if (!m) { content.innerHTML = '<p>Mostro non trovato</p>'; return; }

    const fMod = (v) => { const mod = Math.floor(((v||10)-10)/2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const bonusComp = Math.max(2, Math.floor(((parseInt(m.grado_sfida)||0)-1)/4)+2);
    const conditionsActive = ALL_CONDITIONS.filter(c => m[c.key]);
    const condBadges = conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('');
    const saves = m.tiri_salvezza || [];

    const resistenzeHtml = (m.resistenze && m.resistenze.length > 0) ? m.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r)}</span>`).join('') : '';
    const immunitaHtml = (m.immunita && m.immunita.length > 0) ? m.immunita.map(r => `<span class="scheda-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">${escapeHtml(r)}</span>`).join('') : '';

    const attacks = m.attacchi || [];
    const attacksHtml = attacks.length > 0 ? attacks.map((a, i) => {
        const hasUsi = a.usi_max > 0;
        const usiCur = a.usi_attuali ?? a.usi_max;
        const usiPips = hasUsi ? `<span class="monster-action-uses">${Array.from({length: a.usi_max}, (_,j) =>
            `<span class="monster-action-use-pip ${j < usiCur ? 'filled' : ''}" ${isDM ? `onclick="monsterToggleActionUse('${m.id}',${i},${j},'${campagnaId}','${sessioneId}')"` : ''}></span>`
        ).join('')}</span>` : '';
        return `<div class="monster-attack-row"><span class="monster-attack-name">${escapeHtml(a.nome)}</span><span class="monster-attack-hit">${escapeHtml(a.bonus || '')}</span><span class="monster-attack-dmg">${escapeHtml(a.danno || '')}</span>${usiPips}</div>`;
    }).join('') : '';

    const leggActions = m.azioni_leggendarie || [];
    const leggActionsHtml = leggActions.length > 0 ? leggActions.map(a =>
        `<div class="monster-legg-row"><span class="monster-legg-name">${escapeHtml(a.nome)}</span><span class="monster-legg-desc">${window.formatRichText(a.descrizione || '')}</span></div>`
    ).join('') : '';

    const resLeggMax = m.resistenze_leggendarie || 0;
    const resLeggCur = m.res_legg_attuali ?? resLeggMax;
    const azLeggMax = m.azioni_legg_max || 0;
    const azLeggCur = m.azioni_legg_attuali ?? azLeggMax;

    const hasSpells = m.slot_incantesimo && typeof m.slot_incantesimo === 'object' && Object.keys(m.slot_incantesimo).length > 0;

    let spellPageHtml = '';
    if (hasSpells) {
        const carInc = m.caratteristica_incantatore;
        const incVal = m[carInc] || 10;
        const incMod = Math.floor((incVal - 10) / 2);
        const atkBonus = incMod + bonusComp;
        const dc = 8 + bonusComp + incMod;
        const slots = m.slot_incantesimo;
        const levels = Object.keys(slots).map(Number).sort((a,b) => a-b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const pips = [];
            for (let i = 0; i < s.max; i++) {
                pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
            }
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips.join('')}</div><span class="scheda-slot-count" id="mSlotCount_${lvl}">${s.current}/${s.max}</span></div>`;
        }).join('');

        spellPageHtml = `
        <div id="monsterSpellPage" class="combat-monster-scroll" style="display:none;">
            <div class="scheda-three-boxes" style="margin-bottom:10px;">
                <div class="scheda-box"><div class="scheda-box-val">${incMod >= 0 ? '+'+incMod : incMod}</div><div class="scheda-box-label">${(carInc||'').substring(0,3).toUpperCase()}</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>
            </div>
            <div class="scheda-slots-table">${slotsHtml}</div>
        </div>`;
    }

    content.innerHTML = `
    <div class="combat-card-expanded combat-monster-sheet">
        <div class="combat-sheet-header">
            <h3>${escapeHtml(m.nome)}</h3>
            <span class="combat-sheet-sub">${escapeHtml(m.tipologia||'')} · ${escapeHtml(m.taglia||'Media')} · GS ${m.grado_sfida||0}</span>
            <button class="combat-sheet-close" onclick="combatCloseSheet('${campagnaId}','${sessioneId}')">&times;</button>
        </div>
        ${hasSpells ? `<div class="combat-sheet-tabs"><button class="combat-sheet-tab active" onclick="monsterSheetTab(0)">Scheda</button><button class="combat-sheet-tab" onclick="monsterSheetTab(1)">Incantesimi</button></div>` : ''}
        <div id="monsterStatsPage" class="combat-monster-scroll">
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${m.classe_armatura||10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.iniziativa != null ? m.iniziativa : fMod(m.destrezza)}</div><div class="scheda-box-label">Iniziativa</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${m.velocita||9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            <div class="combat-hp-bar">
                <div class="combat-hp-block" ${isDM ? `onclick="monsterHpCalc('${m.id}','pv_attuali',${m.pv_attuali??m.punti_vita_max},${m.punti_vita_max||10},'${campagnaId}','${sessioneId}')"` : ''}>
                    <span class="combat-hp-val ${isDM ? 'editable' : ''}">${m.pv_attuali??m.punti_vita_max}</span>/<span>${m.punti_vita_max||10}</span>
                    <div class="scheda-hp-label">PV</div>
                </div>
            </div>
            ${resLeggMax > 0 ? `
            <div class="combat-section-label">Resistenze Leggendarie</div>
            <div class="monster-res-legg-counter" id="mResLeggCounter">
                ${Array.from({length: resLeggMax}, (_,i) => `<span class="monster-res-legg-pip ${i < resLeggCur ? 'filled' : ''}" data-idx="${i}" ${isDM ? `onclick="monsterToggleResLegg('${m.id}',${i},'${campagnaId}','${sessioneId}')"` : ''}></span>`).join('')}
                <span class="monster-res-legg-label">${resLeggCur}/${resLeggMax}</span>
            </div>` : ''}
            <div class="combat-abilities-grid">
                ${SCHEDA_ABILITIES.map(a => {
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor(((m[a.key]||10)-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${m[a.key]||10}</span><span class="combat-ability-mod">${fMod(m[a.key])}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${attacksHtml ? `<div class="combat-section-label">Azioni</div><div class="monster-attacks-list">${attacksHtml}</div>` : ''}
            ${azLeggMax > 0 || leggActionsHtml ? `<div class="combat-section-label">Azioni Leggendarie</div>` : ''}
            ${azLeggMax > 0 ? `<div class="monster-res-legg-counter" id="mAzLeggCounter">
                ${Array.from({length: azLeggMax}, (_,i) => `<span class="monster-res-legg-pip ${i < azLeggCur ? 'filled' : ''}" data-idx="${i}" ${isDM ? `onclick="monsterToggleAzLegg('${m.id}',${i},'${campagnaId}','${sessioneId}')"` : ''}></span>`).join('')}
                <span class="monster-res-legg-label">${azLeggCur}/${azLeggMax}</span>
            </div>` : ''}
            ${leggActionsHtml ? `<div class="monster-legg-list">${leggActionsHtml}</div>` : ''}
            ${resistenzeHtml ? `<div class="combat-section-label">Resistenze</div><div class="scheda-tags">${resistenzeHtml}</div>` : ''}
            ${immunitaHtml ? `<div class="combat-section-label">Immunità</div><div class="scheda-tags">${immunitaHtml}</div>` : ''}
            ${condBadges || m.esaustione > 0 ? `<div class="combat-conditions">${condBadges} ${m.esaustione > 0 ? `<span class="condition-badge-sm exhaustion">Esaustione ${m.esaustione}</span>` : ''}</div>` : ''}
            ${isDM ? `
            <div class="combat-dm-actions">
                <button class="btn-secondary btn-small combat-dm-btn-full" onclick="openMonsterConditionsModal('${m.id}','${campagnaId}','${sessioneId}')">Condizioni</button>
                <div class="combat-dm-actions-row">
                    <button class="btn-secondary btn-small" onclick="duplicateMonster('${m.id}','${campagnaId}','${sessioneId}')">Duplica</button>
                    <button class="btn-danger btn-small" onclick="removeMonster('${m.id}','${campagnaId}','${sessioneId}')">Rimuovi</button>
                </div>
            </div>` : ''}
        </div>
        ${spellPageHtml}
    </div>`;

    if (hasSpells && isDM) {
        content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
            pip.addEventListener('click', async () => {
                const lvl = parseInt(pip.dataset.lvl);
                const idx = parseInt(pip.dataset.idx);
                const slots = m.slot_incantesimo;
                const slot = slots[lvl];
                if (!slot) return;
                slot.current = idx < slot.current ? idx : idx + 1;
                content.querySelectorAll(`.scheda-slot-pip[data-lvl="${lvl}"]`).forEach((p, i) => p.classList.toggle('filled', i < slot.current));
                const countEl = document.getElementById(`mSlotCount_${lvl}`);
                if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
                await supabase.from('mostri_combattimento').update({ slot_incantesimo: slots }).eq('id', m.id);
            });
        });
    }
}

window.monsterSheetTab = function(tab) {
    const statsPage = document.getElementById('monsterStatsPage');
    const spellPage = document.getElementById('monsterSpellPage');
    if (statsPage) statsPage.style.display = tab === 0 ? '' : 'none';
    if (spellPage) spellPage.style.display = tab === 1 ? '' : 'none';
    const content = document.getElementById('combattimentoContent');
    if (content) {
        content.querySelectorAll('.combat-sheet-tab').forEach((btn, i) => btn.classList.toggle('active', i === tab));
    }
};

window.monsterToggleResLegg = async function(mId, idx, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('res_legg_attuali, resistenze_leggendarie').eq('id', mId).single();
    if (!m) return;
    const cur = m.res_legg_attuali ?? m.resistenze_leggendarie;
    const newVal = idx < cur ? idx : idx + 1;
    await supabase.from('mostri_combattimento').update({ res_legg_attuali: newVal }).eq('id', mId);
    await renderCombattimentoContent(campagnaId, sessioneId);
};

window.monsterToggleAzLegg = async function(mId, idx, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('azioni_legg_attuali, azioni_legg_max').eq('id', mId).single();
    if (!m) return;
    const cur = m.azioni_legg_attuali ?? m.azioni_legg_max;
    const newVal = idx < cur ? idx : idx + 1;
    await supabase.from('mostri_combattimento').update({ azioni_legg_attuali: newVal }).eq('id', mId);
    await renderCombattimentoContent(campagnaId, sessioneId);
};

window.monsterToggleActionUse = async function(mId, actionIdx, pipIdx, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('attacchi').eq('id', mId).single();
    if (!m || !m.attacchi || !m.attacchi[actionIdx]) return;
    const action = m.attacchi[actionIdx];
    const cur = action.usi_attuali ?? action.usi_max;
    action.usi_attuali = pipIdx < cur ? pipIdx : pipIdx + 1;
    const updated = [...m.attacchi];
    updated[actionIdx] = action;
    await supabase.from('mostri_combattimento').update({ attacchi: updated }).eq('id', mId);
    await renderCombattimentoContent(campagnaId, sessioneId);
};

// Monster HP Calculator (reuses the same overlay UI)
window.monsterHpCalc = function(mId, field, currentVal, maxVal, campagnaId, sessioneId) {
    _hpCalcState = { pgId: mId, field, currentVal, maxVal, isMonster: true, campagnaId, sessioneId, inputBuffer: '0' };
    const label = 'Punti Vita Mostro';
    const maxDisplay = maxVal > 0 ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';
    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
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
                <button class="hp-calc-btn damage" onclick="monsterHpApply(-1)">− Danno</button>
                <button class="hp-calc-btn heal" onclick="monsterHpApply(1)">+ Cura</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

window.monsterHpApply = async function(direction) {
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
    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('mostri_combattimento').update({ pv_attuali: newVal }).eq('id', _hpCalcState.pgId);
    }
}

window.removeMonster = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('mostri_combattimento').delete().eq('id', mId);
    _combatSelectedId = null;
    _combatSelectedType = null;
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_removed', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.duplicateMonster = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: original } = await supabase.from('mostri_combattimento').select('*').eq('id', mId).single();
    if (!original) { showNotification('Mostro non trovato'); return; }

    const baseName = original.nome.replace(/\s*#\d+$/, '');
    const existing = _combatMonsters.filter(m => {
        const b = m.nome.replace(/\s*#\d+$/, '');
        return b === baseName;
    });

    if (!/#\d+$/.test(original.nome)) {
        await supabase.from('mostri_combattimento').update({ nome: `${baseName} #1` }).eq('id', mId);
    }

    const num = existing.length + 1;
    const clone = {
        sessione_id: original.sessione_id,
        campagna_id: original.campagna_id,
        nome: `${baseName} #${num}`,
        tipologia: original.tipologia,
        taglia: original.taglia,
        allineamento: original.allineamento,
        grado_sfida: original.grado_sfida,
        forza: original.forza,
        destrezza: original.destrezza,
        costituzione: original.costituzione,
        intelligenza: original.intelligenza,
        saggezza: original.saggezza,
        carisma: original.carisma,
        punti_vita_max: original.punti_vita_max,
        pv_attuali: original.punti_vita_max,
        dadi_vita_num: original.dadi_vita_num,
        dado_vita: original.dado_vita,
        classe_armatura: original.classe_armatura,
        velocita: original.velocita,
        iniziativa: (() => { const dexMod = Math.floor(((original.destrezza || 10) - 10) / 2); return Math.floor(Math.random() * 20) + 1 + dexMod; })(),
        tiri_salvezza: original.tiri_salvezza,
        competenze_abilita: original.competenze_abilita,
        maestrie_abilita: original.maestrie_abilita,
        resistenze: original.resistenze,
        immunita: original.immunita,
        attacchi: (original.attacchi || []).map(a => ({...a, usi_attuali: a.usi_max || 0})),
        azioni_leggendarie: original.azioni_leggendarie,
        resistenze_leggendarie: original.resistenze_leggendarie,
        res_legg_attuali: original.resistenze_leggendarie,
        azioni_legg_max: original.azioni_legg_max || 0,
        azioni_legg_attuali: original.azioni_legg_max || 0,
        slot_incantesimo: original.slot_incantesimo ? JSON.parse(JSON.stringify(original.slot_incantesimo)) : null,
        caratteristica_incantatore: original.caratteristica_incantatore
    };

    const { error } = await supabase.from('mostri_combattimento').insert(clone);
    if (error) { showNotification('Errore nella duplicazione'); return; }

    showNotification(`${clone.nome} aggiunto!`);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_added', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
};

// Combat toolbar placeholders
window.combatDiceRoll = function() {
    showNotification('Funzione dadi in arrivo!');
}

window.combatCalcOpen = function() {
    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <div class="hp-calc-title">Calcolatrice</div>
            <input type="text" class="hp-calc-input" id="combatCalcInput" value="" style="font-size:1.5rem;" readonly>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
                ${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => 
                    `<button class="hp-calc-btn ${b==='='?'heal':''}" style="padding:12px;font-size:1.1rem;" onclick="combatCalcPress('${b}')">${b}</button>`
                ).join('')}
            </div>
            <div class="hp-calc-actions" style="margin-top:8px;">
                <button class="btn-secondary btn-small" onclick="combatCalcPress('C')">C</button>
                <button class="btn-secondary btn-small" onclick="schedaCloseHpCalc()">Chiudi</button>
            </div>
        </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) schedaCloseHpCalc(); });
    document.body.appendChild(overlay);
}

window.combatCalcPress = function(key) {
    const input = document.getElementById('combatCalcInput');
    if (!input) return;
    if (key === 'C') { input.value = ''; }
    else if (key === '=') { try { input.value = eval(input.value); } catch (e) { input.value = 'Err'; } }
    else { input.value += key; }
}

// Monster conditions modal
window.openMonsterConditionsModal = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', mId).single();
    if (!m) return;

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal" style="width:340px;max-height:80vh;overflow-y:auto;">
            <div class="hp-calc-title">Condizioni - ${escapeHtml(m.nome)}</div>
            <div class="pg-conditions-grid">
                ${ALL_CONDITIONS.map(c => `<label class="pg-condition-item"><input type="checkbox" id="mc_${c.key}" ${m[c.key] ? 'checked' : ''}> ${c.label}</label>`).join('')}
            </div>
            <div class="pg-exhaustion-row" style="margin-top:12px;">
                <label>Esaustione</label>
                <input type="number" id="mc_esaustione" value="${m.esaustione||0}" min="0" max="6" style="width:60px;">
            </div>
            <div class="hp-calc-actions" style="margin-top:12px;">
                <button class="btn-primary btn-small" onclick="saveMonsterConditions('${mId}','${campagnaId}','${sessioneId}')">Salva</button>
                <button class="btn-secondary btn-small" onclick="schedaCloseHpCalc()">Chiudi</button>
            </div>
        </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) schedaCloseHpCalc(); });
    document.body.appendChild(overlay);
}

window.saveMonsterConditions = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const updates = {};
    ALL_CONDITIONS.forEach(c => { updates[c.key] = document.getElementById(`mc_${c.key}`)?.checked || false; });
    updates.esaustione = parseInt(document.getElementById('mc_esaustione')?.value) || 0;
    await supabase.from('mostri_combattimento').update(updates).eq('id', mId);
    schedaCloseHpCalc();
    await renderCombatMonsterSheet(mId, true, campagnaId, sessioneId);
    await renderCombattimentoContent(campagnaId, sessioneId);
}

// Monster creation modal
window.openMonsterCreationModal = function(campagnaId, sessioneId) {
    _monsterFromHomebrew = null;
    let modal = document.getElementById('monsterModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'monsterModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content modal-content-lg" id="monsterModalContent"></div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) closeMonsterModal(); });
        document.body.appendChild(modal);
    }

    document.getElementById('monsterModalContent').innerHTML = `
        <button class="modal-close" onclick="closeMonsterModal()">&times;</button>
        <h2 id="monsterModalTitle">Aggiungi Mostro</h2>
        <div class="wizard-steps" id="monsterWizardSteps" style="display:none;">
            ${[0,1,2,3,4,5,6,7].map(i => `<div class="wizard-step ${i===0?'active':''}" data-step="${i}"></div>`).join('')}
        </div>
        <div id="monsterChoicePage">
            <div class="monster-choice-grid">
                <div class="monster-choice-card" onclick="monsterStartNew('${campagnaId}','${sessioneId}')">
                    <span class="monster-choice-icon">✏️</span>
                    <span class="monster-choice-label">Crea nuovo</span>
                    <span class="monster-choice-desc">Crea un mostro da zero</span>
                </div>
                <div class="monster-choice-card" onclick="monsterFromHomebrew('${campagnaId}','${sessioneId}')">
                    <span class="monster-choice-icon">📖</span>
                    <span class="monster-choice-label">Da Homebrew</span>
                    <span class="monster-choice-desc">Importa un nemico dal laboratorio</span>
                </div>
                <div class="monster-choice-card" onclick="monsterFromCombatHomebrew('${campagnaId}','${sessioneId}')">
                    <span class="monster-choice-icon">⚔</span>
                    <span class="monster-choice-label">Da Combattimento</span>
                    <span class="monster-choice-desc">Importa un combattimento già pronto</span>
                </div>
                <div class="monster-choice-card" onclick="monsterStartPlaceholder('${campagnaId}','${sessioneId}')">
                    <span class="monster-choice-icon">👤</span>
                    <span class="monster-choice-label">Placeholder</span>
                    <span class="monster-choice-desc">Solo nome e PV</span>
                </div>
            </div>
        </div>
        <div id="monsterWizardContainer" style="display:none;"></div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.dataset.campagnaId = campagnaId;
    modal.dataset.sessioneId = sessioneId;
};

let _monsterFromHomebrew = null;

window.monsterStartNew = function(campagnaId, sessioneId) {
    _monsterFromHomebrew = null;
    _showMonsterWizard(campagnaId, sessioneId);
};

window.monsterFromHomebrew = async function(campagnaId, sessioneId) {
    const choicePage = document.getElementById('monsterChoicePage');
    if (choicePage) choicePage.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: myNemici } = await supabase.from('homebrew_nemici').select('*').eq('user_id', AppState.currentUser?.uid).order('nome');
    const allNemici = myNemici || [];

    if (allNemici.length === 0) {
        if (choicePage) choicePage.innerHTML = `
            <div class="lab-empty">Nessun nemico homebrew trovato</div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="monsterStartNew('${campagnaId}','${sessioneId}')">Crea da zero</button>
            </div>`;
        return;
    }

    if (choicePage) choicePage.innerHTML = `
        <div class="monster-hb-list">
            ${allNemici.map(n => `
                <div class="monster-hb-item" onclick="monsterSelectHomebrew('${n.id}','${campagnaId}','${sessioneId}')">
                    <div class="monster-hb-info">
                        <span class="monster-hb-name">${escapeHtml(n.nome)}</span>
                        <span class="monster-hb-sub">${escapeHtml(n.tipo || '')} · GS ${n.grado_sfida || 0} · PV ${n.punti_vita_max || '?'}</span>
                    </div>
                    <span class="monster-hb-arrow">›</span>
                </div>`).join('')}
        </div>
        <div class="form-actions" style="margin-top:12px;">
            <button type="button" class="btn-secondary" onclick="monsterStartNew('${campagnaId}','${sessioneId}')">Crea da zero</button>
        </div>`;
};

window.monsterSelectHomebrew = function(nemiciId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.from('homebrew_nemici').select('*').eq('id', nemiciId).single().then(({ data }) => {
        if (!data) { showNotification('Errore nel caricamento'); return; }
        _monsterFromHomebrew = data;
        _showMonsterWizard(campagnaId, sessioneId, data);
    });
};

// ===========================================================================
// IMPORT DA COMBATTIMENTO HOMEBREW (encounter)
// ===========================================================================
window.monsterFromCombatHomebrew = async function(campagnaId, sessioneId) {
    const choicePage = document.getElementById('monsterChoicePage');
    if (choicePage) choicePage.innerHTML = '<div class="lab-empty">Caricamento...</div>';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: combats, error } = await supabase.from('homebrew_combattimenti')
        .select('*').eq('user_id', AppState.currentUser?.uid).order('nome');

    if (error || !combats || combats.length === 0) {
        if (choicePage) choicePage.innerHTML = `
            <div class="lab-empty">${error ? 'Errore nel caricamento' : 'Nessun combattimento homebrew trovato'}</div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="monsterStartNew('${campagnaId}','${sessioneId}')">Crea da zero</button>
            </div>`;
        return;
    }

    if (choicePage) choicePage.innerHTML = `
        <div class="monster-hb-list">
            ${combats.map(c => {
                const tot = Array.isArray(c.mostri) ? c.mostri.length : 0;
                return `
                <div class="monster-hb-item" onclick="monsterImportCombatHomebrew('${c.id}','${campagnaId}','${sessioneId}')">
                    <div class="monster-hb-info">
                        <span class="monster-hb-name">${escapeHtml(c.nome)}</span>
                        <span class="monster-hb-sub">${tot} mostr${tot===1?'o':'i'}</span>
                    </div>
                    <span class="monster-hb-arrow">›</span>
                </div>`;
            }).join('')}
        </div>
        <div class="form-actions" style="margin-top:12px;">
            <button type="button" class="btn-secondary" onclick="monsterStartNew('${campagnaId}','${sessioneId}')">Crea da zero</button>
        </div>`;
};

window.monsterImportCombatHomebrew = async function(combatId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: combat, error } = await supabase.from('homebrew_combattimenti').select('*').eq('id', combatId).single();
    if (error || !combat) { showNotification('Errore nel caricamento del combattimento'); return; }

    const arr = Array.isArray(combat.mostri) ? combat.mostri : [];
    if (arr.length === 0) {
        showNotification('Questo combattimento non contiene mostri');
        return;
    }

    let added = 0;
    for (const entry of arr) {
        const snap = entry?.snapshot || entry || {};
        const monster = _buildMonsterPayloadFromSnapshot(snap, campagnaId, sessioneId);
        const { error: insErr } = await supabase.from('mostri_combattimento').insert(monster);
        if (!insErr) added++;
        else console.error('Errore inserimento mostro:', insErr);
    }

    closeMonsterModal();
    showNotification(`${added} mostr${added===1?'o':'i'} aggiunt${added===1?'o':'i'} al combattimento!`);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_added', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
};

function _buildMonsterPayloadFromSnapshot(snap, campagnaId, sessioneId) {
    const dex = parseInt(snap.destrezza) || 10;
    const dexMod = Math.floor((dex - 10) / 2);
    const initMod = (snap.mod_iniziativa != null && snap.mod_iniziativa !== '')
        ? parseInt(snap.mod_iniziativa) : dexMod;
    const init = Math.floor(Math.random() * 20) + 1 + (isNaN(initMod) ? 0 : initMod);
    const pvMax = parseInt(snap.punti_vita_max) || 10;
    const resLegg = parseInt(snap.resistenze_leggendarie) || 0;
    const azLegg = parseInt(snap.azioni_legg_max) || 0;
    return {
        sessione_id: sessioneId,
        campagna_id: campagnaId,
        nome: snap.nome || 'Mostro',
        tipologia: snap.tipo || snap.tipologia || 'Bestia',
        taglia: snap.taglia || 'Media',
        allineamento: snap.allineamento || 'Neutrale',
        grado_sfida: snap.grado_sfida || '0',
        forza: parseInt(snap.forza) || 10,
        destrezza: dex,
        costituzione: parseInt(snap.costituzione) || 10,
        intelligenza: parseInt(snap.intelligenza) || 10,
        saggezza: parseInt(snap.saggezza) || 10,
        carisma: parseInt(snap.carisma) || 10,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        dadi_vita_num: parseInt(snap.dadi_vita_num) || 1,
        dado_vita: parseInt(snap.dado_vita) || _monsterSizeHitDie(snap.taglia),
        classe_armatura: parseInt(snap.classe_armatura) || 10,
        velocita: parseFloat(snap.velocita) || 9,
        iniziativa: init,
        tiri_salvezza: snap.tiri_salvezza || [],
        competenze_abilita: snap.competenze_abilita || [],
        maestrie_abilita: snap.maestrie_abilita || [],
        resistenze: snap.resistenze || [],
        immunita: snap.immunita || [],
        attacchi: snap.attacchi || [],
        azioni_leggendarie: snap.azioni_leggendarie || [],
        resistenze_leggendarie: resLegg,
        res_legg_attuali: resLegg,
        azioni_legg_max: azLegg,
        azioni_legg_attuali: azLegg,
        slot_incantesimo: snap.slot_incantesimo || null,
        caratteristica_incantatore: snap.caratteristica_incantatore || null
    };
}

// ===========================================================================
// PLACEHOLDER (solo nome + PV)
// ===========================================================================
window.monsterStartPlaceholder = function(campagnaId, sessioneId) {
    const choicePage = document.getElementById('monsterChoicePage');
    if (!choicePage) return;
    choicePage.innerHTML = `
        <div class="form-group">
            <label for="phNome">Nome</label>
            <input type="text" id="phNome" placeholder="Es: Goblin #2" autofocus>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
                <label for="phPV">Punti Vita</label>
                <input type="number" id="phPV" min="1" value="10" inputmode="numeric">
            </div>
            <div class="form-group">
                <label for="phCA">Classe Armatura</label>
                <input type="number" id="phCA" min="1" value="10" inputmode="numeric">
            </div>
        </div>
        <div class="form-group">
            <label for="phInit">Iniziativa (opzionale, lascia vuoto per tirare)</label>
            <input type="number" id="phInit" placeholder="es: 14">
        </div>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeMonsterModal()">Annulla</button>
            <button type="button" class="btn-primary" onclick="monsterSavePlaceholder('${campagnaId}','${sessioneId}')">Aggiungi</button>
        </div>`;
    setTimeout(() => document.getElementById('phNome')?.focus(), 50);
};

window.monsterSavePlaceholder = async function(campagnaId, sessioneId) {
    const nome = document.getElementById('phNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }
    const pvMax = Math.max(1, parseInt(document.getElementById('phPV')?.value) || 10);
    const ca = Math.max(1, parseInt(document.getElementById('phCA')?.value) || 10);
    const initRaw = document.getElementById('phInit')?.value;
    const init = (initRaw === '' || initRaw == null)
        ? (Math.floor(Math.random() * 20) + 1)
        : (parseInt(initRaw) || 0);

    const monster = {
        sessione_id: sessioneId,
        campagna_id: campagnaId,
        nome,
        tipologia: 'Bestia',
        taglia: 'Media',
        allineamento: 'Neutrale',
        grado_sfida: '0',
        forza: 10, destrezza: 10, costituzione: 10,
        intelligenza: 10, saggezza: 10, carisma: 10,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        dadi_vita_num: 1,
        dado_vita: 8,
        classe_armatura: ca,
        velocita: 9,
        iniziativa: init,
        tiri_salvezza: [],
        competenze_abilita: [],
        maestrie_abilita: [],
        resistenze: [],
        immunita: [],
        attacchi: [],
        azioni_leggendarie: [],
        resistenze_leggendarie: 0,
        res_legg_attuali: 0,
        azioni_legg_max: 0,
        azioni_legg_attuali: 0,
        slot_incantesimo: null,
        caratteristica_incantatore: null,
        is_placeholder: true
    };

    const supabase = getSupabaseClient();
    if (!supabase) return;
    let { error } = await supabase.from('mostri_combattimento').insert(monster);
    if (error && /is_placeholder/i.test(error.message || '')) {
        // Fallback se la colonna is_placeholder non esiste sul DB.
        delete monster.is_placeholder;
        ({ error } = await supabase.from('mostri_combattimento').insert(monster));
    }
    if (error) { showNotification('Errore creazione placeholder: ' + (error.message || '')); return; }

    closeMonsterModal();
    showNotification(`${nome} aggiunto al combattimento!`);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_added', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
};

const MONSTER_SIZE_DIE = { 'Minuscola': 4, 'Piccola': 6, 'Media': 8, 'Grande': 10, 'Enorme': 12, 'Mastodontica': 20 };

window._monsterSizeHitDie = function(taglia) {
    return MONSTER_SIZE_DIE[taglia] || 8;
};

window._monsterProfBonus = function(gs) {
    const cr = parseFloat(gs) || 0;
    if (cr < 5) return 2;
    if (cr < 9) return 3;
    if (cr < 13) return 4;
    if (cr < 17) return 5;
    if (cr < 21) return 6;
    if (cr < 25) return 7;
    if (cr < 29) return 8;
    return 9;
};

window.monsterUpdateMods = function() {
    const gs = document.getElementById('mGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_ABILITIES.forEach(a => {
        const val = parseInt(document.getElementById(`m${a.key}`)?.value) || 10;
        const mod = Math.floor((val - 10) / 2);
        const fmod = mod >= 0 ? '+' + mod : '' + mod;
        const modEl = document.getElementById(`mMod_${a.key}`);
        if (modEl) {
            modEl.textContent = fmod;
            modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
        }
        const cb = document.getElementById(`mSave_${a.key}`);
        const saveEl = document.getElementById(`mSaveVal_${a.key}`);
        if (saveEl) {
            const saveTot = mod + (cb?.checked ? bonus : 0);
            saveEl.textContent = saveTot >= 0 ? '+' + saveTot : '' + saveTot;
        }
    });
    monsterUpdateSkillValues();
};

window.monsterUpdateSkillValues = function() {
    const gs = document.getElementById('mGS')?.value || '0';
    const bonus = _monsterProfBonus(gs);
    SCHEDA_SKILLS.forEach(sk => {
        const row = document.getElementById(`mSkillRow_${sk.key}`);
        if (!row) return;
        const abilVal = parseInt(document.getElementById(`m${sk.ability}`)?.value) || 10;
        const abilMod = Math.floor((abilVal - 10) / 2);
        const isProf = row.classList.contains('proficient');
        const isExp = row.classList.contains('expert');
        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
        const valEl = document.getElementById(`mSkillVal_${sk.key}`);
        if (valEl) valEl.textContent = total >= 0 ? '+' + total : '' + total;
    });
};

window.openMonsterHitDieSelect = function() {
    const dieOptions = [4,6,8,10,12,20].map(d => ({ value: String(d), label: 'd' + d }));
    openCustomSelect(dieOptions, (value) => {
        const btn = document.getElementById('mDadoVita');
        if (btn) { btn.dataset.value = value; btn.textContent = 'd' + value; }
        monsterRecalcHP();
    }, 'Dado Vita');
};

window.monsterRecalcHP = function() {
    const numDice = parseInt(document.getElementById('mDadiVitaNum')?.value) || 1;
    const die = parseInt(document.getElementById('mDadoVita')?.dataset?.value) || 8;
    const con = parseInt(document.getElementById('mcostituzione')?.value) || 10;
    const conMod = Math.floor((con - 10) / 2);
    const avgDie = (die + 1) / 2;
    const hp = Math.floor(numDice * avgDie + numDice * conMod);
    const pvInput = document.getElementById('mPV');
    if (pvInput) pvInput.value = Math.max(1, hp);
    const formula = document.getElementById('mHPFormula');
    if (formula) {
        const conPart = conMod !== 0 ? ` ${conMod > 0 ? '+' : '−'} ${Math.abs(numDice * conMod)}` : '';
        formula.textContent = `${numDice}d${die}${conPart} = ${Math.max(1, hp)} PV`;
    }
};

window.monsterAutoCompileStats = function() {
    const dex = parseInt(document.getElementById('mdestrezza')?.value) || 10;
    const initInput = document.getElementById('mInitMod');
    if (initInput && !initInput.dataset.userEdited) initInput.value = Math.floor((dex - 10) / 2);

    const taglia = document.getElementById('mTaglia')?.dataset?.value || 'Media';
    const dieBtn = document.getElementById('mDadoVita');
    if (dieBtn && !dieBtn.dataset.userEdited) {
        const die = _monsterSizeHitDie(taglia);
        dieBtn.dataset.value = die;
        dieBtn.textContent = 'd' + die;
    }

    const gs = parseInt(document.getElementById('mGS')?.value) || 1;
    const numInput = document.getElementById('mDadiVitaNum');
    if (numInput && !numInput.dataset.userEdited) numInput.value = Math.max(1, gs);

    monsterRecalcHP();
};

function _showMonsterWizard(campagnaId, sessioneId, prefill) {
    const p = prefill || {};
    const choicePage = document.getElementById('monsterChoicePage');
    if (choicePage) choicePage.style.display = 'none';
    const container = document.getElementById('monsterWizardContainer');
    if (!container) return;
    container.style.display = 'flex';

    const h2 = document.getElementById('monsterModalTitle');
    if (h2) h2.textContent = prefill ? 'Importa Mostro' : 'Nuovo Mostro';
    const stepsBar = document.getElementById('monsterWizardSteps');
    if (stepsBar) { stepsBar.style.display = ''; stepsBar.querySelectorAll('.wizard-step').forEach((s,i) => s.classList.toggle('active', i === 0)); }

    const pSaves = p.tiri_salvezza || [];
    const pSkills = p.competenze_abilita || [];
    const pExpert = p.maestrie_abilita || [];
    const pSlots = p.slot_incantesimo || {};
    const SPELL_ABILITIES = ['intelligenza','saggezza','carisma'];
    const SPELL_AB_LABELS = { intelligenza:'Intelligenza', saggezza:'Saggezza', carisma:'Carisma' };

    container.innerHTML = `
        <form id="monsterForm" onsubmit="return false;">
            <div class="wizard-page active" id="mStep0">
                <div class="form-section-label">Identità</div>
                <div class="form-group">
                    <label for="mNome">Nome</label>
                    <input type="text" id="mNome" required placeholder="Nome del mostro" value="${escapeHtml(p.nome || '')}">
                </div>
                <div class="form-group">
                    <label>Tipologia</label>
                    <button type="button" class="custom-select-trigger" id="mTipologia" data-value="${p.tipo || p.tipologia || MONSTER_TYPES[0]}" onclick="openMonsterFieldSelect('mTipologia',MONSTER_TYPES,'Tipologia')">${p.tipo || p.tipologia || MONSTER_TYPES[0]}</button>
                </div>
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <label>Taglia</label>
                        <button type="button" class="custom-select-trigger" id="mTaglia" data-value="${p.taglia || 'Media'}" onclick="openMonsterFieldSelect('mTaglia',MONSTER_SIZES,'Taglia')">${p.taglia || 'Media'}</button>
                    </div>
                    <div class="form-group">
                        <label for="mGS">Grado Sfida</label>
                        <input type="text" id="mGS" value="${p.grado_sfida || '0'}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Allineamento</label>
                    <button type="button" class="custom-select-trigger" id="mAllineamento" data-value="${p.allineamento || MONSTER_ALIGNMENTS[0]}" onclick="openMonsterFieldSelect('mAllineamento',MONSTER_ALIGNMENTS,'Allineamento')">${p.allineamento || MONSTER_ALIGNMENTS[0]}</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeMonsterModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep1">
                <div class="form-section-label">Caratteristiche e Tiri Salvezza</div>
                <div class="wizard-page-scroll">
                    <div class="pg-abilities-grid">
                        ${SCHEDA_ABILITIES.map(a => {
                            const val = p[a.key] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            const fmod = mod >= 0 ? '+' + mod : '' + mod;
                            return `
                        <div class="pg-ability-block">
                            <label>${a.full}</label>
                            <div class="pg-ability-row"><input type="number" id="m${a.key}" class="pg-ability-input" min="1" max="30" value="${val}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="monsterUpdateMods()"><span class="pg-ability-mod" id="mMod_${a.key}">${fmod}</span></div>
                            <label class="pg-save-item"><input type="checkbox" id="mSave_${a.key}" ${pSaves.includes(a.key)?'checked':''} onchange="monsterUpdateMods()"> <span class="pg-save-val" id="mSaveVal_${a.key}">${fmod}</span></label>
                        </div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep2">
                <div class="form-section-label">Statistiche</div>
                <div class="wizard-page-scroll">
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label for="mCA">CA</label><input type="number" id="mCA" min="1" value="${p.classe_armatura || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="mVel">Velocità</label><input type="number" id="mVel" min="0" step="1.5" value="${parseFloat(p.velocita) || 9}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                        <div class="form-group"><label for="mInitMod">Mod. Iniz.</label><input type="number" id="mInitMod" value="${p.mod_iniziativa ?? ''}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm)">Punti Vita</div>
                    <div class="pg-stats-row-3">
                        <div class="form-group"><label>N° Dadi</label><input type="number" id="mDadiVitaNum" min="1" value="${p.dadi_vita_num || Math.max(1, parseInt(p.grado_sfida)||1)}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)" onchange="monsterRecalcHP()"></div>
                        <div class="form-group"><label>Dado</label><button type="button" class="custom-select-trigger" id="mDadoVita" data-value="${p.dado_vita || _monsterSizeHitDie(p.taglia)}" onclick="openMonsterHitDieSelect()">${p.dado_vita ? 'd'+p.dado_vita : 'd'+_monsterSizeHitDie(p.taglia)}</button></div>
                        <div class="form-group"><label>PV Max</label><input type="number" id="mPV" min="1" value="${p.punti_vita_max || 10}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    </div>
                    <p class="monster-hp-formula" id="mHPFormula"></p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep3">
                <div class="form-section-label">Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="pg-skills-list" id="mSkillsList">${SCHEDA_SKILLS.map(sk => {
                        const isProf = pSkills.includes(sk.key);
                        const isExp = pExpert.includes(sk.key);
                        const abilMod = Math.floor(((p[sk.ability]||10)-10)/2);
                        const bonus = _monsterProfBonus(p.grado_sfida);
                        const total = abilMod + (isProf ? bonus : 0) + (isExp ? bonus : 0);
                        const fval = total >= 0 ? '+' + total : '' + total;
                        return `<div class="pg-skill-item ${isProf ? 'proficient' : ''} ${isExp ? 'expert' : ''}" id="mSkillRow_${sk.key}">
                            <span class="pg-skill-dot ${isProf ? 'active' : ''}" onclick="monsterToggleSkill('${sk.key}')" title="Competenza">●</span>
                            <span class="pg-skill-dot expert ${isExp ? 'active' : ''}" onclick="monsterToggleSkillExpert('${sk.key}')" title="Maestria">★</span>
                            <span class="pg-skill-value" id="mSkillVal_${sk.key}">${fval}</span>
                            <span class="pg-skill-name">${sk.label}</span>
                            <span class="pg-skill-ability">(${sk.ability.substring(0, 3).toUpperCase()})</span>
                        </div>`;
                    }).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep4">
                <div class="form-section-label">Resistenze e Immunità</div>
                <div class="pg-res-header"><span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span></div>
                <div class="wizard-page-scroll"><div id="mResImmGrid" class="pg-res-grid"></div></div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep5">
                <div class="form-section-label">Azioni</div>
                <div class="wizard-page-scroll">
                    <div id="mAttacchiList">${_renderMonsterAttacks(p.attacchi || [])}</div>
                    <button type="button" class="hb-add-btn" onclick="monsterAddAttack()">+ Aggiungi azione</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep6">
                <div class="form-section-label">Leggendario</div>
                <div class="wizard-page-scroll">
                    <div class="form-group"><label for="mResLegg">Resistenze Leggendarie</label><input type="number" id="mResLegg" min="0" value="${p.resistenze_leggendarie || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group"><label for="mAzLeggMax">Azioni Leggendarie per turno</label><input type="number" id="mAzLeggMax" min="0" value="${p.azioni_legg_max || 0}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
                    <div class="form-group" style="margin-top:var(--spacing-sm);">
                        <label>Azioni Leggendarie</label>
                        <div id="mAzioniLeggList">${_renderMonsterLeggActions(p.azioni_leggendarie || [])}</div>
                        <button type="button" class="hb-add-btn" onclick="monsterAddLeggAction()">+ Aggiungi azione</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep7">
                <div class="form-section-label">Incantesimi (opzionale)</div>
                <div class="wizard-page-scroll">
                    <div class="form-group">
                        <label>Caratteristica da incantatore</label>
                        <button type="button" class="custom-select-trigger" id="mCarInc" data-value="${p.caratteristica_incantatore || ''}" onclick="openSpellAbilitySelect('mCarInc')">${p.caratteristica_incantatore ? SPELL_AB_LABELS[p.caratteristica_incantatore] : 'Nessuna'}</button>
                    </div>
                    <div class="form-section-label" style="margin-top:var(--spacing-sm);">Slot per livello</div>
                    <div class="hb-stats-grid">
                        ${[1,2,3,4,5,6,7,8,9].map(lv => `<div class="form-group"><label>Lv ${lv}</label><input type="number" id="mSlot${lv}" min="0" value="${pSlots[lv]?.max || 0}"></div>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="saveMonster()">Crea</button>
                </div>
            </div>
        </form>`;

    window._monsterWizardStep = 0;
    window._monsterResistenze = (p.resistenze || []).slice();
    window._monsterImmunita = (p.immunita || []).slice();
}

function _renderMonsterAttacks(attacks) {
    if (!attacks || !attacks.length) return '';
    return attacks.map((a, i) => _monsterActionCard(a, i, 'm')).join('');
}

function _monsterActionCard(a, idx, prefix) {
    a = a || {};
    const usi = a.usi_max ?? '';
    return `<div class="hb-action-card" data-idx="${idx}">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" value="${escapeHtml(a.nome || '')}" class="${prefix}AtkNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <div class="hb-action-card-row">
            <div class="form-group" style="flex:1"><label>Tiro / Bonus</label><input type="text" placeholder="+5" value="${escapeHtml(a.bonus || '')}" class="${prefix}AtkBonus"></div>
            <div class="form-group" style="flex:1"><label>Danno</label><input type="text" placeholder="1d8+3" value="${escapeHtml(a.danno || '')}" class="${prefix}AtkDanno"></div>
            <div class="form-group" style="width:70px"><label>Usi</label><input type="number" class="${prefix}AtkUsiMax" min="0" value="${usi}" placeholder="∞" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)"></div>
        </div>
        <textarea class="${prefix}AtkDesc" placeholder="Descrizione..." rows="2">${escapeHtml(a.descrizione || '')}</textarea>
    </div>`;
}

window.monsterAddAttack = function() {
    const list = document.getElementById('mAttacchiList');
    if (!list) return;
    const idx = list.querySelectorAll('.hb-action-card').length;
    list.insertAdjacentHTML('beforeend', _monsterActionCard({}, idx, 'm'));
};

function _renderMonsterLeggActions(actions) {
    if (!actions || !actions.length) return '';
    return actions.map((a, i) => `<div class="hb-action-card" data-idx="${i}">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" value="${escapeHtml(a.nome || '')}" class="mLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="mLeggDesc" placeholder="Descrizione..." rows="2">${escapeHtml(a.descrizione || '')}</textarea>
    </div>`).join('');
}
window.monsterAddLeggAction = function() {
    const list = document.getElementById('mAzioniLeggList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', `<div class="hb-action-card">
        <div class="hb-action-card-row">
            <input type="text" placeholder="Nome azione" class="mLeggNome">
            <button type="button" class="hb-action-remove" onclick="this.closest('.hb-action-card').remove()">✕</button>
        </div>
        <textarea class="mLeggDesc" placeholder="Descrizione..." rows="2"></textarea>
    </div>`);
};

window.closeMonsterModal = function() {
    const modal = document.getElementById('monsterModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

window.openMonsterFieldSelect = function(fieldId, options, title) {
    openCustomSelect(
        options.map(o => ({ value: o, label: o })),
        (value) => {
            const btn = document.getElementById(fieldId);
            if (btn) { btn.dataset.value = value; btn.textContent = value; btn.classList.remove('placeholder'); }
        },
        title
    );
}

window.monsterToggleSkill = function(skillKey) {
    const row = document.getElementById(`mSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    const isActive = dot?.classList.toggle('active');
    row.classList.toggle('proficient', isActive);
    if (!isActive) {
        const star = row.querySelector('.pg-skill-dot.expert');
        if (star) star.classList.remove('active');
        row.classList.remove('expert');
    }
    monsterUpdateSkillValues();
};

window.monsterToggleSkillExpert = function(skillKey) {
    const row = document.getElementById(`mSkillRow_${skillKey}`);
    if (!row) return;
    const dot = row.querySelector('.pg-skill-dot:not(.expert)');
    if (!dot?.classList.contains('active')) {
        dot?.classList.add('active');
        row.classList.add('proficient');
    }
    const star = row.querySelector('.pg-skill-dot.expert');
    const isActive = star?.classList.toggle('active');
    row.classList.toggle('expert', isActive);
    monsterUpdateSkillValues();
};

window.openSpellAbilitySelect = function(fieldId) {
    const SPELL_OPTIONS = [
        { value: '', label: 'Nessuna' },
        { value: 'intelligenza', label: 'Intelligenza' },
        { value: 'saggezza', label: 'Saggezza' },
        { value: 'carisma', label: 'Carisma' }
    ];
    openCustomSelect(
        SPELL_OPTIONS,
        (value) => {
            const btn = document.getElementById(fieldId);
            if (btn) {
                btn.dataset.value = value;
                btn.textContent = SPELL_OPTIONS.find(o => o.value === value)?.label || 'Nessuna';
                btn.classList.remove('placeholder');
            }
        },
        'Caratteristica incantatore'
    );
};

function monsterRenderResImmGrid() {
    const container = document.getElementById('mResImmGrid');
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = (window._monsterResistenze || []).includes(dt.value);
        const isImm = (window._monsterImmunita || []).includes(dt.value);
        return `
        <div class="pg-res-row">
            <span class="pg-res-label">${dt.label}</span>
            <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="monsterToggleRes('${dt.value}', this.checked)" title="Resistenza">
            <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="monsterToggleImm('${dt.value}', this.checked)" title="Immunità">
        </div>`;
    }).join('');
}

window.monsterToggleRes = function(val, checked) {
    if (!window._monsterResistenze) window._monsterResistenze = [];
    if (checked) { if (!window._monsterResistenze.includes(val)) window._monsterResistenze.push(val); }
    else { window._monsterResistenze = window._monsterResistenze.filter(r => r !== val); }
}

window.monsterToggleImm = function(val, checked) {
    if (!window._monsterImmunita) window._monsterImmunita = [];
    if (checked) { if (!window._monsterImmunita.includes(val)) window._monsterImmunita.push(val); }
    else { window._monsterImmunita = window._monsterImmunita.filter(r => r !== val); }
}


window.monsterWizardNav = function(dir) {
    if (dir > 0 && (window._monsterWizardStep || 0) === 0) {
        const nome = document.getElementById('mNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci un nome per il mostro'); return; }
    }
    const totalSteps = 8;
    const maxStep = totalSteps - 1;
    window._monsterWizardStep = Math.max(0, Math.min(maxStep, (window._monsterWizardStep || 0) + dir));
    const step = window._monsterWizardStep;
    for (let i = 0; i <= maxStep; i++) {
        const page = document.getElementById(`mStep${i}`);
        if (page) page.classList.toggle('active', i === step);
    }
    if (step === 1) monsterUpdateMods();
    if (step === 2) monsterAutoCompileStats();
    if (step === 3) monsterUpdateSkillValues();
    if (step === 4) monsterRenderResImmGrid();
    const stepsBar = document.getElementById('monsterWizardSteps');
    if (stepsBar) {
        stepsBar.querySelectorAll('.wizard-step').forEach((dot, i) => dot.classList.toggle('active', i <= step));
    }
}

window.saveMonster = async function() {
    const modal = document.getElementById('monsterModal');
    const campagnaId = modal?.dataset.campagnaId;
    const sessioneId = modal?.dataset.sessioneId;
    if (!campagnaId || !sessioneId) return;

    const nome = document.getElementById('mNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome per il mostro'); return; }

    const saves = SCHEDA_ABILITIES.filter(a => document.getElementById(`mSave_${a.key}`)?.checked).map(a => a.key);
    const skills = SCHEDA_SKILLS.filter(s => document.getElementById(`mSkillRow_${s.key}`)?.classList.contains('proficient')).map(s => s.key);
    const skillExpert = SCHEDA_SKILLS.filter(s => document.getElementById(`mSkillRow_${s.key}`)?.classList.contains('expert')).map(s => s.key);
    const resistenze = window._monsterResistenze || [];
    const immunita = window._monsterImmunita || [];
    const pvMax = parseInt(document.getElementById('mPV')?.value) || 10;
    const resLegg = parseInt(document.getElementById('mResLegg')?.value) || 0;

    const attacchi = [...document.querySelectorAll('#mAttacchiList .hb-action-card')].map(card => {
        const usiVal = card.querySelector('.mAtkUsiMax')?.value;
        const usiMax = usiVal !== '' && usiVal !== undefined ? (parseInt(usiVal) || 0) : 0;
        return {
            nome: card.querySelector('.mAtkNome')?.value || '',
            bonus: card.querySelector('.mAtkBonus')?.value || '',
            danno: card.querySelector('.mAtkDanno')?.value || '',
            descrizione: card.querySelector('.mAtkDesc')?.value || '',
            usi_max: usiMax,
            usi_attuali: usiMax
        };
    }).filter(a => a.nome);

    const azioniLegg = [...document.querySelectorAll('#mAzioniLeggList .hb-action-card')].map(card => ({
        nome: card.querySelector('.mLeggNome')?.value || '',
        descrizione: card.querySelector('.mLeggDesc')?.value || ''
    })).filter(a => a.nome);

    const azLeggMaxVal = parseInt(document.getElementById('mAzLeggMax')?.value) || 0;

    const carInc = document.getElementById('mCarInc')?.dataset?.value || null;
    let slotInc = null;
    if (carInc) {
        slotInc = {};
        for (let lv = 1; lv <= 9; lv++) {
            const max = parseInt(document.getElementById(`mSlot${lv}`)?.value) || 0;
            if (max > 0) slotInc[lv] = { max, current: max };
        }
        if (Object.keys(slotInc).length === 0) slotInc = null;
    }

    const monster = {
        sessione_id: sessioneId,
        campagna_id: campagnaId,
        nome,
        tipologia: document.getElementById('mTipologia')?.dataset?.value || 'Bestia',
        taglia: document.getElementById('mTaglia')?.dataset?.value || 'Media',
        allineamento: document.getElementById('mAllineamento')?.dataset?.value || 'Neutrale',
        grado_sfida: document.getElementById('mGS')?.value || '0',
        forza: parseInt(document.getElementById('mforza')?.value) || 10,
        destrezza: parseInt(document.getElementById('mdestrezza')?.value) || 10,
        costituzione: parseInt(document.getElementById('mcostituzione')?.value) || 10,
        intelligenza: parseInt(document.getElementById('mintelligenza')?.value) || 10,
        saggezza: parseInt(document.getElementById('msaggezza')?.value) || 10,
        carisma: parseInt(document.getElementById('mcarisma')?.value) || 10,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        dadi_vita_num: parseInt(document.getElementById('mDadiVitaNum')?.value) || 1,
        dado_vita: parseInt(document.getElementById('mDadoVita')?.dataset?.value) || 8,
        classe_armatura: parseInt(document.getElementById('mCA')?.value) || 10,
        velocita: parseFloat(document.getElementById('mVel')?.value) || 9,
        iniziativa: (() => { const mod = parseInt(document.getElementById('mInitMod')?.value); const dexMod = Math.floor(((parseInt(document.getElementById('mdestrezza')?.value) || 10) - 10) / 2); const finalMod = isNaN(mod) ? dexMod : mod; return Math.floor(Math.random() * 20) + 1 + finalMod; })(),
        tiri_salvezza: saves,
        competenze_abilita: skills,
        maestrie_abilita: skillExpert,
        resistenze,
        immunita,
        attacchi,
        azioni_leggendarie: azioniLegg,
        resistenze_leggendarie: resLegg,
        res_legg_attuali: resLegg,
        azioni_legg_max: azLeggMaxVal,
        azioni_legg_attuali: azLeggMaxVal,
        slot_incantesimo: slotInc,
        caratteristica_incantatore: carInc
    };

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('mostri_combattimento').insert(monster);
    if (error) { showNotification('Errore creazione mostro: ' + error.message); return; }

    closeMonsterModal();
    showNotification(`${nome} aggiunto al combattimento!`);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_added', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.terminaCombattimento = async function(campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può terminare il combattimento');
            return;
        }

        const { error: deleteError } = await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);

        if (deleteError) throw deleteError;

        // Delete volatile monsters
        await supabase.from('mostri_combattimento').delete().eq('sessione_id', sessioneId);

        // Reset round/turn
        await supabase.from('sessioni').update({ combat_round: 1, combat_turn_index: 0 }).eq('id', sessioneId);

        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'delete', sessioneId, campagnaId });

        showNotification('Combattimento terminato');

        navigateToPage('sessione');
        await renderSessioneContent(campagnaId);
    } catch (error) {
        console.error('❌ Errore nella terminazione combattimento:', error);
        showNotification('Errore nella terminazione del combattimento: ' + (error.message || error));
    }
};

/**
 * Rimuove una voce dall'iniziativa
 */
window.rimuoviIniziativa = async function(iniziativaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const { error } = await supabase
            .from('iniziativa')
            .delete()
            .eq('id', iniziativaId);

        if (error) throw error;
        await sendAppEventBroadcast({ table: 'iniziativa', action: 'delete', sessioneId, iniziativaId });

        showNotification('Iniziativa rimossa!');
        
        // Ricarica la sessione
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (sessione) {
            await renderSessioneContent(sessione.campagna_id);
        }
    } catch (error) {
        console.error('❌ Errore nella rimozione iniziativa:', error);
        showNotification('Errore nella rimozione dell\'iniziativa: ' + (error.message || error));
    }
};
