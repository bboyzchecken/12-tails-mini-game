import { gameToUI } from '../bus';
import { uiRoot } from '../UIRoot';

/**
 * มุมล่างขวา (U1): คีย์พื้นฐาน — WASD เดิน, Enter แชท, คลิกดูโปรไฟล์
 * ซ่อนจนกว่าเข้าโลกแล้ว (player:self แรก)
 */
export function mountControlHints() {
  const el = document.createElement('div');
  el.className = 'panel control-hints hud-hidden';

  el.append(
    makeHint(['W', 'A', 'S', 'D'], 'เดิน'),
    makeHint(['Enter'], 'แชท'),
    makeHint(['คลิก'], 'ดูโปรไฟล์'),
  );

  gameToUI.on('player:self', () => el.classList.remove('hud-hidden'));

  uiRoot.mount(el);
}

function makeHint(keys: string[], label: string): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'hint';
  for (const k of keys) {
    const key = document.createElement('kbd');
    key.className = 'key';
    key.textContent = k;
    row.appendChild(key);
  }
  const text = document.createElement('span');
  text.textContent = label;
  row.appendChild(text);
  return row;
}
