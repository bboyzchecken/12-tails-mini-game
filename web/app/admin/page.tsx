'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/store/auth';
import { useFilters } from '@/lib/store/filters';
import { useMetrics } from '@/lib/api/queries';
import { Cards } from '@/components/admin/Cards';
import { Funnel, DemandChart, DemandBySeasonChart, TimeSeriesChart } from '@/components/admin/Charts';
import { TopupsTable, ReferrersTable } from '@/components/admin/Tables';
import { Controls } from '@/components/admin/Controls';

export default function AdminDashboard() {
  const router = useRouter();
  const { token, family, hydrated, logout } = useAuth();
  const { from, to } = useFilters();
  const { data, isLoading, error } = useMetrics(from, to);

  // Client-side gate. The Go API is the real gate (JWT + IsAdmin); this just
  // avoids showing an empty board. Wait for rehydration before deciding.
  useEffect(() => {
    if (hydrated && !token) router.replace('/admin/login');
  }, [hydrated, token, router]);

  // A revoked/expired token → 401/403 → drop it and bounce to login.
  useEffect(() => {
    if (error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0)) {
      logout();
      router.replace('/admin/login');
    }
  }, [error, logout, router]);

  if (!hydrated || !token) {
    return <main className="grid min-h-screen place-items-center text-muted">กำลังโหลด…</main>;
  }

  function signOut() {
    logout();
    router.replace('/admin/login');
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-head text-2xl text-ink">
          แดชบอร์ดดีมานด์{' '}
          <span className="align-middle rounded-md bg-danger px-2 py-0.5 text-xs text-white">DEMO</span>
        </h1>
        <nav className="flex items-center gap-1 text-sm">
          <span className="rounded-full bg-accent px-3 py-1 text-white">แดชบอร์ด</span>
          <Link href="/admin/seasons" className="rounded-full px-3 py-1 text-soft hover:bg-line/40">
            ซีซัน
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted">
          {family && <span>{family}</span>}
          <button type="button" className="btn btn-ghost py-1" onClick={signOut}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <div className="mb-4">
        <Controls />
      </div>

      {isLoading && <div className="panel p-10 text-center text-muted">กำลังโหลดข้อมูล…</div>}
      {error && !isLoading && (
        <div className="panel p-10 text-center text-danger">โหลดข้อมูลไม่สำเร็จ — ตรวจการเชื่อมต่อ API</div>
      )}

      {data && !isLoading && (
        <div className="flex flex-col gap-4">
          <Cards cards={data.cards} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Funnel funnel={data.funnel} />
            <DemandChart demand={data.demand} />
          </div>
          <DemandBySeasonChart demand={data.demand_by_season} />
          <TimeSeriesChart series={data.timeseries} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TopupsTable topups={data.topups} />
            <ReferrersTable referrers={data.referrers} />
          </div>
          <p className="pb-4 text-center text-xs text-muted">{data.note}</p>
        </div>
      )}
    </main>
  );
}
