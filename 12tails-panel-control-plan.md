# 12Tails — Panel Control System Plan (แผนระบบเมนู/Panel รวม)

ส่วนเสริมของ **12tails-ui-roadmap.md** · ผูกกับ **12tails-web-BUILD-PLAN.md (Phase P + F)** และ **ระบบตกปลา-12หาง.md**

เป้าหมาย: เปลี่ยนปุ่มลอยกระจัดกระจายให้เป็น **"เมนูรวม (Panel Hub)"** ที่กด toggle เปิด/ปิดได้แบบเกมจริง + วางบัญชี panel ทั้งหมด + แก้ระบบบัญชี/โปรไฟล์ให้รองรับ social login (**LINE ก่อน** → Google/Apple)

> 🧭 top-down เดิม · UI = DOM overlay ทับ canvas (ตาม CLAUDE.md)
> 🔴 ร้าน/โมเดลรายได้ยังเป็น **DEMO** (mock, ไม่มีจ่ายจริง) — banner ค้างตลอด
> ⚠️ **กฎข้อแรกของแผนนี้:** panel ทุกปุ่มต้องมาจาก **ระบบที่มีอยู่จริง หรือ roadmap ของเราเท่านั้น** (ui-roadmap / web-BUILD-PLAN / fishing docs) — ภาพเมนูเกมอื่นใช้เป็นแรงบันดาลใจ *layout grid* อย่างเดียว ห้ามก๊อปรายการปุ่ม (ดู §3.1–3.2)

---

## 1. ปัญหาปัจจุบัน (ทำไมต้องมีแผนนี้)

ตอนนี้ปุ่มเข้า panel ในโลกถูกสร้าง **แบบ ad-hoc** ใน `client/src/three/World3D.ts` — ปุ่มลอย 3 อัน (`side-btn`):

| ปุ่ม | class | เปิดอะไร |
|---|---|---|
| แต่งตัว | `s2` | `CustomizePanel` |
| ร้านค้า 🛒 | `s3` | `StoreModal` |
| ⚙️ เมนู | `s4` | popup 2 รายการ: "เปลี่ยนตัวละคร" / "login-logout" |

ปัญหา:
- **ไม่มี container เมนูกลาง** — เพิ่ม panel ใหม่ = ไปแปะปุ่มลอยเพิ่มเรื่อยๆ ไม่ scale (fishing cluster ที่กำลังจะมา ต้องการบ้านอย่างน้อย 3–4 panel)
- **ไม่มี registry / state กลาง** — ไม่มีที่เดียวที่รู้ว่ามี panel อะไรบ้าง, อันไหนเปิดอยู่, อันไหนต้อง login
- **ไม่มีระบบ toggle / single-open** — เปิดซ้อนกันได้, ESC ไม่ทำงานสม่ำเสมอ

**แผนนี้แก้ด้วย 3 อย่าง:** (2) สถาปัตยกรรม Panel Hub · (3–4) บัญชี+สเปค panel ตาม roadmap จริง · (5) แก้ account ให้รองรับ LINE

---

## 2. สถาปัตยกรรม Panel Hub (ระบบใหม่)

### 2.1 ภาพรวม

```
┌─────────────────────────────────────────────┐
│ [LocationTitle]                  [ ☰ เมนู ]  │  ← ปุ่มเดียวเปิด Panel Hub
│                                              │
│            ( world canvas )                  │
│                                              │
│  ┌──────────────────────────┐                │
│  │   Panel Hub (grid)       │  ← toggle grid │
│  │  [🎒][🐟][🎣][🏆][➕]     │  fishing+social│
│  │  [🛒][👕][🎪][👤][⚙️]     │  shop+system   │
│  └──────────────────────────┘                │
│ [PlayerHUD]                    [ControlHints]│
└─────────────────────────────────────────────┘
   เปิด panel ตัวจริง = modal ทับ (single-open)
   แชท/อิโมต/เพลง = quick-access เดิม ไม่อยู่ใน grid (ดู §3.2)
```

หลักการ: **ปุ่ม ☰ เดียว → เปิด grid → คลิกไอคอน → เปิด panel modal** (grid ปิดตัวเอง). กด ☰ ซ้ำ = toggle ปิด grid. ESC ปิด panel ที่เปิดอยู่ก่อน แล้วค่อยปิด grid

### 2.2 โครงไฟล์ใหม่

