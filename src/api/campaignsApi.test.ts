import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  throwIfSupabaseError: vi.fn(),
}));

import { toggleCampaignFavorite, updateCampaignInviteStatus } from './campaignsApi';

describe('campaignsApi mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toggles favorites from the persisted list and writes only that column', async () => {
    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { campagne_preferite: ['c1'] }, error: null }),
    };
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const from = vi.fn().mockReturnValueOnce(selectQuery).mockReturnValueOnce(updateQuery);
    mocks.getSupabaseClient.mockReturnValue({ from });

    await expect(toggleCampaignFavorite('u1', 'c2')).resolves.toEqual(['c1', 'c2']);
    expect(updateQuery.update).toHaveBeenCalledWith({ campagne_preferite: ['c1', 'c2'] });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('uses the protected invite RPC selected by the requested status', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mocks.getSupabaseClient.mockReturnValue({ rpc });

    await updateCampaignInviteStatus('i1', 'accepted');
    await updateCampaignInviteStatus('i2', 'rejected');

    expect(rpc).toHaveBeenNthCalledWith(1, 'accetta_invito_campagna', { p_invito_id: 'i1' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'rifiuta_invito_campagna', { p_invito_id: 'i2' });
  });
});
