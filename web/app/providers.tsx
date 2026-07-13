'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useSession } from '@/lib/store/session';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  // Mirror the shared anonymous session (localStorage) into React once hydrated.
  const syncSession = useSession((s) => s.sync);
  useEffect(() => {
    syncSession();
  }, [syncSession]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
