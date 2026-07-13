/**
 * The 12 tribes, mirrored from 12tails-characters-seed.md (roster order). `ready`
 * marks the two with finished art (wolf + sheep, the first pair built). Real art
 * is dropped into /public later — until then the card shows a placeholder slot.
 */
export interface Tribe {
  id: string;
  th: string;
  en: string;
  klass: string; // in-game class / role
  color: string; // per-tribe brand color (from the seed)
  ready?: boolean;
}

export const TRIBES: Tribe[] = [
  { id: 'cat', th: 'แมว', en: 'Cat', klass: 'Rogue', color: '#E7B24A' },
  { id: 'wolf', th: 'หมาป่า', en: 'Wolf', klass: 'Swordsman', color: '#8C7A6B', ready: true },
  { id: 'monkey', th: 'ลิง', en: 'Monkey', klass: 'Summoner', color: '#B5793E' },
  { id: 'bat', th: 'ค้างคาว', en: 'Bat', klass: 'Dark Mage', color: '#6B5E86' },
  { id: 'sheep', th: 'แกะ', en: 'Sheep', klass: 'Priest', color: '#D9C7A6', ready: true },
  { id: 'rabbit', th: 'กระต่าย', en: 'Rabbit', klass: 'Sniper', color: '#E8C6C0' },
  { id: 'panda', th: 'แพนด้า', en: 'Panda', klass: 'Brawler', color: '#3B3B3B' },
  { id: 'penguin', th: 'เพนกวิน', en: 'Penguin', klass: 'Mage', color: '#2E4A66' },
  { id: 'mole', th: 'ตุ่น', en: 'Mole', klass: 'Engineer', color: '#7A5C48' },
  { id: 'bison', th: 'ไบสัน', en: 'Bison', klass: 'Tank', color: '#5C4433' },
  { id: 'whale', th: 'วาฬ', en: 'Whale', klass: 'Guardian', color: '#4C7EA0' },
  { id: 'chameleon', th: 'กิ้งก่า', en: 'Chameleon', klass: 'Archer', color: '#6FA85C' },
];
