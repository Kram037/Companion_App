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
 * (la sessione non e' terminata). Se la richiesta e' orfana (sessione conclusa),
 * la cancella dal DB cosi' non si ripresenta.
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
            // resta gestita lato DM in terminaCombattimento/finisciSessione.
        }
        return true;
    } catch (e) {
        console.warn('⚠️ Errore verifica validita\' richiesta tiro:', e);
        return true;
    }
}

async function _deleteOrphanRollRequest(req) {
    const supabase = getSupabaseClient();
    if (!supabase || !req || !req.id) return;
    const table = req.tipo === 'iniziativa' ? 'richieste_tiro_iniziativa' : 'richieste_tiro_generico';
    try {
        await supabase.from(table).delete().eq('id', req.id);
        console.log(`🧹 Richiesta tiro orfana cancellata (${table} id=${req.id})`);
    } catch (e) {
        console.warn('⚠️ Cleanup richiesta orfana fallito:', e);
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
            console.log('⚠️ UserData non trovato per userId:', userId);
            return null;
        }

        console.log('🔍 Controllo richieste tiro per giocatore:', userData.id);

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
            console.log('📊 Richieste iniziativa trovate:', iniziativaRequests?.length || 0);
        }

        if (iniziativaRequests && iniziativaRequests.length > 0) {
            for (const r of iniziativaRequests) {
                const req = { id: r.id, tipo: 'iniziativa', sessione_id: r.sessione_id };
                if (await _isRollRequestStillValid(req)) {
                    console.log('✅ Trovata richiesta iniziativa valida:', r.id);
                    return req;
                } else {
                    console.log('🧹 Richiesta iniziativa orfana ignorata e cancellata:', r.id);
                    await _deleteOrphanRollRequest(req);
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
            console.log('📊 Richieste generico trovate:', genericoRequests?.length || 0);
        }

        if (genericoRequests && genericoRequests.length > 0) {
            for (const r of genericoRequests) {
                const req = { id: r.id, tipo: 'generico', sessione_id: r.sessione_id, richiesta_id: r.richiesta_id };
                if (await _isRollRequestStillValid(req)) {
                    console.log('✅ Trovata richiesta generico valida:', r.id);
                    return req;
                } else {
                    console.log('🧹 Richiesta generico orfana ignorata e cancellata:', r.id);
                    await _deleteOrphanRollRequest(req);
                }
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Errore nel controllo richieste tiro:', error);
        return null;
    }
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
                    console.log('🔔 [REALTIME] Nuova richiesta tiro iniziativa ricevuta:', payload.new);
                    if (payload.new.stato === 'pending' && !window.currentRollRequest) {
                        const request = {
                            id: payload.new.id,
                            tipo: 'iniziativa',
                            sessione_id: payload.new.sessione_id
                        };
                        if (!(await _isRollRequestStillValid(request))) {
                            console.log('🧹 [REALTIME] Richiesta iniziativa orfana, ignoro e cancello:', request);
                            await _deleteOrphanRollRequest(request);
                            return;
                        }
                        console.log('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 [REALTIME] Stato subscription iniziativa:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [REALTIME] Subscription iniziativa attiva');
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
                    console.log('🔔 [REALTIME] Nuova richiesta tiro generico ricevuta:', payload.new);
                    if (payload.new.stato === 'pending' && !window.currentRollRequest) {
                        const request = {
                            id: payload.new.id,
                            tipo: 'generico',
                            sessione_id: payload.new.sessione_id,
                            richiesta_id: payload.new.richiesta_id
                        };
                        if (!(await _isRollRequestStillValid(request))) {
                            console.log('🧹 [REALTIME] Richiesta generico orfana, ignoro e cancello:', request);
                            await _deleteOrphanRollRequest(request);
                            return;
                        }
                        console.log('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 [REALTIME] Stato subscription generico:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [REALTIME] Subscription generico attiva');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Errore subscription generico');
                }
            });

        // Salva i canali per poterli rimuovere in seguito
        window.rollRequestsChannels = {
            iniziativa: iniziativaChannel,
            generico: genericoChannel
        };

        console.log('✅ Realtime subscriptions per roll requests avviate');
    }).catch(error => {
        console.error('❌ Errore nell\'avvio Realtime roll requests:', error);
    });
}

/**
 * Verifica se ci sono nuove sessioni attive per campagne dell'utente
 */
