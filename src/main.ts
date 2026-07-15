import { mountReactBridge } from './app';
import { initializeSupabaseClient } from './api/supabaseClient';
import { legacyNavigationFromLocation } from './router';
import './app/react-page.css';

declare global {
  interface Window {
    CompanionRouterBridge?: { legacyNavigationFromLocation: typeof legacyNavigationFromLocation };
  }
}

window.CompanionRouterBridge = { legacyNavigationFromLocation };
initializeSupabaseClient();

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
}

export {};
