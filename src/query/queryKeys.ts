import type { Id } from '../types/domain';

export const queryKeys = {
  currentUser: () => ['currentUser'] as const,
  campaigns: (userId: Id) => ['campaigns', 'list', userId] as const,
  campaignInvites: (userId: Id) => ['campaigns', 'invites', userId] as const,
  campaign: (campagnaId: Id) => ['campaigns', 'detail', campagnaId] as const,
  campaignPlayers: (campagnaId: Id) => ['campaigns', 'detail', campagnaId, 'players'] as const,
  campaignCharacters: (campagnaId: Id) => ['campaigns', 'detail', campagnaId, 'characters'] as const,
  session: (campagnaId: Id) => ['campaigns', 'detail', campagnaId, 'session'] as const,
  combat: (sessioneId: Id) => ['combat', sessioneId] as const,
  combatMonsters: (sessioneId: Id) => ['combat', sessioneId, 'monsters'] as const,
  combatTimers: (sessioneId: Id) => ['combat', sessioneId, 'timers'] as const,
  initiativeRequests: (sessioneId: Id) => ['combat', sessioneId, 'initiativeRequests'] as const,
  genericRollRequests: (sessioneId: Id) => ['combat', sessioneId, 'genericRollRequests'] as const,
  character: (personaggioId: Id) => ['character', personaggioId] as const,
  characters: (userId: Id) => ['characters', userId] as const,
  friends: (userId: Id) => ['friends', userId] as const,
  homebrew: (userId: Id) => ['homebrew', userId] as const,
  runtimeData: (bundleKey: string) => ['runtimeData', bundleKey] as const,
};