async function checkNewSessions(userId) {
    if (!AppState.isLoggedIn || !userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(userId);
        if (!userData) return;

        // Carica tutte le campagne dove l'utente è DM o giocatore
        const { data: campagneDM, error: errorDM } = await supabase
            .from('campagne')
            .select('id')
            .eq('id_dm', userData.id);

        // Per le campagne dove l'utente è giocatore, carica tutte le campagne e filtra lato client
        // (Supabase non supporta direttamente "array contains" nelle query)
        const { data: tutteCampagne, error: errorTutte } = await supabase
            .from('campagne')
            .select('id, giocatori');
        
        let campagnePlayer = [];
        if (!errorTutte && tutteCampagne) {
            campagnePlayer = tutteCampagne
                .filter(c => Array.isArray(c.giocatori) && c.giocatori.includes(userData.id))
                .map(c => ({ id: c.id }));
        }

        if (errorDM || errorTutte) {
            console.error('❌ Errore nel caricamento campagne per sessioni:', errorDM || errorTutte);
            return;
        }

        const campagnaIds = [
            ...(campagneDM || []).map(c => c.id),
            ...(campagnePlayer || []).map(c => c.id)
        ].filter((id, index, self) => self.indexOf(id) === index); // Rimuovi duplicati

        if (campagnaIds.length === 0) return;

        // Carica sessioni attive per queste campagne
        const { data: sessioniAttive, error: errorSessioni } = await supabase
            .from('sessioni')
            .select('id, campagna_id, data_inizio')
            .in('campagna_id', campagnaIds)
            .is('data_fine', null)
            .order('data_inizio', { ascending: false });

        if (errorSessioni) {
            console.error('❌ Errore nel caricamento sessioni attive:', errorSessioni);
            return;
        }

        if (!sessioniAttive || sessioniAttive.length === 0) return;

        // Controlla se ci sono sessioni nuove (non ancora notificate)
        const lastCheckKey = 'lastSessionCheck';
        const lastCheck = localStorage.getItem(lastCheckKey);
        const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;

        for (const sessione of sessioniAttive) {
            const sessioneTime = new Date(sessione.data_inizio).getTime();
            
            // Se la sessione è più recente dell'ultimo check, notifica
            if (sessioneTime > lastCheckTime) {
                // Carica i dettagli della campagna
                const { data: campagna, error: errorCampagna } = await supabase
                    .from('campagne')
                    .select('nome_campagna')
                    .eq('id', sessione.campagna_id)
                    .single();

                if (!errorCampagna && campagna) {
                    showInAppNotification({
                        title: 'Sessione Attiva',
                        message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                        campagnaId: sessione.campagna_id,
                        sessioneId: sessione.id
                    });
                }
            }
        }

        // Aggiorna il timestamp dell'ultimo check
        localStorage.setItem(lastCheckKey, Date.now().toString());
    } catch (error) {
        console.error('❌ Errore nel controllo nuove sessioni:', error);
    }
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
                AppState.currentCampagnaId = campagnaId;
                sessionStorage.setItem('currentCampagnaId', campagnaId);
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
        elements.rollRequestInput.min = '1';
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
        return;
    }

    try {
        const tableName = tipo === 'iniziativa' 
            ? 'richieste_tiro_iniziativa' 
            : 'richieste_tiro_generico';

        const updateData = { 
            valore: valore,
            stato: 'completed',
            timestamp: new Date().toISOString()
        };
        if (tiroNaturale != null) updateData.tiro_naturale = tiroNaturale;

        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', requestId);

        if (error) throw error;
        await sendAppEventBroadcast({ table: tableName, action: 'update', requestId });

        showNotification('Tiro inviato!');

        // Se è un tiro iniziativa, verifica se tutti hanno completato
        if (tipo === 'iniziativa') {
            const { data: richiesta } = await supabase
                .from('richieste_tiro_iniziativa')
                .select('sessione_id')
                .eq('id', requestId)
                .single();

            if (richiesta) {
                // Porta subito il giocatore alla pagina combattimento
                const { data: sessione } = await supabase
                    .from('sessioni')
                    .select('campagna_id')
                    .eq('id', richiesta.sessione_id)
                    .single();

                if (sessione?.campagna_id) {
                    await openCombattimentoPage(sessione.campagna_id, richiesta.sessione_id);
                }

                // Notifica subito il DM tramite broadcast realtime
                await sendCombattimentoUpdateBroadcast(richiesta.sessione_id);

                await checkAllIniziativaCompleted(richiesta.sessione_id);
            }
        }
    } catch (error) {
        console.error('❌ Errore nell\'invio tiro:', error);
        showNotification('Errore nell\'invio del tiro: ' + (error.message || error));
    }
}

/**
 * Verifica se tutti i giocatori hanno completato il tiro iniziativa
 */
