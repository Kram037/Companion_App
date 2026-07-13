import { describe, expect, it } from 'vitest';

import { sortInitiativeOrder } from './initiativeOrder';

describe('initiative order', () => {
  it('sorts by initiative descending', () => {
    expect(sortInitiativeOrder([
      { id: 'slow', init: 8 },
      { id: 'fast', init: 18 },
    ]).map(entry => entry.id)).toEqual(['fast', 'slow']);
  });

  it('keeps same-initiative entries deterministic by insertion time then id', () => {
    expect(sortInitiativeOrder([
      { id: 'b', init: 12, tiebreak: '2026-01-01T10:00:01Z' },
      { id: 'c', init: 12, tiebreak: '2026-01-01T10:00:01Z' },
      { id: 'a', init: 12, tiebreak: '2026-01-01T10:00:00Z' },
    ]).map(entry => entry.id)).toEqual(['a', 'b', 'c']);
  });
});
