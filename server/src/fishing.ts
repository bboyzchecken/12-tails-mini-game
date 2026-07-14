import type { FishingResult, FishTier } from '@12tails/shared/events';
import { CONFIG } from '@12tails/shared/config';

/**
 * ตกปลา — ผลตัดสินที่ server ทั้งหมด (spec §5): สุ่มปลาจาก loot table ของจุด
 * แล้วโรลติด/หลุดตาม chance ของ tier · client แค่เล่นอนิเมชันตามผลนี้ ห้ามสุ่มเอง
 * (กันแก้ค่าใน memory ให้ได้ 100% หรือเสกไอเทม)
 */

const FISHING = CONFIG.FISHING;
type SpotDef = (typeof FISHING.SPOTS)[number];
type FishDef = (typeof FISHING.FISH)[number];

const SPOTS = new Map<string, SpotDef>(FISHING.SPOTS.map((s) => [s.id, s]));
const FISH = new Map<string, FishDef>(FISHING.FISH.map((f) => [f.id, f]));

/** สุ่มปลาจาก loot table ตามน้ำหนัก (weighted pick) */
function pickFish(spot: SpotDef): FishDef | undefined {
  const total = spot.loot.reduce((sum, e) => sum + e.w, 0);
  let roll = Math.random() * total;
  for (const entry of spot.loot) {
    roll -= entry.w;
    if (roll < 0) return FISH.get(entry.fish);
  }
  return FISH.get(spot.loot[spot.loot.length - 1]?.fish ?? '');
}

/** ตัดสินผลตกปลาหนึ่งครั้ง — undefined = spotId ไม่รู้จัก (ทิ้งไป) */
export function rollFishing(spotId: string): FishingResult | undefined {
  const spot = SPOTS.get(spotId);
  if (!spot) return undefined;
  const fish = pickFish(spot);
  if (!fish) return undefined;

  const tier = fish.tier as FishTier;
  const tierDef = FISHING.TIERS[tier];
  const caught = Math.random() < tierDef.chance;

  return {
    spotId,
    fishId: fish.id,
    tier,
    caught,
    chance: tierDef.chance,
    price: tierDef.price,
  };
}

/** ควรประกาศกลางแชทไหม (สร้าง hype) — เฉพาะที่ตกติด และหายากระดับ epic ขึ้นไป */
export function shouldAnnounce(r: FishingResult): boolean {
  return r.caught && (r.tier === 'epic' || r.tier === 'legendary');
}
