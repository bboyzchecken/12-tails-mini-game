import type { PanelDef } from './panelRegistry';
import { panelManager } from './PanelManager';
import { createPanelShell } from './PanelShell';

/**
 * หน้า "เร็วๆ นี้" สำหรับ panel ที่ roadmap มีแต่ระบบยังไม่เสร็จ — ผู้เล่นเห็นชัดว่า
 * ฟีเจอร์กำลังมา และการกดเปิดถูกนับเป็น demand signal (`panel_open` ยิงจาก
 * PanelManager แล้ว) เข้า dashboard
 */
export function openComingSoon(def: PanelDef): () => void {
  const shell = createPanelShell({
    title: def.labelTH,
    icon: def.icon,
    onSelfClose: () => panelManager.notifyClosed(def.id),
  });

  const wrap = document.createElement('div');
  wrap.className = 'hub-soon-body';

  const big = document.createElement('div');
  big.className = 'hub-soon-icon';
  big.innerHTML = def.icon;

  const chip = document.createElement('span');
  chip.className = 'hub-soon-chip';
  chip.textContent = 'เร็วๆ นี้';

  const desc = document.createElement('p');
  desc.className = 'hub-soon-desc';
  desc.textContent = def.comingSoonTH ?? 'ฟีเจอร์นี้กำลังพัฒนา';

  const note = document.createElement('p');
  note.className = 'hub-soon-note';
  note.textContent = 'ระบบนี้อยู่ระหว่างพัฒนา — ความสนใจของคุณถูกบันทึกไว้ช่วยจัดลำดับการพัฒนา ขอบคุณ!';

  wrap.append(big, chip, desc, note);
  shell.body.appendChild(wrap);
  return shell.close;
}