async function checkAllIniziativaCompleted(sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (!sessione) return;

        const { data: campagna } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', sessione.campagna_id)
            .single();

        if (!campagna) return;

        // Lista solo i giocatori (DM esonerato)
        const partecipanti = (campagna.giocatori || []).filter(Boolean);

        // Controlla se tutte le richieste sono completed
        const { data: richieste, error } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('giocatore_id, stato')
            .eq('sessione_id', sessioneId);

        if (error) throw error;

        const completedGiocatori = new Set(
            (richieste || []).filter(r => r.stato === 'completed').map(r => r.giocatore_id)
        );

        // Se tutti i giocatori hanno completato, porta i giocatori alla pagina combattimento
        const allCompleted = partecipanti.length > 0 && partecipanti.every(id => completedGiocatori.has(id));

        if (allCompleted && partecipanti.length > 0) {
            // Se l'utente corrente è nella sessione, portalo al combattimento
            const userData = await findUserByUid(AppState.currentUser.uid);
            if (userData && partecipanti.includes(userData.id)) {
                // Usa openCombattimentoPage per impostare correttamente lo stato e avviare il polling
                await openCombattimentoPage(sessione.campagna_id, sessioneId);
            }
        }
    } catch (error) {
        console.error('❌ Errore nel controllo completamento iniziativa:', error);
    }
}

/**
 * Richiede tiro iniziativa a tutti i giocatori
 */
window.richiediTiroIniziativa = async function(sessioneId, campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può richiedere tiri');
            return;
        }

        // Carica la campagna per ottenere i giocatori
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', campagnaId)
            .single();

        if (campagnaError) throw campagnaError;

        // Rimuovi eventuali richieste pending per questa sessione
        const { error: deleteError } = await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);
        if (deleteError) throw deleteError;
        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'delete', sessioneId });

        // Crea richieste solo per i giocatori (escludi il DM)
        const partecipanti = (campagna.giocatori || []).filter(Boolean);
        
        const richieste = partecipanti.map(giocatoreId => ({
            sessione_id: sessioneId,
            giocatore_id: giocatoreId,
            stato: 'pending'
        }));

        const { error: insertError } = await supabase
            .from('richieste_tiro_iniziativa')
            .insert(richieste);

        if (insertError) throw insertError;
        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'insert', sessioneId });

        showNotification('Richieste tiro iniziativa inviate!');
        
        // Apri pagina combattimento per il DM (imposta anche stato e realtime)
        await openCombattimentoPage(campagnaId, sessioneId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro iniziativa:', error);
        showNotification('Errore nella richiesta tiro iniziativa: ' + (error.message || error));
    }
};

/**
 * Apre il dialog per scegliere il tipo di tiro generico
 */
const TIRO_CARATTERISTICHE = [
    { value: 'forza', label: 'Forza' },
    { value: 'destrezza', label: 'Destrezza' },
    { value: 'costituzione', label: 'Costituzione' },
    { value: 'intelligenza', label: 'Intelligenza' },
    { value: 'saggezza', label: 'Saggezza' },
    { value: 'carisma', label: 'Carisma' }
];

const TIRO_ABILITA = [
    { value: 'acrobazia', label: 'Acrobazia' },
    { value: 'addestrare_animali', label: 'Addestrare Animali' },
    { value: 'arcano', label: 'Arcano' },
    { value: 'atletica', label: 'Atletica' },
    { value: 'furtivita', label: 'Furtività' },
    { value: 'indagare', label: 'Indagare' },
    { value: 'inganno', label: 'Inganno' },
    { value: 'intimidire', label: 'Intimidire' },
    { value: 'intrattenere', label: 'Intrattenere' },
    { value: 'intuizione', label: 'Intuizione' },
    { value: 'medicina', label: 'Medicina' },
    { value: 'natura', label: 'Natura' },
    { value: 'percezione', label: 'Percezione' },
    { value: 'persuasione', label: 'Persuasione' },
    { value: 'rapidita_di_mano', label: 'Rapidità di Mano' },
    { value: 'religione', label: 'Religione' },
    { value: 'sopravvivenza', label: 'Sopravvivenza' },
    { value: 'storia', label: 'Storia' }
];

