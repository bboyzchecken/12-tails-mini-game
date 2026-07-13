/**
 * Portrait lock for phones. 12Tails plays best in landscape — the world is a
 * wide top-down map and the HUD/chat lay out horizontally — so when a phone is
 * held in portrait we cover the whole screen with a "rotate your device" card
 * and hide it again the moment it turns landscape.
 *
 * Shown when: portrait AND a touch screen AND the short edge ≤ PHONE_MAX (keeps
 * it off tablets/desktops). `?rotate` forces it on (for testing), `?norotate`
 * disables it. This is a pure DOM overlay over every scene — no scene coupling.
 */

const PHONE_MAX = 560; // px — a phone's short edge; tablets/desktops are wider

function isTouch(): boolean {
  return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function shouldLock(): boolean {
  const q = location.search;
  if (q.includes('norotate')) return false;
  if (q.includes('rotate')) return true; // force-show for testing
  const portrait = matchMedia('(orientation: portrait)').matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return portrait && isTouch() && shortSide <= PHONE_MAX;
}

/** Mount the rotate-to-landscape overlay; it self-shows/hides on orientation. */
export function mountOrientationGate(): void {
  const el = document.createElement('div');
  el.className = 'orient-gate';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-label', 'กรุณาหมุนอุปกรณ์เป็นแนวนอน');
  el.innerHTML = `
    <div class="orient-phone" aria-hidden="true"></div>
    <h2 class="orient-title">หมุนอุปกรณ์เป็นแนวนอน</h2>
    <p class="orient-sub">12Tails เล่นได้ดีที่สุดในแนวนอน<br>กรุณาหมุนเครื่องของคุณเพื่อเริ่มเล่น</p>
  `;
  // On <body> (not #ui-root) so it sits above every panel, modal, and joystick.
  document.body.appendChild(el);

  const update = () => el.classList.toggle('show', shouldLock());
  update();
  // resize fires after the dimensions settle on rotation; orientationchange is a
  // backstop for browsers that skip resize.
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
}
