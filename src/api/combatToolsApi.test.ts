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

  it('normalizes a compendium monster into a combat monster', () => {
    const payload = combatMonsterPayload({
      nome: 'Arbusto Risvegliato',
      tipo: 'Pianta',
      taglia: 'Piccolo',
      classe_armatura: '9',
      punti_ferita: '10 (3d6)',
      velocita: '6 m',
      caratteristiche: {
        forza: { score: 3 },
        destrezza: { score: 8 },
        costituzione: { score: 11 },
        intelligenza: { score: 10 },
        saggezza: { score: 10 },
        carisma: { score: 6 },
      },
      tiri_salvezza_testo: 'DES +1, SAG +2',
      abilita_testo: 'Percezione +0 plus PB x 2',
      immunita_danni: ['fuoco'],
      tratti: '**Legendary Resistenza (3/Giorno).** Testo.',
      azioni: '**Ramo.** Attacco con arma.\n\n**Spinta.** Il bersaglio cade prono.\n\nIngrandire. Aumenta di una taglia.',
      azioni_leggendarie: 'Può effettuare 3 azioni leggendarie.\n\n**Coda.** Effettua un attacco.',
    }, 'campaign', 'session', 12);

    expect(payload).toMatchObject({
      forza: 3,
      destrezza: 8,
      punti_vita_max: 10,
      pv_attuali: 10,
      dadi_vita_num: 3,
      dado_vita: 6,
      classe_armatura: 9,
      velocita: 6,
      tiri_salvezza: ['destrezza', 'saggezza'],
      competenze_abilita: ['Percezione'],
      immunita: ['fuoco'],
      resistenze_leggendarie: 3,
      azioni_legg_max: 3,
      is_placeholder: false,
    });
    expect(payload.attacchi).toEqual([
      { nome: 'Ramo', descrizione: 'Attacco con arma.' },
      { nome: 'Spinta', descrizione: 'Il bersaglio cade prono.' },
      { nome: 'Ingrandire', descrizione: 'Aumenta di una taglia.' },
    ]);
    expect(payload.azioni_leggendarie).toEqual([{ nome: 'Coda', descrizione: 'Effettua un attacco.' }]);
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
