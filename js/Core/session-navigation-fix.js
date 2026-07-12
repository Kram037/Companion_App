// ============================================================================
// SESSION NAVIGATION COMPATIBILITY FIX
// ============================================================================
// Temporary bridge while navigation is still legacy-driven. The realtime UX
// guard intentionally patches openSessionePage to avoid a double render and to
// rely on navigateToPage('sessione') as the single page-load entry point.
// Older navigation builds did not load the session page from _runPageLoad, so
// the page became active but remained empty. This wrapper restores the missing
// page-load behavior without changing the React migration layer.

(function registerSessionNavigationFix() {
    if (window.__sessionNavigationFixRegistered) return;
    window.__sessionNavigationFixRegistered = true;

    function installSessionNavigationFix() {
        if (window.__sessionNavigationFixInstalled) return;
        if (typeof window.navigateToPage !== 'function') {
            setTimeout(installSessionNavigationFix, 100);
            return;
        }

        const originalNavigateToPage = window.navigateToPage;
        if (originalNavigateToPage.__sessionNavigationFixWrapped) {
            window.__sessionNavigationFixInstalled = true;
            return;
        }

        const wrappedNavigateToPage = function sessionNavigationFixedNavigate(pageName, options = {}) {
            const result = originalNavigateToPage.apply(this, arguments);
            const shouldLoadSession = pageName === 'sessione'
                && !options?.skipPageLoad
                && window.AppState?.currentCampagnaId;

            if (!shouldLoadSession) return result;

            return Promise.resolve(result).then(async () => {
                if (typeof window.renderSessioneContent === 'function') {
                    await window.renderSessioneContent(window.AppState.currentCampagnaId);
                }
            });
        };

        wrappedNavigateToPage.__sessionNavigationFixWrapped = true;
        wrappedNavigateToPage.__sessionNavigationFixOriginal = originalNavigateToPage;
        window.navigateToPage = wrappedNavigateToPage;

        try {
            // In classic scripts the global function binding and window property
            // are usually linked. This assignment keeps both paths aligned.
            navigateToPage = wrappedNavigateToPage;
        } catch (_) {}

        window.__sessionNavigationFixInstalled = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installSessionNavigationFix, { once: true });
    } else {
        installSessionNavigationFix();
    }
})();
