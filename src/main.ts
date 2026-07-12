declare global {
  interface Window {
    CompanionViteBootstrap?: {
      loadedAt: string;
    };
  }
}

window.CompanionViteBootstrap = {
  loadedAt: new Date().toISOString(),
};

export {};
