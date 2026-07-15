import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { legacyNavigationFromPath, pathFromLegacyNavigation, type LegacyNavigationSnapshot } from '../router';

declare global {
  interface Window {
    CompanionRouterBridge?: {
      legacyNavigationFromLocation?: (pathname: string) => LegacyNavigationSnapshot | null;
      navigateToLegacy?: (snapshot: LegacyNavigationSnapshot) => boolean;
    };
    updateBookmarkChrome?: () => void;
  }
}

type LegacyNavigateOptions = {
  pushHistory?: boolean;
  skipPageLoad?: boolean;
};

type LegacyNavigateFunction = (pageName: string, options?: LegacyNavigateOptions) => unknown;
type BridgedLegacyNavigateFunction = LegacyNavigateFunction & {
  __reactBridgeOriginal?: LegacyNavigateFunction;
};

function legacySnapshotFromCurrentState(pageName: string): LegacyNavigationSnapshot {
  return {
    page: pageName,
    campagnaId: window.AppState?.currentCampagnaId ?? null,
    sessioneId: window.AppState?.currentSessioneId ?? null,
    personaggioId: window.AppState?.currentPersonaggioId ?? null,
  };
}

function installNavigateToPageBridge() {
  const current = window.navigateToPage as BridgedLegacyNavigateFunction | undefined;
  if (typeof current !== 'function') return false;
  if (current.__reactBridgeOriginal) return true;

  const original = current as LegacyNavigateFunction;
  const bridged: BridgedLegacyNavigateFunction = (pageName, options) => {
    if (options?.pushHistory !== false) {
      const handled = window.CompanionRouterBridge?.navigateToLegacy?.(
        legacySnapshotFromCurrentState(pageName),
      );
      if (handled) return Promise.resolve(true);
    }

    return original(pageName, options);
  };
  bridged.__reactBridgeOriginal = original;
  window.navigateToPage = bridged as Window['navigateToPage'];
  return true;
}

export function LegacyNavigationSync() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.CompanionRouterBridge = {
      ...window.CompanionRouterBridge,
      navigateToLegacy(snapshot) {
        navigate(pathFromLegacyNavigation(snapshot));
        return true;
      },
    };
  }, [navigate]);

  useEffect(() => {
    if (installNavigateToPageBridge()) return;

    const interval = window.setInterval(() => {
      if (installNavigateToPageBridge()) window.clearInterval(interval);
    }, 50);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

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
