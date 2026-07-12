import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseArray, parseData, parseNullable } from './parse';

describe('schema parsing helpers', () => {
  const itemSchema = z.object({ id: z.string() });

  it('parses valid values and throws invalid ones', () => {
    expect(parseData(itemSchema, { id: 'ok' })).toEqual({ id: 'ok' });
    expect(() => parseData(itemSchema, { id: 1 })).toThrow();
  });

  it('normalizes nullable and array values', () => {
    expect(parseNullable(itemSchema, null)).toBeNull();
    expect(parseArray(itemSchema, null)).toEqual([]);
    expect(parseArray(itemSchema, [{ id: 'a' }])).toEqual([{ id: 'a' }]);
  });
});
