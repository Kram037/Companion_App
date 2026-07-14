import type { Campagna, Id, JsonValue, UserProfile } from './domain';

export interface CampagneFilters {
  searchText: string;
  tipologia: string | string[];
  dm: string | string[];
  soloPreferiti: boolean;
}

export interface LegacyAppState {
  currentUser: JsonValue | null;
  currentPage: string;
  isLoggedIn: boolean;
  isRegisterMode: boolean;
  currentCampagnaId: Id | null;
  currentSessioneId: Id | null;
  currentPersonaggioId: Id | null;
  cachedUserData: UserProfile | JsonValue | null;
  cachedCampagne: Campagna[] | null;
  cachedRazze: JsonValue | null;
  cachedBackground: JsonValue | null;
  cachedHomebrewSottoclassi: JsonValue | null;
  cachedHomebrewOggetti: JsonValue | null;
  campagneFilters: CampagneFilters;
}
