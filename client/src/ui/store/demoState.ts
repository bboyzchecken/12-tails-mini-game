import { CONFIG } from '@12tails/shared/config';
import type { FishTier } from '@12tails/shared/events';
import { gameToUI } from '../bus';
import { trackBuyIntent } from '../../net/track';
import {
  BATTLEPASS, COLLECTION, GACHA, collectionBundlePrice,
  type Reward,
} from './monetizationData';

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
  // U5 monetization demo (battle pass / supporter / gacha pity — all mock)
  bpPremium?: boolean;
  bpLevel?: number; // presenter-driven progress slider (0..maxLevel)
  bpClaimed?: string[]; // reward ids already claimed
  supporter?: string | null; // active supporter tier id
  pity?: number; // gacha pulls since the last epic
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
  // U5 monetization demo state (mock)
  private bpPremium = false;
  private bpLevel = 3; // start mid-track so the demo shows claimed + locked tiers
  private bpClaimed = new Set<string>();
  private supporter: string | null = null;
  private pity = 0;

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
        this.bpPremium = p.bpPremium === true;
        this.bpLevel = typeof p.bpLevel === 'number' ? p.bpLevel : 3;
        this.bpClaimed = new Set(Array.isArray(p.bpClaimed) ? p.bpClaimed : []);
        this.supporter = typeof p.supporter === 'string' ? p.supporter : null;
        this.pity = typeof p.pity === 'number' ? p.pity : 0;
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
        bpPremium: this.bpPremium,
        bpLevel: this.bpLevel,
        bpClaimed: [...this.bpClaimed],
        supporter: this.supporter,
        pity: this.pity,
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
    this.bpPremium = false;
    this.bpLevel = 3;
    this.bpClaimed.clear();
    this.supporter = null;
    this.pity = 0;
    this.changed();
  }

  // ------------------------------------------------ U5: Battle Pass (D2, mock)

  isBpPremium(): boolean {
    return this.bpPremium;
  }

  getBpLevel(): number {
    return this.bpLevel;
  }

  /** Presenter-driven progress slider — simulate climbing tiers. No cost. */
  setBpLevel(level: number) {
    this.bpLevel = Math.max(0, Math.min(BATTLEPASS.maxLevel, Math.round(level)));
    this.changed();
  }

  /** Unlock the premium track (mock Jil). Fires buy_intent 'battlepass'. */
  buyBpPremium(): boolean {
    if (this.bpPremium) return true;
    if (this.jil < BATTLEPASS.premiumPrice) return false;
    this.jil -= BATTLEPASS.premiumPrice;
    this.bpPremium = true;
    this.changed();
    trackBuyIntent({
      itemId: 'battlepass-premium',
      itemType: 'battlepass',
      priceJil: BATTLEPASS.premiumPrice,
      theme: 'summer',
    });
    return true;
  }

  isTierClaimed(rewardId: string): boolean {
    return this.bpClaimed.has(rewardId);
  }

  /** Claim a reached tier's reward (free always; premium needs the premium track). */
  claimTier(reward: Reward, track: 'free' | 'premium', level: number): boolean {
    if (this.bpClaimed.has(reward.id)) return true;
    if (level > this.bpLevel) return false; // tier not reached yet
    if (track === 'premium' && !this.bpPremium) return false;
    this.bpClaimed.add(reward.id);
    this.changed(); // claiming is a reward, not a spend — no buy_intent
    return true;
  }

  // ------------------------------------------------- U5: Supporter (D2, mock)

  supporterTier(): string | null {
    return this.supporter;
  }

  /** Subscribe to a supporter tier (mock monthly). Fires buy_intent 'supporter'. */
  subscribeSupporter(tierId: string, priceJil: number): boolean {
    if (this.jil < priceJil) return false;
    this.jil -= priceJil;
    this.supporter = tierId;
    this.changed();
    trackBuyIntent({ itemId: tierId, itemType: 'supporter', priceJil });
    return true;
  }

  // ------------------------------------------------ U5: Collection (D3, mock)

  isCollectionOwned(itemId: string): boolean {
    return this.owned.has(`col:${itemId}`);
  }

  /** Buy one collection piece directly (mock Jil). Fires buy_intent 'collection'. */
  buyCollectionItem(item: { id: string; priceJil: number; rarity: string }): boolean {
    if (this.isCollectionOwned(item.id)) return true;
    if (this.jil < item.priceJil) return false;
    this.jil -= item.priceJil;
    this.owned.add(`col:${item.id}`);
    this.changed();
    trackBuyIntent({
      itemId: item.id,
      itemType: 'collection',
      priceJil: item.priceJil,
      rarity: item.rarity,
      collectionId: COLLECTION.id,
      theme: COLLECTION.theme,
    });
    return true;
  }

  /** Buy the whole set at the bundle price (mock). Fires one buy_intent 'collection_bundle'. */
  buyCollectionBundle(): boolean {
    const price = collectionBundlePrice();
    if (this.jil < price) return false;
    this.jil -= price;
    for (const it of COLLECTION.items) this.owned.add(`col:${it.id}`);
    this.changed();
    trackBuyIntent({
      itemId: `${COLLECTION.id}-bundle`,
      itemType: 'collection_bundle',
      priceJil: price,
      collectionId: COLLECTION.id,
      theme: COLLECTION.theme,
    });
    return true;
  }

  // ----------------------------------------------------- U5: Gacha (D4, mock)

  getPity(): number {
    return this.pity;
  }

  isGachaOwned(itemId: string): boolean {
    return this.owned.has(`gacha:${itemId}`);
  }

  /**
   * One gacha pull (mock Jil). Server-less demo: rolls by the PUBLISHED odds with a
   * pity guarantee at GACHA.pityMax. Spending Jil = demand → buy_intent 'gacha'.
   * Returns the reward, or null if too little Jil.
   */
  pullGacha(): { reward: Reward; rarity: Rarity; guaranteed: boolean } | null {
    if (this.jil < GACHA.pullCost) return null;
    this.jil -= GACHA.pullCost;

    const guaranteed = this.pity + 1 >= GACHA.pityMax;
    const rarity: Rarity = guaranteed ? 'epic' : rollGachaRarity();
    if (rarity === 'epic') this.pity = 0;
    else this.pity += 1;

    const pool = GACHA.pool[rarity];
    const reward = pool[Math.floor(Math.random() * pool.length)];
    this.owned.add(`gacha:${reward.id}`);
    this.changed();
    trackBuyIntent({ itemId: reward.id, itemType: 'gacha', priceJil: GACHA.pullCost, rarity });
    return { reward, rarity, guaranteed };
  }

  /** Buy a specific gacha reward directly, no RNG (mock). Fires buy_intent 'gacha_direct'. */
  buyGachaDirect(reward: Reward): boolean {
    if (this.isGachaOwned(reward.id)) return true;
    const price = GACHA.directPrice[reward.rarity];
    if (this.jil < price) return false;
    this.jil -= price;
    this.owned.add(`gacha:${reward.id}`);
    this.changed();
    trackBuyIntent({
      itemId: reward.id,
      itemType: 'gacha_direct',
      priceJil: price,
      rarity: reward.rarity,
    });
    return true;
  }
}

/** Weighted rarity roll from the published gacha odds (percentages sum to 100). */
function rollGachaRarity(): Rarity {
  const r = Math.random() * 100;
  let acc = 0;
  for (const o of GACHA.odds) {
    acc += o.pct;
    if (r < acc) return o.rarity;
  }
  return 'common';
}

export const demoStore = new DemoStore();
