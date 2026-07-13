import { describe, expect, it } from 'vitest';

import { buildCombatOrder } from './CombatPage';

describe('combat order', () => {
  it('combines completed player rolls and monsters in initiative order', () => {
    const order = buildCombatOrder(
      [
        { giocatore_id: 'user-1', valore: 14, stato: 'completed' },
        { giocatore_id: 'pending', valore: null, stato: 'pending' },
      ],
      [{ id: 'monster-1', nome: 'Goblin', iniziativa: 17, pv_attuali: 4, punti_vita_max: 7 }],
      [{ id: 'character-1', nome: 'Aria', player_user_id: 'user-1', condizioni: ['prono'] }],
    );

    expect(order.map(entry => entry.name)).toEqual(['Goblin', 'Aria']);
    expect(order[1]).toMatchObject({ pgId: 'character-1', conditions: ['prono'] });
  });
});
