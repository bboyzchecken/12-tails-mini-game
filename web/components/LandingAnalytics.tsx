'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { trackPageView } from '@/lib/analytics/events';

/**
 * Fires a `page_view` once per landing route (invisible; renders nothing).
 * Session sync + consent gating happen inside the analytics layer.
 */
export function LandingAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
