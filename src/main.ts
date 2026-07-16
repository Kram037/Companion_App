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

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
}

export {};
