import Phaser from 'phaser';

/** Minimal boot — hands straight off to the preload scene. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Preload');
  }
}
