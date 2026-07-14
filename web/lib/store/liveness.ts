/**
 * Client mirror of the Go liveness util (api/pkg/utils/liveness). "On sale now"
 * is COMPUTED on read from the date window + a status override — there is no cron
 * and no persisted live flag. The admin list already gets status_label/is_live
 * from the API; this is used for live PREVIEW as the operator edits dates in the
 * editor, and by the timeline. Keep it in lockstep with the Go version.
 */

export type SeasonStatus = 'draft' | 'scheduled' | 'live' | 'ended';

/** now inside [start, end] (inclusive); a null/empty bound is open on that side. */
export function windowContains(start?: string | null, end?: string | null, now = Date.now()): boolean {
  const startOk = !start || new Date(start).getTime() <= now;
  const endOk = !end || new Date(end).getTime() >= now;
  return startOk && endOk;
}

/** draft/ended → off; live → on (override, ignore window); else window-derived. */
export function isLiveNow(status: string, start?: string | null, end?: string | null, now = Date.now()): boolean {
  if (status === 'draft' || status === 'ended') return false;
  if (status === 'live') return true;
  return windowContains(start, end, now);
}

/** Effective label to display (draft | scheduled | live | ended). */
export function statusLabel(status: string, start?: string | null, end?: string | null, now = Date.now()): SeasonStatus {
  if (status === 'draft') return 'draft';
  if (status === 'ended') return 'ended';
  if (status === 'live') return 'live';
  if (start && new Date(start).getTime() > now) return 'scheduled';
  if (end && new Date(end).getTime() < now) return 'ended';
  return 'live';
}

/** Thai label + brand color per status, shared by badges and the timeline bars. */
export const STATUS_META: Record<SeasonStatus, { label: string; className: string; bar: string }> = {
  live: { label: 'ขายอยู่', className: 'bg-accent-soft text-accent-ink', bar: 'bg-accent' },
  scheduled: { label: 'ตั้งเวลาไว้', className: 'bg-[#fde4d3] text-accent2', bar: 'bg-accent2' },
  ended: { label: 'จบแล้ว', className: 'bg-line text-soft', bar: 'bg-muted' },
  draft: { label: 'ร่าง', className: 'bg-line/60 text-muted', bar: 'bg-muted/60' },
};
