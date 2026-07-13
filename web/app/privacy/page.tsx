import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ความเป็นส่วนตัว — ลานชุมชน 12 หาง',
  description: 'เว็บนี้เก็บสถิติการใช้งานแบบไม่ระบุตัวตน และเก็บอีเมล waitlist เฉพาะเมื่อคุณกรอกเอง',
};

export default function Privacy() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <Link href="/" className="text-sm text-accent-ink no-underline hover:underline">
        ← กลับหน้าแรก
      </Link>
      <h1 className="mt-4 font-head text-[1.9rem] font-bold text-ink">นโยบายความเป็นส่วนตัว</h1>
      <p className="mt-2 text-sm text-muted">
        โปรเจกต์นี้เป็นผลงานแฟนเกม (fan project) · ยังไม่มีการขายจริง · ปรับปรุงล่าสุดก่อนเปิดตัวจริง
      </p>

      <div className="mt-8 space-y-6 text-[1.02rem] leading-[1.8] text-soft">
        <section>
          <h2 className="mb-1.5 font-head text-lg font-semibold text-ink">เราเก็บข้อมูลอะไรบ้าง</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-ink">สถิติการใช้งานแบบไม่ระบุตัวตน</strong> — เราสร้างรหัสสุ่ม
              (session id) เก็บไว้ในเบราว์เซอร์ของคุณ เพื่อนับการเข้าชม/การกดปุ่ม
              และวัดว่าฟีเจอร์ไหนคนสนใจ ไม่มีการติดตามข้ามเว็บ และไม่ผูกกับตัวตนจริง
            </li>
            <li>
              <strong className="text-ink">อีเมล waitlist</strong> — เก็บเฉพาะเมื่อคุณกรอกและกดสมัครเอง
              เพื่อแจ้งข่าวการเปิดตัวเท่านั้น
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 font-head text-lg font-semibold text-ink">ทางเลือกของคุณ</h2>
          <p>
            คุณเลือก “ปฏิเสธ” ที่แถบด้านล่างได้ เพื่อหยุดการเก็บสถิติการใช้งาน ·
            การใช้งานเว็บยังทำได้ตามปกติ · หากต้องการให้ลบอีเมลออกจาก waitlist ติดต่อเราได้ทาง Discord
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-head text-lg font-semibold text-ink">สิ่งที่เราไม่ทำ</h2>
          <p>ไม่ขายข้อมูล · ไม่มีโฆษณาติดตามข้ามเว็บ · ไม่เก็บข้อมูลส่วนตัวเกินกว่าอีเมลที่คุณให้มาเอง</p>
        </section>
      </div>
    </main>
  );
}
