import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { legacyNavigationFromPath, pathFromLegacyNavigation, type LegacyNavigationSnapshot } from '../router';

declare global {
  interface Window {
    CompanionRouterBridge?: {
      legacyNavigationFromLocation?: (pathname: string) => LegacyNavigationSnapshot | null;
      navigateToLegacy?: (snapshot: LegacyNavigationSnapshot) => boolean;
      ownsPage?: (pageName: string) => boolean;
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
  const state = window.getAppNavigationState?.();
  return {
    page: pageName,
    campagnaId: state?.campagnaId ?? window.AppState?.currentCampagnaId ?? null,
    sessioneId: state?.sessioneId ?? window.AppState?.currentSessioneId ?? null,
    personaggioId: state?.personaggioId ?? window.AppState?.currentPersonaggioId ?? null,
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
      if (handled) {
        return original(pageName, {
          ...options,
          pushHistory: false,
          skipPageLoad: options?.skipPageLoad || window.CompanionRouterBridge?.ownsPage?.(pageName),
        });
      }
    }

    return original(pageName, options);
  };
  bridged.__reactBridgeOriginal = original;
  window.navigateToPage = bridged as Window['navigateToPage'];
  return true;
}

function syncLegacyDomToPath(pathname: string) {
  if (window.location.pathname !== pathname) return;
  const navigation = legacyNavigationFromPath(pathname);
  if (!navigation) return;
  const page = navigation.page ?? 'campagne';
  const current = window.AppState;
  const targetPage = document.getElementById(`${page}Page`);
  const isLegacyPageActive = targetPage?.classList.contains('active') ?? false;
  const changed = current?.currentPage !== page
    || (current?.currentCampagnaId ?? null) !== (navigation.campagnaId ?? null)
    || (current?.currentSessioneId ?? null) !== (navigation.sessioneId ?? null)
    || (current?.currentPersonaggioId ?? null) !== (navigation.personaggioId ?? null);

  document.body.dataset.reactPage = page;

  window.setAppNavigationState?.({
    page,
    campagnaId: navigation.campagnaId ?? null,
    sessioneId: navigation.sessioneId ?? null,
    personaggioId: navigation.personaggioId ?? null,
  }, 'react-router');
  if (window.navigateToPage && (changed || !isLegacyPageActive)) {
    window.navigateToPage(page, {
      pushHistory: false,
      skipPageLoad: window.CompanionRouterBridge?.ownsPage?.(page),
    });
  }
  else window.updateBookmarkChrome?.();
}

export function LegacyNavigationSync() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.CompanionRouterBridge = {
      ...window.CompanionRouterBridge,
      navigateToLegacy(snapshot) {
        const target = pathFromLegacyNavigation(snapshot);
        if (pathname !== target) navigate(target);
        return true;
      },
    };
  }, [navigate, pathname]);

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
    syncLegacyDomToPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => syncLegacyDomToPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return null;
}
