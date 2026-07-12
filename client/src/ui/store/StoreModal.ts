import type { Appearance } from '@12tails/shared/events';
import type { AppearanceControl } from '../appearanceControl';
import { getHeroEquipment } from '../equipmentIndex';
import {
  demoStore, priceOf, rarityOf, type CosmeticType, type Rarity,
} from './demoState';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9a8574',
  rare: '#4f8fd6',
  epic: '#a763c8',
};
const TABS: { key: CosmeticType; label: string }[] = [
  { key: 'color', label: 'สี' },
  { key: 'face', label: 'หน้า' },
  { key: 'weapon', label: 'อาวุธ' },
  { key: 'hat', label: 'หมวก' },
];
const NONE = -1; // "no item" selection for equipment slots

function isEquip(t: CosmeticType): t is 'weapon' | 'hat' {
  return t === 'weapon' || t === 'hat';
}

/** camelCase glb name -> readable label. */
function pretty(name: string): string {
  return name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/**
 * DEMO cosmetic shop: buy body colors / faces / weapons / hats with mock Jil,
 * preview them live on your character before buying, reset anytime. Every
 * buy/top-up is labelled "(demo)" — no real money.
 */
export class StoreModal {
  private root: HTMLDivElement;
  private grid!: HTMLDivElement;
  private action!: HTMLDivElement;
  private jilLabel!: HTMLSpanElement;
  private tab: CosmeticType = 'color';
  private cosmeticCounts: Record<'color' | 'face', number> = { color: 1, face: 1 };
  private equip: Record<'weapon' | 'hat', string[]> = { weapon: [], hat: [] };
  private selected = 0;
  private equipped: Appearance;
  private unsub: () => void;

  constructor(private control: AppearanceControl) {
    this.equipped = { ...control.get() };
    this.selected = this.equipped.color;

    this.root = document.createElement('div');
    this.root.className = 'store-modal';
    this.root.innerHTML = LAYOUT;
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close();
    });
    document.body.appendChild(this.root);

    this.grid = this.root.querySelector('.store-grid') as HTMLDivElement;
    this.action = this.root.querySelector('.store-action') as HTMLDivElement;
    this.jilLabel = this.root.querySelector('.store-jil-val') as HTMLSpanElement;

    (this.root.querySelector('.store-close') as HTMLButtonElement)
      .addEventListener('click', () => this.close());
    (this.root.querySelector('.store-topup') as HTMLButtonElement)
      .addEventListener('click', () => demoStore.topUp(500));
    (this.root.querySelector('.store-reset') as HTMLButtonElement)
      .addEventListener('click', () => {
        demoStore.reset();
        this.equipped = { color: 0, face: 0, weapon: null, hat: null };
        this.control.commit(this.equipped);
        this.selected = this.equippedIndex();
        this.render();
      });

    const tabRow = this.root.querySelector('.store-tabs') as HTMLDivElement;
    for (const t of TABS) {
      const b = document.createElement('button');
      b.className = 'store-tab';
      b.textContent = t.label;
      b.dataset.key = t.key;
      b.addEventListener('click', () => {
        this.tab = t.key;
        this.selected = this.equippedIndex();
        this.render();
      });
      tabRow.appendChild(b);
    }

    this.unsub = demoStore.subscribe(() => this.render());
    void this.init();
  }

  private async init() {
    try {
      const idx = await (await fetch('assets/cosmetics/index.json')).json();
      const c = idx[this.control.characterId];
      if (c) this.cosmeticCounts = { color: Math.max(1, c.colors), face: Math.max(1, c.faces) };
    } catch {
      /* keep defaults */
    }
    this.equip = await getHeroEquipment(this.control.characterId);
    this.render();
  }

  private count(): number {
    return isEquip(this.tab) ? this.equip[this.tab].length : this.cosmeticCounts[this.tab];
  }

  /** Appearance value this tab's index maps to (number for color/face, name|null for equipment). */
  private valueAt(index: number): number | string | null {
    if (!isEquip(this.tab)) return index;
    return index < 0 ? null : this.equip[this.tab][index];
  }

  /** Which grid index is currently equipped for this tab (NONE for an empty slot). */
  private equippedIndex(): number {
    if (!isEquip(this.tab)) return this.equipped[this.tab];
    const cur = this.equipped[this.tab];
    return cur ? this.equip[this.tab].indexOf(cur) : NONE;
  }

  private candidate(): Appearance {
    return { ...this.equipped, [this.tab]: this.valueAt(this.selected) } as Appearance;
  }

  private render() {
    this.jilLabel.textContent = demoStore.getJil().toLocaleString('th-TH');
    (this.root.querySelectorAll('.store-tab') as NodeListOf<HTMLElement>).forEach((el) =>
      el.classList.toggle('on', el.dataset.key === this.tab));

    const hero = this.control.characterId;
    const tab = this.tab;
    this.grid.replaceChildren();

    // Equipment slots get a "none / unequip" cell first.
    if (isEquip(tab)) this.grid.appendChild(this.noneCell());

    for (let n = 0; n < this.count(); n++) {
      const owned = demoStore.isOwned(hero, tab, n);
      const equipped = this.equippedIndex() === n;
      const rarity = rarityOf(tab, n);

      const cell = document.createElement('button');
      cell.className =
        'store-cell' + (tab === 'face' ? ' face' : '') +
        (isEquip(tab) ? ' label' : '') + (this.selected === n ? ' sel' : '');
      cell.style.borderColor = this.selected === n ? '#ffd98a' : RARITY_COLOR[rarity];
      if (isEquip(tab)) {
        cell.textContent = pretty(this.equip[tab][n]);
      } else {
        cell.style.backgroundImage = `url(assets/cosmetics/${hero}/${tab}/${n}.png)`;
      }
      const badge = document.createElement('span');
      badge.className = 'store-badge';
      badge.textContent = equipped ? '✓' : owned ? '●' : `${priceOf(this.tab, n)}`;
      badge.style.background = equipped ? '#5aa563' : owned ? '#6c6c86' : RARITY_COLOR[rarity];
      cell.appendChild(badge);
      cell.addEventListener('click', () => {
        this.selected = n;
        this.control.preview(this.candidate());
        this.render();
      });
      this.grid.appendChild(cell);
    }

    this.renderAction();
  }

  private noneCell(): HTMLButtonElement {
    const cell = document.createElement('button');
    cell.className = 'store-cell label none' + (this.selected === NONE ? ' sel' : '');
    cell.textContent = 'ไม่มี';
    cell.style.borderColor = this.selected === NONE ? '#ffd98a' : 'var(--panel-line)';
    if (this.equippedIndex() === NONE) {
      const badge = document.createElement('span');
      badge.className = 'store-badge';
      badge.textContent = '✓';
      badge.style.background = '#5aa563';
      cell.appendChild(badge);
    }
    cell.addEventListener('click', () => {
      this.selected = NONE;
      this.control.preview(this.candidate());
      this.render();
    });
    return cell;
  }

  private renderAction() {
    const hero = this.control.characterId;
    const n = this.selected;
    this.action.replaceChildren();

    // "none" for an equipment slot is always free to equip (unequip).
    if (isEquip(this.tab) && n === NONE) {
      const btn = this.actionButton(this.equippedIndex() === NONE ? 'ถอดอยู่' : 'ถอดออก',
        this.equippedIndex() === NONE, () => this.equip_());
      this.action.append(this.actionInfo('ไม่ถือ/ไม่สวม'), btn);
      return;
    }

    const owned = demoStore.isOwned(hero, this.tab, n);
    const equipped = this.equippedIndex() === n;
    const price = priceOf(this.tab, n);
    const rarity = rarityOf(this.tab, n);
    const label = isEquip(this.tab)
      ? pretty(this.equip[this.tab][n])
      : `${TABS.find((t) => t.key === this.tab)!.label} #${n}`;

    let btn: HTMLButtonElement;
    if (equipped) btn = this.actionButton('ใส่อยู่', true, () => {});
    else if (owned) btn = this.actionButton('ใส่', false, () => this.equip_());
    else if (demoStore.canAfford(this.tab, n)) {
      btn = this.actionButton(`แลก ${price.toLocaleString('th-TH')} 💎 (demo)`, false, () => {
        if (demoStore.buy(hero, this.tab, n)) this.equip_();
      });
    } else {
      btn = this.actionButton(`Jil ไม่พอ (${price.toLocaleString('th-TH')})`, true, () => {});
    }

    const info = document.createElement('div');
    info.className = 'store-info';
    info.innerHTML =
      `<span class="store-rar" style="color:${RARITY_COLOR[rarity]}">${rarity}</span>` +
      `<span>${label}</span>`;
    this.action.append(info, btn);
  }

  private actionInfo(text: string): HTMLDivElement {
    const info = document.createElement('div');
    info.className = 'store-info';
    info.innerHTML = `<span>${text}</span>`;
    return info;
  }

  private actionButton(text: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'btn store-buy';
    btn.textContent = text;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener('click', onClick);
    return btn;
  }

  private equip_() {
    this.equipped = this.candidate();
    this.control.commit(this.equipped);
    this.render();
  }

  private close() {
    this.control.preview(this.equipped); // drop any unbought preview
    this.destroy();
  }

  destroy() {
    this.unsub();
    this.root.remove();
  }
}

const LAYOUT = `
  <div class="store-panel panel">
    <div class="store-head">
      <div class="store-title">ร้านค้า <span class="store-demo">DEMO</span></div>
      <div class="store-wallet">
        💎 <span class="store-jil-val">0</span> Jil
        <button class="store-topup">+ เติม 500 (demo)</button>
      </div>
      <button class="store-close" title="ปิด">✕</button>
    </div>
    <div class="store-note">ตัวอย่างเท่านั้น — Jil ไม่ใช่เงินจริง ซื้อ = ปลดล็อกพรีวิวในเครื่อง</div>
    <div class="store-tabs"></div>
    <div class="store-grid"></div>
    <div class="store-foot">
      <button class="store-reset">รีเซ็ต (demo)</button>
      <div class="store-action"></div>
    </div>
  </div>
`;
