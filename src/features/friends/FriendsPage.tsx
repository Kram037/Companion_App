import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { removeFriend, updateFriendRequest, type FriendProfile } from '../../api';
import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import { currentUserQuery } from '../auth/currentUserQuery';
import { friendsQuery } from './friendsQueries';

declare global {
  interface Window {
    openAddAmicoModal?: () => void;
    sendAppEventBroadcast?: (change: Record<string, unknown>) => Promise<void>;
    showConfirm?: (message: string) => Promise<boolean>;
    showNotification?: (message: string) => void;
  }
}

function FriendAvatar() {
  return <div className="amico-avatar" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>;
}

function FriendInfo({ friend }: { friend: FriendProfile }) {
  return <div className="amico-info">
    <FriendAvatar />
    <div>
      <p className="amico-nome">{friend.name}</p>
      <p className="amico-cid">CID: {friend.cid}</p>
    </div>
  </div>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function FriendsPage() {
  const queryClient = useQueryClient();
  const user = useQuery(currentUserQuery());
  const friends = useQuery({
    ...friendsQuery(user.data?.id ?? ''),
    enabled: Boolean(user.data?.id),
  });

  useEffect(() => {
    if (friends.isError) window.showNotification?.('Errore nel caricamento degli amici. Riprova.');
  }, [friends.isError]);

  const refresh = async (action: string, id: string) => {
    if (user.data) await queryClient.invalidateQueries({ queryKey: queryKeys.friends(user.data.id) });
    await window.sendAppEventBroadcast?.({ table: 'richieste_amicizia', action, id });
  };

  const requestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => updateFriendRequest(id, status),
    onSuccess: (_, variables) => {
      window.showNotification?.(variables.status === 'accepted' ? 'Richiesta di amicizia accettata!' : 'Richiesta di amicizia rifiutata');
      void refresh('update', variables.id);
    },
    onError: (_, variables) => window.showNotification?.(variables.status === 'accepted'
      ? 'Errore nell\'accettazione della richiesta. Riprova.'
      : 'Errore nel rifiuto della richiesta. Riprova.'),
  });

  const removeMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user.data) return;
      if (!await window.showConfirm?.('Sei sicuro di voler rimuovere questo amico?')) return;
      await removeFriend(user.data.id, friendId);
      await refresh('delete', friendId);
      window.showNotification?.('Amico rimosso');
    },
    onError: () => window.showNotification?.('Errore nella rimozione dell\'amico'),
  });

  const data = friends.data;
  const isEmpty = data && !data.friends.length && !data.incoming.length && !data.outgoing.length;

  return <ReactPage name="amici">
    <div className="page-content">
      <div className="page-top-stack"><div className="page-header"><h1>Amici</h1></div></div>

      {!user.isLoading && !user.data && <div className="content-placeholder"><p>Accedi per vedere i tuoi amici</p></div>}
      {(user.isLoading || friends.isLoading) && <div className="content-placeholder"><div className="loading-spinner" /><p>Caricamento amici...</p></div>}
      {friends.isError && <div className="content-placeholder"><p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p></div>}

      {data && data.incoming.length > 0 && <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Richieste in entrata</h3>
        <div className="amici-list">
          {data.incoming.map(request => <div className="amico-item" key={request.id}>
            <FriendInfo friend={request.user} />
            <div className="amico-actions">
              <button className="btn-icon-amico btn-accept" type="button" aria-label="Accetta richiesta" title="Accetta richiesta" onClick={() => requestMutation.mutate({ id: request.id, status: 'accepted' })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
              <button className="btn-icon-amico btn-reject" type="button" aria-label="Rifiuta richiesta" title="Rifiuta richiesta" onClick={() => requestMutation.mutate({ id: request.id, status: 'rejected' })}>
                <CloseIcon />
              </button>
            </div>
          </div>)}
        </div>
      </div>}

      {data && data.friends.length > 0 && <div className="amici-list">
        {data.friends.map(friend => <div className="amico-item" key={friend.id}>
          <FriendInfo friend={friend} />
          <div className="amico-actions">
            <button className="btn-icon-remove" type="button" aria-label="Rimuovi amico" title="Rimuovi amico" onClick={() => removeMutation.mutate(friend.id)}><CloseIcon /></button>
          </div>
        </div>)}
      </div>}

      {isEmpty && <div className="content-placeholder"><p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p></div>}
    </div>
    {user.data && <button className="btn-fab" type="button" aria-label="Aggiungi Amico" onClick={() => window.openAddAmicoModal?.()}>+</button>}
  </ReactPage>;
}
