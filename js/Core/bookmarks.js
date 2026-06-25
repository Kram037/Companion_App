// ============================================================================
// BOOKMARKS - Saved navigation tabs / reading positions
// ============================================================================

const BOOKMARKS_VERSION = 1;
const BOOKMARKS_MAX = 24;
let _bookmarkRefreshTimer = null;

function _bookmarksStorageKey() {
    const uid = AppState?.currentUser?.uid || 'local';
    return `companion_bookmarks_v${BOOKMARKS_VERSION}_${uid}`;
}

function _bookmarksRead() {
    try {
        const raw = localStorage.getItem(_bookmarksStorageKey());
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch (_) {
        return [];
    }
}

function _bookmarksWrite(list) {
    localStorage.setItem(_bookmarksStorageKey(), JSON.stringify(list.slice(0, BOOKMARKS_MAX)));
}

function _bookmarkNow() {
    return new Date().toISOString();
}

function _bookmarkActivePageEl() {
    return document.querySelector('.page.active');
}

function _bookmarkMainScrollTop() {
    const main = document.getElementById('mainContent');
    return main ? main.scrollTop : (window.scrollY || 0);
}

function _bookmarkSetMainScrollTop(top) {
    const value = Math.max(0, parseInt(top, 10) || 0);
    requestAnimationFrame(() => {
        const main = document.getElementById('mainContent');
        if (main) main.scrollTo({ top: value, left: 0, behavior: 'auto' });
        window.scrollTo?.({ top: value, left: 0, behavior: 'auto' });
    });
}

function _bookmarkCleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function _bookmarkTitleFallback(page) {
    const active = _bookmarkActivePageEl();
    const title = active?.querySelector('.page-top-stack .page-header h1, .page-header h1')?.textContent;
    return _bookmarkCleanText(title) || ({
        campagne: 'Campagne',
        compendio: 'Compendio',
        laboratorio: 'Laboratorio',
        personaggi: 'Personaggi',
        personaggioCreate: 'Nuovo Personaggio',
        scheda: 'Scheda',
        dettagli: 'Dettagli Campagna',
        sessione: 'Sessione',
        combattimento: 'Combattimento',
        amici: 'Amici',
    }[page] || 'Pagina');
}

function _bookmarkSectionFallback(page) {
    if (page === 'scheda') return 'Scheda personaggio';
    if (page === 'personaggioCreate') {
        const step = typeof pgWizardCurrentStep !== 'undefined' ? pgWizardCurrentStep : 0;
        return `Step ${step + 1}`;
    }
    if (page === 'compendio') return 'Compendio';
    if (page === 'laboratorio') return 'Laboratorio';
    return '';
}

function _bookmarkCurrentSnapshot() {
    const page = AppState.currentPage || 'campagne';
    const hook = typeof window.getPageBookmarkState === 'function'
        ? (window.getPageBookmarkState(page) || {})
        : {};
    const title = hook.title || _bookmarkTitleFallback(page);
    const section = hook.section || _bookmarkSectionFallback(page);
    const state = {
        page,
        campagnaId: AppState.currentCampagnaId || null,
        sessioneId: AppState.currentSessioneId || null,
        personaggioId: AppState.currentPersonaggioId || null,
        scrollTop: _bookmarkMainScrollTop(),
        hook: hook.state || {},
    };
    const fingerprint = hook.fingerprint || [
        page,
        state.campagnaId || '',
        state.sessioneId || '',
        state.personaggioId || '',
        hook.key || '',
    ].join('|');

    return {
        id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fingerprint,
        title,
        section,
        page,
        state,
        createdAt: _bookmarkNow(),
        updatedAt: _bookmarkNow(),
    };
}

window.getPageBookmarkState = function(page) {
    if (page === 'compendio' && typeof window.compGetBookmarkState === 'function') {
        return window.compGetBookmarkState();
    }
    if (page === 'laboratorio' && typeof window.labGetBookmarkState === 'function') {
        return window.labGetBookmarkState();
    }
    if (page === 'scheda') {
        const pgId = window._schedaCurrentPgId || AppState.currentPersonaggioId || '';
        const tab = window._schedaCurrentTab || 'scheda';
        const title = _bookmarkTitleFallback(page);
        return {
            title,
            section: `Scheda > ${tab === 'scheda' ? 'Pagina 1' : tab}`,
            key: `${pgId}:${tab}`,
            state: {
                tab,
                openSections: Array.from(window._schedaOpenSections || []),
                closedSections: Array.from(window._schedaClosedSections || []),
            },
        };
    }
    if (page === 'personaggioCreate') {
        const step = typeof pgWizardCurrentStep !== 'undefined' ? pgWizardCurrentStep : 0;
        return {
            title: _bookmarkTitleFallback(page),
            section: `Creazione personaggio > Step ${step + 1}`,
            key: `step:${step}`,
            state: { step },
        };
    }
    return null;
};

window.restorePageBookmarkState = async function(page, saved) {
    if (page === 'compendio' && typeof window.compRestoreBookmarkState === 'function') {
        return window.compRestoreBookmarkState(saved);
    }
    if (page === 'laboratorio' && typeof window.labRestoreBookmarkState === 'function') {
        return window.labRestoreBookmarkState(saved);
    }
    if (page === 'scheda') {
        const pgId = AppState.currentPersonaggioId || window._schedaCurrentPgId;
        if (!pgId) return;
        if (Array.isArray(saved.openSections)) window._schedaOpenSections = new Set(saved.openSections);
        if (Array.isArray(saved.closedSections)) window._schedaClosedSections = new Set(saved.closedSections);
        const tab = saved.tab || 'scheda';
        if (tab === 'incantesimi' && typeof schedaOpenSpellPage === 'function') return schedaOpenSpellPage(pgId);
        if (tab === 'inventario' && typeof schedaOpenInventoryPage === 'function') return schedaOpenInventoryPage(pgId);
        if (tab === 'privilegi' && typeof schedaOpenPrivilegesPage === 'function') return schedaOpenPrivilegesPage(pgId);
        if (typeof renderSchedaPersonaggio === 'function') return renderSchedaPersonaggio(pgId);
        return;
    }
    if (page === 'personaggioCreate' && typeof pgWizardGoTo === 'function') {
        pgWizardGoTo(parseInt(saved.step, 10) || 0);
    }
};

function _bookmarkFindCurrent(list = _bookmarksRead()) {
    const snap = _bookmarkCurrentSnapshot();
    return list.find(b => b.fingerprint === snap.fingerprint) || null;
}

function _bookmarkIconSvg(filled = false) {
    return filled
        ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V22l-6-3.5L6 22V3.5Z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V22l-6-3.5L6 22V3.5Z"/></svg>`;
}

function _bookmarkEnsureHeaderButton() {
    const active = _bookmarkActivePageEl();
    if (!active) return null;
    const header = active.querySelector('.page-top-stack .page-header, .page-header');
    if (!header) return null;
    if (active.id === 'combattimentoPage') return null;

    let btn = header.querySelector('.page-header-bookmark');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-header-action page-header-bookmark';
        btn.setAttribute('aria-label', 'Salva scheda');
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            saveCurrentBookmark();
        });
        header.appendChild(btn);
    }
    header.classList.add('page-header-has-bookmark');
    header.querySelectorAll('.page-header-action:not(.page-header-bookmark)').forEach(action => {
        action.classList.add('page-header-action-before-bookmark');
    });
    return btn;
}

