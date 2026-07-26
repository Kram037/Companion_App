import { describe, expect, it } from 'vitest';

import { buildCombatOrder } from './CombatPage';
import { timerTargetLabel } from './CombatTools';

describe('combat order', () => {
  it('combines completed player rolls and monsters in initiative order', () => {
    const order = buildCombatOrder(
      [
        { giocatore_id: 'user-1', valore: 14, stato: 'completed' },
        { giocatore_id: 'pending', valore: null, stato: 'pending' },
      ],
      [{ id: 'monster-1', nome: 'Goblin', iniziativa: 17, pv_attuali: 4, punti_vita_max: 7 }],
      [{ id: 'character-1', nome: 'Aria', player_user_id: 'user-1', condizioni: ['prono'] }],
      [{
        id: 'timer-1',
        sessione_id: 'session-1',
        campagna_id: 'campaign-1',
        nome: 'Veleno',
        target_kind: 'player',
        target_id: 'character-1',
        conditions: ['avvelenato'],
        duration_rounds: 2,
        remaining_rounds: 2,
        expired: false,
      }],
    );

    expect(order.map(entry => entry.name)).toEqual(['Goblin', 'Aria']);
    expect(order[1]).toMatchObject({ pgId: 'character-1', conditions: ['prono', 'avvelenato'] });
  });
});

describe('combat timer target', () => {
  it('uses the current character name for old player timers without target_name', () => {
    expect(timerTargetLabel({
      id: 'timer-1',
      sessione_id: 'session-1',
      campagna_id: 'campaign-1',
      nome: 'Ira',
      target_kind: 'player',
      target_id: 'character-1',
      conditions: [],
      duration_rounds: 3,
      remaining_rounds: 2,
      expired: false,
    }, 'character-1', 'Aria')).toBe('Aria');
  });
});
