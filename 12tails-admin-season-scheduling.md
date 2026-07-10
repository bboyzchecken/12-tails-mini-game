# Admin: จัดตารางเปิด-ปิดขายตามซีซัน (เวียนขาย) — Spec สำหรับ Claude Code

ส่วนเสริมของ **12tails-web-spec.md** + **12tails-demo-monetization-plan.md**
เป้าหมาย: แอดมินตั้งได้ว่า **ชุด/คอลเลกชันไหน เปิดขายเมื่อไหร่ ถึงเมื่อไหร่** เพื่อ **เวียนขายเป็นซีซัน**

> 🔴 ยังเป็น **mock sales** (กดซื้อ = `buy_intent` ไม่ใช่ขายจริง) แต่ **ตรรกะจัดตารางเป็นของจริง**
> 🎯 จุดขายกับ Bigbug: โชว์ “เครื่องยนต์เวียนขายซีซัน” = โมเดลรายได้ต่อเนื่องที่คาดการณ์ได้

---

## หลักการสำคัญ (อ่านก่อน)

1. **สถานะ “ขายอยู่ตอนนี้” คำนวณตอนอ่าน** จากเวลาปัจจุบันเทียบ saleStart/saleEnd — **ไม่ต้องมี cron**
2. **`/api/store/active` = แหล่งเดียว** ที่บอกว่าอะไรขายได้ตอนนี้ (เกม/เดโมอ่านจากตรงนี้เท่านั้น)
3. **“เวียนขาย” = duplicate คอลเลกชันเก่า** ตั้งวันใหม่ (เช่น ชุดฤดูร้อนกลับมาปีหน้า)
4. แอดมิน override ได้ (บังคับ live/off) นอกเหนือจากตารางเวลา

---

## Data model (Prisma — ต่อจาก web-spec)

```prisma
model Collection {
  id         String   @id @default(cuid())
  name       String              // "ชุดฤดูร้อน 2026"
  theme      String?             // "summer"
  saleStart  DateTime?           // null = ยังไม่กำหนด
  saleEnd    DateTime?
  status     String   @default("draft")  // draft | scheduled | live | ended (override)
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  items      CosmeticItem[]
}

model CosmeticItem {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  name         String
  type         String     // skin | color | emote | chatFrame
  priceJil     Int
  rarity       String     // common | rare | epic
  preview      String     // asset path (placeholder ตอนนี้)
  saleStart    DateTime?  // override รายชิ้น (ถ้าอยากต่างจากคอลเลกชัน)
  saleEnd      DateTime?
  active       Boolean    @default(true)
}
```

---

## คำนวณสถานะ (util กลาง)

```ts
// lib/store/liveness.ts
type Window = { saleStart?: Date | null; saleEnd?: Date | null; status: string };

export function isLiveNow(w: Window, now = Date.now()): boolean {
  if (w.status === 'draft' || w.status === 'ended') return false;   // override ปิด
  const startOk = !w.saleStart || +new Date(w.saleStart) <= now;
  const endOk   = !w.saleEnd   || +new Date(w.saleEnd)   >= now;
  return startOk && endOk;
}

// ป้ายสถานะสำหรับ UI
export function statusLabel(w: Window, now = Date.now()):
  'draft' | 'scheduled' | 'live' | 'ended' {
  if (w.status === 'draft') return 'draft';
  if (w.status === 'ended') return 'ended';
  if (w.saleStart && +new Date(w.saleStart) > now) return 'scheduled';
  if (w.saleEnd && +new Date(w.saleEnd) < now)     return 'ended';
  return 'live';
}
```

---

## API

- `GET  /api/store/active` — **public** (เกม/เดโมเรียก): คืนเฉพาะ collection+item ที่ `isLiveNow` = true พร้อม `endsAt` (ไว้ทำ countdown)
- `GET  /api/admin/collections` — **protected**: ทั้งหมด + สถานะที่คำนวณแล้ว + จำนวน `buy_intent`
- `POST /api/admin/collections` · `PATCH /api/admin/collections/:id` · `DELETE …` — CRUD + ตั้ง saleStart/saleEnd
- `POST /api/admin/collections/:id/items` · `PATCH …/items/:id` · `DELETE …` — CRUD item
- `POST /api/admin/collections/:id/duplicate` — **clone เพื่อซีซันหน้า** (คัดลอก items, ตั้ง status=draft, เคลียร์วันที่)
- `PATCH /api/admin/collections/:id/status` — override `live` / `off(ended)` / `draft`

---

## Admin UI

**1) หน้ารายการคอลเลกชัน**
- [ ] ตาราง: ชื่อ · theme · ช่วงขาย · ป้ายสถานะ (draft/scheduled/live/ended) · จำนวน buy_intent
- [ ] ปุ่ม: สร้างใหม่ · duplicate (เวียนขาย) · toggle live/off · archive
- [ ] ตัวกรองสถานะ

