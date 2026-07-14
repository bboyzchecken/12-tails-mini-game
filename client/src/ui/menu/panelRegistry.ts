/**
 * ★ Source of truth เดียวของ panel ทุกตัวในเกม (12tails-panel-control-plan.md §2.3)
 * Grid ของ MenuHub, deep-link, badge อ่านจากลิสต์นี้เท่านั้น — ห้าม hardcode
 * รายการ panel หรือสร้างปุ่มลอยเปิด panel ที่อื่น
 *
 * จะเพิ่ม PanelId ใหม่ได้ต้องมีที่มาใน roadmap ก่อน (ui-roadmap / web-BUILD-PLAN /
 * fishing docs) — ห้ามเพิ่มปุ่มตามเกมอื่น. เบ็ด/เหยื่อ = ของใน 'fishshop' ไม่ใช่ panel
 * แยก; มินิเกมตีเบ็ด = overlay จากจุดตกปลา (กด F) ไม่ใช่ปุ่มเมนู; Collection/Gacha/
 * BattlePass/Supporter = แท็บใน StoreModal (แผน §3.2)
 */

export type PanelId =
  // fishing cluster (Phase F)
  | 'bag' | 'fishdex' | 'fishshop' | 'fishmarket'
  // shop cluster (U4–U5 + season Phase 5)
  | 'shop' | 'customize' | 'event'
  // social/growth (F2–F3)
  | 'ranking' | 'invite'
  // system (Phase P + ของที่มีอยู่)
  | 'profile' | 'settings';

/** live/stub = เปิดใช้ได้จริง · planned = ยังไม่มีระบบ → หน้า "เร็วๆ นี้" · locked = premium-gated */
export type PanelStatus = 'live' | 'stub' | 'planned' | 'locked';
export type PanelGate = 'guest-ok' | 'account-required' | 'premium';
export type PanelGroup = 'fishing' | 'shop' | 'social' | 'system';

export interface PanelDef {
  id: PanelId;
  icon: string; // inline SVG (Lucide-style, ISC) — icon เป็น SVG ไม่ใช่ emoji ตาม UI rule
  labelTH: string;
  group: PanelGroup;
  status: PanelStatus;
  gate?: PanelGate;
  /** คำอธิบายสั้นบนหน้า "เร็วๆ นี้" (เฉพาะ panel ที่ยังไม่มีระบบจริง) */
  comingSoonTH?: string;
}

/* Lucide icons (ISC) — inline SVG แพตเทิร์นเดียวกับ PlayerHUD */
const svg = (paths: string) =>
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';

export const ICON_MENU = svg(
  '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
);

const ICONS: Record<PanelId, string> = {
  shop: svg(
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  ),
  customize: svg(
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  ),
  profile: svg(
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  ),
  bag: svg(
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>' +
    '<path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>',
  ),
  fishdex: svg(
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  ),
  fishshop: svg(
    '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/>' +
    '<path d="M18 12v.5"/><path d="M7 10.7C7 8 5.6 6 2.7 5.5c-1 1.5-1 5.5 0 7C5.6 12 7 10 7 10.7"/>',
  ),
  fishmarket: svg(
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  ),
  event: svg(
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  ),
  ranking: svg(
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/>' +
    '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>' +
    '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  ),
  invite: svg(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
    '<line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  ),
  settings: svg(
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  ),
};

/**
 * ลำดับใน array = ลำดับแสดงใน grid: ของที่ใช้ได้จริงขึ้นก่อน แล้วค่อย "เร็วๆ นี้"
 * ตามลำดับเฟส (fishing PA3 → growth PA4 → เฟสหลัง)
 */
export const PANELS: PanelDef[] = [
  { id: 'shop', icon: ICONS.shop, labelTH: 'ร้านค้า', group: 'shop', status: 'live', gate: 'guest-ok' },
  { id: 'customize', icon: ICONS.customize, labelTH: 'แต่งตัว', group: 'shop', status: 'live', gate: 'guest-ok' },
  { id: 'profile', icon: ICONS.profile, labelTH: 'โปรไฟล์', group: 'system', status: 'stub', gate: 'guest-ok' },
  {
    id: 'bag', icon: ICONS.bag, labelTH: 'กระเป๋า', group: 'fishing', status: 'planned',
    gate: 'account-required',
    comingSoonTH: 'เก็บปลาที่ตกได้และของสายตกปลา ขายปลาแลกเป็น "เกล็ด" ได้',
  },
  {
    id: 'fishdex', icon: ICONS.fishdex, labelTH: 'สมุดปลา', group: 'fishing', status: 'planned',
    gate: 'account-required',
    comingSoonTH: 'สมุดสะสมปลา — ตกครบเซ็ตปลดของแต่งตัวพิเศษ',
  },
  {
    id: 'fishshop', icon: ICONS.fishshop, labelTH: 'ร้านตกปลา', group: 'fishing', status: 'planned',
    gate: 'account-required',
    comingSoonTH: 'ร้านคันเบ็ดกับเหยื่อ ซื้อด้วยเกล็ดจากการขายปลา (ไม่ใช้ Jil)',
  },
  {
    id: 'event', icon: ICONS.event, labelTH: 'อีเวนต์', group: 'shop', status: 'planned',
    gate: 'guest-ok',
    comingSoonTH: 'รวมซีซัน/คอลเลกชันที่กำลังเปิดขาย พร้อมเวลานับถอยหลัง',
  },
  {
    id: 'ranking', icon: ICONS.ranking, labelTH: 'อันดับ', group: 'social', status: 'planned',
    gate: 'guest-ok',
    comingSoonTH: 'อันดับนักตกปลา และประกาศคนที่ตกปลาหายากได้',
  },
  {
    id: 'invite', icon: ICONS.invite, labelTH: 'ชวนเพื่อน', group: 'social', status: 'planned',
    gate: 'account-required',
    comingSoonTH: 'ชวนเพื่อนมาเล่นด้วยกัน ครบตามเป้าปลดคันเบ็ดฟรี',
  },
  {
    id: 'fishmarket', icon: ICONS.fishmarket, labelTH: 'ตลาดปลา', group: 'fishing', status: 'planned',
    gate: 'account-required',
    comingSoonTH: 'ตลาดปลาราคาขึ้นลงตามช่วงเวลา ขายถูกจังหวะได้เกล็ดเพิ่ม',
  },
  {
    id: 'settings', icon: ICONS.settings, labelTH: 'ตั้งค่า', group: 'system', status: 'planned',
    gate: 'guest-ok',
    comingSoonTH: 'รวมการตั้งค่า เสียง เพลง กลางวัน-กลางคืน ไว้ที่เดียว',
  },
];
