import { describe, expect, it } from 'vitest';

import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('builds stable keys for scoped server state', () => {
    expect(queryKeys.currentUser()).toEqual(['currentUser']);
    expect(queryKeys.campaigns('user-1')).toEqual(['campaigns', 'list', 'user-1']);
    expect(queryKeys.campaignPlayers('campaign-1')).toEqual(['campaigns', 'detail', 'campaign-1', 'players']);
    expect(queryKeys.campaignCharacters('campaign-1')).toEqual(['campaigns', 'detail', 'campaign-1', 'characters']);
    expect(queryKeys.session('campaign-1')).toEqual(['campaigns', 'detail', 'campaign-1', 'session']);
    expect(queryKeys.combat('session-1')).toEqual(['combat', 'session-1']);
    expect(queryKeys.combatMonsters('session-1')).toEqual(['combat', 'session-1', 'monsters']);
    expect(queryKeys.combatTimers('session-1')).toEqual(['combat', 'session-1', 'timers']);
    expect(queryKeys.initiativeRequests('session-1')).toEqual(['combat', 'session-1', 'initiativeRequests']);
    expect(queryKeys.genericRollRequests('session-1')).toEqual(['combat', 'session-1', 'genericRollRequests']);
    expect(queryKeys.characters('user-1')).toEqual(['characters', 'user-1']);
    expect(queryKeys.friends('user-1')).toEqual(['friends', 'user-1']);
    expect(queryKeys.runtimeData('spells')).toEqual(['runtimeData', 'spells']);
  });
});
