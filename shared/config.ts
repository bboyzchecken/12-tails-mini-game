export const CONFIG = {
  TILE: 32,                 // px ต่อ tile
  FRAME: { W: 64, H: 64 },  // ขนาดเฟรมตัวละคร
  PLAYER_SPEED: 150,        // px/วินาที
  MOVE_SEND_HZ: 10,         // ส่งตำแหน่งกี่ครั้ง/วินาที
  LERP: 0.2,                // ค่า interpolation remote player (0..1)
  CHAT_MAX_LEN: 200,
  NAME_MAX_LEN: 16,
  BUBBLE_MS: 4000,          // อายุ chat bubble
  EMOTE_COOLDOWN_MS: 3000,
  EMOTE_SHOW_MS: 2500,      // อายุ balloon + หน้า emote เหนือหัว
  SPAWN: { x: 400, y: 300 },
} as const;
