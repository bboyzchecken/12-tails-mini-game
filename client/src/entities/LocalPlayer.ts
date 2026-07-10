import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import type { Direction } from '@12tails/shared/events';
import { ensureWalkAnims, idleFrame, walkAnimKey } from './anims';

/**
 * Local, keyboard-driven player. Client-authoritative movement via Arcade
 * physics; walk animation and facing follow the sprite-sheet convention
 * (row = direction, col 0 = idle, cols 1..4 = walk cycle).
 */
export class LocalPlayer extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private facing: Direction = 'down';
  private movingNow = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, idleFrame('down'));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.75); // anchor near the feet so it sits on the ground

    // Collision body: a small box around the feet, not the whole 64x64 frame.
    const body = this.body as Phaser.Physics.Arcade.Body;
    const bw = 26;
    const bh = 20;
    body.setSize(bw, bh);
    body.setOffset((CONFIG.FRAME.W - bw) / 2, CONFIG.FRAME.H - bh - 6);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as LocalPlayer['wasd'];

    ensureWalkAnims(scene, texture);
  }

  update() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx = -CONFIG.PLAYER_SPEED;
    else if (right) vx = CONFIG.PLAYER_SPEED;
    if (up) vy = -CONFIG.PLAYER_SPEED;
    else if (down) vy = CONFIG.PLAYER_SPEED;

    // Keep diagonal speed equal to cardinal speed.
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    this.setVelocity(vx, vy);

    this.movingNow = vx !== 0 || vy !== 0;
    if (this.movingNow) {
      // Face the dominant axis of motion.
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? 'left' : 'right';
      else this.facing = vy < 0 ? 'up' : 'down';
      this.anims.play(walkAnimKey(this.texture.key, this.facing), true);
    } else {
      this.anims.stop();
      this.setFrame(idleFrame(this.facing));
    }

    this.setDepth(this.y); // simple y-sort so overlapping players stack sanely
  }

  /** Current facing — broadcast to the server in player:move. */
  get direction(): Direction {
    return this.facing;
  }

  /** Whether the player moved this frame — broadcast in player:move. */
  get isMoving(): boolean {
    return this.movingNow;
  }
}
