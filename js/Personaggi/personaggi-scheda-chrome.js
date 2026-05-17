// ============================================================================
// CHARACTER SHEET SHARED CHROME
// ============================================================================

// Set di chiavi di sezioni "aperte" persistite tra i re-render della scheda.
// Usato per le sezioni che hanno data-section-key (es. tabelle custom di
// pagina 1) cosi' un'azione che ricostruisce il DOM non chiude la sezione.
window._schedaOpenSections = window._schedaOpenSections || new Set();
window._schedaClosedSections = window._schedaClosedSections || new Set();

window.schedaToggleSection = function(titleEl) {
    const section = titleEl.closest('.scheda-section');
    if (!section) return;
    section.classList.toggle('collapsed');
    const key = section.getAttribute('data-section-key');
    if (key) {
        const isCollapsed = section.classList.contains('collapsed');
        if (isCollapsed) {
            window._schedaOpenSections.delete(key);
            window._schedaClosedSections.add(key);
        } else {
            window._schedaOpenSections.add(key);
            window._schedaClosedSections.delete(key);
        }
    }
};

/* ── Bottone "Vai a Statistiche" (icona spada) ─────────────────────────
   - Visibile mentre si e' nella scheda di un PG (gestito in navigation.js).
   - Click: porta alla Pagina 1 e scrolla al divisore appena prima della sezione Statistiche.
   - Su Pagina 2/Inventario/Incantesimi: prima naviga a Pagina 1 e poi scrolla. */
function _scrollSchedaDividerIntoView() {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    // Il primo divisore di Pagina 1 e' quello prima della sezione "Statistiche".
    const divider = content.querySelector('.scheda-divider');
    if (divider) {
        divider.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Fallback: scrolla in cima alla sezione Statistiche cercando per testo del titolo.
        const titles = content.querySelectorAll('.scheda-section-title');
        for (const t of titles) {
            if (t.textContent.trim().startsWith('Statistiche')) {
                t.closest('.scheda-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    }
}

window.schedaScrollToStats = function() {
    const pgId = window._schedaCurrentPgId || AppState.currentPersonaggioId;
    const tab = window._schedaCurrentTab;
    const tryScroll = () => {
        const content = document.getElementById('schedaContent');
        if (!content) return false;
        const target = content.querySelector('.scheda-divider')
                    || Array.from(content.querySelectorAll('.scheda-section-title'))
                            .find(t => t.textContent.trim().startsWith('Statistiche'));
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    };
    if (tab && tab !== 'scheda' && pgId) {
        // Naviga a Pagina 1 e attende che il divider/sezione "Statistiche"
        // appaia nel DOM (polling) prima di eseguire lo scroll. Questo
        // risolve il bug per cui il pulsante non funzionava da Inventario o
        // da altre tab perche' il render era ancora in corso.
        renderSchedaPersonaggio(pgId).then(() => {
            let tries = 0;
            const tick = () => {
                if (tryScroll() || tries++ > 25) return;
                setTimeout(tick, 60);
            };
            setTimeout(tick, 30);
        });
        return;
    }
    if (!tryScroll()) {
        // Fallback: se per qualche motivo non riusciamo a trovare il target,
        // proviamo dopo un breve delay.
        setTimeout(tryScroll, 80);
    }
};

window.schedaToggleSubsection = function(titleEl) {
    const sub = titleEl.closest('.scheda-subsection');
    if (sub) sub.classList.toggle('collapsed');
};

async function _schedaApplyResImmVulChange(pgId, kind, dmgType) {
    // kind: 'res' | 'imm' | 'vul'  – tre liste mutuamente esclusive sul singolo dmgType.
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!pg) return;
    let res = Array.isArray(pg.resistenze) ? [...pg.resistenze] : [];
    let imm = Array.isArray(pg.immunita) ? [...pg.immunita] : [];
    let vul = Array.isArray(pg.vulnerabilita) ? [...pg.vulnerabilita] : [];
    const isOn = (kind === 'res' && res.includes(dmgType))
              || (kind === 'imm' && imm.includes(dmgType))
              || (kind === 'vul' && vul.includes(dmgType));
    res = res.filter(x => x !== dmgType);
    imm = imm.filter(x => x !== dmgType);
    vul = vul.filter(x => x !== dmgType);
    if (!isOn) {
        if (kind === 'res') res.push(dmgType);
        else if (kind === 'imm') imm.push(dmgType);
        else if (kind === 'vul') vul.push(dmgType);
    }
    pg.resistenze = res;
    pg.immunita = imm;
    pg.vulnerabilita = vul;
    _refreshResImmInlineRow(dmgType);
    if (!supabase) return;
    // Salva tutto insieme; se la colonna 'vulnerabilita' non esiste ancora a DB, fallback senza di essa.
    const { error } = await supabase.from('personaggi')
        .update({ resistenze: res, immunita: imm, vulnerabilita: vul }).eq('id', pgId);
    if (error && /vulnerabilita/i.test(error.message || '')) {
        await supabase.from('personaggi').update({ resistenze: res, immunita: imm }).eq('id', pgId);
        console.warn('[scheda] Colonna "vulnerabilita" mancante a DB: esegui sql/add-vulnerabilita.sql');
    }
}

window.schedaToggleResInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'res', dmgType); };
window.schedaToggleImmInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'imm', dmgType); };
window.schedaToggleVulInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'vul', dmgType); };

