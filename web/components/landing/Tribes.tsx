import { TRIBES } from '@/lib/data/tribes';
import { Reveal } from './Reveal';

export function Tribes() {
  return (
    <section id="tribes" className="bg-cream-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-wrap px-6">
        <Reveal>
          <div className="eyebrow">เลือกเผ่าของคุณ</div>
          <h2 className="mt-2 text-center font-head text-[1.9rem] font-semibold text-ink sm:text-[2.2rem]">
            เล่นได้แล้ว<span className="text-gradient">ครบทั้ง 12 เผ่า</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[52ch] text-center text-soft">
            พอร์ตเทรตจากเกมจริง — แต่ละเผ่ามีคลาสและสไตล์การเล่นของตัวเอง เลือกตัวที่ใช่แล้วเข้าลานได้เลย
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {TRIBES.map((t, i) => (
            <Reveal key={t.id} delay={(i % 4) * 60}>
              <div className="group surface h-full overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-band">
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-cream-2 to-white">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: t.color }} />
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized */}
                  <img
                    src={`/characters/${t.id}.png`}
                    alt={`ตัวละครเผ่า${t.th}`}
                    width={245}
                    height={291}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* role reveal on hover */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/85 to-transparent p-3 pt-8 text-left text-[0.78rem] leading-snug text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {t.role}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="font-head text-[1rem] font-medium text-ink">{t.th}</div>
                  <div className="text-[0.78rem] text-muted">{t.klass}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
