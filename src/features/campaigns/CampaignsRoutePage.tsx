import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import { CampaignsListPage } from './CampaignsListPage';

declare global {
  interface Window {
    deleteCampagna?: (id: string) => void;
    openCampagnaDetails?: (id: string) => void;
    openCampagnaModal?: (id?: string | null) => void;
    openLoginModal?: () => void;
  }
}

export function CampaignsRoutePage() {
  const navigate = useNavigate();
  const user = useQuery(currentUserQuery());

  return <ReactPage name="campagne">
    <CampaignsListPage
      currentUserId={user.data?.id ?? null}
      authLoading={user.isLoading}
      onCreate={() => {
        if (user.data) window.openCampagnaModal?.();
        else window.openLoginModal?.();
      }}
      onDelete={id => window.deleteCampagna?.(id)}
      onEdit={id => window.openCampagnaModal?.(id)}
      onOpen={id => {
        if (window.openCampagnaDetails) window.openCampagnaDetails(id);
        else navigate(buildAppPath('campagnaDetails', { campagnaId: id }));
      }}
    />
  </ReactPage>;
}
