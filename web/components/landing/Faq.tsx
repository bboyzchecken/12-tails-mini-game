import { Reveal } from './Reveal';

const FAQS = [
  {
    q: 'ต้องโหลดหรือติดตั้งอะไรไหม?',
    a: 'ไม่ต้องเลย — เปิดลิงก์ในเบราว์เซอร์ก็เข้าเล่นได้ทันที ทั้งบนคอมและมือถือ',
  },
  {
    q: 'เล่นฟรีไหม?',
    a: 'เล่นฟรี ตอนนี้ยังไม่มีการขายจริงใดๆ ส่วนร้านแต่งตัวในเกมเป็น “เดโม” เพื่อโชว์ไอเดียเท่านั้น',
  },
  {
    q: 'เป็นเกมทางการของ 12 หางออนไลน์ไหม?',
    a: 'ไม่ใช่ — นี่เป็นโปรเจกต์ของแฟนเกม (fan project) อาร์ตและตัวละครเป็นลิขสิทธิ์ของเจ้าของเกม เราทำขึ้นด้วยความรักในเกม',
  },
  {
    q: 'เล่นบนมือถือได้ไหม?',
    a: 'ได้ หน้าจอปรับตามอุปกรณ์ เดิน แชท และ emote ได้เหมือนบนคอม',
  },
  {
    q: 'ข้อมูลของฉันปลอดภัยไหม?',
    a: 'เราเก็บแค่สถิติการใช้งานแบบไม่ระบุตัวตน และอีเมลเฉพาะที่คุณกรอก waitlist เอง ไม่มีการติดตามข้ามเว็บ',
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[720px] px-6">
        <Reveal>
          <div className="eyebrow">คำถามที่พบบ่อย</div>
          <h2 className="mt-2 text-center font-head text-[1.9rem] font-semibold text-ink sm:text-[2.2rem]">
            สงสัยอะไร<span className="text-gradient">ถามได้</span>
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 50}>
              <details className="surface group p-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-head text-[1.02rem] font-medium text-ink">
                  {f.q}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5 shrink-0 text-accent-ink transition-transform duration-300 group-open:rotate-45"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-soft">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
