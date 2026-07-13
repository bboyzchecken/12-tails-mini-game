import type { Appearance } from '@12tails/shared/events';

/**
 * Thin client for the Go account API (/api). Standalone auth (email+password)
 * → JWT stored in localStorage; guests skip it entirely. Character slots + the
 * permanent family name live server-side. See 12tails-web-BUILD-PLAN.md Phase P.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5055').replace(/\/$/, '');
const TOKEN_KEY = '12tails-auth-token';

export interface Account {
  id: string;
  email: string;
  family_name: string;
  role: string;
  status: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  character_id: string;
  appearance?: Appearance;
  slot_index: number;
}

export interface MeResponse {
  user: Account;
  characters: Character[];
  max_slots: number;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode — session stays in memory only for this tab */
  }
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Error whose message is the API's human-readable `error` field. */
export class ApiError extends Error {}

async function request<T>(path: string, opts: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...opts, headers: { ...headers, ...(opts.headers as object) } });
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์บัญชีไม่ได้');
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError((body.error as string) || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return body as T;
}

export async function register(email: string, password: string, familyName: string): Promise<Account> {
  const r = await request<{ token: string; user: Account }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, family_name: familyName }),
  });
  setToken(r.token);
  return r.user;
}

export async function login(email: string, password: string): Promise<Account> {
  const r = await request<{ token: string; user: Account }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(r.token);
  return r.user;
}

export function getMe(): Promise<MeResponse> {
  return request<MeResponse>('/me', {}, true);
}

export async function createCharacter(input: {
  name: string;
  character_id: string;
  appearance?: Appearance;
  slot_index?: number;
}): Promise<Character> {
  const r = await request<{ character: Character }>(
    '/me/characters',
    { method: 'POST', body: JSON.stringify(input) },
    true,
  );
  return r.character;
}
