import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import type { Direction, PlayerState } from '@12tails/shared/events';
import { CHARACTERS } from '../manifest';
import { ensureWalkAnims, idleFrame, walkAnimKey } from './anims';

/** Beyond this distance we snap instead of lerp (rejoin/teleport cases). */
const SNAP_DIST = 200;

/**
 * A player controlled elsewhere. No physics — position lerps toward the last
 * broadcast target (CONFIG.LERP per frame) so movement looks smooth at the
 * 10 Hz update rate; anims follow the broadcast moving/dir flags.
 */
export class RemotePlayer extends Phaser.GameObjects.Sprite {
  private targetX: number;
  private targetY: number;
  private dir: Direction;
  private moving: boolean;
  private tag: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, state: PlayerState) {
    // Unknown character id (mismatched client versions) → first in manifest.
    const texture = scene.textures.exists(state.characterId)
      ? state.characterId
      : CHARACTERS[0].id;
    super(scene, state.x, state.y, texture, idleFrame(state.dir));
    scene.add.existing(this);
    this.setOrigin(0.5, 0.75); // same anchor as LocalPlayer

    this.targetX = state.x;
    this.targetY = state.y;
    this.dir = state.dir;
    this.moving = state.moving;

    ensureWalkAnims(scene, texture);

    this.tag = scene.add
      .text(0, 0, state.name, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8f2ff',
        backgroundColor: '#00000066',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1000);
  }

  applyMove(p: { x: number; y: number; dir: Direction; moving: boolean }) {
    this.targetX = p.x;
    this.targetY = p.y;
    this.dir = p.dir;
    this.moving = p.moving;
  }

  update() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    if (Math.hypot(dx, dy) > SNAP_DIST) {
      this.setPosition(this.targetX, this.targetY);
    } else {
      this.setPosition(this.x + dx * CONFIG.LERP, this.y + dy * CONFIG.LERP);
    }

    // Keep walking while still visibly gliding toward the target.
    const gliding = Math.abs(dx) + Math.abs(dy) > 1;
    if (this.moving || gliding) {
      this.anims.play(walkAnimKey(this.texture.key, this.dir), true);
    } else {
      this.anims.stop();
      this.setFrame(idleFrame(this.dir));
    }

    this.setDepth(this.y);
    this.tag.setPosition(this.x, this.y - CONFIG.FRAME.H * 0.55);
  }

  destroy(fromScene?: boolean) {
    this.tag.destroy();
    super.destroy(fromScene);
  }
}
