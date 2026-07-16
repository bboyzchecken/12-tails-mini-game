import type { Rarity } from './demoState';

/**
 * DEMO monetization surfaces (12tails-ui-roadmap.md U5 · 12tails-demo-monetization-plan.md
 * D2–D4). Pure client-side data — battle pass tracks, supporter tiers, a themed
 * collection bundle, and a gacha pool with published odds + pity. NOTHING here is a
 * real sale: every "buy" is a mock Jil unlock that fires a `buy_intent` demand signal
 * (see demoState). Prices/odds live beside the demo economy in demoState.priceOf, by the
 * codebase's existing convention (the demo wallet is client-only, never server-billed).
 */

export interface Reward {
  id: string;
  name: string;
  rarity: Rarity;
}

// ── Battle Pass (U5 / D2) — free vs premium track, a presenter-driven progress slider ──
export interface BattlePassTier {
  level: number;
  free?: Reward;
  premium?: Reward;
}

export const BATTLEPASS: {
  season: string;
  premiumPrice: number;
  maxLevel: number;
  tiers: BattlePassTier[];
} = {
  season: 'ฤดูร้อน 2026',
  premiumPrice: 900,
  maxLevel: 10,
  tiers: [
    { level: 1, free: { id: 'bp-f1', name: 'กรอบแชทมิ้นต์', rarity: 'common' } },
    { level: 2, premium: { id: 'bp-p2', name: 'หมวกฟางลายซัมเมอร์', rarity: 'rare' } },
    { level: 3, free: { id: 'bp-f3', name: 'อิโมตกินไอติม', rarity: 'common' } },
    { level: 4, premium: { id: 'bp-p4', name: 'ปีกผีเสื้อเรืองแสง', rarity: 'epic' } },
    { level: 5, free: { id: 'bp-f5', name: 'สีตัวฟ้าทะเล', rarity: 'common' } },
    { level: 6, premium: { id: 'bp-p6', name: 'ห่วงยางเป็ดน้อย', rarity: 'rare' } },
    { level: 7, free: { id: 'bp-f7', name: 'อิโมตโบกมือ', rarity: 'common' } },
    { level: 8, premium: { id: 'bp-p8', name: 'แว่นดำนักสืบ', rarity: 'rare' } },
    { level: 9, free: { id: 'bp-f9', name: 'กรอบแชทลายคลื่น', rarity: 'common' } },
    { level: 10, premium: { id: 'bp-p10', name: 'มงกุฎปะการังทอง', rarity: 'epic' } },
  ],
};

// ── Supporter (U5 / D2) — monthly tiers, mock subscribe → badge/room/emote perks ──
export interface SupporterTier {
  id: string;
  name: string;
  priceJil: number;
  accentVar: string; // a --ui-* token name; never a hardcoded hex (UI rule)
  perks: string[];
}

export const SUPPORTER_TIERS: SupporterTier[] = [
  {
    id: 'sup-friend',
    name: 'เพื่อนซี้',
    priceJil: 300,
    accentVar: '--ui-accent-2',
    perks: ['ป้าย "ผู้สนับสนุน" หน้าชื่อ', 'อิโมตพิเศษ 1 ชุด'],
  },
  {
    id: 'sup-patron',
    name: 'ผู้อุปถัมภ์',
    priceJil: 700,
    accentVar: '--ui-accent',
    perks: ['ทุกสิทธิ์ของเพื่อนซี้', 'เข้าห้องแชทพิเศษ', 'กรอบชื่อสีทอง'],
  },
  {
    id: 'sup-legend',
    name: 'ตำนานคอมมู',
    priceJil: 1500,
    accentVar: '--ui-danger',
    perks: ['ทุกสิทธิ์ของผู้อุปถัมภ์', 'อิโมตพิเศษครบทุกชุด', 'ชื่อเรืองแสงในแมพ'],
  },
];

// ── Collection (U5 / D3) — a themed set: buy pieces OR the whole set (direct, bundle-priced) ──
export interface CollectionItem extends Reward {
  priceJil: number;
}

export const COLLECTION: {
  id: string;
  theme: string;
  name: string;
  bundleDiscount: number; // 0.2 = 20% off the sum of pieces
  items: CollectionItem[];
} = {
  id: 'summer-set-2026',
  theme: 'summer',
  name: 'ชุดฤดูร้อน 2026',
  bundleDiscount: 0.2,
  items: [
    { id: 'sum-hat', name: 'หมวกฟางริมทะเล', rarity: 'rare', priceJil: 400 },
    { id: 'sum-shirt', name: 'เสื้อฮาวายลายดอก', rarity: 'rare', priceJil: 500 },
    { id: 'sum-float', name: 'ห่วงยางเป็ดยักษ์', rarity: 'epic', priceJil: 800 },
    { id: 'sum-glass', name: 'แว่นกันแดดสุดคูล', rarity: 'common', priceJil: 250 },
  ],
};

/** Full-set price after the bundle discount (rounded to a tidy 10). */
export function collectionBundlePrice(): number {
  const sum = COLLECTION.items.reduce((t, it) => t + it.priceJil, 0);
  return Math.round((sum * (1 - COLLECTION.bundleDiscount)) / 10) * 10;
}

// ── Gacha (U5 / D4) — mock top-up → random pull, PUBLISHED odds + pity + direct-buy ──
export interface GachaOdds {
  rarity: Rarity;
  pct: number;
}

export const GACHA: {
  name: string;
  pullCost: number;
  pityMax: number; // pulls without an epic that guarantee one
  odds: GachaOdds[];
  pool: Record<Rarity, Reward[]>;
  directPrice: Record<Rarity, number>;
} = {
  name: 'ถุงสุ่มฤดูร้อน',
  pullCost: 150,
  pityMax: 20,
  odds: [
    { rarity: 'common', pct: 70 },
    { rarity: 'rare', pct: 25 },
    { rarity: 'epic', pct: 5 },
  ],
  pool: {
    common: [
      { id: 'g-c1', name: 'ปลาการ์ตูนยาง', rarity: 'common' },
      { id: 'g-c2', name: 'พัดคลายร้อน', rarity: 'common' },
      { id: 'g-c3', name: 'สายรัดข้อมือเชือก', rarity: 'common' },
    ],
    rare: [
      { id: 'g-r1', name: 'หมวกกัปตันเรือ', rarity: 'rare' },
      { id: 'g-r2', name: 'ผ้าพันคอลายคลื่น', rarity: 'rare' },
    ],
    epic: [
      { id: 'g-e1', name: 'ปีกนางเงือกเรืองแสง', rarity: 'epic' },
      { id: 'g-e2', name: 'มงกุฎเปลือกหอยทอง', rarity: 'epic' },
    ],
  },
  directPrice: { common: 300, rare: 700, epic: 1800 },
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'ธรรมดา',
  rare: 'หายาก',
  epic: 'เอปิก',
};
