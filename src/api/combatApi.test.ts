import { describe, expect, it } from 'vitest';

import { nextCombatTurnState } from './combatApi';

describe('nextCombatTurnState', () => {
  it('wraps to the next round after the last entry', () => {
    expect(nextCombatTurnState(3, 2, 2)).toEqual({ round: 3, turnIndex: 0 });
    expect(nextCombatTurnState(3, 2, 0)).toEqual({ round: 2, turnIndex: 1 });
  });
});
