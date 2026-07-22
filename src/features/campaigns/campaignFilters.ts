import type { Campagna, Id } from '../../types/domain';

export interface CampaignListFilters {
  searchText?: string;
  tipologia?: string | string[];
  dm?: string | string[];
  soloPreferiti?: boolean;
  currentUserId?: Id;
}

export function filterCampaigns(campaigns: readonly Campagna[], filters: CampaignListFilters = {}) {
  const search = filters.searchText?.trim().toLowerCase() ?? '';
  const tipologie = campaignFilterValues(filters.tipologia).filter(value => value !== 'all');
  const ruoli = campaignFilterValues(filters.dm).filter(value => value !== 'all');

  return campaigns
    .filter(campaign => !search || campaign.nome_campagna.toLowerCase().includes(search))
    .filter(campaign => {
      if (!tipologie.length) return true;
      const tipologia = (campaign as Campagna & { tipologia?: string | null }).tipologia;
      return !tipologia || tipologie.includes(tipologia);
    })
    .filter(campaign => {
      if (ruoli.length !== 1 || !filters.currentUserId) return true;
      if (ruoli[0] === 'yes') return campaign.id_dm === filters.currentUserId;
      if (ruoli[0] === 'no') return campaign.id_dm !== filters.currentUserId;
      return true;
    })
    .filter(campaign => !filters.soloPreferiti || campaign.isPreferito === true)
    .slice()
    .sort((a, b) => {
      if (a.isPreferito && !b.isPreferito) return -1;
      if (!a.isPreferito && b.isPreferito) return 1;
      const dateDiff = campaignDateValue(b) - campaignDateValue(a);
      if (dateDiff !== 0) return dateDiff;
      return a.nome_campagna.localeCompare(b.nome_campagna, 'it');
    });
}

export function countActiveCampaignFilters(filters: CampaignListFilters = {}) {
  return campaignFilterValues(filters.tipologia).filter(value => value !== 'all').length
    + campaignFilterValues(filters.dm).filter(value => value !== 'all').length
    + (filters.soloPreferiti ? 1 : 0);
}

export function campaignFilterValues(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
  if (value == null || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function campaignDateValue(campaign: Campagna) {
  const date = new Date(campaign.data_creazione ?? campaign.created_at ?? 0).getTime();
  return Number.isFinite(date) ? date : 0;
}