```
client/src/ui/menu/
├─ MenuHub.ts          # ปุ่ม ☰ + grid overlay (render จาก registry)
├─ panelRegistry.ts    # ★ declarative list ของ panel ทุกตัว (source of truth)
├─ PanelManager.ts     # open/close/toggle state · single-open · ESC · z-index
├─ PanelShell.ts       # โครง modal ร่วม (header + ปุ่มปิด + body slot) reuse ได้
└─ menu.css            # โทเคน grid/ไอคอน (ใช้ตัวแปรจาก ui.css เท่านั้น — ห้าม hardcode สี)
```

Panel ที่มีอยู่แล้ว (`CustomizePanel.ts`, `store/StoreModal.ts`, …) **ไม่ต้องเขียนใหม่** — แค่ลงทะเบียนใน `panelRegistry` แล้วให้ `PanelManager` เป็นคนเปิด (refactor ปุ่มลอยเดิมออก)

### 2.3 Registry entry (สัญญาเดียวที่ทุก panel ต้องทำตาม)

```ts
// client/src/ui/menu/panelRegistry.ts
export type PanelId =
  // fishing cluster (Phase F)
  | 'bag' | 'fishdex' | 'fishshop' | 'fishmarket'
  // shop cluster (U4–U5 + Phase 5 seasons)
  | 'shop' | 'customize' | 'event'
  // social/growth (F2–F3)
  | 'ranking' | 'invite'
  // system (Phase P + ของที่มีอยู่)
  | 'profile' | 'settings';

export type PanelStatus = 'live' | 'stub' | 'planned' | 'locked';
export type PanelGate   = 'guest-ok' | 'account-required' | 'premium';
export type PanelGroup  = 'fishing' | 'shop' | 'social' | 'system';

export interface PanelDef {
  id: PanelId;
  icon: string;               // inline SVG (Lucide/Tabler ตาม UI rule — ไม่ใช้ emoji เป็นไอคอน)
  labelTH: string;
  group: PanelGroup;
  status: PanelStatus;        // คุมการแสดง badge "เร็วๆนี้"/แม่กุญแจ
  gate?: PanelGate;           // undefined = เล่นได้เลย
  open?: () => void;          // undefined = ยังไม่ทำ → โชว์ toast "เร็วๆ นี้"
  badge?: () => number | string | null;  // ตัวเลขแจ้งเตือน (อีเวนต์ใกล้หมด ฯลฯ)
}
```

- `status` คุมหน้าตาไอคอน: `live/stub` = กดได้ · `planned` = กดได้แต่ขึ้น "เร็วๆ นี้" · `locked` = ไอคอนแม่กุญแจ (premium-gated)
- `gate='account-required'` → ถ้าเป็น guest กด → เด้ง `AuthPanel` ("สมัคร/เข้าสู่ระบบก่อน")
- **ห้าม hardcode รายการ panel ที่อื่น** — grid, deep-link (`store:open` เดิม), badge ทั้งหมดอ่านจาก registry เดียวนี้ (กฎเดียวกับ characters.json / store/active)
- **จะเพิ่ม PanelId ใหม่ได้ต้องมีที่มาใน roadmap ก่อน** — ไม่มี roadmap = ไม่มีปุ่ม

### 2.4 Bus contract เพิ่ม (`ui/bus.ts`)

Panel ส่วนใหญ่เป็น DOM ล้วน จัดการใน `PanelManager` ได้เลย — เพิ่ม bus เฉพาะที่ต้องคุยกับ "โลก":

```ts
// UI -> game  (เพิ่มใน UIToGame)
'menu:toggle':  Record<string, never>;          // ปุ่ม ☰
'panel:open':   { id: string };                 // log/analytics
'panel:close':  { id: string };

// game -> UI  (เพิ่มใน GameToUI)
'menu:badge':   { id: string; count: number };  // world แจ้ง badge
```

> ยิง analytics `panel_open{ id }` ทุกครั้ง (mirror TS↔Go ตาม taxonomy) — ได้ข้อมูลว่าคนใช้/อยากใช้ panel ไหน เข้า dashboard ด้วย

### 2.5 พฤติกรรมที่ต้องผ่าน (AC ของตัว Hub เอง)

- [ ] กด ☰ เปิด/ปิด grid ได้ · คลิกนอก grid = ปิด
- [ ] คลิกไอคอน → เปิด panel + ปิด grid · เปิดได้ทีละ 1 (เปิดตัวใหม่ปิดตัวเก่า)
- [ ] ESC ปิด panel → ESC ซ้ำปิด grid
- [ ] panel `planned` กดแล้วขึ้น toast "เร็วๆ นี้" ไม่ crash
- [ ] guest กด panel `account-required` → เด้ง AuthPanel
- [ ] responsive: grid ปรับ column ตามจอ (มือถือ 3–4 คอลัมน์) · panel modal เต็มจอบนมือถือ
- [ ] ยิง `panel_open` analytics ครบ

