import { queryOptions } from '@tanstack/react-query';

import { fetchCombatMonsters } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function combatMonstersQuery(sessioneId: Id) {
  return queryOptions({
    queryKey: queryKeys.combat(sessioneId),
    queryFn: () => fetchCombatMonsters(sessioneId),
    ...queryTimings.combat,
  });
}
