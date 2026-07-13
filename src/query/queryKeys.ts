import type { Id } from '../types/domain';

export const queryKeys = {
  currentUser: () => ['currentUser'] as const,
  campaigns: (userId: Id) => ['campaigns', userId] as const,
  campaignInvites: (userId: Id) => ['campaignInvites', userId] as const,
  campaign: (campagnaId: Id) => ['campaign', campagnaId] as const,
  session: (campagnaId: Id) => ['session', campagnaId] as const,
  combat: (sessioneId: Id) => ['combat', sessioneId] as const,
  character: (personaggioId: Id) => ['character', personaggioId] as const,
  homebrew: (userId: Id) => ['homebrew', userId] as const,
  runtimeData: (bundleKey: string) => ['runtimeData', bundleKey] as const,
};
