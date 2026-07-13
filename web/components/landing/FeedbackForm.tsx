'use client';

import { useState } from 'react';

import { trackFeedback } from '@/lib/analytics/events';

/**
 * One-line demand signal: "which tribe / cosmetic do you want?" Fires a
 * `feedback` analytics event (spec §8) — no PII, just the free-text wish.
 */
export function FeedbackForm() {
  const [wants, setWants] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = wants.trim();
    if (!text || done) return;
    trackFeedback(text);
    setDone(true);
    setWants('');
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-4 flex max-w-lg flex-wrap justify-center gap-2">
      <label htmlFor="feedback" className="sr-only">
        อยากได้เผ่าหรือชุดแบบไหน
      </label>
      <input
        id="feedback"
        type="text"
        maxLength={200}
        placeholder="อยากได้เผ่า/ชุด/ฟีเจอร์แบบไหน?"
        value={wants}
        onChange={(e) => setWants(e.target.value)}
        disabled={done}
        className="min-w-[240px] flex-1 rounded-full border-[1.5px] border-line bg-white px-4 py-[11px] text-ink outline-none focus:border-accent disabled:opacity-70"
      />
      <button type="submit" className="btn-pill-ghost" disabled={done}>
        {done ? 'ขอบคุณ ✓' : 'ส่งความเห็น'}
      </button>
      <span className="basis-full text-center text-sm text-muted" aria-live="polite">
        {done ? 'รับไว้แล้ว! ความเห็นของคุณช่วยเราเลือกทำสิ่งที่คนอยากได้จริง 🙌' : 'ช่วยบอกเราหน่อย — ไม่เก็บข้อมูลส่วนตัว'}
      </span>
    </form>
  );
}
