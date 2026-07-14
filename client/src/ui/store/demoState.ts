import { CONFIG } from '@12tails/shared/config';
import type { FishTier } from '@12tails/shared/events';
import { gameToUI } from '../bus';
import { trackBuyIntent } from '../../net/track';

/**
 * Client-side DEMO economy (12tails-demo-monetization-plan.md): a fake Jil
 * wallet + a set of unlocked cosmetics, persisted in localStorage. NO real
 * money, NO server billing — buying just unlocks a preview locally. A reset
 * restores the starting state.
 *
 * Cosmetic id = `${heroId}:${type}:${index}` (type = 'color' | 'face').
 */

export type CosmeticType = 'color' | 'face' | 'weapon' | 'hat' | 'outfit';
export type Rarity = 'common' | 'rare' | 'epic';

const STORAGE_KEY = '12tails-demo-store-v1';
const START_JIL = 1200;
const START_SCALES = 0; // เกล็ด: สกุลเงินจากตกปลา (แยกจาก Jil เด็ดขาด — spec §2)

/** ราคาขายปลา (เกล็ด) จาก tier — lookup จาก CONFIG.FISHING */
const FISH_TIER = new Map<string, FishTier>(
  CONFIG.FISHING.FISH.map((f) => [f.id, f.tier as FishTier]),
);
export function fishPrice(fishId: string): number {
  const tier = FISH_TIER.get(fishId);
  return tier ? CONFIG.FISHING.TIERS[tier].price : 0;
}

interface Persisted {
  jil: number;
  owned: string[];
  scales?: number;
  caught?: Record<string, number>; // fishId -> จำนวนในกระเป๋า (ยังไม่ขาย)
}

export function cosmeticId(hero: string, type: CosmeticType, index: number): string {
  return `${hero}:${type}:${index}`;
}

/** The starter look (color/face index 0) is free/owned; equipment is not. */
function isFree(type: CosmeticType, index: number): boolean {
  return (type === 'color' || type === 'face') && index === 0;
}

/** Mock price in Jil (0 = free/owned by default). */
export function priceOf(type: CosmeticType, index: number): number {
  if (isFree(type, index)) return 0;
  if (type === 'color') return [0, 250, 400, 700, 1200][index] ?? 500;
  if (type === 'face') return 120 + index * 40; // faces climb gently
  if (type === 'weapon') return 350 + index * 45; // held gear costs more
  if (type === 'outfit') return 500 + index * 60; // full-body costumes priciest
  return 200 + index * 35; // hats
}

export function rarityOf(type: CosmeticType, index: number): Rarity {
  const p = priceOf(type, index);
  if (p >= 700) return 'epic';
  if (p >= 350) return 'rare';
  return 'common';
}

