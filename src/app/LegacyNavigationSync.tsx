import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { legacyNavigationFromPath } from '../router';

declare global {
  interface Window {
    updateBookmarkChrome?: () => void;
  }
}

export function LegacyNavigationSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const navigation = legacyNavigationFromPath(pathname);
    if (!navigation) return;

    const current = window.AppState;
    const changed = current?.currentPage !== navigation.page
      || (current?.currentCampagnaId ?? null) !== (navigation.campagnaId ?? null)
      || (current?.currentSessioneId ?? null) !== (navigation.sessioneId ?? null)
      || (current?.currentPersonaggioId ?? null) !== (navigation.personaggioId ?? null);

    if (window.AppState) {
      window.AppState.currentCampagnaId = navigation.campagnaId ?? null;
      window.AppState.currentSessioneId = navigation.sessioneId ?? null;
      window.AppState.currentPersonaggioId = navigation.personaggioId ?? null;
    }
    if (changed) window.navigateToPage?.(navigation.page ?? 'campagne', { pushHistory: false });
    else window.updateBookmarkChrome?.();
  }, [pathname]);

  return null;
}
