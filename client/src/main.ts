import { CONFIG } from '@12tails/shared/config';
import { connectSocket } from './net/socket';
import { bootEntry } from './boot';
import { mountDemoBanner } from './ui/store/DemoBanner';
import { mountControlHints } from './ui/hud/ControlHints';
import { mountLocationTitle } from './ui/hud/LocationTitle';
import { mountPlayerHUD } from './ui/hud/PlayerHUD';

// The entry flow can be re-created (e.g. after leaving the world), so it lives
// in boot.ts and is launched here on startup.
bootEntry();

if (import.meta.env.DEV) {
  import('./ui/bus').then((bus) => {
    (window as unknown as { __bus: typeof bus }).__bus = bus;
  });
}

// Server connection is wired now (Phase 0). Multiplayer join happens in Phase 3;
// running client-only just logs a harmless connect warning.
connectSocket();

// DOM UI overlay (12tails-ui-roadmap.md): DEMO banner ค้างตลอด + Core HUD (U1)
// HUD ซ่อนตัวเองจนกว่าข้อมูลแรกจะไหลมาทาง bus (หลังเข้า WorldScene)
mountDemoBanner();
mountLocationTitle();
mountPlayerHUD();
mountControlHints();

console.log('[client] boot · TILE =', CONFIG.TILE);
