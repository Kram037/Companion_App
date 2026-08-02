import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  isMissingDatabaseColumn: vi.fn(() => false),
  throwIfSupabaseError: vi.fn(),
}));

import { updateCharacterResistances } from './charactersApi';

describe('charactersApi mutations', () => {
  it('returns only a validated resistance list from the update response', async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { resistenze: ['fuoco', 'freddo'] }, error: null }),
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(updateCharacterResistances('p1', ['fuoco'])).resolves.toEqual(['fuoco', 'freddo']);
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ resistenze: ['fuoco'] }));
    expect(query.eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('rejects malformed update responses before they reach the UI', async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { resistenze: [42] }, error: null }),
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(updateCharacterResistances('p1', ['fuoco'])).rejects.toThrow();
  });
});
