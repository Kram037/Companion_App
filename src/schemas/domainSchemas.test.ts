import { describe, expect, it } from 'vitest';

import { campaignSchema, characterSchema, combatMonsterSchema } from './domainSchemas';
import { parseData } from './parse';

describe('domain schemas', () => {
  it('keeps Supabase extra columns while validating campaigns', () => {
    const campaign = parseData(campaignSchema, {
      id: 'c1',
      nome_campagna: 'Alba Rossa',
      id_dm: 'dm1',
      unknown_column: 'kept',
    });

    expect(campaign.unknown_column).toBe('kept');
  });

  it('normalizes optional character fields from Supabase rows', () => {
    const character = parseData(characterSchema, {
      id: 'p1',
      nome: 'Nalia',
    });

    expect(character.livello).toBe(1);
    expect(character.classi).toBeUndefined();
  });

  it('rejects malformed combat monsters before they enter app state', () => {
    expect(() => parseData(combatMonsterSchema, { id: 'm1', nome: 123 })).toThrow();
  });
});
