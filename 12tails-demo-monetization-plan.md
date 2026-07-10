# Demo: โมเดลรายได้ (Mock เพื่อ present Bigbug)

ส่วนเสริมของ **PLAN.md** · เพิ่ม “Demo Mode” เพื่อโชว์โมเดลรายได้ให้ Bigbug เห็นภาพ

> 🔴 นี่คือ **เดโม / ตัวอย่างเท่านั้น** — ไม่มีการจ่ายเงินจริง ไม่มีการซื้อจริง ทุกอย่างเป็น mock (Jil ปลอม, “ซื้อ” = ปลดล็อกในเครื่องเพื่อพรีวิว)
> 🔴 ต้องมีแบนเนอร์ **“DEMO — ยังไม่เปิดขายจริง”** ค้างบนหน้าจอตลอด
> 🔴 **ห้ามต่อ payment gateway ใดๆ** · ปุ่ม “ซื้อ / เติม” ทั้งหมดเป็นการจำลอง

---

## สิ่งที่เดโมต้องโชว์ (5 พื้นผิวรายได้)

1. ร้าน cosmetic ขายตรง (เห็นของก่อนจ่าย)
2. Battle Pass / ซีซัน
3. Supporter รายเดือน
4. Collection ตามธีม (ชุดฤดูร้อน)
5. (Optional) ถุงสุ่มด้วย Jil — พร้อม odds + pity + ซื้อตรงได้

---

## หลักการวางโครง

- ทำเป็น **“Demo Mode” layer** ทับบนเกมจริง เปิด/ปิดด้วย flag `CONFIG.DEMO_STORE = true`
- **ไม่แตะ loop chat จริง** — เป็นโหมดโชว์แยก
- state ทั้งหมดอยู่ **client-side** เท่านั้น (ไม่มี server billing, ไม่มี DB จริง)

---

## Data model (client only)

```ts
type CosmeticType = 'skin' | 'color' | 'emote' | 'chatFrame';

interface Cosmetic {
  id: string;
  type: CosmeticType;
  name: string;
  collection: string;              // เช่น "summer"
  priceJil: number;                // ราคาเป็น Jil (mock)
  rarity: 'common' | 'rare' | 'epic';
  preview: string;                 // asset สำหรับพรีวิว
}

interface DemoWallet { jil: number; }                        // ยอด Jil ปลอม
interface OwnedCosmetics {
  owned: string[];                                           // cosmetic id ที่ปลดล็อกแล้ว
  equipped: Partial<Record<CosmeticType, string>>;           // ที่ใส่อยู่
}
```

---

## พื้นผิวรายได้ (mock UI)

### 1. Shop — ขายตรง
- [ ] กริด cosmetic แยกแท็บตามประเภท (skin / color / emote / chatFrame)
- [ ] คลิกดู **พรีวิวบนตัวละคร / บับเบิลจริง** ก่อนซื้อ
- [ ] ปุ่ม “แลกด้วย Jil (demo)” → หัก Jil ปลอม → เพิ่มใน owned + equip ทันที
- [ ] ป้าย DEMO ทุกปุ่มซื้อ

### 2. Battle Pass / Season
- [ ] แทร็กเป็น tier ปลดล็อก cosmetic — free track vs premium track
- [ ] สไลเดอร์ “จำลองความคืบหน้า” เพื่อโชว์การปลดล็อกทีละ tier
- [ ] ปุ่ม “ปลดล็อก premium (demo)”

### 3. Supporter (รายเดือน)
- [ ] การ์ด tier: ป้าย + ห้องพิเศษ + emote พิเศษ
- [ ] ปุ่ม “สมัคร (demo)” → เปิดสิทธิ์จำลอง (โชว์ป้าย / emote / เข้าห้องพิเศษได้)

### 4. Collection ตามธีม
- [ ] หน้า “ชุดฤดูร้อน”: โชว์ทั้งเซ็ต ซื้อทีละชิ้น / ซื้อยกเซ็ตแบบ direct
- [ ] เน้นข้อความ “ขายตรง เห็นของก่อนจ่าย”

### 5. ถุงสุ่มด้วย Jil (optional · responsible)
- [ ] เติม Jil (mock top-up — ไม่มีจ่ายจริง)
- [ ] “ถุงสุ่มฤดูร้อน” ราคา X Jil → สุ่ม 1 ชิ้นพร้อมแอนิเมชันเปิด
- [ ] **บังคับโชว์:** ตารางอัตราดรอป + pity counter (สุ่มครบ N ครั้งการันตี epic) + ปุ่ม “ซื้อชิ้นนี้ตรงๆ” เป็นทางเลือก
- [ ] ทุกอย่างจำลอง + ป้าย DEMO

---

## ตัวป้องกัน (demo safeguards)

- [ ] แบนเนอร์ “DEMO — ตัวอย่างเพื่อการนำเสนอ ยังไม่เปิดขายจริง” ค้างบนสุดตลอด
- [ ] ทุกปุ่มซื้อ / เติม เขียน “(demo)” ให้ชัด
- [ ] ไม่มี payment / ช่องกรอกบัตร / ลิงก์จ่ายเงินใดๆ
- [ ] Jil เป็นยอดปลอม + มีปุ่ม “reset demo”
- [ ] ไม่ใช้สัญลักษณ์เงินจริง (฿ / $) กับ Jil — ให้ชัดว่าเป็น currency ในเกม

---

## เชื่อมกับ PLAN.md

- [ ] cosmetic apply ทับของจริง: `skin` เปลี่ยน sheet, `color` เปลี่ยน tint, `chatFrame` เปลี่ยนกรอบ bubble, `emote` เพิ่มใน EmoteWheel
- [ ] equipped cosmetics **render ใน world ให้เห็นจริง** (โชว์ได้ว่า “จ่ายแล้วได้อะไร”)
- [ ] เก็บ demo store state **แยก** จาก state เกมจริง

---

## Phases + acceptance

- **D0** — flag `DEMO_STORE` + แบนเนอร์ DEMO + demo wallet
  **AC:** เปิดโหมดเห็นแบนเนอร์ + ยอด Jil ปลอม
- **D1** — Shop ขายตรง + พรีวิวบนตัวจริง + equip
  **AC:** “ซื้อ” แล้วตัวละคร / บับเบิลเปลี่ยนจริงในแมพ
- **D2** — Battle Pass + Supporter (mock)
  **AC:** ปลดล็อก / สมัคร แล้วเห็นของ + เข้าห้องพิเศษได้
- **D3** — Collection ฤดูร้อน (direct)
  **AC:** ซื้อทีละชิ้น / ยกเซ็ตได้
- **D4** — ถุงสุ่ม Jil + odds + pity + ปุ่มซื้อตรง
  **AC:** สุ่มได้ เห็น odds / pity ครบ ทุกอย่าง mock
- **D5** — ขัดเกลาให้ present สวย + reset demo
  **AC:** เดินให้ Bigbug ดูได้ตั้งแต่ต้นจนจบแบบลื่น

---

## ข้อควรระวังสำหรับเวอร์ชันจริง (ภายหลัง)

ก่อนเปิดขายจริง: ถุงสุ่ม / loot box มีประเด็นกฎหมายการพนันในหลายเขต (ไทยกำลังพิจารณากำกับ) — ปรึกษาทนายก่อนเปิด และคงดีไซน์โปร่งใส (odds เปิดเผย + pity + ซื้อตรงได้) ไว้เสมอ ส่วนการเก็บเงินจริง / รายได้ ต้องผูกกับสัญญาลิขสิทธิ์กับ Bigbug ให้เรียบร้อยก่อน
