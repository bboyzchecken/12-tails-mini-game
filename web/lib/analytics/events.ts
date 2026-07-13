import { getAccountId, getSessionId } from '@/lib/identity';
import { consentChoice } from '@/lib/store/consent';

/**
 * Web analytics taxonomy — the SINGLE source of the landing's event shapes.
 * Never inline an event shape at a call site.
 *
 * This mirrors the game client's taxonomy (client/src/net/track.ts) and the Go
 * `Event` model (api/pkg/models/event.go). `game_open`/`play_start`/`shop_open`/
 * `buy_intent` are fired by the game; the landing adds `page_view`/`cta_click`/
 * `waitlist_signup`. All flow to the same `POST /track` → Postgres, keyed by the
 * shared anonymous `session_id`.
 *
 * Transport: exactly like the game client, telemetry uses
 * `fetch(..., { keepalive: true })` so an event fired right before a navigation —
 * e.g. `cta_click` on "enter the game" — still reaches the server. (We do NOT
 * use `navigator.sendBeacon`: its preflighted `application/json` beacon is
 * rejected by Chromium, whereas a keepalive CORS fetch to the same endpoint
 * succeeds.) Real DATA (waitlist, admin metrics) goes through the Axios instance
 * + TanStack Query; telemetry is deliberately fire-and-forget, never blocks/throws.
 *
 * `buy_intent` = an interest signal, NOT a real sale.
 */

export type EventType =
  // shared with the game client (mirror client/src/net/track.ts)
  | 'game_open'
  | 'play_start'
  | 'shop_open'
  | 'buy_intent'
  // landing-only
  | 'page_view'
  | 'cta_click'
  | 'waitlist_signup'
  | 'feedback';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5055').replace(/\/$/, '');

interface TrackInput {
  itemId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Low-level: POST one event, fire-and-forget. Never throws. Suppressed when the
 * visitor has explicitly declined analytics (anonymous-analytics opt-out).
 */
export function track(type: EventType, input: TrackInput = {}): void {
  if (typeof window === 'undefined') return; // no telemetry during prerender
  if (consentChoice() === 'declined') return; // honor explicit opt-out

  const body = {
    type,
    session_id: getSessionId(),
    account_id: getAccountId(),
    item_id: input.itemId,
    meta: input.meta,
  };
  const json = JSON.stringify(body); // drops `undefined` fields

  try {
    // keepalive lets the request outlive the page (survives an in-flight
    // navigation / tab close), same as the game client's track().
    void fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
      mode: 'cors',
    }).catch(() => {
      /* offline / CORS / server down — analytics is best-effort */
    });
  } catch {
    /* never let telemetry throw into the caller */
  }
}

// -------------------------------------------------------- typed event helpers

/** A landing route was viewed (fired once per load). */
export function trackPageView(path: string): void {
  track('page_view', { meta: { path, referrer: safeReferrer() } });
}

/** A primary call-to-action was clicked. `target` = where it leads. */
export function trackCtaClick(target: string, location?: string): void {
  track('cta_click', { meta: { target, ...(location ? { location } : {}) } });
}

/** A waitlist email was accepted by the API. `source` = which form/section. */
export function trackWaitlistSignup(source: string): void {
  track('waitlist_signup', { meta: { source } });
}

/** Free-text demand signal: "which tribe / cosmetic do you want?" (spec §8). */
export function trackFeedback(wants: string): void {
  track('feedback', { meta: { wants: wants.slice(0, 500) } });
}

function safeReferrer(): string | undefined {
  try {
    return document.referrer || undefined;
  } catch {
    return undefined;
  }
}
