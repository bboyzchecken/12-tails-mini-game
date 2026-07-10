# 12Tails Web — Landing + Admin Dashboard (Spec สำหรับ Claude Code)

Next.js: หน้า **Landing สาธารณะ** (อาร์ต 12 หาง) + **Dashboard แอดมิน** เก็บสถิติดีมานด์
เป้าหมายหลัก: เปลี่ยนการ pitch เป็นข้อมูลจริง — เก็บ **buy-intent** (กดซื้อในเดโม = สัญญาณอยากซื้อ) แม้แจกของฟรี

> 🔗 เชื่อกับ: PLAN.md (เกม), 12tails-demo-monetization-plan.md (ร้าน demo), UI roadmap
> 🔴 ไม่มีการขายจริง — dashboard วัด “ความสนใจ” ไม่ใช่ “ยอดขาย”
> ⚖️ หน้า landing เป็นสาธารณะ (เห็นเยอะกว่าเดโมส่วนตัว) → ใช้อาร์ต placeholder/ออริจินอล หรือระบุชัดว่าเป็น fan project จนกว่าได้ไฟเขียวจาก Bigbug

---

## 1. Tech stack

- **Next.js (App Router) + TypeScript** — landing + dashboard + API ในโปรเจกต์เดียว
- **Tailwind CSS** — สไตล์เร็ว, ใช้ design tokens อุ่น/กลมมนชุดเดียวกับเกม
- **Prisma + Postgres** (Neon หรือ Supabase free tier) — เก็บ event/waitlist
- **Tremor** (React dashboard components, Tailwind-based) — กราฟ/การ์ดสถิติสวยเร็ว
- **Admin gate** — middleware + รหัสผ่านจาก env (อัปเกรดเป็น NextAuth ทีหลัง)
- **Deploy** — Vercel (Next.js native) + DB บน Neon/Supabase · เกม (Phaser+Socket.IO) host แยกเหมือนเดิม

---

## 2. สถาปัตยกรรม (เชื่อมกันยังไง)

```
[ Landing (Next.js, public) ] --track--> [ /api/track ] --> [ Postgres ]
        │  CTA "เล่นเลย"                                        ▲
        ▼                                                       │
[ Game demo (Phaser+Socket.IO) ] --track: buy_intent, ฯลฯ ------┤
                                                                │
[ Admin /admin (protected) ] <---- aggregate queries ----------┘
```

หัวใจคือ **event ingestion ที่ใช้ร่วมกัน**: ทั้ง landing และเกมเดโมยิง event มาที่ `/api/track` → เก็บลง DB → dashboard อ่านสรุป

---

## 3. Analytics event taxonomy (ตัวเชื่อมที่สำคัญสุด)

```ts
// lib/analytics/events.ts
export type TrackEvent =
  | { type: 'page_view';        path: string }
  | { type: 'cta_click';        cta: string }
  | { type: 'waitlist_signup';  source: string }
  | { type: 'game_open' }                                   // เข้าเกมเดโม
  | { type: 'play_start';       characterId: string }
  | { type: 'shop_open';        tab: string }
  | { type: 'buy_intent';       itemId: string; itemType: string; priceJil: number }  // ★ กดซื้อ(demo) = อยากซื้อ
  | { type: 'battlepass_intent' }
  | { type: 'supporter_intent'; tier: string }
  | { type: 'gacha_pull';       bag: string; resultItemId: string }
  | { type: 'feedback';         wants: string };            // อยากได้ชุดแบบไหน

// ทุก event เติมฝั่ง server: sessionId (anonymous), createdAt, referrer
```

> ในไฟล์ demo-monetization: ปุ่ม “แลกด้วย Jil (demo)” ต้องยิง `buy_intent` มาที่นี่ **เพิ่มเติม** จากการปลดล็อกในเครื่อง

---

## 4. Data model (Prisma)

