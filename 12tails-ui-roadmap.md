# UI Development Roadmap — เกมแชท + Business-Model UI (สำหรับ Claude Code)

ส่วนเสริมของ **PLAN.md** + **12tails-demo-monetization-plan.md**
เป้าหมาย: เปลี่ยนกลไกเปล่าให้เป็น “เกมแชท” ที่ดูดี + ผนวก UI โมเดลรายได้ (เดโม) เพื่อ present Bigbug

> 🧭 มุมมอง **top-down เดิม** (ไม่ใช่ isometric)
> 🔴 UI โมเดลรายได้ทั้งหมดเป็น **mock** — ไม่มีจ่ายเงินจริง มีแบนเนอร์ DEMO ค้างตลอด

---

## 1. ความสัมพันธ์กับไฟล์อื่น

- **PLAN.md** = แกนกลไก (เดิน/แชท/emote/multiplayer) — ทำก่อน
- **ไฟล์นี้** = ยกระดับ “ชั้นการแสดงผล (UI)” + เพิ่มร้าน/โมเดลรายได้
- ถ้าเคยทำ chat input/emote แบบ minimal ใน PLAN.md Phase 3–5 ไว้แล้ว → เวอร์ชันในไฟล์นี้ **แทนที่** ของเดิม (อย่าทำซ้อน)

---

## 2. หลักสถาปัตยกรรม UI (สำคัญที่สุด)

**UI = DOM overlay ทับบน Phaser canvas** ไม่ใช่วาดใน Phaser
- Phaser เรนเดอร์ “โลก” (ตัวละคร แมพ bubble), DOM เรนเดอร์ “UI” (HUD ปุ่ม panel modal input)
- คุยกันผ่าน **event bus แบบ typed** (`ui/bus.ts`) เท่านั้น — UI ไม่เอื้อมเข้า scene ตรงๆ และ scene ไม่ยุ่ง DOM ตรงๆ
- เหตุผล: UI แบบ panel/ปุ่ม/ฟอร์ม ทำใน HTML/CSS เร็วและสวยกว่ามาก

---

## 3. ภาพรวม Layout (region)

```
┌───────────────────────────────────────────────────────────┐
│ [Location title]                         [ Player HUD  ▸] │
│  ชื่อห้อง/แมพ                              avatar·name·Jil  │
│                                           Lv • XP bar      │
│                                          [ Action bar ]    │
│                                        ร้าน·emote·event·   │
│                                        music·อันดับ·…      │
│                                                            │
│                  ( Phaser world canvas )                   │
│             ตัวละคร + ชื่อลอย + chat bubble                │
│                                                            │
│ ┌───────────────┐                                          │
│ │ Chat feed     │                        [ Control hints ]│
│ │ + system msg  │                         WASD·Enter·คลิก │
│ │ 🎵 music bar  │                                          │
│ │ กด Enter=แชท  │                                          │
│ └───────────────┘   [ Chat input เปิดเมื่อกด Enter ]       │
└───────────────────────────────────────────────────────────┘
  Overlay modals: Store(Shop/BattlePass/Supporter/Collection/Gacha), Profile popup, Emote wheel
  Persistent: 🔴 DEMO banner (มุมบน)
```

---

## 4. Design tokens (ทิศทาง: อบอุ่น กลมมน น่ารัก แต่ออริจินอล)

ไม่ก๊อปอาร์ตจากรูป reference — เอาแค่ “ฟีล” panel กลมมนนุ่ม โทนครีมอุ่น

```css
/* client/src/ui/ui.css */
:root {
  --panel: #FFF9F0; --panel-line: #ECD9C2;
  --panel-shadow: 0 6px 20px rgba(120,80,40,.12);
  --ui-ink: #4A3B2E; --ui-muted: #9A8574;
  --ui-accent: #E8944A;    /* ส้มอุ่น (ปุ่มหลัก) */
  --ui-accent-2: #6FB0A6;  /* เขียวมิ้นต์ (secondary) */
  --radius-panel: 16px; --radius-btn: 12px;
}
.panel { background: var(--panel); border: 1px solid var(--panel-line);
         border-radius: var(--radius-panel); box-shadow: var(--panel-shadow); }
.btn   { border-radius: var(--radius-btn); font-family: 'Mitr', sans-serif; }
```
ฟอนต์แนะนำ (รองรับไทย): headers/labels `Mitr` (กลมมนเป็นมิตร) · body/chat `Sarabun` หรือ `Krub`

---

## 5. โครงไฟล์ UI (ต่อจาก client/src ใน PLAN.md)

