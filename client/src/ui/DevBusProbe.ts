import { gameToUI, uiToGame } from './bus';
import { uiRoot } from './UIRoot';

/**
 * Dev-only test panel (U0 AC): แสดง event ฝั่ง game→UI สดๆ และมีปุ่มยิง
 * event กลับ UI→game — พิสูจน์ว่า bus วิ่งครบสองทาง ถูกแทนด้วย HUD จริงใน U1
 */
export function mountDevBusProbe() {
  const el = document.createElement('div');
  el.className = 'panel bus-probe';

  const title = document.createElement('div');
  title.className = 'probe-title';
  title.textContent = '🔧 Bus probe (dev)';

  const rows: Record<string, HTMLSpanElement> = {};
  const makeRow = (key: string, label: string) => {
    const row = document.createElement('div');
    row.className = 'probe-row';
    const k = document.createElement('span');
    k.className = 'k';
    k.textContent = label;
    const v = document.createElement('span');
    v.textContent = '—';
    row.append(k, v);
    rows[key] = v;
    return row;
  };

  const status = document.createElement('div');
  status.className = 'probe-status';

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'ทดสอบ UI → เกม (music:toggle)';
  btn.addEventListener('click', () => {
    uiToGame.emit('music:toggle', {});
    status.textContent = 'ส่งแล้ว ✓ — ดู console ฝั่งเกม';
  });

  el.append(
    title,
    makeRow('room', 'ห้อง'),
    makeRow('self', 'ตัวเรา'),
    makeRow('online', 'ออนไลน์'),
    status,
    btn,
  );

  gameToUI.on('room:name', ({ name }) => (rows.room.textContent = name));
  gameToUI.on('player:self', (p) => (rows.self.textContent = `${p.name} (${p.characterId}) Lv.${p.level}`));
  gameToUI.on('players:count', ({ online }) => (rows.online.textContent = String(online)));

  uiRoot.mount(el);
}
