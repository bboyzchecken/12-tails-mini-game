import { gameToUI } from '../bus';

/**
 * Client-side DEMO economy (12tails-demo-monetization-plan.md): a fake Jil
 * wallet + a set of unlocked cosmetics, persisted in localStorage. NO real
 * money, NO server billing — buying just unlocks a preview locally. A reset
 * restores the starting state.
 *
 * Cosmetic id = `${heroId}:${type}:${index}` (type = 'color' | 'face').
 */

export type CosmeticType = 'color' | 'face';
export type Rarity = 'common' | 'rare' | 'epic';

const STORAGE_KEY = '12tails-demo-store-v1';
const START_JIL = 1200;
const DEMO_COINS = 300; // second currency, static in the demo

interface Persisted {
  jil: number;
  owned: string[];
}

export function cosmeticId(hero: string, type: CosmeticType, index: number): string {
  return `${hero}:${type}:${index}`;
}

/** Index 0 of each type is the free starter look — owned from the start. */
function isFree(_type: CosmeticType, index: number): boolean {
  return index === 0;
}

/** Mock price in Jil (0 = free/owned by default). */
export function priceOf(type: CosmeticType, index: number): number {
  if (isFree(type, index)) return 0;
  if (type === 'color') return [0, 250, 400, 700, 1200][index] ?? 500;
  return 120 + index * 40; // faces climb gently
}

export function rarityOf(type: CosmeticType, index: number): Rarity {
  const p = priceOf(type, index);
  if (p >= 700) return 'epic';
  if (p >= 350) return 'rare';
  return 'common';
}

class DemoStore {
  private jil = START_JIL;
  private owned = new Set<string>();
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
        this.owned = new Set(Array.isArray(p.owned) ? p.owned : []);
      }
    } catch {
      /* corrupt/absent — start fresh */
    }
  }

  private save() {
    try {
      const data: Persisted = { jil: this.jil, owned: [...this.owned] };
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
    gameToUI.emit('player:currency', { jil: this.jil, coins: DEMO_COINS });
  }

  getJil(): number {
    return this.jil;
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
    this.owned.clear();
    this.changed();
  }
}

export const demoStore = new DemoStore();
