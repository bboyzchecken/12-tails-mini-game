import { uiToGame } from '../bus';
import { trackPanelOpen } from '../../net/track';
import type { PanelDef, PanelId } from './panelRegistry';

/**
 * State กลางของ panel ที่เปิดอยู่ — เปิดได้ทีละ 1 (single-open), เปิดตัวใหม่ปิด
 * ตัวเก่า, กดปุ่มเดิมซ้ำ = toggle ปิด. ทุกการเปิดยิง `panel_open` analytics
 * (รวม panel "เร็วๆ นี้" — ใช้เป็น demand signal ใน dashboard) + แจ้งโลกผ่าน bus.
 *
 * Panel เปิดผ่านตัวจัดการนี้เท่านั้น (แผน §2.2) — อย่าสร้างปุ่มลอยเปิดเอง
 */
class PanelManager {
  private current: { id: PanelId; close: () => void } | null = null;

  /** เปิด panel: `openFn` สร้าง/โชว์ตัว panel แล้วคืนฟังก์ชันบังคับปิด */
  open(def: PanelDef, openFn: () => () => void): void {
    if (this.current?.id === def.id) {
      this.closeCurrent(); // กดซ้ำ = toggle ปิด
      return;
    }
    this.closeCurrent();
    trackPanelOpen(def.id, def.status);
    const close = openFn();
    this.current = { id: def.id, close };
    uiToGame.emit('panel:open', { id: def.id });
  }

  /** Panel ปิดตัวเอง (ปุ่ม ✕ / คลิกนอก / ฯลฯ) — เคลียร์ state ถ้ายังเป็นตัวปัจจุบัน */
  notifyClosed(id: PanelId): void {
    if (this.current?.id !== id) return;
    this.current = null;
    uiToGame.emit('panel:close', { id });
  }

  /** ปิดตัวที่เปิดอยู่ (ESC / เปิดตัวใหม่) — คืน true ถ้ามีอะไรถูกปิดจริง */
  closeCurrent(): boolean {
    if (!this.current) return false;
    const { id, close } = this.current;
    this.current = null; // เคลียร์ก่อน กัน notifyClosed จาก close() วนซ้ำ
    try {
      close();
    } catch {
      /* panel อาจถูกถอดไปแล้ว — state เคลียร์แล้วพอ */
    }
    uiToGame.emit('panel:close', { id });
    return true;
  }

  isOpen(id: PanelId): boolean {
    return this.current?.id === id;
  }

  /** เรียกตอนออกจากโลก (dispose) — ปิดค้างไว้เงียบๆ */
  reset(): void {
    this.closeCurrent();
  }
}

export const panelManager = new PanelManager();
