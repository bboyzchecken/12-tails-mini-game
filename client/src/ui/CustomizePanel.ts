import type { Appearance } from '@12tails/shared/events';
import type { AppearanceControl } from './appearanceControl';
import { getHeroEquipment } from './equipmentIndex';
import { getEquipThumb } from './EquipThumbs';
import { demoStore, type CosmeticType } from './store/demoState';

const SWATCH = 40;

interface CosmeticsIndex {
  [id: string]: { colors: number; faces: number };
}

interface CustomizePanelOptions {
  control: AppearanceControl;
  onOpenStore: () => void;
}

function pretty(name: string): string {
  return name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/**
 * Live equip panel (DOM overlay): swap between the colors/faces/weapons/hats
 * you OWN. Locked items show 🔒 and open the store. Equipping commits +
 * broadcasts through the appearance control so everyone sees it.
 */
export class CustomizePanel {
  private root: HTMLDivElement;
  private button: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;
  private counts = { colors: 1, faces: 1 };
  private equip: Record<'weapon' | 'hat', string[]> = { weapon: [], hat: [] };
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
    this.button.className = 'side-btn s2';
    this.button.addEventListener('click', () => (this.open ? this.close() : this.show()));

    this.panel = document.createElement('div');
    this.panel.className = 'panel side-panel';

    this.root.append(this.panel, this.button);
    document.body.appendChild(this.root);
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    this.unsub = demoStore.subscribe(() => { if (this.open) this.render(); });

    void this.loadData();
  }

  private async loadData() {
    try {
      const idx: CosmeticsIndex = await (await fetch('assets/cosmetics/index.json')).json();
      const c = idx[this.opts.control.characterId];
      if (c) this.counts = { colors: Math.max(1, c.colors), faces: Math.max(1, c.faces) };
    } catch {
      /* keep defaults */
    }
    this.equip = await getHeroEquipment(this.opts.control.characterId);
    if (this.open) this.render();
  }

  private commit(patch: Partial<Appearance>) {
    this.opts.control.commit({ ...this.opts.control.get(), ...patch } as Appearance);
    this.render();
  }

  private render() {
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

    this.panel.appendChild(this.imageGrid('สี', this.counts.colors, 'color', cur.color));
    this.panel.appendChild(this.imageGrid('หน้า', this.counts.faces, 'face', cur.face));
    this.panel.appendChild(this.equipGrid('อาวุธ', 'weapon', cur.weapon ?? null));
    this.panel.appendChild(this.equipGrid('หมวก', 'hat', cur.hat ?? null));

    const hint = document.createElement('div');
    hint.textContent = '🔒 = ต้องซื้อในร้านค้า';
    hint.style.cssText = 'font-size:11px;color:#9a8574;margin-top:8px;';
    this.panel.appendChild(hint);
  }

  // -- color / face: image swatches, all shown, locked ones open the store --

  private imageGrid(title: string, count: number, type: CosmeticType, selected: number): HTMLDivElement {
    const hero = this.opts.control.characterId;
    const wrap = this.section(title);
    const g = wrap.querySelector('.cz-grid') as HTMLDivElement;
    for (let n = 0; n < count; n++) {
      const owned = demoStore.isOwned(hero, type, n);
      const b = this.cell(n === selected);
      b.style.borderRadius = type === 'color' ? '50%' : '9px';
      // face art lives in the overlay's top-left quadrant — zoom in on it
      b.style.background = type === 'face'
        ? `#fff url(assets/cosmetics/${hero}/${type}/${n}.png) 0 0/195% no-repeat`
        : `transparent url(assets/cosmetics/${hero}/${type}/${n}.png) center/cover no-repeat`;
      if (!owned) this.lock(b);
      b.addEventListener('click', () => {
        if (owned) this.commit({ [type]: n });
        else this.opts.onOpenStore();
      });
      g.appendChild(b);
    }
    return wrap;
  }

  // -- weapon / hat: a "none" cell + owned items only (buy more in the store) --

  private equipGrid(title: string, slot: 'weapon' | 'hat', current: string | null): HTMLDivElement {
    const hero = this.opts.control.characterId;
    const wrap = this.section(title);
    const g = wrap.querySelector('.cz-grid') as HTMLDivElement;

    const none = this.cell(current == null);
    none.textContent = '∅';
    none.style.fontSize = '16px';
    none.title = 'ไม่มี';
    none.addEventListener('click', () => this.commit({ [slot]: null }));
    g.appendChild(none);

    const items = this.equip[slot];
    let ownedCount = 0;
    for (let n = 0; n < items.length; n++) {
      if (!demoStore.isOwned(hero, slot, n)) continue;
      ownedCount++;
      const name = items[n];
      const b = this.cell(current === name);
      b.textContent = pretty(name).slice(0, 3);
      b.title = pretty(name);
      b.style.fontSize = '10px';
      void getEquipThumb(hero, slot, name).then((url) => {
        if (!url || !b.isConnected) return;
        b.textContent = '';
        b.style.background = `#fff url(${url}) center/cover no-repeat`;
      });
      b.addEventListener('click', () => this.commit({ [slot]: name }));
      g.appendChild(b);
    }
    if (ownedCount === 0) {
      const buy = document.createElement('button');
      buy.textContent = '🛒 ซื้อในร้าน';
      buy.style.cssText =
        'font-size:11px;padding:0 8px;height:40px;border-radius:9px;cursor:pointer;' +
        'border:1px dashed var(--panel-line,#ECD9C2);background:transparent;color:#9a8574;';
      buy.addEventListener('click', () => this.opts.onOpenStore());
      g.appendChild(buy);
    }
    return wrap;
  }

  // ------------------------------------------------------------- primitives

  private section(title: string): HTMLDivElement {
    const wrap = document.createElement('div');
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:11px;color:#c9a45c;margin:8px 0 5px;';
    const g = document.createElement('div');
    g.className = 'cz-grid';
    g.style.cssText = `display:grid;grid-template-columns:repeat(6,${SWATCH}px);gap:6px;`;
    wrap.append(h, g);
    return wrap;
  }

  private cell(on: boolean): HTMLButtonElement {
    const b = document.createElement('button');
    b.style.cssText =
      `position:relative;width:${SWATCH}px;height:${SWATCH}px;padding:0;cursor:pointer;` +
      `border-radius:9px;color:#4a3b2e;font-family:inherit;` +
      `border:${on ? '2.5px solid #ffd98a' : '1px solid rgba(201,164,92,0.4)'};` +
      'background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;';
    return b;
  }

  private lock(b: HTMLButtonElement) {
    b.style.filter = 'grayscale(0.7) brightness(0.6)';
    const lock = document.createElement('span');
    lock.textContent = '🔒';
    lock.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;';
    b.appendChild(lock);
  }

  private randomOwned() {
    const hero = this.opts.control.characterId;
    const ownedOf = (type: CosmeticType, count: number) =>
      [...Array(count).keys()].filter((n) => demoStore.isOwned(hero, type, n));
    const colors = ownedOf('color', this.counts.colors);
    const faces = ownedOf('face', this.counts.faces);
    const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)] ?? 0;
    this.commit({ color: pick(colors), face: pick(faces) });
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
