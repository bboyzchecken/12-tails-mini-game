import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { connectSocket } from './net/socket';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { mountDemoBanner } from './ui/store/DemoBanner';
import { mountControlHints } from './ui/hud/ControlHints';
import { mountLocationTitle } from './ui/hud/LocationTitle';
import { mountPlayerHUD } from './ui/hud/PlayerHUD';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // enables HTML overlays (nickname input, chat later)
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  // 3D pivot: the world is three.js (three/World3D), launched from CharacterSelect.
  // The old Phaser WorldScene stays on disk for reference but is no longer wired.
  scene: [BootScene, PreloadScene, CharacterSelectScene],
});

// Handy for debugging in the dev console; stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
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
