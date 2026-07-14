import type { Server, Socket } from 'socket.io';
import type {
  Appearance,
  ChatMessage,
  ClientToServerEvents,
  Direction,
  PlayerState,
  ServerToClientEvents,
} from '@12tails/shared/events';
import { CONFIG } from '@12tails/shared/config';
import { world } from './world';
import { rollFishing, shouldAnnounce } from './fishing';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

const DIRS: readonly Direction[] = ['down', 'up', 'left', 'right'];

function safeDir(d: unknown): Direction {
  return DIRS.includes(d as Direction) ? (d as Direction) : 'down';
}

function safeNum(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/** Clamp appearance indices to small non-negative ints (client validates ranges). */
function safeAppearance(a: unknown): Appearance {
  const o = (a ?? {}) as Partial<Appearance>;
  const idx = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(255, Math.floor(n))) : 0;
  const equip = (s: unknown) =>
    typeof s === 'string' && s ? s.slice(0, 48).replace(/[^\w-]/g, '') : null;
  return {
    color: idx(o.color),
    face: idx(o.face),
    weapon: equip(o.weapon),
    hat: equip(o.hat),
    outfit: equip(o.outfit),
  };
}

function safeName(name: unknown): string {
  return (
    String(name ?? '')
      .replace(/[<>]/g, '') // keep name tags HTML-safe
      .trim()
      .slice(0, CONFIG.NAME_MAX_LEN) || 'ผู้เล่น'
  );
}

/** Family name (nameplate top line). Empty stays empty (guests have none). */
function safeFamily(name: unknown): string {
  return String(name ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, CONFIG.NAME_MAX_LEN);
}

/** Always sanitize chat on the server: strip HTML, collapse whitespace, cap length. */
function sanitizeChat(raw: unknown): string {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.CHAT_MAX_LEN);
}

/** Last emote timestamp per socket — server-side spam guard. */
const lastEmoteAt = new Map<string, number>();
/** Last fishing-cast timestamp per socket — throttles the authoritative roll. */
const lastCastAt = new Map<string, number>();
/** Suspense timer of the round in flight per socket (server owns round timing). */
const pendingCast = new Map<string, NodeJS.Timeout>();

export function registerHandlers(io: IO, socket: Sock) {
  socket.on('player:join', (p) => {
    const player: PlayerState = {
      id: socket.id,
      characterId: String(p.characterId ?? '').slice(0, 32),
      name: safeName(p.name),
      familyName: safeFamily(p.familyName) || undefined,
      appearance: safeAppearance(p.appearance),
      x: safeNum(p.x, CONFIG.SPAWN.x),
      y: safeNum(p.y, CONFIG.SPAWN.y),
      dir: safeDir(p.dir),
      moving: false,
    };
    world.add(player);
    // Full state for the newcomer; just the newcomer for everyone else.
    socket.emit('world:snapshot', { players: world.snapshot() });
    socket.broadcast.emit('player:joined', { player });
    console.log(`[server] join: ${player.name} (${player.characterId}) · ${world.count} online`);
  });

  socket.on('player:move', (p) => {
    const updated = world.update(socket.id, {
      x: safeNum(p.x, 0),
      y: safeNum(p.y, 0),
      dir: safeDir(p.dir),
      moving: p.moving === true,
    });
    if (!updated) return;
    socket.broadcast.emit('player:moved', {
      id: socket.id,
      x: updated.x,
      y: updated.y,
      dir: updated.dir,
      moving: updated.moving,
    });
  });

  socket.on('chat:send', (p) => {
    const player = world.get(socket.id);
    if (!player) return; // must join before chatting
    const text = sanitizeChat(p?.text);
    if (!text) return; // whitespace-only / empty after sanitize — drop
    const msg: ChatMessage = { id: socket.id, name: player.name, text, ts: Date.now() };
    io.emit('chat:message', msg); // everyone, sender included (single render path)
  });

  socket.on('emote:send', (p) => {
    if (!world.get(socket.id)) return; // must join before emoting
    const emoteId = String(p?.emoteId ?? '').slice(0, 32);
    if (!emoteId) return;
    const now = Date.now();
    const last = lastEmoteAt.get(socket.id) ?? 0;
    if (now - last < CONFIG.EMOTE_COOLDOWN_MS) return; // spam guard
    lastEmoteAt.set(socket.id, now);
    io.emit('emote:played', { id: socket.id, emoteId }); // id only — clients own the art
  });

  socket.on('appearance:set', (p) => {
    const appearance = safeAppearance(p?.appearance);
    if (!world.setAppearance(socket.id, appearance)) return; // must join first
    io.emit('appearance:changed', { id: socket.id, appearance });
  });

  socket.on('fishing:cast', (p) => {
    const player = world.get(socket.id);
    if (!player) return; // must join before fishing
    if (pendingCast.has(socket.id)) return; // รอบก่อนยังไม่เฉลย — ห้ามซ้อน
    const now = Date.now();
    const last = lastCastAt.get(socket.id) ?? 0;
    if (now - last < CONFIG.FISHING.MIN_CAST_INTERVAL_MS) return; // spam guard
    const spotId = String(p?.spotId ?? '').slice(0, 32);
    const result = rollFishing(spotId); // server ตัดสินผลทันที (สุ่มปลา + ติด/หลุด)
    if (!result) return; // spotId ไม่รู้จัก
    lastCastAt.set(socket.id, now);

    // SERVER เป็นเจ้าของจังหวะรอบ: บอกทุกคนว่า "เริ่มตก" (นั่ง + บอลลูน 🎣) แล้ว
    // หน่วงช่วงลุ้นก่อนเฉลยพร้อมกันทุก client — ผลถูก roll ไว้แล้ว แค่ยังไม่บอก
    io.emit('fishing:started', { id: socket.id });
    const F = CONFIG.FISHING;
    const suspense = F.CAST_MS + F.WAIT_MIN_MS + Math.random() * (F.WAIT_MAX_MS - F.WAIT_MIN_MS);
    const timer = setTimeout(() => {
      pendingCast.delete(socket.id);
      if (!world.get(socket.id)) return; // หลุดออกไประหว่างรอ — เงียบ
      socket.emit('fishing:result', result); // รายละเอียดเต็มเฉพาะคนตก (%จับ/ราคา)
      io.emit('fishing:resolved', {
        id: socket.id, fishId: result.fishId, tier: result.tier, caught: result.caught,
      });
      // ประกาศ epic/legendary กลางแชท (hype — spec §9)
      if (shouldAnnounce(result)) {
        io.emit('fishing:announce', { name: player.name, fishId: result.fishId, tier: result.tier });
      }
    }, suspense);
    pendingCast.set(socket.id, timer);
  });

  socket.on('disconnect', () => {
    lastEmoteAt.delete(socket.id);
    lastCastAt.delete(socket.id);
    const pending = pendingCast.get(socket.id);
    if (pending) {
      clearTimeout(pending); // คนตกหลุดไป — remotes เคลียร์บอลลูนตอน player:left อยู่แล้ว
      pendingCast.delete(socket.id);
    }
    if (world.remove(socket.id)) {
      socket.broadcast.emit('player:left', { id: socket.id });
      console.log(`[server] left: ${socket.id} · ${world.count} online`);
    }
  });
}
