import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';

const MAX_TEXT_WIDTH = 170;
const PAD_X = 9;
const PAD_Y = 6;
const TAIL_H = 8;
const RADIUS = 8;

/**
 * In-game speech bubble, styled after 12 Tails Online: white rounded box with
 * a small tail pointing down at the speaker, dark text. The container's
 * origin (0,0) is the tail tip — position it just above the player's head.
 * Auto-destroys after CONFIG.BUBBLE_MS.
 */
export class ChatBubble extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, text: string) {
    super(scene, 0, 0);

    const label = scene.add
      .text(0, 0, text, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#2f2f38',
        align: 'center',
        wordWrap: { width: MAX_TEXT_WIDTH },
      })
      .setOrigin(0.5, 0.5);

    const w = label.width + PAD_X * 2;
    const h = label.height + PAD_Y * 2;
    const boxTop = -TAIL_H - h;

    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.96);
    g.lineStyle(1.5, 0xb9b9c6, 1);
    g.fillRoundedRect(-w / 2, boxTop, w, h, RADIUS);
    g.strokeRoundedRect(-w / 2, boxTop, w, h, RADIUS);
    // tail: small triangle from box bottom to the anchor point
    g.fillTriangle(-6, -TAIL_H + 1, 6, -TAIL_H + 1, 0, 0);
    g.lineStyle(1.5, 0xb9b9c6, 1);
    g.lineBetween(-6, -TAIL_H + 1, 0, 0);
    g.lineBetween(6, -TAIL_H + 1, 0, 0);

    label.setPosition(0, boxTop + h / 2);

    this.add([g, label]);
    this.setDepth(2000);
    scene.add.existing(this);

    scene.time.delayedCall(CONFIG.BUBBLE_MS, () => {
      if (this.active) this.destroy();
    });
  }
}
