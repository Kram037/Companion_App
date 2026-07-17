import { describe, expect, it } from 'vitest';

import { campaignSchema, characterSchema, combatMonsterSchema, userProfileSchema } from './domainSchemas';
import { parseData } from './parse';

describe('domain schemas', () => {
  it('strips unknown columns from stable campaign rows', () => {
    const campaign = parseData(campaignSchema, {
      id: 'c1',
      nome_campagna: 'Alba Rossa',
      id_dm: 'dm1',
      unknown_column: 'discarded',
    });

    expect(campaign).not.toHaveProperty('unknown_column');
  });

  it('keeps extension fields on the still-open character domain', () => {
    const character = parseData(characterSchema, {
      id: 'p1',
      nome: 'Nalia',
      inventario: [{ nome: 'Corda' }],
    });

    expect(character.livello).toBe(1);
    expect(character.classi).toBeUndefined();
    expect(character.inventario).toEqual([{ nome: 'Corda' }]);
  });

  it('normalizes the numeric CID returned by Supabase', () => {
    const user = parseData(userProfileSchema, { id: 'u1', cid: 1234 });

    expect(user.cid).toBe('1234');
  });

  it('rejects malformed combat monsters before they enter app state', () => {
    expect(() => parseData(combatMonsterSchema, { id: 'm1', nome: 123 })).toThrow();
  });
});
