# 12Tails Chat — Project Guide

## What this is
2D top-down multiplayer chat-map web app for 12 Tails Online fans.
Pick a character, walk a shared map, chat globally, play emotes.
Characters are 2.5D: sprites pre-rendered from the game's 3D models.

## Stack
- client: Vite + TypeScript + Phaser 3
- server: Node.js + Express + Socket.IO + TypeScript
- shared: TypeScript contracts imported by both
- maps: Tiled (JSON)

## Repo layout
/client, /server, /shared, /tools — see 12tails-chat-PLAN.md.

## Node / tooling
- Requires Node 20+ (see .nvmrc). Run `nvm use` before installing/running.
- npm workspaces. `npm install` at the root installs all packages.
- `npm run dev` starts server + client together. `npm run typecheck` checks all packages.

## Hard rules
- All Socket.IO event names + payload types live in /shared/events.ts. Import them; never inline event shapes.
- Constants (tile size, speeds, rates) live in /shared/config.ts. Never hardcode.
- Server is a relay only for positions (no server-side physics). It holds in-memory world state.
- Throttle player:move to CONFIG.MOVE_SEND_HZ. Interpolate remote players with CONFIG.LERP.
- Sanitize all chat text on the server before broadcasting (max CONFIG.CHAT_MAX_LEN, strip HTML).
- Use placeholder assets (Kenney CC0) until real sprites exist. Load characters from characters.json; don't assume specific character ids in code.

## UI rules
- UI = DOM overlay over the Phaser canvas. Never build panels/buttons/forms inside Phaser.
- All game <-> UI communication goes through /ui/bus.ts (typed). UI never touches the scene directly; scene never touches the DOM directly.
- UI tokens live in /ui/ui.css. Reuse .panel and .btn; never hardcode colors.
- Store UI is DEMO ONLY: persistent DEMO banner, every buy/top-up labeled "(demo)", no payment integration, Jil is fake, include a reset button. Never use ฿/$ for Jil.
- Equipped cosmetics MUST render in the world (via bus -> scene), not just in the menu.
- HUD/panels/modals must be responsive down to mobile; canvas + overlay scale together.
- Build U-phases (12tails-ui-roadmap.md) in order; a phase's acceptance criteria must pass before the next.

## Web stack rules (/web + /api — same monorepo, see 12tails-web-BUILD-PLAN.md)
- `/api` = Go (Echo+GORM+Uber FX+JWT) + PostgreSQL. Add a domain: Model → Store → Handler → Register(FX/api.Server) → Route → Migration. JSON is snake_case.
- `/web` = Next.js (App Router, `output:'export'` static SPA) + Zustand (client state) + TanStack Query (server data) + Axios (ONE instance, `lib/api/axios.ts`). Don't fetch() directly and don't put server data in Zustand. Exception: analytics beacons in `lib/analytics/events.ts` use keepalive fetch to survive navigation (NOT sendBeacon — its json beacon is CORS-blocked). `/web` is its own npm project (NOT a root workspace); run it with `npm --prefix web run dev` (port 3000).
- Analytics taxonomy: TS at `web/lib/analytics/events.ts` mirrors `client/src/net/track.ts`; Go models (`api/pkg/models/event.go`) mirror too. Never inline an event shape. `buy_intent` = interest signal, NEVER a sale — dashboard copy says "ความสนใจ/ประมาณการ", never "ยอดขาย".
- Identity: guest = anonymous `session_id` (client UUID in localStorage, shared key `12tails-session-id` with the game); logged-in adds `account_id`. `X-Session-Id` is allow-listed in Go CORS. Landing/admin origins (incl. `http://localhost:3000` for dev) must be in `CLIENT_ORIGIN`.
- Landing: art placeholder/original + "fan project" label until Bigbug approves. Warm/rounded design tokens live in `web/tailwind.config.ts` (same brand as the game); never hardcode colors. Fonts self-hosted via next/font (no Google Fonts request). Respect the consent banner; keep no PII beyond a waitlist email.
- Deploy (Phase 6): `/web` + game client → Cloudflare Pages (static export); Go API + Node relay → AWS; Postgres → RDS. Keep `/web` static-exportable — no Next server routes / SSR-only features.

## Build order
Implement 12tails-chat-PLAN.md phase by phase (core mechanics — done), then
12tails-ui-roadmap.md U0–U6 (UI + demo business model). Do NOT start a phase
until the previous phase's acceptance criteria pass. Commit after each phase.
Web (landing + admin + analytics): 12tails-web-BUILD-PLAN.md — Phase 1/2/3/P/4-backend
done; next = Phase 4 admin dashboard UI, then 5/6/F.
