import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toggleCampaignFavorite, updateCampaignInviteStatus } from '../../api';
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

  useEffect(() => {
    const refresh = () => client.invalidateQueries({ queryKey: campaignsKey });
    window.addEventListener('companion:campaigns-changed', refresh);
    return () => window.removeEventListener('companion:campaigns-changed', refresh);
  }, [client, currentUserId]);

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
      <div className="filters-bar page-tools-row">
        <div className="filter-search-wrap">
          <svg className="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input className="filter-search" type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Cerca campagna..." aria-label="Cerca campagna" />
        </div>
        <button className="comp-filter-btn" type="button" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(value => !value)}><Star filled={onlyFavorites} /><span>Preferite</span></button>
      </div>
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
      {campaigns.map(campaign => <article className="campagna-card" key={campaign.id}>
        <button className="react-campaign-main" type="button" onClick={() => onOpen(campaign.id)}>
          <span className="campagna-icon"><span className="campagna-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" /></svg></span></span>
          <strong className="campagna-title">{campaign.nome_campagna}</strong>
          <span className="campagna-info"><span className="info-label">DM:</span> {campaign.dm_nome ?? 'DM sconosciuto'}</span>
        </button>
        <div className="campagna-actions">
          <button className={`btn-star ${campaign.isPreferito ? 'starred' : ''}`} type="button" disabled={favoriteMutation.isPending} onClick={() => favoriteMutation.mutate(campaign.id)} aria-label="Preferito"><Star filled={campaign.isPreferito} /></button>
          {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" onClick={() => onEdit(campaign.id)} aria-label="Modifica"><Edit /></button>}
          {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" onClick={() => onDelete(campaign.id)} aria-label="Elimina"><Trash /></button>}
        </div>
      </article>)}
    </div>
    <button className="btn-fab" type="button" onClick={onCreate} aria-label="Crea Campagna">+</button>
  </div>;
}

function Placeholder({ text }: { text: string }) {
  return <div className="content-placeholder"><p>{text}</p></div>;
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
