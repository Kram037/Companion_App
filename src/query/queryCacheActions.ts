import type { QueryClient, QueryKey, Updater } from '@tanstack/react-query';

export function invalidateQuery(client: QueryClient, queryKey: QueryKey) {
  return client.invalidateQueries({ queryKey });
}

export function cancelQuery(client: QueryClient, queryKey: QueryKey) {
  return client.cancelQueries({ queryKey });
}

export function patchQueryData<T>(client: QueryClient, queryKey: QueryKey, updater: Updater<T | undefined, T | undefined>) {
  client.setQueryData(queryKey, updater);
}
