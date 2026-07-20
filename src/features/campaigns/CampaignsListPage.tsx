import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toggleCampaignFavorite, updateCampaignInviteStatus } from '../../api';
import { SearchToolbar } from '../../components/SearchToolbar';
import { queryKeys } from '../../query';
import type { Campagna, Id } from '../../types/domain';
import { filterCampaigns } from './campaignFilters';
import { receivedCampaignInvitesQuery, visibleCampaignsQuery } from './campaignQueries';

interface Props {
  currentUserId: Id;
  onCreate: () => void;
  onDelete: (id: Id) => void;
  onEdit: (id: Id) => void;
  onOpen: (id: Id) => void;
}

export function CampaignsListPage({ currentUserId, onCreate, onDelete, onEdit, onOpen }: Props) {
  const client = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const campaignsQuery = useQuery(visibleCampaignsQuery(currentUserId));
  const invitesQuery = useQuery(receivedCampaignInvitesQuery(currentUserId));
  const campaignsKey = queryKeys.campaigns(currentUserId);

  const favorites = useMemo(() => new Set(
    (campaignsQuery.data ?? []).filter(item => item.isPreferito).map(item => item.id),
  ), [campaignsQuery.data]);
  const campaigns = filterCampaigns(campaignsQuery.data ?? [], { searchText, favoriteIds: favorites, onlyFavorites });

  const favoriteMutation = useMutation({
    mutationFn: (id: Id) => toggleCampaignFavorite(currentUserId, id),
    onMutate: async id => {
      await client.cancelQueries({ queryKey: campaignsKey });
      const previous = client.getQueryData<Campagna[]>(campaignsKey);
      client.setQueryData<Campagna[]>(campaignsKey, current => current?.map(item => (
        item.id === id ? { ...item, isPreferito: !item.isPreferito } : item
      )));
      return previous;
    },
    onError: (_error, _id, previous) => client.setQueryData(campaignsKey, previous),
    onSettled: () => client.invalidateQueries({ queryKey: campaignsKey }),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ id, status }: { id: Id; status: 'accepted' | 'rejected' }) => updateCampaignInviteStatus(id, status),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.campaignInvites(currentUserId) }),
      client.invalidateQueries({ queryKey: campaignsKey }),
    ]),
  });

  const loading = campaignsQuery.isLoading || invitesQuery.isLoading;
  const failed = campaignsQuery.isError || invitesQuery.isError;

  return <div className="page-content">
    <div className="page-top-stack">
      <div className="page-header"><h1>Campagne</h1></div>
      <SearchToolbar value={searchText} onChange={setSearchText} placeholder="Cerca campagna..." ariaLabel="Cerca campagna" className="react-campaign-tools">
        <button className="comp-filter-btn" type="button" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(value => !value)}><Star filled={onlyFavorites} /><span>Preferite</span></button>
      </SearchToolbar>
    </div>

    {loading && <Placeholder text="Caricamento campagne..." />}
    {failed && <Placeholder text="Impossibile caricare le campagne." />}

    {invitesQuery.data?.map(invite => <article className="invito-card" key={invite.id}>
      <div className="invito-header"><h4>Invito a Campagna</h4></div>
      <div className="invito-content">
        <p><strong>{invite.campagna?.nome_campagna ?? 'Campagna sconosciuta'}</strong></p>
        <p className="invito-from">DM: {invite.inviante?.nome_utente ?? 'DM sconosciuto'}{invite.inviante?.cid ? ` (CID: ${invite.inviante.cid})` : ''}</p>
        <div className="invito-actions">
          <button className="btn-primary btn-small" type="button" disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate({ id: invite.id, status: 'accepted' })}>Accetta</button>
          <button className="btn-secondary btn-small" type="button" disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate({ id: invite.id, status: 'rejected' })}>Rifiuta</button>
        </div>
      </div>
    </article>)}

    {!loading && !campaigns.length && !invitesQuery.data?.length && <Placeholder text="Non hai campagne. Crea o partecipa a una campagna!" />}
    <div className="campagne-list">
      {campaigns.map(campaign => <article className="campagna-card" key={campaign.id} data-campagna-id={campaign.id} onClick={() => onOpen(campaign.id)}>
        <div className="campagna-header">
          <div className="campagna-icon"><CampaignIcon name={campaign.icona_name} /></div>
          <h3 className="campagna-title">{campaign.nome_campagna || 'Senza nome'}</h3>
          <div className="campagna-actions">
            <button className={`btn-star ${campaign.isPreferito ? 'starred' : ''}`} type="button" disabled={favoriteMutation.isPending} onClick={event => {
              event.stopPropagation();
              favoriteMutation.mutate(campaign.id);
            }} aria-label={campaign.isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'} title={campaign.isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}><Star filled={campaign.isPreferito} /></button>
            {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" onClick={event => {
              event.stopPropagation();
              onEdit(campaign.id);
            }} aria-label="Modifica"><Edit /></button>}
            {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" onClick={event => {
              event.stopPropagation();
              onDelete(campaign.id);
            }} aria-label="Elimina"><Trash /></button>}
          </div>
        </div>
        <div className="campagna-info">
          <div className="info-item">
            <span className="info-label">DM:</span>
            <span className="info-value">{campaign.dm_nome ?? 'DM sconosciuto'}</span>
          </div>
        </div>
      </article>)}
    </div>
    <button className="btn-fab" type="button" onClick={onCreate} aria-label="Crea Campagna">+</button>
  </div>;
}

function Placeholder({ text }: { text: string }) {
  return <div className="content-placeholder"><p>{text}</p></div>;
}

function CampaignIcon({ name }: { name?: string | null }) {
  if (name === 'logo_leggenda') {
    return <div className="campagna-icon-svg campagna-icon-image"><img src="images/Logo Leggenda.jpeg" alt="" decoding="async" /></div>;
  }
  return <div className="campagna-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{campaignIconPaths(name)}</svg></div>;
}

function campaignIconPaths(name?: string | null) {
  switch (name) {
    case 'sword':
      return <path d="M6 18L18 6M6 6l12 12" />;
    case 'castle':
      return <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></>;
    case 'shield':
      return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
    case 'book':
      return <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>;
    case 'star':
      return <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />;
    case 'fire':
      return <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />;
    case 'moon':
      return <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
    case 'sun':
      return <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>;
    case 'treasure':
      return <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>;
    case 'skull':
      return <><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><path d="M8 20v2h8v-2" /><path d="M12 20v2" /><path d="M8 18v-2a4 4 0 0 1 8 0v2" /></>;
    case 'cross':
      return <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>;
    default:
      return <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="9" r="1" /><circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" /><circle cx="12" cy="12" r="1" /></>;
  }
}

function Star({ filled = false }: { filled?: boolean }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3" /></svg>;
}

function Edit() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z" /></svg>;
}

function Trash() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 16H6L5 6" /></svg>;
}
