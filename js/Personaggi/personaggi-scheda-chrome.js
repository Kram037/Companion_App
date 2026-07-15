// ============================================================================
// CHARACTER SHEET SHARED CHROME
// ============================================================================

// Set di chiavi di sezioni "aperte" persistite tra i re-render della scheda.
// Usato per le sezioni che hanno data-section-key (es. tabelle custom di
// pagina 1) cosi' un'azione che ricostruisce il DOM non chiude la sezione.
window._schedaOpenSections = window._schedaOpenSections || new Set();
window._schedaClosedSections = window._schedaClosedSections || new Set();

/* ── Bottone "Vai a Statistiche" (icona spada) ─────────────────────────
   - Visibile mentre si e' nella scheda di un PG (gestito in navigation.js).
   - Click: porta alla Pagina 1 e scrolla al divisore appena prima della sezione Statistiche.
   - Su Pagina 2/Inventario/Incantesimi: prima naviga a Pagina 1 e poi scrolla. */
window.schedaScrollToStats = function() {
    const pgId = window._schedaCurrentPgId || AppState.currentPersonaggioId;
    const tab = window._schedaCurrentTab;
    const tryScroll = () => {
        const target = pgId ? document.getElementById(`${pgId}:statistics`) : null;
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    };
    if (tab && tab !== 'scheda' && pgId) {
        _schedaRequestReactRefresh(pgId, 'scheda');
        let tries = 0;
        const tick = () => {
            if (tryScroll() || tries++ > 25) return;
            setTimeout(tick, 60);
        };
        setTimeout(tick, 30);
        return;
    }
    if (!tryScroll()) {
        // Fallback: se per qualche motivo non riusciamo a trovare il target,
        // proviamo dopo un breve delay.
        setTimeout(tryScroll, 80);
    }
};

/* ── Header scheda condiviso (foto a sx, identità a sx, level-up + ispirazione a dx) ── */
function _schedaRefreshCurrentTab(pgId) {
    const tab = window._schedaCurrentTab;
    _schedaRequestReactRefresh(pgId, _schedaPgCache?.tipo_scheda === 'micro' ? 'micro' : (tab || 'scheda'));
}

window.schedaRenameCharacter = async function(pgId) {
    const pg = _schedaPgCache;
    const currentName = (pg?.nome || '').trim();
    const nextName = (await showPrompt('Nuovo nome', 'Rinomina personaggio', currentName) || '').trim();
    if (!nextName || nextName === currentName) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase
        .from('personaggi')
        .update({ nome: nextName, updated_at: new Date().toISOString() })
        .eq('id', pgId);
    if (error) {
        console.error('Errore rinomina personaggio:', error);
        showNotification('Impossibile rinominare il personaggio');
        return;
    }

    if (_schedaPgCache) _schedaPgCache.nome = nextName;
    showNotification('Nome aggiornato');
    _schedaRefreshCurrentTab(pgId);
};

