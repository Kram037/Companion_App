type LegacyResult = void | Promise<void>;

type CombatLegacyWindow = Window & {
  ensureRuntimeScript?: (key: string) => Promise<void>;
  sendAppEventBroadcast?: (change: Record<string, unknown>) => Promise<void>;
  showNotification?: (message: string) => void;
  setCombatInitiativeOrder?: (order: unknown[]) => void;
  combatOpenMonsterFullSheet?: (monsterId: string, campagnaId: string, sessioneId: string) => LegacyResult;
  openMonsterCreationModal?: (campagnaId: string, sessioneId: string) => LegacyResult;
  combatDiceRoll?: () => LegacyResult;
  combatCalcOpen?: () => LegacyResult;
  combatOpenTimerDialog?: (campagnaId: string, sessioneId: string, mode: 'dm' | 'player', personaggioId: string | null) => LegacyResult;
  renderCombatTimers?: (sessioneId: string, isDm: boolean, personaggioId: string | null) => LegacyResult;
};

const legacy = () => window as CombatLegacyWindow;

export const combatLegacyAdapter = {
  async prepare() {
    const load = legacy().ensureRuntimeScript;
    if (!load) return false;
    await load('combattimento');
    return true;
  },
  setNavigation(campagnaId: string, sessioneId: string) {
    window.setAppNavigationState?.({ page: 'combattimento', campagnaId, sessioneId }, 'react-combat');
  },
  broadcast(change: Record<string, unknown>) { return legacy().sendAppEventBroadcast?.(change); },
  notify(message: string) { legacy().showNotification?.(message); },
  setInitiativeOrder(order: unknown[]) { legacy().setCombatInitiativeOrder?.(order); },
  renderTimers(sessioneId: string, isDm: boolean, personaggioId: string | null) {
    return legacy().renderCombatTimers?.(sessioneId, isDm, personaggioId);
  },
  openMonster(monsterId: string, campagnaId: string, sessioneId: string) {
    return legacy().combatOpenMonsterFullSheet?.(monsterId, campagnaId, sessioneId);
  },
  addMonster(campagnaId: string, sessioneId: string) { return legacy().openMonsterCreationModal?.(campagnaId, sessioneId); },
  rollDice() { return legacy().combatDiceRoll?.(); },
  openCalculator() { return legacy().combatCalcOpen?.(); },
  openTimer(campagnaId: string, sessioneId: string, mode: 'dm' | 'player', personaggioId: string | null) {
    return legacy().combatOpenTimerDialog?.(campagnaId, sessioneId, mode, personaggioId);
  },
};
