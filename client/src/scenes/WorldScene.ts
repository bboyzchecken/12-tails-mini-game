import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { LocalPlayer } from '../entities/LocalPlayer';

interface WorldInit {
  characterId: string;
  name: string;
}

/**
 * The shared map. Phase 1: loads the tilemap + collision and lets a single
 * local player walk around. Multiplayer/remote players arrive in Phase 3.
 */
export class WorldScene extends Phaser.Scene {
  private player!: LocalPlayer;
  private nameTag!: Phaser.GameObjects.Text;

  constructor() {
    super('World');
  }

  create(init: WorldInit) {
    const map = this.make.tilemap({ key: 'novice-camp' });
    const tileset = map.addTilesetImage('novice-camp', 'tiles');
    if (!tileset) throw new Error('Failed to load tileset "novice-camp"');

    const ground = map.createLayer('ground', tileset, 0, 0);
    const objects = map.createLayer('objects', tileset, 0, 0);
    if (!ground || !objects) throw new Error('Failed to create map layers');

    // Tiles flagged `collides` in the tileset become solid.
    ground.setCollisionByProperty({ collides: true });
    objects.setCollisionByProperty({ collides: true });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new LocalPlayer(this, CONFIG.SPAWN.x, CONFIG.SPAWN.y, init.characterId);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, objects);

    // Camera follows the player, clamped to the map bounds.
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.roundPixels = true;

    // Small name tag above the player (full presence UI comes in Phase 3).
    this.nameTag = this.add
      .text(0, 0, init.name, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#00000066',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1000);
  }

  update() {
    this.player.update();
    this.nameTag.setPosition(this.player.x, this.player.y - CONFIG.FRAME.H * 0.55);
  }
}
