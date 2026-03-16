// ============================================================
// Realtime Subscriptions & Notifications
// ============================================================

let appEventsChannel = null;
let appEventsRefreshTimeout = null;

/**
 * Avvia Realtime subscription per le nuove sessioni
 */
function startSessionRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    // Ferma subscription esistente se presente
    stopSessionRealtime();

    // Ottieni l'ID utente dal database e carica le campagne
    findUserByUid(AppState.currentUser.uid).then(async (userData) => {
        if (!userData) {
            console.warn('⚠️ UserData non trovato per Realtime sessioni');
            return;
        }

        // Carica tutte le campagne dove l'utente è DM o giocatore
        const { data: campagneDM } = await supabase
            .from('campagne')
            .select('id')
            .eq('id_dm', userData.id);

        const { data: tutteCampagne } = await supabase
            .from('campagne')
            .select('id, giocatori');

        let campagnePlayer = [];
        if (tutteCampagne) {
            campagnePlayer = tutteCampagne
                .filter(c => Array.isArray(c.giocatori) && c.giocatori.includes(userData.id))
                .map(c => ({ id: c.id }));
        }

        const campagnaIds = [
            ...(campagneDM || []).map(c => c.id),
            ...(campagnePlayer || []).map(c => c.id)
        ].filter((id, index, self) => self.indexOf(id) === index);

        if (campagnaIds.length === 0) return;

        // Subscription per nuove sessioni
        // Nota: Supabase Realtime non supporta filtri complessi con OR, quindi
        // ascoltiamo tutte le nuove sessioni e filtriamo lato client
        const sessionChannel = supabase
            .channel('new-sessions')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sessioni'
                },
                async (payload) => {
                    console.log('🔔 Nuova sessione:', payload.new);
                    // Filtra lato client: verifica che la sessione appartenga a una delle campagne dell'utente
                    if (campagnaIds.includes(payload.new.campagna_id) && !payload.new.data_fine) {
                        // Carica i dettagli della campagna
                        const { data: campagna } = await supabase
                            .from('campagne')
                            .select('nome_campagna')
                            .eq('id', payload.new.campagna_id)
                            .single();

                        if (campagna) {
                            showInAppNotification({
                                title: 'Sessione Attiva',
                                message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                                campagnaId: payload.new.campagna_id,
                                sessioneId: payload.new.id
                            });
                        }
                    }
                }
            )
            .subscribe();

        window.sessionChannel = sessionChannel;
        console.log('✅ Realtime subscription per sessioni avviata');
    }).catch(error => {
        console.error('❌ Errore nell\'avvio Realtime sessioni:', error);
    });
}

/**
 * Ferma Realtime subscription per le nuove sessioni
 */
function stopSessionRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.sessionChannel) {
        supabase.removeChannel(window.sessionChannel);
        window.sessionChannel = null;
    }
}

/**
 * Avvia Realtime subscription per la pagina combattimento
 */
