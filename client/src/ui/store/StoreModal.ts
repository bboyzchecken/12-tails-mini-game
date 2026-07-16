import type { Appearance } from '@12tails/shared/events';
import type { AppearanceControl } from '../appearanceControl';
import { getHeroEquipment, getHeroCostumes } from '../equipmentIndex';
import { getEquipThumb } from '../EquipThumbs';
import { trackShopOpen } from '../../net/track';
import { getActiveStore, type ActiveCollection } from '../../net/storeApi';
import {
  demoStore, priceOf, rarityOf, type CosmeticType, type Rarity,
} from './demoState';
import {
  BATTLEPASS, COLLECTION, GACHA, SUPPORTER_TIERS, RARITY_LABEL,
  collectionBundlePrice, type Reward,
} from './monetizationData';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9a8574',
  rare: '#4f8fd6',
  epic: '#a763c8',
};
const TABS: { key: CosmeticType; label: string }[] = [
  { key: 'color', label: 'สี' },
  { key: 'face', label: 'หน้า' },
  { key: 'outfit', label: 'ชุด' },
  { key: 'weapon', label: 'อาวุธ' },
  { key: 'hat', label: 'หมวก' },
];

/** DEMO monetization surfaces (U5) — rendered as their own StoreModal tabs. */
type SpecialTab = 'season' | 'collection' | 'battlepass' | 'supporter' | 'gacha';
const SPECIAL_TABS: { key: SpecialTab; label: string }[] = [
  { key: 'season', label: 'ซีซัน 🔥' },
  { key: 'collection', label: 'คอลเลกชัน' },
  { key: 'battlepass', label: 'แบทเทิลพาส' },
  { key: 'supporter', label: 'ซัพพอร์ต' },
  { key: 'gacha', label: 'กาชา' },
];
const NONE = -1; // "no item" selection for name-based slots (weapon/hat/outfit)

/** Name-based slots (id string + a "none" cell), vs the index-based color/face. */
function isEquip(t: CosmeticType): t is 'weapon' | 'hat' | 'outfit' {
  return t === 'weapon' || t === 'hat' || t === 'outfit';
}

