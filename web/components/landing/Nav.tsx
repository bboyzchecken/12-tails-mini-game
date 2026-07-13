'use client';

import { useEffect, useState } from 'react';

import { GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';

const LINKS = [
  { href: '#features', label: 'ฟีเจอร์' },
  { href: '#tribes', label: '12 เผ่า' },
  { href: '#customize', label: 'แต่งตัว' },
  { href: '#faq', label: 'คำถาม' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'border-b border-line bg-cream/80 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-wrap items-center justify-between px-6 py-3">
        {/* TODO(logo): swap this mark + wordmark for the new web logo */}
        <a href="#top" className="flex items-center gap-2.5 font-head text-xl font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-mint text-[0.95rem] text-white shadow-[0_4px_12px_rgba(31,180,207,0.35)]">
            12
          </span>
          <span className="hidden sm:inline">ลานชุมชน 12 หาง</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-6">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hidden text-[0.95rem] text-soft hover:text-ink md:inline">
              {l.label}
            </a>
          ))}
          <CtaLink href={GAME_URL} target="enter_game" location="nav" variant="ghost">
            เข้าเล่น
          </CtaLink>
        </div>
      </nav>
    </header>
  );
}
