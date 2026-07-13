import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cookie/analytics consent (Zustand + persist). We keep only an anonymous
 * session UUID and first-party demand analytics — no cross-site tracking, no PII
 * beyond a waitlist email the visitor types in explicitly. The banner therefore
 * defaults to opt-OUT: anonymous analytics flows until a visitor explicitly
 * declines (see lib/analytics/events.ts `track()`), which keeps the top of the
 * funnel measurable while still honoring an explicit opt-out.
 *
 * `decided` distinguishes "hasn't chosen yet" (show the banner) from a made
 * choice. `accepted` is meaningful only once `decided` is true.
 */
export type ConsentChoice = 'accepted' | 'declined' | 'pending';

interface ConsentState {
  decided: boolean;
  accepted: boolean;
  accept: () => void;
  decline: () => void;
  /** Derived choice used by the analytics layer. */
  choice: () => ConsentChoice;
}

export const useConsent = create<ConsentState>()(
  persist(
    (set, get) => ({
      decided: false,
      accepted: false,
      accept: () => set({ decided: true, accepted: true }),
      decline: () => set({ decided: true, accepted: false }),
      choice: () => {
        const { decided, accepted } = get();
        if (!decided) return 'pending';
        return accepted ? 'accepted' : 'declined';
      },
    }),
    { name: '12tails-consent' },
  ),
);

/**
 * Read the current consent choice OUTSIDE React (analytics layer, event
 * handlers). Reads the persisted store snapshot without subscribing.
 */
export function consentChoice(): ConsentChoice {
  return useConsent.getState().choice();
}