---

## 3. บัญชี Panel ทั้งหมด (master list — เฉพาะที่มีระบบ/roadmap รองรับ)

**สถานะ** = สภาพโค้ดจริงตอนนี้ · **ที่มา** = doc/phase ที่อ้างอิง (ทุกแถวต้องมีคอลัมน์นี้ — ไม่มีที่มา = ไม่อยู่ในตาราง)

| # | Panel (TH) | เนื้อหา | สถานะตอนนี้ | group | gate | ที่มา / phase |
|---|---|---|---|---|---|---|
| 1 | **กระเป๋า** | ปลาที่ตกได้ + ของสายตกปลา · ขายปลา→เกล็ด | ❌ ยังไม่มี UI | fishing | account | BUILD-PLAN §7 F0: `GET /fishing/inventory`, `POST /fishing/sell` |
| 2 | **Fishdex** | สมุดสะสมปลา → ครบเซ็ตปลดคอสเมติก | ❌ ยังไม่มี | fishing | account | F0 · fishing doc "reward line 2" |
| 3 | **ร้านตกปลา** | คันเบ็ด (เพิ่มพลัง) + เหยื่อ — จ่ายด้วย**เกล็ด**เท่านั้น | ❌ ยังไม่มี | fishing | account | F1: `POST /fishing/shop/buy`, event `fishing_shop_open` |
| 4 | **ตลาดปลา** | ราคาปลาผันผวน (ขายจังหวะดีได้เกล็ดเยอะ) | ❌ เฟสหลังชัดเจน | fishing | account | BUILD-PLAN §7 "เก็บไว้เฟสหลัง" (`FishMarketPrice`) |
| 5 | **ร้าน** | cosmetic ขายตรง + (U5) แท็บ Collection/Gacha/BattlePass/Supporter | ✅ stub ครบ (StoreModal + Go `/store/active` + season CRUD) | shop | guest | ui-roadmap U4–U5 · monetization D1–D4 · season S |
| 6 | **แต่งตัว** | สวม/ถอดคอสเมติกที่มี (สี/หน้า/ชุด/อาวุธ/หมวก — คันเบ็ดใช้ช่อง weapon) | ✅ ใช้ได้ (CustomizePanel) | shop | guest | ui-roadmap U4 "cosmetic apply จริงในโลก" |
| 7 | **อีเวนต์** | ซีซัน/คอลเลกชันที่เปิดอยู่ + countdown (FOMO) | ❌ UI ยังไม่มี (backend season ✅) | shop | guest | ui-roadmap U4 ActionBar "event" · season S4 |
| 8 | **อันดับ** | leaderboard ตกปลา + feed legendary drops | ❌ ยังไม่มี | social | guest | F3: `GET /fishing/leaderboard` + broadcast [C] |
| 9 | **ชวนเพื่อน** | ลิงก์เชิญ + นับ invite-5 → ปลดคันเบ็ด (ผูก social กันบัญชีปลอม) | ❌ ยังไม่มี | social | account | F2 growth loop |
| 10 | **โปรไฟล์** | family name, character slots, provider ที่ผูก (LINE/…), ประวัติเติม (demo), เปลี่ยนตัวละคร, logout | 🟡 มีแค่ AuthPanel + ⚙️ menu เดิม | system | guest | BUILD-PLAN Phase P (backend ✅ · game-side ต่อ) + **§5 แผนนี้** |
| 11 | **ตั้งค่า** | รวม toggle ที่กระจายอยู่: เพลง/volume (U2), กลางวัน-กลางคืน, เสียงเอฟเฟกต์, reset demo | 🟡 กระจาย (DayNightToggle, music) | system | guest | ui-roadmap U2 MusicPlayer + ระบบที่มีอยู่จริง |

Legend: ✅ ใช้ได้ · 🟡 มีบางส่วน · ❌ ยังไม่มี

**สรุปสถานะ:** พร้อมใช้จริง = **ร้าน + แต่งตัว** · มีบางส่วน = โปรไฟล์/ตั้งค่า · fishing cluster (กระเป๋า/Fishdex/ร้านตกปลา) มี server logic บางส่วน (`server/src/fishing.ts` roll แล้ว) แต่ **ยังไม่มี UI เลย** · อันดับ/ชวนเพื่อน/อีเวนต์ ยังไม่เริ่ม · ตลาดปลา = เฟสหลังชัดเจน

