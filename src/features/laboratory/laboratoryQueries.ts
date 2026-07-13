import { queryOptions } from '@tanstack/react-query';

import { fetchHomebrewByUser, fetchHomebrewFriends, type HomebrewTable } from '../../api';
import { queryKeys, queryTimings } from '../../query';

export function laboratoryItemsQuery(table: HomebrewTable, userId: string) {
  return queryOptions({
    queryKey: [...queryKeys.homebrew(userId), table],
    queryFn: () => fetchHomebrewByUser(table, userId),
    enabled: Boolean(userId),
    ...queryTimings.campaigns,
  });
}

export function homebrewFriendsQuery(userId: string) {
  return queryOptions({
    queryKey: [...queryKeys.homebrew(userId), 'friends'],
    queryFn: fetchHomebrewFriends,
    enabled: Boolean(userId),
    ...queryTimings.campaigns,
  });
}