**2) หน้าแก้ไขคอลเลกชัน**
- [ ] ชื่อ + theme + date picker (start/end)
- [ ] CRUD items: name/type/priceJil/rarity/preview(slot) + override วันรายชิ้น
- [ ] พรีวิว “ตอนนี้ขายอะไรอยู่” (ตรงกับที่ผู้เล่นเห็น)

**3) ★ Timeline / ปฏิทินการขาย**
- [ ] แถบ (Gantt) หรือปฏิทินรายเดือน แสดงช่วงขายของแต่ละคอลเลกชันเรียงกัน
- [ ] เห็นภาพรวม “ซีซันไหนต่อซีซันไหน” + จับ **ช่องว่าง/ทับซ้อน** ได้ทันที
- [ ] คลิกแถบ → เปิดแก้ไข

---

## เชื่อมกับเดโม + dashboard

- [ ] **เดโมร้าน** อ่าน `/api/store/active` → โชว์เฉพาะของที่ขายอยู่ + **countdown “เหลือ X วัน Y ชม.”** (FOMO)
- [ ] `buy_intent` แนบ `collectionId`/`theme` → **dashboard ทำ “ดีมานด์ต่อซีซัน”**
- [ ] Dashboard: เทียบซีซัน (ซีซันไหนคนอยากซื้อเยอะ) → พิสูจน์โมเดลเวียนขายให้ Bigbug

---

## Phases S0–S4 (ทำทีละเฟส · ผ่าน AC ก่อนไปต่อ)

### S0 — Model + liveness + active endpoint
- [ ] Prisma `Collection` + `CosmeticItem` + migrate
- [ ] seed 1 คอลเลกชัน (“ชุดฤดูร้อน”) + items
- [ ] `lib/store/liveness.ts` (`isLiveNow` / `statusLabel`)
- [ ] `GET /api/store/active`
- **AC:** ตั้งวันให้ขายอยู่ → `/api/store/active` คืนของ; ตั้งวันอนาคต/อดีต → ไม่คืน

### S1 — Admin CRUD
- [ ] `GET /api/admin/collections` + CRUD collection/item (protected)
- [ ] หน้ารายการ + หน้าแก้ไข (ฟอร์ม + date picker)
- **AC:** สร้าง/แก้/ลบ คอลเลกชันและ item ได้ + เห็นป้ายสถานะถูกต้อง

### S2 — Scheduling + rotation
- [ ] ตั้ง saleStart/saleEnd (คอลเลกชัน + override รายชิ้น)
- [ ] override สถานะ live/off/draft
- [ ] `POST …/duplicate` (เวียนขายซีซันหน้า)
- **AC:** duplicate แล้วได้คอลเลกชันใหม่ status=draft; override บังคับเปิด/ปิดได้จริง

### S3 — Timeline / ปฏิทิน
- [ ] มุมมอง Gantt/ปฏิทินของช่วงขายทุกคอลเลกชัน + คลิกเปิดแก้ไข
- **AC:** เห็นภาพรวมซีซัน + จับช่องว่าง/ทับซ้อนได้

### S4 — Demo + dashboard integration
- [ ] เดโมร้านอ่าน `/api/store/active` + countdown
- [ ] `buy_intent` แนบ collection → dashboard “ดีมานด์ต่อซีซัน”
- **AC:** ของหมดซีซันหาย/ขึ้นใหม่ตามเวลา; dashboard เทียบดีมานด์ระหว่างซีซันได้

---

## CLAUDE.md addendum

```md
## Season scheduling rules
- "On sale now" is COMPUTED on read via lib/store/liveness.ts. Do NOT add cron jobs or persist a live flag as truth.
- /api/store/active is the ONLY source of what is currently sellable. The game/demo must read from it; never hardcode item lists.
- status values: draft | scheduled | live | ended. draft/ended are manual overrides that force off; scheduled/live are derived from the date window.
- Seasonal rotation = duplicate a collection with a new date window (status=draft), never mutate the past one.
- Sales stay MOCK (buy_intent). Scheduling logic is real. Dashboard copy = "ความสนใจ/ดีมานด์", never "ยอดขาย".
- Admin routes protected by middleware. Item preview is a placeholder asset until Bigbug approves.
```

---

## Definition of Done

- [ ] แอดมินตั้งได้ว่า “คอลเลกชันไหนขายเมื่อไหร่ถึงเมื่อไหร่” + เห็นเป็นปฏิทิน
- [ ] เดโมโชว์เฉพาะของที่ขายอยู่ + countdown FOMO
- [ ] duplicate เพื่อเวียนขายซีซันหน้าได้ในคลิกเดียว
- [ ] dashboard เทียบ “ดีมานด์ต่อซีซัน” → เล่าโมเดลรายได้ต่อเนื่องให้ Bigbug ได้
- [ ] ทุกอย่างยัง mock sales + art placeholder จนได้ไฟเขียว
