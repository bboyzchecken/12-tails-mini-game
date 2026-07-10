import { gameToUI } from '../bus';
import { uiRoot } from '../UIRoot';

/* Lucide compass (ISC) — แทนวงเข็มทิศบอกแมพของเกมจริง */
const ICON_COMPASS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>';

/**
 * มุมบนซ้าย (U1): ชื่อห้อง/แมพ + จำนวนคนออนไลน์
 * ซ่อนจนกว่า room:name แรกจะมาถึง (= เข้าโลกแล้ว)
 */
export function mountLocationTitle() {
  const el = document.createElement('div');
  el.className = 'panel location-title hud-hidden';

  const icon = document.createElement('span');
  icon.className = 'loc-icon';
  icon.innerHTML = ICON_COMPASS; // static icon string — no user data

  const textCol = document.createElement('div');

  const name = document.createElement('div');
  name.className = 'loc-name';

  const online = document.createElement('div');
  online.className = 'loc-online';
  const dot = document.createElement('span');
  dot.className = 'dot';
  const count = document.createElement('span');
  count.textContent = '1 ออนไลน์';
  online.append(dot, count);

  textCol.append(name, online);
  el.append(icon, textCol);

  gameToUI.on('room:name', (r) => {
    name.textContent = r.name;
    el.classList.remove('hud-hidden');
  });
  gameToUI.on('players:count', ({ online: n }) => {
    count.textContent = `${n} ออนไลน์`;
  });

  uiRoot.mount(el);
}
