import type { Id, JsonValue, UserProfile } from './domain';

export interface LegacyAppState {
  currentUser: JsonValue | null;
  currentPage: string;
  isLoggedIn: boolean;
  isRegisterMode: boolean;
  currentCampagnaId: Id | null;
  currentSessioneId: Id | null;
  currentPersonaggioId: Id | null;
  cachedUserData: UserProfile | JsonValue | null;
  cachedRazze: JsonValue | null;
  cachedBackground: JsonValue | null;
  cachedHomebrewSottoclassi: JsonValue | null;
  cachedHomebrewOggetti: JsonValue | null;
}
