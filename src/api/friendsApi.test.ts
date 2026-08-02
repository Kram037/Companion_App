import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  throwIfSupabaseError: vi.fn(),
}));

import {
  mapFriendProfileRow,
  mapIncomingFriendRequestRow,
  removeFriend,
  updateFriendRequest,
} from './friendsApi';

describe('friendsApi contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates and normalizes RPC rows', () => {
    expect(mapFriendProfileRow({ amico_id: 'u2', nome_utente: 'Lia', cid: 1234 })).toEqual({
      id: 'u2',
      name: 'Lia',
      cid: '1234',
    });
    expect(mapIncomingFriendRequestRow({
      richiesta_id: 'r1',
      richiedente_id: 'u2',
      nome_utente: 'Lia',
      cid: 1234,
    })).toEqual({
      id: 'r1',
      user: { id: 'u2', name: 'Lia', cid: '1234' },
    });
    expect(() => mapFriendProfileRow({ nome_utente: 'Senza ID' })).toThrow();
  });

  it('scopes friend request mutations to the intended row and relationship', async () => {
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ error: null }),
    };
    const from = vi.fn().mockReturnValueOnce(updateQuery).mockReturnValueOnce(deleteQuery);
    mocks.getSupabaseClient.mockReturnValue({ from });

    await updateFriendRequest('r1', 'accepted');
    await removeFriend('u1', 'u2');

    expect(updateQuery.update).toHaveBeenCalledWith({ stato: 'accepted' });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'r1');
    expect(deleteQuery.eq).toHaveBeenCalledWith('stato', 'accepted');
    expect(deleteQuery.or).toHaveBeenCalledWith(
      'and(richiedente_id.eq.u1,destinatario_id.eq.u2),and(richiedente_id.eq.u2,destinatario_id.eq.u1)',
    );
  });
});
