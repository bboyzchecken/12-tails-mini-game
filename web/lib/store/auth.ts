import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Admin auth state (client-only). Holds the JWT from POST /auth/login and the
 * admin's family name for the header. Persisted so a refresh keeps you in; the
 * Go API is the real gate (JwtMiddleware + IsAdmin), this is just the SPA side.
 *
 * `hydrated` guards the first paint: with a static export the persisted token is
 * read from localStorage only after mount, so we must not redirect to /login
 * until rehydration has run (else a logged-in admin gets bounced on refresh).
 */
interface AuthState {
  token: string | null;
  family: string | null;
  hydrated: boolean;
  setAuth: (token: string, family: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      family: null,
      hydrated: false,
      setAuth: (token, family) => set({ token, family }),
      logout: () => set({ token: null, family: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: '12tails-admin-auth',
      partialize: (s) => ({ token: s.token, family: s.family }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
