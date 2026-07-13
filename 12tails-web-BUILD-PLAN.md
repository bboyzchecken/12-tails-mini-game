# 12Tails Web — แผนรวมการสร้าง Landing + Admin Dashboard (Master Build Plan)

เอกสารนี้ = **ตัวร้อยทุก spec เข้าด้วยกัน** + ลำดับการทำ + checklist เดียวจบ
สำหรับสร้างส่วนเว็บ (landing สาธารณะ + admin dashboard) เพื่อ **โปรโมทให้คนลองเล่น → เก็บดีมานด์จริง → เอาไป pitch ขอเช่าลิขสิทธิ์กับ Bigbug**

> 🔗 เอกสารลูกที่เอกสารนี้ควบรวม:
> - [12tails-web-spec.md](12tails-web-spec.md) — landing + admin + analytics (phases **L0–L6**)
> - [12tails-admin-season-scheduling.md](12tails-admin-season-scheduling.md) — เวียนขายซีซัน (phases **S0–S4**)
> - [12tails-demo-monetization-plan.md](12tails-demo-monetization-plan.md) — demo store ในเกม (**D0–D5**, ทำแล้วบางส่วน)
> - [12tails-chat-PLAN.md](12tails-chat-PLAN.md) — เกมหลัก · [DEPLOY.md](DEPLOY.md) — deploy เกม
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
| **เทมเพลตหลังบ้าน** | Go REST API template ที่ทีมถนัด (layered + repository + FX) — ใช้เป็นพิมพ์เขียว |

### 🔴 ยังไม่มี (ต้องสร้างใหม่ทั้งหมด)
- [ ] **Go API project** (`12tails-api`) — ยังไม่มี
- [ ] **PostgreSQL + models + `/track`** — ยังไม่มีการเก็บ event ใด ๆ
- [ ] **Next.js frontend** (landing + admin) — ยังไม่มี
- [ ] **เกมยิง analytics** ⭐ — `demoStore.buy()` แค่แก้ localStorage **ไม่ส่ง `buy_intent` ไปที่ไหน** (จุดเชื่อมที่ขาดและสำคัญสุด)
- [ ] **Admin dashboard** — funnel, demand ranking, would-be revenue, CSV export
- [ ] **Season scheduling** — `Collection`/`CosmeticItem`, `GET /store/active`, timeline
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
| **Deploy** | Vercel (Next.js) · Docker→Render/Railway/Fly (Go) · Postgres managed (Neon/Supabase/RDS) | เกม (Phaser+Socket.IO) host แยกเหมือนเดิม |

> 🔧 **สิ่งที่ต้องสลับจากเทมเพลต (MySQL→Postgres):** driver เป็น `gorm.io/driver/postgres` · `MySQLConfig`→`PostgresConfig` (หรือใช้ `DATABASE_URL` เดียว) · DSN เป็น `host=... user=... dbname=... sslmode=...` · docker-compose ใช้ `postgres:16`
> 🔧 **บริการที่ตัดออกได้** (เทมเพลตมีเยอะ): R2 storage / Gmail / Redis / Mongo — โปรเจกต์นี้ยังไม่ต้องใช้ (Gmail เก็บไว้ทำ waitlist-confirm ทีหลังได้)

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

> ℹ️ **มี 2 หลังบ้านคนละหน้าที่ (ตั้งใจ):** [C] Node/Socket.IO = realtime relay (ตำแหน่ง/แชท, ไม่เก็บถาวร) · [E] Go/REST = ข้อมูลถาวร (analytics/waitlist/store). ไม่รวมกัน
> ⚠️ **Cross-origin:** เกม+landing อยู่คนละ origin กับ Go API → เปิด **CORS** ที่ Go (origin ของ client+web) และแนบ `session_id` แบบ **client-generated UUID** (เก็บใน localStorage, ส่งใน body/header) แทน cookie ข้ามโดเมน (ง่ายกว่า)
> 🔗 **Event taxonomy เป็น contract ข้ามภาษา:** ฝั่ง TS (เกม+web) ถือ shape เดียวกัน · Go models mirror ตาม (JSON **snake_case** ตามคอนเวนชันเทมเพลต)

