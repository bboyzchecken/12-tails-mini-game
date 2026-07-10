# 12Tails Chat — Build Spec (for Claude Code)

เว็บแชทแมพ 2D สำหรับแฟน 12 หางออนไลน์ · ตัวละครเป็น **2.5D** (sprite ที่ pre-render จากโมเดล 3D ของเกม)

**Scope เวอร์ชันนี้:** เลือกตัวละคร · เดินในแมพรวม · แชทรวม (bubble + log) · อิโมจิ/หน้า action
**ยังไม่รวม:** ห้องแชทแยก (เฟสถัดไป)

> ⚠️ ลิขสิทธิ์: asset มาจากการรื้อไฟล์เกม (IP ของ Bigbug Studio) — ขออนุญาต Bigbug ก่อนเผยแพร่สาธารณะ และห้ามเก็บเงินจากตัวเกม

---

## 1. Tech stack

- **client:** Vite + TypeScript + Phaser 3
- **server:** Node.js + Express + Socket.IO + TypeScript
- **shared:** TypeScript contracts (event + type) import ได้ทั้งสองฝั่ง
- **map:** Tiled (export JSON)
- **package manager:** pnpm (หรือ npm) แบบ workspace
- **deploy:** client → static host (Vercel/Netlify/Cloudflare Pages) · server → Railway/Render/Fly.io (ต้องรองรับ WebSocket ค้าง)

---

## 2. Repo layout

```
12tails-chat/
├─ CLAUDE.md                 # ดูส่วนที่ 8 — วางไฟล์นี้ที่ root
├─ PLAN.md                   # ไฟล์นี้
├─ package.json              # workspace root
├─ shared/
│  ├─ events.ts              # Socket.IO event + payload types (ส่วนที่ 4)
│  └─ config.ts              # ค่าคงที่ทั้งเกม (ส่วนที่ 4)
├─ client/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ public/assets/
│  │  ├─ characters/<id>/    # sheet.png, faces.png, thumb.png
│  │  ├─ maps/               # <map>.json + tileset.png
│  │  └─ ui/
│  └─ src/
│     ├─ main.ts
│     ├─ scenes/
│     │  ├─ BootScene.ts
│     │  ├─ PreloadScene.ts
│     │  ├─ CharacterSelectScene.ts
│     │  └─ WorldScene.ts
│     ├─ net/socket.ts
│     ├─ entities/
│     │  ├─ LocalPlayer.ts
│     │  └─ RemotePlayer.ts
│     ├─ ui/
│     │  ├─ ChatOverlay.ts   # HTML input overlay
│     │  ├─ ChatBubble.ts
│     │  └─ EmoteWheel.ts
│     └─ data/characters.json
├─ server/
│  └─ src/
│     ├─ index.ts            # express + socket.io bootstrap
│     ├─ world.ts            # in-memory world state
│     └─ handlers.ts         # socket event handlers
└─ tools/
   └─ render-sprites/        # note + script สำหรับ pipeline 3D→sprite
```

---

## 3. หลักสถาปัตยกรรม (อ่านก่อนเริ่ม)

- **Server เป็น relay ไม่ใช่ physics** — ตำแหน่งเป็น client-authoritative, server แค่เก็บ state ใน memory แล้ว broadcast ต่อ (ไม่ต้องกันโกงเพราะเป็นแชท)
- **ส่ง `player:move` ไม่เกิน 10 ครั้ง/วินาที** (throttle) และฝั่งรับทำ **interpolation** (lerp) ให้เดินลื่น
- **sanitize ข้อความแชทที่ server** ก่อน broadcast เสมอ (ตัดความยาว, กัน HTML)
- **event ทุกตัวและ type อยู่ใน `shared/events.ts`** เท่านั้น — ห้าม inline shape ที่อื่น
- **ค่าคงที่อยู่ใน `shared/config.ts`** — ห้าม hardcode กระจาย

---

## 4. Shared contracts (โค้ดตั้งต้น — ให้ Claude Code ยึดตามนี้)

