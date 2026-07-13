import axios from 'axios';
import { useAuth } from '../store/auth';
import { getSessionId } from '../identity';

// Single Axios instance for real data to the Go API: base URL + interceptors.
// Never call fetch() directly elsewhere (12tails-web-BUILD-PLAN.md §10 web stack
// rules) — the one exception is analytics beacons (lib/analytics/events.ts),
// which use sendBeacon/keepalive to survive navigation.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5055').replace(/\/$/, '');

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  // Anonymous session id ties public calls (e.g. /waitlist) to the same funnel
  // as the game; the Go CORS config allow-lists X-Session-Id.
  const sid = getSessionId();
  if (sid) config.headers['X-Session-Id'] = sid;
  // Admin JWT (from the web admin login) for protected /admin/* + /auth/login.
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Human-readable message from the API's `{ error }` body, else a fallback. */
export function apiErrorMessage(err: unknown, fallback = 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: string } | undefined)?.error;
    if (msg) return msg;
    if (err.code === 'ERR_NETWORK') return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง';
  }
  return fallback;
}
