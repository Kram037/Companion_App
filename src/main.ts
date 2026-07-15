import { mountReactBridge } from './app';
import { initializeSupabaseClient } from './api/supabaseClient';
import { legacyNavigationFromLocation } from './router';
import './app/react-page.css';

declare global {
  interface Window {
    CompanionReactPages?: Set<string>;
    CompanionRouterBridge?: { legacyNavigationFromLocation: typeof legacyNavigationFromLocation };
  }
}

window.CompanionReactPages = new Set(['campagne', 'dettagli', 'sessione', 'combattimento', 'personaggi', 'scheda', 'compendio', 'laboratorio']);
window.CompanionRouterBridge = { legacyNavigationFromLocation };
initializeSupabaseClient();

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
}

export {};