```prisma
model Event {
  id        String   @id @default(cuid())
  sessionId String
  type      String
  itemId    String?
  meta      Json?
  referrer  String?
  createdAt DateTime @default(now())
  @@index([type, createdAt])
  @@index([itemId])
}

model Waitlist {
  id        String   @id @default(cuid())
  email     String   @unique
  source    String?
  createdAt DateTime @default(now())
}
```

---

## 5. Landing page

**Sections (มี art slot สำหรับ 12 หาง):**
```
┌ HERO ─────────────────────────────────────┐
│ โลโก้/ชื่อเกม · พาดหัว + ซับ                │
│ [อาร์ตตัวละคร 12 เผ่า — hero]              │
│ [ปุ่ม เข้าลานชุมชน] [กรอกอีเมล waitlist]   │
└────────────────────────────────────────────┘
[ มันคืออะไร ]  [ ฟีเจอร์: เดิน · แชท · emote+เสียง · cosmetic ]
[ โชว์ 12 เผ่า — art slots ]
[ ชุมชน / Discord CTA ]
[ Footer: fan project note · ติดต่อ ]
```
- [ ] Hero: ชื่อ + tagline + hero art (placeholder) + CTA เข้าเกม + ฟอร์ม waitlist
- [ ] “มันคืออะไร” + ฟีเจอร์ grid (จับระบบสื่อสารเป็นจุดขาย)
- [ ] โชว์ 12 เผ่า (การ์ด art slot ละเผ่า)
- [ ] Community/Discord CTA
- [ ] Footer: ระบุ fan project + ติดต่อ + ลิงก์
- [ ] SEO/OG tags (แชร์แล้วขึ้นรูปสวย)

---

## 6. Admin Dashboard (`/admin`, protected) — ★ ตัวชูโรงการ pitch

**Top-line cards:** ผู้เข้าชม (unique session) · ผู้เล่น (play_start) · waitlist · DAU

**Funnel (conversion %):**
`page_view → game_open → play_start → shop_open → buy_intent`

**★ Demand ranking (สำคัญสุด):**
- [ ] `buy_intent` group by `itemId` เรียงมาก→น้อย = **“ชุดที่คนอยากซื้อสุด”** (bar chart)
- นี่คือสไลด์ที่ทำให้ Bigbug เห็นว่า “อะไรจะขายได้”

**★ Would-be revenue (ประมาณการจากความสนใจ):**
- [ ] Σ(buy_intent × priceJil) แปลงเป็นตัวเลขคร่าวๆ **ระบุชัดว่า “ประมาณการจากความสนใจ ไม่ใช่ยอดขายจริง”**

**อื่นๆ:**
- [ ] battlepass/supporter intent counts
- [ ] gacha pulls + การกระจายของที่สุ่มได้
- [ ] time series: ผู้เข้าชม/วัน, buy_intent/วัน
- [ ] referrer sources (มาจากไหน)
- [ ] date filter + ปุ่ม export CSV (เอาตัวเลขไปใส่ proposal)

---

## 7. Privacy / consent (เบาแต่ต้องมี)

- [ ] แบนเนอร์แจ้ง analytics (ยอมรับ/ปฏิเสธ non-essential)
- [ ] ไม่เก็บ PII เกินจำเป็น — sessionId เป็น anonymous, เก็บอีเมลเฉพาะ waitlist ที่ผู้ใช้กรอกเอง
- [ ] มีหน้า/ลิงก์ privacy สั้นๆ

---

## 8. แนะนำเพิ่ม (อื่นๆตามสมควร)

