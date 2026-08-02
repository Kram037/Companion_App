import type { z } from 'zod';

import type { RuntimeDataBundle } from '../types/domain';
import { parseData } from '../schemas';

export async function fetchRuntimeDataBundle<T>(
  key: string,
  url: string,
  dataSchema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<RuntimeDataBundle<T>> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Runtime data non disponibile: ${url}`);
  return {
    key,
    data: parseData(dataSchema, await response.json()),
  };
}

