import type { Metrics } from '@/lib/api/queries';

function Empty() {
  return <div className="grid h-24 place-items-center text-sm text-muted">ยังไม่มีข้อมูล</div>;
}

/** Demo top-up totals per account (attribution is real, payment is mock). */
export function TopupsTable({ topups }: { topups: Metrics['topups'] }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-head text-lg text-ink">เติมเงิน (demo) ต่อบัญชี</h2>
      {topups.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-1 font-medium">Family</th>
                <th className="pb-1 font-medium">อีเมล</th>
                <th className="pb-1 text-right font-medium">Jil รวม</th>
                <th className="pb-1 text-right font-medium">ครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {topups.map((t) => (
                <tr key={t.user_id} className="border-t border-line">
                  <td className="py-1.5 font-medium text-ink">{t.family_name}</td>
                  <td className="py-1.5 text-muted">{t.email}</td>
                  <td className="py-1.5 text-right text-ink">{t.total_jil.toLocaleString('th-TH')}</td>
                  <td className="py-1.5 text-right text-muted">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Where sessions came from (referrer). */
export function ReferrersTable({ referrers }: { referrers: Metrics['referrers'] }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-head text-lg text-ink">ที่มา (referrer)</h2>
      {referrers.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {referrers.map((r) => (
                <tr key={r.key} className="border-t border-line first:border-t-0">
                  <td className="max-w-0 truncate py-1.5 text-ink" title={r.key}>
                    {r.key}
                  </td>
                  <td className="py-1.5 pl-3 text-right text-muted">{r.count.toLocaleString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
