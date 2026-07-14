import { CONFIG } from '@12tails/shared/config';
import type { FishTier } from '@12tails/shared/events';

/**
 * Visual manifest ของระบบตกปลา (context-brief §2 ฉบับภาพ)
 *
 * ตอนนี้ทุกปลาเป็น placeholder (emoji + สี tier) — พอมีอาร์ตจริงเปลี่ยน entry เป็น
 *     carp: { kind: 'image', url: 'assets/fishing/fish/carp.png' }
 * โค้ด overlay เช็ค kind แล้ววาด <img> แทน emoji — logic ไม่ต้องแก้
 *
 * สี tier ดึงจาก CONFIG.FISHING.TIERS (ชุดเดียวกับกรอบคอสตูมในร้าน → รู้สึกเป็นเกมเดียว)
 */

export type FishSprite =
  | { kind: 'placeholder'; emoji: string }
  | { kind: 'image'; url: string };

/** placeholder emoji ต่อปลา — ยังไม่มีอาร์ตจริง */
export const FISH_SPRITE: Record<string, FishSprite> = {
  carp: { kind: 'placeholder', emoji: '🐟' },
  catfish: { kind: 'placeholder', emoji: '🐡' },
  trout: { kind: 'placeholder', emoji: '🐠' },
  koi: { kind: 'placeholder', emoji: '🎏' },
  puffer: { kind: 'placeholder', emoji: '🐡' },
  dragon: { kind: 'placeholder', emoji: '🐉' },
};

export function fishSprite(fishId: string): FishSprite {
  return FISH_SPRITE[fishId] ?? { kind: 'placeholder', emoji: '🐟' };
}

/** ชื่อไทยของปลา (จาก CONFIG) */
export function fishName(fishId: string): string {
  return CONFIG.FISHING.FISH.find((f) => f.id === fishId)?.nameTH ?? 'ปลา';
}

/** สี + ป้ายของ tier (ชุดเดียวกับร้านคอสตูม) */
export function tierStyle(tier: FishTier): { color: string; label: string } {
  const t = CONFIG.FISHING.TIERS[tier];
  return { color: t.color, label: t.labelTH };
}

/** comic word ต่อ tier ตอนตกติด (BAM/POW/BOOM — spec §4 feedback อยู่ที่ 2D) */
export function catchWord(tier: FishTier): string {
  return { common: 'BAM!', rare: 'POW!', epic: 'BOOM!', legendary: 'LEGENDARY!' }[tier];
}