### `shared/config.ts`
```ts
export const CONFIG = {
  TILE: 32,                 // px ต่อ tile
  FRAME: { W: 64, H: 64 },  // ขนาดเฟรมตัวละคร
  PLAYER_SPEED: 150,        // px/วินาที
  MOVE_SEND_HZ: 10,         // ส่งตำแหน่งกี่ครั้ง/วินาที
  LERP: 0.2,                // ค่า interpolation remote player (0..1)
  CHAT_MAX_LEN: 200,
  BUBBLE_MS: 4000,          // อายุ chat bubble
  EMOTE_COOLDOWN_MS: 3000,
  SPAWN: { x: 400, y: 300 },
} as const;
```

### `shared/events.ts`
```ts
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
```

---

## 5. Character manifest — `client/src/data/characters.json`

`frame` และ `face` เป็นสัญญาเรื่อง layout ของ sprite sheet ทำให้โค้ด animation deterministic

```json
{
  "frame": {
    "w": 64, "h": 64, "cols": 5, "rows": 4,
    "rowOrder": ["down", "up", "left", "right"],
    "idleCol": 0,
    "walkCols": [1, 2, 3, 4]
  },
  "face": {
    "w": 96, "h": 96,
    "emotes": ["neutral", "happy", "angry", "sad", "surprised", "laugh", "cry", "love"]
  },
  "characters": [
    {
      "id": "bear",
      "name": "หมี",
      "tribe": "นักรบ",
      "color": "#B5651D",
      "sheet": "assets/characters/bear/sheet.png",
      "faces": "assets/characters/bear/faces.png",
      "thumb": "assets/characters/bear/thumb.png"
    }
  ]
}
```

**Sprite sheet convention (sheet.png):** grid `cols × rows` เฟรมละ 64×64
- แต่ละ row = 1 ทิศ ตาม `rowOrder` (down/up/left/right)
- col 0 = idle, col 1–4 = walk cycle
- frame index = `row * cols + col`
→ down idle = 0, down walk = 1..4, up = 5..9, left = 10..14, right = 15..19

**Faces sheet (faces.png):** grid 8 col × 1 row เฟรมละ 96×96 เรียงตาม `face.emotes`

---

## 6. Asset prep track (ทำคู่ขนาน นอกโค้ด)

> เริ่มเขียนโค้ดด้วย **placeholder ก่อนได้เลย** ไม่ต้องรอ asset จริง

### 6.1 Placeholder ก่อน (เพื่อไม่บล็อกการเขียนโค้ด)
- [ ] ทำ `sheet.png` placeholder 1 ตัวให้ตรง convention 5×4 (64×64) — ใช้ Kenney.nl (CC0) หรือวาดสี่เหลี่ยม 4 ทิศแบบง่าย
- [ ] ทำ `faces.png` placeholder 8×1 (96×96) + `thumb.png`
- [ ] ใส่ 2–3 ตัวใน characters.json เพื่อทดสอบหน้าเลือก

### 6.2 Pipeline 3D → sprite (Option B ของจริง)
เป้าหมาย: ผลิต `sheet.png` / `faces.png` / `thumb.png` ต่อ 1 ตัวละคร ให้ตรงขนาดใน characters.json

- [ ] มีไฟล์ client เกมในเครื่อง (จากชุมชนแฟน เพราะเซิร์ฟทางการปิดแล้ว)
- [ ] รื้อโมเดล + animation ด้วย **uTinyRipper** → เปิดใน **Unity** (ตาม tutorial ที่มี)
- [ ] ใน Unity: สร้าง render scene — กล้อง **orthographic**, พื้นหลังโปร่ง (RGBA)
- [ ] วางตัวละครบน turntable: หมุน 4 มุมให้ตรง down/up/left/right (fix mapping ให้คงที่)
- [ ] ต่อแต่ละมุม: idle → render 1 เฟรม, walk anim → sample 4 เฟรมเว้นระยะเท่ากัน (64×64)
- [ ] จัดเฟรมเป็น grid 5col×4row → `sheet.png` (เขียน script RenderTexture + ReadPixels หรือ render แล้วแพ็คด้วย TexturePacker)
- [ ] faces: render หัวโคลสอัพต่ออารมณ์ (หรือใช้ portrait ในเกมถ้ามี) 96×96 → `faces.png`
- [ ] `thumb.png` ~128×128 + เพิ่ม entry ใน characters.json

