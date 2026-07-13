# 12Tails Web — แผนรวมการสร้าง Landing + Admin Dashboard (Master Build Plan)

เอกสารนี้ = **ตัวร้อยทุก spec เข้าด้วยกัน** + ลำดับการทำ + checklist เดียวจบ
สำหรับสร้างส่วนเว็บ (landing สาธารณะ + admin dashboard) เพื่อ **โปรโมทให้คนลองเล่น → เก็บดีมานด์จริง → เอาไป pitch ขอเช่าลิขสิทธิ์กับ Bigbug**

> 🔗 เอกสารลูกที่เอกสารนี้ควบรวม:
> - [12tails-web-spec.md](12tails-web-spec.md) — landing + admin + analytics (phases **L0–L6**)
> - [12tails-admin-season-scheduling.md](12tails-admin-season-scheduling.md) — เวียนขายซีซัน (phases **S0–S4**)
> - [12tails-demo-monetization-plan.md](12tails-demo-monetization-plan.md) — demo store ในเกม (**D0–D5**, ทำแล้วบางส่วน)
> - [12tails-chat-PLAN.md](12tails-chat-PLAN.md) — เกมหลัก · [DEPLOY.md](DEPLOY.md) — deploy เกม
> - [ระบบตกปลา-12หาง.md](ระบบตกปลา-12หาง.md) — ดีไซน์ระบบตกปลา (+ `prompt-pack-ตกปลา-12หาง.md`, `context-brief-claude-code-ตกปลา.md`)
> - เทมเพลตหลังบ้าน Go: `larkornsan-api/PROJECT_TEMPLATE.md` (Echo + GORM + Uber FX + JWT)

> 🎯 **เป้าหมายเดียว:** เปลี่ยน traffic → **ข้อมูลดีมานด์** (ไม่ใช่แค่เว็บสวย)
> 🔴 **ยังไม่มีการขายจริง** — `buy_intent` = "สัญญาณอยากซื้อ" ไม่ใช่ "ยอดขาย" · ห้ามต่อ payment gateway
> ⚖️ landing เป็นสาธารณะ + ใช้ IP ของ Bigbug → ใช้ art placeholder/ออริจินอล + ระบุ *fan project* จนกว่าจะได้ไฟเขียว

> ⚙️ **STACK OVERRIDE (สำคัญ):** เอกสารนี้**ยกเลิก**สแตกเดิมใน web-spec/admin-season ที่ให้ Next.js ทำ API + Prisma + Postgres เอง
> แทนด้วย: **หลังบ้าน = Go template (Echo+GORM+FX) + PostgreSQL** · **หน้าบ้าน = Next.js (ล่าสุด) + Zustand + TanStack Query + Axios** (pure frontend)
> ส่วน checklist ฟีเจอร์/AC/taxonomy ใน spec ลูกยังใช้ได้ตามเดิม — เปลี่ยนแค่ "ใครเป็นคนทำ API + DB"

---

## 1. สถานะปัจจุบัน (มีอะไร / ขาดอะไร)

### ✅ พร้อมแล้ว
| ส่วน | รายละเอียด |
|---|---|
| **ตัวเกม** | Client (Phaser 3 + Three.js ตัวละคร 2.5D) + Server (Socket.IO relay) + shared — เดิน/แชท/emote multiplayer ครบ, เล่นได้จริง |
| **Deploy เกม** | `render.yaml` + `DEPLOY.md` พร้อม (client→Vercel, server→Render/Railway) |
| **Demo store ในเกม** | `CONFIG.DEMO_STORE=true`, `DemoBanner`, `demoState.ts` (Jil ปลอม + ซื้อ/ปลดล็อก/reset, client-side + localStorage) |
| **สเปคครบ** | web-spec (L0–L6), admin-season (S0–S4), demo-monetization (D0–D5) |
| **หน้าตา landing** | `12tails-landing-mockup.html` — ออกแบบเสร็จ (โทนอุ่น/กลมมน, Mitr+Sarabun, tokens ตรงเกม) → เหลือพอร์ตเป็น Next.js |
| **Character seed** | `12tails-characters-seed.md` — ข้อมูล 12 เผ่า |
| **ดีไซน์ตกปลา** | `ระบบตกปลา-12หาง.md` (+prompt-pack, context-brief) — spec ครบ, **ยังไม่มีโค้ด** |
| **เทมเพลตหลังบ้าน** | Go REST API template ที่ทีมถนัด (layered + repository + FX) — ใช้เป็นพิมพ์เขียว |

### สถานะการสร้าง
- [x] **Go API (`/api`) + PostgreSQL + `POST /track` + `POST /waitlist`** — ✅ **Phase 1 เสร็จ** (Echo+GORM+FX ตามเทมเพลต · build+vet ผ่าน · verify กับ Postgres จริง)
- [ ] **Next.js frontend (`/web`)** (landing + admin) — ยังไม่มี
- [ ] **บัญชีผู้เล่น + โปรไฟล์เกม** ⭐ — register/login, `family_name` ถาวร, `Character`+slots, nameplate 2 บรรทัด, ประวัติเติมเงิน (ตอนนี้ชื่อเป็น ephemeral ไม่มีบัญชี → นับคนจริง/รู้ว่าใครเติมไม่ได้)
- [ ] **เกมยิง analytics** ⭐ — `demoStore.buy()` แค่แก้ localStorage **ไม่ส่ง `buy_intent` ไปที่ไหน** (จุดเชื่อมที่ขาดและสำคัญสุด)
- [ ] **Admin dashboard** — funnel, demand ranking, would-be revenue, CSV export
- [ ] **Season scheduling** — `Collection`/`CosmeticItem`, `GET /store/active`, timeline
- [ ] **ระบบตกปลา (backend)** — server-roll `POST /fishing/cast`, เกล็ด wallet, inventory/Fishdex, retention metrics (มีแต่ spec)
- [ ] Waitlist, consent banner, Discord/community CTA, SEO/OG