---

## 4. โครงสร้างโปรเจกต์ที่แนะนำ

แยกเป็น **3 โปรเจกต์** (Go เป็น module ของตัวเองตามเทมเพลต ไม่ปนกับ npm workspace):

```
12-tails-mini-game/     (เกม monorepo เดิม — ไม่แตะโครง)
  /client  /server  /shared

12tails-api/            ★ ใหม่ — Go module (คัดลอกโครงจาก PROJECT_TEMPLATE.md)
  main.go  seeder.go  docker-compose.yml (postgres)  Dockerfile  k8s/  migrations/
  pkg/
    core/config.go                     # + PostgresConfig
    handlers/api/
      api.go  middleware.go            # JWT + IsAdmin (จากเทมเพลต)
      track.handler.go  waitlist.handler.go
      store.handler.go                 # GET /store/active (public)
      admin.handler.go                 # metrics / demand ranking / CSV / collections
    models/   event.go  waitlist.go  collection.go  cosmetic_item.go  user.go
    store/    event/  waitlist/  collection/  cosmetic_item/  user/
    services/  (ตัด R2/Gmail ออกก่อน)
    utils/    liveness/  (isLiveNow / statusLabel — computed on read)

12tails-web/            ★ ใหม่ — Next.js (ล่าสุด) frontend
  app/
    (marketing)/…       landing สาธารณะ (พอร์ตจาก mockup)
    admin/…             dashboard (protected ด้วย JWT)
  lib/
    api/axios.ts        # instance: baseURL Go API + interceptor (session_id/JWT)
    api/queries.ts      # TanStack Query hooks
    analytics/events.ts # ★ taxonomy (แหล่งเดียวฝั่ง web — ห้าม inline)
    store/*.ts          # Zustand: consent, session, filters
```

> 💡 จะทำ `12tails-api` / `12tails-web` เป็น repo แยกก็ได้ (ตรงสไตล์ larkornsan-api) หรือวางเป็นโฟลเดอร์พี่น้องก็ได้ — ขอแค่ **Go module แยกจาก npm workspace** กัน tooling ชนกัน

---

## 5. ลำดับการทำ (เรียงตามคุณค่าต่อเป้าหมาย licensing)

> หลักการ: **"การวัดผล" มาก่อน "หน้าตา"** — mockup เสร็จแล้ว แต่เดโมยังไม่เก็บข้อมูลอะไรเลย

| # | เฟส | map ไป spec | ทำไมลำดับนี้ |
|---|---|---|---|
| **1** | Go API backbone + ingestion | L0 | ไม่มีอันนี้ = วัดผลไม่ได้ traffic เสียเปล่า |
| **2** | เชื่อมเกม → API ⭐ | L2 (ส่วนเกม) | ทำให้ demo store ที่มีอยู่แล้ว **เริ่มสร้างข้อมูล** ตั้งแต่วันแรก |
| **3** | Next.js frontend + Landing | L1 | โปรโมทได้ + เก็บ data ตั้งแต่คนแรก |
| **4** | Admin dashboard ⭐ | L3–L4 | ตัวชูโรง pitch — "ชุดที่คนอยากซื้อสุด" + would-be revenue + CSV |
| **5** | Season scheduling | S0–S4 | เล่าโมเดล "รายได้ต่อเนื่อง/เวียนขาย" (pitch amplifier) |
| **6** | Polish + deploy | L5–L6 | SEO/OG + ขึ้น production + verify |

---

## 6. รายละเอียดแต่ละเฟส + Acceptance Criteria

> 🧭 ทุกเฟสฝั่ง Go ทำตามขั้นตอน **"Adding a New Domain"** ของเทมเพลต: Model → Store → Handler → Register (FX + api.Server) → Route → Migration

