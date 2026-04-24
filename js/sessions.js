// ============================================
// GESTIONE SESSIONI
// ============================================

/**
 * Verifica se c'è una sessione attiva per una campagna
 */
async function checkSessioneAttiva(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { data, error } = await supabase
            .from('sessioni')
            .select('id')
            .eq('campagna_id', campagnaId)
            .is('data_fine', null)
            .limit(1)
            .single();

        return !error && data !== null;
    } catch (error) {
        console.error('❌ Errore nel controllo sessione attiva:', error);
        return false;
    }
}

/**
 * Ottiene la sessione attiva per una campagna
 */
async function getSessioneAttiva(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('sessioni')
            .select('*')
            .eq('campagna_id', campagnaId)
            .is('data_fine', null)
            .limit(1)
            .single();

        if (error) return null;
        return data;
    } catch (error) {
        console.error('❌ Errore nel recupero sessione attiva:', error);
        return null;
    }
}

/**
 * Controlla all'avvio se ci sono sessioni attive o richieste di tiro pending
 */
async function checkStartupNotifications() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    try {
        const userData = await findUserByUid(AppState.currentUser.uid);
        if (!userData) return;

        const [pendingRoll, dmCampagneResult, playerCampagneResult] = await Promise.all([
            checkPendingRollRequests(AppState.currentUser.uid),
            supabase.from('campagne').select('id').eq('id_dm', userData.id),
            supabase.from('inviti_campagna').select('campagna_id').eq('invitato_id', userData.id).eq('stato', 'accepted')
        ]);

        if (pendingRoll && !window.currentRollRequest) {
            showRollRequestModal(pendingRoll);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }

        if (!AppState.activeSessionCampagnaId) {
            const myCampagnaIds = [
                ...(dmCampagneResult.data || []).map(c => c.id),
                ...(playerCampagneResult.data || []).map(c => c.campagna_id)
            ];
            if (myCampagnaIds.length > 0) {
                const { data: activeSessions } = await supabase
                    .from('sessioni')
                    .select('id, campagna_id')
                    .in('campagna_id', myCampagnaIds)
                    .is('data_fine', null)
                    .limit(1);

                if (activeSessions && activeSessions.length > 0) {
                    const sess = activeSessions[0];
                    AppState.activeSessionCampagnaId = sess.campagna_id;
                    sessionStorage.setItem('activeSessionCampagnaId', sess.campagna_id);
                    AppState.currentCampagnaId = sess.campagna_id;
                    sessionStorage.setItem('currentCampagnaId', sess.campagna_id);
                    AppState.currentSessioneId = sess.id;
                    sessionStorage.setItem('currentSessioneId', sess.id);
                    updateReturnToSessionBtn();
                }
            }
        }
    } catch (error) {
        console.error('Errore checkStartupNotifications:', error);
    }
}

/**
 * Inizia una nuova sessione per una campagna
 */
window.iniziaSessione = async function(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che non ci sia già una sessione attiva
        const sessioneAttiva = await checkSessioneAttiva(campagnaId);
        if (sessioneAttiva) {
            showNotification('C\'è già una sessione attiva per questa campagna');
            openSessionePage(campagnaId);
            return;
        }

        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può iniziare una sessione');
            return;
        }

        // Crea la nuova sessione
        const { data, error } = await supabase
            .from('sessioni')
            .insert({
                campagna_id: campagnaId,
                data_inizio: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        await sendAppEventBroadcast({ table: 'sessioni', action: 'insert', campagnaId, sessioneId: data?.id });

        showNotification('Sessione iniziata!');
        
        // Apri la pagina sessione
        openSessionePage(campagnaId);
    } catch (error) {
        console.error('❌ Errore nell\'inizio sessione:', error);
        showNotification('Errore nell\'inizio della sessione: ' + (error.message || error));
    }
};

/**
 * Verifica che il giocatore abbia un personaggio selezionato prima di entrare in sessione
 */
window.playerJoinSession = async function(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;

    try {
        const { data: pg } = await supabase.rpc('get_personaggio_campagna', {
            p_campagna_id: campagnaId,
            p_user_id: userData.id
        });
        if (!pg || pg.length === 0) {
            showNotification('Devi scegliere un personaggio prima di unirti alla sessione');
            return;
        }
        openSessionePage(campagnaId);
    } catch (e) {
        console.error('Errore verifica personaggio:', e);
        showNotification('Devi scegliere un personaggio prima di unirti alla sessione');
    }
}