---

## 2. Tech stack (ฉบับปรับใหม่)

| Layer | เทคโนโลยี | หมายเหตุ |
|---|---|---|
| **Backend API** | Go + **Echo** + **GORM** + **Uber FX** + JWT + Viper + Logrus + validator + gormigrate | ตามเทมเพลต `PROJECT_TEMPLATE.md` แบบเป๊ะ |
| **Database** | **PostgreSQL** | สลับจาก MySQL → ใช้ `gorm.io/driver/postgres`, docker `postgres:16` |
| **Frontend** | **Next.js (ล่าสุด, App Router)** + TypeScript + Tailwind | pure frontend — ไม่มี API route/Prisma |
| **State (client)** | **Zustand** | consent, sessionId, admin filters/date range |
| **State (server data)** | **TanStack Query** | ดึง dashboard metrics / collections / cache |
| **HTTP client** | **Axios** | instance เดียว: base URL ของ Go API + แนบ session_id/JWT |
| **Charts (admin)** | Recharts หรือ Tremor | เลือกตอน Phase 4 |
| **Deploy** | **Cloudflare Pages** (Next.js + เกม client, ฟรี) · **AWS** (Go API + Node relay + RDS Postgres) · asset CDN = **R2/S3** (เฟสหลัง) | เริ่มถูกสุด: CF ฟรี + เครดิต AWS — ดู §6/§8 |

> 🔧 **สิ่งที่ต้องสลับจากเทมเพลต (MySQL→Postgres):** driver เป็น `gorm.io/driver/postgres` · `MySQLConfig`→`PostgresConfig` (หรือใช้ `DATABASE_URL` เดียว) · DSN เป็น `host=... user=... dbname=... sslmode=...` · docker-compose ใช้ `postgres:16`
> 🔧 **บริการเทมเพลตที่ปรับ:** Redis / Mongo — ตัดได้ · **storage (R2/S3)** = เปิดเฟสหลัง (asset/รูปโปรไฟล์ทำ CDN) · **Gmail-send (OTP)** = ออปชัน (สมัครแบบ light ก่อน) · **social login Google/Apple/Line** = OAuth เฟสหลัง (ดู Phase P)

---

## 3. สถาปัตยกรรม (4 ก้อน + DB — เชื่อมกันยังไง)

```
                          ┌───────────────────────────────────────┐
   ผู้เล่น ──HTTPS───────────> │ [A] Next.js frontend (Vercel)          │
                          │     landing (public) + /admin (protected)│
                          │     Zustand · TanStack Query · Axios     │
                          └───┬───────────────────────▲─────────────┘
                              │ Axios: track / waitlist │ TanStack: admin metrics
                              ▼ (JWT สำหรับ /admin)      │
   ผู้เล่น ──HTTPS──> [B] Game client (Phaser/Vercel) ──track──┐        │
                              │ WSS positions/chat              ▼        │
                     [C] Game server (Socket.IO/Render) ┌───────────────┴────┐
                          (relay เดิม — ไม่แตะ)          │ [E] Go REST API     │
                                                        │ Echo+GORM+FX+JWT    │
                                                        │ POST /track         │
                                                        │ POST /waitlist      │
                                                        │ GET  /store/active  │
                                                        │ /admin/* (JWT+admin)│
                                                        └─────────┬───────────┘
                                                                  ▼
                                                        [D] PostgreSQL (GORM)
```

**หัวใจ = ingestion ร่วมกัน:** ทั้ง landing [A] และเกม [B] ยิง event → `POST /track` (Go [E]) → Postgres [D] → admin [A] ดึงสรุปผ่าน TanStack Query

**Deploy:** [A]/[B] → **Cloudflare Pages** (ฟรี · Next.js static export: landing SSG + admin client SPA) · [C]/[E] → **AWS** (long-running, WebSocket-capable) · [D] → **RDS Postgres** · asset/รูปโปรไฟล์ CDN (เฟสหลัง) → **R2** (egress ฟรี) หรือ S3+CloudFront

> ℹ️ **มี 2 หลังบ้านคนละหน้าที่ (ตั้งใจ):** [C] Node/Socket.IO = realtime relay (ตำแหน่ง/แชท, ไม่เก็บถาวร) · [E] Go/REST = ข้อมูลถาวร (analytics/waitlist/store). ไม่รวมกัน — **ระบบตกปลาใช้ทั้งคู่** (roll+persist ที่ [E], hype broadcast ที่ [C]) ดู §7
> ⚠️ **Cross-origin:** เกม+landing อยู่คนละ origin กับ Go API → เปิด **CORS** ที่ Go (origin ของ client+web) และแนบ `session_id` แบบ **client-generated UUID** (เก็บใน localStorage, ส่งใน body/header) แทน cookie ข้ามโดเมน (ง่ายกว่า)
> 🔗 **Event taxonomy เป็น contract ข้ามภาษา:** ฝั่ง TS (เกม+web) ถือ shape เดียวกัน · Go models mirror ตาม (JSON **snake_case** ตามคอนเวนชันเทมเพลต)
> 🆔 **Identity:** guest = `session_id` (anonymous UUID) · logged-in = แนบ `account_id` (JWT) เพิ่ม · เชื่อม session_id↔account ตอน register เพื่อ funnel attribution (ดู Phase P)

