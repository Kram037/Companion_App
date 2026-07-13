import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { Id } from '../../types/domain';
import { filterCampaigns } from './campaignFilters';
import { campaignsByDmQuery } from './campaignQueries';

interface CampaignsListPageProps {
  currentUserId: Id;
  favoriteCampaignIds?: readonly Id[];
  onCreateCampaign?: () => void;
  onOpenCampaign?: (campaignId: Id) => void;
  onToggleFavorite?: (campaignId: Id) => void;
}

export function CampaignsListPage({
  currentUserId,
  favoriteCampaignIds = [],
  onCreateCampaign,
  onOpenCampaign,
  onToggleFavorite,
}: CampaignsListPageProps) {
  const [searchText, setSearchText] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favoriteIds = useMemo(() => new Set(favoriteCampaignIds), [favoriteCampaignIds]);

  const campaignsQuery = useQuery(campaignsByDmQuery(currentUserId));

  const campaigns = filterCampaigns(campaignsQuery.data ?? [], {
    searchText,
    favoriteIds,
    onlyFavorites,
  });

  return (
    <main className="page-content react-campaigns-page">
      <div className="page-title-strip">
        <h1>Campagne</h1>
      </div>

      <div className="sticky-page-tools">
        <div className="search-filter-row">
          <input
            aria-label="Cerca campagna"
            className="search-input"
            onChange={event => setSearchText(event.target.value)}
            placeholder="Cerca campagna..."
            type="search"
            value={searchText}
          />
          <button
            aria-pressed={onlyFavorites}
            className="btn-secondary"
            onClick={() => setOnlyFavorites(value => !value)}
            type="button"
          >
            Preferite
          </button>
        </div>
      </div>

      {campaignsQuery.isLoading && <p className="content-placeholder">Caricamento campagne...</p>}
      {campaignsQuery.isError && <p className="content-placeholder">Impossibile caricare le campagne.</p>}

      <section className="campaigns-grid" aria-label="Lista campagne">
        {campaigns.map(campaign => (
          <article className="campagna-card" key={campaign.id}>
            <button className="card-main-action" onClick={() => onOpenCampaign?.(campaign.id)} type="button">
              <strong>{campaign.nome_campagna}</strong>
              <span>DM: {campaign.id_dm}</span>
            </button>
            <button
              aria-label="Preferito"
              aria-pressed={favoriteIds.has(campaign.id)}
              className="icon-btn"
              onClick={() => onToggleFavorite?.(campaign.id)}
              type="button"
            >
              {favoriteIds.has(campaign.id) ? '★' : '☆'}
            </button>
          </article>
        ))}
      </section>

      <button className="fab" onClick={onCreateCampaign} type="button">+</button>
    </main>
  );
}
