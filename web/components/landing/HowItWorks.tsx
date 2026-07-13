import { Reveal } from './Reveal';

const STEPS = [
  { n: '1', title: 'เลือกเผ่าของคุณ', body: 'เลือก 1 ใน 12 เผ่า ตั้งชื่อเล่น แล้วพร้อมลุย' },
  { n: '2', title: 'เข้าลานชุมชน', body: 'โผล่เข้าแมพร่วมกับผู้เล่นคนอื่นที่ออนไลน์อยู่' },
  { n: '3', title: 'แชท & emote กับเพื่อน', body: 'เดินไปคุยไป ส่งข้อความและ emote พร้อมเสียงได้เลย' },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-wrap px-6">
        <Reveal>
          <div className="eyebrow">เริ่มเล่นง่ายใน 3 ขั้น</div>
          <h2 className="mt-2 text-center font-head text-[1.9rem] font-semibold text-ink sm:text-[2.2rem]">
            จากศูนย์ถึงในลาน<span className="text-gradient">ไม่ถึงนาที</span>
          </h2>
        </Reveal>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          {/* connecting line (desktop) */}
          <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative">
              <div className="surface h-full p-7 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-mint font-head text-xl font-bold text-white shadow-[0_8px_18px_rgba(31,180,207,0.35)]">
                  {s.n}
                </div>
                <h3 className="mt-4 font-head text-[1.12rem] font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[0.98rem] text-soft">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