---

## 4. โครงสร้างโปรเจกต์ (monorepo — repo เดียวกับเกม)

**ทุกอย่างอยู่ใน `12-tails-mini-game/` repo เดียว** เพื่อจัดการที่เดียว (npm workspaces ระบุ package เป็นชื่อชัดๆ ไม่ใช่ glob → โฟลเดอร์ `api/` (Go) กับ `web/` (Next.js) จึงไม่ถูก npm/TS แตะ · Go module มี `go.mod` ของตัวเอง แยกอิสระ). โตขึ้นค่อย `git subtree split` แยกออกทีหลังได้ (ประวัติติดไปด้วย)

```
12-tails-mini-game/
  docker-compose.yml  .env(.example)   ★ คุมทั้ง stack — build+run ครั้งเดียว (env รวมที่เดียว, section ต่อ service)
  .dockerignore
  /client  /server  /shared           (เกม — Phaser · Socket.IO relay · TS contracts)
    client/Dockerfile · client/nginx.conf · server/Dockerfile   ★ ใหม่

  /api/                 ★ Go module (github.com/mac-checken/12tails-api) — ตาม PROJECT_TEMPLATE.md
    main.go  Dockerfile   (docker-compose + .env ใช้ของ root)
    pkg/
      core/config.go                   # Config + PostgresConfig + DSN()  ✅ Phase 1
      db/db.go                         # GORM postgres + gormigrate       ✅ Phase 1
      logger/                          # Logrus + request logging          ✅ Phase 1
      handlers/api/
        api.go                         # Server, CORS, routes              ✅ Phase 1
        track.handler.go  waitlist.handler.go                              ✅ Phase 1
        middleware.go                  # JWT + IsAdmin (Phase P/4)
        store.handler.go               # GET /store/active (Phase 5)
        admin.handler.go               # metrics / demand ranking / CSV (Phase 4)
        fishing.handler.go             # /fishing/cast ฯลฯ (F-track)
      models/  event.go waitlist.go (✅) · user.go character.go collection.go … (ถัดไป)
      store/   event/ waitlist/ (✅) · user/ character/ collection/ … (ถัดไป)
      utils/liveness/                  # isLiveNow / statusLabel (Phase 5)

  /web/                 ★ Next.js (ล่าสุด) frontend — deploy → Cloudflare Pages
    app/(marketing)/…   landing สาธารณะ (พอร์ตจาก mockup)
    app/admin/…         dashboard (protected ด้วย JWT)
    lib/api/axios.ts    # instance: baseURL Go API + interceptor (session_id/JWT)
    lib/api/queries.ts  # TanStack Query hooks
    lib/analytics/events.ts   # ★ taxonomy (แหล่งเดียวฝั่ง web — ห้าม inline)
    lib/store/*.ts      # Zustand: consent, session, filters
```

> ✅ **Phase 1 สร้างแล้ว** ที่ `/api` (Echo+GORM+FX+Postgres · `/health`, `POST /track`, `POST /waitlist` · build+vet ผ่าน · verify กับ Postgres จริงแล้ว)
> 💡 dev ports เครื่องนี้: API `:5055` (AirPlay จอง 5000), Postgres host `:5433` (โปรเจกต์อื่นจอง 5432) — ดู `api/.env`

---

## 5. ลำดับการทำ (เรียงตามคุณค่าต่อเป้าหมาย licensing)

> หลักการ: **"การวัดผล" มาก่อน "หน้าตา"** — mockup เสร็จแล้ว แต่เดโมยังไม่เก็บข้อมูลอะไรเลย

| # | เฟส | map ไป spec | ทำไมลำดับนี้ |
|---|---|---|---|
| **1** | Go API backbone + ingestion | L0 | ไม่มีอันนี้ = วัดผลไม่ได้ traffic เสียเปล่า |
| **P** | บัญชีผู้เล่น + โปรไฟล์เกม (family/character/slots) | ใหม่ | รากฐาน identity — ทำหลัง Phase 1 · จำเป็นก่อน top-up/persist/fishing |
| **2** | เชื่อมเกม → API ⭐ | L2 (ส่วนเกม) | ทำให้ demo store ที่มีอยู่แล้ว **เริ่มสร้างข้อมูล** ตั้งแต่วันแรก |
| **3** | Next.js frontend + Landing | L1 | โปรโมทได้ + เก็บ data ตั้งแต่คนแรก |
| **4** | Admin dashboard ⭐ | L3–L4 | ตัวชูโรง pitch — "ชุดที่คนอยากซื้อสุด" + would-be revenue + CSV |
| **5** | Season scheduling | S0–S4 | เล่าโมเดล "รายได้ต่อเนื่อง/เวียนขาย" (pitch amplifier) |
| **6** | Polish + deploy | L5–L6 | SEO/OG + ขึ้น production + verify |
| **F** | ระบบตกปลา (backend + analytics + admin) | F0–F3 (ดู §7) | retention engine — รันขนานได้หลัง Phase 1; วัดผล = หนุน pitch โดยตรง |

