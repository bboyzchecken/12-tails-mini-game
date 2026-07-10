import './ui.css';

/**
 * DOM overlay ทับ Phaser canvas — บ้านของ UI ทุกชิ้น (HUD, panel, modal)
 * root โปร่งต่อ pointer; คอมโพเนนต์ที่รับคลิกเปิด pointer-events ผ่าน CSS เอง
 */
class UIRootImpl {
  readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'ui-root';
    document.body.appendChild(this.el);
  }

  mount<T extends HTMLElement>(child: T): T {
    this.el.appendChild(child);
    return child;
  }
}

export const uiRoot = new UIRootImpl();
