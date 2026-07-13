# Prompt Pack — Asset ระบบตกปลา 12 หาง

> **วิธีใช้:** เจนตามลำดับ — ล็อก STYLE ก่อน แล้วทุก asset ต่อจากนั้นแปะ STYLE BLOCK นำหน้าเสมอ
> Prompt เขียนเป็นภาษาอังกฤษ (gen model ทำงานแม่นกว่า) มีคำอธิบายไทยกำกับ
> ทุก asset: **พื้นหลังโปร่งใส (PNG), 1 ชิ้นต่อภาพ, จัดกึ่งกลาง**

---

## ⚙️ ก่อนเจน — สเปคที่ต้องล็อกจากระบบก่อน

เติมค่าจริงลงช่องว่างก่อนเริ่มเจน:

- ขนาดปลาในมินิเกม: `____ x ____ px` (แนะนำเริ่มที่ราว 256×256 แล้วย่อ)
- จำนวนปลาต่อ tier: ธรรมดา `___` / หายาก `___` / เอปิก `___` / เลเจนดารี่ `___`
- มุมมองปลา: side profile (แนะนำ — อ่านง่าย เจนสม่ำเสมอสุด)
- สีกรอบความหายาก: ต้อง**ตรงกับกรอบคอสตูมในร้าน** → เทา/น้ำเงิน/ม่วง/ทอง

---

## 🎨 MASTER STYLE BLOCK (แปะนำหน้าทุก prompt)

> ล็อกอันนี้ให้ตรงกับ art direction ของเกม (แมวน่ารัก นุ่ม โทนพาสเทล/อุ่น ขอบมน) จากภาพเกมจริง

```
STYLE: cute mobile game asset, soft rounded chibi style, clean bold outlines,
smooth cel-shading with soft gradients, warm pastel palette, friendly and
charming, slightly chunky proportions, readable at small sizes, centered
composition, transparent background, no text, no shadow on ground,
consistent soft top-left lighting, 2D sprite, high quality game art
```

**เคล็ดความสม่ำเสมอ:**
- เจน tier เดียวกันในรอบเดียว/seed ใกล้กัน
- อ้างอิงตัวแรกที่ชอบเป็น style reference ให้ตัวถัดไป
- ถ้าใช้ Midjourney: ตั้ง `--style raw` + ใส่ `--sref [ตัวอย่างที่ชอบ]` เพื่อล็อกสไตล์

---

## 🐟 ปลา (แยกตาม tier — ความหายากยิ่งสูง เอฟเฟกต์ยิ่งเยอะ)

### ธรรมดา (Common) — กรอบเทา, ธรรมชาติเรียบ
```
[STYLE BLOCK] + a common small river fish, natural muted colors (grey/brown/
silver), simple and plain, no glow, side profile view
```

### หายาก (Rare) — กรอบน้ำเงิน, เรืองแสงฟ้าอ่อน
```
[STYLE BLOCK] + an uncommon fish with pretty blue and teal colors, subtle
soft blue glow outline, slightly shimmering scales, side profile view
```

### เอปิก (Epic) — กรอบม่วง, เรืองม่วง
```
[STYLE BLOCK] + a rare epic fish, vibrant purple and magenta colors,
glowing purple aura, sparkling magical scales, elegant fins, side profile view
```

### เลเจนดารี่ (Legendary) — กรอบทอง, เรืองทอง อลังการ
```
[STYLE BLOCK] + a legendary majestic fish, golden and radiant colors,
strong golden glow, sparkles and light rays, ornate flowing fins,
mythical and impressive, side profile view
```

**ตัวอย่างปลาเจาะจง (จาก reference)** — เปลี่ยนท้าย prompt ตามชื่อ:
- ปลาเรืองแสง (กลางคืน): `bioluminescent deep-sea fish, glowing dots, dark body`
- ปลามังกร (เลเจนดารี่): `dragon-like fish with whiskers, serpentine body, golden`
- ปลาปักเป้ายักษ์: `chubby round pufferfish, spikes, cute grumpy face`
- ทูน่าทอง (สะสม): `sleek tuna fish entirely golden metallic, trophy-like`

---

## 🎣 คันเบ็ด (2 สาย — อย่าปนกัน)

> จำแยก: **คันเพิ่มพลัง** (ซื้อด้วยเกล็ด) vs **สกินคันสวย** (ซื้อด้วย Jil)
> ทั้งคู่เป็นไอเทมช่อง "อาวุธ" สวมโชว์บนตัวได้

