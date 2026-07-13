import { GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';

export function Nav() {
  return (
    <nav className="py-5">
      <div className="mx-auto flex max-w-wrap items-center justify-between px-6">
        <div className="flex items-center gap-[9px] font-head text-xl font-bold text-ink">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-accent text-[0.95rem] text-white">
            12
          </span>
          ลานชุมชน 12 หาง
        </div>
        <div className="flex items-center gap-[22px] text-[0.96rem]">
          <a href="#feat" className="hidden text-soft no-underline hover:text-ink sm:inline">
            ฟีเจอร์
          </a>
          <a href="#tribes" className="hidden text-soft no-underline hover:text-ink sm:inline">
            12 เผ่า
          </a>
          <CtaLink href={GAME_URL} target="enter_game" location="nav" variant="ghost">
            เข้าลานชุมชน
          </CtaLink>
        </div>
      </div>
    </nav>
  );
}