### 3.1 ปุ่มที่ตัดทิ้ง (เป็นตัวอย่างจากเกมอื่น — ไม่มีระบบของเรา)

ภาพเมนู reference มาจากเกม MMO ตัวเต็มที่มีระบบต่อสู้ — ปุ่มเหล่านี้**ไม่ใช่ฟีเจอร์ของเกมเรา ตัดทิ้ง ไม่ทำ ไม่โชว์:**

- **โล่ (shield)** · **คราฟ (craft)** · **จ้างแมว (hire cat)** · **Gogo** · **ออโต้ (auto)** — สาย combat/idle ของเกมนั้น เกมเราไม่มีระบบรองรับและไม่มีใน roadmap ไหนเลย

### 3.2 ปุ่ม ref ที่ "มีของ" แต่ roadmap เราจัดคนละแบบ (ยุบ — ไม่มีปุ่มแยก)

| ปุ่มใน ref | ของจริงในเกมเรา (ตาม roadmap) |
|---|---|
| **เบ็ด** / **เหยื่อ** | ไม่มี panel แยก — ซื้อใน **ร้านตกปลา** (F1 ร้านเดียว: "ร้านคัน/เหยื่อ") · เก็บใน **กระเป๋า** · สวมคันผ่าน **แต่งตัว** (คัน = ช่อง weapon ตาม fishing doc) · สกินคันแบบ Jil ขายใน **ร้าน** (F3, ยิง buy_intent) |
| **ตีเบ็ด** | ไม่ใช่ปุ่มเมนู — เกิดจากเดินเข้าจุดตกปลา + กด **F** (`fishing:prompt` มีใน bus/CONFIG แล้ว) → มินิเกม 2D overlay. ใส่ในเมนูจะผิด flow เกมเราเอง |
| **สเตตัส** | ไม่มี panel — Lv/XP/ชื่อ/เงิน โชว์ใน **PlayerHUD** (U1) อยู่แล้ว · รายละเอียดบัญชีไปอยู่ **โปรไฟล์** |
| **การ์ด** | ไม่มีปุ่มแยก — Collection/Gacha/BattlePass/Supporter เป็น **แท็บใน ร้าน** ตาม U5 (CollectionTab/GachaTab/BattlePassTab/SupporterTab ใน StoreModal shell เดิม) |
| **เพื่อน** | friends list เต็มรูปแบบ**ไม่อยู่ใน roadmap** — มีแค่ปุ่ม add friend (mock) ใน ProfilePopup (U3). ถ้าอยากได้จริงต้องเพิ่มเข้า roadmap ก่อน แล้วค่อยลง registry (backlog §4.D) |
| **ตั้งห้อง** | chat-PLAN เลื่อนไว้ "เฟสถัดไป" ไม่มีสเปค — ใกล้เคียงสุดคือ "ห้องพิเศษ supporter" (D2) ซึ่งเป็นสิทธิ์เข้าห้อง ไม่ใช่การสร้างห้อง (backlog §4.D) |

> แชท/อิโมต/เพลง ก็ไม่อยู่ใน grid เช่นกัน — เป็น quick-access เดิมของมันตาม U2–U3 (ChatOverlay, EmotePanel, MusicPlayer) เพราะเป็นของที่กดบ่อยระหว่างเล่น ไม่ใช่ panel ที่เปิดเป็น modal

---

## 4. สเปค Panel รายกลุ่ม

### 4.A — มีแล้ว → refactor เข้า Hub (PA0–PA2, งานเบา)

- **ร้าน (shop)** — `StoreModal` ทำงานแล้ว. งาน: ลงทะเบียน registry, ถอดปุ่มลอย `s3`, ต่อ `GET /store/active` (backend Phase 5 เสร็จแล้ว) + countdown FOMO · แท็บ U5 (Collection/Gacha/BattlePass/Supporter) เพิ่ม**ในโมดัลนี้**ทีหลัง ไม่แตกปุ่มใหม่
- **แต่งตัว (customize)** — `CustomizePanel` ทำงานแล้ว. งาน: ลงทะเบียน registry, ถอดปุ่มลอย `s2`. อนาคต: คันเบ็ด (ช่อง weapon) โผล่ที่นี่เมื่อ fishing มา
- **ตั้งค่า (settings)** — รวม toggle ที่กระจายอยู่ (`DayNightToggle`, music/volume จาก U2, เสียงเอฟเฟกต์, ปุ่ม "reset demo") + รายการจาก ⚙️ เดิม (เปลี่ยนตัวละคร/logout — ย้ายไปโปรไฟล์เมื่อ PA1 เสร็จ)
- **โปรไฟล์ (profile)** — ดู §5 (Phase P game-side + LINE)

