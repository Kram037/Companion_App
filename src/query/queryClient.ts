import { QueryClient } from '@tanstack/react-query';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * SECOND,
      gcTime: 10 * MINUTE,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryTimings = {
  campaigns: { staleTime: 2 * MINUTE, gcTime: 15 * MINUTE },
  character: { staleTime: 15 * SECOND, gcTime: 5 * MINUTE },
  combat: { staleTime: 5 * SECOND, gcTime: 2 * MINUTE },
  runtimeData: { staleTime: 24 * 60 * MINUTE, gcTime: 24 * 60 * MINUTE },
};
