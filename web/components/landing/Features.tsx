import type { ReactNode } from 'react';

interface Feature {
  title: string;
  body: string;
  icon: ReactNode;
}

// Icons lifted from the approved mockup (Lucide-style, currentColor stroke).
const FEATURES: Feature[] = [
  {
    title: 'เดินในแมพร่วมกัน',
    body: 'เลือก 1 ใน 12 เผ่า แล้วเดินสำรวจลานชุมชนไปพร้อมคนอื่น',
    icon: (
      <>
        <path d="M5 3v16h16" />
        <path d="m5 19 6-6 4 4 5-5" />
      </>
    ),
  },
  {
    title: 'แชทลอยเหนือหัว',
    body: 'พิมพ์แล้วข้อความเด้งขึ้นเหนือตัวละครแบบเรียลไทม์',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: 'Emote + เสียง',
    body: 'กด emote แล้วตัวละครรีแอคตามพร้อมเสียง เหมือนในเกมเดิม',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01M15 9h.01" />
      </>
    ),
  },
  {
    title: 'ชุด & cosmetic',
    body: 'แต่งตัวละคร เปลี่ยนสี กรอบแชท และ emote ให้เป็นสไตล์ตัวเอง',
    icon: (
      <>
        <path d="M12 2 4 7v10l8 5 8-5V7z" />
        <path d="M12 22V12M4 7l8 5 8-5" />
      </>
    ),
  },
];

export function Features() {
  return (
    <section id="feat" className="py-14 sm:py-[60px]">
      <div className="mx-auto max-w-wrap px-6">
        <div className="mb-2 text-center text-[12.5px] uppercase tracking-[2px] text-accent-ink">
          ระบบสื่อสารที่เป็นหัวใจของ 12 หาง
        </div>
        <h2 className="text-center font-head text-[1.7rem] font-semibold text-ink">
          ไม่ใช่เกมต่อสู้ — เป็นลานให้มาเจอกัน
        </h2>
        <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-card border border-line bg-card p-6">
              <div className="mb-[14px] grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[22px] w-[22px]"
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="mb-1.5 font-head text-[1.08rem] font-semibold text-ink">{f.title}</h3>
              <p className="text-[0.97rem] text-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