/**
 * Apre la pagina sessione
 */
window.openSessionePage = async function(campagnaId) {
    AppState.currentCampagnaId = campagnaId;
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    AppState.activeSessionCampagnaId = campagnaId;
    sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
    navigateToPage('sessione');
    await renderSessioneContent(campagnaId);
};

/**
 * Calcola il numero della sessione (sessioni concluse + 1)
 */
async function getNumeroSessione(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return 1;

    try {
        const { count, error } = await supabase
            .from('sessioni')
            .select('*', { count: 'exact', head: true })
            .eq('campagna_id', campagnaId)
            .not('data_fine', 'is', null);

        if (error) {
            console.error('❌ Errore nel conteggio sessioni:', error);
            return 1;
        }

        return (count || 0) + 1;
    } catch (error) {
        console.error('❌ Errore nel conteggio sessioni:', error);
        return 1;
    }
}

/**
 * Renderizza il contenuto della pagina sessione
 */
async function renderSessioneContent(campagnaId) {
    const sessioneContent = document.getElementById('sessioneContent');
    const sessioneTitle = document.getElementById('sessioneCampagnaTitle');
    if (!sessioneContent) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
        sessioneContent.innerHTML = '<p>Errore: Supabase non disponibile</p>';
        return;
    }

    try {
        const [isDM, campagnaResult, sessione] = await Promise.all([
            isCurrentUserDM(campagnaId),
            supabase.from('campagne').select('nome_campagna').eq('id', campagnaId).single(),
            getSessioneAttiva(campagnaId)
        ]);

        const campagna = campagnaResult.data;
        if (campagnaResult.error) throw campagnaResult.error;

        if (!sessione) {
            sessioneContent.innerHTML = `
                <div class="content-placeholder">
                    <p>Nessuna sessione attiva</p>
                    ${isDM ? `<button class="btn-primary" onclick="iniziaSessione('${campagnaId}')">Inizia Sessione</button>` : ''}
                </div>
            `;
            if (sessioneTitle) {
                sessioneTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Sessione</div>`;
            }
            return;
        }

        const [numeroSessione, richiesteResult] = await Promise.all([
            getNumeroSessione(campagnaId),
            supabase.from('richieste_tiro_iniziativa').select('id, stato').eq('sessione_id', sessione.id).limit(1)
        ]);

        if (sessioneTitle) {
            sessioneTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Sessione ${numeroSessione}</div>`;
        }

        const dataInizio = new Date(sessione.data_inizio);
        window._sessioneDataInizio = dataInizio.getTime();
        const durataMs = Date.now() - dataInizio.getTime();
        const durataMinuti = Math.floor(durataMs / 60000);
        const durataOre = Math.floor(durataMinuti / 60);
        const durataMinutiResto = durataMinuti % 60;

        const inCombattimento = richiesteResult.data && richiesteResult.data.length > 0;

        sessioneContent.innerHTML = `
            <div class="sessione-timer">
                <div class="timer-display">
                    <span class="timer-value">${durataOre.toString().padStart(2, '0')}:${durataMinutiResto.toString().padStart(2, '0')}</span>
                    <span class="timer-label">Durata</span>
                </div>
                ${isDM ? `
                <button class="btn-secondary btn-small" onclick="finisciSessione('${sessione.id}', '${campagnaId}')">
                    Fine Sessione
                </button>
                ` : ''}
            </div>

            ${isDM ? `
            <div class="sessione-actions">
                ${inCombattimento ? `
                <button class="btn-primary btn-small" onclick="openCombattimentoPage('${campagnaId}', '${sessione.id}')">
                    Ritorna al combattimento
                </button>
                ` : `
                <button class="btn-primary btn-small" onclick="richiediTiroIniziativa('${sessione.id}', '${campagnaId}')">
                    Tirate iniziativa
                </button>
                `}
                <button class="btn-secondary btn-small" onclick="richiediTiroGenerico('${sessione.id}', '${campagnaId}')">
                    Richiedi tiro
                </button>
            </div>
            <div id="tiroGenericoTable" class="tiro-generico-table" style="display: none;"></div>
            ` : `
            ${inCombattimento ? `
            <div class="sessione-actions">
                <button class="btn-primary btn-small" onclick="openCombattimentoPage('${campagnaId}', '${sessione.id}')">
                    Ritorna al combattimento
                </button>
            </div>
            ` : ''}
            `}

            <div id="sessionePersonaggiCards" class="session-pg-cards"></div>
            <div id="sessioneConditionsPanel"></div>
        `;

        await renderSessionePersonaggiCards(campagnaId);
        // Il vecchio pannello "Stato Personaggi" e' stato rimosso: ora ci
        // affidiamo alle card personaggi sopra. Manteniamo il div per
        // retro-compatibilita' (eventuali handler che lo cercano).

        // Avvia timer se non già avviato
        if (!window.sessioneTimerInterval) {
            startSessioneTimer(campagnaId);
        }

        // Se c'è una tabella tiri generici da mostrare, aggiornala
        if (isDM && window.currentTiroGenericoRichiestaId) {
            await updateTiroGenericoTable(sessione.id, window.currentTiroGenericoRichiestaId);
        }

        // Avvia polling per aggiornare la tabella tiri generici
        if (isDM && !window.tiroGenericoPollingInterval) {
            startTiroGenericoPolling(sessione.id);
        } else if (!isDM && window.tiroGenericoPollingInterval) {
            stopTiroGenericoPolling();
        }
    } catch (error) {
        console.error('❌ Errore nel rendering sessione:', error);
        sessioneContent.innerHTML = '<p>Errore nel caricamento della sessione</p>';
    }
}

