import { describe, expect, it } from 'vitest';

import { abilityModifier, cumulativeHpFromHitDice, jackOfAllTradesBonus, proficiencyBonus, totalCharacterLevel } from './rules';

describe('D&D rules', () => {
  it('calculates ability modifiers', () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(15)).toBe(2);
    expect(abilityModifier(20)).toBe(5);
  });

  it('calculates proficiency bonus by total level', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(9)).toBe(4);
    expect(proficiencyBonus(13)).toBe(5);
    expect(proficiencyBonus(17)).toBe(6);
  });

  it('sums multiclass levels before falling back to character level', () => {
    expect(totalCharacterLevel({ livello: 9, classi: [{ nome: 'Guerriero', livello: 5 }, { nome: 'Mago', livello: '3' }] })).toBe(8);
    expect(totalCharacterLevel({ livello: 4, classi: [] })).toBe(4);
  });

  it('calculates Jack of All Trades from bard level and total level', () => {
    expect(jackOfAllTradesBonus({ classi: [{ nome: 'Bardo', livello: 1 }] })).toBe(0);
    expect(jackOfAllTradesBonus({ classi: [{ nome: 'Bardo', livello: 2 }] })).toBe(1);
    expect(jackOfAllTradesBonus({ classi: [{ nome: 'Bard', livello: 2 }, { nome: 'Ladro', livello: 7 }] })).toBe(2);
  });

  it('rebuilds HP history with current constitution modifier', () => {
    expect(cumulativeHpFromHitDice([10, 4, 9], 3)).toEqual([13, 20, 32]);
  });
});
