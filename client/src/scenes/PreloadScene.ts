import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';

/**
 * Loads the Phase 1 assets: the novice-camp tilemap, its tileset image, and
 * the placeholder character sheet. Phase 2 will expand this to load every
 * character from characters.json.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const label = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Loading… 0%', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e0e0ff',
      })
      .setOrigin(0.5);
    this.load.on('progress', (p: number) => label.setText(`Loading… ${Math.round(p * 100)}%`));

    this.load.tilemapTiledJSON('novice-camp', 'assets/maps/novice-camp.json');
    this.load.image('tiles', 'assets/maps/tileset.png');
    this.load.spritesheet('novice', 'assets/characters/novice/sheet.png', {
      frameWidth: CONFIG.FRAME.W,
      frameHeight: CONFIG.FRAME.H,
    });
  }

  create() {
    // Phase 2 will replace these with the player's real selection.
    this.scene.start('World', { characterId: 'novice', name: 'มือใหม่' });
  }
}
