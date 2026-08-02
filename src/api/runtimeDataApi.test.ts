import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { fetchRuntimeDataBundle } from './runtimeDataApi';

describe('fetchRuntimeDataBundle', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('validates remote JSON with the caller contract and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 'item-1' }]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRuntimeDataBundle(
      'items',
      '/items.json',
      z.array(z.object({ id: z.string() })),
      signal,
    )).resolves.toEqual({ key: 'items', data: [{ id: 'item-1' }] });
    expect(fetchMock).toHaveBeenCalledWith('/items.json', { signal });
  });

  it('rejects malformed remote JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 1 }]),
    }));

    await expect(fetchRuntimeDataBundle(
      'items',
      '/items.json',
      z.array(z.object({ id: z.string() })),
    )).rejects.toThrow();
  });
});
