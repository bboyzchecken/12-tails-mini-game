export type Direction = 'down' | 'up' | 'left' | 'right';

/** How a character is customized — indices into that hero's cosmetics sets. */
export interface Appearance {
  color: number; // body-color variant (assets/cosmetics/<id>/color/<n>.png)
  face: number;  // face overlay      (assets/cosmetics/<id>/face/<n>.png)
  /** Equipment ids attached to mount bones (assets/equipment/<id>/<slot>/<name>.glb),
   *  or null/absent for an empty slot. */
  weapon?: string | null; // held in hand (mount_Hand_R)
  hat?: string | null;    // worn overhead (mount_OverHead)
  /** Body-costume id — a full-body skinned mesh swapped onto the shared rig
   *  (assets/costumes/<id>/<outfit>.glb), exactly as the game grafts costumes.
   *  null/absent = the bare "nude" base body baked into the character glb. The
   *  starter outfit is 'scout' (see shared/config.ts DEFAULT_OUTFIT). */
  outfit?: string | null;
}

export interface PlayerState {
  id: string;          // socket id
  characterId: string; // key ใน characters.json
  name: string;
  familyName?: string; // ชื่อ family ของบัญชี (บรรทัดบนของ nameplate); ว่าง = guest
  appearance: Appearance;
  x: number;
  y: number;
  dir: Direction;
  moving: boolean;
}

export interface ChatMessage {
  id: string;   // sender socket id
  name: string;
  text: string;
  ts: number;
}

export type FishTier = 'common' | 'rare' | 'epic' | 'legendary';

/** ผลตกปลาที่ server ชี้ขาด (client เล่นอนิเมชันตามนี้ ห้ามสุ่มเอง — spec §5) */
export interface FishingResult {
  spotId: string;
  fishId: string;     // id ใน CONFIG.FISHING.FISH
  tier: FishTier;
  caught: boolean;    // ติด (true) หรือ หลุด (false)
  chance: number;     // %โอกาสจับที่โชว์บนจอ (0..1) — ค่าที่ server ใช้ตัดสิน
  price: number;      // ราคาขาย (เกล็ด) ถ้าเก็บแล้วขาย
}

// Client -> Server
export interface ClientToServerEvents {
  'player:join': (p: { characterId: string; name: string; familyName?: string; appearance: Appearance; x: number; y: number; dir: Direction }) => void;
  'player:move': (p: { x: number; y: number; dir: Direction; moving: boolean }) => void;
  'chat:send':   (p: { text: string }) => void;
  'emote:send':  (p: { emoteId: string }) => void;
  'appearance:set': (p: { appearance: Appearance }) => void;
  'fishing:cast': (p: { spotId: string }) => void; // ขอเริ่มตกปลาที่จุดนี้ (server ตัดสินผล)
}

// Server -> Client
export interface ServerToClientEvents {
  'world:snapshot': (p: { players: PlayerState[] }) => void;       // ส่งให้คนเพิ่งเข้า
  'player:joined':  (p: { player: PlayerState }) => void;
  'player:moved':   (p: { id: string; x: number; y: number; dir: Direction; moving: boolean }) => void;
  'player:left':    (p: { id: string }) => void;
  'chat:message':   (m: ChatMessage) => void;
  'emote:played':   (p: { id: string; emoteId: string }) => void;
  'appearance:changed': (p: { id: string; appearance: Appearance }) => void;
  'fishing:started': (p: { id: string }) => void;                                // มีคนเริ่มตกปลา — ทุกคนเห็น (นั่ง + บอลลูน 🎣 เหนือหัว)
  'fishing:resolved': (p: { id: string; fishId: string; tier: FishTier; caught: boolean }) => void; // จบรอบ — ทุกคนเห็นผล (บอลลูนปลา/หลุด แทนที่ 🎣)
  'fishing:result': (r: FishingResult) => void;                                  // ส่งกลับเฉพาะคนตก (รายละเอียดเต็ม: %จับ/ราคา)
  'fishing:announce': (p: { name: string; fishId: string; tier: FishTier }) => void; // ประกาศ epic/legendary ให้ทุกคน (hype กลางแชท)
}