/**
 * Avvia il timer per la sessione (aggiorna solo il DOM del timer, non ricarica tutto)
 */
function startSessioneTimer(campagnaId) {
    if (window.sessioneTimerInterval) {
        clearInterval(window.sessioneTimerInterval);
    }

    window.sessioneTimerInterval = setInterval(() => {
        const timerElement = document.querySelector('.timer-value');
        if (!timerElement || !window._sessioneDataInizio) return;
        
        const durataMs = Date.now() - window._sessioneDataInizio;
        const durataMinuti = Math.floor(durataMs / 60000);
        const ore = Math.floor(durataMinuti / 60);
        const min = durataMinuti % 60;
        timerElement.textContent = `${ore.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }, 10000);
}

/**
 * Ferma il timer della sessione
 */
function stopSessioneTimer() {
    if (window.sessioneTimerInterval) {
        clearInterval(window.sessioneTimerInterval);
        window.sessioneTimerInterval = null;
    }
}

/**
 * Finisce una sessione
 */
window.finisciSessione = async function(sessioneId, campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può finire una sessione');
            return;
        }

        const dataFine = new Date().toISOString();

        const { error } = await supabase
            .from('sessioni')
            .update({ data_fine: dataFine, combat_round: 1, combat_turn_index: 0 })
            .eq('id', sessioneId);

        if (error) throw error;

        // Pulisci eventuali richieste/strutture di combattimento ancora pending,
        // cosi' i giocatori che si ricollegano dopo non vedono dialog "fantasma".
        try {
            await Promise.all([
                supabase.from('richieste_tiro_iniziativa').delete().eq('sessione_id', sessioneId),
                supabase.from('richieste_tiro_generico').delete().eq('sessione_id', sessioneId),
                supabase.from('mostri_combattimento').delete().eq('sessione_id', sessioneId),
                supabase.from('iniziativa').delete().eq('sessione_id', sessioneId)
            ]);
            await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'delete', sessioneId, campagnaId });
            await sendAppEventBroadcast({ table: 'richieste_tiro_generico', action: 'delete', sessioneId, campagnaId });
        } catch (cleanupErr) {
            console.warn('⚠️ Cleanup richieste a fine sessione fallito:', cleanupErr);
        }

        await sendAppEventBroadcast({ table: 'sessioni', action: 'update', campagnaId, sessioneId });

        stopSessioneTimer();
        clearActiveSession();
        showNotification('Sessione terminata!');
        
        // Torna ai dettagli campagna
        navigateToPage('dettagli');
        await loadCampagnaDetails(campagnaId);
    } catch (error) {
        console.error('❌ Errore nella fine sessione:', error);
        showNotification('Errore nella fine della sessione: ' + (error.message || error));
    }
};

// --- Conditions / Status management ---
const ALL_CONDITIONS = [
    { key: 'concentrazione', label: 'Concentrazione' },
    { key: 'accecato', label: 'Accecato' },
    { key: 'affascinato', label: 'Affascinato' },
    { key: 'afferrato', label: 'Afferrato' },
    { key: 'assordato', label: 'Assordato' },
    { key: 'avvelenato', label: 'Avvelenato' },
    { key: 'incapacitato', label: 'Incapacitato' },
    { key: 'invisibile', label: 'Invisibile' },
    { key: 'paralizzato', label: 'Paralizzato' },
    { key: 'pietrificato', label: 'Pietrificato' },
    { key: 'privo_di_sensi', label: 'Privo di sensi' },
    { key: 'prono', label: 'Prono' },
    { key: 'spaventato', label: 'Spaventato' },
    { key: 'stordito', label: 'Stordito' },
    { key: 'trattenuto', label: 'Trattenuto' }
];

async function renderSessioneConditions(campagnaId, isDM) {
    const panel = document.getElementById('sessioneConditionsPanel');
    if (!panel) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        if (isDM) {
            const { data: pgList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
            if (!pgList || pgList.length === 0) { panel.innerHTML = ''; return; }

            const pgIds = pgList.map(pg => pg.personaggio_id).filter(Boolean);
            const { data: fullChars } = await supabase.from('personaggi')
                .select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, slot_incantesimo')
                .in('id', pgIds);

            panel.innerHTML = `
                <div class="form-section-label" style="margin-top:var(--spacing-md);">Stato Personaggi</div>
                ${(fullChars || []).map(pg => renderConditionsCard(pg, true)).join('')}
            `;
        } else {
            const userData = AppState.cachedUserData || await findUserByUid(AppState.currentUser?.uid);
            if (!userData) return;
            const { data: pgData } = await supabase.rpc('get_personaggio_campagna', { p_campagna_id: campagnaId, p_user_id: userData.id });
            if (!pgData || pgData.length === 0) { panel.innerHTML = ''; return; }
            const pg = pgData[0];
            const { data: fullPg } = await supabase.from('personaggi').select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, slot_incantesimo').eq('id', pg.id).single();
            if (!fullPg) return;

            panel.innerHTML = `
                <div class="form-section-label" style="margin-top:var(--spacing-md);">Il tuo Personaggio</div>
                ${renderConditionsCard(fullPg, false)}
            `;
        }
    } catch (e) {
        console.error('Errore rendering condizioni:', e);
    }
}

function renderConditionsCard(pg, showName) {
    const activeConditions = ALL_CONDITIONS.filter(c => pg[c.key]);
    const activeLabels = activeConditions.map(c => c.label);
    const conditionsText = activeLabels.length > 0 ? activeLabels.join(', ') : 'Nessuna';

    let slotsHtml = '';
    if (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') {
        const levels = Object.keys(pg.slot_incantesimo).map(Number).sort((a, b) => a - b);
        if (levels.length > 0) {
            slotsHtml = `
            <div class="session-slots-row">
                ${levels.map(lvl => {
                    const s = pg.slot_incantesimo[lvl];
                    return `<div class="session-slot-badge">
                        <span class="session-slot-lvl">Lv${lvl}</span>
                        <span class="session-slot-val" id="sessSlot_${pg.id}_${lvl}">${s.current}</span>/<span class="session-slot-max">${s.max}</span>
                        <div class="session-slot-btns">
                            <button type="button" class="pg-slot-btn-sm" onclick="sessionSlotChange('${pg.id}',${lvl},-1)">−</button>
                            <button type="button" class="pg-slot-btn-sm" onclick="sessionSlotChange('${pg.id}',${lvl},1)">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }
    }

    return `
    <div class="session-condition-card" data-pg-id="${pg.id}">
        ${showName ? `<div class="session-condition-name">${escapeHtml(pg.nome)}</div>` : ''}
        <div class="session-condition-row">
            <div class="session-condition-badges">
                ${activeConditions.map(c => `<span class="condition-badge active">${c.label}</span>`).join('')}
            </div>
            <div class="session-condition-exhaustion">
                <span class="exhaustion-label">Esaustione</span>
                <span class="exhaustion-value">${pg.esaustione || 0}</span>/6
            </div>
        </div>
        <div class="session-condition-actions">
            <button type="button" class="btn-secondary btn-small" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
        </div>
        ${slotsHtml}
    </div>`;
}

window.openConditionsModal = async function(personaggioId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg, error } = await supabase.from('personaggi').select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione').eq('id', personaggioId).single();
    if (error || !pg) { showNotification('Errore nel caricamento del personaggio'); return; }

    const modalHtml = `
    <div class="modal active" id="conditionsModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeConditionsModal()">&times;</button>
            <h2>Stato: ${escapeHtml(pg.nome)}</h2>
            <div class="form-section-label">Condizioni</div>
            <div class="pg-conditions-grid">
                ${ALL_CONDITIONS.filter(c => c.key !== 'concentrazione').map(c => `
                    <label class="pg-condition-item">
                        <input type="checkbox" id="cond_${c.key}" ${pg[c.key] ? 'checked' : ''}>
                        <label for="cond_${c.key}">${c.label}</label>
                    </label>
                `).join('')}
            </div>
            <div class="form-section-label" style="margin-top:var(--spacing-sm);">Esaustione</div>
            <div class="pg-exhaustion-row">
                <label>Livello</label>
                <input type="range" id="cond_esaustione" min="0" max="6" value="${pg.esaustione || 0}" oninput="document.getElementById('condExhaustionVal').textContent = this.value">
                <span class="pg-exhaustion-value" id="condExhaustionVal">${pg.esaustione || 0}</span>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeConditionsModal()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveConditions('${personaggioId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.closeConditionsModal = function() {
    const m = document.getElementById('conditionsModal');
    if (m) m.remove();
    document.body.style.overflow = '';
}

window.saveConditions = async function(personaggioId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updates = {};
    ALL_CONDITIONS.forEach(c => {
        const cb = document.getElementById(`cond_${c.key}`);
        if (cb) updates[c.key] = cb.checked;
    });
    const exhInput = document.getElementById('cond_esaustione');
    if (exhInput) updates.esaustione = parseInt(exhInput.value) || 0;
    updates.updated_at = new Date().toISOString();

    try {
        const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) throw error;
        showNotification('Stato aggiornato');
        closeConditionsModal();
        if (AppState.currentPage === 'scheda' && AppState.currentPersonaggioId) {
            await renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
        if (AppState.currentCampagnaId) {
            const isDM = await isCurrentUserDM(AppState.currentCampagnaId);
            await renderSessioneConditions(AppState.currentCampagnaId, isDM);
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: 'update' });
    } catch (e) {
        console.error('Errore aggiornamento condizioni:', e);
        showNotification('Errore: ' + (e.message || e));
    }
}

window.sessionSlotChange = async function(personaggioId, level, delta) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', personaggioId).single();
    if (!pg || !pg.slot_incantesimo) return;

    const slots = { ...pg.slot_incantesimo };
    const slot = slots[level];
    if (!slot) return;

    const newCurrent = Math.max(0, Math.min(slot.max, slot.current + delta));
    if (newCurrent === slot.current) return;

    slots[level] = { ...slot, current: newCurrent };

    try {
        const { error } = await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        if (error) throw error;
        const el = document.getElementById(`sessSlot_${personaggioId}_${level}`);
        if (el) el.textContent = newCurrent;
    } catch (e) {
        console.error('Errore aggiornamento slot:', e);
    }
}

// ===========================================================================
// Card personaggi (riutilizzabili in sessione, dettaglio campagna, ecc.)
// ===========================================================================
// Recupera la lista dei personaggi della campagna gia' "appiattita" per il
// rendering delle card (id personaggio + nome). Restituisce array vuoto se
// non ci sono personaggi o c'e' stato un errore.
async function getCampaignPersonaggiList(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase || !campagnaId) return [];
    try {
        const { data: pgList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
        if (!pgList) return [];
        return pgList
            .filter(p => p.personaggio_id)
            .map(p => ({
                id: p.personaggio_id,
                nome: p.nome || '?',
                player_user_id: p.player_user_id || null
            }));
    } catch (e) {
        console.warn('Errore caricamento personaggi campagna:', e);
        return [];
    }
}

// Render delle card personaggi all'interno della pagina sessione.
async function renderSessionePersonaggiCards(campagnaId) {
    const container = document.getElementById('sessionePersonaggiCards');
    if (!container) return;
    const list = await getCampaignPersonaggiList(campagnaId);
    if (list.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <div class="session-pg-cards-title">Personaggi</div>
        <div class="session-pg-cards-grid">
            ${list.map(p => `
                <button type="button" class="session-pg-card" onclick="openSchedaPersonaggio('${p.id}')" title="${escapeHtml(p.nome)}">
                    <span class="session-pg-card-initials">${escapeHtml((p.nome || '?').substring(0, 2).toUpperCase())}</span>
                    <span class="session-pg-card-name">${escapeHtml(p.nome)}</span>
                </button>
            `).join('')}
        </div>`;
}
window.renderSessionePersonaggiCards = renderSessionePersonaggiCards;

// Render delle card personaggi nella pagina dettaglio campagna (sotto le
// statistiche). Stessa estetica.
async function renderCampagnaPersonaggiCards(campagnaId) {
    const container = document.getElementById('campagnaPersonaggiCards');
    if (!container) return;
    const list = await getCampaignPersonaggiList(campagnaId);
    if (list.length === 0) {
        container.innerHTML = `<div class="campagna-pg-empty">Nessun personaggio in questa campagna.</div>`;
        return;
    }
    container.innerHTML = `
        <div class="session-pg-cards-grid">
            ${list.map(p => `
                <button type="button" class="session-pg-card" onclick="openSchedaPersonaggio('${p.id}')" title="${escapeHtml(p.nome)}">
                    <span class="session-pg-card-initials">${escapeHtml((p.nome || '?').substring(0, 2).toUpperCase())}</span>
                    <span class="session-pg-card-name">${escapeHtml(p.nome)}</span>
                </button>
            `).join('')}
        </div>`;
}
window.renderCampagnaPersonaggiCards = renderCampagnaPersonaggiCards;

/**
 * Fetches campaign characters once and returns both names and conditions maps.
 * Avoids duplicate RPC + eliminates N+1 queries.
 */
async function getCampaignCharacterData(campagnaId) {
    const namesMap = {};
    const conditionsMap = {};
    const supabase = getSupabaseClient();
    if (!supabase || !campagnaId) return { namesMap, conditionsMap };
    try {
        const { data: pgList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
        if (!pgList || pgList.length === 0) return { namesMap, conditionsMap };

        pgList.forEach(pg => { namesMap[pg.player_user_id] = pg.nome; });

        const pgIds = pgList.map(pg => pg.personaggio_id).filter(Boolean);
        if (pgIds.length > 0) {
            const { data: charRows } = await supabase.from('personaggi')
                .select('id, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, punti_vita_max, pv_attuali')
                .in('id', pgIds);
            if (charRows) {
                const charById = {};
                charRows.forEach(c => { charById[c.id] = c; });
                pgList.forEach(pg => {
                    if (charById[pg.personaggio_id]) conditionsMap[pg.player_user_id] = charById[pg.personaggio_id];
                });
            }
        }
    } catch (e) { console.warn('Errore caricamento dati personaggi campagna:', e); }
    return { namesMap, conditionsMap };
}

async function getCharacterNamesMap(campagnaId) {
    const { namesMap } = await getCampaignCharacterData(campagnaId);
    return namesMap;
}

async function getCharacterConditionsMap(campagnaId) {
    const { conditionsMap } = await getCampaignCharacterData(campagnaId);
    return conditionsMap;
}

window.aggiungiIniziativa = async function(sessioneId) {
    const nome = await showPrompt('Nome personaggio:', 'Aggiungi Iniziativa');
    if (!nome || nome.trim() === '') return;
    const valoreStr = await showPrompt('Valore iniziativa (d20 + modificatori):', 'Aggiungi Iniziativa');
    if (!valoreStr) return;
    const valore = parseInt(valoreStr);
    if (isNaN(valore)) { showNotification('Inserisci un numero valido'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { showNotification('Errore: Supabase non disponibile'); return; }
    try {
        const { data: existing } = await supabase.from('iniziativa').select('ordine').eq('sessione_id', sessioneId).order('ordine', { ascending: false }).limit(1);
        const nuovoOrdine = existing && existing.length > 0 ? existing[0].ordine + 1 : 1;
        const { error } = await supabase.from('iniziativa').insert({ sessione_id: sessioneId, personaggio_nome: nome.trim(), valore_iniziativa: valore, ordine: nuovoOrdine });
        if (error) throw error;
        await sendAppEventBroadcast({ table: 'iniziativa', action: 'insert', sessioneId });
        showNotification('Iniziativa aggiunta!');
        const { data: sessione } = await supabase.from('sessioni').select('campagna_id').eq('id', sessioneId).single();
        if (sessione) await renderSessioneContent(sessione.campagna_id);
    } catch (error) {
        console.error('❌ Errore nell\'aggiunta iniziativa:', error);
        showNotification('Errore nell\'aggiunta dell\'iniziativa: ' + (error.message || error));
    }
};

window.openCombattimentoPage = async function(campagnaId, sessioneId) {
    AppState.currentCampagnaId = campagnaId;
    AppState.currentSessioneId = sessioneId;
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    sessionStorage.setItem('currentSessioneId', sessioneId);
    navigateToPage('combattimento');
    await renderCombattimentoContent(campagnaId, sessioneId);
    startCombattimentoRealtime(campagnaId, sessioneId);
};
