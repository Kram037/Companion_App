import { describe, expect, it } from 'vitest';

import { classLine, hpValues, modifier, pageOneResourceTables, raceLine, subclassLine, type CharacterData } from './characterSheetModel';

const character = {
  id: 'pg-1', nome: 'Aldren', livello: 5, razza: 'Tiefling', sottorazza: 'Tiefling di Dispater',
  classi: [{ nome: 'Guerriero', livello: 3, sottoclasse: 'Cavaliere Mistico' }, { nome: 'Mago', livello: 2 }],
  punti_vita_max: 30, pv_attuali: 40, pv_temporanei: 4, bonus_manuali: { _pv_max_temporaneo: 5 },
} as CharacterData;

describe('character sheet model', () => {
  it('normalizes quick identity lines', () => {
    expect(classLine(character)).toBe('Guerriero 3 / Mago 2');
    expect(subclassLine(character)).toBe('Cavaliere Mistico');
    expect(raceLine(character)).toBe('Tiefling di Dispater');
  });

  it('clamps current hit points to the effective maximum', () => {
    expect(hpValues(character)).toEqual({ base: 30, bonus: 5, max: 35, current: 35, temporary: 4 });
    expect(modifier(18)).toBe(4);
  });

  it('keeps legacy page-one resource tables available to React', () => {
    const withResources = {
      ...character,
      privilegi: {
        p1_tabs_order: ['Cariche'],
        p1_features: { Cariche: [{ nome: 'Rune', tipo: 'dadi', dado: 'd8', max: 3, current: 8 }] },
      },
    } as CharacterData;

    expect(pageOneResourceTables(withResources)).toEqual([
      { name: 'Cariche', items: [{ index: 0, name: 'Rune', die: 'd8', max: 3, current: 3 }] },
    ]);
  });
});
