import { API_URL } from './api';

/**
 * Reads the ONE public source of what is on sale now — the Go API's
 * GET /store/active (12tails-web-BUILD-PLAN.md Phase 5 / S4). The demo store must
 * never hardcode a season list; it renders whatever this returns. Liveness is
 * computed server-side on read, so items appear/disappear on schedule with no
 * cron. `ends_at` drives the countdown (FOMO).
 */

export interface ActiveItem {
  id: string;
  name: string;
  type: string; // skin | color | emote | chat_frame
  price_jil: number;
  rarity: string; // common | rare | epic
  preview: string;
  ends_at?: string;
}

export interface ActiveCollection {
  id: string;
  name: string;
  theme?: string;
  ends_at?: string;
  items: ActiveItem[];
}

export interface ActiveStore {
  collections: ActiveCollection[];
  /** serverTime − clientTime, so countdowns stay accurate on a skewed clock. */
  serverOffsetMs: number;
}

export async function getActiveStore(): Promise<ActiveStore> {
  const res = await fetch(`${API_URL}/store/active`);
  if (!res.ok) throw new Error(`store/active ${res.status}`);
  const data = (await res.json()) as { collections?: ActiveCollection[]; server_time?: string };
  const serverMs = data.server_time ? new Date(data.server_time).getTime() : NaN;
  return {
    collections: data.collections ?? [],
    serverOffsetMs: Number.isNaN(serverMs) ? 0 : serverMs - Date.now(),
  };
}
