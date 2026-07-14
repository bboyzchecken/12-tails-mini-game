import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

// Shapes mirror the Go season endpoints (api/pkg/handlers/api/collection.handler.go).
// buy_intent stays MOCK — scheduling logic is the real thing here.

export interface CosmeticItem {
  id: string;
  collection_id: string;
  name: string;
  type: string; // skin | color | emote | chat_frame
  price_jil: number;
  rarity: string; // common | rare | epic
  preview: string;
  sale_start?: string | null;
  sale_end?: string | null;
  active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  theme?: string | null;
  sale_start?: string | null;
  sale_end?: string | null;
  status: string; // stored: draft | scheduled | live | ended
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  items?: CosmeticItem[];
  // computed on read by the API:
  status_label: string;
  is_live: boolean;
  intents: number;
}

export interface CollectionInput {
  name: string;
  theme?: string | null;
  sale_start?: string | null;
  sale_end?: string | null;
  status?: string;
  is_archived?: boolean;
}

export interface ItemInput {
  name: string;
  type: string;
  price_jil: number;
  rarity: string;
  preview?: string;
  sale_start?: string | null;
  sale_end?: string | null;
  active?: boolean;
}

const KEY = ['collections'] as const;

/** All seasons (admin). TanStack Query owns the server state. */
export function useCollections() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      (await api.get<{ collections: Collection[]; server_time: string }>('/admin/collections')).data,
  });
}

/** Invalidate the collections list after any mutation so the list + timeline refresh. */
function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateCollection() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: CollectionInput) =>
      (await api.post<{ collection: Collection }>('/admin/collections', input)).data.collection,
    onSuccess: refresh,
  });
}

export function useUpdateCollection() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (vars: { id: string; input: CollectionInput }) =>
      (await api.patch<{ collection: Collection }>(`/admin/collections/${vars.id}`, vars.input)).data.collection,
    onSuccess: refresh,
  });
}

export function useDeleteCollection() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/collections/${id}`)).data,
    onSuccess: refresh,
  });
}

/** Quick override toggle: 'live' (force on) | 'off' (ended) | 'draft'. */
export function useSetStatus() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (vars: { id: string; action: 'live' | 'off' | 'draft' }) =>
      (await api.patch<{ collection: Collection }>(`/admin/collections/${vars.id}/status`, { status: vars.action }))
        .data.collection,
    onSuccess: refresh,
  });
}

/** Clone a season for next rotation (draft, dates cleared, items copied). */
export function useDuplicateCollection() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ collection: Collection }>(`/admin/collections/${id}/duplicate`)).data.collection,
    onSuccess: refresh,
  });
}

export function useCreateItem() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (vars: { collectionId: string; input: ItemInput }) =>
      (await api.post<{ item: CosmeticItem }>(`/admin/collections/${vars.collectionId}/items`, vars.input)).data.item,
    onSuccess: refresh,
  });
}

export function useUpdateItem() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (vars: { collectionId: string; itemId: string; input: ItemInput }) =>
      (
        await api.patch<{ item: CosmeticItem }>(
          `/admin/collections/${vars.collectionId}/items/${vars.itemId}`,
          vars.input,
        )
      ).data.item,
    onSuccess: refresh,
  });
}

export function useDeleteItem() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (vars: { collectionId: string; itemId: string }) =>
      (await api.delete(`/admin/collections/${vars.collectionId}/items/${vars.itemId}`)).data,
    onSuccess: refresh,
  });
}

// ── datetime-local <-> ISO helpers (the API speaks RFC3339 / ISO) ──

/** ISO string → `YYYY-MM-DDTHH:mm` in local time for <input type="datetime-local">. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO (or null when empty). */
export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
