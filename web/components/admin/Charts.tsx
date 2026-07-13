'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { Metrics } from '@/lib/api/queries';

// Brand hexes (Recharts takes color strings, not Tailwind classes).
const ACCENT = '#1FB4CF';
const ACCENT2 = '#f2894a';
const INK = '#4A3629';
const MUTED = '#A9927E';
const LINE = '#F0E0CC';

const STAGE_LABELS: Record<string, string> = {
  game_open: 'เปิดเกม',
  play_start: 'เริ่มเล่น',
  shop_open: 'เปิดร้าน',
  buy_intent: 'อยากซื้อ',
};

function Empty() {
  return <div className="grid h-40 place-items-center text-sm text-muted">ยังไม่มีข้อมูลในช่วงนี้</div>;
}

/** Demand funnel as conversion bars (each stage vs the first stage). */
export function Funnel({ funnel }: { funnel: Metrics['funnel'] }) {
  const top = funnel[0]?.sessions || 0;
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-head text-lg text-ink">Funnel — การไหลของผู้เล่น</h2>
      {funnel.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex flex-col gap-2.5">
          {funnel.map((s) => {
            const pct = top ? Math.round((s.sessions / top) * 100) : 0;
            return (
              <div key={s.key}>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{STAGE_LABELS[s.key] ?? s.key}</span>
                  <span>
                    {s.sessions.toLocaleString('th-TH')} เซสชัน · {pct}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-line/60">
                  <div className="h-3 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** ★ "ชุดที่คนอยากซื้อสุด" — buy_intent ranked per item (interest, not sales). */
export function DemandChart({ demand }: { demand: Metrics['demand'] }) {
  const data = demand.slice(0, 10).map((d) => ({ name: d.item_id, intents: d.intents, revenue: d.would_be_revenue }));
  return (
    <section className="panel p-5">
      <h2 className="mb-1 font-head text-lg text-ink">ชุดที่คนอยากซื้อสุด</h2>
      <p className="mb-3 text-xs text-muted">จำนวน buy_intent ต่อไอเทม — ความสนใจ ไม่ใช่ยอดขาย</p>
      {data.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} />
            <YAxis type="category" dataKey="name" width={128} tick={{ fontSize: 11, fill: INK }} />
            <Tooltip
              cursor={{ fill: `${ACCENT}14` }}
              formatter={(v: number, key) => [v.toLocaleString('th-TH'), key === 'intents' ? 'buy_intent' : 'Jil (ประมาณการ)']}
            />
            <Bar dataKey="intents" fill={ACCENT} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

/** Daily activity — sessions vs buy_intent over the range. */
export function TimeSeriesChart({ series }: { series: Metrics['timeseries'] }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-head text-lg text-ink">กิจกรรมรายวัน</h2>
      {series.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={series} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="sessions" name="เซสชัน" stroke={ACCENT} fill={`${ACCENT}33`} strokeWidth={2} />
            <Area type="monotone" dataKey="buy_intent" name="buy_intent" stroke={ACCENT2} fill={`${ACCENT2}33`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