### Phase 1 — Go API backbone + ingestion  `(= L0)`
- [ ] scaffold `12tails-api` จากเทมเพลต (Echo+GORM+FX+Viper+Logrus+validator+gormigrate) — **สลับเป็น Postgres**
- [ ] `docker-compose.yml` postgres:16 + `core/config.go` `PostgresConfig` + DSN
- [ ] domain **Event** — model `Event{ SessionID, Type, ItemID*, Meta(JSONB), Referrer*, CreatedAt }` + store (Create + aggregate methods ไว้ทำ dashboard) + `POST /track`
- [ ] domain **Waitlist** — model `Waitlist{ Email(unique), Source*, CreatedAt }` + `POST /waitlist`
- [ ] CORS ให้ origin ของเกม + landing · รับ `session_id` (client-generated UUID)
- [ ] gormigrate: AutoMigrate `Event`, `Waitlist`
- **AC:** `curl POST /track` → มี row ใน Postgres, field ครบ · `/waitlist` กันอีเมลซ้ำ

### Phase 2 — เชื่อมเกม → API ⭐  `(= L2 ส่วนเกม)`
> จุดเชื่อมสำคัญสุด: ทำให้เกมที่ deploy แล้วเริ่มส่งสัญญาณดีมานด์
- [ ] client helper `track()` → POST ไป Go `/track` (base URL ผ่าน `VITE_API_URL`) + session UUID ใน localStorage
- [ ] ยิง `game_open`, `play_start(character_id)`, `shop_open(tab)`
- [ ] **`buy_intent`** — เพิ่มใน `demoStore.buy()` / `StoreModal`: แนบ `item_id`, `item_type`, `price_jil` **นอกเหนือ**จากปลดล็อกในเครื่อง
- [ ] `gacha_pull` / `battlepass_intent` / `supporter_intent` (ถ้าเปิดพื้นผิวนั้น)
- **AC:** เดินครบ flow ในเกม → event ถูกบันทึกทุกจุด, `buy_intent` มี `item_id`+`price_jil` จริง

### Phase 3 — Next.js frontend + Landing  `(= L1)`
- [ ] scaffold `12tails-web`: Next.js ล่าสุด + TS + Tailwind + **Zustand + TanStack Query + Axios**
- [ ] `lib/api/axios.ts` (baseURL Go API + interceptor session/JWT) · QueryClient provider · Zustand: `consent`, `session`
- [ ] `lib/analytics/events.ts` — TS taxonomy (mirror กับ Go)
- [ ] พอร์ต `12tails-landing-mockup.html` → components (design tokens เดิม): Hero+CTA+waitlist · "มันคืออะไร" · ฟีเจอร์ grid · 12 เผ่า (art slot) · Discord CTA · Footer *fan project*
- [ ] waitlist form → TanStack **mutation** → `POST /waitlist` · ยิง `page_view`/`cta_click`/`waitlist_signup`
- [ ] consent banner (Zustand) + ลิงก์ privacy · responsive มือถือ
- **AC:** landing เปิดสวย ลงมือถือ · กรอก waitlist → มี row · เข้าเกมจากปุ่มได้ · event ถูกยิง

### Phase 4 — Admin dashboard ⭐  `(= L3–L4)`
- [ ] **Go:** admin auth ด้วย JWT ของเทมเพลต (seed 1 admin user, `POST /auth/login` → JWT, `/admin/*` = `JwtMiddleware`+`IsAdmin`) — ไม่เปิด public register
- [ ] **Go:** `/admin/metrics` (aggregate SQL): cards (unique session/players/waitlist/DAU) · funnel counts · **demand ranking** (group by `item_id`) · would-be revenue (Σ intent×price) · time series · referrers
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
- [ ] deploy: **Go API** Docker → Render/Railway/Fly · **Postgres** managed (Neon/Supabase/RDS) · **Next.js** → Vercel · เกม deploy อยู่แล้ว
- [ ] ตั้ง env: `DATABASE_URL`, `JWT_SECRET_KEY`, CORS origins (Go) · `NEXT_PUBLIC_API_URL` (web) · `VITE_API_URL` (เกม)
- **AC:** landing + dashboard + API ออนไลน์จริง · ยิง event จาก prod ได้ · export CSV จากข้อมูลจริง

