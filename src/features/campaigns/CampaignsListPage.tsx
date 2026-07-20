import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toggleCampaignFavorite, updateCampaignInviteStatus } from '../../api';
import { queryKeys } from '../../query';
import { useFiltersStore } from '../../store';
import type { Campagna, Id } from '../../types/domain';
import { countActiveCampaignFilters, filterCampaigns } from './campaignFilters';
import { receivedCampaignInvitesQuery, visibleCampaignsQuery } from './campaignQueries';

interface Props {
  currentUserId: Id | null;
  authLoading?: boolean;
  onCreate: () => void;
  onDelete: (id: Id) => void;
  onEdit: (id: Id) => void;
  onOpen: (id: Id) => void;
}

type CampaignFiltersState = {
  searchText: string;
  tipologia: 'all' | 'lunghe' | 'one-shot';
  dm: 'all' | 'yes' | 'no';
  soloPreferiti: boolean;
};

type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

const defaultFilters: CampaignFiltersState = {
  searchText: '',
  tipologia: 'all',
  dm: 'all',
  soloPreferiti: false,
};

const typeOptions: Array<SelectOption<CampaignFiltersState['tipologia']>> = [
  { value: 'all', label: 'Tutte' },
  { value: 'lunghe', label: 'Lunghe' },
  { value: 'one-shot', label: 'One-shot' },
];

const roleOptions: Array<SelectOption<CampaignFiltersState['dm']>> = [
  { value: 'all', label: 'Tutti' },
  { value: 'yes', label: 'Sono DM' },
  { value: 'no', label: 'Non sono DM' },
];

const favoriteOptions: Array<SelectOption<'all' | 'yes'>> = [
  { value: 'all', label: 'Tutti' },
  { value: 'yes', label: 'Solo preferiti' },
];

