import { describe, expect, it } from 'vitest';

import type { Campagna } from '../../types/domain';
import { countActiveCampaignFilters, filterCampaigns } from './campaignFilters';

const campaigns = [
  { id: '2', nome_campagna: 'Zanne del Nord', id_dm: 'dm', data_creazione: '2026-01-02T00:00:00.000Z' },
  { id: '1', nome_campagna: 'Alba Rossa', id_dm: 'dm', data_creazione: '2026-01-01T00:00:00.000Z' },
  { id: '3', nome_campagna: 'Cripta Antica', id_dm: 'player', data_creazione: '2026-01-03T00:00:00.000Z', isPreferito: true },
] satisfies Campagna[];

describe('filterCampaigns', () => {
  it('filters by search and keeps legacy favorite/date ordering', () => {
    expect(filterCampaigns(campaigns, { searchText: 'a' }).map(c => c.nome_campagna))
      .toEqual(['Cripta Antica', 'Zanne del Nord', 'Alba Rossa']);
  });

  it('filters favorites when requested', () => {
    const result = filterCampaigns(campaigns, {
      soloPreferiti: true,
    });

    expect(result.map(c => c.id)).toEqual(['3']);
  });

  it('filters by current user role', () => {
    expect(filterCampaigns(campaigns, { dm: 'yes', currentUserId: 'dm' }).map(c => c.id))
      .toEqual(['2', '1']);
    expect(filterCampaigns(campaigns, { dm: 'no', currentUserId: 'dm' }).map(c => c.id))
      .toEqual(['3']);
  });

  it('counts active non-search filters for the badge', () => {
    expect(countActiveCampaignFilters({ searchText: 'alba', tipologia: 'all', dm: 'all', soloPreferiti: false })).toBe(0);
    expect(countActiveCampaignFilters({ tipologia: 'one-shot', dm: 'yes', soloPreferiti: true })).toBe(3);
  });
});
