import { queryOptions } from '@tanstack/react-query';

import { queryKeys, queryTimings } from '../../query';
import type { CompendiumItem } from './compendiumModel';

export interface CompendiumData {
  items: CompendiumItem[];
  total: number;
  activeFilters: number;
  hasFilters: boolean;
  content?: string;
}

export function compendiumDataQuery(tab: string, section: string, kind: string, search: string, revision: number, ready: boolean) {
  return queryOptions({
    queryKey: [...queryKeys.runtimeData(`compendium:${tab}:${section}:${kind}`), search, revision],
    queryFn: () => window.getCompendioReactData!({ tab, section, kind, search }),
    enabled: ready && Boolean(tab),
    ...queryTimings.runtimeData,
  });
}