function updateBookmarkChrome() {
    const btn = _bookmarkEnsureHeaderButton();
    const list = _bookmarksRead();
    const current = _bookmarkFindCurrent(list);
    if (btn) {
        btn.classList.toggle('is-saved', !!current);
        btn.innerHTML = _bookmarkIconSvg(!!current);
        btn.title = current ? 'Aggiorna scheda salvata' : 'Salva scheda';
        btn.setAttribute('aria-label', current ? 'Aggiorna scheda salvata' : 'Salva scheda');
    }
    const fab = document.getElementById('bookmarksFab');
    const count = document.getElementById('bookmarksFabCount');
    if (fab) fab.style.display = list.length ? 'inline-flex' : 'none';
    if (count) count.textContent = String(list.length);
    renderBookmarksSheet();
}

function saveCurrentBookmark() {
    const snap = _bookmarkCurrentSnapshot();
    const list = _bookmarksRead();
    const idx = list.findIndex(b => b.fingerprint === snap.fingerprint);
    if (idx >= 0) {
        list[idx] = {
            ...list[idx],
            ...snap,
            id: list[idx].id,
            createdAt: list[idx].createdAt,
            updatedAt: _bookmarkNow(),
        };
        showNotification?.('Scheda aggiornata');
    } else {
        list.unshift(snap);
        showNotification?.('Scheda salvata');
    }
    _bookmarksWrite(list);
    updateBookmarkChrome();
}

