declare global {
  interface Window {
    CompanionViteBootstrap?: {
      loadedAt: string;
      reactMounted?: boolean;
    };
  }
}

import { mountReactBridge } from './app';
import './app/react-page.css';

declare global {
  interface Window {
    CompanionReactPages?: Set<string>;
  }
}

window.CompanionReactPages = new Set(['campagne', 'dettagli', 'sessione', 'combattimento', 'personaggi']);

window.CompanionViteBootstrap = {
  loadedAt: new Date().toISOString(),
};

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
  window.CompanionViteBootstrap.reactMounted = true;
}

export {};