**ทางเลือก Blender:** import โมเดลที่รื้อมา แล้วทำแบบเดียวกัน (orthographic + 4 มุม + render เฟรม)
**เคล็ด:** left/right เป็นภาพกลับด้านกัน จะ render มุมเดียวแล้ว flip เอาก็ได้ประหยัดแรง · animation ที่รื้อมาอาจต้อง clean up เล็กน้อย

---

## 7. Implementation phases (ให้ Claude Code ทำทีละเฟส — ผ่าน AC ก่อนค่อยไปเฟสถัดไป)

### Phase 0 — Scaffold + hello loop
- [ ] ตั้ง workspace (root package.json) + client (Vite/TS/Phaser) + server (Node/TS/Socket.IO) + shared
- [ ] client render Phaser canvas ว่างๆ ได้ · server รัน + log ตอนมี connection
- [ ] shared/events.ts + shared/config.ts import ได้ทั้งสองฝั่ง
- [ ] ต่อ Socket.IO client↔server สำเร็จ (log ทั้งสองฝั่ง)
- **AC:** เปิด client เห็น canvas, terminal server log "client connected", ไม่มี type error

### Phase 1 — Map + local movement (คนเดียว ยังไม่มี net)
- [ ] วาดแมพเล็กใน Tiled → export JSON + วาง tileset
- [ ] WorldScene โหลด tilemap + collision layer
- [ ] LocalPlayer: โหลด sheet.png, สร้าง walk anim 4 ทิศ (idle/walk ตาม convention)
- [ ] เดินด้วยปุ่มลูกศร/WASD ที่ความเร็ว CONFIG.PLAYER_SPEED + ชนกำแพงได้
- [ ] camera follow ตัวละคร
- **AC:** เดินรอบแมพได้ ชนกำแพงหยุด anim เปลี่ยนตามทิศ กล้องตาม

### Phase 2 — Character select
- [ ] BootScene → PreloadScene (โหลด characters.json + asset ทุกตัว) → CharacterSelectScene
- [ ] แสดงกริดตัวละครจาก characters.json (thumb + ชื่อ) + ช่องกรอกชื่อเล่น
- [ ] เลือกแล้วเก็บ { characterId, name } ส่งเข้า WorldScene แล้ว spawn ด้วย sheet ที่เลือก
- **AC:** เลือกตัว + ใส่ชื่อ → เข้าแมพด้วย sprite ที่ถูกต้อง

### Phase 3 — Multiplayer presence (หัวใจ)
- [ ] server: world.ts เก็บ `Map<id, PlayerState>`
- [ ] server handlers: `player:join` (เก็บ + ตอบ `world:snapshot` ให้คนเข้า + broadcast `player:joined`), `player:move` (อัปเดต + broadcast `player:moved`), disconnect (ลบ + broadcast `player:left`)
- [ ] client: ส่ง `player:join` ตอนเข้า, ส่ง `player:move` throttle ที่ CONFIG.MOVE_SEND_HZ
- [ ] RemotePlayer entity: สร้าง/ลบตาม event, **lerp** ตำแหน่งด้วย CONFIG.LERP, เล่น walk anim ตาม `moving`/`dir`
- [ ] ป้ายชื่อลอยเหนือหัวทุกคน
- **AC:** เปิด 2 แท็บ เห็นกันเดินลื่น (ไม่วาร์ป), เข้า/ออกอัปเดตครบ

### Phase 4 — Global chat
- [ ] ChatOverlay: HTML input ครอบบน canvas (กด Enter ส่ง, Esc เลิก focus)
- [ ] client ส่ง `chat:send` → server sanitize (ตัด CONFIG.CHAT_MAX_LEN, กัน HTML/ช่องว่างล้วน) → broadcast `chat:message`
- [ ] ChatBubble เหนือหัวผู้พูด auto-hide ที่ CONFIG.BUBBLE_MS
- [ ] panel log ข้อความ (ชื่อ + ข้อความ + เวลา)
- **AC:** พิมพ์จากแท็บ A เห็น bubble เหนือหัว + เข้า log ทั้ง A และ B

