import { matchPath } from 'react-router';

import { appRoutes, buildAppPath, type AppRouteId } from './routes';

export interface LegacyNavigationSnapshot {
  page?: string | null;
  campagnaId?: string | null;
  sessioneId?: string | null;
  personaggioId?: string | null;
}

const legacyRouteByPage: Record<string, AppRouteId> = {
  campagne: 'campagne',
  dettagli: 'campagnaDetails',
  sessione: 'sessione',
  combattimento: 'combattimento',
  personaggi: 'personaggi',
  personaggioCreate: 'personaggioCreate',
  scheda: 'personaggio',
  compendio: 'compendio',
  laboratorio: 'laboratorio',
  amici: 'amici',
};

export function pathFromLegacyNavigation(snapshot: LegacyNavigationSnapshot) {
  const route = legacyRouteByPage[snapshot.page ?? ''] ?? 'campagne';

  if (route === 'campagnaDetails' && !snapshot.campagnaId) return appRoutes.campagne;
  if (route === 'sessione' && !snapshot.campagnaId) return appRoutes.campagne;
  if (route === 'combattimento' && (!snapshot.campagnaId || !snapshot.sessioneId)) return appRoutes.campagne;
  if (route === 'personaggio' && !snapshot.personaggioId) return appRoutes.personaggi;

  return buildAppPath(route, {
    campagnaId: snapshot.campagnaId,
    sessioneId: snapshot.sessioneId,
    personaggioId: snapshot.personaggioId,
  });
}

export function legacyNavigationFromPath(pathname: string): LegacyNavigationSnapshot | null {
  const orderedRoutes: Array<[AppRouteId, string]> = [
    ['combattimento', appRoutes.combattimento],
    ['sessione', appRoutes.sessione],
    ['campagnaDetails', appRoutes.campagnaDetails],
    ['personaggioCreate', appRoutes.personaggioCreate],
    ['personaggio', appRoutes.personaggio],
    ['personaggi', appRoutes.personaggi],
    ['compendio', appRoutes.compendio],
    ['laboratorio', appRoutes.laboratorio],
    ['amici', appRoutes.amici],
    ['campagne', appRoutes.campagne],
  ];

  for (const [route, path] of orderedRoutes) {
    const match = matchPath({ path, end: true }, pathname);
    if (!match) continue;

    if (route === 'campagnaDetails') return { page: 'dettagli', campagnaId: match.params.campagnaId };
    if (route === 'personaggioCreate') return { page: 'personaggioCreate' };
    if (route === 'personaggio') return { page: 'scheda', personaggioId: match.params.personaggioId };

    return {
      page: route,
      campagnaId: match.params.campagnaId,
      sessioneId: match.params.sessioneId,
    };
  }

  return null;
}
