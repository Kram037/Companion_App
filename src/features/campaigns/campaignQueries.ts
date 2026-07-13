import { queryOptions } from '@tanstack/react-query';

import { fetchCampaignsByDm } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function campaignsByDmQuery(userId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaigns(userId),
    queryFn: () => fetchCampaignsByDm(userId),
    ...queryTimings.campaigns,
  });
}
