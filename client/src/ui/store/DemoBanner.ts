import { CONFIG } from '@12tails/shared/config';
import { uiRoot } from '../UIRoot';

/**
 * แบนเนอร์ DEMO ค้างบนสุดตลอด — safeguard บังคับของชั้นโมเดลรายได้
 * (12tails-demo-monetization-plan.md): ทุกอย่างเป็น mock ไม่มีจ่ายจริง
 */
export function mountDemoBanner() {
  if (!CONFIG.DEMO_STORE) return;
  const el = document.createElement('div');
  el.className = 'demo-banner';
  el.textContent = '🔴 DEMO — ตัวอย่างเพื่อการนำเสนอ ยังไม่เปิดขายจริง';
  uiRoot.mount(el);
}
