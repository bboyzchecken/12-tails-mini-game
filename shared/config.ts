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
  // px (หน่วยโลก 3D = px/TILE) — จุด StartPoint1 (marker สีแดง = จุดเกิดครั้งแรก
  // ของเกมจริง) ในแมพ G30_NoGuild; อีกสองจุดคือ StartPoint2 (น้ำเงิน, 448,112)
  // และ StartPoint3 (เขียว, -234,-255) ไว้ใช้ตอนมีระบบเดินข้ามแมพ
  SPAWN: { x: -415, y: 346 },
  DEMO_STORE: true,         // เปิดชั้น UI โมเดลรายได้ (mock ทั้งหมด — ดู 12tails-demo-monetization-plan.md)

  // ---- ระบบแสดงความรู้สึก (id ตรงชื่อไฟล์จากเกมจริง) ----
  // ลูกโป่งอารมณ์เหนือหัว (assets/ui/bubbles/<id>.png)
  EMOTE_BUBBLES: [
    'smile', 'happy', 'haha', 'heart', 'blush', 'exclaim', 'question',
    'sad', 'tear', 'angry', 'mad', 'wrath', 'panic', 'sweat', 'puke',
    'pervert', 'zzz', 'rock', 'paper', 'scissors',
  ],
  // ท่าทางตัวละคร (เล่น animation clip ในโมเดล; chat ใช้คลิป talk)
  EMOTE_ACTIONS: [
    'sit', 'chat', 'dance', 'wave', 'bow', 'cheer',
    'beg', 'sleep', 'cry', 'laugh', 'pose', 'battle',
  ],
} as const;