---

## 6. รายละเอียดแต่ละเฟส + Acceptance Criteria

> 🧭 ทุกเฟสฝั่ง Go ทำตามขั้นตอน **"Adding a New Domain"** ของเทมเพลต: Model → Store → Handler → Register (FX + api.Server) → Route → Migration

### Phase 1 — Go API backbone + ingestion  `(= L0)` ✅ เสร็จแล้ว
- [x] scaffold `/api` จากเทมเพลต (Echo+GORM+FX+Viper+Logrus+validator+gormigrate) — **สลับเป็น Postgres**
- [x] `docker-compose.yml` postgres:16-alpine + `core/config.go` `PostgresConfig` + `DSN()`
- [x] domain **Event** — `Event{ SessionID, AccountID*, Type, ItemID*, Meta(JSONB), Referrer*, CreatedAt }` + store + `POST /track` (session_id: body→header→gen · meta jsonb · index `(type,created_at)`)
- [x] domain **Waitlist** — `Waitlist{ Email(unique), Source*, CreatedAt }` + `POST /waitlist` (dedupe + lowercase)
- [x] CORS ให้ origin ของเกม + landing · รับ `session_id` (client-generated UUID)
- [x] gormigrate: AutoMigrate `Event`, `Waitlist`
- **AC:** ✅ `curl POST /track` → row ใน Postgres, field ครบ · buy_intent ดึง price/type จาก jsonb ได้ · `/waitlist` กันซ้ำ
- 🔜 ต่อยอด: aggregate methods ใน EventStore (ไว้ทำ dashboard Phase 4)

### Phase P — บัญชีผู้เล่น + โปรไฟล์เกม  `(ใหม่ · ทำหลัง Phase 1)` 🟡 backend เสร็จ · game-side ต่อ
> เดิม Phase 3 = landing/frontend เท่านั้น **ไม่รวม**บัญชีผู้เล่น — นี่คือส่วนที่เพิ่ม
> ปัจจุบัน `CharacterSelect` ให้พิมพ์ "ชื่อเล่น" → `player:join` แบบ ephemeral · ไม่มีบัญชี/ownership/ประวัติ
> **ทำไมจำเป็น:** ไม่มีบัญชี = ไม่มีประวัติเติมเงิน, ไม่รู้ใครเติม, นับ "คนจริง" (registered) ไม่ได้. บัญชีปลดล็อก registered/MAU, top-up attribution, identity ถาวรของ character/fishing inventory, และผูก `buy_intent` กับ "ใคร"
> **บันไดยืนยันตัวตน (progressive · ✅ เคาะแล้ว):** guest (session) → **สมัคร standalone** (email/username+password · ไม่ต้องผูก social · OTP ออปชัน) → **ผูก Google / Apple / Line** ทีหลัง (optional — กู้บัญชี/ล็อกอินข้ามเครื่อง). Line สำคัญสำหรับคอมมูไทย

- [x] **Go models** ✅ — `User`(+`family_name` unique ถาวร) · `Character{user_id,name,character_id,appearance jsonb,slot_index}` (unique ต่อ slot) · `AuthProvider` (schema พร้อมสำหรับ social) · `TopUp` (demo history)
- [x] **Go endpoints** ✅ — `POST /auth/register` (standalone, bcrypt), `POST /auth/login`→JWT (HS256, 7 วัน) · `GET /me` · `GET/POST /me/characters` (slot limit 3) · `POST /me/topup` + `GET /me/topups` · `JwtMiddleware`+`IsAdmin` · 🔜 เฟสหลัง: OAuth `/auth/link/:provider` (Google/Apple/Line), name-change ด้วย Jil
- ℹ️ **ไม่ทำ** `PATCH /me/family-name` แบบฟรี — เพราะชื่อ**ถาวร** (เปลี่ยน = ไอเทม Jil ทีหลัง)
- [ ] **แสดง 2 บรรทัด:** family_name (บรรทัด 1) + character.name (บรรทัด 2) — แก้ `player:join` payload + nameplate `Overhead.ts` + `ChatBubble`
- [ ] **game-side (client):** หน้าจอ register/login ก่อนเข้าเกม · `CharacterSelect` → **character-slot picker** (เลือก/สร้างในช่องว่าง/สลับตัว) · เก็บ JWT แนบทุก request ที่ต้อง persist
- [ ] ชื่อ **ถาวร** — เปลี่ยนได้เฉพาะผ่านไอเทม Jil (`name_change`) · slot เพิ่มด้วย Jil (`char_slot`) → ยิง `buy_intent`
- [ ] **guest gate (แนะนำ):** guest เดิน/คุยได้ด้วยชื่อชั่วคราว (นับเป็น session) · บังคับ register เมื่อจะจองชื่อถาวร/เก็บตัวละคร/เติมเงิน/เก็บ inventory ตกปลา — รักษา funnel "เข้ามาลองก่อน"
- **AC (backend ✅ verify แล้ว):** สมัคร→ได้ family_name ถาวร + สร้าง character (slot 0-2, ตัวที่ 4 = 409) · dup family = 409 · password เก็บเป็น bcrypt · JWT กัน `/me/*` · topup history รวมยอดถูก · nameplate = family/name (ชื่อ family / ชื่อตัวละคร)
- 🔜 **เหลือ game-side:** register/login UI ก่อนเข้าเกม · `CharacterSelect` → character-slot picker · nameplate 2 บรรทัด (`Overhead.ts`/`ChatBubble`) + `player:join` payload · แนบ JWT + `account_id` ในทุก event (คู่กับ Phase 2)

