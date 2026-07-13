'use client';

import type { ReactNode } from 'react';

import { trackCtaClick } from '@/lib/analytics/events';

/**
 * A pill call-to-action that fires a `cta_click` analytics event on click, then
 * lets the browser follow the link. External links open in a new tab; the
 * analytics beacon uses sendBeacon/keepalive so it survives the navigation.
 */
export function CtaLink({
  href,
  target,
  location,
  variant = 'primary',
  external = false,
  children,
}: {
  href: string;
  /** analytics label for where this CTA leads, e.g. "enter_game" | "discord" */
  target: string;
  /** analytics label for where on the page it sits, e.g. "hero" | "nav" */
  location?: string;
  variant?: 'primary' | 'ghost';
  external?: boolean;
  children: ReactNode;
}) {
  const cls = variant === 'primary' ? 'btn-pill-primary' : 'btn-pill-ghost';
  const rel = external ? 'noopener noreferrer' : undefined;
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={rel}
      className={cls}
      onClick={() => trackCtaClick(target, location)}
    >
      {children}
    </a>
  );
}
