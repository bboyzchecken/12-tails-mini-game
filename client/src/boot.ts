import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';

/** Where the entry flow should land when it (re)boots. */
export type EntryIntent = 'gate' | 'guest-create';
let pendingIntent: EntryIntent = 'gate';

/** Read + reset the intent (CharacterSelectScene calls this on create). */
export function consumeEntryIntent(): EntryIntent {
  const i = pendingIntent;
  pendingIntent = 'gate';
  return i;
}

/**
 * Create a fresh Phaser game running the entry flow (Boot → Preload →
 * CharacterSelect → auth/slots/guest-create). Called once at startup and again
 * whenever we leave the 3D world (change character / logout) so we return to
 * the menu without a full page refresh. `intent` picks the landing screen —
 * e.g. a guest changing character goes straight to the character picker.
 */
export function bootEntry(intent: EntryIntent = 'gate'): Phaser.Game {
  pendingIntent = intent;
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
      createContainer: true, // enables HTML overlays
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    // The world is three.js (three/World3D), launched from CharacterSelect.
    scene: [BootScene, PreloadScene, CharacterSelectScene],
  });

  if (import.meta.env.DEV) {
    (window as unknown as { __game: Phaser.Game }).__game = game;
  }
  return game;
}
