'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/store/auth';
import { useCollections } from '@/lib/api/seasons';
import { SeasonTimeline } from '@/components/admin/seasons/SeasonTimeline';
import { SeasonList } from '@/components/admin/seasons/SeasonList';
import { SeasonEditor } from '@/components/admin/seasons/SeasonEditor';

export default function SeasonsPage() {
  const router = useRouter();
  const { token, family, hydrated, logout } = useAuth();
  const { data, isLoading, error } = useCollections();
  // editor: null = closed, { id: null } = new, { id } = editing that collection
  const [editor, setEditor] = useState<{ id: string | null } | null>(null);

  useEffect(() => {
    if (hydrated && !token) router.replace('/admin/login');
  }, [hydrated, token, router]);

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

  const collections = data?.collections ?? [];
  const editing = editor?.id ? collections.find((c) => c.id === editor.id) ?? null : null;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-head text-2xl text-ink">
          เวียนขายซีซัน{' '}
          <span className="align-middle rounded-md bg-danger px-2 py-0.5 text-xs text-white">DEMO</span>
        </h1>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/admin" className="rounded-full px-3 py-1 text-soft hover:bg-line/40">
            แดชบอร์ด
          </Link>
          <span className="rounded-full bg-accent px-3 py-1 text-white">ซีซัน</span>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted">
          <button type="button" className="btn btn-primary py-1" onClick={() => setEditor({ id: null })}>
            + สร้างคอลเลกชัน
          </button>
          {family && <span className="hidden sm:inline">{family}</span>}
          <button type="button" className="btn btn-ghost py-1" onClick={signOut}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <p className="mb-4 text-sm text-muted">
        ตั้งช่วงเวลาเปิด-ปิดขายของแต่ละซีซัน — ของขึ้น/หายตามเวลาเอง (คำนวณตอนอ่าน ไม่มี cron). ยังเป็น mock sales:
        กดซื้อ = สัญญาณ buy_intent ไม่ใช่ยอดขายจริง.
      </p>

      {isLoading && <div className="panel p-10 text-center text-muted">กำลังโหลดข้อมูล…</div>}
      {error && !isLoading && (
        <div className="panel p-10 text-center text-danger">โหลดข้อมูลไม่สำเร็จ — ตรวจการเชื่อมต่อ API</div>
      )}

      {data && !isLoading && (
        <div className="flex flex-col gap-4">
          <SeasonTimeline collections={collections} onEdit={(id) => setEditor({ id })} />
          <SeasonList collections={collections} onEdit={(id) => setEditor({ id })} />
        </div>
      )}

      {editor && (
        <SeasonEditor
          collection={editing}
          onClose={() => setEditor(null)}
          onCreated={(id) => setEditor({ id })}
        />
      )}
    </main>
  );
}
