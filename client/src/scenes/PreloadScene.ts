import Phaser from 'phaser';
import { CHARACTERS } from '../manifest';

/**
 * Loads every character thumbnail (keyed `<id>-thumb`) for the select screen.
 * World rendering is three.js now (World3D) — bodies are .glb files loaded
 * there, so no spritesheets are needed here anymore.
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

    for (const c of CHARACTERS) {
      this.load.image(`${c.id}-thumb`, c.thumb);
    }
  }

  create() {
    this.scene.start('CharacterSelect');
  }
}
