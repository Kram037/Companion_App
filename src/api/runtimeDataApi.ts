import type { RuntimeDataBundle } from '../types/domain';
import { parseData, runtimeDataBundleSchema } from '../schemas';

export async function fetchRuntimeDataBundle<T>(key: string, url: string): Promise<RuntimeDataBundle<T>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Runtime data non disponibile: ${url}`);
  return parseData(runtimeDataBundleSchema, {
    key,
    data: await response.json() as T,
  }) as unknown as RuntimeDataBundle<T>;
}

