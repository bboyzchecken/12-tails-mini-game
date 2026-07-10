import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import { connectSocket } from './net/socket';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.add.text(16, 16, '12Tails Chat — Phase 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#e0e0ff',
    });
    this.add.text(16, 44, 'empty canvas · connecting to server…', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8a8ab0',
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
});

connectSocket();

console.log('[client] boot · TILE =', CONFIG.TILE);