### 4.B — Fishing cluster (ผูก Phase F0–F1 · มี server logic รอ UI)

ตกปลา = **เครื่องรั้งคนอยู่ในแชท (retention)** ไม่ใช่ทำเงิน. ประกอบด้วย 1 overlay (ไม่ใช่ปุ่มเมนู) + 3 panel:

- **มินิเกมตีเบ็ด (overlay, ไม่อยู่ใน grid)** — server roll เสร็จแล้ว (`server/src/fishing.ts` + `fishing:cast`/`fishing:result` ใน shared/events). งาน UI: prompt "กด F" (bus `fishing:prompt` มีแล้ว) → เหวี่ยง→รอ→กด "ดึง!" (timing ตาม CONFIG.FISHING) → ผล comic (BAM/MISS/LEGENDARY) สีกรอบตาม tier ชุดเดียวกับร้าน. **ห้าม client สุ่มเอง**
- **กระเป๋า (bag)** — ปลา + ของสายตกปลา · ขายปลา→เกล็ด. ต่อ Go F0 (`GET /fishing/inventory`, `POST /fishing/sell`)
- **Fishdex** — สมุดสะสม → ครบเซ็ตปลดคอสเมติก (F0 reward line — ไม่ใช้เงินสักสกุล)
- **ร้านตกปลา (fishshop)** — คันเพิ่มพลัง + เหยื่อ จ่ายด้วย**เกล็ด** (F1 `POST /fishing/shop/buy`) · ปลดคันฟรีด้วย online-time/invite (F2) โชว์ progress ในนี้
- **ตลาดปลา (fishmarket)** — ราคาผันผวน. **เฟสหลังชัดเจน** — ลง registry เป็น `planned` (ปุ่มเทา "เร็วๆ นี้" เพื่อวัด demand ผ่าน `panel_open`) จนกว่า volume ถึง

> 🔑 กฎเหล็ก (BUILD-PLAN §7): **เกล็ด ≠ Jil** ห้ามแปลงข้าม · ตกปลาห้ามผลิต Jil · ซื้อด้วยเกล็ด**ไม่ยิง** buy_intent (ของ Jil เท่านั้นที่ยิง) · rarity สี = ชุดเดียวกับร้าน

### 4.C — Social/Growth (ผูก F2–F3 + Season)

- **ชวนเพื่อน (invite)** — invite-5 growth loop (F2): ลิงก์เชิญ + นับคนสมัคร → ปลดคันเบ็ดฟรี. **ผูกกับ social login กันบัญชีปลอม** (LINE/Google — อีกเหตุผลที่ §5 ต้องมาก่อน)
- **อันดับ (ranking)** — leaderboard ตกปลา (`GET /fishing/leaderboard`, F3) + legendary-drops feed (hype). Guest ดูได้
- **อีเวนต์ (event)** — ปุ่ม "event" มีใน ui-roadmap U4 (ActionBar) อยู่แล้ว. เนื้อหา = ซีซัน/คอลเลกชันที่เปิดอยู่ + countdown จาก `/store/active` (S4) — deep-link เข้าแท็บร้านได้

### 4.D — Backlog (มีเงาใน doc แต่ยังไม่มีสเปค — ห้ามลง registry จนกว่าจะเพิ่ม roadmap)

- **เพื่อน (friends list)** — roadmap มีแค่ mock add-friend ใน ProfilePopup (U3). ต้องเขียน spec + Friend domain (Go) ก่อน
- **ตั้งห้อง / ห้องพิเศษ** — chat-PLAN "เฟสถัดไป" + D2 supporter special room. ต้องตัดสินใจรูปแบบก่อน

---

## 5. บัญชี/โปรไฟล์ + Social Login (LINE ก่อน) 🎯

### 5.1 สถานะตอนนี้ (gap analysis)

**มีแล้ว:**
- `AuthProvider` model (`api/pkg/models/auth_provider.go`) — schema พร้อม (`provider` = google|apple|line, unique ต่อ provider+uid, หลาย provider ต่อ 1 user). **แต่ inert** — ไม่มี store/handler/route แตะเลย
- `AuthPanel.ts` — login/register (email+password) + เล่น guest
- JWT (HS256, 7 วัน, claims `{user_id, role}`)

