import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { patchQueryData } from './queryCacheActions';

describe('query cache actions', () => {
  it('patches cached query data', () => {
    const client = new QueryClient();
    const key = ['campaign', 'c1'] as const;

    client.setQueryData(key, { nome: 'Old' });
    patchQueryData<{ nome: string }>(client, key, current => ({ nome: `${current?.nome} New` }));

    expect(client.getQueryData(key)).toEqual({ nome: 'Old New' });
  });
});
