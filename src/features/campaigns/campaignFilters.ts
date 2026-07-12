import type { Campagna, Id } from '../../types/domain';

export interface CampaignListFilters {
  searchText?: string;
  favoriteIds?: ReadonlySet<Id>;
  onlyFavorites?: boolean;
}

export function filterCampaigns(campaigns: readonly Campagna[], filters: CampaignListFilters = {}) {
  const search = filters.searchText?.trim().toLowerCase() ?? '';

  return campaigns
    .filter(campaign => !search || campaign.nome_campagna.toLowerCase().includes(search))
    .filter(campaign => !filters.onlyFavorites || filters.favoriteIds?.has(campaign.id))
    .slice()
    .sort((a, b) => a.nome_campagna.localeCompare(b.nome_campagna, 'it'));
}
