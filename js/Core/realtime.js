// ============================================================
// Realtime Subscriptions & Notifications
// ============================================================

let appEventsChannel = null;
const notifiedSessionStarts = new Set();
const handledFinishedSessions = new Set();
const handledFinishedCombats = new Set();

function publishAppDataChange(change) {
    if (!change?.table || !change?.action) return;
    window.dispatchEvent(new CustomEvent('companion:data-changed', { detail: change }));
}

async function handleSessionStarted(campagnaId, sessioneId) {
    if (!campagnaId || !sessioneId || notifiedSessionStarts.has(sessioneId)) return;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;
    notifiedSessionStarts.add(sessioneId);

    try {
        const { data: sessione, error: sessionError } = await supabase
            .from('sessioni')
            .select('id, created_at')
            .eq('id', sessioneId)
            .eq('campagna_id', campagnaId)
            .is('data_fine', null)
            .maybeSingle();
        const startedAt = Date.parse(sessione?.created_at || '');
        if (sessionError || !sessione || !Number.isFinite(startedAt) || Math.abs(Date.now() - startedAt) > 60_000) {
            notifiedSessionStarts.delete(sessioneId);
            return;
        }

        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) {
            notifiedSessionStarts.delete(sessioneId);
            return;
        }

        const { data: campagna } = await supabase
            .from('campagne')
            .select('nome_campagna, id_dm, giocatori')
            .eq('id', campagnaId)
            .single();
        if (!campagna) {
            notifiedSessionStarts.delete(sessioneId);
            return;
        }
        if (campagna.id_dm === userData.id) return;
        if (!Array.isArray(campagna.giocatori) || !campagna.giocatori.includes(userData.id)) {
            notifiedSessionStarts.delete(sessioneId);
            return;
        }

        showInAppNotification({
            title: 'Sessione Avviata!',
            message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
            campagnaId,
            sessioneId
        });
        sendBrowserNotification(
            'Sessione Avviata',
            `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`
        );
    } catch (error) {
        notifiedSessionStarts.delete(sessioneId);
        console.warn('Errore notifica sessione:', error);
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
                const clientId = window.CompanionRealtimeBridge?.clientId;
                if (data.sourceClientId && clientId && data.sourceClientId === clientId) {
                    return;
                }
                if (!data.sourceClientId && data.sourceUid && data.sourceUid === AppState.currentUser?.uid) {
                    return;
                }
                publishAppDataChange(data);

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'insert') {
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending?.tipo === 'iniziativa') {
                            handledFinishedCombats.delete(pending.sessione_id);
                        }
                        if (pending?.tipo === 'iniziativa' && shouldShowRollRequest(pending)) {
                            showRollRequestModal(pending);
                            sendBrowserNotification('Tiro di Iniziativa', 'Il DM ti ha richiesto un tiro di iniziativa!');
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'insert') {
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending?.tipo === 'generico' && shouldShowRollRequest(pending)) {
                            const label = pending.tiroLabel || 'Tiro Richiesto';
                            showRollRequestModal(pending);
                            sendBrowserNotification(label, `Il DM ha richiesto: ${label}`);
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'delete') {
                    const current = window.currentRollRequest;
                    if (current?.tipo === 'iniziativa' && current.sessione_id === data.sessioneId) {
                        const { data: request, error } = await supabase
                            .from('richieste_tiro_iniziativa')
                            .select('id')
                            .eq('id', current.id)
                            .maybeSingle();
                        if (!error && !request) closeRollRequestModal();
                    }
                    if (
                        AppState.currentPage === 'combattimento'
                        && AppState.currentCampagnaId === data.campagnaId
                        && AppState.currentSessioneId === data.sessioneId
                        && !handledFinishedCombats.has(data.sessioneId)
                        && await combatRequestsAreGone(supabase, data.sessioneId)
                    ) {
                        handledFinishedCombats.add(data.sessioneId);
                        showNotification('Il combattimento è terminato');
                        navigateToPage('sessione');
                    }
                }

                if (
                    data.table === 'combattimento'
                    && data.action === 'end'
                    && window.currentRollRequest?.tipo === 'iniziativa'
                    && window.currentRollRequest.sessione_id === data.sessioneId
                ) {
                    closeRollRequestModal();
                }

                if (
                    data.table === 'combattimento'
                    && data.action === 'end'
                    && AppState.currentPage === 'combattimento'
                    && AppState.currentCampagnaId === data.campagnaId
                    && AppState.currentSessioneId === data.sessioneId
                    && !handledFinishedCombats.has(data.sessioneId)
                    && await combatRequestsAreGone(supabase, data.sessioneId)
                ) {
                    handledFinishedCombats.add(data.sessioneId);
                    showNotification('Il combattimento è terminato');
                    navigateToPage('sessione');
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'delete') {
                    const current = window.currentRollRequest;
                    if (
                        current?.tipo === 'generico'
                        && current.sessione_id === data.sessioneId
                        && current.richiesta_id === data.richiestaId
                    ) {
                        const { data: request, error } = await supabase
                            .from('richieste_tiro_generico')
                            .select('id')
                            .eq('id', current.id)
                            .maybeSingle();
                        if (!error && !request) closeRollRequestModal();
                    }
                }

                if (
                    data.table === 'sessioni'
                    && data.action === 'insert'
                    && data.campagnaId
                    && data.sessioneId
                ) {
                    await handleSessionStarted(data.campagnaId, data.sessioneId);
                }

                if (
                    data.table === 'sessioni'
                    && data.action === 'update'
                    && data.campagnaId
                    && data.sessioneId
                    && !handledFinishedSessions.has(data.sessioneId)
                ) {
                    const { data: sessione, error } = await supabase
                        .from('sessioni')
                        .select('data_fine')
                        .eq('id', data.sessioneId)
                        .eq('campagna_id', data.campagnaId)
                        .maybeSingle();
                    if (!error && sessione?.data_fine) {
                        handledFinishedSessions.add(data.sessioneId);
                        if (window.currentRollRequest?.sessione_id === data.sessioneId) {
                            closeRollRequestModal();
                        }
                        if (AppState.activeSessionCampagnaId === data.campagnaId) {
                            const { data: activeSession, error: activeSessionError } = await supabase
                                .from('sessioni')
                                .select('id')
                                .eq('campagna_id', data.campagnaId)
                                .is('data_fine', null)
                                .limit(1)
                                .maybeSingle();
                            if (!activeSessionError && !activeSession) clearActiveSession();
                        }
                        if (
                            (AppState.currentPage === 'sessione' || AppState.currentPage === 'combattimento')
                            && AppState.currentCampagnaId === data.campagnaId
                            && AppState.currentSessioneId === data.sessioneId
                        ) {
                            showNotification('La sessione è terminata');
                            navigateToPage('dettagli');
                        }
                    }
                }

                const skipRefreshTables = [
                    'richieste_tiro_iniziativa',
                    'richieste_tiro_generico'
                ];
                const needsRefresh = !skipRefreshTables.includes(data.table);
                if (needsRefresh) {
                    window.requestLegacyRealtimeRefresh?.(data);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'sessioni' },
            (payload) => {
                const row = payload?.new;
                if (!row?.id || !row?.campagna_id) return;
                publishAppDataChange({
                    table: 'sessioni',
                    action: 'insert',
                    campagnaId: row.campagna_id,
                    sessioneId: row.id
                });
                handleSessionStarted(row.campagna_id, row.id);
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'richieste_tiro_iniziativa' },
            (payload) => {
                const row = payload?.new;
                if (!row?.id || !row?.sessione_id) return;
                publishAppDataChange({
                    table: 'richieste_tiro_iniziativa',
                    action: 'update',
                    id: row.id,
                    requestId: row.id,
                    sessioneId: row.sessione_id
                });
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                appDebug('✅ Realtime subscription globale app attiva');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ Realtime subscription globale app in errore');
            }
        });

    appEventsChannel = channel;
    window.appEventsChannel = channel;
}

