export type Direction = 'down' | 'up' | 'left' | 'right';

export interface PlayerState {
  id: string;          // socket id
  characterId: string; // key ใน characters.json
  name: string;
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
  'player:join': (p: { characterId: string; name: string; x: number; y: number; dir: Direction }) => void;
  'player:move': (p: { x: number; y: number; dir: Direction; moving: boolean }) => void;
  'chat:send':   (p: { text: string }) => void;
  'emote:send':  (p: { emoteId: string }) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'world:snapshot': (p: { players: PlayerState[] }) => void;       // ส่งให้คนเพิ่งเข้า
  'player:joined':  (p: { player: PlayerState }) => void;
  'player:moved':   (p: { id: string; x: number; y: number; dir: Direction; moving: boolean }) => void;
  'player:left':    (p: { id: string }) => void;
  'chat:message':   (m: ChatMessage) => void;
  'emote:played':   (p: { id: string; emoteId: string }) => void;
}
