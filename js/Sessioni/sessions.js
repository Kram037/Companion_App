// ============================================
// GESTIONE SESSIONI
// ============================================

/**
 * Ottiene la sessione attiva per una campagna
 */
async function getSessioneAttiva(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('sessioni')
            .select('id')
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
                if (!AppState.activeSessionCampagnaId) {
                    AppState.activeSessionCampagnaId = sess.campagna_id;
                    sessionStorage.setItem('activeSessionCampagnaId', sess.campagna_id);
                    updateReturnToSessionBtn();
                }
                if (typeof handleSessionStarted === 'function') {
                    await handleSessionStarted(sess.campagna_id, sess.id);
                }
            }
        }
    } catch (error) {
        console.error('Errore checkStartupNotifications:', error);
    }
}

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
    window.setAppNavigationState({ campagnaId }, 'open-sessione');
    AppState.activeSessionCampagnaId = campagnaId;
    sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
    window.CompanionRouterBridge?.navigateToLegacy?.({ page: 'sessione', campagnaId });
    await navigateToPage('sessione', { pushHistory: false, skipPageLoad: true });
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

    const conditions = {};
    ALL_CONDITIONS.forEach(c => {
        const cb = document.getElementById(`cond_${c.key}`);
        if (cb) conditions[c.key] = cb.checked;
    });
    const exhInput = document.getElementById('cond_esaustione');
    if (exhInput) conditions.esaustione = parseInt(exhInput.value) || 0;

    try {
        const campagnaId = AppState.currentCampagnaId;
        let result = campagnaId
            ? await supabase.rpc('update_campaign_character_conditions', {
                p_campagna_id: campagnaId,
                p_personaggio_id: personaggioId,
                p_conditions: conditions
            })
            : await supabase.from('personaggi').update({
                ...conditions,
                updated_at: new Date().toISOString()
            }).eq('id', personaggioId);

        // Il proprietario continua a gestire la propria scheda tramite la policy owner.
        if (campagnaId && result.error?.code === '42501') {
            result = await supabase.from('personaggi').update({
                ...conditions,
                updated_at: new Date().toISOString()
            }).eq('id', personaggioId);
        }

        const { error } = result;
        if (error) throw error;
        showNotification('Stato aggiornato');
        closeConditionsModal();
        if (AppState.currentPage === 'scheda' && AppState.currentPersonaggioId) {
            await renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
        await sendAppEventBroadcast({
            table: 'personaggi',
            action: 'update',
            id: personaggioId,
            personaggioId,
            campagnaId: campagnaId || null
        });
    } catch (e) {
        console.error('Errore aggiornamento condizioni:', e);
        showNotification('Errore: ' + (e.message || e));
    }
}

window.openCombattimentoPage = async function(campagnaId, sessioneId) {
    window.setAppNavigationState({ campagnaId, sessioneId }, 'open-combattimento');
    window.CompanionRouterBridge?.navigateToLegacy?.({ page: 'combattimento', campagnaId, sessioneId });
    await navigateToPage('combattimento', { pushHistory: false, skipPageLoad: true });
};