async function combatRequestsAreGone(supabase, sessioneId) {
    if (!sessioneId) return false;
    const { count, error } = await supabase
        .from('richieste_tiro_iniziativa')
        .select('id', { count: 'exact', head: true })
        .eq('sessione_id', sessioneId);
    return !error && count === 0;
}

/**
 * Ferma Realtime subscription globale per eventi app
 */
function stopAppEventsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    notifiedSessionStarts.clear();
    handledFinishedSessions.clear();
    handledFinishedCombats.clear();

    if (appEventsChannel) {
        supabase.removeChannel(appEventsChannel);
        appEventsChannel = null;
        window.appEventsChannel = null;
        appDebug('✅ Realtime subscription globale app fermata');
    }

}

/**
 * Invia un broadcast globale per notificare cambiamenti app
 */
async function sendAppEventBroadcast(change) {
    const timestamp = Date.now();
    const payload = {
        ...change,
        eventId: window.crypto?.randomUUID?.() || `event-${timestamp}-${Math.random()}`,
        sourceClientId: window.CompanionRealtimeBridge?.clientId || null,
        sourceUid: AppState.currentUser?.uid || null,
        timestamp
    };
    publishAppDataChange({ ...payload, sourceClientId: null });

    const supabase = getSupabaseClient();
    if (!supabase) return;

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
                icon: 'images/app-icon-192.png'
            });
        } else {
            new Notification(title, {
                body,
                icon: 'images/app-icon-192.png',
                badge: 'images/app-icon-192.png',
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
        const registration = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
        registration.update().catch(e => console.warn('SW update check:', e));
        appDebug('Service Worker registrato');

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
