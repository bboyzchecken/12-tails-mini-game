# Deploy 12Tails Chat (Phase 6)

สถาปัตยกรรม: **client** (static) + **server** (Node + WebSocket) แยก host กัน

```
ผู้เล่น ──HTTPS──> client (Vercel/Netlify/CF Pages)
   └──WSS(Socket.IO)──> server (Render/Railway)
```

ลำดับที่แนะนำ: deploy **server ก่อน** (จะได้ URL) → deploy client โดยชี้ `VITE_SERVER_URL` ไปที่ server → กลับไปตั้ง `CLIENT_ORIGIN` ที่ server ให้ยอมรับ origin ของ client

---

## 1) Server → Render (ฟรี, รองรับ WebSocket)

1. เข้า [render.com](https://render.com) → **New → Blueprint** → เชื่อม GitHub เลือก repo `12-tails-mini-game`
   (มี [render.yaml](render.yaml) ให้แล้ว — Render จะตั้งค่าให้อัตโนมัติ: `npm install` / `npm start` / health check ที่ `/health`)
2. ตอนถาม env var `CLIENT_ORIGIN`: ใส่ไปก่อนว่า `http://localhost:5173` (เดี๋ยวกลับมาแก้หลังได้ URL client)
3. รอ deploy เสร็จ → ได้ URL เช่น `https://12tails-chat-server.onrender.com`
4. ทดสอบ: เปิด `https://<url>/health` ต้องเห็น `{"ok":true,"players":0}`

> ⚠️ Free tier ของ Render จะ **sleep เมื่อไม่มีคนใช้ ~15 นาที** — ตื่นครั้งแรกช้า ~1 นาที ถ้าอยากไม่ sleep ใช้ plan จ่ายเงิน หรือย้ายไป Railway/Fly.io

**ทางเลือก Railway:** New Project → Deploy from GitHub repo → ตั้ง env `CLIENT_ORIGIN` → Railway อ่าน `npm start` เองจาก root (มี `engines: node >= 20` กำกับแล้ว)

## 2) Client → Vercel (หรือ Netlify/Cloudflare Pages)

1. เข้า [vercel.com](https://vercel.com) → **Add New → Project** → เลือก repo เดียวกัน
2. ตั้งค่า build:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build` · **Output Directory:** `dist`
   - **Install Command:** `npm install --prefix ..` (ให้ npm ติดตั้งแบบ workspace จาก root)
3. **Environment Variables:** เพิ่ม `VITE_SERVER_URL` = URL server จากข้อ 1 (เช่น `https://12tails-chat-server.onrender.com`) — **ไม่มี / ปิดท้าย**
4. Deploy → ได้ URL เช่น `https://12tails-chat.vercel.app`

## 3) เปิด CORS ให้ client

กลับไปที่ Render/Railway → แก้ env `CLIENT_ORIGIN` เป็น URL ของ client (คั่นหลายตัวด้วย comma ได้):

```
https://12tails-chat.vercel.app,http://localhost:5173
```

save แล้ว server จะ restart เอง → log ต้องเห็น `allowed origins: https://12tails-chat.vercel.app, http://localhost:5173`

## 4) ทดสอบ AC (หลายเครื่องผ่านเน็ตจริง)

- [ ] เปิด URL client จาก **คอม 2 เครื่อง + มือถือ** (เน็ตคนละวง เช่น 4G กับ WiFi)
- [ ] ทุกเครื่องเลือกตัว/ชื่อต่างกัน → เห็นกันเดินลื่น ไม่วาร์ป
- [ ] แชท: ทุกเครื่องเห็น bubble + log ครบ
- [ ] emote: แสดงทุกเครื่อง + cooldown ทำงาน
- [ ] ปิดแท็บเครื่องหนึ่ง → ตัวหายจากเครื่องอื่น

---

## ทดสอบมือถือใน LAN (ยังไม่ต้อง deploy)

1. หา IP เครื่อง: `ipconfig getifaddr en0` (เช่น `192.168.1.50`)
2. สร้าง `client/.env.local`: `VITE_SERVER_URL=http://192.168.1.50:3001`
3. รัน server โดยเพิ่ม origin ของมือถือ:
   ```bash
   CLIENT_ORIGIN="http://localhost:5173,http://192.168.1.50:5173" npm run dev:server
   ```
4. รัน client แบบเปิดให้ LAN เข้า: `npm run dev:client -- --host`
5. มือถือ (WiFi วงเดียวกัน) เปิด `http://192.168.1.50:5173`

## Env vars สรุป

| ที่ | ตัวแปร | ค่า |
|---|---|---|
| server | `PORT` | host ตั้งให้เอง (Render/Railway inject) |
| server | `CLIENT_ORIGIN` | origin ของ client, คั่นด้วย comma |
| client (build) | `VITE_SERVER_URL` | URL ของ server |
