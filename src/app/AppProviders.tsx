import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient, queryKeys } from '../query';
import { processRealtimeEvent, type RealtimeDataChange } from '../realtime';
import { subscribeToCurrentUser } from '../api/usersApi';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => subscribeToCurrentUser(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
  }), []);

  useEffect(() => {
    const invalidate = (event: Event) => processRealtimeEvent(
      (event as CustomEvent<RealtimeDataChange>).detail || { table: '', action: '' },
    );
    window.addEventListener('companion:data-changed', invalidate);
    return () => window.removeEventListener('companion:data-changed', invalidate);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
