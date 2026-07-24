import { describe, expect, it } from 'vitest';

import { calculatorPress, type CalculatorState } from './CombatUtilities';

const empty: CalculatorState = { display: '0', stored: null, operator: null, replace: true };

describe('calculatorPress', () => {
  it('calcola in sequenza e gestisce la divisione per zero', () => {
    const press = (keys: string[]) => keys.reduce(calculatorPress, empty);
    expect(press(['2', '+', '3', '=']).display).toBe('5');
    expect(press(['9', '/', '0', '=']).display).toBe('Err');
    expect(calculatorPress(press(['9', '/', '0', '=']), '4').display).toBe('4');
  });
});
