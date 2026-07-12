import { describe, expect, it } from 'vitest';

import type { Campagna } from '../../types/domain';
import { filterCampaigns } from './campaignFilters';

const campaigns = [
  { id: '2', nome_campagna: 'Zanne del Nord', id_dm: 'dm' },
  { id: '1', nome_campagna: 'Alba Rossa', id_dm: 'dm' },
  { id: '3', nome_campagna: 'Cripta Antica', id_dm: 'dm' },
] satisfies Campagna[];

describe('filterCampaigns', () => {
  it('filters by search and sorts by name', () => {
    expect(filterCampaigns(campaigns, { searchText: 'a' }).map(c => c.nome_campagna))
      .toEqual(['Alba Rossa', 'Cripta Antica', 'Zanne del Nord']);
  });

  it('filters favorites when requested', () => {
    const result = filterCampaigns(campaigns, {
      onlyFavorites: true,
      favoriteIds: new Set(['3']),
    });

    expect(result.map(c => c.id)).toEqual(['3']);
  });
});
