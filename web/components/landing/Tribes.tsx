import { TRIBES } from '@/lib/data/tribes';

export function Tribes() {
  return (
    <section id="tribes" className="bg-cream-2 py-14 sm:py-[60px]">
      <div className="mx-auto max-w-wrap px-6">
        <div className="mb-2 text-center text-[12.5px] uppercase tracking-[2px] text-accent-ink">
          เลือกเผ่าของคุณ
        </div>
        <h2 className="text-center font-head text-[1.7rem] font-semibold text-ink">ฮีโร่ทั้ง 12 เผ่า</h2>
        <p className="mx-auto mt-2.5 max-w-[52ch] text-center text-soft">
          พอร์ตเทรตจากเกมจริงทั้ง 12 เผ่า — ตอนนี้หมาป่ากับแกะเล่นได้แล้วเป็นสองตัวแรก
        </p>
        <div className="mt-9 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[14px]">
          {TRIBES.map((t) => (
            <div
              key={t.id}
              className={`rounded-card border bg-white p-[14px] text-center transition hover:-translate-y-0.5 ${
                t.ready ? 'border-mint/60 shadow-band' : 'border-line'
              }`}
            >
              <div
                className={`relative mb-2.5 aspect-square overflow-hidden rounded-card-sm border ${
                  t.ready ? 'border-mint bg-mint-soft' : 'border-line bg-[#FFF9F0]'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized */}
                <img
                  src={`/characters/${t.id}.png`}
                  alt={`ตัวละครเผ่า${t.th}`}
                  width={245}
                  height={291}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
                {t.ready && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-mint px-2 py-0.5 font-head text-[0.68rem] text-white shadow-sm">
                    เล่นได้แล้ว
                  </span>
                )}
              </div>
              <div className="font-head text-[0.98rem] font-medium text-ink">{t.th}</div>
              <div className="text-[0.78rem] text-muted">{t.klass}</div>
              <div className={`text-[0.78rem] ${t.ready ? 'text-mint' : 'text-muted'}`}>
                {t.ready ? 'พร้อมแล้ว' : 'เร็วๆ นี้'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