**Gap ที่ทำให้ยังต่อ LINE ไม่ได้:**
1. `User.PasswordHash` เป็น `gorm:"not null"` → **social-only user (ไม่มีรหัสผ่าน) สร้างไม่ได้**
2. `User.Email` เป็น `not null unique` → LINE อาจไม่ให้ email (ต้องขอ scope + user อนุญาต) → email ต้อง **nullable**
3. ไม่มี OAuth flow: ไม่มี endpoint แลก code, ไม่มี LINE channel config
4. ไม่มี `AuthProviderStore` (create / find by provider+uid / list by user / unlink)
5. `family_name` เป็น `not null unique ถาวร` → LINE ให้แค่ displayName → ต้องมี **onboarding step** เก็บ family_name ครั้งแรก
6. Client ไม่มีปุ่ม LINE + ไม่มี callback handling + ไม่มีหน้าโปรไฟล์แสดง/จัดการ provider ที่ผูก

### 5.2 บันไดยืนยันตัวตน (ตาม BUILD-PLAN — ยืนยันแล้ว)

```
guest (session_id)
   → เข้าเล่นได้เลย เดิน/แชท (ไม่บันทึกชื่อ)
        → [ทางที่ 1] สมัคร standalone (email+password) — มีอยู่แล้ว
        → [ทางที่ 2] เข้าด้วย LINE ← ★ เพิ่มใหม่ (ง่ายสุดสำหรับคอมมูไทย)
             → ผูก Google/Apple เพิ่มทีหลัง (optional, กู้บัญชี/ข้ามเครื่อง)
```

> LINE มาก่อนเพราะ **คอมมูไทยใช้ LINE เป็นหลัก** (BUILD-PLAN ย้ำ "Line สำคัญคอมมูไทย") — ลดแรงเสียดทานสมัครได้มากสุด

### 5.3 LINE Login flow (OAuth 2.1 / OIDC)

```
[Client]                    [Go API]                      [LINE]
  กดปุ่ม "เข้าด้วย LINE"
  → GET /auth/line/url ──────►
                        สร้าง authorize URL
                        (channel_id, redirect_uri,
                         state[CSRF], scope=profile openid email)
  ◄──────────────────── { url }
  redirect ไป LINE ───────────────────────────────────────►
                                              user อนุญาต
  ◄────────────── redirect กลับ redirect_uri พร้อม ?code&state
  → POST /auth/line/callback ─►
     { code, state }     verify state
                        แลก code → LINE token (+ id_token JWT)
                        verify id_token → ได้ sub(lineUserId),
                          displayName, picture, email?
                        หา AuthProvider(line, sub):
                          • เจอ → login user นั้น
                          • ไม่เจอ + มี session logged-in → link
                          • ไม่เจอ + guest → สร้าง user ใหม่
                            (ยังไม่มี family_name → needs_profile=true)
                        ออก JWT ของเรา
  ◄──────────────────── { token, user, needs_profile }
  ถ้า needs_profile → โชว์ฟอร์มตั้ง family_name (ถาวร)
  → เข้าเกม
```

### 5.4 งาน Backend (Go)

ตามขั้น "Adding a New Domain": Model → Store → Handler → Register(FX) → Route → Migration

1. **แก้ `User` model:**
   - `PasswordHash` → nullable (`*string`) — social-only ไม่มีรหัส
   - `Email` → nullable (`*string`, ยัง unique เมื่อมีค่า) — LINE อาจไม่ให้
   - เพิ่ม `AvatarURL *string` (จาก LINE picture, optional)
2. **`AuthProviderStore`** (`api/pkg/store/authprovider/`): `Create`, `FindByProviderUID(provider, uid)`, `ListByUser(userID)`, `Delete(provider, userID)`
3. **LINE OAuth service** (`api/pkg/auth/line.go`): `AuthorizeURL(state)`, `Exchange(code) → tokens`, `VerifyIDToken(idToken) → LineProfile{sub, name, picture, email}`
4. **Handlers** (`api/pkg/handlers/api/oauth.handler.go`):
   - `GET  /auth/line/url` — คืน authorize URL + set state (short-lived)
   - `POST /auth/line/callback` — แลก code, login/register/link, คืน `{token, user, needs_profile}`
   - `POST /me/profile` — ตั้ง `family_name` ครั้งแรก (needs_profile flow) — validate unique+ถาวร
   - `GET  /me/providers` — list provider ที่ผูก (โชว์ในโปรไฟล์)
   - `POST /me/link/line` · `DELETE /me/link/line` — ผูก/ถอด (กันถอดตัวสุดท้ายถ้าไม่มีรหัสผ่าน)