### Phase 5 — Emotes + action faces
- [ ] EmoteWheel: UI เลือกอิโมจิ + emote (ตาม face.emotes)
- [ ] client ส่ง `emote:send` → server broadcast `emote:played` (payload เป็น emoteId ไม่ใช่รูป)
- [ ] แสดงไอคอนอิโมจิเหนือหัว (auto-hide) + สลับสีหน้าตัวละครจาก faces.png ชั่วคราว
- [ ] cooldown CONFIG.EMOTE_COOLDOWN_MS กันสแปม
- **AC:** emote จากแท็บ A แสดงบน B, หน้าเปลี่ยนแล้วคืนสภาพ, cooldown ทำงาน

### Phase 6 — Deploy
- [ ] ย้าย server URL ไป env var (client) + ตั้ง CORS ที่ server
- [ ] build client → static host · deploy server → Railway/Render (เปิด WebSocket)
- [ ] ทดสอบข้ามเครื่อง/มือถือหลายตัวพร้อมกัน
- **AC:** เข้าจากอินเทอร์เน็ตจริงหลายเครื่อง เห็นกัน+แชทได้

---

## 8. `CLAUDE.md` (ก๊อปวางที่ root ของ repo)

```md
# 12Tails Chat — Project Guide

## What this is
2D top-down multiplayer chat-map web app for 12 Tails Online fans.
Pick a character, walk a shared map, chat globally, play emotes.
Characters are 2.5D: sprites pre-rendered from the game's 3D models.

## Stack
- client: Vite + TypeScript + Phaser 3
- server: Node.js + Express + Socket.IO + TypeScript
- shared: TypeScript contracts imported by both
- maps: Tiled (JSON)

## Repo layout
/client, /server, /shared, /tools — see PLAN.md.

## Hard rules
- All Socket.IO event names + payload types live in /shared/events.ts. Import them; never inline event shapes.
- Constants (tile size, speeds, rates) live in /shared/config.ts. Never hardcode.
- Server is a relay only for positions (no server-side physics). It holds in-memory world state.
- Throttle player:move to CONFIG.MOVE_SEND_HZ. Interpolate remote players with CONFIG.LERP.
- Sanitize all chat text on the server before broadcasting (max CONFIG.CHAT_MAX_LEN, strip HTML).
- Use placeholder assets (Kenney CC0) until real sprites exist. Load characters from characters.json; don't assume specific character ids in code.

## Build order
Implement PLAN.md phase by phase. Do NOT start a phase until the previous phase's acceptance criteria pass. Commit after each phase.
```

---

## 9. วิธีขับ Claude Code

1. สร้างโฟลเดอร์เปล่า วาง `PLAN.md` + `CLAUDE.md` ที่ root
2. เปิด Claude Code แล้วสั่งทำ **ทีละเฟส** อย่ายัดทุกเฟสทีเดียว
3. Prompt ตั้งต้นแนะนำ:
   > อ่าน PLAN.md และ CLAUDE.md แล้วเริ่ม Phase 0 เท่านั้น: scaffold workspace (client + server + shared) ตาม repo layout, ใส่ shared/events.ts และ shared/config.ts ตามสเปก, ต่อ Socket.IO ให้ client เชื่อม server ได้ หยุดที่ acceptance criteria ของ Phase 0 แล้วบอกวิธีรันให้ผมทดสอบ
4. ทดสอบ AC เอง → ผ่านแล้วค่อยสั่ง "ทำ Phase 1 ต่อ"
5. commit ทุกเฟส

**ลำดับแนะนำ:** Phase 0 → 1 → 2 ทำด้วย placeholder ก่อน (เดิน+เลือกตัวได้) → 3 (multiplayer, เฟสยากสุด อย่ารีบ) → 4 → 5 → 6 · ค่อยผลิต sprite จริงจาก pipeline ส่วนที่ 6 แล้ว swap เข้าไป