```
client/src/ui/
├─ UIRoot.ts / ui.css        # mount overlay + design tokens + responsive scale
├─ bus.ts                    # typed event bus (game <-> UI)  ← ส่วนที่ 6
├─ hud/
│  ├─ PlayerHUD.ts           # บนขวา: avatar, name, Lv/XP, currency
│  ├─ ActionBar.ts           # แถวปุ่ม: ร้าน, emote, event, music, อันดับ…
│  ├─ LocationTitle.ts       # บนซ้าย: ชื่อห้อง/แมพ
│  └─ ControlHints.ts        # ล่างขวา: WASD/Enter/คลิก
├─ chat/
│  ├─ ChatPanel.ts           # feed + system message + "กด Enter"
│  └─ ChatInput.ts           # input overlay
├─ social/
│  ├─ EmoteWheel.ts
│  ├─ ProfilePopup.ts        # คลิกผู้เล่น → มินิโปรไฟล์
│  └─ Toasts.ts              # join/leave, ยืนยันซื้อ (demo)
├─ music/MusicPlayer.ts      # lofi loop toggle + ชื่อเพลง + volume
└─ store/                    # ★ UI โมเดลรายได้ (DEMO ทั้งหมด)
   ├─ DemoBanner.ts          # แบนเนอร์ "DEMO ยังไม่เปิดขายจริง"
   ├─ StoreModal.ts          # shell + tabs
   ├─ ShopTab.ts  BattlePassTab.ts  SupporterTab.ts
   └─ CollectionTab.ts  GachaTab.ts
```

---

## 6. Event bus contract (`ui/bus.ts`)

```ts
// game -> UI
type GameToUI = {
  'player:self':     { characterId: string; name: string; level: number; xp: number; xpMax: number };
  'player:currency': { jil: number; coins: number };     // ค่า demo
  'players:count':   { online: number };
  'chat:log':        { id: string; name: string; text: string; ts: number };
  'system:message':  { text: string };                   // "X เข้ามา"
  'profile:show':    { id: string; name: string; level: number; characterId: string; cosmetics: string[] };
  'room:name':       { name: string };
};
// UI -> game
type UIToGame = {
  'chat:send':       { text: string };
  'emote:play':      { emoteId: string };
  'cosmetic:equip':  { type: 'skin'|'color'|'emote'|'chatFrame'; id: string };  // demo
  'music:toggle':    {};
  'store:open':      { tab: string };
};
```

---

## 7. Prep ก่อนเริ่ม (checklist)

- [ ] แกนกลไก PLAN.md (เดิน/แชท/emote/multiplayer) รันด้วย placeholder ได้แล้ว
- [ ] อ่าน 12tails-demo-monetization-plan.md (ไฟล์นี้ผนวก UI ของมัน)
- [ ] ตัดสินใจ design tokens (ส่วน 4) + import ฟอนต์
- [ ] วาง event bus pattern (ส่วน 6) ก่อนแตะ UI ตัวจริง
- [ ] เลือกชุด icon (แนะนำ Tabler / Lucide เป็น SVG — เลี่ยง emoji เป็น icon)
- [ ] ยืนยันหลัก: store ทุกส่วนเป็น **DEMO/mock** เท่านั้น

---

## 8. Phases U0–U6 (ทำทีละเฟส · ผ่าน AC ก่อนไปต่อ)

### U0 — UI foundation
- [ ] UIRoot mount DOM overlay ทับ canvas + responsive scale (overlay + canvas ย่อ/ขยายพร้อมกัน)
- [ ] ui.css design tokens + `.panel` / `.btn` base
- [ ] `bus.ts` typed emitter (game ↔ UI) + ทดสอบส่ง event ทั้งสองทาง
- [ ] DemoBanner ค้างมุมบน
- **AC:** overlay โผล่ทับเกม, panel ทดสอบ + DEMO banner แสดง, bus ส่ง event ผ่านทั้งสองทาง

### U1 — Core HUD
- [ ] PlayerHUD (บนขวา): avatar จาก characterId, name+tag, Lv + XP bar, currency (Jil/coins — ค่า demo)
- [ ] LocationTitle (บนซ้าย): ชื่อห้อง/แมพ
- [ ] ControlHints (ล่างขวา): WASD เดิน, Enter แชท, คลิกดูโปรไฟล์
- [ ] online count
- **AC:** HUD แสดงข้อมูลผู้เล่นจริง (ชื่อ/ตัวละคร), XP bar สะท้อนค่า, hints ครบ, responsive ลงมือถือ

### U2 — Chat เป็น UI แบบเกม
- [ ] ChatPanel (ล่างซ้าย): feed เลื่อนได้ รวม chat + system message (เข้ามา/ออกไป) สไตล์ต่างกัน + "กด Enter เพื่อแชท"
- [ ] ChatInput overlay (Enter เปิด, Esc ปิด, Enter ส่ง) + sanitize
- [ ] ChatBubble เหนือหัว (สไตล์ใหม่ auto-hide) + ป้ายชื่อ
- [ ] MusicPlayer (lofi loop toggle + ชื่อเพลง + volume)
- **AC:** พิมพ์แล้วขึ้น feed + bubble ทุก client, system message โผล่, เพลง toggle ได้