function updateTiroTargetOptions() {
    const tipo = document.getElementById('tipoTiroSelect')?.value;
    const targetSelect = document.getElementById('tiroTargetSelect');
    const targetLabel = document.getElementById('tiroTargetLabel');
    if (!targetSelect || !targetLabel) return;

    let options = [];
    if (tipo === 'salvezza' || tipo === 'caratteristica') {
        options = TIRO_CARATTERISTICHE;
        targetLabel.textContent = 'Caratteristica';
    } else {
        options = TIRO_ABILITA;
        targetLabel.textContent = 'Abilità';
    }
    targetSelect.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function getTiroLabel(tipo, target) {
    const allOptions = [...TIRO_CARATTERISTICHE, ...TIRO_ABILITA];
    const opt = allOptions.find(o => o.value === target);
    const targetName = opt ? opt.label : target;
    if (tipo === 'salvezza') return `Tiro salvezza su ${targetName}`;
    if (tipo === 'abilita') return `Tiro di ${targetName}`;
    return `Prova di ${targetName}`;
}

window.richiediTiroGenerico = async function(sessioneId, campagnaId) {
    const modal = document.getElementById('richiediTiroModal');
    if (!modal) return;

    window._pendingTiroSessioneId = sessioneId;
    window._pendingTiroCampagnaId = campagnaId;

    updateTiroTargetOptions();

    const playersList = document.getElementById('tiroPlayersList');
    if (playersList) {
        playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Caricamento...</p>';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase || !playersList) return;

    try {
        const pgNamesMap = await getCharacterNamesMap(campagnaId);
        const { data: giocatoriData } = await supabase.rpc('get_giocatori_campagna', {
            campagna_id_param: campagnaId
        });

        if (!giocatoriData || giocatoriData.length === 0) {
            playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Nessun giocatore</p>';
            return;
        }

        playersList.innerHTML = giocatoriData.map(g => {
            const displayName = pgNamesMap[g.id] || g.nome_utente || 'Giocatore';
            return `
                <div class="tiro-player-item">
                    <input type="checkbox" id="tiroPlayer_${g.id}" value="${g.id}" checked>
                    <label for="tiroPlayer_${g.id}">${escapeHtml(displayName)}</label>
                </div>`;
        }).join('');
    } catch (e) {
        console.warn('Errore caricamento giocatori per tiro:', e);
        playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Errore caricamento</p>';
    }
}

function closeRichiediTiroModal() {
    const modal = document.getElementById('richiediTiroModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

async function executeRichiediTiro() {
    const sessioneId = window._pendingTiroSessioneId;
    const campagnaId = window._pendingTiroCampagnaId;
    const tipo = document.getElementById('tipoTiroSelect')?.value;
    const target = document.getElementById('tiroTargetSelect')?.value;
    if (!sessioneId || !campagnaId || !tipo || !target) return;

    const selectedCheckboxes = document.querySelectorAll('#tiroPlayersList input[type="checkbox"]:checked');
    const selectedPlayerIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    if (selectedPlayerIds.length === 0) {
        showNotification('Seleziona almeno un giocatore');
        return;
    }

    const tiroLabel = getTiroLabel(tipo, target);
    closeRichiediTiroModal();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) { showNotification('Solo il DM può richiedere tiri'); return; }

        const richiestaId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const richieste = selectedPlayerIds.map(giocatoreId => ({
            sessione_id: sessioneId,
            richiesta_id: richiestaId,
            giocatore_id: giocatoreId,
            stato: 'pending'
        }));

        const { error: insertError } = await supabase
            .from('richieste_tiro_generico')
            .insert(richieste);
        if (insertError) throw insertError;

        await sendAppEventBroadcast({
            table: 'richieste_tiro_generico',
            action: 'insert',
            sessioneId,
            tiroLabel,
            tipoTiro: tipo,
            targetTiro: target
        });
        showNotification(`${tiroLabel} richiesto!`);

        window.currentTiroGenericoRichiestaId = richiestaId;
        window.currentTiroGenericoLabel = tiroLabel;

        await updateTiroGenericoTable(sessioneId, richiestaId);
        startTiroGenericoPolling(sessioneId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro generico:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

/**
 * Avvia polling per aggiornare la tabella tiri generici
 */
function startTiroGenericoPolling(sessioneId) {
    if (window.tiroGenericoPollingInterval) {
        clearInterval(window.tiroGenericoPollingInterval);
    }

    window.tiroGenericoPollingInterval = setInterval(async () => {
        if (window.currentTiroGenericoRichiestaId) {
            await updateTiroGenericoTable(sessioneId, window.currentTiroGenericoRichiestaId);
        }
    }, 2000); // Aggiorna ogni 2 secondi
}

/**
 * Ferma il polling per la tabella tiri generici
 */
function stopTiroGenericoPolling() {
    if (window.tiroGenericoPollingInterval) {
        clearInterval(window.tiroGenericoPollingInterval);
        window.tiroGenericoPollingInterval = null;
    }
}

/**
 * Aggiorna la tabella tiri generici nella pagina sessione
 */
async function updateTiroGenericoTable(sessioneId, richiestaId) {
    const tableElement = document.getElementById('tiroGenericoTable');
    if (!tableElement) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { data: tiri, error } = await supabase
            .from('richieste_tiro_generico')
            .select('*')
            .eq('sessione_id', sessioneId)
            .eq('richiesta_id', richiestaId)
            .order('valore', { ascending: false, nullsFirst: false });

        if (error) throw error;

        if (!tiri || tiri.length === 0) {
            tableElement.style.display = 'none';
            return;
        }

        const pgNamesMap = await getCharacterNamesMap(AppState.currentCampagnaId);
        
        const giocatoreIds = [...new Set(tiri.map(t => t.giocatore_id).filter(Boolean))];
        let utentiMap = {};
        if (giocatoreIds.length > 0) {
            try {
                const { data: giocatoriData } = await supabase.rpc('get_giocatori_campagna', {
                    campagna_id_param: AppState.currentCampagnaId
                });
                if (giocatoriData) {
                    giocatoriData.forEach(g => { utentiMap[g.id] = g; });
                }
            } catch (e) {
                console.warn('Fallback nomi giocatori:', e);
            }
        }

        tableElement.style.display = 'block';
        const tiroLabel = window.currentTiroGenericoLabel || 'Tiri Richiesti';

        const tableHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                <h3 style="margin: 0;">${escapeHtml(tiroLabel)}</h3>
                <button class="btn-secondary btn-small" onclick="chiudiTabellaTiri('${sessioneId}', '${richiestaId}')" style="width: auto; padding: var(--spacing-xs) var(--spacing-sm);">
                    Chiudi
                </button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Giocatore</th>
                        <th style="text-align: right; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Risultato</th>
                        <th style="text-align: center; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Stato</th>
                    </tr>
                </thead>
                <tbody>
                    ${tiri.map(tiro => {
                        const pgName = pgNamesMap[tiro.giocatore_id];
                        const utente = utentiMap[tiro.giocatore_id];
                        const nome = pgName || utente?.nome_utente || 'Giocatore';
                        const natRoll = tiro.tiro_naturale;
                        const isNatCrit = natRoll === 1 || natRoll === 20;
                        let risultatoHtml = '-';
                        if (tiro.valore !== null) {
                            if (isNatCrit) {
                                const modDiff = tiro.valore - natRoll;
                                const modStr = modDiff >= 0 ? `+${modDiff}` : `${modDiff}`;
                                risultatoHtml = `<span style="color:#e74c3c;font-weight:700;">${natRoll}</span><span style="font-size:0.8em;opacity:0.7;margin-left:2px;">${modStr}</span> = ${tiro.valore}`;
                            } else {
                                risultatoHtml = `${tiro.valore}`;
                            }
                        }
                        return `
                        <tr>
                            <td style="padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${escapeHtml(nome)}
                            </td>
                            <td style="text-align: right; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${risultatoHtml}
                            </td>
                            <td style="text-align: center; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${tiro.stato === 'completed' ? '✓' : '⏳'}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;

        tableElement.innerHTML = tableHTML;
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento tabella tiri:', error);
    }
}

/**
 * Chiude e cancella la tabella tiri generici
 */
window.chiudiTabellaTiri = async function(sessioneId, richiestaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (!sessione) return;

        const isDM = await isCurrentUserDM(sessione.campagna_id);
        if (!isDM) {
            showNotification('Solo il DM può chiudere la tabella');
            return;
        }

        // Cancella tutte le richieste per questa richiesta_id
        const { error } = await supabase
            .from('richieste_tiro_generico')
            .delete()
            .eq('sessione_id', sessioneId)
            .eq('richiesta_id', richiestaId);

        if (error) throw error;
        await sendAppEventBroadcast({ table: 'richieste_tiro_generico', action: 'delete', sessioneId, richiestaId, campagnaId: AppState.currentCampagnaId });

        // Nascondi la tabella
        const tableElement = document.getElementById('tiroGenericoTable');
        if (tableElement) {
            tableElement.style.display = 'none';
        }

        if (window.currentTiroGenericoRichiestaId === richiestaId) {
            window.currentTiroGenericoRichiestaId = null;
            window.currentTiroGenericoLabel = null;
        }
        stopTiroGenericoPolling();

        showNotification('Tabella tiri chiusa');
    } catch (error) {
        console.error('❌ Errore nella chiusura tabella tiri:', error);
        showNotification('Errore nella chiusura tabella: ' + (error.message || error));
    }
};

// terminaCombattimento and rimuoviIniziativa are defined in combat.js
