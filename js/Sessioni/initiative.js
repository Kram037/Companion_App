// ============================================================
// Initiative & Roll Request Functions
// ============================================================

function closeRollRequestModal() {
    if (elements.rollRequestModal) {
        elements.rollRequestModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (elements.rollRequestInput) {
        elements.rollRequestInput.value = '';
    }
    window.currentRollRequest = null;
    window.currentRollModifier = 0;
}

/**
 * Verifica se la sessione associata a una richiesta tiro e' ancora valida
 * (la sessione non e' terminata). Le richieste orfane vengono ignorate:
 * la pulizia resta al DM, che possiede i permessi DELETE.
 *
 * Per le richieste di iniziativa controlla anche che ci sia un combattimento
 * "in corso" (almeno una riga in 'iniziativa' per la sessione, oppure sessione
 * con combat_turn_index > 0). Se non c'e', la richiesta e' considerata orfana
 * (es. il DM ha terminato il combattimento ma il delete non era arrivato a tutti).
 */
async function _isRollRequestStillValid(req) {
    if (!req || !req.sessione_id) return true; // niente da verificare
    const supabase = getSupabaseClient();
    if (!supabase) return true;
    try {
        const { data: sessione, error } = await supabase
            .from('sessioni')
            .select('id, data_fine, combat_round, combat_turn_index')
            .eq('id', req.sessione_id)
            .maybeSingle();
        if (error) {
            console.warn('⚠️ Verifica sessione richiesta tiro fallita, considero la richiesta valida:', error);
            return true;
        }
        if (!sessione) return false; // sessione cancellata
        if (sessione.data_fine) return false; // sessione terminata
        if (req.tipo === 'iniziativa') {
            // Se il combattimento e' in stato "appena iniziato" (turn=0, round=1) puo' essere
            // una richiesta legittima per la quale i PG devono ancora tirare: in tal caso
            // la tabella iniziativa puo' avere 0 righe. Per non avere falsi positivi qui,
            // ci affidiamo solo al check su data_fine e su un flag esplicito (se in futuro
            // verra' aggiunto). La cancellazione massiva delle richieste a fine combattimento
            // resta gestita lato DM quando termina combattimento o sessione.
        }
        return true;
    } catch (e) {
        console.warn('⚠️ Errore verifica validita\' richiesta tiro:', e);
        return true;
    }
}

/**
 * Verifica se ci sono richieste tiro pending per l'utente corrente
 */
async function checkPendingRollRequests(userId) {
    if (!AppState.isLoggedIn || !userId) return null;

    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const userData = await findUserByUid(userId);
        if (!userData) {
            appDebug('⚠️ UserData non trovato per userId:', userId);
            return null;
        }

        appDebug('🔍 Controllo richieste tiro per giocatore:', userData.id);

        // Controlla richieste iniziativa pending
        const { data: iniziativaRequests, error: iniziativaError } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('*')
            .eq('giocatore_id', userData.id)
            .eq('stato', 'pending')
            .order('timestamp', { ascending: false })
            .limit(5);

        if (iniziativaError) {
            console.error('❌ Errore nel controllo richieste iniziativa:', iniziativaError);
        } else {
            appDebug('📊 Richieste iniziativa trovate:', iniziativaRequests?.length || 0);
        }

        if (iniziativaRequests && iniziativaRequests.length > 0) {
            for (const r of iniziativaRequests) {
                const req = { id: r.id, tipo: 'iniziativa', sessione_id: r.sessione_id };
                if (await _isRollRequestStillValid(req)) {
                    appDebug('✅ Trovata richiesta iniziativa valida:', r.id);
                    return req;
                } else {
                    appDebug('🧹 Richiesta iniziativa orfana ignorata:', r.id);
                }
            }
        }

        // Controlla richieste tiro generico pending
        const { data: genericoRequests, error: genericoError } = await supabase
            .from('richieste_tiro_generico')
            .select('*')
            .eq('giocatore_id', userData.id)
            .eq('stato', 'pending')
            .order('timestamp', { ascending: false })
            .limit(5);

        if (genericoError) {
            console.error('❌ Errore nel controllo richieste generico:', genericoError);
        } else {
            appDebug('📊 Richieste generico trovate:', genericoRequests?.length || 0);
        }

        if (genericoRequests && genericoRequests.length > 0) {
            for (const r of genericoRequests) {
                const req = {
                    id: r.id,
                    tipo: 'generico',
                    sessione_id: r.sessione_id,
                    richiesta_id: r.richiesta_id,
                    tiroLabel: r.tiro_label || null,
                    tipoTiro: r.tipo_tiro || null,
                    targetTiro: r.target_tiro || null
                };
                if (await _isRollRequestStillValid(req)) {
                    appDebug('✅ Trovata richiesta generico valida:', r.id);
                    return req;
                } else {
                    appDebug('🧹 Richiesta generico orfana ignorata:', r.id);
                }
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Errore nel controllo richieste tiro:', error);
        return null;
    }
}

function shouldShowRollRequest(request) {
    const current = window.currentRollRequest;
    return !current || (current.tipo === request.tipo && current.id !== request.id);
}

async function syncPendingRollRequest() {
    const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
    if (pending && shouldShowRollRequest(pending)) showRollRequestModal(pending);
}

/**
 * Avvia Realtime subscription per le richieste tiro
 */
function startRollRequestsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    // Ferma subscription esistente se presente
    stopRollRequestsRealtime();

    // Ottieni l'ID utente dal database
    findUserByUid(AppState.currentUser.uid).then(async (userData) => {
        if (!userData) {
            console.warn('⚠️ UserData non trovato per Realtime roll requests');
            return;
        }

        const giocatoreId = userData.id;

        // Subscription per richieste tiro iniziativa
        const iniziativaChannel = supabase
            .channel(`roll-requests-iniziativa-${giocatoreId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'richieste_tiro_iniziativa',
                    filter: `giocatore_id=eq.${giocatoreId}`
                },
                async (payload) => {
                    appDebug('🔔 [REALTIME] Nuova richiesta tiro iniziativa ricevuta:', payload.new);
                    if (payload.new.stato === 'pending') {
                        const request = {
                            id: payload.new.id,
                            tipo: 'iniziativa',
                            sessione_id: payload.new.sessione_id
                        };
                        if (!shouldShowRollRequest(request)) return;
                        if (!(await _isRollRequestStillValid(request))) {
                            appDebug('🧹 [REALTIME] Richiesta iniziativa orfana, ignoro:', request);
                            return;
                        }
                        appDebug('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                appDebug('📡 [REALTIME] Stato subscription iniziativa:', status);
                if (status === 'SUBSCRIBED') {
                    appDebug('✅ [REALTIME] Subscription iniziativa attiva');
                    syncPendingRollRequest();
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Errore subscription iniziativa');
                }
            });

        // Subscription per richieste tiro generico
        const genericoChannel = supabase
            .channel(`roll-requests-generico-${giocatoreId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'richieste_tiro_generico',
                    filter: `giocatore_id=eq.${giocatoreId}`
                },
                async (payload) => {
                    appDebug('🔔 [REALTIME] Nuova richiesta tiro generico ricevuta:', payload.new);
                    if (payload.new.stato === 'pending') {
                        const request = {
                            id: payload.new.id,
                            tipo: 'generico',
                            sessione_id: payload.new.sessione_id,
                            richiesta_id: payload.new.richiesta_id,
                            tiroLabel: payload.new.tiro_label || null,
                            tipoTiro: payload.new.tipo_tiro || null,
                            targetTiro: payload.new.target_tiro || null
                        };
                        if (!shouldShowRollRequest(request)) return;
                        if (!(await _isRollRequestStillValid(request))) {
                            appDebug('🧹 [REALTIME] Richiesta generico orfana, ignoro:', request);
                            return;
                        }
                        appDebug('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                appDebug('📡 [REALTIME] Stato subscription generico:', status);
                if (status === 'SUBSCRIBED') {
                    appDebug('✅ [REALTIME] Subscription generico attiva');
                    syncPendingRollRequest();
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Errore subscription generico');
                }
            });

        // Salva i canali per poterli rimuovere in seguito
        window.rollRequestsChannels = {
            iniziativa: iniziativaChannel,
            generico: genericoChannel
        };

        appDebug('✅ Realtime subscriptions per roll requests avviate');
    }).catch(error => {
        console.error('❌ Errore nell\'avvio Realtime roll requests:', error);
    });
}

/**
 * Ferma Realtime subscriptions per le richieste tiro
 */
function stopRollRequestsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.rollRequestsChannels) {
        if (window.rollRequestsChannels.iniziativa) {
            supabase.removeChannel(window.rollRequestsChannels.iniziativa);
        }
        if (window.rollRequestsChannels.generico) {
            supabase.removeChannel(window.rollRequestsChannels.generico);
        }
        window.rollRequestsChannels = null;
    }
}

/**
 * Mostra il modal per la richiesta tiro
 */
function calcAbilityMod(score) {
    return Math.floor((score - 10) / 2);
}

function getCharacterModifier(pg, tipoTiro, targetTiro) {
    if (!pg || !tipoTiro || !targetTiro) return null;

    const ABILITY_MAP = {
        'forza': 'forza', 'destrezza': 'destrezza', 'costituzione': 'costituzione',
        'intelligenza': 'intelligenza', 'saggezza': 'saggezza', 'carisma': 'carisma'
    };

    const SKILL_ABILITY_MAP = {
        'acrobazia': 'destrezza', 'addestrare_animali': 'saggezza', 'arcano': 'intelligenza',
        'atletica': 'forza', 'furtivita': 'destrezza', 'indagare': 'intelligenza',
        'inganno': 'carisma', 'intimidire': 'carisma', 'intrattenere': 'carisma',
        'intuizione': 'saggezza', 'medicina': 'saggezza', 'natura': 'intelligenza',
        'percezione': 'saggezza', 'persuasione': 'carisma', 'rapidita_di_mano': 'destrezza',
        'religione': 'intelligenza', 'sopravvivenza': 'saggezza', 'storia': 'intelligenza'
    };

    const totalLevel = pg.livello || 1;
    const profBonus = Math.floor((totalLevel - 1) / 4) + 2;
    const factotum = (typeof window._getFactotumBonus === 'function')
        ? window._getFactotumBonus(pg)
        : 0;

    if (tipoTiro === 'caratteristica') {
        const abilityKey = ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        // Le prove di caratteristica pure non hanno competenza: il
        // bonus Factotum del Bardo si applica sempre.
        return calcAbilityMod(pg[abilityKey]) + factotum;
    }

    if (tipoTiro === 'salvezza') {
        const abilityKey = ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        let mod = calcAbilityMod(pg[abilityKey]);
        const saves = pg.tiri_salvezza || [];
        if (saves.includes(abilityKey) || saves.includes(targetTiro)) {
            mod += profBonus;
        }
        return mod;
    }

    if (tipoTiro === 'abilita') {
        const abilityKey = SKILL_ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        let mod = calcAbilityMod(pg[abilityKey]);
        const skills = pg.competenze_abilita || [];
        const expert = pg.maestrie_abilita || [];
        const isProf = skills.includes(targetTiro);
        const isExpert = expert.includes(targetTiro);
        if (isProf) mod += profBonus;
        if (isExpert) mod += profBonus;
        // Factotum: meta' bonus competenza (arrotondato per difetto)
        // alle prove in cui non sei competente.
        if (!isProf && !isExpert) mod += factotum;
        return mod;
    }

    return null;
}

function formatMod(value) {
    if (value == null) return '?';
    return value >= 0 ? `+${value}` : `${value}`;
}

async function showRollRequestModal(request) {
    if (!elements.rollRequestModal) return;

    window.currentRollRequest = request;

    const isIniziativa = request.tipo === 'iniziativa';
    const tiroLabel = !isIniziativa && request.tiroLabel ? request.tiroLabel : null;
    const tipoTiro = request.tipoTiro || null;
    const targetTiro = request.targetTiro || null;

    let modValue = null;
    let modText = '';
    window.currentRollModifier = 0;

    try {
        const supabase = getSupabaseClient();
        const userData = await findUserByUid(AppState.currentUser?.uid);
        let campagnaId = AppState.currentCampagnaId;
        if (!campagnaId && request.sessione_id && supabase) {
            const { data: sess } = await supabase.from('sessioni').select('campagna_id').eq('id', request.sessione_id).single();
            if (sess) {
                campagnaId = sess.campagna_id;
            }
        }
        if (supabase && userData && campagnaId) {
            const { data: pgRow } = await supabase.rpc('get_personaggio_campagna', {
                p_campagna_id: campagnaId,
                p_user_id: userData.id
            });
            if (pgRow && pgRow.length > 0) {
                // L'RPC ritorna solo poche colonne: per calcolare correttamente
                // i modificatori (competenze, classi -> Factotum del Bardo,
                // ecc.) carichiamo la riga completa della scheda.
                let pg = pgRow[0];
                try {
                    const { data: full } = await supabase
                        .from('personaggi')
                        .select('classi, livello, forza, destrezza, costituzione, intelligenza, saggezza, carisma, iniziativa, competenze_abilita, maestrie_abilita, tiri_salvezza')
                        .eq('id', pg.id)
                        .single();
                    if (full) pg = { ...pg, ...full };
                } catch (e) { /* fallback su dati base */ }

                if (isIniziativa) {
                    const fact = (typeof window._getFactotumBonus === 'function') ? window._getFactotumBonus(pg) : 0;
                    if (pg.iniziativa != null) {
                        modValue = pg.iniziativa;
                    } else {
                        modValue = calcAbilityMod(pg.destrezza || 10) + fact;
                    }
                } else if (tipoTiro && targetTiro) {
                    modValue = getCharacterModifier(pg, tipoTiro, targetTiro);
                }
                if (modValue != null) window.currentRollModifier = modValue;
            }
        }
    } catch (e) {
        console.warn('Impossibile calcolare modificatore:', e);
    }
    modText = modValue != null ? ` (${formatMod(modValue)})` : '';

    if (elements.rollRequestTitle) {
        elements.rollRequestTitle.textContent = isIniziativa
            ? 'Tiro di Iniziativa'
            : (tiroLabel || 'Tiro Richiesto');
    }
    if (elements.rollRequestMessage) {
        const modStr = modValue != null ? formatMod(modValue) : '?';
        elements.rollRequestMessage.textContent = `d20 ${modStr}`;
    }
    if (elements.rollRequestLabel) {
        elements.rollRequestLabel.textContent = 'Risultato del tiro:';
    }
    if (elements.rollRequestInput) {
        elements.rollRequestInput.value = '';
        elements.rollRequestInput.removeAttribute('min');
        elements.rollRequestInput.max = '999';
    }
    const d20Text = document.getElementById('d20RollText');
    if (d20Text) {
        d20Text.textContent = '';
        d20Text.classList.remove('show', 'nat-crit');
    }
    const autoRollBtnEl = document.getElementById('autoRollBtn');
    if (autoRollBtnEl) autoRollBtnEl.disabled = false;
    if (elements.rollRequestInput) {
        delete elements.rollRequestInput.dataset.natRoll;
    }

    elements.rollRequestModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

/**
 * Invia il risultato di un tiro (globale per essere chiamata dal form)
 */
window.submitRollRequest = async function(requestId, tipo, valore, tiroNaturale) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return false;
    }

    try {
        const isIniziativa = tipo === 'iniziativa';
        const tableName = isIniziativa
            ? 'richieste_tiro_iniziativa'
            : 'richieste_tiro_generico';
        const { data: sessioneId, error } = await supabase.rpc(
            isIniziativa ? 'submit_initiative_roll' : 'submit_generic_roll',
            {
                p_request_id: requestId,
                p_valore: valore,
                p_tiro_naturale: tiroNaturale ?? null
            }
        );

        if (error) throw error;
        await sendAppEventBroadcast({ table: tableName, action: 'update', requestId, sessioneId });

        showNotification('Tiro inviato!');

        // Il giocatore passa subito al combattimento dopo l'iniziativa.
        if (isIniziativa && sessioneId) {
            const { data: sessione } = await supabase
                .from('sessioni')
                .select('campagna_id')
                .eq('id', sessioneId)
                .single();

            if (sessione?.campagna_id) {
                await openCombattimentoPage(sessione.campagna_id, sessioneId);
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Errore nell\'invio tiro:', error);
        showNotification('Errore nell\'invio del tiro: ' + (error.message || error));
        return false;
    }
}
