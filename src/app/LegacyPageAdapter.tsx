import { Navigate } from 'react-router';

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
  return <div data-legacy-page={page} hidden />;
}

export function CampaignRedirect() {
  return <Navigate replace to="/campagne" />;
}
