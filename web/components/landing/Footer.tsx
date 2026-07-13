import Link from 'next/link';

import { DISCORD_URL } from '@/lib/links';

export function Footer() {
  return (
    <footer className="mt-[30px] border-t border-line pt-11 pb-16">
      <div className="mx-auto flex max-w-wrap flex-wrap items-center justify-between gap-4 px-6">
        <p className="max-w-[60ch] text-[0.86rem] text-muted">
          โปรเจกต์นี้เป็นผลงานของแฟนเกม 12 หางออนไลน์ ไม่ใช่ผลิตภัณฑ์ทางการ ·
          อาร์ตและตัวละครเป็นลิขสิทธิ์ของเจ้าของเกม · ยังไม่มีการขายจริงบนเว็บนี้
        </p>
        <div className="flex gap-[18px] text-[0.92rem]">
          <a href={DISCORD_URL || '#'} className="text-soft no-underline hover:text-ink">
            Discord
          </a>
          <Link href="/privacy" className="text-soft no-underline hover:text-ink">
            ความเป็นส่วนตัว
          </Link>
        </div>
      </div>
    </footer>
  );
}
