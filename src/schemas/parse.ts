import type { z } from 'zod';

export function parseData<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

export function parseNullable<T>(schema: z.ZodType<T>, value: unknown): T | null {
  return value == null ? null : parseData(schema, value);
}

export function parseArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (value == null) return [];
  return parseData(zArray(schema), value);
}

function zArray<T>(schema: z.ZodType<T>): z.ZodArray<z.ZodType<T>> {
  return schema.array();
}
