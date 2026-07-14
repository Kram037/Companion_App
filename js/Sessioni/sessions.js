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
                    AppState.currentSessioneId = sess.id;
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
    AppState.activeSessionCampagnaId = campagnaId;
    sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
    navigateToPage('sessione');
};

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
        await sendAppEventBroadcast({ table: 'personaggi', action: 'update' });
    } catch (e) {
        console.error('Errore aggiornamento condizioni:', e);
        showNotification('Errore: ' + (e.message || e));
    }
}

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
                .select('id, immagine_url, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, punti_vita_max, pv_attuali')
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

window.openCombattimentoPage = async function(campagnaId, sessioneId) {
    AppState.currentCampagnaId = campagnaId;
    AppState.currentSessioneId = sessioneId;
    await navigateToPage('combattimento');
};
