import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { CHARACTERS, FACE } from '../manifest';

/**
 * Loads the map and every character listed in characters.json, then hands off
 * to the character-select screen. Each character sheet is keyed by its id so
 * later scenes can spawn it directly; thumbnails are keyed `<id>-thumb`.
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

    for (const c of CHARACTERS) {
      this.load.spritesheet(c.id, c.sheet, {
        frameWidth: CONFIG.FRAME.W,
        frameHeight: CONFIG.FRAME.H,
      });
      this.load.spritesheet(`${c.id}-faces`, c.faces, {
        frameWidth: FACE.w,
        frameHeight: FACE.h,
      });
      this.load.image(`${c.id}-thumb`, c.thumb);
    }
  }

  create() {
    this.scene.start('CharacterSelect');
  }
}
