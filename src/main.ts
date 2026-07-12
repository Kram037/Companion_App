declare global {
  interface Window {
    CompanionViteBootstrap?: {
      loadedAt: string;
      reactMounted?: boolean;
    };
  }
}

import { mountReactBridge } from './app';

window.CompanionViteBootstrap = {
  loadedAt: new Date().toISOString(),
};

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  mountReactBridge(reactRoot);
  window.CompanionViteBootstrap.reactMounted = true;
}

export {};