### Phase 2 — เชื่อมเกม → API ⭐  `(= L2 ส่วนเกม)`
> จุดเชื่อมสำคัญสุด: ทำให้เกมที่ deploy แล้วเริ่มส่งสัญญาณดีมานด์
- [ ] client helper `track()` → POST ไป Go `/track` (base URL ผ่าน `VITE_API_URL`) + session UUID ใน localStorage
- [ ] เมื่อ login แล้ว (Phase P) แนบ `account_id` ในทุก event เพิ่มจาก `session_id`
- [ ] ยิง `game_open`, `play_start(character_id)`, `shop_open(tab)`
- [ ] **`buy_intent`** — เพิ่มใน `demoStore.buy()` / `StoreModal`: แนบ `item_id`, `item_type`, `price_jil` **นอกเหนือ**จากปลดล็อกในเครื่อง
- [ ] `gacha_pull` / `battlepass_intent` / `supporter_intent` (ถ้าเปิดพื้นผิวนั้น)
- **AC:** เดินครบ flow ในเกม → event ถูกบันทึกทุกจุด, `buy_intent` มี `item_id`+`price_jil` จริง

### Phase 3 — Next.js frontend + Landing  `(= L1)`
- [ ] scaffold `/web`: Next.js ล่าสุด + TS + Tailwind + **Zustand + TanStack Query + Axios**
- [ ] `lib/api/axios.ts` (baseURL Go API + interceptor session/JWT) · QueryClient provider · Zustand: `consent`, `session`
- [ ] `lib/analytics/events.ts` — TS taxonomy (mirror กับ Go)
- [ ] พอร์ต `12tails-landing-mockup.html` → components (design tokens เดิม): Hero+CTA+waitlist · "มันคืออะไร" · ฟีเจอร์ grid · 12 เผ่า (art slot) · Discord CTA · Footer *fan project*
- [ ] waitlist form → TanStack **mutation** → `POST /waitlist` · ยิง `page_view`/`cta_click`/`waitlist_signup`
- [ ] consent banner (Zustand) + ลิงก์ privacy · responsive มือถือ
- **AC:** landing เปิดสวย ลงมือถือ · กรอก waitlist → มี row · เข้าเกมจากปุ่มได้ · event ถูกยิง

### Phase 4 — Admin dashboard ⭐  `(= L3–L4)`
- [ ] **Go:** admin auth ด้วย JWT ของเทมเพลต (seed 1 admin user, `POST /auth/login` → JWT, `/admin/*` = `JwtMiddleware`+`IsAdmin`) — ไม่เปิด public register
- [ ] **Go:** `/admin/metrics` (aggregate SQL): cards (unique session/players/waitlist/DAU · **registered users/MAU**) · funnel counts · **demand ranking** (group by `item_id`) · would-be revenue (Σ intent×price) · **ประวัติเติมเงิน(demo) ต่อบัญชี** · time series · referrers
- [ ] **Go:** `/admin/events/export` → CSV
- [ ] **Web:** `/admin` (protected) + หน้า login · date filter (Zustand) · ดึงผ่าน **TanStack Query**
- [ ] **Web:** charts — top-line cards · funnel % · **★ bar chart "ชุดที่คนอยากซื้อสุด"** · would-be revenue (ระบุ *"ประมาณการจากความสนใจ ไม่ใช่ยอดขาย"*) · time series · ปุ่ม export CSV
- **AC:** เห็น "ชุดที่คนอยากซื้อสุด" เป็นกราฟ + funnel % ถูก + export CSV ได้

### Phase 5 — Season scheduling  `(= S0–S4)`
- [ ] **Go:** domain **Collection** + **CosmeticItem** (+ seed "ชุดฤดูร้อน") + `utils/liveness` (`isLiveNow`/`statusLabel` — **computed on read, ไม่มี cron**)
- [ ] **Go:** `GET /store/active` (public) คืนเฉพาะ live + `ends_at` · admin CRUD collection/item + `POST …/duplicate` (เวียนขาย, status=draft) + override live/off/draft
- [ ] **Web (admin):** หน้ารายการ+แก้ไข (date picker) + **★ Gantt/timeline** เห็นช่วงขายทุกคอลเลกชัน + จับช่องว่าง/ทับซ้อน
- [ ] **เดโมร้าน:** อ่าน `/store/active` + **countdown FOMO** · `buy_intent` แนบ `collection_id` → dashboard "ดีมานด์ต่อซีซัน"
- **AC:** ตั้งวันแล้วของขึ้น/หายตามเวลา · duplicate คลิกเดียว · dashboard เทียบดีมานด์ระหว่างซีซันได้

