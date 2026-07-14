import { PANELS } from './panelRegistry';
import { panelManager } from './PanelManager';
import { createPanelShell } from './PanelShell';

/**
 * โปรไฟล์ (stub ขั้น PA0): ชื่อในเกม + สถานะบัญชี + ปุ่มเปลี่ยนตัวละคร/เข้า-ออกระบบ
 * (ย้ายมาจาก ⚙️ world menu เดิม). ขั้น PA1 จะเติมของจริง: family name, character
 * slots, การเชื่อม LINE/Google/Apple, ประวัติเติมเงิน (demo) — แผน §5.5
 */
export interface ProfilePanelOpts {
  name: string;
  isGuest: boolean;
  onChangeCharacter: () => void;
  /** guest = ไปหน้า login/สมัคร · มีบัญชี = ออกจากระบบ */
  onAuthAction: () => void;
}

export function openProfilePanel(opts: ProfilePanelOpts): () => void {
  const def = PANELS.find((p) => p.id === 'profile')!;
  const shell = createPanelShell({
    title: def.labelTH,
    icon: def.icon,
    onSelfClose: () => panelManager.notifyClosed('profile'),
  });

  const info = document.createElement('div');
  info.className = 'hub-profile-info';
  const row = (label: string, value: string) => {
    const r = document.createElement('div');
    r.className = 'hub-profile-row';
    const l = document.createElement('span');
    l.className = 'hub-profile-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.textContent = value;
    r.append(l, v);
    return r;
  };
  info.append(
    row('ชื่อในเกม', opts.name),
    row('สถานะ', opts.isGuest ? 'เล่นแบบ guest (ไม่บันทึก)' : 'เข้าสู่ระบบแล้ว'),
  );

  // ตัวอย่างของที่กำลังมาใน PA1 (§5) — โชว์ให้รู้ว่าระบบเชื่อมบัญชีกำลังพัฒนา
  const linkRow = document.createElement('div');
  linkRow.className = 'hub-profile-row hub-profile-soon';
  const linkLabel = document.createElement('span');
  linkLabel.className = 'hub-profile-label';
  linkLabel.textContent = 'เชื่อมบัญชี LINE';
  const linkChip = document.createElement('span');
  linkChip.className = 'hub-soon-chip';
  linkChip.textContent = 'เร็วๆ นี้';
  linkRow.append(linkLabel, linkChip);
  info.appendChild(linkRow);

  const actions = document.createElement('div');
  actions.className = 'hub-profile-actions';
  const mkItem = (label: string, onClick: () => void, danger = false) => {
    const b = document.createElement('button');
    b.className = 'world-menu-item' + (danger ? ' danger' : '');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };
  actions.append(
    mkItem('🔄 เปลี่ยนตัวละคร', opts.onChangeCharacter),
    opts.isGuest
      ? mkItem('🔑 เข้าสู่ระบบ / สมัคร', opts.onAuthAction)
      : mkItem('🚪 ออกจากระบบ', opts.onAuthAction, true),
  );

  shell.body.append(info, actions);
  return shell.close;
}
