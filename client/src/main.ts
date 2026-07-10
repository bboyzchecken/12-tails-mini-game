import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { connectSocket } from './net/socket';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { WorldScene } from './scenes/WorldScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, WorldScene],
});

// Handy for debugging in the dev console; stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

// Server connection is wired now (Phase 0). Multiplayer join happens in Phase 3;
// running client-only just logs a harmless connect warning.
connectSocket();

console.log('[client] boot · TILE =', CONFIG.TILE);
