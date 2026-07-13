import { create } from 'zustand';

import { getAccountId, getSessionId } from '@/lib/identity';

/**
 * Anonymous session state (Zustand). The source of truth is localStorage (shared
 * with the game — see lib/identity.ts); this store mirrors it into React so
 * components re-render once the client has hydrated. `sync()` is called from the
 * client Providers on mount — before that (server prerender) the ids are empty.
 */
interface SessionState {
  sessionId: string;
  accountId?: string;
  sync: () => void;
}

export const useSession = create<SessionState>((set) => ({
  sessionId: '',
  accountId: undefined,
  sync: () => set({ sessionId: getSessionId(), accountId: getAccountId() }),
}));
