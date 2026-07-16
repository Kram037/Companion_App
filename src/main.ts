import { mountReactBridge } from './app';
import { initializeSupabaseClient } from './api/supabaseClient';
import { legacyNavigationFromLocation, type LegacyNavigationSnapshot } from './router';

declare global {
  interface Window {
    CompanionRouterBridge?: {
      legacyNavigationFromLocation?: typeof legacyNavigationFromLocation;
      navigateToLegacy?: (snapshot: LegacyNavigationSnapshot) => boolean;
    };
  }
}

window.CompanionRouterBridge = { legacyNavigationFromLocation };
initializeSupabaseClient();

const normalizedEntryPath = window.location.pathname.replace(/\/index\.html(?=\/|$)/, '') || '/';
if (normalizedEntryPath !== window.location.pathname) {
  window.history.replaceState(window.history.state, '', `${normalizedEntryPath}${window.location.search}${window.location.hash}`);
}

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
}

export {};
