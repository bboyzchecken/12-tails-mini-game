import { API_URL, getToken } from './api';

/**
 * Client analytics — fire-and-forget telemetry to the Go API's `POST /track`
 * (12tails-web-BUILD-PLAN.md Phase 2). This module is the single source of the
 * game's event taxonomy; never inline an event shape at a call site. The web
 * app's lib/analytics/events.ts mirrors this later (Go models mirror too).
 *
 * Identity: a guest is an anonymous session UUID kept in localStorage; once
 * logged in (Phase P) the JWT's `user_id` rides along as `account_id`, so the
 * funnel can tie an anonymous session to a real account. Telemetry must never
 * block or break gameplay — every failure here is swallowed.
 *
 * `buy_intent` = an interest signal (a demo unlock), NOT a real sale.
 */

export type EventType = 'game_open' | 'play_start' | 'shop_open' | 'buy_intent';

const SESSION_KEY = '12tails-session-id';

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Old/insecure context without crypto.randomUUID — good enough for a client id.
    return 'sxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

/** Stable anonymous id for this browser; created once, reused across sessions. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return uuid(); // private mode — ephemeral id, events still flow
  }
}

/** The account id (JWT `user_id` claim) when logged in, else undefined. */
function accountId(): string | undefined {
  const token = getToken();
  if (!token) return undefined;
  try {
    const seg = token.split('.')[1];
    if (!seg) return undefined;
    const pad = seg.length % 4 === 0 ? '' : '='.repeat(4 - (seg.length % 4));
    const json = atob(seg.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const claims = JSON.parse(json) as { user_id?: unknown };
    return typeof claims.user_id === 'string' ? claims.user_id : undefined;
  } catch {
    return undefined; // malformed token — treat as a guest for analytics
  }
}

interface TrackInput {
  itemId?: string;
  meta?: Record<string, unknown>;
}

/** Low-level: POST one event. Never throws; keys left undefined are omitted. */
export function track(type: EventType, input: TrackInput = {}): void {
  const body = {
    type,
    session_id: getSessionId(),
    account_id: accountId(),
    item_id: input.itemId,
    meta: input.meta,
  };
  try {
    void fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), // JSON.stringify drops undefined fields
      keepalive: true, // survive an in-flight navigation / tab close
    }).catch(() => {
      /* offline / CORS / server down — analytics is best-effort */
    });
  } catch {
    /* never let telemetry throw into the caller */
  }
}

// -------------------------------------------------------- typed event helpers

/** App loaded (fired once at startup). */
export function trackGameOpen(): void {
  track('game_open');
}

/** Entered the world with a character (guest = no account yet). */
export function trackPlayStart(characterId: string, opts: { guest: boolean }): void {
  track('play_start', { meta: { character_id: characterId, guest: opts.guest } });
}

/** Opened the demo store on a given tab. */
export function trackShopOpen(tab: string): void {
  track('shop_open', { meta: { tab } });
}

export interface BuyIntentInput {
  itemId: string;
  itemType: string; // cosmetic type: color | face | weapon | hat …
  priceJil: number;
  hero?: string;
  rarity?: string;
  collectionId?: string; // set when the item comes from a scheduled season (Phase 5)
  theme?: string; // the season's theme, e.g. "summer" — powers "ดีมานด์ต่อซีซัน"
}

/** Demand signal: someone would spend Jil on this item. NOT a real sale. */
export function trackBuyIntent(i: BuyIntentInput): void {
  track('buy_intent', {
    itemId: i.itemId,
    meta: {
      item_type: i.itemType,
      price_jil: i.priceJil,
      ...(i.hero ? { hero: i.hero } : {}),
      ...(i.rarity ? { rarity: i.rarity } : {}),
      ...(i.collectionId ? { collection_id: i.collectionId } : {}),
      ...(i.theme ? { theme: i.theme } : {}),
    },
  });
}
