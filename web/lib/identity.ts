/**
 * Anonymous identity shared with the game client.
 *
 * A guest is a stable anonymous UUID kept in localStorage; once the player logs
 * in (Phase P) the JWT's `user_id` rides along as `account_id` so the funnel can
 * tie an anonymous session to a real account. The keys here are IDENTICAL to the
 * game client (client/src/net/track.ts + api.ts) so that, once landing + game are
 * served from the same domain, they share one session id and one login.
 *
 * Every accessor is SSR-safe: Next static-export prerenders these components on
 * the server where `window`/`localStorage`/`crypto` do not exist.
 */

const SESSION_KEY = '12tails-session-id';
const TOKEN_KEY = '12tails-auth-token';

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
  if (typeof window === 'undefined') return ''; // prerender — real id assigned on the client
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

/** The JWT (set by the game after login), or null for a guest. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** The account id (JWT `user_id` claim) when logged in, else undefined. */
export function getAccountId(): string | undefined {
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
