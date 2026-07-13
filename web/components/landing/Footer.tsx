import Link from 'next/link';

import { DISCORD_URL, GAME_URL } from '@/lib/links';

const NAV_LINKS = [
  { href: '#features', label: 'ฟีเจอร์' },
  { href: '#tribes', label: '12 เผ่า' },
  { href: '#customize', label: 'แต่งตัว' },
  { href: '#faq', label: 'คำถามที่พบบ่อย' },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream-2/30">
      <div className="mx-auto max-w-wrap px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 font-head text-lg font-bold text-ink">
              {/* TODO(logo): swap for the new web logo */}
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-mint text-sm text-white">
                12
              </span>
              ลานชุมชน 12 หาง
            </div>
            <p className="mt-3 max-w-[42ch] text-[0.9rem] text-muted">
              พื้นที่แชทสำหรับแฟนเกม 12 หางออนไลน์ · โปรเจกต์ของแฟนเกม (fan project) ไม่ใช่ผลิตภัณฑ์ทางการ ·
              อาร์ตและตัวละครเป็นลิขสิทธิ์ของเจ้าของเกม · ยังไม่มีการขายจริงบนเว็บนี้
            </p>
          </div>
          <div>
            <div className="font-head text-sm font-semibold text-ink">สำรวจ</div>
            <ul className="mt-3 space-y-2 text-[0.92rem]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-soft no-underline hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-head text-sm font-semibold text-ink">ชุมชน</div>
            <ul className="mt-3 space-y-2 text-[0.92rem]">
              <li>
                <a href={GAME_URL} className="text-soft no-underline hover:text-ink">
                  เข้าลานชุมชน
                </a>
              </li>
              <li>
                <a href={DISCORD_URL || '#'} className="text-soft no-underline hover:text-ink">
                  Discord
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-soft no-underline hover:text-ink">
                  ความเป็นส่วนตัว
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-line pt-6 text-[0.82rem] text-muted">
          © {'2026'} ลานชุมชน 12 หาง · fan project · สร้างด้วยใจให้คอมมู 12 หาง
        </div>
      </div>
    </footer>
  );
}
