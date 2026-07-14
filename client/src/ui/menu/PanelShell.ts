/**
 * โครง modal ร่วมของ panel ที่เปิดจาก MenuHub (header: icon+ชื่อ+ปุ่มปิด, body ว่าง
 * ให้ผู้เรียกเติม) — backdrop คลิกปิดได้. Panel ใหม่ทุกตัว reuse อันนี้ ไม่สร้าง
 * โครง modal ซ้ำ (StoreModal/CustomizePanel ของเดิมคงโครงตัวเองไว้)
 */
export interface PanelShellOpts {
  title: string;
  icon: string; // inline SVG
  /** เรียกเมื่อ shell ปิดจากใน UI เอง (✕ / backdrop) — ใช้แจ้ง panelManager */
  onSelfClose: () => void;
}

export interface PanelShellHandle {
  body: HTMLDivElement;
  /** บังคับปิด (จาก PanelManager) — ถอด DOM โดยไม่ยิง onSelfClose ซ้ำ */
  close: () => void;
}

export function createPanelShell(opts: PanelShellOpts): PanelShellHandle {
  const root = document.createElement('div');
  root.className = 'hub-modal';

  const panel = document.createElement('div');
  panel.className = 'panel hub-modal-panel';

  const head = document.createElement('div');
  head.className = 'hub-modal-head';
  const icon = document.createElement('span');
  icon.className = 'hub-modal-icon';
  icon.innerHTML = opts.icon;
  const title = document.createElement('span');
  title.className = 'hub-modal-title';
  title.textContent = opts.title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'hub-modal-close';
  closeBtn.title = 'ปิด';
  closeBtn.textContent = '✕';
  head.append(icon, title, closeBtn);

  const body = document.createElement('div');
  body.className = 'hub-modal-body';

  panel.append(head, body);
  root.appendChild(panel);
  document.body.appendChild(root);

  const close = () => root.remove();
  const selfClose = () => {
    close();
    opts.onSelfClose();
  };
  closeBtn.addEventListener('click', selfClose);
  root.addEventListener('click', (e) => {
    if (e.target === root) selfClose();
  });

  return { body, close };
}
