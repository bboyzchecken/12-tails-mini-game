'use client';

import { useState } from 'react';

import { trackWaitlistSignup } from '@/lib/analytics/events';
import { apiErrorMessage } from '@/lib/api/axios';
import { useWaitlist } from '@/lib/api/queries';

/**
 * Email capture → POST /waitlist via a TanStack mutation. On success we fire the
 * `waitlist_signup` event and show a thank-you. The email is the only PII we
 * keep, and only after this explicit submit. `source` labels which section it
 * came from so the dashboard can attribute signups.
 */
export function WaitlistForm({ source = 'hero' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const mutation = useWaitlist();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mutation.isPending) return;
    mutation.mutate(
      { email: email.trim(), source },
      {
        onSuccess: () => {
          trackWaitlistSignup(source);
          setDone(true);
          setEmail('');
        },
      },
    );
  }

  const hint = done
    ? 'ขอบคุณ! เราจะแจ้งเตือนตอนเปิดจริง 🎉'
    : mutation.isError
      ? apiErrorMessage(mutation.error, 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง')
      : 'กรอกไว้เพื่อรับแจ้งเตือนตอนเปิดจริง';

  return (
    <form className="mt-4 flex flex-wrap justify-center gap-2" onSubmit={onSubmit} noValidate>
      <label htmlFor={`wait-${source}`} className="sr-only">
        อีเมล
      </label>
      <input
        id={`wait-${source}`}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="อีเมลของคุณ"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={done}
        className="min-w-[240px] rounded-full border-[1.5px] border-line bg-white px-4 py-[11px] text-ink outline-none focus:border-accent disabled:opacity-70"
      />
      <button type="submit" className="btn-pill-primary" disabled={mutation.isPending || done}>
        {mutation.isPending ? 'กำลังส่ง…' : done ? 'สมัครแล้ว ✓' : 'รับข่าวเปิดตัว'}
      </button>
      <span
        className={`basis-full text-sm ${mutation.isError ? 'text-danger' : done ? 'text-mint' : 'text-muted'}`}
        role={mutation.isError ? 'alert' : undefined}
        aria-live="polite"
      >
        {hint}
      </span>
    </form>
  );
}
