import { CONFIG } from '@12tails/shared/config';

const ICON = 44; // on-screen icon size, px
const RADIUS = 84; // wheel radius, px
const CENTER = { x: 132, y: 168 }; // wheel center from the bottom-left corner

interface EmoteWheelOptions {
  /** URL of the local character's faces.png (8 frames in a row). */
  facesUrl: string;
  /** Emote ids in sheet order (manifest FACE.emotes). */
  emotes: string[];
  onPick: (emoteId: string) => void;
}

/**
 * Radial emote picker, bottom-left: a round toggle button that fans out the
 * 8 action faces in a circle. Icons are CSS crops of the character's own
 * faces sheet. Picking sends the emote and starts the client-side cooldown
 * (the server enforces its own).
 */
export class EmoteWheel {
  private root: HTMLDivElement;
  private button: HTMLButtonElement;
  private wheel: HTMLDivElement;
  private open = false;
  private cooldownUntil = 0;
  private cooldownTimer: number | undefined;

  private readonly onDocPointerDown = (e: PointerEvent) => {
    if (this.open && !this.root.contains(e.target as Node)) this.close();
  };
  private readonly onDocKeyDown = (e: KeyboardEvent) => {
    if (this.open && e.key === 'Escape') this.close();
  };

  constructor(private opts: EmoteWheelOptions) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:11;' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;';

    const n = opts.emotes.length;

    this.button = document.createElement('button');
    this.button.title = 'Emote';
    this.button.style.cssText =
      `position:absolute;left:16px;bottom:16px;width:${ICON + 4}px;height:${ICON + 4}px;` +
      'pointer-events:auto;cursor:pointer;border-radius:50%;padding:0;' +
      'border:2px solid rgba(201,164,92,0.9);background-color:rgba(20,18,30,0.6);' +
      `background-image:url(${opts.facesUrl});background-repeat:no-repeat;` +
      `background-size:${n * ICON}px ${ICON}px;background-position:0 center;` +
      'transition:opacity .15s;';
    this.button.addEventListener('click', () => (this.open ? this.close() : this.show()));

    this.wheel = document.createElement('div');
    this.wheel.style.cssText = 'position:absolute;left:0;bottom:0;display:none;';

    opts.emotes.forEach((emoteId, i) => {
      const icon = document.createElement('button');
      icon.title = emoteId;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2; // start at 12 o'clock
      const x = CENTER.x + Math.cos(angle) * RADIUS - ICON / 2;
      const y = CENTER.y - Math.sin(angle) * RADIUS - ICON / 2; // CSS bottom-up
      icon.style.cssText =
        `position:absolute;left:${x}px;bottom:${y}px;width:${ICON}px;height:${ICON}px;` +
        'pointer-events:auto;cursor:pointer;border-radius:50%;padding:0;' +
        'border:1.5px solid rgba(185,185,198,0.9);background-color:rgba(255,255,255,0.95);' +
        `background-image:url(${opts.facesUrl});background-repeat:no-repeat;` +
        `background-size:${n * ICON}px ${ICON}px;background-position:${-i * ICON}px 0;` +
        'transition:transform .1s;';
      icon.addEventListener('pointerenter', () => (icon.style.transform = 'scale(1.15)'));
      icon.addEventListener('pointerleave', () => (icon.style.transform = 'scale(1)'));
      icon.addEventListener('click', () => this.pick(emoteId));
      this.wheel.appendChild(icon);
    });

    this.root.appendChild(this.wheel);
    this.root.appendChild(this.button);
    document.body.appendChild(this.root);
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    document.addEventListener('keydown', this.onDocKeyDown);
  }

  private show() {
    if (Date.now() < this.cooldownUntil) return;
    this.open = true;
    this.wheel.style.display = 'block';
  }

  private close() {
    this.open = false;
    this.wheel.style.display = 'none';
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
