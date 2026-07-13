/**
 * The 12 tribes, mirrored from 12tails-characters-seed.md (roster order). All 12
 * are playable now. `color` is the per-tribe brand color; `role` is a short Thai
 * blurb of the in-game class fantasy (shown on the roster cards). Portraits live
 * at /characters/<id>.png (real in-game avatars).
 */
export interface Tribe {
  id: string;
  th: string;
  en: string;
  klass: string; // in-game class
  role: string; // short Thai role blurb
  color: string; // per-tribe brand color (from the seed)
}

export const TRIBES: Tribe[] = [
  { id: 'cat', th: 'แมว', en: 'Cat', klass: 'Rogue', role: 'ประชิดไว ปามีดไกล', color: '#E7B24A' },
  { id: 'wolf', th: 'หมาป่า', en: 'Wolf', klass: 'Swordsman', role: 'ดาบระยะกลาง คุมทีม', color: '#6FB9C9' },
  { id: 'monkey', th: 'ลิง', en: 'Monkey', klass: 'Summoner', role: 'อัญเชิญอสูรไฟ/ดิน', color: '#B5793E' },
  { id: 'bat', th: 'ค้างคาว', en: 'Bat', klass: 'Dark Mage', role: 'เวทมืด ดีบัฟ แยกร่าง', color: '#8C7DB0' },
  { id: 'sheep', th: 'แกะ', en: 'Sheep', klass: 'Priest', role: 'ฮีลเลอร์ บัฟทีม', color: '#C9A96A' },
  { id: 'rabbit', th: 'กระต่าย', en: 'Rabbit', klass: 'Sniper', role: 'ยิงไกล ผสมยาบัฟ', color: '#E8A0B0' },
  { id: 'panda', th: 'แพนด้า', en: 'Panda', klass: 'Brawler', role: 'คอมโบหมัด เร่ง SP', color: '#5B5B5B' },
  { id: 'penguin', th: 'เพนกวิน', en: 'Penguin', klass: 'Mage', role: 'เวทวงกว้าง ชาร์จ MP', color: '#3E6E96' },
  { id: 'mole', th: 'ตุ่น', en: 'Mole', klass: 'Engineer', role: 'ป้อมปืน หุ่นยนต์ กับระเบิด', color: '#A0785C' },
  { id: 'bison', th: 'ไบสัน', en: 'Bison', klass: 'Tank', role: 'ขวางแทงค์ บัฟโจมตี', color: '#8A6844' },
  { id: 'whale', th: 'วาฬ', en: 'Whale', klass: 'Guardian', role: 'กันภัย ปกป้องทีม', color: '#4C9AC0' },
  { id: 'chameleon', th: 'กิ้งก่า', en: 'Chameleon', klass: 'Archer', role: 'ธนูว่องไว พราง วางกับดัก', color: '#7FB86C' },
];

/** A curated set of real in-game emotes (asset ids under /emotes/<id>.png). */
export const EMOTES: { id: string; label: string }[] = [
  { id: 'smile', label: 'ยิ้ม' },
  { id: 'haha', label: 'ฮา' },
  { id: 'heart', label: 'หัวใจ' },
  { id: 'wave', label: 'โบกมือ' },
  { id: 'dance', label: 'เต้น' },
  { id: 'cheer', label: 'เชียร์' },
  { id: 'cry', label: 'ร้องไห้' },
  { id: 'angry', label: 'โกรธ' },
  { id: 'blush', label: 'เขิน' },
  { id: 'pose', label: 'โพส' },
  { id: 'rock', label: 'ร็อก' },
  { id: 'sleep', label: 'ง่วง' },
];