### U3 — Social & expression
- [ ] EmoteWheel (เปิด → เลือก emoji/emote → เล่น + สลับหน้า + bubble + cooldown)
- [ ] ProfilePopup (คลิกผู้เล่น → มินิโปรไฟล์: avatar, ชื่อ, Lv, cosmetic ที่ใส่ + ปุ่ม add friend แบบ mock)
- [ ] Toasts (เข้า/ออก, ยืนยันซื้อ demo)
- **AC:** emote เล่นทุก client, คลิกผู้เล่นเปิดโปรไฟล์, toast ทำงาน

### U4 — Store shell + Shop (DEMO)
- [ ] ActionBar ปุ่ม: ร้าน, emote, event, music (+ ทางเข้า store)
- [ ] StoreModal shell + tabs + DemoBanner ในตัว
- [ ] ShopTab: กริด cosmetic, **พรีวิวสดบนตัวเอง/บับเบิล** ก่อนซื้อ, ปุ่ม "แลกด้วย Jil (demo)" → equip
- [ ] ระบบ cosmetic apply จริงในโลก: skin=สลับ sheet, color=tint, chatFrame=กรอบ bubble, emote=เพิ่มใน wheel
- **AC:** เปิดร้าน "ซื้อ" cosmetic (demo) แล้ว **เห็นบนตัวละครในแมพทันที** + client อื่นเห็นด้วย

### U5 — โมเดลรายได้ที่เหลือ (DEMO)
- [ ] BattlePassTab: free/premium track + สไลเดอร์จำลองความคืบหน้า
- [ ] SupporterTab: tier + สมัคร (mock) → ป้าย/ห้องพิเศษ/emote
- [ ] CollectionTab: "ชุดฤดูร้อน" ซื้อชิ้น/ยกเซ็ต (direct)
- [ ] GachaTab: เติม Jil (mock) → สุ่มถุงฤดูร้อน (แอนิเมชันเปิด) + **ตาราง odds + pity counter + ปุ่มซื้อตรง**
- [ ] ปุ่ม reset demo
- **AC:** ทุกพื้นผิวเดโมได้ครบวงจร, mock ล้วน, safeguards ครบ (banner, "(demo)", ไม่มี payment)

### U6 — Polish & pitch-ready
- [ ] pass สไตล์ให้ทั้งจอเป็นชุดเดียวกัน + micro-animation เบาๆ + empty/loading states
- [ ] เช็ค responsive มือถือทั้ง HUD/panel/modal
- [ ] จัด **demo flow** ให้เดินโชว์ Bigbug ลื่น: จอเริ่ม → แชท → emote → เปิดร้าน → พรีวิว cosmetic → battle pass → gacha (โชว์ odds)
- [ ] ให้ถ่าย screenshot/อัดคลิปได้สวย
- **AC:** present ได้ตั้งแต่ต้นจนจบแบบลื่นทั้ง desktop + มือถือ, ดูเป็นเกมแชทจริง

---

## 9. CLAUDE.md addendum (เพิ่ม hard rules สำหรับ UI)

```md
## UI rules
- UI = DOM overlay over the Phaser canvas. Never build panels/buttons/forms inside Phaser.
- All game <-> UI communication goes through /ui/bus.ts (typed). UI never touches the scene directly; scene never touches the DOM directly.
- UI tokens live in /ui/ui.css. Reuse .panel and .btn; never hardcode colors.
- Store UI is DEMO ONLY: persistent DEMO banner, every buy/top-up labeled "(demo)", no payment integration, Jil is fake, include a reset button. Never use ฿/$ for Jil.
- Equipped cosmetics MUST render in the world (via bus -> scene), not just in the menu.
- HUD/panels/modals must be responsive down to mobile; canvas + overlay scale together.
- Build U-phases in order; a phase's acceptance criteria must pass before the next.
```

---

## 10. Definition of Done (พร้อม pitch)

- [ ] ดูเป็น “เกมแชท” จริง: HUD + chat feed + emote + โปรไฟล์ + เพลง ครบ
- [ ] โมเดลรายได้โชว์ครบ 5 พื้นผิว แบบ mock (banner + "(demo)" + ไม่มีจ่ายจริง)
- [ ] cosmetic ที่ "ซื้อ" เห็นบนตัวจริงในแมพ (พิสูจน์ว่า "จ่ายแล้วได้อะไร")
- [ ] เดินโชว์ Bigbug ได้ลื่นทั้ง desktop + มือถือ
- [ ] ยังใช้ placeholder art (ไม่ใส่ IP Bigbug จนกว่าได้ไฟเขียว)
```
