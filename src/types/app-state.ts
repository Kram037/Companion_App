import type { Id, JsonValue, UserProfile } from './domain';

export interface LegacyAppState {
  currentUser: JsonValue | null;
  currentPage: string;
  isLoggedIn: boolean;
  isRegisterMode: boolean;
  currentCampagnaId: Id | null;
  activeSessionCampagnaId: Id | null;
  currentSessioneId: Id | null;
  currentPersonaggioId: Id | null;
  cachedUserData: UserProfile | JsonValue | null;
  cachedRazze: JsonValue | null;
  cachedBackground: JsonValue | null;
  cachedHomebrewSottoclassi: JsonValue | null;
  cachedHomebrewOggetti: JsonValue | null;
  campagneFilters: {
    searchText: string;
    tipologia: string | string[];
    dm: string | string[];
    soloPreferiti: boolean;
  };
}

declare global {
  interface Window {
    AppState?: Partial<LegacyAppState>;
    getAppNavigationState?: () => LegacyNavigationState;
    setAppNavigationState?: (next: Partial<LegacyNavigationState>, source?: string) => LegacyNavigationState;
    navigateToPage?: (page: string, options?: { pushHistory?: boolean }) => unknown;
  }
}

export interface LegacyNavigationState {
  page: string;
  campagnaId: Id | null;
  sessioneId: Id | null;
  personaggioId: Id | null;
}
