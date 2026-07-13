import type { Metrics } from '@/lib/api/queries';

const fmt = (n: number) => (n ?? 0).toLocaleString('th-TH');

/** Top-line KPI cards. would-be revenue is flagged as an estimate, not a sale. */
export function Cards({ cards }: { cards: Metrics['cards'] }) {
  const items: { label: string; value: string; hint?: string; accent?: boolean }[] = [
    { label: 'เซสชันไม่ซ้ำ', value: fmt(cards.unique_sessions) },
    { label: 'บัญชีใช้งาน (MAU)', value: fmt(cards.active_accounts) },
    { label: 'ผู้สมัคร', value: fmt(cards.registered_users) },
    { label: 'Waitlist', value: fmt(cards.waitlist) },
    { label: 'buy_intent (ครั้ง)', value: fmt(cards.buy_intents) },
    {
      label: 'รายได้ประมาณการ (Jil)',
      value: fmt(cards.would_be_revenue),
      hint: 'จากความสนใจ · ไม่ใช่ยอดขาย',
      accent: true,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="panel p-4">
          <div className={`font-head text-2xl ${it.accent ? 'text-accent2' : 'text-ink'}`}>{it.value}</div>
          <div className="mt-1 text-xs text-muted">{it.label}</div>
          {it.hint && <div className="mt-0.5 text-[10px] leading-tight text-muted/80">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}