class DemoStore {
  private jil = START_JIL;
  private scales = START_SCALES;
  private owned = new Set<string>();
  private caught = new Map<string, number>(); // fishId -> count in inventory
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        this.jil = typeof p.jil === 'number' ? p.jil : START_JIL;
        this.scales = typeof p.scales === 'number' ? p.scales : START_SCALES;
        this.owned = new Set(Array.isArray(p.owned) ? p.owned : []);
        this.caught = new Map(Object.entries(p.caught ?? {}));
      }
    } catch {
      /* corrupt/absent — start fresh */
    }
  }

  private save() {
    try {
      const data: Persisted = {
        jil: this.jil,
        scales: this.scales,
        owned: [...this.owned],
        caught: Object.fromEntries(this.caught),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* private mode etc. — demo still works in-memory */
    }
  }

  private changed() {
    this.save();
    this.emitCurrency();
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Push the wallet to the HUD (via the game→UI bus). */
  emitCurrency() {
    gameToUI.emit('player:currency', { jil: this.jil, scales: this.scales });
  }

  getJil(): number {
    return this.jil;
  }

  // ---------------------------------------------------------------- ตกปลา

  getScales(): number {
    return this.scales;
  }

  /** เก็บปลาที่ตกได้เข้ากระเป๋า (ยังไม่ได้เกล็ดจนกว่าจะขาย — spec §8) */
  addFish(fishId: string) {
    this.caught.set(fishId, (this.caught.get(fishId) ?? 0) + 1);
    this.changed();
  }

  fishCount(fishId: string): number {
    return this.caught.get(fishId) ?? 0;
  }

  /** รายการปลาในกระเป๋า (fishId + จำนวน) เรียงตามลำดับใน CONFIG */
  inventory(): { fishId: string; count: number }[] {
    return CONFIG.FISHING.FISH.map((f) => ({ fishId: f.id, count: this.caught.get(f.id) ?? 0 })).filter(
      (e) => e.count > 0,
    );
  }

  /** ขายปลา 1 ตัว → ได้เกล็ดตามราคา tier · คืนจำนวนเกล็ดที่ได้ (0 = ไม่มีปลานั้น) */
  sellFish(fishId: string): number {
    const n = this.caught.get(fishId) ?? 0;
    if (n <= 0) return 0;
    const gain = fishPrice(fishId);
    if (n === 1) this.caught.delete(fishId);
    else this.caught.set(fishId, n - 1);
    this.scales += gain;
    this.changed();
    return gain;
  }

  /** ขายปลาทั้งกระเป๋า → คืนเกล็ดรวมที่ได้ */
  sellAll(): number {
    let total = 0;
    for (const [fishId, n] of this.caught) total += fishPrice(fishId) * n;
    this.caught.clear();
    this.scales += total;
    this.changed();
    return total;
  }

  isOwned(hero: string, type: CosmeticType, index: number): boolean {
    return isFree(type, index) || this.owned.has(cosmeticId(hero, type, index));
  }

  canAfford(type: CosmeticType, index: number): boolean {
    return this.jil >= priceOf(type, index);
  }

  /** Unlock a cosmetic with mock Jil. Returns true on success. */
  buy(hero: string, type: CosmeticType, index: number): boolean {
    if (this.isOwned(hero, type, index)) return true;
    const price = priceOf(type, index);
    if (this.jil < price) return false;
    this.jil -= price;
    this.owned.add(cosmeticId(hero, type, index));
    this.changed();
    // Phase 2: the local unlock above is the demo; this reports demand to the
    // funnel — someone would spend Jil on this item. NOT a real sale.
    trackBuyIntent({
      itemId: cosmeticId(hero, type, index),
      itemType: type,
      priceJil: price,
      hero,
      rarity: rarityOf(type, index),
    });
    return true;
  }

  isSeasonOwned(itemId: string): boolean {
    return this.owned.has(`season:${itemId}`);
  }

  /**
   * Buy a scheduled-season item (Phase 5 / S4). Unlike cosmetics these come from
   * the server's /store/active, so ownership is keyed by the item's server id and
   * buy_intent carries the collection_id/theme → the admin "ดีมานด์ต่อซีซัน"
   * chart. Still a DEMO unlock, never a real sale.
   */
  buySeasonItem(
    item: { id: string; type: string; priceJil: number; rarity?: string },
    collection: { id: string; theme?: string },
  ): boolean {
    const key = `season:${item.id}`;
    if (this.owned.has(key)) return true;
    if (this.jil < item.priceJil) return false;
    this.jil -= item.priceJil;
    this.owned.add(key);
    this.changed();
    trackBuyIntent({
      itemId: item.id,
      itemType: `season_${item.type}`,
      priceJil: item.priceJil,
      rarity: item.rarity,
      collectionId: collection.id,
      theme: collection.theme,
    });
    return true;
  }

  /** Grant a cosmetic for free (e.g. the look chosen at character select). */
  grant(hero: string, type: CosmeticType, index: number) {
    if (this.isOwned(hero, type, index)) return;
    this.owned.add(cosmeticId(hero, type, index));
    this.changed();
  }

  /** Mock top-up (demo only — never real money). */
  topUp(amount: number) {
    this.jil += amount;
    this.changed();
  }

  reset() {
    this.jil = START_JIL;
    this.scales = START_SCALES;
    this.owned.clear();
    this.caught.clear();
    this.changed();
  }
}

export const demoStore = new DemoStore();
