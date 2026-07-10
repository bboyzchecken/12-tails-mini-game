import { gameToUI } from '../bus';
import { uiRoot } from '../UIRoot';

/**
 * มุมบนซ้าย (U1): ชื่อห้อง/แมพ + จำนวนคนออนไลน์
 * ซ่อนจนกว่า room:name แรกจะมาถึง (= เข้าโลกแล้ว)
 */
export function mountLocationTitle() {
  const el = document.createElement('div');
  el.className = 'panel location-title hud-hidden';

  const name = document.createElement('div');
  name.className = 'loc-name';

  const online = document.createElement('div');
  online.className = 'loc-online';
  const dot = document.createElement('span');
  dot.className = 'dot';
  const count = document.createElement('span');
  count.textContent = '1 ออนไลน์';
  online.append(dot, count);

  el.append(name, online);

  gameToUI.on('room:name', (r) => {
    name.textContent = r.name;
    el.classList.remove('hud-hidden');
  });
  gameToUI.on('players:count', ({ online: n }) => {
    count.textContent = `${n} ออนไลน์`;
  });

  uiRoot.mount(el);
}
