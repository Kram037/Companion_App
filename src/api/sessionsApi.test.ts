import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  endCampaignSession,
  fetchLatestGenericRollGroup,
  requestGenericRolls,
  requestInitiativeRolls,
  startCampaignSession,
} from './sessionsApi';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  isMissingDatabaseColumn: vi.fn(() => false),
  throwIfSupabaseError: vi.fn(),
}));

describe('sessionsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the atomic session RPCs', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 's1', campagna_id: 'c1', data_inizio: '2026-07-24T12:00:00.000Z' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    mocks.getSupabaseClient.mockReturnValue({ rpc });

    await expect(startCampaignSession('c1')).resolves.toEqual(expect.objectContaining({ id: 's1', campagna_id: 'c1' }));
    await expect(endCampaignSession('s1')).resolves.toBeUndefined();
    expect(rpc).toHaveBeenNthCalledWith(1, 'start_campaign_session', { p_campagna_id: 'c1' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'finish_campaign_session', { p_sessione_id: 's1' });
  });

  it('loads only the latest generic-roll group and validates its rows', async () => {
    const latest = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'r1',
          sessione_id: 's1',
          richiesta_id: 'group2',
          giocatore_id: 'p1',
          valore: null,
          tipo_tiro: 'abilita',
          target_tiro: 'percezione',
          tiro_label: 'Percezione',
        },
        error: null,
      }),
    };
    const group = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'r1',
            sessione_id: 's1',
            richiesta_id: 'group2',
            giocatore_id: 'p1',
            valore: '18',
            stato: 'completed',
            tipo_tiro: 'abilita',
            target_tiro: 'percezione',
            tiro_label: 'Percezione',
          },
          {
            id: 'r2',
            sessione_id: 's1',
            richiesta_id: 'group2',
            giocatore_id: 'p2',
            valore: null,
            stato: 'pending',
            tipo_tiro: 'abilita',
            target_tiro: 'percezione',
            tiro_label: 'Percezione',
          },
        ],
        error: null,
      }),
    };
    mocks.getSupabaseClient.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(latest).mockReturnValueOnce(group),
    });

    await expect(fetchLatestGenericRollGroup('s1')).resolves.toEqual({
      richiestaId: 'group2',
      tipoTiro: 'abilita',
      targetTiro: 'percezione',
      tiroLabel: 'Percezione',
      risultati: [
        expect.objectContaining({ id: 'r1', valore: 18 }),
        expect.objectContaining({ id: 'r2', valore: null }),
      ],
    });
    expect(group.eq).toHaveBeenNthCalledWith(2, 'richiesta_id', 'group2');
  });

  it('creates generic rolls atomically with persisted metadata', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'group12345', error: null });
    mocks.getSupabaseClient.mockReturnValue({ rpc });

    const richiestaId = await requestGenericRolls('s1', ['p1', 'p2'], {
      tipoTiro: 'abilita',
      targetTiro: 'percezione',
      tiroLabel: 'Percezione',
    });

    expect(richiestaId).toBe('group12345');
    expect(rpc).toHaveBeenCalledWith('request_generic_rolls', {
      p_sessione_id: 's1',
      p_player_ids: ['p1', 'p2'],
      p_tipo_tiro: 'abilita',
      p_target_tiro: 'percezione',
      p_tiro_label: 'Percezione',
    });
  });

  it('replaces initiative requests atomically', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null });
    mocks.getSupabaseClient.mockReturnValue({ rpc });

    await expect(requestInitiativeRolls('s1', ['p1', 'p2'])).resolves.toBe(2);
    expect(rpc).toHaveBeenCalledWith('request_initiative_rolls', {
      p_sessione_id: 's1',
      p_player_ids: ['p1', 'p2'],
    });
  });
});