### Phase 6 — Polish + deploy  `(= L5–L6)`
- [ ] SEO/OG tags · feedback survey ("อยากได้ชุด/เผ่าแบบไหน" → event `feedback`)
- [ ] deploy **Next.js + เกม client → Cloudflare Pages** (Next `output: 'export'` — landing SSG เพื่อ SEO + admin เป็น client SPA · gate /admin ด้วย JWT ฝั่ง client, Go บังคับ auth ที่ data อยู่แล้ว = defense in depth) — ถ้าต้อง SSR ค่อยใช้ `@cloudflare/next-on-pages`
- [ ] deploy **Go API → AWS** (App Runner หรือ EC2/Fargate — long-running, WebSocket ได้) · **Node relay [C] → AWS** (WebSocket-capable) · **Postgres → RDS** (free-tier/เครดิต)
- [ ] (เฟสหลัง) asset/รูปโปรไฟล์ → **R2** (egress ฟรี เหมาะทำ CDN คู่ CF Pages) หรือ **S3+CloudFront** ถ้าอยู่ AWS ล้วน — เลือกตอนต้องเก็บรูปจริง
- [ ] ตั้ง env + CORS: origins = โดเมน CF Pages · `NEXT_PUBLIC_API_URL`/`VITE_API_URL` → AWS API · `DATABASE_URL`(RDS), `JWT_SECRET_KEY` (Go)
- **AC:** landing + dashboard + API ออนไลน์จริง · ยิง event จาก prod ได้ · export CSV จากข้อมูลจริง

---

## 7. ระบบตกปลา (Fishing) — จุดเชื่อมกับ API + Analytics + Dashboard

> 📄 ดีไซน์เกมฝั่งเล่นจริง (มินิเกม 2D, trigger zone, เอฟเฟกต์) อยู่ที่ [ระบบตกปลา-12หาง.md](ระบบตกปลา-12หาง.md).
> ส่วนนี้สรุป **เฉพาะจุดที่ตกปลาต้องพึ่ง API/Postgres/Dashboard ในแผนนี้** — ไม่ทับดีไซน์มินิเกม

**ทำไมเกี่ยวกับ pitch (สำคัญ):** หน้าที่ตกปลา = **รั้งคนให้อยู่ใน world chat (retention)** ไม่ใช่ทำเงิน → ตรงกับสิ่งที่ dashboard วัดพอดี. ถ้าโชว์ Bigbug ได้ว่า *"ตกปลา → session ยาวขึ้น/คนกลับมา + สร้าง demand ใหม่ให้ Jil (สกินคัน/ตู้พรีเมียม)"* = **pitch แข็งขึ้นมาก** (ไม่ใช่แค่มีคนเล่น แต่รักษาคอมมูได้)

### กฎเหล็ก (ต้องบังคับทุกเลเยอร์)
- **สกุลเงินแยก "เกล็ด" (Scales) ≠ Jil** — ตกปลา**ห้ามผลิต Jil**. เกล็ดซื้อได้แค่ของสายตกปลา (คัน/เหยื่อ/ของแต่งตู้). Jil ไม่จำเป็นต่อการตกปลาเก่งขึ้น (ไม่ pay-to-win)
- **Server-authoritative** — server สุ่มผล (ติด/หลุด, ปลาอะไร, rarity) → client เล่นอนิเมชัน 2D ตามผล. ห้าม client สุ่มเอง (กันปั๊ม/เสกไอเทมมีมูลค่า)
- **rarity tier + สีกรอบ ใช้ชุดเดียวกับคอสตูมร้าน** (เขียว/น้ำเงิน/ม่วง/ทอง) — รู้สึกเป็นเกมเดียว
- **buy_intent เฉพาะของที่ซื้อด้วย Jil** — ซื้อด้วยเกล็ด = ไม่ใช่สัญญาณรายได้ → **ห้ามยิง buy_intent**. สกินคัน/ตู้พรีเมียม (Jil) = ยิง `buy_intent` หมวด `fishing` → พิสูจน์ว่าตกปลา **หนุน** Jil

### แบ่งงาน: game-side vs แผนนี้
| game-side (ดีไซน์แยก) | แผนนี้ (Go API + Postgres + Dashboard) |
|---|---|
| trigger zone จุดตกปลา + prompt กด F | รับ "cast" → **server สุ่มผล + persist** |
| มินิเกม 2D + คอมิกเอฟเฟกต์/เสียง/rarity | inventory · เกล็ด wallet · Fishdex · rod unlock |
| นั่งท่าถือคัน (ไม่มีอนิเมชันพิเศษ) | online-time accumulation (ปลดคันฟรี 2ชม./วัน) |
| broadcast "ใครได้ legendary" ในแชท ([C] relay) | loot table (data) · leaderboard/tournament |

### Go domains + endpoints ใหม่ (ตามขั้น Adding a New Domain)
- domains: `ScaleWallet` · `FishCatch`/`Inventory` · `Fishdex` · `RodUnlock`+`OnlineTime` · `FishShopItem` · (เฟสหลัง) `Aquarium`, `FishingLeaderboard`, `FishMarketPrice`
- endpoints: `POST /fishing/cast` (server roll) · `GET /fishing/inventory` · `POST /fishing/sell` (→เกล็ด) · `POST /fishing/shop/buy` (เกล็ด) · `GET /fishing/leaderboard`
- loot table = **data ล้วน** (พิกัด + ตารางปลาต่อจุด/เวลา — กลางคืน/ฝนต่างกัน) ไม่ผูก rig/animation

### Analytics events เพิ่ม (mirror TS↔Go)
`fishing_prompt_shown` · `fishing_cast` · `fish_caught{ fish_id, rarity }` · `fish_miss` · `rod_unlocked{ method: online|invite }` · `scales_earned/spent` · `fishing_shop_open` · `fishdex_complete{ set }` · (Jil) `buy_intent{ item_type: fishing_skin|aquarium_premium }`

