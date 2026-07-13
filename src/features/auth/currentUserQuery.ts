import { queryOptions } from '@tanstack/react-query';

import { fetchCurrentUser } from '../../api/usersApi';
import { queryKeys } from '../../query';

export function currentUserQuery() {
  return queryOptions({
    queryKey: queryKeys.currentUser(),
    queryFn: fetchCurrentUser,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
