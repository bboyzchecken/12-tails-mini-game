import Phaser from 'phaser';
import type { Direction } from '@12tails/shared/events';
import { FRAME } from '../manifest';

const WALK_FPS = 8; // client-side render tuning, not a shared gameplay constant

/** Row index per direction, derived from the manifest's rowOrder. */
export const DIR_ROW = Object.fromEntries(
  FRAME.rowOrder.map((dir, row) => [dir, row]),
) as Record<Direction, number>;

export function idleFrame(dir: Direction): number {
  return DIR_ROW[dir] * FRAME.cols + FRAME.idleCol;
}

export function walkAnimKey(texture: string, dir: Direction): string {
  return `${texture}-walk-${dir}`;
}

/** Create the 4 walk animations for a character texture (idempotent). */
export function ensureWalkAnims(scene: Phaser.Scene, texture: string) {
  for (const dir of FRAME.rowOrder) {
    const key = walkAnimKey(texture, dir);
    if (scene.anims.exists(key)) continue;
    const base = DIR_ROW[dir] * FRAME.cols;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture, {
        frames: FRAME.walkCols.map((c) => base + c),
      }),
      frameRate: WALK_FPS,
      repeat: -1,
    });
  }
}