function startCombattimentoRealtime(campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Ferma subscription esistente se presente
    stopCombattimentoRealtime();

    // Subscription per aggiornamenti ai tiri iniziativa
    const combattimentoChannel = supabase
        .channel(`combattimento-${sessioneId}`)
        .on(
            'broadcast',
            { event: 'iniziativa_update' },
            async (payload) => {
                console.log('🔔 [REALTIME] Broadcast iniziativa:', payload);
                const combattimentoPage = document.getElementById('combattimentoPage');
                if (combattimentoPage && combattimentoPage.classList.contains('active')) {
                    if (AppState.currentSessioneId === sessioneId && AppState.currentCampagnaId === campagnaId) {
                        await renderCombattimentoContent(campagnaId, sessioneId);
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: '*', // INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'richieste_tiro_iniziativa',
                filter: `sessione_id=eq.${sessioneId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Aggiornamento tiro iniziativa:', payload);
                // Verifica che siamo ancora nella pagina combattimento
                const combattimentoPage = document.getElementById('combattimentoPage');
                if (combattimentoPage && combattimentoPage.classList.contains('active')) {
                    // Verifica che la sessione sia ancora quella corrente
                    if (AppState.currentSessioneId === sessioneId && AppState.currentCampagnaId === campagnaId) {
                        console.log('✅ [REALTIME] Ricarico contenuto combattimento');
                        // Ricarica il contenuto del combattimento
                        await renderCombattimentoContent(campagnaId, sessioneId);
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 [REALTIME] Stato subscription combattimento:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ [REALTIME] Subscription combattimento attiva');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ [REALTIME] Errore subscription combattimento');
            }
        });

    window.combattimentoChannel = combattimentoChannel;
    console.log('✅ Realtime subscription per combattimento avviata');
}

/**
 * Invia un broadcast per aggiornare il combattimento in tempo reale
 */
async function sendCombattimentoUpdateBroadcast(sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase || !sessioneId) return;

    // Se siamo già in combattimento, usa il canale esistente
    if (window.combattimentoChannel && AppState.currentSessioneId === sessioneId) {
        try {
            await window.combattimentoChannel.send({
                type: 'broadcast',
                event: 'iniziativa_update',
                payload: { sessioneId, ts: Date.now() }
            });
        } catch (error) {
            console.warn('⚠️ Errore invio broadcast combattimento:', error);
        }
        return;
    }

    // Altrimenti crea un canale temporaneo per il broadcast
    const tempChannel = supabase.channel(`combattimento-${sessioneId}`);
    tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            tempChannel.send({
                type: 'broadcast',
                event: 'iniziativa_update',
                payload: { sessioneId, ts: Date.now() }
            }).catch((error) => {
                console.warn('⚠️ Errore invio broadcast combattimento:', error);
            }).finally(() => {
                setTimeout(() => {
                    supabase.removeChannel(tempChannel);
                }, 300);
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(tempChannel);
        }
    });
}

/**
 * Ferma Realtime subscription per la pagina combattimento
 */
function stopCombattimentoRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.combattimentoChannel) {
        supabase.removeChannel(window.combattimentoChannel);
        window.combattimentoChannel = null;
    }
}

/**
 * Avvia Realtime subscription per aggiornare la pagina dettagli quando viene avviata una sessione
 */
function startCampagnaDetailsRealtime(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Ferma subscription esistente se presente
    stopCampagnaDetailsRealtime();

    // Verifica che siamo ancora nella pagina dettagli
    const dettagliPage = document.getElementById('dettagliPage');
    if (!dettagliPage || !dettagliPage.classList.contains('active')) {
        return;
    }

    // Verifica che la campagna sia ancora quella corrente
    if (AppState.currentCampagnaId !== campagnaId) {
        return;
    }

    // Subscription per nuove sessioni per questa campagna
    const campagnaDetailsChannel = supabase
        .channel(`campagna-details-${campagnaId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'sessioni',
                filter: `campagna_id=eq.${campagnaId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Nuova sessione avviata per campagna:', payload.new);
                // Verifica che la sessione non abbia data_fine (sia attiva)
                if (!payload.new.data_fine) {
                    // Verifica che siamo ancora nella pagina dettagli
                    const dettagliPage = document.getElementById('dettagliPage');
                    if (dettagliPage && dettagliPage.classList.contains('active')) {
                        // Verifica che la campagna sia ancora quella corrente
                        if (AppState.currentCampagnaId === campagnaId) {
                            console.log('✅ [REALTIME] Ricarico dettagli campagna per nuova sessione');
                            // Ricarica i dettagli della campagna per aggiornare il bottone
                            await loadCampagnaDetails(campagnaId);
                        }
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessioni',
                filter: `campagna_id=eq.${campagnaId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Sessione aggiornata per campagna:', payload.new);
                // Se la sessione è stata terminata (data_fine impostata), ricarica i dettagli
                if (payload.new.data_fine) {
                    // Verifica che siamo ancora nella pagina dettagli
                    const dettagliPage = document.getElementById('dettagliPage');
                    if (dettagliPage && dettagliPage.classList.contains('active')) {
                        // Verifica che la campagna sia ancora quella corrente
                        if (AppState.currentCampagnaId === campagnaId) {
                            console.log('✅ [REALTIME] Ricarico dettagli campagna per sessione terminata');
                            // Ricarica i dettagli della campagna per aggiornare il bottone
                            await loadCampagnaDetails(campagnaId);
                        }
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 [REALTIME] Stato subscription dettagli campagna:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ [REALTIME] Subscription dettagli campagna attiva');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ [REALTIME] Errore subscription dettagli campagna');
            }
        });

    window.campagnaDetailsChannel = campagnaDetailsChannel;
    console.log('✅ Realtime subscription per dettagli campagna avviata');
}

/**
 * Ferma Realtime subscription per la pagina dettagli campagna
 */
function stopCampagnaDetailsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.campagnaDetailsChannel) {
        supabase.removeChannel(window.campagnaDetailsChannel);
        window.campagnaDetailsChannel = null;
        console.log('✅ Realtime subscription per dettagli campagna fermata');
    }
}

/**
 * Avvia Realtime subscription globale per eventi app
 */
function startAppEventsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;

    stopAppEventsRealtime();

    const channel = supabase
        .channel('app-events')
        .on(
            'broadcast',
            { event: 'app_change' },
            async (payload) => {
                const data = payload?.payload;
                if (!data) return;
                if (data.sourceUid && data.sourceUid === AppState.currentUser?.uid) {
                    return;
                }

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'insert') {
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending && !window.currentRollRequest) {
                            showRollRequestModal(pending);
                            sendBrowserNotification('Tiro di Iniziativa', 'Il DM ti ha richiesto un tiro di iniziativa!');
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'insert') {
                    const label = data.tiroLabel || 'Tiro Richiesto';
                    const tipoTiro = data.tipoTiro || null;
                    const targetTiro = data.targetTiro || null;
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending && !window.currentRollRequest) {
                            pending.tiroLabel = label;
                            pending.tipoTiro = tipoTiro;
                            pending.targetTiro = targetTiro;
                            showRollRequestModal(pending);
                            sendBrowserNotification(label, `Il DM ha richiesto: ${label}`);
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'delete') {
                    closeRollRequestModal();
                    if (AppState.currentPage === 'combattimento' && data.campagnaId) {
                        showNotification('Il combattimento è terminato');
                        navigateToPage('sessione');
                        renderSessioneContent(data.campagnaId);
                    }
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'delete') {
                    closeRollRequestModal();
                }

                if (data.table === 'sessioni' && data.action === 'insert' && data.campagnaId) {
                    try {
                        const userData = await findUserByUid(AppState.currentUser?.uid);
                        if (userData) {
                            const { data: campagna } = await supabase
                                .from('campagne')
                                .select('nome_campagna, id_dm, giocatori')
                                .eq('id', data.campagnaId)
                                .single();

                            if (campagna && campagna.id_dm !== userData.id) {
                                const isPlayer = Array.isArray(campagna.giocatori) && campagna.giocatori.includes(userData.id);
                                if (isPlayer) {
                                    showInAppNotification({
                                        title: 'Sessione Avviata!',
                                        message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                                        campagnaId: data.campagnaId,
                                        sessioneId: data.sessioneId
                                    });
                                    sendBrowserNotification(
                                        'Sessione Avviata',
                                        `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`
                                    );
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Errore notifica sessione:', e);
                    }
                }

                if (data.table === 'sessioni' && data.action === 'update' && data.campagnaId) {
                    if (AppState.activeSessionCampagnaId === data.campagnaId) {
                        clearActiveSession();
                        if (AppState.currentPage === 'sessione') {
                            stopSessioneTimer();
                            showNotification('La sessione è terminata');
                            navigateToPage('dettagli');
                            loadCampagnaDetails(data.campagnaId);
                        }
                    }
                }

                const skipRefreshTables = [
                    'richieste_tiro_iniziativa',
                    'richieste_tiro_generico'
                ];
                const needsRefresh = !skipRefreshTables.includes(data.table);
                if (needsRefresh) {
                    scheduleAppEventsRefresh();
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime subscription globale app attiva');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ Realtime subscription globale app in errore');
            }
        });

    appEventsChannel = channel;
    window.appEventsChannel = channel;
}

/**
 * Ferma Realtime subscription globale per eventi app
 */
function stopAppEventsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (appEventsChannel) {
        supabase.removeChannel(appEventsChannel);
        appEventsChannel = null;
        window.appEventsChannel = null;
        console.log('✅ Realtime subscription globale app fermata');
    }

    if (appEventsRefreshTimeout) {
        clearTimeout(appEventsRefreshTimeout);
        appEventsRefreshTimeout = null;
    }
}

let _appRefreshRunning = false;
let _appRefreshQueued = false;

function scheduleAppEventsRefresh() {
    if (appEventsRefreshTimeout) {
        clearTimeout(appEventsRefreshTimeout);
    }
    if (_appRefreshRunning) {
        _appRefreshQueued = true;
        return;
    }
    appEventsRefreshTimeout = setTimeout(() => {
        refreshCurrentPageData();
    }, 800);
}

async function refreshCurrentPageData() {
    if (!AppState.isLoggedIn) return;
    if (_appRefreshRunning) { _appRefreshQueued = true; return; }
    _appRefreshRunning = true;
    _appRefreshQueued = false;

    if (_hpCalcState || (Date.now() - _hpCalcClosedAt < 2000)) { _appRefreshRunning = false; return; }

    const page = AppState.currentPage;
    try {
        if (page === 'campagne' && AppState.currentUser?.uid) {
            await loadCampagne(AppState.currentUser.uid, { silent: true });
        } else if (page === 'personaggi') {
            await loadPersonaggi({ silent: true });
        } else if (page === 'amici') {
            await loadAmici({ silent: true });
        } else if (page === 'dettagli' && AppState.currentCampagnaId) {
            await loadCampagnaDetails(AppState.currentCampagnaId, { silent: true });
        } else if (page === 'sessione' && AppState.currentCampagnaId) {
            if (window.currentTiroGenericoRichiestaId) {
                const sessione = await getSessioneAttiva(AppState.currentCampagnaId);
                if (sessione) {
                    await updateTiroGenericoTable(sessione.id, window.currentTiroGenericoRichiestaId);
                }
            } else {
                await renderSessioneContent(AppState.currentCampagnaId);
            }
        } else if (page === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
            await renderCombattimentoContent(AppState.currentCampagnaId, AppState.currentSessioneId);
        } else if (page === 'scheda' && AppState.currentPersonaggioId) {
            await renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
    } catch (error) {
        console.warn('⚠️ Errore refresh pagina corrente:', error);
    } finally {
        _appRefreshRunning = false;
        if (_appRefreshQueued) {
            _appRefreshQueued = false;
            scheduleAppEventsRefresh();
        }
    }
}

/**
 * Invia un broadcast globale per notificare cambiamenti app
 */
async function sendAppEventBroadcast(change) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const payload = {
        ...change,
        sourceUid: AppState.currentUser?.uid || null,
        ts: Date.now()
    };

    if (appEventsChannel) {
        try {
            await appEventsChannel.send({
                type: 'broadcast',
                event: 'app_change',
                payload
            });
        } catch (error) {
            console.warn('⚠️ Errore broadcast app (channel):', error);
        }
        return;
    }

    const tempChannel = supabase.channel('app-events');
    tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            tempChannel.send({
                type: 'broadcast',
                event: 'app_change',
                payload
            }).catch((error) => {
                console.warn('⚠️ Errore broadcast app (temp):', error);
            }).finally(() => {
                setTimeout(() => {
                    supabase.removeChannel(tempChannel);
                }, 300);
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(tempChannel);
        }
    });
}

