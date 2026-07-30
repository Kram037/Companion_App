import { queryOptions } from '@tanstack/react-query';

import { fetchCombatSnapshot } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function combatSnapshotQuery(campagnaId: Id, sessioneId: Id) {
  return queryOptions({
    queryKey: queryKeys.combat(sessioneId),
    queryFn: () => fetchCombatSnapshot(campagnaId, sessioneId),
    enabled: Boolean(campagnaId && sessioneId),
    refetchInterval: query => query.state.data?.tiri.some(roll => roll.stato === 'pending') ? 1_000 : false,
    ...queryTimings.combat,
  });
}
