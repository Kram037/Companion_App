import { describe, expect, it } from 'vitest';

import { legacyNavigationFromLocation, legacyNavigationFromPath, pathFromLegacyNavigation } from './legacyBridge';

describe('legacy router bridge', () => {
  it('builds paths from legacy navigation state', () => {
    expect(pathFromLegacyNavigation({ page: 'campagne' })).toBe('/campagne');
    expect(pathFromLegacyNavigation({ page: 'dettagli', campagnaId: 'c1' })).toBe('/campagne/c1');
    expect(pathFromLegacyNavigation({ page: 'combattimento', campagnaId: 'c1', sessioneId: 's1' }))
      .toBe('/campagne/c1/sessione/s1/combattimento');
    expect(pathFromLegacyNavigation({ page: 'scheda', personaggioId: 'p1' })).toBe('/personaggi/p1');
    expect(pathFromLegacyNavigation({ page: 'personaggioCreate' })).toBe('/personaggi/nuovo');
  });

  it('falls back when required legacy ids are missing', () => {
    expect(pathFromLegacyNavigation({ page: 'dettagli' })).toBe('/campagne');
    expect(pathFromLegacyNavigation({ page: 'scheda' })).toBe('/personaggi');
  });

  it('maps paths back to legacy page names', () => {
    expect(legacyNavigationFromPath('/campagne/c1/sessione/s1/combattimento')).toEqual({
      page: 'combattimento',
      campagnaId: 'c1',
      sessioneId: 's1',
    });
    expect(legacyNavigationFromPath('/personaggi/p1')).toEqual({ page: 'scheda', personaggioId: 'p1' });
    expect(legacyNavigationFromPath('/personaggi/nuovo')).toEqual({ page: 'personaggioCreate' });
  });

  it('maps deployed deep links independently from the app basename', () => {
    expect(legacyNavigationFromLocation('/Companion_App/personaggi/p1')).toEqual({
      page: 'scheda',
      personaggioId: 'p1',
    });
    expect(legacyNavigationFromLocation('/Companion_App/compendio')).toEqual({ page: 'compendio' });
  });
});