### Admin dashboard เพิ่ม (retention lens — ตัวชูโรงใหม่ของ pitch)
- **Retention:** avg session length / return rate — เทียบคนที่ตกปลา vs ไม่ตก
- **Fishing funnel:** `prompt_shown → cast → caught → sell/shop`
- **Scales economy health:** faucet (เกล็ดที่ผลิต) vs sink (เกล็ดที่ใช้) — จับ inflation
- **Jil demand จากตกปลา:** `buy_intent` หมวด fishing (สกินคัน/ตู้) = พิสูจน์ line-3 "ตกปลาสร้าง demand ให้ Jil"
- leaderboard / legendary-drops feed (hype metric)

### Phase F0–F3 (ทำหลัง Phase 1 API backbone · รันขนานกับ Phase 4–5 ได้)
- **F0 — Server-roll + reward line 2** (ตาม spec §3: เริ่ม "ปลดของจากความสำเร็จ" ก่อน ยังไม่ต้องมีสกุลเงินที่สอง): `POST /fishing/cast` (server ชี้ผล) + inventory + Fishdex + ปลดคอสเมติกเมื่อครบเซ็ต. **AC:** cast แล้ว server เป็นคนตัดสินผล, ปลดของครบเซ็ตได้, client แค่เล่นอนิเมชัน
- **F1 — เกล็ด + fishing shop:** `ScaleWallet` + ขายปลา→เกล็ด + ร้านคัน/เหยื่อ (ด้วยเกล็ด). **AC:** เกล็ด faucet/sink แยกจาก Jil 100% (ตรวจว่าซื้อคอสตูมพรีเมียมด้วยเกล็ดไม่ได้)
- **F2 — ปลดคันด้วยออนไลน์ + growth loop:** `OnlineTime` (2ชม./วัน → คันฟรี) / invite-5 (ผูก Google, กันบัญชีปลอม). **AC:** ปลดคันจากเวลา/เชิญเพื่อนได้ + กันบัญชีปลอม
- **F3 — premium (Jil) + admin:** สกินคัน/ตู้พรีเมียม (Jil → `buy_intent` หมวด fishing) + retention/economy metrics + leaderboard broadcast ([C] relay). **AC:** dashboard โชว์ retention lift + Jil demand จากตกปลา

> 🔭 เก็บไว้เฟสหลัง (ตาม spec §8–9): ตลาดราคาปลาผันผวน, ตู้ปลา/กำแพงถ้วยรางวัล, ทัวร์นาเมนต์ตามเวลานัด — เปิดเมื่อ volume คนตกปลาเยอะพอ

---

## 8. การตัดสินใจ / ความเสี่ยงที่ต้องเคลียร์

| หัวข้อ | Default ที่แนะนำ | หมายเหตุ |
|---|---|---|
| **Legal / art positioning** ⚠️ | art placeholder/ออริจินอล + ป้าย *fan project* | landing สาธารณะ + IP ของ Bigbug — **ควรขอ soft-approval ก่อนโปรโมทวงกว้าง** (กัน takedown + pitch แข็งขึ้น) |
| Backend | Go template + **PostgreSQL** | ✅ ยืนยันแล้ว |
| Frontend | Next.js ล่าสุด + Zustand + TanStack Query + Axios | ✅ ยืนยันแล้ว |
| โครงสร้าง repo (✅ เคาะแล้ว) | **monorepo เดียวกับเกม** — `/api` (Go) + `/web` (Next.js) | จัดการที่เดียว · โตค่อย `git subtree split` แยก |
| **สกุลเงินตกปลา** | "เกล็ด" (Scales) แยกจาก Jil เด็ดขาด | เกล็ดซื้อได้แค่ของสายตกปลา · ตกปลาห้ามผลิต Jil (กันกินรายได้ตัวเอง) |
| **ผลตกปลา** | Server-authoritative (server สุ่ม, client เล่นอนิเมชัน) | กันปั๊ม/เสกไอเทมที่มีมูลค่า |
| **ปลดคันเบ็ด (ยังไม่สรุป)** | ครั้งเดียวจบ **vs** daily-gate | spec §7 ค้างไว้ — daily-gate แรงกว่าแต่กดดันกว่า |
| Analytics identity | `session_id` = client UUID (localStorage) | เลี่ยง cookie ข้ามโดเมน |
| **Auth ladder** (✅ เคาะแล้ว) | guest → สมัคร standalone (ไม่ผูก social, OTP ออปชัน) → ผูก **Google/Apple/Line** ทีหลัง · admin = `role=admin` | Line สำคัญคอมมูไทย · public register เปิดสำหรับผู้เล่น |
| **เข้าเล่น** (✅ เคาะแล้ว) | **guest ก่อน** + soft-gate (สมัครเมื่อจะจองชื่อ/เก็บตัว/เติมเงิน) | รักษา top-of-funnel |
| **จำนวน character slot** | เริ่ม 2–3 ช่อง · ซื้อเพิ่มด้วย Jil | (ยังไม่สรุปจำนวน) |
| **เปลี่ยนชื่อ = ไอเทม Jil** | family/character name-change ขายทีหลัง | ⇒ ต้องล็อกชื่อ**ถาวร**ตั้งแต่สมัคร |
| Hosting (✅ เคาะแล้ว) | **CF Pages** (web+เกม client, ฟรี) · **AWS** (Go API + Node relay) · **RDS** Postgres | เริ่มถูกสุด: CF ฟรี + เครดิต AWS |
| **Asset/รูปโปรไฟล์ CDN** | เฟสหลัง: **R2** (egress ฟรี) หรือ S3+CloudFront | R2 คู่ CF Pages ประหยัดสุด |

