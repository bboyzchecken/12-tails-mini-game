'use client';

import { useState } from 'react';
import {
  type Collection,
  useDeleteCollection,
  useDuplicateCollection,
  useSetStatus,
} from '@/lib/api/seasons';
import { statusLabel, STATUS_META, type SeasonStatus } from '@/lib/store/liveness';

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_TH[d.getMonth()]}`;
}

function fmtWindow(c: Collection): string {
  if (!c.sale_start && !c.sale_end) return '—';
  return `${fmtDate(c.sale_start) || '…'} – ${fmtDate(c.sale_end) || '…'}`;
}

export function StatusBadge({ label }: { label: SeasonStatus }) {
  const m = STATUS_META[label];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${m.className}`}>{m.label}</span>;
}

const FILTERS: { key: 'all' | SeasonStatus | 'archived'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'live', label: 'ขายอยู่' },
  { key: 'scheduled', label: 'ตั้งเวลาไว้' },
  { key: 'ended', label: 'จบแล้ว' },
  { key: 'draft', label: 'ร่าง' },
  { key: 'archived', label: 'เก็บถาวร' },
];

/** Collection list with status filter + row actions (edit / duplicate / toggle / delete). */
export function SeasonList({ collections, onEdit }: { collections: Collection[]; onEdit: (id: string) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const del = useDeleteCollection();
  const dup = useDuplicateCollection();
  const setStatus = useSetStatus();

  const now = Date.now();
  const rows = collections.filter((c) => {
    if (filter === 'archived') return c.is_archived;
    if (c.is_archived) return false;
    if (filter === 'all') return true;
    return statusLabel(c.status, c.sale_start, c.sale_end, now) === filter;
  });

  const busy = del.isPending || dup.isPending || setStatus.isPending;

  return (
    <section className="panel p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-head text-lg text-ink">คอลเลกชันทั้งหมด</h2>
        <div className="ml-auto flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                filter === f.key ? 'bg-accent text-white' : 'bg-white text-soft hover:bg-line/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid h-20 place-items-center text-sm text-muted">ไม่มีคอลเลกชันในตัวกรองนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-2 font-medium">คอลเลกชัน</th>
                <th className="pb-2 font-medium">ช่วงขาย</th>
                <th className="pb-2 font-medium">สถานะ</th>
                <th className="pb-2 text-right font-medium">ไอเทม</th>
                <th className="pb-2 text-right font-medium">buy_intent</th>
                <th className="pb-2 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const label = statusLabel(c.status, c.sale_start, c.sale_end, now);
                return (
                  <tr key={c.id} className="border-t border-line align-middle">
                    <td className="py-2">
                      <button type="button" onClick={() => onEdit(c.id)} className="font-medium text-ink hover:text-accent-ink">
                        {c.name}
                      </button>
                      {c.theme && <span className="ml-2 text-xs text-muted">{c.theme}</span>}
                    </td>
                    <td className="py-2 text-muted">{fmtWindow(c)}</td>
                    <td className="py-2">
                      <StatusBadge label={label} />
                    </td>
                    <td className="py-2 text-right text-muted">{c.items?.length ?? 0}</td>
                    <td className="py-2 text-right text-ink">{c.intents.toLocaleString('th-TH')}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1.5 text-xs">
                        <button type="button" className="btn btn-ghost px-2 py-1" onClick={() => onEdit(c.id)}>
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost px-2 py-1"
                          disabled={busy}
                          onClick={() => dup.mutate(c.id)}
                          title="ทำซ้ำเพื่อเวียนขายซีซันหน้า (ร่าง + ล้างวันที่)"
                        >
                          ทำซ้ำ
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost px-2 py-1"
                          disabled={busy}
                          onClick={() => setStatus.mutate({ id: c.id, action: c.is_live ? 'off' : 'live' })}
                        >
                          {c.is_live ? 'ปิดขาย' : 'เปิดขาย'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost px-2 py-1 text-danger"
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`ลบ "${c.name}" ? (ลบไอเทมทั้งหมดด้วย)`)) del.mutate(c.id);
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
