# 12tails-api

หลังบ้าน REST API สำหรับ 12Tails (analytics ingestion + waitlist + season store + player accounts).
สแตก: **Go + Echo + GORM + Uber FX + PostgreSQL** — ตามเทมเพลตของทีม (layered + repository).

> ส่วนนี้คือ **Phase 1** ตาม [`12tails-web-BUILD-PLAN.md`](../12tails-web-BUILD-PLAN.md): API backbone + `/track` ingestion + `/waitlist`.
> อยู่ใน monorepo เดียวกับเกม (`/api` คู่กับ `/client` `/server` `/shared`).

## Quick start

```bash
cp .env.example .env          # ปรับค่าได้ตามต้องการ
docker compose up -d          # postgres:16 บน :5432
go run .                      # start API บน :5000 (migrate อัตโนมัติ)
# หรือรัน migration อย่างเดียว:  go run . up
```

ตรวจสุขภาพ: `curl localhost:5000/health` → `{"ok":true,"service":"12tails-api"}`

## Endpoints

| Method | Path | Auth | ใช้ทำอะไร |
|---|---|---|---|
| GET | `/health` | public | health check |
| POST | `/track` | public | บันทึก analytics event (game + landing ยิงมา) |
| POST | `/waitlist` | public | เก็บอีเมล waitlist (dedupe ต่ออีเมล) |
| POST | `/auth/register` | public | สมัคร standalone (email+password+family_name) → JWT |
| POST | `/auth/login` | public | login → JWT (HS256, 7 วัน) |
| GET | `/me` | Bearer | บัญชี + characters + max_slots |
| GET/POST | `/me/characters` | Bearer | ดู/สร้างตัวละคร (slot limit 3, ชื่อถาวร) |
| POST | `/me/topup` | Bearer | เติมเงิน **(demo)** — เก็บประวัติต่อบัญชี |
| GET | `/me/topups` | Bearer | ประวัติเติมเงิน (demo) + ยอดรวม |

### `POST /track`
```json
{ "type": "buy_intent", "session_id": "<uuid>", "item_id": "wolf:hat:2",
  "meta": { "price_jil": 350, "item_type": "hat" }, "referrer": "https://..." }
```
- `type` จำเป็น · `session_id` = UUID ที่ client สร้าง/persist เอง (ไม่ส่งมาก็ fallback header `X-Session-Id` หรือ generate ให้)
- `account_id` = ใส่เมื่อ login แล้ว (Phase P) · `meta` = payload อิสระ (เก็บเป็น jsonb)
- ตอบ `201 { ok, id, session_id }`

### `POST /waitlist`
```json
{ "email": "fan@example.com", "source": "landing_hero" }
```
ตอบ `200 { ok, created }` — `created:false` = อีเมลนี้มีอยู่แล้ว (idempotent)

### Accounts (Phase P)
```bash
# สมัคร → ได้ token
curl -s -X POST localhost:5055/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"wolf@example.com","password":"secret1","family_name":"CHXQ"}'
# สร้างตัวละคร (ชื่อถาวร) — แนบ Bearer token
curl -s -X POST localhost:5055/me/characters -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"หมาป่าเดียวดาย","character_id":"wolf","appearance":{"color":2,"face":1}}'
```
- **บันไดตัวตน:** guest → สมัคร standalone (ไม่ต้องผูก social) → ผูก Google/Apple/Line ทีหลัง (เฟสหลัง)
- `family_name` (บรรทัด 1) + `character.name` (บรรทัด 2) = nameplate 2 บรรทัด · **ชื่อถาวร** (เปลี่ยน = ไอเทม Jil)
- password เก็บเป็น bcrypt · `/me/*` ต้องมี Bearer JWT · slot เริ่ม 3 (ซื้อเพิ่มด้วย Jil ทีหลัง)

## โครงสร้าง (ตามเทมเพลต)
```
main.go                       # env + FX wiring + lifecycle + `up` CLI
pkg/core/config.go            # Config + PostgresConfig + DSN()
pkg/db/db.go                  # GORM postgres + gormigrate migrations
pkg/logger/                   # Logrus + request-logging middleware
pkg/models/                   # struct + Store interface ต่อ domain
pkg/store/<domain>/           # GORM repository
pkg/handlers/api/             # Server, CORS, routes, *.handler.go
```

## เพิ่ม domain ใหม่
Model → Store → Handler → Register (`fx.Provide` + field ใน `api.Server`) → Route (`api.build()`) → Migration (`pkg/db/db.go`).

## Deploy (แผน)
Docker → **AWS** (App Runner / EC2 / Fargate — long-running, WebSocket ได้) · Postgres → **RDS** · asset CDN (เฟสหลัง) → R2/S3.
