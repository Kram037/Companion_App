import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router';

declare global {
  interface Window {
    AppState?: {
      currentCampagnaId?: string | null;
      currentSessioneId?: string | null;
      currentPersonaggioId?: string | null;
    };
    navigateToPage?: (page: string, options?: { pushHistory?: boolean; skipPageLoad?: boolean }) => unknown;
  }
}

interface LegacyPageAdapterProps {
  page: string;
}

export function LegacyPageAdapter({ page }: LegacyPageAdapterProps) {
  const params = useParams();

  useEffect(() => {
    if (window.AppState) {
      window.AppState.currentCampagnaId = params.campagnaId ?? null;
      window.AppState.currentSessioneId = params.sessioneId ?? null;
      window.AppState.currentPersonaggioId = params.personaggioId ?? null;
    }

    setSessionValue('currentCampagnaId', params.campagnaId);
    setSessionValue('currentSessioneId', params.sessioneId);
    setSessionValue('currentPersonaggioId', params.personaggioId);

    window.navigateToPage?.(page, { pushHistory: false });
  }, [page, params.campagnaId, params.sessioneId, params.personaggioId]);

  return <div data-legacy-page={page} hidden />;
}

export function CampaignRedirect() {
  return <Navigate replace to="/campagne" />;
}

function setSessionValue(key: string, value: string | undefined) {
  if (value) sessionStorage.setItem(key, value);
  else sessionStorage.removeItem(key);
}
