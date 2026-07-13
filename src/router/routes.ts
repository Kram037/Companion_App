import { generatePath } from 'react-router';

export const appRoutes = {
  campagne: '/campagne',
  campagnaDetails: '/campagne/:campagnaId',
  sessione: '/campagne/:campagnaId/sessione',
  combattimento: '/campagne/:campagnaId/sessione/:sessioneId/combattimento',
  personaggi: '/personaggi',
  personaggio: '/personaggi/:personaggioId',
  compendio: '/compendio',
  laboratorio: '/laboratorio',
  amici: '/amici',
} as const;

export type AppRouteId = keyof typeof appRoutes;

type RouteParams = Record<string, string | number | null | undefined>;

export function buildAppPath(route: AppRouteId, params: RouteParams = {}) {
  const normalized = Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );

  return generatePath(appRoutes[route], normalized);
}

export function appBasenameFromPath(pathname: string) {
  const roots = ['campagne', 'personaggi', 'compendio', 'laboratorio', 'amici'];
  const segments = pathname.split('/').filter(Boolean);
  const routeIndex = segments.findIndex(segment => roots.includes(segment));
  const baseSegments = routeIndex >= 0 ? segments.slice(0, routeIndex) : segments;
  return baseSegments.length ? `/${baseSegments.join('/')}` : undefined;
}
