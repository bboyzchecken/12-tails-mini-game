import type { Appearance } from '@12tails/shared/events';
import type { AppearanceControl } from '../appearanceControl';
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
];

/**
 * DEMO cosmetic shop (12tails-demo-monetization-plan.md): buy body colors /
 * faces with mock Jil, preview them live on your character before buying, and
 * reset anytime. Every buy/top-up is labelled "(demo)" — no real money.
 */
export class StoreModal {
  private root: HTMLDivElement;
  private grid!: HTMLDivElement;
  private action!: HTMLDivElement;
  private jilLabel!: HTMLSpanElement;
  private tab: CosmeticType = 'color';
  private counts: Record<CosmeticType, number> = { color: 1, face: 1 };
  private selected = 0;
  /** The player's truly-equipped look; previews revert to this on close. */
  private equipped: Appearance;
  private unsub: () => void;

  constructor(private control: AppearanceControl) {
    this.equipped = { ...control.get() };
    this.selected = this.equipped.color;

    this.root = document.createElement('div');
    this.root.className = 'store-modal';
    this.root.innerHTML = LAYOUT;
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close(); // click backdrop
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
        // revert the character to the free starter look
        this.equipped = { color: 0, face: 0 };
        this.control.commit(this.equipped);
        this.selected = 0;
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
        this.selected = this.equipped[t.key];
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
      if (c) this.counts = { color: Math.max(1, c.colors), face: Math.max(1, c.faces) };
    } catch {
      /* keep defaults */
    }
    this.render();
  }

  private candidate(): Appearance {
    return { ...this.equipped, [this.tab]: this.selected };
  }

  private render() {
    this.jilLabel.textContent = demoStore.getJil().toLocaleString('th-TH');
    (this.root.querySelectorAll('.store-tab') as NodeListOf<HTMLElement>).forEach((el) =>
      el.classList.toggle('on', el.dataset.key === this.tab));

    const hero = this.control.characterId;
    this.grid.replaceChildren();
    for (let n = 0; n < this.counts[this.tab]; n++) {
      const owned = demoStore.isOwned(hero, this.tab, n);
      const equipped = this.equipped[this.tab] === n;
      const rarity = rarityOf(this.tab, n);

      const cell = document.createElement('button');
      cell.className =
        'store-cell' + (this.tab === 'face' ? ' face' : '') + (this.selected === n ? ' sel' : '');
      cell.style.borderColor = this.selected === n ? '#ffd98a' : RARITY_COLOR[rarity];
      cell.style.backgroundImage = `url(assets/cosmetics/${hero}/${this.tab}/${n}.png)`;
      const badge = document.createElement('span');
      badge.className = 'store-badge';
      badge.textContent = equipped ? '✓' : owned ? '●' : `${priceOf(this.tab, n)}`;
      badge.style.background = equipped ? '#5aa563' : owned ? '#6c6c86' : RARITY_COLOR[rarity];
      cell.appendChild(badge);
      cell.addEventListener('click', () => {
        this.selected = n;
        this.control.preview(this.candidate()); // try before you buy
        this.render();
      });
      this.grid.appendChild(cell);
    }

    this.renderAction();
  }

  private renderAction() {
    const hero = this.control.characterId;
    const n = this.selected;
    const owned = demoStore.isOwned(hero, this.tab, n);
    const equipped = this.equipped[this.tab] === n;
    const price = priceOf(this.tab, n);
    const rarity = rarityOf(this.tab, n);

    this.action.replaceChildren();

    const info = document.createElement('div');
    info.className = 'store-info';
    info.innerHTML =
      `<span class="store-rar" style="color:${RARITY_COLOR[rarity]}">${rarity}</span>` +
      `<span>${TABS.find((t) => t.key === this.tab)!.label} #${n}</span>`;

    const btn = document.createElement('button');
    btn.className = 'btn store-buy';
    if (equipped) {
      btn.textContent = 'ใส่อยู่';
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = 'ใส่';
      btn.addEventListener('click', () => this.equip());
    } else if (demoStore.canAfford(this.tab, n)) {
      btn.textContent = `แลก ${price.toLocaleString('th-TH')} 💎 (demo)`;
      btn.addEventListener('click', () => {
        if (demoStore.buy(hero, this.tab, n)) this.equip();
      });
    } else {
      btn.textContent = `Jil ไม่พอ (${price.toLocaleString('th-TH')})`;
      btn.disabled = true;
    }

    this.action.append(info, btn);
  }

  private equip() {
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