---

## 7. การตัดสินใจ / ความเสี่ยงที่ต้องเคลียร์

| หัวข้อ | Default ที่แนะนำ | หมายเหตุ |
|---|---|---|
| **Legal / art positioning** ⚠️ | art placeholder/ออริจินอล + ป้าย *fan project* | landing สาธารณะ + IP ของ Bigbug — **ควรขอ soft-approval ก่อนโปรโมทวงกว้าง** (กัน takedown + pitch แข็งขึ้น) |
| Backend | Go template + **PostgreSQL** | ✅ ยืนยันแล้ว |
| Frontend | Next.js ล่าสุด + Zustand + TanStack Query + Axios | ✅ ยืนยันแล้ว |
| แยก repo หรือโฟลเดอร์ | Go module + Next.js แยกจาก npm workspace | กัน tooling ชนกัน |
| Analytics identity | `session_id` = client UUID (localStorage) | เลี่ยง cookie ข้ามโดเมน |
| Admin auth | JWT ของเทมเพลต + seed admin (ไม่เปิด public register) | อัปเกรดจาก "รหัส env" ใน spec เดิม |
| Hosting | Vercel (web) · Render/Railway/Fly (Go) · Neon/Supabase (DB) | เกม host แยกเหมือนเดิม |

---

## 8. Definition of Done (ทั้งงานเว็บ)

- [ ] Landing สาธารณะสวย + waitlist ทำงาน + ลิงก์เข้าเกม
- [ ] เกม + landing ยิง event → เก็บใน Postgres ผ่าน Go API
- [ ] `/admin` โชว์: ผู้เข้าชม · ผู้เล่น · funnel · **ชุดที่คนอยากซื้อสุด** · would-be revenue · waitlist
- [ ] Season scheduling: ตั้งวันเวียนขาย + timeline + ดีมานด์ต่อซีซัน
- [ ] export CSV เอาตัวเลขจริงไปใส่ proposal ให้ Bigbug ได้
- [ ] ทุกอย่าง privacy-aware · ระบุ *fan project* · ไม่มีการขายจริง

---

## 9. Addendum สำหรับ CLAUDE.md (เพิ่มเมื่อเริ่มทำ web)

```md
## Web stack rules (12tails-web + 12tails-api)
- Backend = Go (Echo+GORM+Uber FX+JWT) ตาม PROJECT_TEMPLATE.md + PostgreSQL. เพิ่ม domain: Model → Store → Handler → Register(FX/api.Server) → Route → Migration.
- Frontend = Next.js (App Router) + Zustand (client state) + TanStack Query (server data) + Axios (1 instance). ห้ามใช้ fetch ตรง/ห้ามยัด server data ลง Zustand.
- Analytics event taxonomy: TS อยู่ที่ 12tails-web/lib/analytics/events.ts, Go models mirror. JSON snake_case. ห้าม inline event shape.
- buy_intent = interest signal, NOT a sale. Dashboard copy = "ความสนใจ/ประมาณการ", never "ยอดขาย".
- /admin + /admin/* protected ด้วย JWT+IsAdmin. session_id เป็น anonymous UUID. เคารพ consent banner. ไม่เก็บ PII เกิน waitlist email.
- "On sale now" COMPUTED on read (utils/liveness ใน Go). ไม่มี cron/ไม่ persist live flag. GET /store/active = แหล่งเดียวของของที่ขายอยู่.
- Landing ใช้ art placeholder/original จนกว่า Bigbug อนุมัติ; ระบุ fan project. ใช้ design tokens อุ่น/กลมมนชุดเดียวกับเกม.
```