/** camelCase glb name -> readable label. */
function pretty(name: string): string {
  return name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/** Tiny DOM helpers for the monetization tabs (kept local — no framework). */
function el(tag: string, cls: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}
function txt(tag: string, cls: string, text: string): HTMLElement {
  const e = el(tag, cls);
  e.textContent = text;
  return e;
}

/** Human countdown for the season FOMO chip (Thai). */
function fmtCountdown(ms: number): string {
  if (ms <= 0) return 'หมดเวลาแล้ว';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `เหลือ ${d} วัน ${h} ชม.`;
  if (h > 0) return `เหลือ ${h} ชม. ${m} นาที`;
  return `เหลือ ${m} นาที`;
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
  private equip: Record<'weapon' | 'hat' | 'outfit', string[]> = { weapon: [], hat: [], outfit: [] };
  private selected = 0;
  private equipped: Appearance;
  private unsub: () => void;
  // Special (monetization) tabs (U5) — null = a cosmetic tab is active.
  private special: SpecialTab | null = null;
  // Season tab (Phase 5 / S4): scheduled items read from GET /store/active.
  private seasons: ActiveCollection[] = [];
  private serverOffset = 0; // serverTime − clientTime, for accurate countdowns
  private seasonLoaded = false;
  private countdownTimer = 0;
  // Gacha (U5 / D4): last pull result, kept for the reveal animation.
  private gachaResult: { reward: Reward; rarity: Rarity; guaranteed: boolean } | null = null;

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
        this.equipped = { color: 0, face: 0, weapon: null, hat: null, outfit: null };
        this.control.commit(this.equipped);
        this.selected = this.equippedIndex();
        this.gachaResult = null;
        this.render();
      });

    const tabRow = this.root.querySelector('.store-tabs') as HTMLDivElement;
    // Cosmetic tabs first (preview-and-buy), then the monetization surfaces (U5).
    for (const t of TABS) {
      const b = document.createElement('button');
      b.className = 'store-tab';
      b.textContent = t.label;
      b.dataset.key = t.key;
      b.addEventListener('click', () => {
        this.special = null;
        this.tab = t.key;
        this.selected = this.equippedIndex();
        this.render();
      });
      tabRow.appendChild(b);
    }
    const divider = document.createElement('span');
    divider.className = 'store-tab-div';
    tabRow.appendChild(divider);
    for (const s of SPECIAL_TABS) {
      const b = document.createElement('button');
      b.className = 'store-tab special-tab' + (s.key === 'season' ? ' season-tab' : '');
      b.textContent = s.label;
      b.dataset.key = s.key;
      b.addEventListener('click', () => {
        if (this.special !== s.key) trackShopOpen(s.key);
        this.special = s.key;
        this.render();
      });
      tabRow.appendChild(b);
    }

    this.unsub = demoStore.subscribe(() => this.render());
    // Keep the season countdown ticking while that tab is open.
    this.countdownTimer = window.setInterval(() => {
      if (this.special === 'season') this.render();
    }, 30_000);
    trackShopOpen(this.tab); // constructed only on open (World3D guards double-open)
    void this.init();
  }

  private async init() {
    void this.loadSeasons();
    try {
      const idx = await (await fetch('assets/cosmetics/index.json')).json();
      const c = idx[this.control.characterId];
      if (c) this.cosmeticCounts = { color: Math.max(1, c.colors), face: Math.max(1, c.faces) };
    } catch {
      /* keep defaults */
    }
    const eq = await getHeroEquipment(this.control.characterId);
    this.equip = { ...eq, outfit: await getHeroCostumes(this.control.characterId) };
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
      el.classList.toggle('on', this.special ? el.dataset.key === this.special : el.dataset.key === this.tab));
    this.grid.className = 'store-grid'; // reset modifiers; each view re-adds its own

    switch (this.special) {
      case 'season': return this.renderSeason();
      case 'collection': return this.renderCollection();
      case 'battlepass': return this.renderBattlePass();
      case 'supporter': return this.renderSupporter();
      case 'gacha': return this.renderGacha();
      default: break; // cosmetic tab
    }

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
        const name = this.equip[tab][n];
        cell.title = pretty(name);
        const label = document.createElement('span');
        label.className = 'store-cell-label';
        label.textContent = pretty(name); // fallback until the 3D thumb lands
        cell.appendChild(label);
        // Weapons/hats have rendered 3D thumbs; costumes (whole-body meshes)
        // just show their name for now.
        if (tab === 'weapon' || tab === 'hat') {
          void getEquipThumb(hero, tab, name).then((url) => {
            if (!url || !cell.isConnected) return;
            label.remove();
            cell.classList.add('thumb');
            cell.style.backgroundImage = `url(${url})`;
          });
        }
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

  /** Fetch the currently-live seasons from the API (Phase 5 / S4). */
  private async loadSeasons() {
    try {
      const store = await getActiveStore();
      this.seasons = store.collections;
      this.serverOffset = store.serverOffsetMs;
    } catch {
      this.seasons = []; // API down/offline — season tab just shows "nothing on sale"
    }
    this.seasonLoaded = true;
    if (this.special === 'season') this.render();
  }

  /** Season tab: live collections + countdown; buying fires buy_intent per season. */
  private renderSeason() {
    this.grid.classList.add('season');
    this.grid.replaceChildren();
    this.action.replaceChildren();

    if (!this.seasonLoaded) {
      this.grid.appendChild(this.seasonMessage('กำลังโหลดของซีซัน…'));
      return;
    }
    if (this.seasons.length === 0) {
      this.grid.appendChild(this.seasonMessage('ยังไม่มีของขายในตอนนี้ — รอซีซันหน้า!'));
      return;
    }

    const serverNow = Date.now() + this.serverOffset;
    for (const col of this.seasons) {
      const block = document.createElement('div');
      block.className = 'season-block';

      const head = document.createElement('div');
      head.className = 'season-col-head';
      const name = document.createElement('span');
      name.className = 'season-col-name';
      name.textContent = col.name;
      head.appendChild(name);
      if (col.ends_at) {
        const cd = document.createElement('span');
        cd.className = 'season-count';
        cd.textContent = '⏳ ' + fmtCountdown(new Date(col.ends_at).getTime() - serverNow);
        head.appendChild(cd);
      }
      block.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'season-items';
      for (const it of col.items) {
        const owned = demoStore.isSeasonOwned(it.id);
        const afford = demoStore.getJil() >= it.price_jil;
        const rarity = (['common', 'rare', 'epic'].includes(it.rarity) ? it.rarity : 'common') as Rarity;

        const cell = document.createElement('button');
        cell.className = 'season-item' + (owned ? ' owned' : '');
        cell.style.borderColor = owned ? '#5aa563' : RARITY_COLOR[rarity];

        const nm = document.createElement('div');
        nm.className = 'si-name';
        nm.textContent = it.name;
        const meta = document.createElement('div');
        meta.className = 'si-meta';
        meta.textContent = owned
          ? '✓ ปลดล็อกแล้ว'
          : afford
            ? `💎 ${it.price_jil.toLocaleString('th-TH')} (demo)`
            : `Jil ไม่พอ (${it.price_jil.toLocaleString('th-TH')})`;
        cell.append(nm, meta);

        if (owned || !afford) {
          cell.disabled = true;
        } else {
          cell.addEventListener('click', () => {
            demoStore.buySeasonItem(
              { id: it.id, type: it.type, priceJil: it.price_jil, rarity: it.rarity },
              { id: col.id, theme: col.theme },
            );
            // demoStore.changed() → subscribe → render() re-runs with owned state
          });
        }
        grid.appendChild(cell);
      }
      block.appendChild(grid);
      this.grid.appendChild(block);
    }

    const hint = document.createElement('div');
    hint.className = 'store-info';
    hint.innerHTML = '<span>ของตามฤดูกาล — หมดเวลาแล้วหาย</span>';
    this.action.appendChild(hint);
  }

  private seasonMessage(text: string): HTMLDivElement {
    const box = document.createElement('div');
    box.className = 'season-empty';
    box.textContent = text;
    return box;
  }

  // ─────────────────────────────────────── U5: Collection (D3, direct sale) ──
  private renderCollection() {
    this.grid.className = 'store-grid stack';
    this.grid.replaceChildren();
    this.action.replaceChildren();

    const head = el('div', 'mon-head');
    head.append(
      txt('div', 'mon-title', COLLECTION.name),
      txt('div', 'mon-sub', 'ขายตรง เห็นของก่อนจ่าย — ซื้อทีละชิ้นหรือยกเซ็ต'),
    );
    this.grid.appendChild(head);

    const cards = el('div', 'col-grid');
    for (const it of COLLECTION.items) {
      const owned = demoStore.isCollectionOwned(it.id);
      const afford = demoStore.getJil() >= it.priceJil;
      const card = el('div', 'col-card' + (owned ? ' owned' : ''));
      card.style.borderColor = owned ? '#5aa563' : RARITY_COLOR[it.rarity];
      const rar = txt('span', 'col-rar', RARITY_LABEL[it.rarity]);
      rar.style.color = RARITY_COLOR[it.rarity];
      card.append(txt('div', 'col-name', it.name), rar);
      const btn = document.createElement('button');
      btn.className = 'col-buy';
      if (owned) {
        btn.textContent = '✓ มีแล้ว';
        btn.disabled = true;
      } else if (afford) {
        btn.textContent = `แลก ${it.priceJil.toLocaleString('th-TH')} 💎 (demo)`;
        btn.addEventListener('click', () => demoStore.buyCollectionItem(it));
      } else {
        btn.textContent = `Jil ไม่พอ (${it.priceJil.toLocaleString('th-TH')})`;
        btn.disabled = true;
      }
      card.appendChild(btn);
      cards.appendChild(card);
    }
    this.grid.appendChild(cards);

    // Footer: whole-set bundle (direct, discounted).
    const bundle = collectionBundlePrice();
    const sum = COLLECTION.items.reduce((t, i) => t + i.priceJil, 0);
    const allOwned = COLLECTION.items.every((i) => demoStore.isCollectionOwned(i.id));
    const info = el('div', 'store-info');
    info.innerHTML = `<span>ยกเซ็ตประหยัด ${(sum - bundle).toLocaleString('th-TH')} 💎</span>`;
    const setBtn = document.createElement('button');
    setBtn.className = 'btn store-buy';
    if (allOwned) {
      setBtn.textContent = 'ครบเซ็ตแล้ว';
      setBtn.disabled = true;
    } else if (demoStore.getJil() >= bundle) {
      setBtn.textContent = `ซื้อยกเซ็ต ${bundle.toLocaleString('th-TH')} 💎 (demo)`;
      setBtn.addEventListener('click', () => demoStore.buyCollectionBundle());
    } else {
      setBtn.textContent = `Jil ไม่พอ (${bundle.toLocaleString('th-TH')})`;
      setBtn.disabled = true;
    }
    this.action.append(info, setBtn);
  }

  // ───────────────────────────────── U5: Battle Pass (D2, free/premium track) ──
  private renderBattlePass() {
    this.grid.className = 'store-grid stack';
    this.grid.replaceChildren();
    this.action.replaceChildren();

    const premium = demoStore.isBpPremium();
    const level = demoStore.getBpLevel();

    const head = el('div', 'mon-head');
    head.append(
      txt('div', 'mon-title', `แบทเทิลพาส · ${BATTLEPASS.season}`),
      txt('div', 'mon-sub', premium
        ? '✓ ปลดล็อก Premium แล้ว — กดรับของแต่ละเลเวลได้เลย'
        : 'ปลดล็อกแทร็ก Premium เพื่อรับของพิเศษทุกเลเวล'),
    );
    this.grid.appendChild(head);

    // Presenter-driven progress slider (simulate climbing tiers, no cost).
    const prog = el('div', 'bp-prog');
    const progLabel = txt('div', 'bp-prog-label', `ความคืบหน้า: เลเวล ${level}/${BATTLEPASS.maxLevel}`);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(BATTLEPASS.maxLevel);
    slider.value = String(level);
    slider.className = 'bp-slider';
    // Live label while dragging; commit (→ re-render tiers) only on release, so the
    // slider element isn't recreated mid-drag.
    slider.addEventListener('input', () => {
      progLabel.textContent = `ความคืบหน้า: เลเวล ${slider.value}/${BATTLEPASS.maxLevel}`;
    });
    slider.addEventListener('change', () => demoStore.setBpLevel(Number(slider.value)));
    prog.append(progLabel, slider, txt('div', 'bp-prog-hint', 'ลากเพื่อจำลองการเล่นสะสมเลเวล (demo)'));
    this.grid.appendChild(prog);

    const track = el('div', 'bp-track');
    const hdr = el('div', 'bp-row bp-hdr');
    hdr.append(txt('span', 'bp-lv', 'LV'), txt('span', 'bp-head-cell', 'ฟรี'),
      txt('span', 'bp-head-cell', 'Premium'));
    track.appendChild(hdr);
    for (const t of BATTLEPASS.tiers) {
      const row = el('div', 'bp-row' + (t.level <= level ? ' reached' : ''));
      row.appendChild(txt('span', 'bp-lv', String(t.level)));
      row.appendChild(this.bpCell(t.free, 'free', t.level, level, premium));
      row.appendChild(this.bpCell(t.premium, 'premium', t.level, level, premium));
      track.appendChild(row);
    }
    this.grid.appendChild(track);

    const info = el('div', 'store-info');
    if (!premium) {
      info.innerHTML = '<span>รับของแทร็ก Premium ครบทุกเลเวล</span>';
      const btn = document.createElement('button');
      btn.className = 'btn store-buy';
      if (demoStore.getJil() >= BATTLEPASS.premiumPrice) {
        btn.textContent = `ปลดล็อก Premium ${BATTLEPASS.premiumPrice.toLocaleString('th-TH')} 💎 (demo)`;
        btn.addEventListener('click', () => demoStore.buyBpPremium());
      } else {
        btn.textContent = `Jil ไม่พอ (${BATTLEPASS.premiumPrice.toLocaleString('th-TH')})`;
        btn.disabled = true;
      }
      this.action.append(info, btn);
    } else {
      info.innerHTML = '<span>Premium ทำงานอยู่ (demo)</span>';
      this.action.appendChild(info);
    }
  }

  /** One reward cell in the battle-pass track (free or premium column). */
  private bpCell(reward: Reward | undefined, track: 'free' | 'premium',
    level: number, curLevel: number, premium: boolean): HTMLElement {
    const cell = el('div', 'bp-cell');
    if (!reward) {
      cell.classList.add('empty');
      cell.textContent = '—';
      return cell;
    }
    cell.style.borderColor = RARITY_COLOR[reward.rarity];
    cell.appendChild(txt('span', 'bp-reward', reward.name));
    const claimed = demoStore.isTierClaimed(reward.id);
    const reached = level <= curLevel;
    const btn = document.createElement('button');
    btn.className = 'bp-claim';
    if (claimed) {
      btn.textContent = '✓';
      btn.disabled = true;
      btn.classList.add('done');
    } else if (!reached) {
      btn.textContent = '🔒';
      btn.disabled = true;
    } else if (track === 'premium' && !premium) {
      btn.textContent = 'Premium';
      btn.disabled = true;
      btn.classList.add('locked');
    } else {
      btn.textContent = 'รับ';
      btn.addEventListener('click', () => demoStore.claimTier(reward, track, level));
    }
    cell.appendChild(btn);
    return cell;
  }

  // ─────────────────────────────────── U5: Supporter (D2, monthly tiers mock) ──
  private renderSupporter() {
    this.grid.className = 'store-grid stack';
    this.grid.replaceChildren();
    this.action.replaceChildren();

    const cur = demoStore.supporterTier();
    const head = el('div', 'mon-head');
    head.append(
      txt('div', 'mon-title', 'ผู้สนับสนุนรายเดือน'),
      txt('div', 'mon-sub', 'สมัครเพื่อรับป้าย ห้องพิเศษ และอิโมตเฉพาะ (demo — ไม่ผูกจ่ายจริง)'),
    );
    this.grid.appendChild(head);

    const cards = el('div', 'sup-cards');
    for (const tier of SUPPORTER_TIERS) {
      const active = cur === tier.id;
      const card = el('div', 'sup-card' + (active ? ' active' : ''));
      card.style.borderColor = `var(${tier.accentVar})`;
      const name = txt('div', 'sup-name', tier.name);
      name.style.color = `var(${tier.accentVar})`;
      card.appendChild(name);
      card.appendChild(txt('div', 'sup-price', `${tier.priceJil.toLocaleString('th-TH')} 💎 / เดือน (demo)`));
      const ul = el('ul', 'sup-perks');
      for (const p of tier.perks) {
        const li = document.createElement('li');
        li.textContent = p;
        ul.appendChild(li);
      }
      card.appendChild(ul);
      const btn = document.createElement('button');
      btn.className = 'btn sup-btn';
      if (active) {
        btn.textContent = '✓ กำลังสนับสนุน';
        btn.disabled = true;
      } else if (demoStore.getJil() >= tier.priceJil) {
        btn.textContent = 'สมัคร (demo)';
        btn.addEventListener('click', () => demoStore.subscribeSupporter(tier.id, tier.priceJil));
      } else {
        btn.textContent = 'Jil ไม่พอ';
        btn.disabled = true;
      }
      card.appendChild(btn);
      cards.appendChild(card);
    }
    this.grid.appendChild(cards);

    const info = el('div', 'store-info');
    info.innerHTML = cur ? '<span>ขอบคุณที่สนับสนุน! (demo)</span>'
      : '<span>ยกเลิกได้ทุกเมื่อ — เดโมเท่านั้น</span>';
    this.action.appendChild(info);
  }

  // ──────────────────────────── U5: Gacha (D4, published odds + pity + direct) ──
  private renderGacha() {
    this.grid.className = 'store-grid stack';
    this.grid.replaceChildren();
    this.action.replaceChildren();

    const pity = demoStore.getPity();
    const remain = GACHA.pityMax - pity;

    const head = el('div', 'mon-head');
    head.append(
      txt('div', 'mon-title', GACHA.name),
      txt('div', 'mon-sub', `สุ่ม 1 ครั้ง ${GACHA.pullCost} 💎 (demo) · การันตีเอปิกภายใน ${remain} ครั้ง`),
    );
    this.grid.appendChild(head);

    const reveal = el('div', 'gacha-reveal');
    if (this.gachaResult) {
      const { reward, rarity, guaranteed } = this.gachaResult;
      const card = el('div', 'gacha-card');
      card.style.borderColor = RARITY_COLOR[rarity];
      card.style.setProperty('--glow', RARITY_COLOR[rarity]);
      card.append(
        txt('div', 'gacha-rarity', RARITY_LABEL[rarity] + (guaranteed ? ' · pity!' : '')),
        txt('div', 'gacha-reward', reward.name),
      );
      reveal.appendChild(card);
    } else {
      reveal.appendChild(txt('div', 'gacha-hint', 'กดปุ่มด้านล่างเพื่อสุ่ม!'));
    }
    this.grid.appendChild(reveal);

    // Pity progress bar.
    this.grid.appendChild(txt('div', 'gacha-pity-label', `pity ${pity}/${GACHA.pityMax}`));
    const bar = el('div', 'gacha-pity');
    const fill = el('div', 'gacha-pity-fill');
    fill.style.width = `${(pity / GACHA.pityMax) * 100}%`;
    bar.appendChild(fill);
    this.grid.appendChild(bar);

    // Published odds table (must be shown — responsible design).
    const odds = el('div', 'gacha-odds');
    odds.appendChild(txt('div', 'gacha-odds-title', 'อัตราดรอป (เปิดเผย)'));
    for (const o of GACHA.odds) {
      const row = el('div', 'gacha-odds-row');
      const rar = txt('span', '', RARITY_LABEL[o.rarity]);
      rar.style.color = RARITY_COLOR[o.rarity];
      row.append(rar, txt('span', '', `${o.pct}%`));
      odds.appendChild(row);
    }
    this.grid.appendChild(odds);

    // Direct-buy alternative (skip RNG) — epics, transparent pricing.
    const direct = el('div', 'gacha-direct');
    direct.appendChild(txt('div', 'gacha-odds-title', 'หรือซื้อตรง (ไม่ต้องสุ่ม)'));
    for (const reward of GACHA.pool.epic) {
      const owned = demoStore.isGachaOwned(reward.id);
      const price = GACHA.directPrice.epic;
      const row = el('div', 'gacha-direct-row');
      const name = txt('span', '', reward.name);
      name.style.color = RARITY_COLOR.epic;
      row.appendChild(name);
      const btn = document.createElement('button');
      btn.className = 'bp-claim';
      if (owned) {
        btn.textContent = '✓';
        btn.disabled = true;
        btn.classList.add('done');
      } else if (demoStore.getJil() >= price) {
        btn.textContent = `${price.toLocaleString('th-TH')} 💎`;
        btn.addEventListener('click', () => demoStore.buyGachaDirect(reward));
      } else {
        btn.textContent = 'Jil ไม่พอ';
        btn.disabled = true;
      }
      row.appendChild(btn);
      direct.appendChild(row);
    }
    this.grid.appendChild(direct);

    // Footer: pull, or top-up when short on Jil.
    const info = el('div', 'store-info');
    info.innerHTML = '<span>odds เปิดเผย + pity + ซื้อตรงได้</span>';
    const btn = document.createElement('button');
    btn.className = 'btn store-buy';
    if (demoStore.getJil() >= GACHA.pullCost) {
      btn.textContent = `สุ่ม 1 ครั้ง · ${GACHA.pullCost} 💎 (demo)`;
      btn.addEventListener('click', () => {
        const res = demoStore.pullGacha();
        if (res) {
          this.gachaResult = res;
          this.render(); // rebuild → reveal card animates in
        }
      });
    } else {
      btn.textContent = 'เติม Jil 500 (demo)';
      btn.addEventListener('click', () => demoStore.topUp(500));
    }
    this.action.append(info, btn);
  }

  private close() {
    this.control.preview(this.equipped); // drop any unbought preview
    this.destroy();
  }

  destroy() {
    this.unsub();
    clearInterval(this.countdownTimer);
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
