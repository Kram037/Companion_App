import { initializeSupabaseClient } from './api/supabaseClient';
import type { LegacyNavigationSnapshot } from './router';
import './app/react-page.css';

declare global {
  interface Window {
    CompanionRouterBridge?: {
      legacyNavigationFromLocation?: (pathname: string) => LegacyNavigationSnapshot | null;
      navigateToLegacy?: (snapshot: LegacyNavigationSnapshot) => boolean;
      ownsPage?: (pageName: string) => boolean;
    };
    CompanionRealtimeBridge?: { clientId: string };
  }
}

initializeSupabaseClient();

const reactOwnedPages = new Set(['campagne', 'dettagli', 'sessione', 'combattimento', 'amici']);
window.CompanionRouterBridge = {
  ...window.CompanionRouterBridge,
  ownsPage: pageName => reactOwnedPages.has(pageName),
};

const normalizedEntryPath = window.location.pathname.replace(/\/index\.html(?=\/|$)/, '') || '/';
if (normalizedEntryPath !== window.location.pathname) {
  window.history.replaceState(window.history.state, '', `${normalizedEntryPath}${window.location.search}${window.location.hash}`);
}

void Promise.all([import('./router'), import('./realtime')])
  .then(([router, realtime]) => {
    window.CompanionRouterBridge = {
      ...window.CompanionRouterBridge,
      legacyNavigationFromLocation: router.legacyNavigationFromLocation,
    };
    window.CompanionRealtimeBridge = { clientId: realtime.realtimeClientId };

    const reactRoot = document.getElementById('react-root');
    if (reactRoot) {
      void import('./app')
        .then(({ mountReactBridge }) => mountReactBridge(reactRoot))
        .catch(error => console.error('Errore avvio React bridge:', error));
    }
  })
  .catch(error => console.error('Errore avvio bridge React:', error));

export {};
