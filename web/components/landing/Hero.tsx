import { GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';
import { WaitlistForm } from './WaitlistForm';

export function Hero() {
  return (
    <header className="relative pt-10 pb-5">
      {/* warm radial glow behind the hero (mockup .hero::before) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{ background: 'radial-gradient(60% 70% at 50% 0%, #FEF3E4 0%, #FDF5EA 70%)' }}
        aria-hidden
      />
      <div className="mx-auto max-w-[720px] px-6 text-center">
        <span className="mb-5 inline-block rounded-full bg-mint-soft px-[14px] py-1.5 font-head text-[13px] font-medium text-mint">
          เว็บแชทสำหรับแฟนเกม · fan project
        </span>
        <h1 className="font-head text-[clamp(2.1rem,5.5vw,3.3rem)] font-bold leading-[1.2] text-ink">
          กลับมาเจอเพื่อนเก่า
          <br />
          ใน<span className="text-accent">ลานชุมชน 12 หาง</span>
        </h1>
        <p className="mx-auto mt-[18px] max-w-[54ch] text-[1.14rem] text-soft">
          เลือกตัวละครจาก 12 เผ่า เดินเล่นในแมพ แชทลอยเหนือหัว และ emote พร้อมเสียง —
          พื้นที่ให้คนที่ยังรักเกมได้มาแฮงก์เอาต์ด้วยกัน
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <CtaLink href={GAME_URL} target="enter_game" location="hero">
            เข้าลานชุมชน
          </CtaLink>
          <a href="#feat" className="btn-pill-ghost">
            ดูว่ามีอะไรบ้าง
          </a>
        </div>
        <WaitlistForm source="hero" />
        <div className="mx-auto mt-10 max-w-[900px] rounded-stage border border-line bg-gradient-to-b from-[#FCEBD7] to-[#F7DFC6] p-3 shadow-stage sm:p-5">
          <div className="overflow-hidden rounded-2xl border-2 border-[#E4C9A6]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized */}
            <img
              src="/hero-key-art.jpg"
              alt="อาร์ตหลักของ 12 หางออนไลน์ — เหล่าตัวละคร 12 เผ่าที่ชายหาด"
              width={1280}
              height={600}
              loading="eager"
              fetchPriority="high"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
