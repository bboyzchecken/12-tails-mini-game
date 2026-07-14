import { gameToUI } from '../bus';
import { PANELS, ICON_MENU, type PanelDef, type PanelId } from './panelRegistry';
import { panelManager } from './PanelManager';
import { openComingSoon } from './ComingSoonPanel';

/**
 * เมนูรวม (Panel Hub — แผน §2): ปุ่ม ☰ เดียว → grid ไอคอนจาก panelRegistry →
 * คลิกเปิด panel ผ่าน PanelManager (single-open). panel ที่ยังไม่มีระบบจริงเปิด
 * หน้า "เร็วๆ นี้" — ผู้เล่นเห็นชัดว่าอะไรกำลังมา. ESC ปิด panel ก่อน แล้วค่อยปิด grid
 */
export interface MenuHubOpts {
  /** วิธีเปิด panel ที่มีระบบจริง (คืนฟังก์ชันบังคับปิด) — ตัวที่ไม่มีใน map = "เร็วๆ นี้" */
  openers: Partial<Record<PanelId, () => () => void>>;
}

export class MenuHub {
  private btn: HTMLButtonElement;
  private grid: HTMLDivElement;
  private gridOpen = false;
  private readonly ac = new AbortController();
  private unsubBadge: () => void;

  constructor(private opts: MenuHubOpts) {
    this.btn = document.createElement('button');
    this.btn.className = 'side-btn s2 hub-btn';
    this.btn.title = 'เมนู';
    this.btn.innerHTML = ICON_MENU;
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleGrid();
    });

    this.grid = document.createElement('div');
    this.grid.className = 'panel hub-grid';
    this.grid.style.display = 'none';
    for (const def of PANELS) this.grid.appendChild(this.cell(def));

    document.body.append(this.btn, this.grid);

    // คลิกที่อื่นปิด grid (แพตเทิร์นเดียวกับ world-menu เดิม)
    window.addEventListener('pointerdown', (e) => {
      if (this.gridOpen && e.target !== this.btn && !this.grid.contains(e.target as Node)) {
        this.hideGrid();
      }
    }, { signal: this.ac.signal });

    // ESC: ปิด panel ที่เปิดอยู่ก่อน → ESC ซ้ำปิด grid (chat input stopPropagation เองแล้ว)
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (panelManager.closeCurrent()) return;
      if (this.gridOpen) this.hideGrid();
    }, { signal: this.ac.signal });

    this.unsubBadge = gameToUI.on('menu:badge', ({ id, count }) => this.setBadge(id, count));
  }

  /** เปิด panel จากที่อื่น (deep-link เช่น CustomizePanel → ร้าน) — ทางเดียวกับกดใน grid */
  open(id: PanelId) {
    const def = PANELS.find((p) => p.id === id);
    if (def) this.openPanel(def);
  }

  private cell(def: PanelDef): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'hub-cell' + (def.status === 'planned' ? ' soon' : '');
    b.dataset.id = def.id;
    b.title = def.labelTH + (def.status === 'planned' ? ' — เร็วๆ นี้' : '');

    const icon = document.createElement('span');
    icon.className = 'hub-cell-icon';
    icon.innerHTML = def.icon;
    const label = document.createElement('span');
    label.className = 'hub-cell-label';
    label.textContent = def.labelTH;
    b.append(icon, label);

    if (def.status === 'planned') {
      const chip = document.createElement('span');
      chip.className = 'hub-cell-soon';
      chip.textContent = 'เร็วๆ นี้';
      b.appendChild(chip);
    }

    b.addEventListener('click', () => this.openPanel(def));
    return b;
  }

  private openPanel(def: PanelDef) {
    this.hideGrid();
    const opener = this.opts.openers[def.id];
    // ไม่มีระบบจริง (หรือยังไม่ wire) → หน้า "เร็วๆ นี้" — ยัง track เป็น demand signal
    panelManager.open(def, opener ?? (() => openComingSoon(def)));
  }

  private setBadge(id: string, count: number) {
    const cell = this.grid.querySelector<HTMLButtonElement>(`.hub-cell[data-id="${id}"]`);
    if (!cell) return;
    let dot = cell.querySelector<HTMLSpanElement>('.hub-cell-badge');
    if (count <= 0) {
      dot?.remove();
      return;
    }
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'hub-cell-badge';
      cell.appendChild(dot);
    }
    dot.textContent = count > 9 ? '9+' : String(count);
  }

  private toggleGrid() {
    if (this.gridOpen) this.hideGrid();
    else {
      this.gridOpen = true;
      this.grid.style.display = 'grid';
      this.btn.classList.add('on');
    }
  }

  private hideGrid() {
    this.gridOpen = false;
    this.grid.style.display = 'none';
    this.btn.classList.remove('on');
  }

  destroy() {
    this.ac.abort();
    this.unsubBadge();
    panelManager.reset();
    this.btn.remove();
    this.grid.remove();
  }
}
