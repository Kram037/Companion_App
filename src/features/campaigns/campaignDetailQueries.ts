import { queryOptions } from '@tanstack/react-query';

import { fetchActiveSessionByCampaign, fetchCampaignById, fetchCampaignCharacters, fetchCampaignPlayers, fetchHasInitiativeRequest } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function campaignByIdQuery(campagnaId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaign(campagnaId),
    queryFn: () => fetchCampaignById(campagnaId),
    ...queryTimings.campaigns,
  });
}

export function activeSessionByCampaignQuery(campagnaId: Id) {
  return queryOptions({
    queryKey: queryKeys.session(campagnaId),
    queryFn: () => fetchActiveSessionByCampaign(campagnaId),
    ...queryTimings.combat,
  });
}

export function campaignPlayersQuery(campagnaId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaignPlayers(campagnaId),
    queryFn: () => fetchCampaignPlayers(campagnaId),
    ...queryTimings.campaigns,
  });
}

export function campaignCharactersQuery(campagnaId: Id) {
  return queryOptions({
    queryKey: queryKeys.campaignCharacters(campagnaId),
    queryFn: () => fetchCampaignCharacters(campagnaId),
    ...queryTimings.character,
  });
}

export function initiativeRequestsQuery(sessioneId: Id) {
  return queryOptions({
    queryKey: queryKeys.initiativeRequests(sessioneId),
    queryFn: () => fetchHasInitiativeRequest(sessioneId),
    enabled: Boolean(sessioneId),
    ...queryTimings.combat,
  });
}
