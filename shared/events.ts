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

// Client -> Server
export interface ClientToServerEvents {
  'player:join': (p: { characterId: string; name: string; familyName?: string; appearance: Appearance; x: number; y: number; dir: Direction }) => void;
  'player:move': (p: { x: number; y: number; dir: Direction; moving: boolean }) => void;
  'chat:send':   (p: { text: string }) => void;
  'emote:send':  (p: { emoteId: string }) => void;
  'appearance:set': (p: { appearance: Appearance }) => void;
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
}
