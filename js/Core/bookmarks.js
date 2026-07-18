// ============================================================================
// BOOKMARKS - Navigation tabs / saved reading contexts
// ============================================================================

const BOOKMARKS_VERSION = 1;
const BOOKMARKS_MAX = 24;
let _bookmarkRefreshTimer = null;
let _bookmarkAutoUpdateTimer = null;
let _bookmarkRestoreInProgress = false;
let _bookmarkSplitLocalActiveId = '';
let _bookmarkFocusedPane = 'left';
let _bookmarkRightPaneState = { page: '', tab: '' };
let _desktopPendingSidebarTarget = null;
const _bookmarkIsSplitPaneInstance = new URLSearchParams(window.location.search).get('splitPane') === '1';
const DESKTOP_LAB_CHILDREN = [
    { key: 'razze', label: 'Razze', iconFile: 'Razze' },
    { key: 'classi', label: 'Classi', iconFile: 'Classi' },
    { key: 'background', label: 'Background', iconFile: 'Background' },
    { key: 'oggetti', label: 'Equipaggiamento', iconFile: 'Equipaggiamento' },
    { key: 'talenti', label: 'Talenti e Stili', iconFile: 'Talenti e Stili' },
    { key: 'nemici', label: 'Mostri e Combattimenti', iconFile: 'Mostri e Combattimenti' },
    { key: 'suppliche', label: 'Suppliche Occulte', iconFile: 'Suppliche' },
    { key: 'incantesimi', label: 'Incantesimi', iconFile: 'Incantesimi' },
];
const DESKTOP_COMP_EQUIPMENT_CHILDREN = [
    { key: 'oggetti:armi', label: 'Armi e Scudi', iconFile: 'Equipaggiamento/Armi_Armature_Scudi' },
    { key: 'oggetti:avventura', label: 'Avventura', iconFile: 'Equipaggiamento/Avventura' },
    { key: 'oggetti:strumenti', label: 'Strumenti', iconFile: 'Equipaggiamento/Strumenti' },
    { key: 'oggetti:erbe', label: 'Erbe', iconFile: 'Equipaggiamento/Erbe' },
    { key: 'oggetti:metalli', label: 'Metalli', iconFile: 'Equipaggiamento/Metalli' },
    { key: 'oggetti:gemme', label: 'Gemme', iconFile: 'Equipaggiamento/Gemme' },
    { key: 'oggetti:veleni', label: 'Veleni', iconFile: 'Equipaggiamento/Veleni' },
    { key: 'oggetti:oggetti', label: 'Oggetti Magici', iconFile: 'Equipaggiamento/Oggetti Magici' },
];
const DESKTOP_COMP_CHILDREN = [
    { key: 'razze', label: 'Razze', iconFile: 'Razze' },
    { key: 'classi', label: 'Classi', iconFile: 'Classi' },
    { key: 'background', label: 'Background', iconFile: 'Background' },
    { key: 'oggetti', label: 'Equipaggiamento', iconFile: 'Equipaggiamento', children: DESKTOP_COMP_EQUIPMENT_CHILDREN },
    { key: 'talenti_stili', label: 'Talenti e Stili', iconFile: 'Talenti e Stili' },
    { key: 'mostri', label: 'Mostri e Combattimenti', iconFile: 'Mostri e Combattimenti' },
    { key: 'suppliche', label: 'Suppliche Occulte', iconFile: 'Suppliche' },
    { key: 'incantesimi', label: 'Incantesimi', iconFile: 'Incantesimi' },
];

function _desktopGroupChildren(page) {
    if (page === 'laboratorio' && typeof window.labGetSidebarItems === 'function') return window.labGetSidebarItems();
    if (page === 'compendio' && typeof window.compGetSidebarItems === 'function') return window.compGetSidebarItems();
    if (page === 'laboratorio') return DESKTOP_LAB_CHILDREN;
    if (page === 'compendio') return DESKTOP_COMP_CHILDREN;
    return [];
}

function _bookmarksStorageKey() {
    const uid = AppState?.currentUser?.uid || 'local';
    return `companion_bookmarks_v${BOOKMARKS_VERSION}_${uid}`;
}

function _bookmarksActiveKey() {
    const uid = AppState?.currentUser?.uid || 'local';
    return `companion_bookmarks_active_v${BOOKMARKS_VERSION}_${uid}`;
}

