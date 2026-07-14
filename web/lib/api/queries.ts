import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API_URL } from './axios';
import { useAuth } from '../store/auth';

// --- Waitlist (public landing) ---

export interface WaitlistResult {
  ok: boolean;
  /** false = email was already on the list (idempotent, still a success). */
  created: boolean;
}

/**
 * Landing waitlist signup → POST /waitlist (TanStack mutation owns the request
 * state). `source` labels which section the email came from. The axios
 * interceptor attaches the anonymous X-Session-Id for funnel attribution.
 */
export function useWaitlist() {
  return useMutation({
    mutationFn: async (vars: { email: string; source?: string }) => {
      const { data } = await api.post<WaitlistResult>('/waitlist', {
        email: vars.email,
        source: vars.source ?? 'landing',
      });
      return data;
    },
  });
}

// --- Metrics shape (mirrors the Go /admin/metrics response) ---

export interface Metrics {
  range: { from: string; to: string };
  cards: {
    unique_sessions: number;
    active_accounts: number;
    registered_users: number;
    waitlist: number;
    buy_intents: number;
    would_be_revenue: number;
  };
  funnel: { key: string; sessions: number }[];
  demand: { item_id: string; item_type: string; intents: number; would_be_revenue: number }[];
  demand_by_season: { collection_id: string; name: string; theme: string; intents: number; would_be_revenue: number }[];
  timeseries: { day: string; total: number; buy_intent: number; sessions: number }[];
  referrers: { key: string; count: number }[];
  topups: { user_id: string; family_name: string; email: string; total_jil: number; count: number }[];
  note: string;
}

/** Dashboard metrics for a date range. TanStack Query owns server state. */
export function useMetrics(from: string, to: string) {
  return useQuery({
    queryKey: ['metrics', from, to],
    queryFn: async () => (await api.get<Metrics>('/admin/metrics', { params: { from, to } })).data,
  });
}

// --- Auth ---

export interface LoginResult {
  token: string;
  user: { id: string; role: string; family_name: string; email: string };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>('/auth/login', { email, password });
  return data;
}

/**
 * Download the events CSV with the auth header attached (can't use a plain <a>
 * because the endpoint needs the Bearer token). Streams to a Blob → save.
 */
export async function downloadCsv(from: string, to: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/events/export?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${useAuth.getState().token ?? ''}` },
  });
  if (!res.ok) throw new Error(`export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `12tails-events_${from}_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