### สายเพิ่มพลัง (ไล่ tier ให้เห็นพัฒนาการชัด)
```
[STYLE BLOCK] + a fishing rod, [TIER], game item icon, diagonal 45-degree
angle, held-item style
```
แทน `[TIER]`:
- `simple wooden fishing rod, basic and plain`
- `sturdy bamboo fishing rod with better reel`
- `polished fishing rod with metal reel, blue accents, epic quality`
- `legendary golden fishing rod, glowing, ornate reel, light particles`

### สกินคันพรีเมียม (ขาย Jil — เน้นสวย/ธีม ไม่เน้นพลัง)
```
[STYLE BLOCK] + a decorative themed fishing rod, [THEME], premium cosmetic
skin, eye-catching and flashy, diagonal 45-degree angle
```
แทน `[THEME]`: `crystal ice theme` / `sakura cherry blossom theme` /
`galaxy space theme` / `candy sweet theme`

---

## 🪱 เหยื่อ (ไอเทมเล็ก ก้อนกลม อ่านง่ายที่ขนาดจิ๋ว)
```
[STYLE BLOCK] + a bait item icon, [TYPE], small round game item, simple and
clear, centered
```
แทน `[TYPE]`: `a worm on a hook` / `a glowing lure` / `a shiny golden bait
that attracts rare fish` / `a bug bait`

---

## 🖼️ UI — คอมิกเอฟเฟกต์ (อารมณ์อยู่ตรงนี้ ไม่ใช่ท่า 3D)
```
comic book style bold text effect, "[WORD]", dynamic explosion burst shape,
vibrant colors, thick outline, hand-drawn cartoon style, transparent
background, no realistic elements
```
แทน `[WORD]`:
- `POW` / `BAM` / `BOOM` — สีส้ม/แดง/เหลือง (ตอนติดปลา)
- `MISS` — สีเทา/ฟ้าหม่น (ตอนพลาด)
- `LEGENDARY!` — สีทอง เรืองแสง อลังการ (ตอนได้ตัวเทพ)

---

## 🔲 UI — กรอบความหายาก (ต้องเข้าชุดกับกรอบคอสตูมในร้าน)
```
game item frame border, rounded square, [COLOR] theme, clean UI element,
soft glow, empty center transparent, mobile game style, transparent background
```
แทน `[COLOR]`: `grey (common)` / `blue (rare)` / `purple (epic)` /
`gold with sparkles (legendary)`

---

## 💰 UI — ไอคอนสกุลเงินตกปลา (เกล็ด/เหรียญปลา)
```
[STYLE BLOCK] + a currency icon, a shiny fish scale coin, iridescent
blue-green, small clean UI icon, glossy
```
> ทำให้ **หน้าตาต่างจาก Jil ชัดเจน** (Jil = เพชร) เพื่อไม่ให้คนสับสนสองสกุลเงิน

---

## 🐠 UI — ตู้ปลา / ของแต่งตู้ (เฟสหลัง)
```
[STYLE BLOCK] + an empty decorative fish tank aquarium, [TIER], side view,
game furniture item
```
แทน `[TIER]`: `simple glass tank (เกล็ด)` / `premium ornate aquarium with
decorations and lights (Jil)`

ของแต่งตู้: `a small aquarium decoration, [ITEM]` →
`coral` / `treasure chest` / `seaweed plant` / `castle ruin`

---

## ✅ ลำดับเจนแนะนำ

1. เจนปลาธรรมดา 2-3 ตัวก่อน → เลือกตัวที่ชอบเป็น **style anchor**
2. ใช้ตัวนั้นเป็น reference เจนที่เหลือทุก tier ให้เข้าชุด
3. เจนคันเบ็ดสายพลังครบทุก tier (ให้เห็น progression)
4. เจน UI (คอมิกเอฟเฟกต์ + กรอบ + ไอคอนเกล็ด)
5. เหยื่อ → เอาไว้ทีหลังได้ (ไม่บล็อกการเทส)
6. ตู้ปลา/ของแต่งตู้ → เฟสหลังสุด

> **อย่าลืม:** เทสกลไกด้วย placeholder ให้สนุกก่อน แล้วค่อยเจนของจริงมาทับ
> asset สวยแค่ไหนก็กู้เกมที่กลไกไม่สนุกไม่ได้
