/**
 * Sound manifest — contract กลางไฟล์เดียว: key → เสียง (context-brief §2 ฉบับเสียง)
 *
 * ตอนนี้ทุก key เป็น kind:'synth' → AudioManager เรียก synth.ts สังเคราะห์สดๆ
 * (ไม่ต้องมีไฟล์เสียงเลย) พอมี asset จริงแล้ว เปลี่ยนแค่ entry เป็น:
 *     'catch.legendary': { kind: 'file', url: 'assets/audio/catch-legendary.mp3', bus: 'sfx' }
 * โค้ดเกมยังเรียก audio.play('catch.legendary') เหมือนเดิม — ไม่แก้แม้บรรทัดเดียว
 *
 * ห้าม hardcode ชื่อไฟล์/เสียงในโค้ดเกม — ต้องผ่าน key ใน manifest นี้เท่านั้น
 */

export type SfxKey =
  | 'fishing.cast'
  | 'fishing.splash'
  | 'fishing.bite'
  | 'fishing.reel'
  | 'fishing.miss'
  | 'fishing.sell'
  | 'catch.common'
  | 'catch.rare'
  | 'catch.epic'
  | 'catch.legendary'
  | 'ui.blip';

export type BgmKey = 'bgm.day' | 'bgm.night';

/** เสียง one-shot: สังเคราะห์ (ตอนนี้) หรือไฟล์ (ทีหลัง) */
export type SfxDef =
  | {
      kind: 'synth';
      /** ตัวสังเคราะห์ใน synth.ts */
      synth: 'cast' | 'splash' | 'bite' | 'reel' | 'miss' | 'sell' | 'blip' | 'fanfare';
      tier?: 'common' | 'rare' | 'epic' | 'legendary'; // สำหรับ synth:'fanfare'
      /** duck BGM ลงชั่วครู่ตอนเล่น (0..1 = ลดเหลือกี่ส่วน) — legendary ใช้เด้งเสียง */
      duck?: number;
    }
  | { kind: 'file'; url: string; gain?: number; duck?: number };

/** เพลงพื้นหลัง: สังเคราะห์วนลูป (ตอนนี้) หรือไฟล์ลูป (ทีหลัง) */
export type BgmDef =
  | { kind: 'synth'; mood: 'day' | 'night' }
  | { kind: 'file'; url: string; gain?: number };

export const SFX: Record<SfxKey, SfxDef> = {
  'fishing.cast': { kind: 'synth', synth: 'cast' },
  'fishing.splash': { kind: 'synth', synth: 'splash' },
  'fishing.bite': { kind: 'synth', synth: 'bite' },
  'fishing.reel': { kind: 'synth', synth: 'reel' },
  'fishing.miss': { kind: 'synth', synth: 'miss' },
  'fishing.sell': { kind: 'synth', synth: 'sell' },
  'ui.blip': { kind: 'synth', synth: 'blip' },
  // แฟนแฟร์ตอนได้ปลา — ยิ่งหายากยิ่งอลัง; legendary duck เพลงให้เสียงเด้ง
  'catch.common': { kind: 'synth', synth: 'fanfare', tier: 'common' },
  'catch.rare': { kind: 'synth', synth: 'fanfare', tier: 'rare' },
  'catch.epic': { kind: 'synth', synth: 'fanfare', tier: 'epic', duck: 0.5 },
  'catch.legendary': { kind: 'synth', synth: 'fanfare', tier: 'legendary', duck: 0.3 },
};

export const BGM: Record<BgmKey, BgmDef> = {
  'bgm.day': { kind: 'synth', mood: 'day' },
  'bgm.night': { kind: 'synth', mood: 'night' },
};
