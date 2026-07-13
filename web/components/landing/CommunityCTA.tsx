import { DISCORD_URL, GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';
import { Reveal } from './Reveal';

export function CommunityCTA() {
  return (
    <section id="join" className="py-16 sm:py-24">
      <div className="mx-auto max-w-wrap px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-stage border border-line bg-gradient-to-br from-accent to-mint px-7 py-14 text-center shadow-band">
            {/* decorative glow */}
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">
              <div className="animate-float-slow absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" />
              <div className="animate-float-slower absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
            </div>
            <div className="relative">
              <h2 className="font-head text-[1.9rem] font-bold text-white sm:text-[2.3rem]">มารวมตัวกัน</h2>
              <p className="mx-auto mt-2 max-w-[46ch] text-white/90">
                เข้าลานชุมชนไปเดินเล่นแชทกัน หรือเข้ากลุ่มเพื่อไม่พลาดข่าวเปิดตัวและกิจกรรม
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <CtaLink href={GAME_URL} target="enter_game" location="community" variant="ghost">
                  เข้าลานชุมชน (เดโม)
                </CtaLink>
                <CtaLink
                  href={DISCORD_URL || '#'}
                  target="discord"
                  location="community"
                  variant="ghost"
                  external
                >
                  เข้ากลุ่ม Discord
                </CtaLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
