import type { Appearance } from '@12tails/shared/events';

const SWATCH = 40;
const FACE = 40;

interface CosmeticsIndex {
  [id: string]: { colors: number; faces: number };
}

interface CustomizePanelOptions {
  characterId: string;
  initial: Appearance;
  onChange: (a: Appearance) => void;
}

/**
 * Live character customizer (DOM overlay): pick body color + face. Fires
 * onChange with the new appearance, which World3D applies to the body texture
 * and broadcasts so everyone sees it. Counts come from the cosmetics index the
 * import tool writes.
 */
export class CustomizePanel {
  private root: HTMLDivElement;
  private button: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;
  private appearance: Appearance;
  private counts = { colors: 1, faces: 1 };

  private readonly onDocPointerDown = (e: PointerEvent) => {
    if (this.open && !this.root.contains(e.target as Node)) this.close();
  };

  constructor(private opts: CustomizePanelOptions) {
    this.appearance = { ...opts.initial };

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

    void this.loadCounts();
  }

  private async loadCounts() {
    try {
      const idx: CosmeticsIndex = await (await fetch('assets/cosmetics/index.json')).json();
      const c = idx[this.opts.characterId];
      if (c) this.counts = { colors: Math.max(1, c.colors), faces: Math.max(1, c.faces) };
    } catch {
      /* keep defaults — panel still renders with 1 of each */
    }
    this.render();
  }

  private render() {
    const id = this.opts.characterId;
    this.panel.replaceChildren();

    const random = document.createElement('button');
    random.className = 'btn';
    random.textContent = '🎲 สุ่มรูปลักษณ์';
    random.style.cssText =
      'width:100%;padding:9px;margin-bottom:10px;cursor:pointer;border-radius:10px;' +
      'border:1px solid var(--panel-line,#ECD9C2);background:var(--ui-accent,#E8944A);' +
      'color:#fff;font-family:inherit;font-size:13px;';
    random.addEventListener('click', () => {
      this.set({
        color: Math.floor(Math.random() * this.counts.colors),
        face: Math.floor(Math.random() * this.counts.faces),
      });
      this.render();
    });
    this.panel.appendChild(random);

    this.panel.appendChild(
      this.grid('สี', this.counts.colors, 'color', (n) => `assets/cosmetics/${id}/color/${n}.png`,
        SWATCH, this.appearance.color, (n) => { this.set({ ...this.appearance, color: n }); this.render(); }),
    );
    this.panel.appendChild(
      this.grid('หน้า', this.counts.faces, 'face', (n) => `assets/cosmetics/${id}/face/${n}.png`,
        FACE, this.appearance.face, (n) => { this.set({ ...this.appearance, face: n }); this.render(); }, true),
    );
  }

  private grid(
    title: string, count: number, kind: string, url: (n: number) => string,
    size: number, selected: number, pick: (n: number) => void, lightBg = false,
  ): HTMLDivElement {
    const wrap = document.createElement('div');
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:11px;color:#c9a45c;margin:8px 0 5px;';
    const g = document.createElement('div');
    g.style.cssText = `display:grid;grid-template-columns:repeat(6,${size}px);gap:6px;`;
    for (let n = 0; n < count; n++) {
      const b = document.createElement('button');
      b.title = `${kind} ${n}`;
      const on = n === selected;
      b.style.cssText =
        `width:${size}px;height:${size}px;padding:0;cursor:pointer;border-radius:${kind === 'color' ? '50%' : '9px'};` +
        `border:${on ? '2.5px solid #ffd98a' : '1px solid rgba(201,164,92,0.4)'};` +
        `background:${lightBg ? '#fff' : 'transparent'} url(${url(n)}) center/cover no-repeat;`;
      b.addEventListener('click', () => pick(n));
      g.appendChild(b);
    }
    wrap.append(h, g);
    return wrap;
  }

  private set(a: Appearance) {
    this.appearance = a;
    this.opts.onChange(a);
  }

  private show() {
    this.open = true;
    this.panel.style.display = 'block';
  }

  private close() {
    this.open = false;
    this.panel.style.display = 'none';
  }

  destroy() {
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    this.root.remove();
  }
}
