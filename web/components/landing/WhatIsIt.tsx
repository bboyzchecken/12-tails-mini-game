import { Placeholder } from './Placeholder';
import { Reveal } from './Reveal';

const POINTS = [
  'ไม่มีการต่อสู้ ไม่มีการแข่ง — มาเดินเล่นคุยกันสบายๆ',
  'เจอเพื่อนเก่าจากคอมมูเดิม + หาเพื่อนใหม่ที่รักเกมเหมือนกัน',
  'เปิดเบราว์เซอร์ก็เข้าเล่นได้ทันที ไม่ต้องโหลด ไม่ต้องสมัคร',
];

export function WhatIsIt() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-wrap items-center gap-10 px-6 md:grid-cols-2 md:gap-14">
        <Reveal>
          <div>
            <div className="text-[12.5px] font-medium uppercase tracking-[2.5px] text-accent-ink">มันคืออะไร</div>
            <h2 className="mt-2 font-head text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">
              ไม่ใช่เกมต่อสู้ —<br className="hidden sm:block" /> เป็น<span className="text-gradient">ลานให้มาเจอกัน</span>
            </h2>
            <p className="mt-4 text-[1.05rem] text-soft">
              12 หางออนไลน์คือความทรงจำของใครหลายคน · ลานชุมชนนี้หยิบเอาหัวใจของเกม —
              ตัวละครน่ารักและการได้อยู่ด้วยกัน — มาทำเป็นพื้นที่แชทที่เดินไปคุยไปได้จริง
            </p>
            <ul className="mt-6 space-y-3">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[1.02rem] text-ink">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-soft text-mint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-stage border border-line bg-gradient-to-b from-[#FCEBD7] to-[#F7DFC6] p-3 shadow-stage">
            <Placeholder label="ภาพหน้าจอ: เดินเล่นในลานชุมชน" ratio="aspect-[4/3]" className="!border-white/70 !bg-white/60" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
