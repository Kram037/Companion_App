// ============================================================================
// CHARACTER LIST VIEW
// ============================================================================

async function loadPersonaggi(options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;
    const { silent = false } = options;

    if (!silent && elements.personaggiList) {
        setSafeHtml(elements.personaggiList, '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento personaggi...</p></div>');
    }

    try {
        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const pgList = personaggi || [];
        let campagneMap = {};
        if (pgList.length > 0) {
            const pgIds = pgList.map(p => p.id);
            const { data: assocs, error: assocErr } = await supabase
                .from('personaggi_campagna')
                .select('personaggio_id, campagna_id')
                .in('personaggio_id', pgIds);
            if (assocErr) console.error('Errore caricamento associazioni pg-campagna:', assocErr);
            if (assocs && assocs.length > 0) {
                const campagnaIds = [...new Set(assocs.map(a => a.campagna_id))];
                const { data: campagne } = await supabase
                    .from('campagne')
                    .select('id, nome_campagna')
                    .in('id', campagnaIds);
                const nomiMap = {};
                if (campagne) campagne.forEach(c => { nomiMap[c.id] = c.nome_campagna; });
                assocs.forEach(a => {
                    if (!campagneMap[a.personaggio_id]) campagneMap[a.personaggio_id] = [];
                    const nome = nomiMap[a.campagna_id];
                    if (nome) campagneMap[a.personaggio_id].push(nome);
                });
            }
        }
        renderPersonaggi(pgList, campagneMap);
    } catch (error) {
        console.error('Errore caricamento personaggi:', error);
        if (elements.personaggiList) {
            setSafeHtml(elements.personaggiList, '<div class="content-placeholder"><p>Errore nel caricamento dei personaggi</p></div>');
        }
    }
}

function setupPersonaggiListDelegation() {
    const list = elements.personaggiList;
    if (!list || list.dataset.personaggiDelegationReady === 'true') return;

    list.dataset.personaggiDelegationReady = 'true';
    list.addEventListener('click', handlePersonaggiListClick);
}

function handlePersonaggiListClick(event) {
    const actionButton = event.target.closest('[data-pg-action]');
    if (actionButton) {
        event.preventDefault();
        event.stopPropagation();
        const { pgAction, pgId } = actionButton.dataset;
        if (!pgId) return;

        if (pgAction === 'change-subclass') {
            window.pgChangeSubclassFromCard(pgId);
        } else if (pgAction === 'delete') {
            window.deletePersonaggio(pgId);
        }
        return;
    }

    const card = event.target.closest('.pg-card[data-pg-id]');
    if (card?.dataset.pgId) {
        window.openSchedaPersonaggio(card.dataset.pgId);
    }
}

function renderPersonaggi(personaggi, campagneMap = {}) {
    if (!elements.personaggiList) return;

    if (personaggi.length === 0) {
        setSafeHtml(elements.personaggiList, `
            <div class="content-placeholder">
                <p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p>
            </div>`);
        return;
    }

    setSafeHtml(elements.personaggiList, personaggi.map(pg => {
        const safePgId = safeAttr(pg.id);
        const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }
        const campagne = campagneMap[pg.id] || [];
        const campagneText = campagne.length > 0 ? campagne.map(n => escapeHtml(n)).join(', ') : 'Nessuna campagna';

        const isMicro = pg.tipo_scheda === 'micro';
        return `
        <div class="pg-card pg-card-clickable ${isMicro ? 'pg-card-micro' : ''}" data-pg-id="${safePgId}">
            <div class="pg-card-header">
                <div class="pg-card-avatar">${escapeHtml(initials)}</div>
                <div class="pg-card-identity">
                    <p class="pg-card-name">${escapeHtml(pg.nome)}${isMicro ? ' <span class="pg-micro-badge">μ</span>' : ''}</p>
                    <p class="pg-card-subtitle">${escapeHtml(pg.razza || '')} ${escapeHtml(classeDisplay)}</p>
                </div>
                <div class="pg-card-level">Lv ${pg.livello || 1}</div>
            </div>
            <div class="pg-card-footer">
                <div class="pg-card-campaigns"><span class="pg-card-campaigns-icon">⚔</span> ${campagneText}</div>
                <button class="pg-card-action pg-card-subclass-btn" data-pg-action="change-subclass" data-pg-id="${safePgId}" aria-label="Cambia sottoclasse" title="Cambia sottoclasse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>
                <button class="pg-card-delete" data-pg-action="delete" data-pg-id="${safePgId}" aria-label="Elimina personaggio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        </div>`;
    }).join(''));
}
