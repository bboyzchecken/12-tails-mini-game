'use client';

import { useState } from 'react';

import { EMOTES } from '@/lib/data/tribes';
import { GAME_URL } from '@/lib/links';
import { CtaLink } from './CtaLink';
import { Reveal } from './Reveal';

// Approximate body-color swaps via CSS filters over the real wolf portrait — a
// playful demo of the in-game color system (labeled as a demo below).
const SKINS = [
  { name: 'ฟ้า', color: '#4A90D9', filter: 'none' },
  { name: 'แดง', color: '#D9534F', filter: 'hue-rotate(150deg) saturate(1.25)' },
  { name: 'เขียว', color: '#5CB85C', filter: 'hue-rotate(75deg)' },
  { name: 'ม่วง', color: '#8C7DB0', filter: 'hue-rotate(-45deg) saturate(1.1)' },
  { name: 'ทอง', color: '#E7B24A', filter: 'hue-rotate(165deg) saturate(1.3)' },
];

export function Customize() {
  const [skin, setSkin] = useState(0);
  const [emote, setEmote] = useState('smile');

  return (
    <section id="customize" className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-wrap items-center gap-10 px-6 md:grid-cols-2 md:gap-14">
        <Reveal>
          <div>
            <div className="text-[12.5px] font-medium uppercase tracking-[2.5px] text-accent-ink">แต่งตัวละคร</div>
            <h2 className="mt-2 font-head text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">
              ทำให้ตัวละคร<span className="text-gradient">เป็นสไตล์คุณ</span>
            </h2>
            <p className="mt-4 text-[1.05rem] text-soft">
              เปลี่ยนสีตัว สีหน้า กรอบแชท และปลดล็อก emote ใหม่ๆ — ลองกดเล่นทางขวาดูได้เลย
              ทุกอย่างที่ใส่จะแสดงในลานจริงให้คนอื่นเห็น
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaLink href={GAME_URL} target="enter_game" location="customize">
                ลองแต่งในเกม →
              </CtaLink>
            </div>
            <p className="mt-3 text-sm text-muted">* ร้านแต่งตัวในเกมเป็น “เดโม” เพื่อโชว์ไอเดีย ยังไม่มีการขายจริง</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="surface p-6">
            <div className="relative mx-auto aspect-square max-w-[300px] overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-cream-2 to-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized */}
              <img
                src="/characters/wolf.png"
                alt="ตัวอย่างการแต่งตัวละครหมาป่า"
                width={245}
                height={291}
                className="h-full w-full object-cover object-top transition-[filter] duration-300"
                style={{ filter: SKINS[skin].filter }}
              />
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-2.5 py-1.5 shadow-band">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/emotes/${emote}.png`} alt="" width={28} height={28} className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 font-head text-xs uppercase tracking-wider text-muted">สีตัว</div>
              <div className="flex gap-2.5">
                {SKINS.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSkin(i)}
                    aria-label={`สี${s.name}`}
                    aria-pressed={skin === i}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      skin === i ? 'scale-110 border-ink' : 'border-white hover:scale-105'
                    } shadow-sm`}
                    style={{ background: s.color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 font-head text-xs uppercase tracking-wider text-muted">Emote</div>
              <div className="grid grid-cols-6 gap-1.5">
                {EMOTES.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmote(e.id)}
                    aria-label={e.label}
                    aria-pressed={emote === e.id}
                    className={`grid aspect-square place-items-center rounded-lg border transition hover:scale-105 ${
                      emote === e.id ? 'border-accent bg-accent-soft' : 'border-transparent bg-cream'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/emotes/${e.id}.png`} alt={e.label} width={26} height={26} className="h-[26px] w-[26px]" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted">ตัวอย่างการปรับแต่ง (เดโม)</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
