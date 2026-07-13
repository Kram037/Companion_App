import { queryOptions } from '@tanstack/react-query';

import { fetchCombatSnapshot } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function combatSnapshotQuery(campagnaId: Id, sessioneId: Id) {
  return queryOptions({
    queryKey: queryKeys.combat(sessioneId),
    queryFn: () => fetchCombatSnapshot(campagnaId, sessioneId),
    enabled: Boolean(campagnaId && sessioneId),
    ...queryTimings.combat,
  });
}
