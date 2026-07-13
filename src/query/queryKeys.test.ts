import { describe, expect, it } from 'vitest';

import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('builds stable keys for scoped server state', () => {
    expect(queryKeys.currentUser()).toEqual(['currentUser']);
    expect(queryKeys.campaigns('user-1')).toEqual(['campaigns', 'user-1']);
    expect(queryKeys.campaignPlayers('campaign-1')).toEqual(['campaign', 'campaign-1', 'players']);
    expect(queryKeys.campaignCharacters('campaign-1')).toEqual(['campaign', 'campaign-1', 'characters']);
    expect(queryKeys.combat('session-1')).toEqual(['combat', 'session-1']);
    expect(queryKeys.runtimeData('spells')).toEqual(['runtimeData', 'spells']);
  });
});