function _refreshResImmInlineRow(dmgType) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const isRes = (pg.resistenze || []).includes(dmgType);
    const isImm = (pg.immunita || []).includes(dmgType);
    const isVul = (pg.vulnerabilita || []).includes(dmgType);
    const row = document.getElementById('sResImmRow_' + dmgType);
    if (row) {
        const r = row.querySelector('.scheda-resimm-marker.res');
        const i = row.querySelector('.scheda-resimm-marker.imm');
        const v = row.querySelector('.scheda-resimm-marker.vul');
        if (r) r.classList.toggle('active', isRes);
        if (i) i.classList.toggle('active', isImm);
        if (v) v.classList.toggle('active', isVul);
    }
    const badge = document.getElementById('sResImmCount');
    if (badge) {
        const tot = (pg.resistenze || []).length + (pg.immunita || []).length + (pg.vulnerabilita || []).length;
        badge.textContent = tot > 0 ? tot : '';
    }
}

/* ── Header scheda condiviso (foto a sx, identità a sx, level-up + ispirazione a dx) ── */
function buildSchedaHeader(pg, pageLabel) {
    if (!pg) return '';
    const initials = (pg.nome || '?').trim().split(/\s+/).slice(0, 2).map(s => s.charAt(0).toUpperCase()).join('') || '?';
    const rawUrl = pg.immagine_url || '';
    // Normalizza on-the-fly: copre eventuali URL Drive salvati prima
    // dell'introduzione del normalizzatore (es. link "/file/d/.../view"
    // che il browser non puo' embeddare).
    const imgUrl = rawUrl ? (typeof _normalizeImageUrl === 'function' ? _normalizeImageUrl(rawUrl) : rawUrl) : '';
    const avatarInner = imgUrl
        ? `<img src="${escapeAttr(imgUrl)}" alt="${escapeAttr(pg.nome || '')}" class="scheda-avatar-img" referrerpolicy="no-referrer" loading="lazy">`
        : `<span class="scheda-avatar-initials">${escapeHtml(initials)}</span>`;
    const subtitle = (() => {
        if (pageLabel) return escapeHtml(pageLabel);
        if (pg.classi && pg.classi.length > 0) {
            return pg.classi.map(c => `${escapeHtml(c.nome)} ${parseInt(c.livello) || 1}`).join(' / ');
        }
        return escapeHtml(pg.classe || '');
    })();
    const subtitleSm = pageLabel ? '' : escapeHtml(pg.razza || '');
    const hasClasses = pg.classi && pg.classi.length > 0;
    const levelUpBtn = hasClasses
        ? `<button class="scheda-levelup-top" onclick="schedaLevelUp('${pg.id}')" title="Level up">▲ Level Up</button>`
        : '';
    const ispVal = pg.ispirazione || 0;
    const ispBox = `<div class="scheda-isp-box" title="Ispirazione">
        <button class="scheda-isp-btn" onclick="schedaIspChange('${pg.id}',-1)" aria-label="Diminuisci ispirazione">−</button>
        <div class="scheda-isp-display"><span class="scheda-isp-star" aria-hidden="true">★</span><span id="sIsp">${ispVal}</span></div>
        <button class="scheda-isp-btn" onclick="schedaIspChange('${pg.id}',1)" aria-label="Aumenta ispirazione">+</button>
    </div>`;
    return `
    <div class="scheda-identity">
        <button type="button" class="scheda-avatar" onclick="schedaEditAvatar('${pg.id}')" title="Cambia immagine">
            ${avatarInner}
        </button>
        <div class="scheda-identity-info">
            <div class="scheda-name">${escapeHtml(pg.nome || '')}</div>
            <div class="scheda-subtitle">${subtitle}</div>
            ${subtitleSm ? `<div class="scheda-subtitle-sm">${subtitleSm}</div>` : ''}
        </div>
        <div class="scheda-identity-actions">
            ${levelUpBtn}
            ${ispBox}
        </div>
    </div>`;
}

// Estrae il file ID da un URL Google Drive in qualsiasi formato comune
// (sharing link, open link, uc?id=, ecc) e lo restituisce, o null se
// non e' un URL Drive riconosciuto.
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
    const tab = window._schedaCurrentTab;
    if (tab === 'incantesimi') schedaOpenSpellPage(pgId);
    else if (tab === 'inventario') schedaOpenInventoryPage(pgId);
    else if (tab === 'privilegi') schedaOpenPrivilegesPage(pgId);
    else renderSchedaPersonaggio(pgId);
}
