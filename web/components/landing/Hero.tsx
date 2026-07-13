import { GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';
import { Reveal } from './Reveal';
import { WaitlistForm } from './WaitlistForm';

const TRUST = ['เล่นฟรี', 'บนเบราว์เซอร์ · ไม่ต้องโหลด', 'รองรับมือถือ'];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-10 pb-16 sm:pb-24">
      {/* soft animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[560px] w-[960px] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#FEF3E4,transparent)]" />
        <div className="animate-float-slow absolute -left-16 top-24 h-56 w-56 rounded-full bg-accent-soft/60 blur-3xl" />
        <div className="animate-float-slower absolute -right-12 top-44 h-64 w-64 rounded-full bg-mint-soft/70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-[760px] px-6 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint-soft px-3.5 py-1.5 font-head text-[13px] font-medium text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" /> fan project · เล่นได้แล้วครบทั้ง 12 เผ่า
          </span>
        </Reveal>
        <Reveal delay={70}>
          <h1 className="mt-5 font-head text-[clamp(2.2rem,6vw,3.5rem)] font-bold leading-[1.15] text-ink">
            กลับมาเจอเพื่อนเก่า
            <br />
            ใน<span className="text-gradient">ลานชุมชน 12 หาง</span>
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1.14rem] text-soft">
            เลือกตัวละครจาก 12 เผ่า เดินเล่นในแมพ แชทลอยเหนือหัว และ emote พร้อมเสียง —
            พื้นที่ให้คนที่ยังรักเกมได้มาแฮงก์เอาต์ด้วยกัน
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <CtaLink href={GAME_URL} target="enter_game" location="hero">
              เข้าลานชุมชน →
            </CtaLink>
            <a href="#features" className="btn-pill-ghost">
              ดูว่ามีอะไรบ้าง
            </a>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <WaitlistForm source="hero" />
        </Reveal>
        <Reveal delay={320}>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.9rem] text-muted">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-mint">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* hero visual — real key art with floating accents */}
      <Reveal delay={200} className="relative mx-auto mt-14 max-w-[940px] px-6">
        <div className="relative rounded-[28px] border border-line bg-gradient-to-b from-[#FCEBD7] to-[#F7DFC6] p-2.5 shadow-stage sm:p-3.5">
          <div className="overflow-hidden rounded-[22px] border-2 border-white/70">
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

        {/* floating character chip */}
        <div className="animate-float-slow absolute -left-2 top-10 hidden rounded-2xl border border-line bg-card p-1.5 shadow-band sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/characters/wolf.png" alt="" width={64} height={64} className="h-14 w-14 rounded-xl object-cover object-top" />
        </div>
        {/* floating chat bubble */}
        <div className="animate-float-slower absolute -right-1 bottom-12 hidden items-center gap-2 rounded-full border border-line bg-card px-4 py-2 shadow-band sm:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emotes/wave.png" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="font-head text-sm text-ink">สวัสดีย~</span>
        </div>
      </Reveal>
    </section>
  );
}
