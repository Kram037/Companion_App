import { queryOptions } from '@tanstack/react-query';

import { fetchFriendsSnapshot } from '../../api';
import { queryKeys } from '../../query';
import type { Id } from '../../types/domain';

export function friendsQuery(userId: Id) {
  return queryOptions({
    queryKey: queryKeys.friends(userId),
    queryFn: fetchFriendsSnapshot,
  });
}
