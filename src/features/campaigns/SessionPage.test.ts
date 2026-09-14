import { describe, expect, it } from 'vitest';

import { campaignInspirationTotal } from './SessionPage';

describe('campaign inspiration total', () => {
  it('sums every non-negative player counter', () => {
    expect(campaignInspirationTotal([
      { ispirazione: 2 },
      { ispirazione: null },
      { ispirazione: 3 },
      { ispirazione: -1 },
    ])).toBe(5);
  });
});
