'use client';

import Link from 'next/link';

import { useConsent } from '@/lib/store/consent';

/**
 * Anonymous-analytics consent notice. We keep only an anonymous session UUID and
 * first-party demand analytics (no cross-site tracking, no PII beyond a waitlist
 * email typed in explicitly), so this is an opt-OUT notice: declining stops
 * telemetry (lib/analytics/events.ts honors it). Shows until a choice is made.
 */
export function ConsentBanner() {
  const decided = useConsent((s) => s.decided);
  const accept = useConsent((s) => s.accept);
  const decline = useConsent((s) => s.decline);

  if (decided) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3" role="dialog" aria-label="การเก็บข้อมูลการใช้งาน">
      <div className="mx-auto flex max-w-wrap flex-col items-center gap-3 rounded-card border border-line bg-card px-5 py-4 shadow-panel sm:flex-row">
        <p className="text-sm text-soft">
          เว็บนี้เก็บสถิติการใช้งานแบบ<strong className="text-ink"> ไม่ระบุตัวตน</strong> เพื่อพัฒนาบริการ
          (ไม่มีการติดตามข้ามเว็บ){' '}
          <Link href="/privacy" className="text-accent-ink underline">
            อ่านนโยบายความเป็นส่วนตัว
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={decline} className="btn-pill-ghost !px-4 !py-2 !text-sm">
            ปฏิเสธ
          </button>
          <button type="button" onClick={accept} className="btn-pill-primary !px-4 !py-2 !text-sm">
            ยอมรับ
          </button>
        </div>
      </div>
    </div>
  );
}
