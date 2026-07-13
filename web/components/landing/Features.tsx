import { EMOTES } from '@/lib/data/tribes';
import { Placeholder } from './Placeholder';
import { Reveal } from './Reveal';

// Representative wolf body colors (the in-game color-swap set) as clean chips.
const BODY_COLORS = ['#4A90D9', '#D9534F', '#5CB85C', '#3B3B3B', '#F2EDE3'];

export function Features() {
  return (
    <section id="features" className="bg-cream-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-wrap px-6">
        <Reveal>
          <div className="eyebrow">ระบบสื่อสารที่เป็นหัวใจของ 12 หาง</div>
          <h2 className="mt-2 text-center font-head text-[1.9rem] font-semibold text-ink sm:text-[2.2rem]">
            ทุกอย่างที่ทำให้ลานนี้<span className="text-gradient">มีชีวิต</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* A — walk together (wide) */}
          <Reveal className="md:col-span-2">
            <div className="surface flex h-full flex-col gap-4 p-6 transition hover:shadow-band sm:flex-row sm:items-center">
              <div className="sm:w-1/2">
                <FIcon>
                  <path d="M5 3v16h16" />
                  <path d="m5 19 6-6 4 4 5-5" />
                </FIcon>
                <h3 className="mt-3 font-head text-[1.15rem] font-semibold text-ink">เดินในแมพร่วมกัน</h3>
                <p className="mt-1.5 text-[0.98rem] text-soft">
                  เลือก 1 ใน 12 เผ่า แล้วเดินสำรวจลานชุมชนไปพร้อมผู้เล่นคนอื่นแบบเรียลไทม์
                </p>
              </div>
              <div className="sm:w-1/2">
                <Placeholder label="ภาพ: มุมมองแมพในเกม" ratio="aspect-video" />
              </div>
            </div>
          </Reveal>

          {/* B — chat bubbles */}
          <Reveal delay={80}>
            <div className="surface flex h-full flex-col p-6 transition hover:shadow-band">
              <FIcon>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </FIcon>
              <h3 className="mt-3 font-head text-[1.15rem] font-semibold text-ink">แชทลอยเหนือหัว</h3>
              <p className="mt-1.5 text-[0.98rem] text-soft">พิมพ์แล้วข้อความเด้งขึ้นเหนือตัวละครทันที</p>
              <div className="mt-4 space-y-2">
                <span className="inline-block rounded-2xl rounded-bl-md bg-accent-soft px-3.5 py-1.5 text-sm text-accent-ink">
                  สวัสดีทุกคน~
                </span>
                <span className="ml-auto block w-fit rounded-2xl rounded-br-md bg-mint-soft px-3.5 py-1.5 text-sm text-mint">
                  เล่นด้วยกันมั้ย 🎮
                </span>
              </div>
            </div>
          </Reveal>

          {/* C — emotes (real icons) */}
          <Reveal>
            <div className="surface flex h-full flex-col p-6 transition hover:shadow-band">
              <FIcon>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01M15 9h.01" />
              </FIcon>
              <h3 className="mt-3 font-head text-[1.15rem] font-semibold text-ink">Emote + เสียง</h3>
              <p className="mt-1.5 text-[0.98rem] text-soft">กด emote แล้วตัวละครรีแอคพร้อมเสียง เหมือนในเกมเดิม</p>
              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {EMOTES.slice(0, 6).map((e) => (
                  <span key={e.id} className="grid aspect-square place-items-center rounded-lg bg-cream" title={e.label}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/emotes/${e.id}.png`} alt={e.label} width={28} height={28} className="h-7 w-7" />
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* D — customize (color chips) */}
          <Reveal delay={80}>
            <a
              href="#customize"
              className="surface flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-band"
            >
              <FIcon>
                <path d="M12 2 4 7v10l8 5 8-5V7z" />
                <path d="M12 22V12M4 7l8 5 8-5" />
              </FIcon>
              <h3 className="mt-3 font-head text-[1.15rem] font-semibold text-ink">แต่งตัว &amp; cosmetic</h3>
              <p className="mt-1.5 text-[0.98rem] text-soft">เปลี่ยนสีตัว หน้า กรอบแชท และ emote ให้เป็นสไตล์คุณ</p>
              <div className="mt-4 flex items-center gap-2">
                {BODY_COLORS.map((c) => (
                  <span
                    key={c}
                    className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                    style={{ background: c }}
                  />
                ))}
                <span className="ml-1 font-head text-sm text-accent-ink">ดูเพิ่ม →</span>
              </div>
            </a>
          </Reveal>

          {/* E — browser / no download */}
          <Reveal delay={160}>
            <div className="surface flex h-full flex-col p-6 transition hover:shadow-band">
              <FIcon>
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 9h20" />
                <path d="M6 6.5h.01M9 6.5h.01" />
              </FIcon>
              <h3 className="mt-3 font-head text-[1.15rem] font-semibold text-ink">เล่นบนเบราว์เซอร์</h3>
              <p className="mt-1.5 text-[0.98rem] text-soft">ไม่ต้องโหลด ไม่ต้องติดตั้ง เปิดลิงก์ก็เข้าเล่นได้เลย ทั้งคอมและมือถือ</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-ink">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        {children}
      </svg>
    </div>
  );
}
