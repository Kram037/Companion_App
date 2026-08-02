import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  isMissingDatabaseColumn: vi.fn(() => false),
  throwIfSupabaseError: vi.fn(),
}));

import { deleteHomebrewItem } from './homebrewApi';

describe('homebrewApi mutations', () => {
  it('deletes one item from the explicitly selected homebrew table', async () => {
    const query = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const from = vi.fn(() => query);
    mocks.getSupabaseClient.mockReturnValue({ from });

    await expect(deleteHomebrewItem('homebrew_nemici', 'h1')).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledWith('homebrew_nemici');
    expect(query.eq).toHaveBeenCalledWith('id', 'h1');
  });
});
