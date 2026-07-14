import { getCharacter } from '../../manifest';
import { gameToUI } from '../bus';
import { uiRoot } from '../UIRoot';

/* Lucide icons (ISC) — inline SVG ตาม guideline "icon เป็น SVG ไม่ใช่ emoji" */
const ICON_GEM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>';
const ICON_COINS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>' +
  '<path d="m16.71 13.88.7.71-2.82 2.82"/></svg>';

/**
 * มุมล่างซ้าย (U1 — ตำแหน่งตาม UI เกมจริง): portrait วงกลม + Lv badge,
 * ชื่อ+tag (ตัวละคร·เผ่า), XP bar มีตัวเลข, กระเป๋าเงิน Jil/เหรียญ
 * (ค่า demo — ห้ามแสดงเป็น ฿/$)
 * ซ่อนจนกว่า player:self แรกจะมาถึง (= เข้าโลกแล้ว)
 */
export function mountPlayerHUD() {
  const el = document.createElement('div');
  el.className = 'panel player-hud hud-hidden';

  const avatarWrap = document.createElement('div');
  avatarWrap.className = 'avatar-wrap';
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.alt = '';
  const lvBadge = document.createElement('span');
  lvBadge.className = 'lv-badge';
  avatarWrap.append(avatar, lvBadge);

  const col = document.createElement('div');
  col.className = 'col';

  const nameRow = document.createElement('div');
  nameRow.className = 'name-row';
  const name = document.createElement('span');
  name.className = 'p-name';
  const tag = document.createElement('span');
  tag.className = 'p-tag';
  nameRow.append(name, tag);

  const xpBar = document.createElement('div');
  xpBar.className = 'xp-bar';
  const xpFill = document.createElement('div');
  xpFill.className = 'xp-fill';
  const xpText = document.createElement('span');
  xpText.className = 'xp-text';
  xpBar.append(xpFill, xpText);

  const curRow = document.createElement('div');
  curRow.className = 'cur-row';
  const jil = makeCurrency('cur-jil', ICON_GEM, 'Jil (demo — ไม่ใช่เงินจริง)');
  const scales = makeCurrency('cur-coin', ICON_COINS, 'เกล็ด (ได้จากตกปลา · ใช้ในสายตกปลา)');
  curRow.append(jil.el, scales.el);

  col.append(nameRow, xpBar, curRow);
  el.append(avatarWrap, col);

  gameToUI.on('player:self', (p) => {
    const def = getCharacter(p.characterId);
    if (def) avatar.src = def.thumb;
    name.textContent = p.name;
    tag.textContent = def ? `${def.name}·${def.tribe}` : p.characterId;
    lvBadge.textContent = `Lv.${p.level}`;
    xpBar.title = `XP ${p.xp}/${p.xpMax}`;
    xpText.textContent = `${p.xp}/${p.xpMax}`;
    xpFill.style.width = `${Math.max(0, Math.min(100, (p.xp / p.xpMax) * 100))}%`;
    el.classList.remove('hud-hidden');
  });

  gameToUI.on('player:currency', (c) => {
    jil.value.textContent = c.jil.toLocaleString('th-TH');
    scales.value.textContent = c.scales.toLocaleString('th-TH');
  });

  uiRoot.mount(el);
}

function makeCurrency(cls: string, iconSvg: string, label: string) {
  const el = document.createElement('span');
  el.className = `cur ${cls}`;
  el.title = label;
  el.innerHTML = iconSvg; // static icon string — no user data
  const value = document.createElement('span');
  value.textContent = '0';
  el.appendChild(value);
  return { el, value };
}