function _bookmarksActiveRightKey() {
    const uid = AppState?.currentUser?.uid || 'local';
    return `companion_bookmarks_active_right_v${BOOKMARKS_VERSION}_${uid}`;
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

function _bookmarkCurrentPane() {
    return _bookmarkIsSplitPaneInstance ? 'right' : 'left';
}

function _bookmarkItemPane(item) {
    return item?.pane || 'left';
}

function _bookmarkIsAutoDesktopTab(item) {
    return item?.autoDesktop === true;
}

function _bookmarkShouldShowInPane(item) {
    if (_bookmarkIsDesktopLayout() || _bookmarkIsSplitPaneInstance) return true;
    return item?.userCreated === true && !_bookmarkIsAutoDesktopTab(item);
}

function _bookmarkPaneItems(list = _bookmarksRead(), pane = _bookmarkCurrentPane()) {
    return list
        .filter(item => _bookmarkItemPane(item) === pane)
        .filter(_bookmarkShouldShowInPane);
}

function _bookmarkRawPaneItems(list = _bookmarksRead(), pane = _bookmarkCurrentPane()) {
    return list.filter(item => _bookmarkItemPane(item) === pane);
}

function _bookmarkRemovePaneItems(pane) {
    const kept = _bookmarksRead().filter(item => _bookmarkItemPane(item) !== pane);
    _bookmarksWrite(kept);
    return kept;
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
    const title = active?.querySelector('.page-top-stack .page-header h1, .page-header h1, .combat-round-center')?.textContent;
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

function _bookmarkCurrentPoint(page, section) {
    const clean = _bookmarkCleanText(section);
    if (!clean) return _bookmarkSectionFallback(page);
    const parts = clean.split('>').map(part => part.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : clean;
}

function _bookmarkCurrentSnapshot(existingId = null) {
    const page = AppState.currentPage || 'campagne';
    const hook = typeof window.getPageBookmarkState === 'function'
        ? (window.getPageBookmarkState(page) || {})
        : {};
    const title = hook.title || _bookmarkTitleFallback(page);
    const section = _bookmarkCurrentPoint(page, hook.section || _bookmarkSectionFallback(page));
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
        id: existingId || `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        pane: _bookmarkCurrentPane(),
        fingerprint,
        title,
        section,
        page,
        state,
        createdAt: _bookmarkNow(),
        updatedAt: _bookmarkNow(),
    };
}

function _bookmarkEscape(value) {
    return typeof escapeHtml === 'function' ? escapeHtml(value) : String(value || '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

function _bookmarkGetActiveId() {
    if (_bookmarkIsSplitPaneInstance) {
        return _bookmarkSplitLocalActiveId || localStorage.getItem(_bookmarksActiveRightKey()) || '';
    }
    return localStorage.getItem(_bookmarksActiveKey()) || '';
}

function _bookmarkSetActiveId(id) {
    if (_bookmarkIsSplitPaneInstance) {
        _bookmarkSplitLocalActiveId = id || '';
        if (id) localStorage.setItem(_bookmarksActiveRightKey(), id);
        else localStorage.removeItem(_bookmarksActiveRightKey());
        return;
    }
    if (id) localStorage.setItem(_bookmarksActiveKey(), id);
    else localStorage.removeItem(_bookmarksActiveKey());
}

function _bookmarkGetActive(list = _bookmarksRead()) {
    const id = _bookmarkGetActiveId();
    return id ? list.find(item => item.id === id) || null : null;
}

function _bookmarkIsWritablePage() {
    const active = _bookmarkActivePageEl();
    return !!active;
}

function _bookmarkIsDesktopLayout() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;
}

function _bookmarkSplitFrameWindow() {
    return document.getElementById('desktopSplitPaneFrame')?.contentWindow || null;
}

function _bookmarkSetFocusedPane(pane, options = {}) {
    const { render = true, deferRender = false, notify = true } = options;
    if (_bookmarkIsSplitPaneInstance) return;
    _bookmarkFocusedPane = pane === 'right' ? 'right' : 'left';
    document.body.classList.toggle('desktop-split-focus-right', _bookmarkFocusedPane === 'right');
    document.body.classList.toggle('desktop-split-focus-left', _bookmarkFocusedPane !== 'right');
    if (notify) {
        _bookmarkSplitFrameWindow()?.postMessage({
            type: 'companion-pane-focus',
            pane: _bookmarkFocusedPane,
        }, window.location.origin);
    }
    if (deferRender) setTimeout(renderDesktopBookmarkTabs, 0);
    else if (render) renderDesktopBookmarkTabs();
}

function _bookmarkFocusCurrentPane(options = {}) {
    if (_bookmarkIsSplitPaneInstance) {
        document.body.classList.add('split-pane-focused');
        _bookmarkPostCurrentPaneState();
        if (options.deferRender) setTimeout(renderDesktopBookmarkTabs, 0);
        else if (options.render !== false) renderDesktopBookmarkTabs();
        return;
    }
    _bookmarkSetFocusedPane('left', options);
}

function _bookmarkIsCurrentPaneFocused() {
    if (_bookmarkIsSplitPaneInstance) return document.body.classList.contains('split-pane-focused');
    return _bookmarkFocusedPane !== 'right';
}

function _bookmarkEnsureMinimumDesktopTab() {
    if (_bookmarkIsSplitPaneInstance || !_bookmarkIsDesktopLayout() || !_bookmarkIsWritablePage()) return null;
    const list = _bookmarksRead();
    const paneList = _bookmarkPaneItems(list, 'left');
    if (paneList.length) {
        if (!_bookmarkGetActiveId() || !paneList.some(item => item.id === _bookmarkGetActiveId())) {
            _bookmarkSetActiveId(paneList[0].id);
        }
        return paneList;
    }
    const snap = _bookmarkCurrentSnapshot();
    snap.autoDesktop = true;
    _bookmarksWrite([snap, ...list]);
    _bookmarkSetActiveId(snap.id);
    return [snap];
}

function _bookmarkDefaultGroupTab(page) {
    const items = _desktopGroupChildren(page);
    return items.find(item => item?.key)?.key || (page === 'laboratorio' ? 'razze' : 'classi');
}

function _bookmarkNormalizeDesktopHook(page, hook = {}) {
    if (!_bookmarkIsDesktopLayout() || !['laboratorio', 'compendio'].includes(page)) return hook || {};
    const data = { ...(hook || {}) };
    if (data.view !== 'sub') {
        data.view = 'sub';
    }
    data.tab = data.tab || _bookmarkDefaultGroupTab(page);
    if (page === 'compendio' && data.tab === 'oggetti') {
        data.tabState = { ...(data.tabState || {}) };
        data.tabState.equipmentSection = data.tabState.equipmentSection || 'armi';
    }
    return data;
}

function getDesktopDefaultGroupTab(page) {
    if (_bookmarkIsSplitPaneInstance || !_bookmarkIsDesktopLayout()) return '';
    if (!['laboratorio', 'compendio'].includes(page)) return '';
    return _bookmarkDefaultGroupTab(page);
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

function _bookmarkIconSvg(filled = false) {
    return filled
        ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V22l-6-3.5L6 22V3.5Z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V22l-6-3.5L6 22V3.5Z"/></svg>`;
}

function _bookmarkEnsureHeaderButton() {
    const active = _bookmarkActivePageEl();
    if (!active) return null;
    const header = active.querySelector('.page-top-stack .page-header, .page-header, .combat-header');
    if (!header) return null;
    header.querySelector('.page-header-bookmark')?.remove();
    header.classList.remove('page-header-has-bookmark');
    return null;
}

function updateBookmarkChrome() {
    _bookmarkEnsureHeaderButton();
    if (_bookmarkIsSplitPaneInstance) {
        renderDesktopBookmarkTabs();
        return;
    }
    const list = _bookmarkEnsureMinimumDesktopTab() || _bookmarkPaneItems(_bookmarksRead(), 'left');
    const activeId = _bookmarkGetActiveId();
    const activeIndex = list.findIndex(item => item.id === activeId);
    const positionLabel = list.length ? `${Math.max(activeIndex + 1, 1)}/${list.length}` : '0';
    document.body.classList.toggle('bookmarks-over-scheda-tabs', AppState.currentPage === 'scheda');

    const fab = document.getElementById('bookmarksFab');
    const count = document.getElementById('bookmarksFabCount');
    const tabsBtn = document.getElementById('bookmarksTabsFab');
    if (fab) fab.style.display = 'inline-flex';
    if (tabsBtn) tabsBtn.style.display = list.length ? 'inline-flex' : 'none';
    if (count) count.textContent = positionLabel;

    renderBookmarksSheet();
    renderDesktopBookmarkTabs();
    updateDesktopSidebarActive();
}

function captureActiveBookmark({ silent = true } = {}) {
    if (_bookmarkRestoreInProgress || !_bookmarkIsWritablePage()) return;
    const activeId = _bookmarkGetActiveId();
    if (!activeId) return;

    const list = _bookmarksRead();
    const idx = list.findIndex(item => item.id === activeId);
    if (idx < 0) {
        _bookmarkSetActiveId('');
        updateBookmarkChrome();
        return;
    }

    const old = list[idx];
    const snap = _bookmarkCurrentSnapshot(old.id);
    list[idx] = {
        ...old,
        ...snap,
        id: old.id,
        pane: _bookmarkItemPane(old),
        autoDesktop: old.autoDesktop === true,
        userCreated: old.userCreated === true,
        createdAt: old.createdAt,
        updatedAt: _bookmarkNow(),
    };
    _bookmarksWrite(list);
    if (!silent) showNotification?.('Scheda aggiornata');
    updateBookmarkChrome();
}

function scheduleActiveBookmarkCapture(delay = 160) {
    clearTimeout(_bookmarkAutoUpdateTimer);
    _bookmarkAutoUpdateTimer = setTimeout(() => captureActiveBookmark({ silent: true }), delay);
}

function _bookmarkRemoveSplitPaneShell() {
    document.getElementById('desktopSplitPane')?.remove();
    localStorage.removeItem(_bookmarksActiveRightKey());
    _bookmarkRightPaneState = { page: '', tab: '' };
    document.body.classList.remove('desktop-split-active');
}

function _bookmarkHandleEmptyPane(sourcePane, list = _bookmarksRead()) {
    if (!sourcePane) return false;
    if (_bookmarkIsSplitPaneInstance) {
        if (!_bookmarkRawPaneItems(list, sourcePane).length) {
            window.parent?.postMessage({ type: 'companion-bookmark-pane-empty', pane: sourcePane }, window.location.origin);
        }
        return false;
    }

    const splitOpen = !!document.getElementById('desktopSplitPane');
    if (!splitOpen) return false;

    const leftItems = _bookmarkRawPaneItems(list, 'left');
    const rightItems = _bookmarkRawPaneItems(list, 'right');
    if (sourcePane === 'right' && !rightItems.length) {
        closeBookmarkSplitPane();
        return true;
    }
    if (sourcePane === 'left' && !leftItems.length && rightItems.length) {
        const activeRightId = localStorage.getItem(_bookmarksActiveRightKey()) || rightItems[0].id;
        _bookmarksWrite(list.map(item => _bookmarkItemPane(item) === 'right' ? { ...item, pane: 'left' } : item));
        _bookmarkSetActiveId(activeRightId);
        _bookmarkRemoveSplitPaneShell();
        _bookmarkSetFocusedPane('left');
        setTimeout(() => openBookmark(activeRightId), 0);
        return true;
    }
    return false;
}

function createBookmarkTab() {
    _bookmarkFocusCurrentPane();
    captureActiveBookmark({ silent: true });
    const snap = _bookmarkCurrentSnapshot();
    delete snap.autoDesktop;
    snap.userCreated = true;
    const list = _bookmarksRead().filter(item => item.id !== snap.id);
    list.unshift(snap);
    _bookmarksWrite(list);
    _bookmarkSetActiveId(snap.id);
    showNotification?.('Scheda creata');
    updateBookmarkChrome();
}

function removeBookmark(id) {
    const oldList = _bookmarksRead();
    const removed = oldList.find(item => item.id === id);
    const removedPane = removed ? _bookmarkItemPane(removed) : '';
    const wasActive = _bookmarkGetActiveId() === id;
    const list = oldList.filter(item => item.id !== id);
    _bookmarksWrite(list);
    if (wasActive) {
        const nextId = _bookmarkPaneItems(list)[0]?.id || '';
        _bookmarkSetActiveId(nextId);
        if (nextId) {
            setTimeout(() => openBookmark(nextId), 0);
            return;
        }
    }
    if (_bookmarkHandleEmptyPane(removedPane, list)) return;
    updateBookmarkChrome();
}

async function openBookmark(id) {
    const item = _bookmarksRead().find(b => b.id === id);
    if (!item) return;
    _bookmarkFocusCurrentPane();
    captureActiveBookmark({ silent: true });
    closeBookmarksSheet();
    _bookmarkRestoreInProgress = true;
    _bookmarkSetActiveId(id);

    const st = item.state || {};
    window.setAppNavigationState({
        campagnaId: st.campagnaId || null,
        sessioneId: st.sessioneId || null,
        personaggioId: st.personaggioId || null
    }, 'bookmark');

    const targetPage = st.page || item.page || 'campagne';
    const targetHook = _bookmarkNormalizeDesktopHook(targetPage, st.hook || {});

    await navigateToPage(targetPage);
    if (_bookmarkIsSplitPaneInstance) setTimeout(_bookmarkPostCurrentPaneState, 90);

    const restore = async () => {
        try {
            if (typeof window.restorePageBookmarkState === 'function') {
                await window.restorePageBookmarkState(targetPage, targetHook, item);
            }
            setTimeout(() => {
                _bookmarkSetMainScrollTop(st.scrollTop);
                _bookmarkRestoreInProgress = false;
                _bookmarkPostCurrentPaneState();
                setTimeout(() => captureActiveBookmark({ silent: true }), 90);
            }, 160);
        } catch (error) {
            console.error('Errore ripristino scheda:', error);
            _bookmarkRestoreInProgress = false;
            updateBookmarkChrome();
        }
    };
    setTimeout(restore, 80);
    updateBookmarkChrome();
}

function _bookmarkSplitIconSvg() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="7" height="16" rx="1.5"></rect><rect x="14" y="4" width="7" height="16" rx="1.5"></rect></svg>`;
}

function openActiveBookmarkSplitPane() {
    const list = _bookmarkEnsureMinimumDesktopTab() || _bookmarksRead();
    let id = _bookmarkGetActiveId();
    if (!id && list[0]) {
        id = list[0].id;
        _bookmarkSetActiveId(id);
    }
    if (id) openBookmarkSplitPane(id);
}

function _bookmarkEnsureSplitPane() {
    let pane = document.getElementById('desktopSplitPane');
    if (pane) return pane;
    pane = document.createElement('aside');
    pane.id = 'desktopSplitPane';
    pane.className = 'desktop-split-pane';
    pane.innerHTML = `
        <div class="desktop-split-pane-head">
            <span id="desktopSplitPaneTitle">Scheda affiancata</span>
            <button type="button" class="desktop-split-pane-close" onclick="closeBookmarkSplitPane()" aria-label="Chiudi scheda affiancata">&times;</button>
        </div>
        <iframe id="desktopSplitPaneFrame" title="Scheda affiancata" src="index.html?splitPane=1" scrolling="no"></iframe>
    `;
    document.body.appendChild(pane);
    document.body.classList.add('desktop-split-active');
    return pane;
}

function openBookmarkSplitPane(id) {
    const item = _bookmarksRead().find(tab => tab.id === id);
    if (!item) return;
    captureActiveBookmark({ silent: true });
    if (!document.getElementById('desktopSplitPane')) {
        _bookmarkRemovePaneItems('right');
    }
    const splitTab = {
        ...item,
        id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        pane: 'right',
        createdAt: _bookmarkNow(),
        updatedAt: _bookmarkNow(),
    };
    _bookmarksWrite([splitTab, ..._bookmarksRead()]);
    localStorage.setItem(_bookmarksActiveRightKey(), splitTab.id);
    const pane = _bookmarkEnsureSplitPane();
    const title = pane.querySelector('#desktopSplitPaneTitle');
    if (title) title.textContent = item.title || 'Scheda affiancata';
    const frame = pane.querySelector('#desktopSplitPaneFrame');
    const postOpen = () => frame.contentWindow?.postMessage({ type: 'companion-open-bookmark', bookmarkId: splitTab.id }, window.location.origin);
    frame.addEventListener('load', postOpen, { once: true });
    setTimeout(postOpen, 220);
    _bookmarkRightPaneState = {
        page: splitTab.state?.page || splitTab.page || '',
        tab: splitTab.state?.hook?.tab || '',
    };
    _bookmarkSetFocusedPane('right');
}

function closeBookmarkSplitPane() {
    document.getElementById('desktopSplitPane')?.remove();
    _bookmarkRemovePaneItems('right');
    localStorage.removeItem(_bookmarksActiveRightKey());
    _bookmarkRightPaneState = { page: '', tab: '' };
    document.body.classList.remove('desktop-split-active');
    _bookmarkSetFocusedPane('left');
}

function _bookmarkRestorePersistedSplitPane() {
    if (_bookmarkIsSplitPaneInstance || !_bookmarkIsDesktopLayout()) return;
    if (document.getElementById('desktopSplitPane')) return;
    const rightItems = _bookmarkPaneItems(_bookmarksRead(), 'right');
    if (!rightItems.length) {
        localStorage.removeItem(_bookmarksActiveRightKey());
        return;
    }
    let activeId = localStorage.getItem(_bookmarksActiveRightKey()) || '';
    if (!rightItems.some(item => item.id === activeId)) {
        activeId = rightItems[0].id;
        localStorage.setItem(_bookmarksActiveRightKey(), activeId);
    }
    const active = rightItems.find(item => item.id === activeId) || rightItems[0];
    const pane = _bookmarkEnsureSplitPane();
    const title = pane.querySelector('#desktopSplitPaneTitle');
    if (title) title.textContent = active.title || 'Scheda affiancata';
    _bookmarkRightPaneState = {
        page: active.state?.page || active.page || '',
        tab: active.state?.hook?.tab || '',
    };
    const frame = pane.querySelector('#desktopSplitPaneFrame');
    const postOpen = () => frame.contentWindow?.postMessage({ type: 'companion-open-bookmark', bookmarkId: active.id }, window.location.origin);
    frame.addEventListener('load', postOpen, { once: true });
    setTimeout(postOpen, 260);
    _bookmarkSetFocusedPane('left');
}

function restoreInitialDesktopBookmark() {
    if (_bookmarkIsSplitPaneInstance || !_bookmarkIsDesktopLayout()) return;
    const active = _bookmarkGetActive(_bookmarksRead());
    if (active) {
        setTimeout(() => openBookmark(active.id), 40);
    } else if (['laboratorio', 'compendio'].includes(AppState.currentPage)) {
        const tab = _bookmarkDefaultGroupTab(AppState.currentPage);
        setTimeout(() => _openDesktopSidebarTarget(AppState.currentPage, tab), 40);
    }
    setTimeout(_bookmarkRestorePersistedSplitPane, 280);
}

function renderBookmarksSheet() {
    const list = _bookmarkPaneItems();
    const body = document.getElementById('bookmarksSheetList');
    if (!body) return;
    const activeId = _bookmarkGetActiveId();
    if (!list.length) {
        body.innerHTML = '<div class="bookmarks-empty">Nessuna scheda aperta.</div>';
        return;
    }
    body.innerHTML = list.map((item, index) => `
        <div class="bookmark-row ${item.id === activeId ? 'active' : ''}" role="button" tabindex="0" onclick="openBookmark('${item.id}')">
            <div class="bookmark-row-index">${index + 1}</div>
            <div class="bookmark-row-main">
                <div class="bookmark-row-title">${_bookmarkEscape(item.title)}</div>
                <div class="bookmark-row-section">${_bookmarkEscape(item.section || item.page)}</div>
            </div>
            <button type="button" class="bookmark-row-remove" aria-label="Chiudi scheda" onclick="event.stopPropagation(); removeBookmark('${item.id}')">&times;</button>
        </div>
    `).join('');
}

function openBookmarksSheet() {
    captureActiveBookmark({ silent: true });
    renderBookmarksSheet();
    document.getElementById('bookmarksSheetOverlay')?.classList.add('active');
}

function closeBookmarksSheet() {
    document.getElementById('bookmarksSheetOverlay')?.classList.remove('active');
}

function _bookmarkBindSheetDrag(overlay) {
    const sheet = overlay.querySelector('.bookmarks-sheet');
    if (!sheet || sheet._bookmarkDragBound) return;
    sheet._bookmarkDragBound = true;

    let startY = 0;
    let currentY = 0;
    let dragging = false;

    const begin = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        startY = event.clientY;
        currentY = 0;
        dragging = true;
        sheet.classList.add('dragging');
        sheet.setPointerCapture?.(event.pointerId);
    };
    const move = (event) => {
        if (!dragging) return;
        currentY = Math.max(0, event.clientY - startY);
        if (currentY > 0) {
            sheet.style.transform = `translateY(${currentY}px)`;
        }
    };
    const end = (event) => {
        if (!dragging) return;
        dragging = false;
        sheet.releasePointerCapture?.(event.pointerId);
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
        if (currentY > 72) closeBookmarksSheet();
    };

    sheet.addEventListener('pointerdown', begin);
    sheet.addEventListener('pointermove', move);
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
}

function _desktopNavItems() {
    return [
        { type: 'link', page: 'campagne', label: 'Campagne', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
        { type: 'link', page: 'personaggi', label: 'Personaggi', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
        { type: 'group', page: 'laboratorio', label: 'Laboratorio', icon: '<span class="toolbar-icon toolbar-icon-laboratorio" aria-hidden="true"></span>', children: _desktopGroupChildren('laboratorio') },
        { type: 'group', page: 'compendio', label: 'Compendio', icon: '<span class="toolbar-icon toolbar-icon-compendio" aria-hidden="true"></span>', children: _desktopGroupChildren('compendio') },
    ];
}

function _desktopSidebarItemIcon(item) {
    if (item.icon) return item.icon;
    if (!item.iconFile) return '';
    const src = `images/Tabs/${String(item.iconFile).split('/').map(encodeURIComponent).join('/')}.svg`;
    return `<img class="desktop-sidebar-item-icon" src="${src}" alt="" loading="lazy">`;
}

function _desktopGroupOpen(page) {
    if (_desktopSidebarFocusedPage() === page) return true;
    return localStorage.getItem(_desktopGroupStorageKey(page)) === 'open';
}

function _desktopToggleGroup(page) {
    const isOpen = _desktopGroupOpen(page);
    localStorage.setItem(_desktopGroupStorageKey(page), isOpen ? 'closed' : 'open');
    renderDesktopSidebar();
}

function _desktopGroupStorageKey(page) {
    return `companion_sidebar_group_v2_${page}`;
}

function _desktopSidebarRootPage(page) {
    if (page === 'scheda' || page === 'personaggioCreate') return 'personaggi';
    return page || '';
}

function _desktopNestedGroupOpen(page, key, activeChild = '') {
    if (activeChild && (activeChild === key || activeChild.startsWith(`${key}:`))) return true;
    return localStorage.getItem(`${_desktopGroupStorageKey(page)}_${key}`) === 'open';
}

function _desktopToggleNestedGroup(page, key) {
    const storageKey = `${_desktopGroupStorageKey(page)}_${key}`;
    const isOpen = localStorage.getItem(storageKey) === 'open';
    localStorage.setItem(storageKey, isOpen ? 'closed' : 'open');
    renderDesktopSidebar();
}

function _bookmarkEnsureDesktopChrome() {
    if (!document.getElementById('desktopSidebarNav')) {
        const sidebar = document.createElement('aside');
        sidebar.id = 'desktopSidebarNav';
        sidebar.className = 'desktop-sidebar-nav';
        sidebar.setAttribute('aria-label', 'Navigazione principale');
        sidebar.addEventListener('click', (event) => {
            const toggle = event.target.closest('.desktop-sidebar-group-toggle');
            if (toggle) {
                _desktopToggleGroup(toggle.dataset.page);
                return;
            }
            const nestedToggle = event.target.closest('.desktop-sidebar-child-toggle');
            if (nestedToggle) {
                _desktopToggleNestedGroup(nestedToggle.dataset.page, nestedToggle.dataset.tab);
                return;
            }
            const btn = event.target.closest('.desktop-sidebar-btn, .desktop-sidebar-child');
            if (!btn) return;
            _routeDesktopSidebarTarget(btn.dataset.page, btn.dataset.tab || '');
        });
        document.body.appendChild(sidebar);
    }

    if (!document.getElementById('desktopBookmarkTabs')) {
        const rail = document.createElement('div');
        rail.id = 'desktopBookmarkTabs';
        rail.className = 'desktop-bookmark-tabs';
        rail.setAttribute('aria-label', 'Schede aperte');
        document.querySelector('.header')?.insertAdjacentElement('afterend', rail);
        _bookmarkBindTabRailWheel(rail);
        _bookmarkBindTabRailDnD(rail);
    }
    if (!window._bookmarkDesktopPaneFocusBound) {
        window._bookmarkDesktopPaneFocusBound = true;
        document.getElementById('mainContent')?.addEventListener('pointerdown', () => _bookmarkSetFocusedPane('left', { render: false }), true);
        document.getElementById('desktopBookmarkTabs')?.addEventListener('pointerdown', () => _bookmarkSetFocusedPane('left', { render: false }), true);
    }
    renderDesktopSidebar();
}

function _bookmarkEnsureSplitInstanceChrome() {
    if (document.getElementById('desktopBookmarkTabs')) return;
    const rail = document.createElement('div');
    rail.id = 'desktopBookmarkTabs';
    rail.className = 'desktop-bookmark-tabs desktop-bookmark-tabs-split';
    rail.setAttribute('aria-label', 'Schede aperte');
    const main = document.getElementById('mainContent');
    if (main) main.insertAdjacentElement('beforebegin', rail);
    else document.body.appendChild(rail);
    _bookmarkBindTabRailWheel(rail);
    _bookmarkBindTabRailDnD(rail);
}

function _bookmarkBindTabRailWheel(rail) {
    if (!rail || rail._bookmarkWheelBound) return;
    rail._bookmarkWheelBound = true;
    rail.addEventListener('wheel', (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        rail.scrollLeft += event.deltaY;
        event.preventDefault();
    }, { passive: false });
}

function _bookmarkNotifyTabsChanged(sourcePane = '', targetPane = '') {
    const message = { type: 'companion-bookmark-tabs-changed', sourcePane, targetPane };
    if (_bookmarkIsSplitPaneInstance) window.parent?.postMessage(message, window.location.origin);
    else _bookmarkSplitFrameWindow()?.postMessage(message, window.location.origin);
}

function _bookmarkMoveTab(id, targetPane, beforeId = '') {
    const list = _bookmarksRead();
    const fromIndex = list.findIndex(item => item.id === id);
    if (fromIndex < 0) return;

    const [item] = list.splice(fromIndex, 1);
    const sourcePane = _bookmarkItemPane(item);
    const moved = { ...item, pane: targetPane, updatedAt: _bookmarkNow() };
    let insertIndex = beforeId ? list.findIndex(tab => tab.id === beforeId) : -1;
    if (insertIndex < 0) {
        insertIndex = list.reduce((last, tab, index) => _bookmarkItemPane(tab) === targetPane ? index + 1 : last, 0);
    }
    list.splice(insertIndex, 0, moved);
    _bookmarksWrite(list);

    if (targetPane === _bookmarkCurrentPane()) {
        _bookmarkSetActiveId(id);
    } else if (_bookmarkGetActiveId() === id) {
        _bookmarkSetActiveId(_bookmarkPaneItems(list)[0]?.id || '');
    }
    _bookmarkNotifyTabsChanged(sourcePane, targetPane);
    if (_bookmarkHandleEmptyPane(sourcePane, list)) return;
    updateBookmarkChrome();
}

function _bookmarkBindTabRailDnD(rail) {
    if (!rail || rail._bookmarkDndBound) return;
    rail._bookmarkDndBound = true;
    rail.addEventListener('dragstart', (event) => {
        const tab = event.target.closest('.desktop-bookmark-tab');
        if (!tab?.dataset.bookmarkId) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/companion-bookmark-id', tab.dataset.bookmarkId);
        event.dataTransfer.setData('text/plain', tab.dataset.bookmarkId);
    });
    rail.addEventListener('dragover', (event) => {
        if (!event.dataTransfer.types.includes('text/companion-bookmark-id') && !event.dataTransfer.types.includes('text/plain')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    });
    rail.addEventListener('drop', (event) => {
        const id = event.dataTransfer.getData('text/companion-bookmark-id') || event.dataTransfer.getData('text/plain');
        if (!id) return;
        event.preventDefault();
        const beforeId = event.target.closest('.desktop-bookmark-tab')?.dataset.bookmarkId || '';
        _bookmarkMoveTab(id, _bookmarkCurrentPane(), beforeId === id ? '' : beforeId);
    });
}

function _bookmarkPostCurrentPaneState() {
    if (!_bookmarkIsSplitPaneInstance) return;
    window.parent?.postMessage({
        type: 'companion-split-focus',
        page: _desktopSidebarRootPage(AppState.currentPage || ''),
        tab: _desktopActiveChild(AppState.currentPage || ''),
    }, window.location.origin);
}

async function _openDesktopSidebarTarget(page, tab = '') {
    if (page === 'laboratorio') {
        await navigateToPage('laboratorio');
        if (tab) window.labOpenCategory?.(tab);
        return;
    }
    if (page === 'compendio') {
        await navigateToPage('compendio');
        const [targetTab, equipmentSection] = String(tab || '').split(':');
        if (targetTab) window.compendioOpenTab?.(targetTab);
        if (targetTab === 'oggetti') window.compendioOpenEquipmentSection?.(equipmentSection || 'armi');
        return;
    }
    await navigateToPage(page);
}

function _routeDesktopSidebarTarget(page, tab = '') {
    const frameWindow = _bookmarkSplitFrameWindow();
    if (_bookmarkFocusedPane === 'right' && frameWindow) {
        _bookmarkRightPaneState = { page, tab };
        updateDesktopSidebarActive();
        frameWindow.postMessage({
            type: 'companion-sidebar-target',
            page,
            tab,
        }, window.location.origin);
        return;
    }
    _bookmarkSetFocusedPane('left');
    _desktopPendingSidebarTarget = { page, tab };
    updateDesktopSidebarActive();
    captureActiveBookmark({ silent: true });
    _openDesktopSidebarTarget(page, tab).catch(error => {
        console.warn('[bookmarks] navigazione sidebar fallita:', error);
    }).finally(() => {
        _desktopPendingSidebarTarget = null;
        updateDesktopSidebarActive();
    });
}

function _desktopActiveChild(page) {
    if (_desktopPendingSidebarTarget?.page === page) return _desktopPendingSidebarTarget.tab || '';
    if (!_bookmarkIsSplitPaneInstance && _bookmarkFocusedPane === 'right') {
        return _bookmarkRightPaneState.page === page ? (_bookmarkRightPaneState.tab || '') : '';
    }
    if (page === 'laboratorio' && typeof window.labGetCurrentSidebarTab === 'function') {
        return window.labGetCurrentSidebarTab();
    }
    if (page === 'compendio' && typeof window.compGetCurrentSidebarTab === 'function') {
        return window.compGetCurrentSidebarTab();
    }
    return '';
}

function _desktopSidebarFocusedPage() {
    if (_desktopPendingSidebarTarget?.page) return _desktopSidebarRootPage(_desktopPendingSidebarTarget.page);
    const page = !_bookmarkIsSplitPaneInstance && _bookmarkFocusedPane === 'right'
        ? (_bookmarkRightPaneState.page || '')
        : AppState.currentPage;
    return _desktopSidebarRootPage(page);
}

function renderDesktopSidebar() {
    const sidebar = document.getElementById('desktopSidebarNav');
    if (!sidebar) return;
    const focusedPage = _desktopSidebarFocusedPage();
    const itemsHtml = _desktopNavItems().map(item => {
        if (item.type !== 'group') {
            return `
                <button type="button" class="desktop-sidebar-btn" data-page="${item.page}" aria-label="${item.label}">
                    ${_desktopSidebarItemIcon(item)}
                    <span>${_bookmarkEscape(item.label)}</span>
                </button>
            `;
        }
        const open = _desktopGroupOpen(item.page);
        const activeChild = _desktopActiveChild(item.page);
        return `
            <div class="desktop-sidebar-group ${open ? 'open' : ''}" data-page="${item.page}">
                <button type="button" class="desktop-sidebar-btn desktop-sidebar-group-toggle" data-page="${item.page}" aria-label="${item.label}" aria-expanded="${open ? 'true' : 'false'}">
                    ${_desktopSidebarItemIcon(item)}
                    <span>${_bookmarkEscape(item.label)}</span>
                    <span class="desktop-sidebar-caret">v</span>
                </button>
                <div class="desktop-sidebar-children">
                    ${(item.children || []).map(child => _desktopSidebarChildHtml(item.page, child, focusedPage, activeChild)).join('')}
                </div>
            </div>
        `;
    }).join('');
    sidebar.innerHTML = `<div class="desktop-sidebar-list">${itemsHtml}</div>`;
}

function _desktopSidebarChildHtml(page, child, focusedPage, activeChild) {
    const active = focusedPage === page && activeChild === child.key;
    if (Array.isArray(child.children) && child.children.length) {
        const nestedOpen = _desktopNestedGroupOpen(page, child.key, activeChild);
        const nestedActive = focusedPage === page && activeChild.startsWith(`${child.key}:`);
        return `
            <div class="desktop-sidebar-child-group ${nestedOpen ? 'open' : ''}">
                <button type="button" class="desktop-sidebar-child desktop-sidebar-child-toggle ${nestedActive ? 'active' : ''}" data-page="${page}" data-tab="${child.key}" title="${_bookmarkEscape(child.label)}">
                    ${_desktopSidebarItemIcon(child)}
                    <span>${_bookmarkEscape(child.label)}</span>
                    <span class="desktop-sidebar-caret">v</span>
                </button>
                <div class="desktop-sidebar-grandchildren">
                    ${child.children.map(grandchild => _desktopSidebarChildHtml(page, grandchild, focusedPage, activeChild)).join('')}
                </div>
            </div>
        `;
    }
    return `
        <button type="button" class="desktop-sidebar-child ${active ? 'active' : ''}" data-page="${page}" data-tab="${child.key}" title="${_bookmarkEscape(child.label)}">
            ${_desktopSidebarItemIcon(child)}
            <span>${_bookmarkEscape(child.label)}</span>
        </button>
    `;
}

function updateDesktopSidebarActive() {
    renderDesktopSidebar();
    const focusedPage = _desktopSidebarFocusedPage();
    document.querySelectorAll('.desktop-sidebar-btn').forEach(btn => {
        const isGroup = btn.classList.contains('desktop-sidebar-group-toggle');
        btn.classList.toggle('active', btn.dataset.page === focusedPage && !isGroup);
        btn.classList.toggle('group-active', btn.dataset.page === focusedPage && isGroup);
    });
}

function renderDesktopBookmarkTabs() {
    const rail = document.getElementById('desktopBookmarkTabs');
    if (!rail) return;
    const list = _bookmarkEnsureMinimumDesktopTab() || _bookmarkPaneItems();
    const activeId = _bookmarkGetActiveId();
    const paneFocused = _bookmarkIsCurrentPaneFocused();
    const splitOpen = !_bookmarkIsSplitPaneInstance && !!document.getElementById('desktopSplitPane');
    const tabsHtml = list.map(item => `
        <button type="button" draggable="true" data-bookmark-id="${item.id}" class="desktop-bookmark-tab ${paneFocused && item.id === activeId ? 'active' : ''}" onclick="openBookmark('${item.id}')" title="${_bookmarkEscape(item.title)}">
            <span class="desktop-bookmark-tab-title">${_bookmarkEscape(item.title)}</span>
            <span class="desktop-bookmark-tab-section">${_bookmarkEscape(item.section || item.page)}</span>
            <span type="button" class="desktop-bookmark-tab-close" aria-label="Chiudi scheda" onclick="event.stopPropagation(); removeBookmark('${item.id}')">&times;</span>
        </button>
    `).join('');
    rail.innerHTML = `${tabsHtml}
        <button type="button" class="desktop-bookmark-add-tab" onclick="createBookmarkTab()" aria-label="Crea nuova scheda" title="Crea nuova scheda">+</button>
        ${_bookmarkIsSplitPaneInstance || splitOpen ? '' : `<button type="button" class="desktop-bookmark-split-tab" onclick="openActiveBookmarkSplitPane()" aria-label="Dividi editor a destra" title="Dividi editor a destra">${_bookmarkSplitIconSvg()}</button>`}
    `;
}

function initBookmarks() {
    if (_bookmarkIsSplitPaneInstance) {
        document.body.classList.add('bookmark-split-instance');
        _bookmarkEnsureSplitInstanceChrome();
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'companion-open-bookmark' && event.data.bookmarkId) {
                openBookmark(event.data.bookmarkId);
            } else if (event.data?.type === 'companion-pane-focus') {
                document.body.classList.toggle('split-pane-focused', event.data.pane === 'right');
                renderDesktopBookmarkTabs();
            } else if (event.data?.type === 'companion-sidebar-target') {
                _bookmarkFocusCurrentPane();
                captureActiveBookmark({ silent: true });
                _openDesktopSidebarTarget(event.data.page, event.data.tab || '');
                setTimeout(_bookmarkPostCurrentPaneState, 80);
            } else if (event.data?.type === 'companion-bookmark-tabs-changed') {
                renderDesktopBookmarkTabs();
            }
        });
        document.addEventListener('pointerdown', () => _bookmarkFocusCurrentPane({ render: false }), true);
        document.addEventListener('focusin', () => _bookmarkFocusCurrentPane({ render: false }), true);
        updateBookmarkChrome();
        return;
    }
    if (!document.getElementById('bookmarksFab')) {
        const fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'bookmarksFab';
        fab.className = 'bookmarks-fab';
        fab.setAttribute('aria-label', 'Crea scheda');
        fab.innerHTML = _bookmarkIconSvg(false);
        fab.onclick = createBookmarkTab;
        document.body.appendChild(fab);
    }
    if (!document.getElementById('bookmarksTabsFab')) {
        const tabsFab = document.createElement('button');
        tabsFab.type = 'button';
        tabsFab.id = 'bookmarksTabsFab';
        tabsFab.className = 'bookmarks-tabs-fab';
        tabsFab.setAttribute('aria-label', 'Schede aperte');
        tabsFab.innerHTML = `<span id="bookmarksFabCount">0</span>`;
        tabsFab.onclick = openBookmarksSheet;
        document.body.appendChild(tabsFab);
    }
    if (!document.getElementById('bookmarksSheetOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'bookmarksSheetOverlay';
        overlay.className = 'bookmarks-sheet-overlay';
        overlay.onclick = (event) => {
            if (event.target === overlay) closeBookmarksSheet();
        };
        overlay.innerHTML = `
            <section class="bookmarks-sheet" aria-label="Schede aperte">
                <div class="bookmarks-sheet-handle"></div>
                <div class="bookmarks-sheet-head">
                    <h2>Schede aperte</h2>
                    <button type="button" class="bookmarks-sheet-close" onclick="closeBookmarksSheet()" aria-label="Chiudi">&times;</button>
                </div>
                <div id="bookmarksSheetList" class="bookmarks-sheet-list"></div>
            </section>
        `;
        document.body.appendChild(overlay);
        _bookmarkBindSheetDrag(overlay);
    } else {
        _bookmarkBindSheetDrag(document.getElementById('bookmarksSheetOverlay'));
    }
    _bookmarkEnsureDesktopChrome();
    _bookmarkSetFocusedPane('left');
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'companion-split-focus') {
            _bookmarkRightPaneState = {
                page: event.data.page || _bookmarkRightPaneState.page || '',
                tab: event.data.tab || '',
            };
            _bookmarkSetFocusedPane('right', { notify: false });
            updateDesktopSidebarActive();
        } else if (event.data?.type === 'companion-bookmark-pane-empty') {
            _bookmarkHandleEmptyPane(event.data.pane || 'right');
        } else if (event.data?.type === 'companion-bookmark-tabs-changed') {
            const list = _bookmarksRead();
            if (_bookmarkGetActiveId() && !list.some(item => item.id === _bookmarkGetActiveId() && _bookmarkItemPane(item) === 'left')) {
                _bookmarkSetActiveId(_bookmarkRawPaneItems(list, 'left')[0]?.id || '');
            }
            if (_bookmarkHandleEmptyPane(event.data.sourcePane || '', list)) return;
            updateBookmarkChrome();
        }
    });
    if (!window._bookmarksInteractionRefreshBound) {
        window._bookmarksInteractionRefreshBound = true;
        const schedule = () => {
            clearTimeout(_bookmarkRefreshTimer);
            _bookmarkRefreshTimer = setTimeout(() => {
                scheduleActiveBookmarkCapture(0);
                updateBookmarkChrome();
            }, 180);
        };
        document.addEventListener('click', schedule, true);
        document.addEventListener('input', schedule, true);
        document.getElementById('mainContent')?.addEventListener('scroll', () => scheduleActiveBookmarkCapture(280), { passive: true });
    }
    updateBookmarkChrome();
}

window.initBookmarks = initBookmarks;
window.updateBookmarkChrome = updateBookmarkChrome;
window.captureActiveBookmark = captureActiveBookmark;
window.scheduleActiveBookmarkCapture = scheduleActiveBookmarkCapture;
window.createBookmarkTab = createBookmarkTab;
window.openBookmark = openBookmark;
window.openBookmarkSplitPane = openBookmarkSplitPane;
window.openActiveBookmarkSplitPane = openActiveBookmarkSplitPane;
window.closeBookmarkSplitPane = closeBookmarkSplitPane;
window.removeBookmark = removeBookmark;
window.openBookmarksSheet = openBookmarksSheet;
window.closeBookmarksSheet = closeBookmarksSheet;
window.restoreInitialDesktopBookmark = restoreInitialDesktopBookmark;
window.getDesktopDefaultGroupTab = getDesktopDefaultGroupTab;
