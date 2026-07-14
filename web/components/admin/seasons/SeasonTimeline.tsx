'use client';

import { useMemo } from 'react';
import type { Collection } from '@/lib/api/seasons';
import { statusLabel, STATUS_META } from '@/lib/store/liveness';

const DAY = 86_400_000;

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function monthTicks(t0: number, t1: number): number[] {
  const ticks: number[] = [];
  const d = new Date(t0);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() < t0) d.setMonth(d.getMonth() + 1);
  // cap iterations so a huge range can't spin forever
  for (let i = 0; i < 60 && d.getTime() <= t1; i++) {
    ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

/**
 * ★ Season timeline (Gantt). Every scheduled collection is a bar on a shared
 * axis so the operator sees the whole rotation at a glance — gaps and overlaps
 * jump out. Bars are colored by EFFECTIVE status (computed on read). Click a bar
 * to edit. Collections with no window are listed as "not scheduled" placeholders.
 */
export function SeasonTimeline({
  collections,
  onEdit,
}: {
  collections: Collection[];
  onEdit: (id: string) => void;
}) {
  const now = Date.now();
  const dated = collections.filter((c) => c.sale_start && c.sale_end);
  const undated = collections.filter((c) => !(c.sale_start && c.sale_end));

  const { t0, t1, ticks } = useMemo(() => {
    if (dated.length === 0) return { t0: 0, t1: 0, ticks: [] as number[] };
    const starts = dated.map((c) => +new Date(c.sale_start!));
    const ends = dated.map((c) => +new Date(c.sale_end!));
    let min = Math.min(...starts, now);
    let max = Math.max(...ends, now);
    const pad = Math.max((max - min) * 0.05, 3 * DAY);
    min -= pad;
    max += pad;
    return { t0: min, t1: max, ticks: monthTicks(min, max) };
  }, [dated, now]);

  const span = t1 - t0;
  const pct = (t: number) => (span > 0 ? ((t - t0) / span) * 100 : 0);
  const nowInRange = span > 0 && now >= t0 && now <= t1;

  return (
    <section className="panel p-5">
      <h2 className="mb-1 font-head text-lg text-ink">ไทม์ไลน์การขาย (เวียนขาย)</h2>
      <p className="mb-4 text-xs text-muted">ภาพรวมช่วงขายของทุกซีซัน — เห็นช่องว่าง/ทับซ้อนได้ทันที · คลิกแถบเพื่อแก้ไข</p>

      {dated.length === 0 ? (
        <div className="grid h-24 place-items-center text-sm text-muted">ยังไม่มีคอลเลกชันที่ตั้งวันขาย</div>
      ) : (
        <div className="min-w-[520px]">
          {/* month labels */}
          <div className="relative mb-1 h-4 text-[10px] text-muted">
            {ticks.map((t) => {
              const d = new Date(t);
              return (
                <span key={t} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${pct(t)}%` }}>
                  {MONTHS_TH[d.getMonth()]}
                  {d.getMonth() === 0 ? ` ${(d.getFullYear() + 543) % 100}` : ''}
                </span>
              );
            })}
          </div>

          {/* tracks + shared gridline/now overlay */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0">
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${pct(t)}%` }} />
              ))}
              {nowInRange && (
                <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-danger" style={{ left: `${pct(now)}%` }}>
                  <span className="absolute -top-0 left-1 whitespace-nowrap rounded bg-danger px-1 text-[9px] leading-4 text-white">
                    วันนี้
                  </span>
                </div>
              )}
            </div>

            {dated
              .slice()
              .sort((a, b) => +new Date(a.sale_start!) - +new Date(b.sale_start!))
              .map((c) => {
                const s = +new Date(c.sale_start!);
                const e = +new Date(c.sale_end!);
                const label = statusLabel(c.status, c.sale_start, c.sale_end, now);
                const left = pct(s);
                const width = Math.max(pct(e) - left, 1.5);
                return (
                  <div key={c.id} className="relative mb-1.5 h-8">
                    <button
                      type="button"
                      onClick={() => onEdit(c.id)}
                      title={`${c.name} · ${STATUS_META[label].label}`}
                      className={`absolute inset-y-1 flex items-center overflow-hidden rounded-md px-2 text-left text-xs text-white shadow-sm transition hover:brightness-105 ${STATUS_META[label].bar}`}
                      style={{ left: `${left}%`, width: `${width}%`, minWidth: '2.5rem' }}
                    >
                      <span className="truncate font-medium">{c.name}</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs text-muted">ยังไม่กำหนดวันขาย</p>
          <div className="flex flex-wrap gap-2">
            {undated.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onEdit(c.id)}
                className="rounded-full border border-dashed border-line bg-white px-3 py-1 text-xs text-soft hover:border-accent"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
