import { describe, expect, it } from 'vitest';

import {
  combatMonsterPayload,
  createCombatTimer,
  createPlaceholderMonster,
  nextCombatMonsterCopyName,
  updateCombatMonster,
} from './combatToolsApi';

describe('combat tools validation', () => {
  it('numbers monster copies without renaming the source', () => {
    expect(nextCombatMonsterCopyName('Goblin', ['Goblin'])).toBe('Goblin #2');
    expect(nextCombatMonsterCopyName('Goblin #2', ['Goblin', 'Goblin #2', 'Goblin #4'])).toBe('Goblin #5');
    expect(nextCombatMonsterCopyName('Orco', ['Goblin', 'Goblin #2'])).toBe('Orco #1');
  });

  it('normalizes a homebrew snapshot into a combat monster', () => {
    const payload = combatMonsterPayload({
      nome: 'Drago',
      tipo: 'Drago',
      destrezza: '14',
      punti_vita_max: '120',
      resistenze_leggendarie: '3',
      attacchi: [{ nome: 'Morso' }, () => undefined],
    }, 'campaign', 'session', 17);

    expect(payload).toMatchObject({
      campagna_id: 'campaign',
      sessione_id: 'session',
      nome: 'Drago',
      tipologia: 'Drago',
      destrezza: 14,
      pv_attuali: 120,
      iniziativa: 17,
      res_legg_attuali: 3,
      is_placeholder: false,
    });
    expect(payload.attacchi).toEqual([{ nome: 'Morso' }]);
  });

  it('rejects invalid mutations before accessing Supabase', async () => {
    await expect(createPlaceholderMonster({
      campagnaId: 'campaign',
      sessioneId: 'session',
      nome: '',
      hpMax: 10,
      armorClass: 10,
    })).rejects.toThrow();

    await expect(updateCombatMonster('monster', {
      hp: 11,
      hpMax: 10,
      armorClass: 10,
      conditions: [],
    })).rejects.toThrow(/punti vita attuali/i);

    await expect(createCombatTimer({
      campagnaId: 'campaign',
      sessioneId: 'session',
      createdBy: 'user',
      nome: 'Veleno',
      targetKind: 'monster',
      targetId: null,
      targetName: null,
      conditions: ['avvelenato'],
      rounds: 3,
    })).rejects.toThrow(/target/i);
  });
});