export function CampaignsListPage({ currentUserId, authLoading = false, onCreate, onDelete, onEdit, onOpen }: Props) {
  const client = useQueryClient();
  const storedFilters = useFiltersStore(state => state.filtersByScope.campagne);
  const setStoredFilter = useFiltersStore(state => state.setFilter);
  const filters = normalizeCampaignFilters(storedFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isLoggedIn = Boolean(currentUserId);
  const safeUserId = currentUserId ?? '';
  const campaignsQuery = useQuery({ ...visibleCampaignsQuery(safeUserId), enabled: isLoggedIn });
  const invitesQuery = useQuery({ ...receivedCampaignInvitesQuery(safeUserId), enabled: isLoggedIn });
  const campaignsKey = queryKeys.campaigns(safeUserId);

  const campaigns = filterCampaigns(campaignsQuery.data ?? [], { ...filters, currentUserId: currentUserId ?? undefined });
  const activeFilters = countActiveCampaignFilters(filters);
  const updateFilters = (next: Partial<CampaignFiltersState>) => {
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined) setStoredFilter('campagne', key, value);
    });
  };

  const favoriteMutation = useMutation({
    mutationFn: (id: Id) => {
      if (!currentUserId) throw new Error('Utente non autenticato');
      return toggleCampaignFavorite(currentUserId, id);
    },
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
      client.invalidateQueries({ queryKey: queryKeys.campaignInvites(safeUserId) }),
      client.invalidateQueries({ queryKey: campaignsKey }),
    ]),
  });

  const loading = authLoading || campaignsQuery.isLoading || invitesQuery.isLoading;
  const failed = isLoggedIn && (campaignsQuery.isError || invitesQuery.isError);

  return <div className="page-content">
    <div className="page-top-stack">
      <div className="page-header"><h1>Campagne</h1></div>
      <div className="comp-toolbar page-tools-row">
        <div className="comp-search-wrap">
          <SearchIcon />
          <input
            type="text"
            className="comp-search"
            value={filters.searchText}
            onChange={event => updateFilters({ searchText: event.target.value })}
            placeholder="Cerca campagna..."
            aria-label="Cerca campagna"
          />
        </div>
        <button type="button" className="comp-filter-btn" onClick={() => setFiltersOpen(true)} aria-label="Filtri">
          <SlidersIcon />
          <span>Filtri</span>
          {activeFilters > 0 && <strong>{activeFilters}</strong>}
        </button>
      </div>
    </div>

    {loading && <Placeholder text="Caricamento campagne..." />}
    {failed && <Placeholder text="Impossibile caricare le campagne." />}
    {!loading && !isLoggedIn && <Placeholder text="Accedi per vedere e creare le tue campagne" />}

    {isLoggedIn && invitesQuery.data?.map(invite => <div className="invito-card" key={invite.id}>
      <div className="invito-header"><h4>{'\u{1F3B2} Invito a Campagna'}</h4></div>
      <div className="invito-content">
        <p><strong>Campagna: {invite.campagna?.nome_campagna ?? 'Campagna sconosciuta'}</strong></p>
        <p className="invito-from">DM: {invite.inviante?.nome_utente ?? 'DM sconosciuto'}{invite.inviante?.cid ? ` (CID: ${invite.inviante.cid})` : ''}</p>
        <div className="invito-actions">
          <button className="btn-primary btn-small" type="button" data-campagne-action="accept-invite" data-invito-id={invite.id} disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate({ id: invite.id, status: 'accepted' })}>Accetta</button>
          <button className="btn-secondary btn-small" type="button" data-campagne-action="reject-invite" data-invito-id={invite.id} disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate({ id: invite.id, status: 'rejected' })}>Rifiuta</button>
        </div>
      </div>
    </div>)}

    {!loading && isLoggedIn && !campaigns.length && !invitesQuery.data?.length && <Placeholder text="Non hai campagne. Crea o partecipa a una campagna!" />}
    <div className="campagne-list">
      {campaigns.map(campaign => <div className="campagna-card" key={campaign.id} data-campagna-id={campaign.id} onClick={() => onOpen(campaign.id)}>
        <div className="campagna-header">
          <div className="campagna-icon"><CampaignIcon name={campaign.icona_name} /></div>
          <h3 className="campagna-title">{campaign.nome_campagna || 'Senza nome'}</h3>
          <div className="campagna-actions">
            <button className={`btn-star ${campaign.isPreferito ? 'starred' : ''}`} type="button" data-campagne-action="favorite" data-campagna-id={campaign.id} disabled={favoriteMutation.isPending} onClick={event => {
              event.stopPropagation();
              favoriteMutation.mutate(campaign.id);
            }} aria-label={campaign.isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'} title={campaign.isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}><Star filled={campaign.isPreferito} /></button>
            {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" data-campagne-action="edit" data-campagna-id={campaign.id} onClick={event => {
              event.stopPropagation();
              onEdit(campaign.id);
            }} aria-label="Modifica"><Edit /></button>}
            {campaign.id_dm === currentUserId && <button className="btn-icon" type="button" data-campagne-action="delete" data-campagna-id={campaign.id} onClick={event => {
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
      </div>)}
    </div>
    <button className="btn-fab" type="button" onClick={onCreate} aria-label="Crea Campagna">+</button>
    {filtersOpen && <CampaignFiltersDialog
      filters={filters}
      onChange={updateFilters}
      onClose={() => setFiltersOpen(false)}
      onReset={() => updateFilters({ tipologia: 'all', dm: 'all', soloPreferiti: false })}
    />}
  </div>;
}

function Placeholder({ text }: { text: string }) {
  return <div className="content-placeholder"><p>{text}</p></div>;
}

function CampaignFiltersDialog({
  filters,
  onChange,
  onClose,
  onReset,
}: {
  filters: CampaignFiltersState;
  onChange: (next: Partial<CampaignFiltersState>) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const [selectOpen, setSelectOpen] = useState<{
    title: string;
    options: SelectOption[];
    onSelect: (value: string) => void;
  } | null>(null);

  return <div className="hp-calc-overlay comp-filter-overlay campagne-filter-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="hp-calc-modal comp-filter-modal" role="dialog" aria-modal="true" aria-labelledby="campaignFiltersTitle">
      <button className="modal-close" type="button" onClick={onClose} aria-label="Chiudi">&times;</button>
      <h2 className="comp-filter-title" id="campaignFiltersTitle">Filtri</h2>
      <div className="comp-filter-panel">
        <FilterSelectButton
          label="Tipo"
          value={filters.tipologia === 'all' ? '' : filters.tipologia}
          selectedLabel={selectedLabel(typeOptions, filters.tipologia, 'all')}
          onClick={() => setSelectOpen({
            title: 'Tipo',
            options: typeOptions,
            onSelect: value => onChange({ tipologia: normalizeOption(value, typeOptions, 'all') }),
          })}
        />
        <FilterSelectButton
          label="Ruolo"
          value={filters.dm === 'all' ? '' : filters.dm}
          selectedLabel={selectedLabel(roleOptions, filters.dm, 'all')}
          onClick={() => setSelectOpen({
            title: 'Ruolo',
            options: roleOptions,
            onSelect: value => onChange({ dm: normalizeOption(value, roleOptions, 'all') }),
          })}
        />
        <FilterSelectButton
          label="Preferiti"
          value={filters.soloPreferiti ? 'yes' : ''}
          selectedLabel={filters.soloPreferiti ? 'Solo preferiti' : ''}
          onClick={() => setSelectOpen({
            title: 'Preferiti',
            options: favoriteOptions,
            onSelect: value => onChange({ soloPreferiti: value === 'yes' }),
          })}
        />
      </div>
      <div className="comp-filter-actions">
        <button type="button" className="btn-secondary" onClick={onReset}>Reset</button>
        <button type="button" className="btn-primary" onClick={onClose}>Applica</button>
      </div>
    </div>
    {selectOpen && <CustomSelectDialog
      title={selectOpen.title}
      options={selectOpen.options}
      onClose={() => setSelectOpen(null)}
      onSelect={value => {
        selectOpen.onSelect(value);
        setSelectOpen(null);
      }}
    />}
  </div>;
}

function FilterSelectButton({ label, value, selectedLabel, onClick }: { label: string; value: string; selectedLabel: string; onClick: () => void }) {
  return <button type="button" className="custom-select-trigger comp-filter-select" data-value={value} onClick={onClick}>
    {label}
    {selectedLabel && <small>{selectedLabel}</small>}
  </button>;
}

function CustomSelectDialog({ title, options, onClose, onSelect }: { title: string; options: SelectOption[]; onClose: () => void; onSelect: (value: string) => void }) {
  return <div className="custom-select-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="custom-select-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="custom-select-header">
        <span>{title}</span>
        <button className="custom-select-close" type="button" onClick={onClose} aria-label="Chiudi">&times;</button>
      </div>
      <div className="custom-select-list">
        {options.map(option => <button className="custom-select-item" type="button" key={option.value} onClick={() => onSelect(option.value)}>{option.label}</button>)}
      </div>
    </div>
  </div>;
}

function selectedLabel<T extends string>(options: Array<SelectOption<T>>, value: T, emptyValue: T) {
  if (value === emptyValue) return '';
  return options.find(option => option.value === value)?.label ?? value;
}

function normalizeOption<T extends string>(value: string, options: Array<SelectOption<T>>, fallback: T) {
  return options.some(option => option.value === value) ? value as T : fallback;
}

function normalizeCampaignFilters(value: unknown): CampaignFiltersState {
  if (!value || typeof value !== 'object') return defaultFilters;
  const record = value as Record<string, unknown>;
  return {
    searchText: typeof record.searchText === 'string' ? record.searchText : '',
    tipologia: normalizeOption(typeof record.tipologia === 'string' ? record.tipologia : 'all', typeOptions, 'all'),
    dm: normalizeOption(typeof record.dm === 'string' ? record.dm : 'all', roleOptions, 'all'),
    soloPreferiti: record.soloPreferiti === true,
  };
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}

function SlidersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
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
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}

function Edit() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function Trash() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}
