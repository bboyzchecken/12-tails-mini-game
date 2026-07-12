import { CONFIG } from '@12tails/shared/config';

const ICON = 40;   // px per icon button
const COLS = 8;

const ICON_URL = (id: string) => `assets/ui/emote-icons/${id}.png`;

/** Thai tooltips (id = original game file names). */
const LABEL: Record<string, string> = {
  sit: 'นั่ง', chat: 'คุย', dance: 'เต้น', wave: 'โบกมือ', bow: 'โค้งคำนับ',
  cheer: 'เชียร์', beg: 'อ้อนวอน', sleep: 'นอน', cry: 'ร้องไห้', laugh: 'หัวเราะ',
  pose: 'โพสท่า', battle: 'ท่าต่อสู้',
  smile: 'ยิ้ม', happy: 'ดีใจ', haha: 'ฮ่าฮ่า', heart: 'หัวใจ', blush: 'เขิน',
  exclaim: 'ตกใจ', question: 'สงสัย', sad: 'เศร้า', tear: 'น้ำตาไหล',
  angry: 'โกรธ', mad: 'โมโห', wrath: 'เดือดจัด', panic: 'แตกตื่น',
  sweat: 'เหงื่อตก', puke: 'จะอ้วก', pervert: 'ทะลึ่ง', zzz: 'ง่วง',
  rock: 'ค้อน', paper: 'กระดาษ', scissors: 'กรรไกร',
};

interface EmotePanelOptions {
  onPick: (emoteId: string) => void;
}

/**
 * Game-style emote picker: a round toggle button (same .emote-btn slot the old
 * wheel used) opening a panel of the game's framed emotion icons — actions
 * (animation clips) on top, mood bubbles below. Click = send + close.
 */
export class EmotePanel {
  private root: HTMLDivElement;
  private button: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;
  private cooldownUntil = 0;
  private cooldownTimer: number | undefined;

  private readonly onDocPointerDown = (e: PointerEvent) => {
    if (this.open && !this.root.contains(e.target as Node)) this.close();
  };
  private readonly onDocKeyDown = (e: KeyboardEvent) => {
    if (this.open && e.key === 'Escape') this.close();
  };

  constructor(private opts: EmotePanelOptions) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:11;' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;';

    this.button = document.createElement('button');
    this.button.title = 'แสดงความรู้สึก';
    this.button.className = 'emote-btn';
    this.button.style.cssText =
      'width:48px;height:48px;pointer-events:auto;cursor:pointer;border-radius:50%;' +
      'padding:0;border:2px solid rgba(201,164,92,0.9);background-color:rgba(20,18,30,0.6);' +
      `background-image:url(${ICON_URL('smile')});background-size:70%;` +
      'background-repeat:no-repeat;background-position:center;transition:opacity .15s;';
    this.button.addEventListener('click', () => (this.open ? this.close() : this.show()));

    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    this.panel.style.cssText =
      'position:absolute;display:none;pointer-events:auto;padding:10px 12px;' +
      'border-radius:12px;max-height:60vh;overflow-y:auto;';
    this.panel.append(
      this.section('ท่าทาง', [...CONFIG.EMOTE_ACTIONS]),
      this.section('อารมณ์', [...CONFIG.EMOTE_BUBBLES]),
    );

    this.root.append(this.panel, this.button);
    document.body.appendChild(this.root);
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    document.addEventListener('keydown', this.onDocKeyDown);
  }

  private section(titleText: string, ids: string[]): HTMLDivElement {
    const wrap = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = titleText;
    title.style.cssText = 'font-size:11px;color:#c9a45c;margin:6px 0 4px;';
    const grid = document.createElement('div');
    grid.style.cssText =
      `display:grid;grid-template-columns:repeat(${COLS},${ICON}px);gap:5px;`;
    for (const id of ids) {
      const btn = document.createElement('button');
      btn.title = LABEL[id] ?? id;
      btn.style.cssText =
        `width:${ICON}px;height:${ICON}px;padding:0;cursor:pointer;` +
        'border:1px solid rgba(201,164,92,0.35);border-radius:9px;' +
        `background:rgba(255,255,255,0.06) url(${ICON_URL(id)}) center/cover no-repeat;` +
        'transition:transform .08s;';
      btn.addEventListener('pointerenter', () => (btn.style.transform = 'scale(1.12)'));
      btn.addEventListener('pointerleave', () => (btn.style.transform = 'scale(1)'));
      btn.addEventListener('click', () => this.pick(id));
      grid.appendChild(btn);
    }
    wrap.append(title, grid);
    return wrap;
  }

  private show() {
    if (Date.now() < this.cooldownUntil) return;
    this.open = true;
    this.panel.style.display = 'block';
    // Open up-and-to-the-right of the button so it never covers the chat/HUD
    // in the bottom-left corner; clamp inside the viewport.
    const r = this.button.getBoundingClientRect();
    const pw = this.panel.offsetWidth;
    const ph = this.panel.offsetHeight;
    let left = r.right + 10;
    if (left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
    const top = Math.max(8, r.top - ph - 10);
    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  private close() {
    this.open = false;
    this.panel.style.display = 'none';
  }

  private pick(emoteId: string) {
    if (Date.now() < this.cooldownUntil) return;
    this.close();
    this.opts.onPick(emoteId);
    this.startCooldown();
  }

  private startCooldown() {
    this.cooldownUntil = Date.now() + CONFIG.EMOTE_COOLDOWN_MS;
    this.button.style.opacity = '0.4';
    this.button.style.cursor = 'not-allowed';
    this.cooldownTimer = window.setTimeout(() => {
      this.button.style.opacity = '1';
      this.button.style.cursor = 'pointer';
    }, CONFIG.EMOTE_COOLDOWN_MS);
  }

  destroy() {
    window.clearTimeout(this.cooldownTimer);
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    document.removeEventListener('keydown', this.onDocKeyDown);
    this.root.remove();
  }
}
