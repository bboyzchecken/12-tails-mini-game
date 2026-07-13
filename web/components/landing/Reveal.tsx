'use client';

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * Fade + rise a block into view once, when it scrolls near the viewport.
 *
 * The animation is driven by STATE + INLINE STYLES (not a CSS class toggle) so it
 * is immune to cascade/layer ambiguity — inline styles always win. Robustness
 * invariant: any content that is (or scrolls) into the viewport MUST become
 * visible; the reveal is decorative only. We (1) show immediately if already in
 * view on mount, (2) use IntersectionObserver for below-the-fold blocks, and
 * (3) keep a scroll/resize fallback in case IO is flaky. Honors
 * prefers-reduced-motion (shown instantly, no transition).
 *
 * `as` picks the wrapper element; `delay` staggers siblings (ms).
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setReduce(true);
      setShown(true);
      return;
    }

    const inView = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.92 && r.bottom > 0;
    };
    if (inView()) {
      setShown(true);
      return;
    }

    let io: IntersectionObserver | undefined;
    const reveal = () => {
      setShown(true);
      cleanup();
    };
    const onScrollOrResize = () => {
      if (inView()) reveal();
    };
    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) reveal();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
      io.observe(el);
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return cleanup;
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'none' : 'translateY(20px)',
    transition: reduce
      ? 'none'
      : 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
    transitionDelay: !reduce && delay ? `${delay}ms` : undefined,
    willChange: shown ? undefined : 'opacity, transform',
  };

  return (
    <Tag ref={ref} style={style} className={className}>
      {children}
    </Tag>
  );
}
