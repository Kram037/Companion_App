import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { legacyNavigationFromPath } from '../router';

export function LegacyNavigationSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const navigation = legacyNavigationFromPath(pathname);
    if (!navigation) return;

    if (window.AppState) {
      window.AppState.currentCampagnaId = navigation.campagnaId ?? null;
      window.AppState.currentSessioneId = navigation.sessioneId ?? null;
      window.AppState.currentPersonaggioId = navigation.personaggioId ?? null;
    }
    window.navigateToPage?.(navigation.page ?? 'campagne', { pushHistory: false });
  }, [pathname]);

  return null;
}
