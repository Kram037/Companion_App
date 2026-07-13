import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient, queryKeys } from '../query';
import { subscribeToCurrentUser } from '../api/usersApi';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => subscribeToCurrentUser(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
