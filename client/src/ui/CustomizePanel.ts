import type { Appearance } from '@12tails/shared/events';
import type { AppearanceControl } from './appearanceControl';
import { demoStore, type CosmeticType } from './store/demoState';

const SWATCH = 40;

interface CosmeticsIndex {
  [id: string]: { colors: number; faces: number };
}

interface CustomizePanelOptions {
  control: AppearanceControl;
  onOpenStore: () => void;
}

/**
 * Live equip panel (DOM overlay): swap between the body colors + faces you
 * OWN. Locked (unowned) items show 🔒 and open the store. Equipping commits +
 * broadcasts through the appearance control so everyone sees it.
 */
export class CustomizePanel {
  private root: HTMLDivElement;
  private button: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;
  private counts = { colors: 1, faces: 1 };
  private unsub: () => void;

  private readonly onDocPointerDown = (e: PointerEvent) => {
    if (this.open && !this.root.contains(e.target as Node)) this.close();
  };

  constructor(private opts: CustomizePanelOptions) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:11;' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;';

    this.button = document.createElement('button');
    this.button.title = 'แต่งตัว';
    this.button.textContent = '🎨';
    this.button.style.cssText =
      'position:fixed;top:104px;right:12px;pointer-events:auto;cursor:pointer;' +
      'width:44px;height:44px;border-radius:50%;padding:0;font-size:20px;' +
      'border:2px solid rgba(201,164,92,0.9);background:rgba(20,18,30,0.6);' +
      'display:flex;align-items:center;justify-content:center;';
    this.button.addEventListener('click', () => (this.open ? this.close() : this.show()));

    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    this.panel.style.cssText =
      'position:fixed;top:104px;right:64px;display:none;pointer-events:auto;' +
      'padding:12px 14px;border-radius:12px;max-height:70vh;overflow-y:auto;width:280px;';

    this.root.append(this.panel, this.button);
    document.body.appendChild(this.root);
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    this.unsub = demoStore.subscribe(() => { if (this.open) this.render(); });

    void this.loadCounts();
  }

  private async loadCounts() {
    try {
      const idx: CosmeticsIndex = await (await fetch('assets/cosmetics/index.json')).json();
      const c = idx[this.opts.control.characterId];
      if (c) this.counts = { colors: Math.max(1, c.colors), faces: Math.max(1, c.faces) };
    } catch {
      /* keep defaults */
    }
    if (this.open) this.render();
  }

  private render() {
    const hero = this.opts.control.characterId;
    const cur = this.opts.control.get();
    this.panel.replaceChildren();

    const random = document.createElement('button');
    random.className = 'btn';
    random.textContent = '🎲 สุ่ม (จากที่มี)';
    random.style.cssText =
      'width:100%;padding:9px;margin-bottom:10px;cursor:pointer;border-radius:10px;' +
      'border:1px solid var(--panel-line,#ECD9C2);background:var(--ui-accent-2,#6FB0A6);' +
      'color:#fff;font-family:inherit;font-size:13px;';
    random.addEventListener('click', () => this.randomOwned());
    this.panel.appendChild(random);

    this.panel.appendChild(this.grid('สี', this.counts.colors, 'color', cur.color));
    this.panel.appendChild(this.grid('หน้า', this.counts.faces, 'face', cur.face));

    const hint = document.createElement('div');
    hint.textContent = '🔒 = ต้องซื้อในร้านค้า';
    hint.style.cssText = 'font-size:11px;color:#9a8574;margin-top:8px;';
    this.panel.appendChild(hint);
  }

  private grid(title: string, count: number, type: CosmeticType, selected: number): HTMLDivElement {
    const hero = this.opts.control.characterId;
    const wrap = document.createElement('div');
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:11px;color:#c9a45c;margin:8px 0 5px;';
    const g = document.createElement('div');
    g.style.cssText = `display:grid;grid-template-columns:repeat(6,${SWATCH}px);gap:6px;`;
    for (let n = 0; n < count; n++) {
      const owned = demoStore.isOwned(hero, type, n);
      const on = n === selected;
      const b = document.createElement('button');
      b.title = owned ? `${type} ${n}` : 'ล็อก — ซื้อในร้านค้า';
      b.style.cssText =
        `position:relative;width:${SWATCH}px;height:${SWATCH}px;padding:0;cursor:pointer;` +
        `border-radius:${type === 'color' ? '50%' : '9px'};` +
        `border:${on ? '2.5px solid #ffd98a' : '1px solid rgba(201,164,92,0.4)'};` +
        `background:${type === 'face' ? '#fff' : 'transparent'} ` +
        `url(assets/cosmetics/${hero}/${type}/${n}.png) center/cover no-repeat;` +
        (owned ? '' : 'filter:grayscale(0.7) brightness(0.6);');
      if (!owned) {
        const lock = document.createElement('span');
        lock.textContent = '🔒';
        lock.style.cssText =
          'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;';
        b.appendChild(lock);
      }
      b.addEventListener('click', () => {
        if (owned) this.opts.control.commit({ ...this.opts.control.get(), [type]: n });
        else this.opts.onOpenStore();
        this.render();
      });
      g.appendChild(b);
    }
    wrap.append(h, g);
    return wrap;
  }

  private randomOwned() {
    const hero = this.opts.control.characterId;
    const ownedOf = (type: CosmeticType, count: number) =>
      [...Array(count).keys()].filter((n) => demoStore.isOwned(hero, type, n));
    const colors = ownedOf('color', this.counts.colors);
    const faces = ownedOf('face', this.counts.faces);
    const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)] ?? 0;
    const a: Appearance = { color: pick(colors), face: pick(faces) };
    this.opts.control.commit(a);
    this.render();
  }

  private show() {
    this.open = true;
    this.render();
    this.panel.style.display = 'block';
  }

  private close() {
    this.open = false;
    this.panel.style.display = 'none';
  }

  destroy() {
    this.unsub();
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    this.root.remove();
  }
}
