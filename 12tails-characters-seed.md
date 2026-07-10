# 12 หาง — ข้อมูลตัวละคร (characters.json seed)

ข้อมูลข้อเท็จจริง (ชื่อ/คลาส/บทบาท) ดึงจากหน้า "แนะนำตัวละคร" ของ 12tails-th.com
ใช้เป็น seed สำหรับ `shared/characters.json` (ตาม PLAN.md) + flavor สั้นๆ สำหรับหน้าเลือกตัวละคร

> 🎨 `sheet` / `faces` / `thumb` เป็น **placeholder** — เสียบอาร์ตจริงที่ extract เองทีหลัง (ไม่ scrape จากเว็บ)
> 🐺 "Wolf / หมาป่า" คือตัวที่เราเรียกกันว่า "หมา" — เป็น 1 ใน 2 ตัวแรกที่ทำ (คู่กับแกะ)

---

## roster (12 เผ่า)

| # | id | EN | TH | คลาส | บทบาทสั้น |
|---|----|----|----|------|-----------|
| 1 | cat | Cat | แมว | Rogue | ประชิดเร็ว + ปามีดระยะไกล + บัฟ/ดีบัฟ |
| 2 | wolf | Wolf | หมาป่า | Swordsman | ดาบระยะใกล้-กลาง + ซัพพอร์ตทีม (ตัวแรก) |
| 3 | monkey | Monkey | ลิง | Summoner | อัญเชิญสัตว์อสูรไฟ/ดิน |
| 4 | bat | Bat | ค้างคาว | Dark Mage | เวทย์มืดเป้าเดี่ยว + ดีบัฟ + แยกร่าง |
| 5 | sheep | Sheep | แกะ | Priest | ฮีลเลอร์ + บัฟทีม (ตัวแรก) |
| 6 | rabbit | Rabbit | กระต่าย | Sniper | ยิงไกล + ผสมยาบัฟแจกทีม |
| 7 | panda | Panda | แพนด้า | Brawler | คอมโบหมัด + เพิ่ม SP |
| 8 | penguin | Penguin | เพนกวิน | Mage (AoE) | เวทย์วงกว้าง + ชาร์จ MP |
| 9 | mole | Mole | ตุ่น | Engineer | ป้อมปืน/หุ่นยนต์/กับระเบิด |
| 10 | bison | Bison | ไบสัน | Tank | ขวางแทงค์ + บัฟโจมตี + KO |
| 11 | whale | Whale | วาฬ | Guardian | แทงค์ป้องกัน + บัฟกันภัยให้ทีม |
| 12 | chameleon | Chameleon | กิ้งก่า | Archer | ธนูว่องไว + พราง + ลูกธนูพิษ/กับดัก |

---

## characters.json (seed)

```json
[
  { "id": "cat",       "en": "Cat",       "th": "แมว",     "class": "Rogue",      "color": "#E7B24A", "sheet": "assets/char/cat/sheet.png",       "faces": "assets/char/cat/faces.png",       "thumb": "assets/char/cat/thumb.png" },
  { "id": "wolf",      "en": "Wolf",      "th": "หมาป่า",   "class": "Swordsman",  "color": "#8C7A6B", "sheet": "assets/char/wolf/sheet.png",      "faces": "assets/char/wolf/faces.png",      "thumb": "assets/char/wolf/thumb.png" },
  { "id": "monkey",    "en": "Monkey",    "th": "ลิง",      "class": "Summoner",   "color": "#B5793E", "sheet": "assets/char/monkey/sheet.png",    "faces": "assets/char/monkey/faces.png",    "thumb": "assets/char/monkey/thumb.png" },
  { "id": "bat",       "en": "Bat",       "th": "ค้างคาว",  "class": "Dark Mage",  "color": "#6B5E86", "sheet": "assets/char/bat/sheet.png",       "faces": "assets/char/bat/faces.png",       "thumb": "assets/char/bat/thumb.png" },
  { "id": "sheep",     "en": "Sheep",     "th": "แกะ",      "class": "Priest",     "color": "#F0E9DE", "sheet": "assets/char/sheep/sheet.png",     "faces": "assets/char/sheep/faces.png",     "thumb": "assets/char/sheep/thumb.png" },
  { "id": "rabbit",    "en": "Rabbit",    "th": "กระต่าย",  "class": "Sniper",     "color": "#E8C6C0", "sheet": "assets/char/rabbit/sheet.png",    "faces": "assets/char/rabbit/faces.png",    "thumb": "assets/char/rabbit/thumb.png" },
  { "id": "panda",     "en": "Panda",     "th": "แพนด้า",   "class": "Brawler",    "color": "#3B3B3B", "sheet": "assets/char/panda/sheet.png",     "faces": "assets/char/panda/faces.png",     "thumb": "assets/char/panda/thumb.png" },
  { "id": "penguin",   "en": "Penguin",   "th": "เพนกวิน",  "class": "Mage",       "color": "#2E4A66", "sheet": "assets/char/penguin/sheet.png",   "faces": "assets/char/penguin/faces.png",   "thumb": "assets/char/penguin/thumb.png" },
  { "id": "mole",      "en": "Mole",      "th": "ตุ่น",     "class": "Engineer",   "color": "#7A5C48", "sheet": "assets/char/mole/sheet.png",      "faces": "assets/char/mole/faces.png",      "thumb": "assets/char/mole/thumb.png" },
  { "id": "bison",     "en": "Bison",     "th": "ไบสัน",    "class": "Tank",       "color": "#5C4433", "sheet": "assets/char/bison/sheet.png",     "faces": "assets/char/bison/faces.png",     "thumb": "assets/char/bison/thumb.png" },
  { "id": "whale",     "en": "Whale",     "th": "วาฬ",      "class": "Guardian",   "color": "#4C7EA0", "sheet": "assets/char/whale/sheet.png",     "faces": "assets/char/whale/faces.png",     "thumb": "assets/char/whale/thumb.png" },
  { "id": "chameleon", "en": "Chameleon", "th": "กิ้งก่า",  "class": "Archer",     "color": "#6FA85C", "sheet": "assets/char/chameleon/sheet.png", "faces": "assets/char/chameleon/faces.png", "thumb": "assets/char/chameleon/thumb.png" }
]
```

---

## เกร็ดจากเว็บ (ใช้กับโมเดลรายได้ demo ได้)

- สกุลเงินในเกมยืนยันแล้ว: **Jil** (พรีเมียม) และ **Rp** — เดโมใช้ **Jil** เป็น soft currency ของถุงสุ่ม
- กล่องสุ่มจริงของเกมชื่อ **"Lucky Box"** — เดโม gacha อ้างอิงชื่อ/คอนเซปต์นี้ได้ให้ดูสมจริง
- ของในเกม (consumable/cosmetic) เช่น Renew, Life Elixir, Party Popper, Blue Bug Balloon ฯลฯ — ใช้เป็นแรงบันดาลใจตั้งชื่อไอเทม cosmetic ในเดโม (ทำเป็นของเราเอง)

> เริ่ม 2 ตัวแรก (wolf + sheep) ก่อนตาม `12tails-add-characters-dog-sheep.md` แล้วค่อยเติมที่เหลือ
