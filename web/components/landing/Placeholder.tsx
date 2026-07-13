import type { ReactNode } from 'react';

/**
 * A labeled art slot for imagery not yet supplied — the user drops the real file
 * in later. Tasteful dashed warm frame + caption so it reads as intentional, not
 * broken. `ratio` is a Tailwind aspect-ratio class; `label` names what goes here.
 */
export function Placeholder({
  label,
  ratio = 'aspect-video',
  className = '',
  icon,
}: {
  label: string;
  ratio?: string;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`flex ${ratio} w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E4C9A6] bg-[#FFF9F0] p-6 text-center ${className}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent-ink">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.6" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        )}
      </span>
      <span className="font-head text-sm text-muted">{label}</span>
      <span className="text-xs text-muted/70">ใส่ภาพจริงทีหลัง</span>
    </div>
  );
}
