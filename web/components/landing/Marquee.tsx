import { TRIBES } from '@/lib/data/tribes';

/**
 * Infinite auto-scrolling band of the 12 real character portraits. The list is
 * rendered twice so the -50% translate loops seamlessly (see globals.css). Pauses
 * on hover; static under prefers-reduced-motion.
 */
export function Marquee() {
  const row = [...TRIBES, ...TRIBES];
  return (
    <section className="marquee-group overflow-hidden border-y border-line bg-cream-2/50 py-5" aria-hidden>
      <div className="flex w-max animate-marquee gap-3 sm:gap-4">
        {row.map((t, i) => (
          <div
            key={`${t.id}-${i}`}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 bg-white shadow-sm transition hover:scale-110 sm:h-16 sm:w-16"
            style={{ borderColor: t.color }}
            title={t.th}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized */}
            <img
              src={`/characters/${t.id}.png`}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover object-top"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
