import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { subscribeToCurrentUser } from '../../api/usersApi';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import { CampaignsListPage } from './CampaignsListPage';

declare global {
  interface Window {
    deleteCampagna?: (id: string) => void;
    openCampagnaModal?: (id?: string | null) => void;
    openLoginModal?: () => void;
  }
}

export function CampaignsRoutePage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const user = useQuery(currentUserQuery());

  useEffect(() => subscribeToCurrentUser(() => {
    client.invalidateQueries({ queryKey: queryKeys.currentUser() });
  }), [client]);

  return <ReactPage name="campagne">
    {user.isLoading && <div className="content-placeholder"><p>Caricamento...</p></div>}
    {user.data ? <CampaignsListPage
      currentUserId={user.data.id}
      onCreate={() => window.openCampagnaModal?.()}
      onDelete={id => window.deleteCampagna?.(id)}
      onEdit={id => window.openCampagnaModal?.(id)}
      onOpen={id => navigate(buildAppPath('campagnaDetails', { campagnaId: id }))}
    /> : !user.isLoading && <div className="page-content">
      <div className="page-top-stack"><div className="page-header"><h1>Campagne</h1></div></div>
      <div className="content-placeholder"><p>Accedi per vedere e creare le tue campagne</p></div>
      <button className="btn-fab" type="button" onClick={() => window.openLoginModal?.()} aria-label="Accedi">+</button>
    </div>}
  </ReactPage>;
}
