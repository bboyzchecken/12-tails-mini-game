import { DISCORD_URL, GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';

export function CommunityCTA() {
  return (
    <section id="join" className="py-14 sm:py-[60px]">
      <div className="mx-auto max-w-wrap px-6">
        <div className="rounded-stage border border-line bg-card px-7 py-11 text-center shadow-band">
          <div className="mb-2 text-[12.5px] uppercase tracking-[2px] text-accent-ink">ชุมชน</div>
          <h2 className="mb-2 font-head text-[1.7rem] font-semibold text-ink">มารวมตัวกัน</h2>
          <p className="mx-auto mb-[22px] max-w-[46ch] text-soft">
            เข้าลานชุมชนไปเดินเล่นแชทกัน หรือเข้ากลุ่มเพื่อไม่พลาดข่าวเปิดตัวและกิจกรรม
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <CtaLink href={GAME_URL} target="enter_game" location="community">
              เข้าลานชุมชน (เดโม)
            </CtaLink>
            <CtaLink href={DISCORD_URL || '#'} target="discord" location="community" variant="ghost" external>
              เข้ากลุ่ม Discord
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