5. **Config** (`core/config.go` + `.env.example`): `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_LOGIN_REDIRECT_URI`
6. **Register FX** + route ใน `api.go` (`/auth/line/*` public; `/me/link/*`, `/me/providers`, `/me/profile` หลัง JwtMiddleware)
7. **Migration:** column nullable + ตาราง auth_providers (GORM AutoMigrate มีอยู่แล้ว)

> ออกแบบ generic ตั้งแต่แรก: `oauth.handler.go` รับ `:provider` param → เพิ่ม Google/Apple ทีหลัง = เสียบ service ใหม่ ไม่ต้องรื้อ

### 5.5 งาน Client

1. **`AuthPanel.ts`:** เพิ่มปุ่ม **"เข้าสู่ระบบด้วย LINE"** (สีเขียว LINE #06C755) — เด่นสุด เพราะเป็น primary path
2. **Callback handling:** popup หรือ full-page redirect กลับ origin เกม → อ่าน `?code&state` → เรียก `/auth/line/callback`
3. **`net/api.ts`:** เพิ่ม `lineAuthUrl()`, `lineCallback(code, state)`, `setProfile(familyName)`, `listProviders()`, `linkLine()`, `unlinkLine()`
4. **Onboarding:** ถ้า `needs_profile` → ฟอร์มตั้ง family_name (reuse ช่อง `.auth-family` เดิม) ก่อนเข้าเกม
5. **Panel โปรไฟล์ (registry `id:'profile'`):** family_name, character slots + เปลี่ยนตัวละคร, provider ที่ผูก (LINE ✓ / Google ○ / Apple ○) + ปุ่มผูก/ถอด, ประวัติเติมเงิน (demo — `GET /me/topups` มีแล้ว), logout

### 5.6 AC (§5)

- [ ] guest กด "เข้าด้วย LINE" → อนุญาต → กลับมาเข้าเกมเป็น user ที่ผูก LINE
- [ ] user ใหม่ผ่าน LINE ที่ยังไม่มี family_name → บังคับตั้งก่อนเข้า (ถาวร, unique)
- [ ] user เดิม (email) → เปิดโปรไฟล์ → ผูก LINE เพิ่มได้ → คราวหน้า login ด้วย LINE ได้บัญชีเดิม
- [ ] social-only user (ไม่มีรหัสผ่าน) สร้าง/login ได้ (PasswordHash nullable ทำงาน)
- [ ] ถอด provider สุดท้ายไม่ได้ถ้าไม่มีรหัสผ่าน (กัน lock ตัวเองออก)
- [ ] `GET /me/providers` โชว์สถานะถูกใน panel โปรไฟล์
- [ ] Google/Apple เสียบเพิ่มได้โดยไม่รื้อ flow (generic `:provider`)

---

## 6. ลำดับการทำ (Panel phases — PA-series)

ทำทีละเฟส · ผ่าน AC ก่อนไปต่อ (แพตเทิร์นเดียวกับ U/D/F/S phases)

- **PA0 — Hub foundation:** ✅ **เสร็จแล้ว** — `MenuHub` + `panelRegistry` + `PanelManager` + `PanelShell` + `ComingSoonPanel` + `ProfilePanel` (stub). ลงทะเบียน **ร้าน + แต่งตัว + โปรไฟล์** + panel `planned` อีก 8 ตัวโชว์ "เร็วๆ นี้" + ยุบ ⚙️ เดิมเข้าโปรไฟล์ + ถอดปุ่มลอย `s2/s3/s4` (เสียงย้ายไป `s3`) + ยิง `panel_open`
  **AC:** §2.5 ผ่านครบ (verify ในเบราว์เซอร์แล้ว: toggle/single-open/ESC/coming-soon/มือถือ 3 คอลัมน์)
  *หมายเหตุ:* ปุ่มถุงปลา (`side-btn s6` จากงาน fishing ที่กำลังทำขนาน) ยังลอยอยู่ — ให้ยุบเข้า registry (`id:'bag'` เปลี่ยนเป็น live) ตอน PA3
- **PA1 — Account/LINE + โปรไฟล์ (§5):** ★ ก่อนงาน social/growth เพราะ invite-5 ต้องพึ่ง social login. Backend LINE OAuth + panel โปรไฟล์ + onboarding family_name
  **AC:** §5.6 ผ่านครบ
- **PA2 — ตั้งค่า:** รวม toggle กระจาย (เพลง/volume, กลางวัน-กลางคืน, reset demo) เข้า panel เดียว
  **AC:** ทุก toggle ทำงานจากใน panel · ของเดิมบนจอถูกถอด
- **PA3 — Fishing cluster UI (ผูก F0–F1):** มินิเกมตีเบ็ด (overlay) → กระเป๋า → Fishdex → ร้านตกปลา. รอ Go fishing domain (F0)
  **AC:** ตกปลาครบวงจร (เดินเข้าจุด→กด F→ผล server→เก็บ→ขาย→ซื้อของด้วยเกล็ด) · เกล็ด≠Jil ตรวจแล้ว
- **PA4 — Growth/Season (ผูก F2–F3 + S4):** ชวนเพื่อน (invite-5, ผูก LINE กันปลอม) + อันดับ + อีเวนต์
  **AC:** เชิญ/นับ/ปลดคันได้ · ดู leaderboard ได้ · อีเวนต์โชว์ซีซันจริงจาก `/store/active`
- **PA5 — Demand-signal & polish:** ตลาดปลา (`planned`) โชว์วัด demand → dashboard · micro-animation · responsive pass · empty/loading states
  **AC:** กดปุ่ม coming-soon ยิง signal เข้า dashboard · เมนูลื่นทั้ง desktop/มือถือ

> **ขนานกันได้:** PA0 ก่อนเสมอ · PA1 กับ PA2 ขนานได้ · PA3 รอ Go fishing F0 · PA4 รอ PA1 (social login)

---

## 7. Addendum สำหรับ CLAUDE.md (เพิ่มเมื่อเริ่มทำ)

```md
## Panel/Menu rules
- เมนู/panel ทุกตัวลงทะเบียนใน client/src/ui/menu/panelRegistry.ts (source of truth เดียว).
  ห้าม hardcode รายการ panel หรือสร้างปุ่มลอยเปิด panel ที่อื่น. Grid/deep-link/badge อ่านจาก registry.
- Panel ใหม่ต้องมีที่มาจากระบบที่มีจริงหรือ roadmap ของเรา (ui-roadmap/web-BUILD-PLAN/fishing docs) เท่านั้น
  — ห้ามเพิ่มปุ่มตามเกมอื่น. เบ็ด/เหยื่อ = ของในร้านตกปลา ไม่ใช่ panel; ตีเบ็ด = overlay จากจุดตกปลา (กด F)
  ไม่ใช่ปุ่มเมนู; Collection/Gacha/BattlePass/Supporter = แท็บใน StoreModal ไม่แตกปุ่มใหม่.
- เปิด panel ผ่าน PanelManager เท่านั้น (single-open, ESC, z-index). panel เดิม reuse ไม่เขียนซ้ำ.
- panel ที่ roadmap มีแต่ยังไม่ทำ = status 'planned' (โชว์เทา "เร็วๆ นี้" วัด demand) → ยิง panel_open analytics.
- gate 'account-required' → guest กดต้องเด้ง AuthPanel. gate 'premium' → panel ฝั่ง Jil/buy_intent.

## Account / Social login rules
- Identity ladder: guest(session_id) → standalone(email+password) | LINE → ผูก Google/Apple ทีหลัง.
  LINE เป็น primary path (คอมมูไทย). OAuth handler generic ต่อ :provider (AuthProvider table, 1 user หลาย provider).
- User.PasswordHash / User.Email = nullable (รองรับ social-only). family_name ถาวร unique — social user ใหม่
  ต้องตั้งผ่าน onboarding (needs_profile) ก่อนเข้าเกม. ถอด provider สุดท้ายไม่ได้ถ้าไม่มีรหัสผ่าน.
- LINE config = env (LINE_CHANNEL_ID/SECRET/REDIRECT_URI). อย่า commit secret.
```

---

## 8. ข้อต้องเคลียร์ก่อนลงมือ

1. **LINE Login** — มี LINE Developers channel (Channel ID/Secret) แล้วหรือยัง? redirect_uri จะ point ไปที่ origin เกม (client) หรือทำ callback route แยก? (ต้องเคลียร์ก่อน PA1)
2. **Backlog §4.D (เพื่อน list / ตั้งห้อง)** — ถ้าอยากได้ ให้เขียนเพิ่มเข้า roadmap ก่อน แล้วค่อยเพิ่ม PanelId (ไม่บล็อกเฟสไหนตอนนี้)

> ปุ่มจากภาพ ref ที่ไม่มีระบบของเรา (โล่/คราฟ/จ้างแมว/Gogo/ออโต้) ตัดทิ้งแล้ว · ปุ่มที่มีของแต่คนละรูปแบบ (เบ็ด/เหยื่อ/ตีเบ็ด/สเตตัส/การ์ด) ถูกยุบเข้าที่ที่ถูกต้องตาม §3.2
