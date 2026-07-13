import { queryOptions } from '@tanstack/react-query';

import { fetchReceivedCampaignInvites, fetchVisibleCampaigns } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function visibleCampaignsQuery(userId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaigns(userId),
    queryFn: () => fetchVisibleCampaigns(userId),
    ...queryTimings.campaigns,
  });
}

export function receivedCampaignInvitesQuery(userId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaignInvites(userId),
    queryFn: () => fetchReceivedCampaignInvites(userId),
    ...queryTimings.campaigns,
  });
}
