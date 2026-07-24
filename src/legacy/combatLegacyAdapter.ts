type CombatLegacyWindow = Window & {
  sendAppEventBroadcast?: (change: Record<string, unknown>) => Promise<void>;
  showNotification?: (message: string) => void;
  openSchedaPersonaggio?: (personaggioId: string) => void;
};

const legacy = () => window as CombatLegacyWindow;

export const combatLegacyAdapter = {
  setNavigation(campagnaId: string, sessioneId: string) {
    window.setAppNavigationState?.({ page: 'combattimento', campagnaId, sessioneId }, 'react-combat');
  },
  broadcast(change: Record<string, unknown>) { return legacy().sendAppEventBroadcast?.(change); },
  notify(message: string) { legacy().showNotification?.(message); },
  openCharacter(personaggioId: string) { legacy().openSchedaPersonaggio?.(personaggioId); },
  confirm(message: string) { return window.confirm(message); },
};
