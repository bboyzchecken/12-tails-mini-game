import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { CHARACTERS } from '../manifest';

const CARD_W = 168;
const CARD_H = 210;
const GAP = 28;

/**
 * Grid of characters (thumb + name + tribe) plus a nickname field. Pick a
 * character, type a name, then enter the world. The chosen { characterId,
 * name } is passed straight to WorldScene.
 */
export class CharacterSelectScene extends Phaser.Scene {
  private selected = 0;
  private rings: Phaser.GameObjects.Rectangle[] = [];
  private nameInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super('CharacterSelect');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#15152b');
    this.rings = [];

    this.add
      .text(width / 2, height * 0.14, 'เลือกตัวละคร', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#f0f0ff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.14 + 34, 'คลิกเลือกตัว แล้วใส่ชื่อเล่น', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#9a9ac0',
      })
      .setOrigin(0.5);

    // Character cards, centered as a row.
    const n = CHARACTERS.length;
    const totalW = n * CARD_W + (n - 1) * GAP;
    const startX = width / 2 - totalW / 2 + CARD_W / 2;
    const cy = height * 0.46;

    CHARACTERS.forEach((def, i) => {
      const x = startX + i * (CARD_W + GAP);
      const ring = this.add.rectangle(x, cy, CARD_W, CARD_H, 0x24243f).setStrokeStyle(3, 0x44446a);
      this.add.image(x, cy - 34, `${def.id}-thumb`).setDisplaySize(120, 120);
      this.add
        .text(x, cy + 52, def.name, { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff' })
        .setOrigin(0.5);
      this.add
        .text(x, cy + 80, def.tribe, { fontFamily: 'sans-serif', fontSize: '14px', color: def.color })
        .setOrigin(0.5);

      ring.setInteractive({ useHandCursor: true });
      ring.on('pointerdown', () => this.select(i));
      this.rings.push(ring);
    });

    // Nickname input (HTML input via Phaser DOM element).
    this.nameInput = this.add.dom(
      width / 2,
      height * 0.74,
      'input',
      'width:260px;padding:11px 14px;font-size:16px;border-radius:10px;' +
        'border:2px solid #44446a;background:#20203a;color:#fff;outline:none;text-align:center;',
    );
    const input = this.nameInput.node as HTMLInputElement;
    input.placeholder = 'ชื่อเล่น';
    input.maxLength = CONFIG.NAME_MAX_LEN;
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.enterWorld();
    });
    this.time.delayedCall(60, () => input.focus());

    // Enter button.
    const btn = this.add
      .text(width / 2, height * 0.87, '▶ เข้าเกม', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#15152b',
        backgroundColor: '#7ee081',
        padding: { x: 26, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setBackgroundColor('#95e898'))
      .on('pointerout', () => btn.setBackgroundColor('#7ee081'))
      .on('pointerdown', () => this.enterWorld());

    this.select(0);
  }

  private select(i: number) {
    this.selected = i;
    this.rings.forEach((ring, idx) => {
      const on = idx === i;
      ring.setStrokeStyle(on ? 4 : 3, on ? 0x7ee081 : 0x44446a);
      ring.setFillStyle(on ? 0x243524 : 0x24243f, 1);
    });
  }

  private enterWorld() {
    const def = CHARACTERS[this.selected];
    const input = this.nameInput.node as HTMLInputElement;
    const name = input.value.trim().slice(0, CONFIG.NAME_MAX_LEN) || 'ผู้เล่น';
    this.scene.start('World', { characterId: def.id, name });
  }
}
