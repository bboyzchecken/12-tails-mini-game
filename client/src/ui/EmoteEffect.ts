import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';

const BALLOON_R = 22;
const ICON_SIZE = 34;
const TAIL_H = 8;
/** Head-center offset from the sprite anchor (origin 0.5/0.75 on a 64px frame). */
const HEAD_OFFSET_Y = -26;
const HEAD_FACE_SIZE = 24;

/**
 * One player's emote: a round white balloon with the emote face floating
 * above the head, plus the same face swapped over the character's own head
 * ("action face") for the duration. Container origin is the balloon tail tip
 * — anchor it where a chat bubble would sit. Auto-destroys after
 * CONFIG.EMOTE_SHOW_MS, restoring the normal look.
 */
export class EmoteEffect extends Phaser.GameObjects.Container {
  /** Offset from the *player anchor* (not the balloon anchor) to the head face. */
  private headFace: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, facesTexture: string, frameIndex: number) {
    super(scene, 0, 0);

    const cy = -TAIL_H - BALLOON_R; // balloon circle center above the tail tip

    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.96);
    g.lineStyle(1.5, 0xb9b9c6, 1);
    g.fillCircle(0, cy, BALLOON_R);
    g.strokeCircle(0, cy, BALLOON_R);
    g.fillTriangle(-5, cy + BALLOON_R - 3, 5, cy + BALLOON_R - 3, 0, 0);

    const icon = scene.add
      .image(0, cy, facesTexture, frameIndex)
      .setDisplaySize(ICON_SIZE, ICON_SIZE);

    // The "face swap": cover the sprite's head with the emote face. Its
    // position is set per-frame in follow() since it tracks the body, not
    // the balloon.
    this.headFace = scene.add
      .image(0, 0, facesTexture, frameIndex)
      .setDisplaySize(HEAD_FACE_SIZE, HEAD_FACE_SIZE)
      .setDepth(2000);

    this.add([g, icon]);
    this.setDepth(2001);
    scene.add.existing(this);

    scene.time.delayedCall(CONFIG.EMOTE_SHOW_MS, () => {
      if (this.active) this.destroy();
    });
  }

  /** Track the speaker: balloon above the name tag, face over the head. */
  follow(target: { x: number; y: number }) {
    this.setPosition(target.x, target.y - CONFIG.FRAME.H * 0.55 - 18);
    this.headFace.setPosition(target.x, target.y + HEAD_OFFSET_Y);
    this.headFace.setDepth(target.y + 1); // just in front of the body sprite
  }

  destroy(fromScene?: boolean) {
    this.headFace.destroy();
    super.destroy(fromScene);
  }
}