- [ ] **Waitlist email** — สัญญาณความสนใจ + สร้าง audience ไว้เปิดตัว
- [ ] **Discord link** — ที่แฟนรวมตัว (ต่อยอดคุยกับ Bigbug ได้)
- [ ] **Feedback survey** — “อยากได้ชุด/เผ่าแบบไหน” = ดีมานด์ตรงๆ (เก็บเป็น event `feedback`)
- [ ] **“แจ้งเตือนเมื่อเปิดจริง”** ตอนกด buy_intent → เก็บอีเมล = สัญญาณความสนใจซ้อน
- [ ] **Mock A/B ราคา** (ขั้นสูง) — โชว์ราคาต่างกัน ดูว่า intent ต่างไหม
- [ ] **CSV export** จาก dashboard → แนบตัวเลขจริงใน proposal

---

## 9. Phases L0–L6 (ทำทีละเฟส · ผ่าน AC ก่อนไปต่อ)

### L0 — Setup + ingestion
- [ ] Next.js + Tailwind + Prisma + DB (Neon/Supabase)
- [ ] `lib/analytics/events.ts` (taxonomy) + `/api/track` เก็บ event ลง DB + sessionId cookie (anonymous)
- **AC:** ยิง event ทดสอบแล้วมี row ใน DB, type ครบ

### L1 — Landing page
- [ ] Hero + sections + art slots + ฟอร์ม waitlist (`/api/waitlist`)
- [ ] design tokens อุ่น/กลมมน (Mitr + Sarabun) + responsive
- **AC:** เปิด landing สวย ลงมือถือได้, กรอก waitlist แล้วมี row

### L2 — Analytics wiring
- [ ] landing ยิง page_view/cta_click/waitlist_signup
- [ ] เกมเดโมยิง game_open/play_start/shop_open/buy_intent/gacha ฯลฯ มาที่ `/api/track`
- [ ] consent banner
- **AC:** เดินครบ flow แล้ว event ถูกบันทึกทุกจุด, buy_intent มี itemId+price

### L3 — Admin gate + dashboard shell
- [ ] middleware ป้องกัน `/admin` ด้วยรหัสจาก env
- [ ] shell + Tremon layout + date filter
- **AC:** เข้า /admin ต้องผ่านรหัส, shell + ตัวกรองวันที่ทำงาน

### L4 — Metrics หลัก
- [ ] top-line cards + funnel + **demand ranking (buy_intent by item)** + would-be revenue + time series
- **AC:** เห็น “ชุดที่คนอยากซื้อสุด” เป็นกราฟ + funnel % ถูกต้อง

### L5 — Extras
- [ ] waitlist view + battlepass/supporter/gacha stats + feedback survey + CSV export
- **AC:** ดูข้อมูลครบ + export CSV ได้

### L6 — Polish + deploy
- [ ] SEO/OG + ขัดสไตล์ + deploy Vercel + DB + ตั้ง env
- **AC:** landing + dashboard ออนไลน์จริง, ยิง event จาก production ได้

---

## 10. CLAUDE.md addendum

```md
## Web (landing + dashboard) rules
- Analytics event taxonomy lives ONLY in /lib/analytics/events.ts. Import it; never inline event shapes.
- buy_intent = interest signal, NOT a sale. Dashboard copy must say "ความสนใจ/ประมาณการ", never "ยอดขาย".
- Admin routes (/admin, /api/admin/*) must be protected by middleware. Never expose raw analytics publicly.
- No PII beyond consented waitlist email. sessionId is anonymous. Respect the consent banner.
- Landing uses placeholder/original art until Bigbug approves; mark as fan project.
- Reuse the game's warm/rounded design tokens for visual consistency.
```

---

## 11. Definition of Done

- [ ] Landing สาธารณะสวย + waitlist ทำงาน + ลิงก์เข้าเกม
- [ ] เกม + landing ยิง event ครบ → เก็บใน DB
- [ ] /admin โชว์: ผู้เข้าชม, ผู้เล่น, funnel, **ชุดที่คนอยากซื้อสุด**, would-be revenue, waitlist
- [ ] export CSV เอาตัวเลขจริงไปใส่ proposal ให้ Bigbug ได้
- [ ] ทุกอย่าง privacy-aware + ระบุ fan project + ไม่มีการขายจริง
```