function removeBookmark(id) {
    const list = _bookmarksRead().filter(b => b.id !== id);
    _bookmarksWrite(list);
    updateBookmarkChrome();
}

async function openBookmark(id) {
    const item = _bookmarksRead().find(b => b.id === id);
    if (!item) return;
    closeBookmarksSheet();

    const st = item.state || {};
    AppState.currentCampagnaId = st.campagnaId || null;
    AppState.currentSessioneId = st.sessioneId || null;
    AppState.currentPersonaggioId = st.personaggioId || null;

    if (st.campagnaId) sessionStorage.setItem('currentCampagnaId', st.campagnaId);
    if (st.sessioneId) sessionStorage.setItem('currentSessioneId', st.sessioneId);
    if (st.personaggioId) sessionStorage.setItem('currentPersonaggioId', st.personaggioId);

    navigateToPage(st.page || item.page || 'campagne');

    const restore = async () => {
        if (typeof window.restorePageBookmarkState === 'function') {
            await window.restorePageBookmarkState(st.page || item.page, st.hook || {}, item);
        }
        setTimeout(() => {
            _bookmarkSetMainScrollTop(st.scrollTop);
            updateBookmarkChrome();
        }, 180);
    };
    setTimeout(restore, 80);
}

function _bookmarkEscape(value) {
    return typeof escapeHtml === 'function' ? escapeHtml(value) : String(value || '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

function renderBookmarksSheet() {
    const list = _bookmarksRead();
    const body = document.getElementById('bookmarksSheetList');
    if (!body) return;
    if (!list.length) {
        body.innerHTML = '<div class="bookmarks-empty">Nessuna scheda salvata.</div>';
        return;
    }
    body.innerHTML = list.map(item => `
        <div class="bookmark-row" role="button" tabindex="0" onclick="openBookmark('${item.id}')">
            <div class="bookmark-row-main">
                <div class="bookmark-row-title">${_bookmarkEscape(item.title)}</div>
                <div class="bookmark-row-section">${_bookmarkEscape(item.section || item.page)}</div>
            </div>
            <button type="button" class="bookmark-row-remove" aria-label="Rimuovi scheda" onclick="event.stopPropagation(); removeBookmark('${item.id}')">&times;</button>
        </div>
    `).join('');
}

function openBookmarksSheet() {
    renderBookmarksSheet();
    document.getElementById('bookmarksSheetOverlay')?.classList.add('active');
}

function closeBookmarksSheet() {
    document.getElementById('bookmarksSheetOverlay')?.classList.remove('active');
}

function initBookmarks() {
    if (!document.getElementById('bookmarksFab')) {
        const fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'bookmarksFab';
        fab.className = 'bookmarks-fab';
        fab.setAttribute('aria-label', 'Schede salvate');
        fab.innerHTML = `${_bookmarkIconSvg(true)}<span id="bookmarksFabCount">0</span>`;
        fab.onclick = openBookmarksSheet;
        document.body.appendChild(fab);
    }
    if (!document.getElementById('bookmarksSheetOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'bookmarksSheetOverlay';
        overlay.className = 'bookmarks-sheet-overlay';
        overlay.onclick = (event) => {
            if (event.target === overlay) closeBookmarksSheet();
        };
        overlay.innerHTML = `
            <section class="bookmarks-sheet" aria-label="Schede salvate">
                <div class="bookmarks-sheet-handle"></div>
                <div class="bookmarks-sheet-head">
                    <h2>Schede salvate</h2>
                    <button type="button" class="bookmarks-sheet-close" onclick="closeBookmarksSheet()" aria-label="Chiudi">&times;</button>
                </div>
                <div id="bookmarksSheetList" class="bookmarks-sheet-list"></div>
            </section>
        `;
        document.body.appendChild(overlay);
    }
    if (!window._bookmarksInteractionRefreshBound) {
        window._bookmarksInteractionRefreshBound = true;
        const schedule = () => {
            clearTimeout(_bookmarkRefreshTimer);
            _bookmarkRefreshTimer = setTimeout(updateBookmarkChrome, 180);
        };
        document.addEventListener('click', schedule, true);
        document.addEventListener('input', schedule, true);
    }
    updateBookmarkChrome();
}

window.initBookmarks = initBookmarks;
window.updateBookmarkChrome = updateBookmarkChrome;
window.saveCurrentBookmark = saveCurrentBookmark;
window.openBookmark = openBookmark;
window.removeBookmark = removeBookmark;
window.openBookmarksSheet = openBookmarksSheet;
window.closeBookmarksSheet = closeBookmarksSheet;