---

## 9. Definition of Done (ทั้งงานเว็บ)

- [ ] Landing สาธารณะสวย + waitlist ทำงาน + ลิงก์เข้าเกม
- [ ] เกม + landing ยิง event → เก็บใน Postgres ผ่าน Go API
- [ ] ผู้เล่นสมัคร/login ได้ · `family_name` ถาวร + character slots + nameplate 2 บรรทัด · admin เห็น registered users + ประวัติเติมเงิน(demo)
- [ ] `/admin` โชว์: ผู้เข้าชม · ผู้เล่น · funnel · **ชุดที่คนอยากซื้อสุด** · would-be revenue · waitlist
- [ ] Season scheduling: ตั้งวันเวียนขาย + timeline + ดีมานด์ต่อซีซัน
- [ ] ระบบตกปลา: retention lift (session ยาว/กลับมา) + เกล็ด≠Jil + Jil demand จากสกินคัน/ตู้ (โชว์ใน dashboard)
- [ ] export CSV เอาตัวเลขจริงไปใส่ proposal ให้ Bigbug ได้
- [ ] ทุกอย่าง privacy-aware · ระบุ *fan project* · ไม่มีการขายจริง

---

## 10. Addendum สำหรับ CLAUDE.md (เพิ่มเมื่อเริ่มทำ web)

```md
## Web stack rules (/web + /api — monorepo เดียวกับเกม)
- Backend = Go (Echo+GORM+Uber FX+JWT) ตาม PROJECT_TEMPLATE.md + PostgreSQL. เพิ่ม domain: Model → Store → Handler → Register(FX/api.Server) → Route → Migration.
- Frontend = Next.js (App Router) + Zustand (client state) + TanStack Query (server data) + Axios (1 instance). ห้ามใช้ fetch ตรง/ห้ามยัด server data ลง Zustand.
- Analytics event taxonomy: TS อยู่ที่ web/lib/analytics/events.ts, Go models (api/pkg/models) mirror. JSON snake_case. ห้าม inline event shape.
- buy_intent = interest signal, NOT a sale. Dashboard copy = "ความสนใจ/ประมาณการ", never "ยอดขาย".
- /admin + /admin/* protected ด้วย JWT+IsAdmin. session_id เป็น anonymous UUID. เคารพ consent banner. ไม่เก็บ PII เกิน waitlist email.
- "On sale now" COMPUTED on read (utils/liveness ใน Go). ไม่มี cron/ไม่ persist live flag. GET /store/active = แหล่งเดียวของของที่ขายอยู่.
- Landing ใช้ art placeholder/original จนกว่า Bigbug อนุมัติ; ระบุ fan project. ใช้ design tokens อุ่น/กลมมนชุดเดียวกับเกม.

## Player account / profile rules
- Player identity ladder: guest (session) → standalone register (email/username+password, OTP ออปชัน, ไม่ผูก social) → link Google/Apple/Line ทีหลัง (AuthProvider table, 1 บัญชีหลาย provider). + `family_name` (unique, ถาวร) + `Character` (per-account, ชื่อถาวร, หลาย slot). ชื่อถาวร — เปลี่ยนต้องใช้ Jil item (`name_change`) ห้ามฟรี.
- Chat/world nameplate = 2 บรรทัด: `family_name` (บรรทัด 1) + `character.name` (บรรทัด 2).
- Analytics: guest = anonymous `session_id`; event ตอน logged-in แนบ `account_id` ด้วย. Admin แยก registered users ออกจาก anonymous sessions; ประวัติเติมเงินเป็น per-account.
- Public register = สำหรับผู้เล่น; admin = `role=admin` ซ้อนบน (IsAdmin). Guest เล่นเพื่อลองได้; ต้องมีบัญชีเพื่อ persist identity / เติมเงิน / เก็บ inventory ตกปลา.

## Fishing rules
- Fishing currency "Scales/เกล็ด" ≠ Jil; ห้ามแปลงข้ามกัน; ตกปลาห้ามผลิต Jil. ซื้อด้วยเกล็ด = ไม่ยิง buy_intent; ซื้อสกินคัน/ตู้ด้วย Jil = ยิง buy_intent (item_type = fishing_*).
- Fishing outcomes เป็น server-authoritative (Go /fishing/cast เป็นคนสุ่ม; client แค่เล่นอนิเมชัน). rarity tiers/สีกรอบ ใช้ชุดเดียวกับคอสตูมร้าน.
- Loot table เป็น data (จุด/เวลา) ไม่ผูก rig/animation. ตกปลาคือ retention feature — วัดผลด้วย session length/return rate ไม่ใช่รายได้.

## Deploy targets
- Frontend (Next.js) + game client → Cloudflare Pages (Next `output: 'export'`: landing SSG for SEO, admin = client SPA). Go API + Node relay → AWS (long-running, WebSocket-capable). Postgres → RDS. Asset/profile-image CDN (later) → R2 (egress-free) or S3+CloudFront. CORS origins = the CF Pages domains.
- Because all API lives in Go, the Next app stays static-exportable — don't add Next server routes/SSR-only features that would break CF Pages static deploy.
```
