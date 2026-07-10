/**
 * Typed event bus — ช่องทาง "เดียว" ที่โลก Phaser กับ DOM UI คุยกัน
 * (12tails-ui-roadmap.md §6). UI ห้ามเอื้อมเข้า scene ตรงๆ และ scene
 * ห้ามแตะ DOM ตรงๆ — ทุกอย่างวิ่งผ่าน gameToUI / uiToGame เท่านั้น
 */

// game -> UI
export interface GameToUI {
  'player:self': { characterId: string; name: string; level: number; xp: number; xpMax: number };
  'player:currency': { jil: number; coins: number }; // ค่า demo
  'players:count': { online: number };
  'chat:log': { id: string; name: string; text: string; ts: number };
  'system:message': { text: string }; // "X เข้ามา"
  'profile:show': { id: string; name: string; level: number; characterId: string; cosmetics: string[] };
  'room:name': { name: string };
}

// UI -> game
export interface UIToGame {
  'chat:send': { text: string };
  'emote:play': { emoteId: string };
  'cosmetic:equip': { type: 'skin' | 'color' | 'emote' | 'chatFrame'; id: string }; // demo
  'music:toggle': Record<string, never>;
  'store:open': { tab: string };
}

type Handler<P> = (payload: P) => void;

class TypedBus<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  /** Subscribe; returns an unsubscribe function. */
  on<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(event, fn);
  }

  off<K extends keyof E>(event: K, fn: Handler<E[K]>) {
    this.handlers.get(event)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]) {
    this.handlers.get(event)?.forEach((fn) => (fn as Handler<E[K]>)(payload));
  }
}

export const gameToUI = new TypedBus<GameToUI>();
export const uiToGame = new TypedBus<UIToGame>();
