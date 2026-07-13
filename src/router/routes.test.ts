import { describe, expect, it } from 'vitest';

import { appBasenameFromPath, appRoutes, buildAppPath } from './routes';

describe('app routes', () => {
  it('keeps public route templates stable', () => {
    expect(appRoutes).toEqual({
      campagne: '/campagne',
      campagnaDetails: '/campagne/:campagnaId',
      sessione: '/campagne/:campagnaId/sessione',
      combattimento: '/campagne/:campagnaId/sessione/:sessioneId/combattimento',
      personaggi: '/personaggi',
      personaggio: '/personaggi/:personaggioId',
      compendio: '/compendio',
      laboratorio: '/laboratorio',
      amici: '/amici',
    });
  });

  it('builds parameterized page URLs', () => {
    expect(buildAppPath('campagnaDetails', { campagnaId: 'abc' })).toBe('/campagne/abc');
    expect(buildAppPath('combattimento', { campagnaId: 'abc', sessioneId: 's1' }))
      .toBe('/campagne/abc/sessione/s1/combattimento');
    expect(buildAppPath('personaggio', { personaggioId: 'p1' })).toBe('/personaggi/p1');
  });

  it('detects the GitHub Pages repository basename', () => {
    expect(appBasenameFromPath('/Companion_App/')).toBe('/Companion_App');
    expect(appBasenameFromPath('/Companion_App/campagne/abc')).toBe('/Companion_App');
    expect(appBasenameFromPath('/campagne')).toBeUndefined();
  });
});