function _extractGoogleDriveFileId(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    // /file/d/<ID>/...
    let m = u.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // /document/d/<ID>/...  /presentation/d/<ID>/...
    m = u.match(/\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // ?id=<ID> o &id=<ID>
    m = u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // /d/<ID>  (lh3.googleusercontent.com/d/<ID>)
    m = u.match(/\/d\/([a-zA-Z0-9_-]{20,})(?:\b|$)/);
    if (m) return m[1];
    return null;
}

// Trasforma un URL di Google Drive in uno utilizzabile direttamente
// dentro <img>. Drive non serve direttamente i contenuti dei link
// /file/d/.../view (richiedono OAuth e mostrano una pagina HTML invece
// dell'immagine), quindi convertiamo nel formato googleusercontent /d/
// che e' embeddable senza autenticazione (funziona finche' il file e'
// condiviso "chiunque con il link puo' visualizzare").
// Ritorna l'URL originale se non e' Google Drive.
function _normalizeImageUrl(url) {
    if (!url) return url;
    const id = _extractGoogleDriveFileId(url);
    if (!id) return url.trim();
    // googleusercontent /d/ accetta opzionalmente un suffisso di
    // dimensione (=w800-h800 ecc.); senza suffisso restituisce
    // l'immagine alla risoluzione di default, sufficiente per un avatar.
    return `https://lh3.googleusercontent.com/d/${id}=w1024`;
}
window._normalizeImageUrl = _normalizeImageUrl;

window.schedaEditAvatar = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = pg.immagine_url || '';
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay scheda-avatar-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal scheda-avatar-modal">
            <button class="modal-close" type="button" aria-label="Chiudi">&times;</button>
            <h2 class="scheda-avatar-title">Immagine del personaggio</h2>
            <div class="scheda-avatar-preview" id="schedaAvatarPreview">
                ${current
                    ? `<img src="${escapeAttr(current)}" alt="Anteprima" id="schedaAvatarPreviewImg">`
                    : `<span class="scheda-avatar-preview-placeholder">Nessuna immagine</span>`}
            </div>
            <label class="scheda-avatar-label">URL immagine</label>
            <input type="url" id="schedaAvatarInput" class="scheda-avatar-input"
                placeholder="https://… (oppure incolla un link Google Drive)"
                value="${escapeAttr(current)}">
            <div class="scheda-avatar-hint">
                <strong>Google Drive:</strong> assicurati che il file sia condiviso
                con "<em>Chiunque abbia il link</em>". Incolla qui il link di
                condivisione: viene convertito automaticamente in un URL
                utilizzabile dall'app.
            </div>
            <div class="scheda-avatar-actions">
                <button type="button" class="btn-secondary" id="schedaAvatarRemove">Rimuovi</button>
                <button type="button" class="btn-secondary" id="schedaAvatarCancel">Annulla</button>
                <button type="button" class="btn-primary" id="schedaAvatarSave">Salva</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#schedaAvatarInput');
    const previewBox = overlay.querySelector('#schedaAvatarPreview');
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('#schedaAvatarCancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const refreshPreview = () => {
        const raw = (input.value || '').trim();
        if (!raw) {
            previewBox.innerHTML = `<span class="scheda-avatar-preview-placeholder">Nessuna immagine</span>`;
            return;
        }
        const normalized = _normalizeImageUrl(raw);
        previewBox.innerHTML = `<img src="${escapeAttr(normalized)}" alt="Anteprima" id="schedaAvatarPreviewImg">`;
        const img = previewBox.querySelector('img');
        img.addEventListener('error', () => {
            previewBox.innerHTML = `<span class="scheda-avatar-preview-placeholder scheda-avatar-preview-error">Impossibile caricare l'immagine.<br><small>Controlla l'URL o le autorizzazioni di condivisione.</small></span>`;
        });
    };
    input.addEventListener('input', () => {
        clearTimeout(input._t);
        input._t = setTimeout(refreshPreview, 350);
    });

    overlay.querySelector('#schedaAvatarRemove').addEventListener('click', async () => {
        await _schedaPersistAvatar(pgId, null);
        close();
    });
    overlay.querySelector('#schedaAvatarSave').addEventListener('click', async () => {
        const raw = (input.value || '').trim();
        const normalized = raw ? _normalizeImageUrl(raw) : null;
        await _schedaPersistAvatar(pgId, normalized);
        close();
    });

    setTimeout(() => input.focus(), 50);
};

async function _schedaPersistAvatar(pgId, urlOrNull) {
    const pg = _schedaPgCache;
    if (!pg) return;
    pg.immagine_url = urlOrNull;
    const supabase = getSupabaseClient();
    if (supabase) {
        const { error } = await supabase.from('personaggi').update({ immagine_url: urlOrNull }).eq('id', pgId);
        if (error) {
            console.warn('Salvataggio immagine fallito:', error.message);
            showNotification && showNotification('Impossibile salvare l\'immagine (manca colonna immagine_url?)');
        }
    }
    _schedaRefreshCurrentTab(pgId);
}