/**
 * Mostra una notifica in-app
 */
function showInAppNotification({ title, message, campagnaId, sessioneId }) {
    const container = document.getElementById('inAppNotifications');
    if (!container) return;

    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = 'in-app-notification';
    
    notification.innerHTML = `
        <svg class="in-app-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <div class="in-app-notification-content">
            <div class="in-app-notification-title">${escapeHtml(title)}</div>
            <div class="in-app-notification-message">${escapeHtml(message)}</div>
        </div>
        <button class="in-app-notification-close" onclick="closeInAppNotification('${notificationId}')" aria-label="Chiudi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    if (campagnaId && sessioneId) {
        notification.onclick = async function(e) {
            if (e.target.closest('.in-app-notification-close')) return;
            closeInAppNotification(notificationId);
            const isDM = await isCurrentUserDM(campagnaId);
            if (isDM) {
                openSessionePage(campagnaId);
            } else {
                playerJoinSession(campagnaId);
            }
        };
    }

    container.appendChild(notification);

    // Auto-rimuovi dopo 10 secondi
    setTimeout(() => {
        closeInAppNotification(notificationId);
    }, 10000);
}

/**
 * Chiude una notifica in-app
 */
window.closeInAppNotification = function(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;

    notification.classList.add('closing');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

/**
 * Browser Notification API - system-level notifications
 */
function sendBrowserNotification(title, body) {
    if (localStorage.getItem('notificheEnabled') !== 'true') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                icon: 'images/icon d20.png'
            });
        } else {
            new Notification(title, {
                body,
                icon: 'images/icon d20.png',
                badge: 'images/icon d20.png',
                tag: 'companion-app-' + Date.now(),
                requireInteraction: true
            });
        }
    } catch (e) {
        console.warn('Errore invio notifica browser:', e);
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNotification('Il tuo browser non supporta le notifiche');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
        showNotification('Notifiche bloccate. Abilitale dalle impostazioni del browser.');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registrato');

        if ('PushManager' in window && registration.pushManager) {
            const existingSub = await registration.pushManager.getSubscription();
            if (!existingSub) {
                await subscribeToPush(registration);
            }
        }

        return registration;
    } catch (e) {
        console.warn('Service Worker registration fallita:', e);
        return null;
    }
}

async function subscribeToPush(registration) {
    try {
        const vapidKey = localStorage.getItem('vapidPublicKey');
        if (!vapidKey) return null;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        const supabase = getSupabaseClient();
        if (supabase && AppState.currentUser) {
            const userData = await findUserByUid(AppState.currentUser.uid);
            if (userData) {
                await supabase.from('push_subscriptions').upsert({
                    user_id: userData.id,
                    subscription: JSON.stringify(subscription),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        }

        return subscription;
    } catch (e) {
        console.warn('Push subscription fallita:', e);
        return null;
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
