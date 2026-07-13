import { queryOptions } from '@tanstack/react-query';

import { fetchCharacterById, fetchCharactersByUser } from '../../api';
import { queryKeys, queryTimings } from '../../query';
import type { Id } from '../../types/domain';

export function charactersQuery(userId: Id) {
  return queryOptions({
    queryKey: queryKeys.characters(userId),
    queryFn: () => fetchCharactersByUser(userId),
    enabled: Boolean(userId),
    ...queryTimings.character,
  });
}

export function characterQuery(personaggioId: Id) {
  return queryOptions({
    queryKey: queryKeys.character(personaggioId),
    queryFn: () => fetchCharacterById(personaggioId),
    enabled: Boolean(personaggioId),
    ...queryTimings.character,
  });
}
