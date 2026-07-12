import { CONFIG } from '@12tails/shared/config';
import type { Appearance } from '@12tails/shared/events';
import { CHARACTERS } from '../manifest';
import { CharacterPreview } from '../three/CharacterPreview';

interface CosmeticsIndex {
  [id: string]: { colors: number; faces: number };
}

interface CharacterSelectOptions {
  onEnter: (r: { characterId: string; name: string; appearance: Appearance }) => void;
}

/**
 * Full-screen character select (DOM overlay, replaces the Phaser scene's
 * rendering): pick a hero, spin it in a live 3D preview, choose body color +
 * face (or 🎲 random), name it, enter. The chosen appearance flows straight
 * into World3D.
 */
export class CharacterSelect {
  private root: HTMLDivElement;
  private preview: CharacterPreview;
  private index: CosmeticsIndex = {};
  private selected = 0;
  private appearance: Appearance = { color: 0, face: 0 };
  private colorWrap!: HTMLDivElement;
  private faceWrap!: HTMLDivElement;
  private cardEls: HTMLButtonElement[] = [];

  constructor(private opts: CharacterSelectOptions) {
    this.root = document.createElement('div');
    this.root.className = 'charselect';
    this.root.innerHTML = LAYOUT;
    document.body.appendChild(this.root);

    const previewBox = this.root.querySelector('.cs-preview') as HTMLElement;
    this.preview = new CharacterPreview(previewBox);

    this.buildCharStrip();
    this.colorWrap = this.root.querySelector('.cs-colors') as HTMLDivElement;
    this.faceWrap = this.root.querySelector('.cs-faces') as HTMLDivElement;

    const nameInput = this.root.querySelector('.cs-name') as HTMLInputElement;
    nameInput.maxLength = CONFIG.NAME_MAX_LEN;
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.enter();
    });
    (this.root.querySelector('.cs-random') as HTMLButtonElement)
      .addEventListener('click', () => this.randomize());
    (this.root.querySelector('.cs-enter') as HTMLButtonElement)
      .addEventListener('click', () => this.enter());

    void this.init();
  }

  private async init() {
    try {
      this.index = await (await fetch('assets/cosmetics/index.json')).json();
    } catch {
      /* counts default to 1 each */
    }
    this.select(0);
    setTimeout(() => (this.root.querySelector('.cs-name') as HTMLInputElement).focus(), 80);
  }

  private counts() {
    return this.index[CHARACTERS[this.selected].id] ?? { colors: 1, faces: 1 };
  }

  private buildCharStrip() {
    const strip = this.root.querySelector('.cs-strip') as HTMLDivElement;
    CHARACTERS.forEach((def, i) => {
      const card = document.createElement('button');
      card.className = 'cs-card';
      card.innerHTML =
        `<img src="${def.thumb}" alt="${def.name}" draggable="false"/>` +
        `<span>${def.name}</span>`;
      card.addEventListener('click', () => this.select(i));
      this.cardEls.push(card);
      strip.appendChild(card);
    });
  }

  private select(i: number) {
    this.selected = i;
    this.appearance = { color: 0, face: 0 };
    this.cardEls.forEach((c, idx) => c.classList.toggle('on', idx === i));
    const def = CHARACTERS[i];
    (this.root.querySelector('.cs-tribe') as HTMLElement).textContent = def.tribe || ' ';
    this.renderSwatches();
    void this.preview.setCharacter(def, this.appearance);
  }

  private renderSwatches() {
    const def = CHARACTERS[this.selected];
    const { colors, faces } = this.counts();

    this.colorWrap.replaceChildren();
    for (let n = 0; n < colors; n++) {
      this.colorWrap.appendChild(this.swatch(
        `assets/cosmetics/${def.id}/color/${n}.png`, n === this.appearance.color, false,
        () => { this.appearance = { ...this.appearance, color: n }; this.applyAppearance(); },
      ));
    }
    this.faceWrap.replaceChildren();
    for (let n = 0; n < faces; n++) {
      this.faceWrap.appendChild(this.swatch(
        `assets/cosmetics/${def.id}/face/${n}.png`, n === this.appearance.face, true,
        () => { this.appearance = { ...this.appearance, face: n }; this.applyAppearance(); },
      ));
    }
  }

  private swatch(url: string, on: boolean, lightBg: boolean, pick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'cs-swatch' + (lightBg ? ' face' : '') + (on ? ' on' : '');
    b.style.backgroundImage = `url(${url})`;
    b.addEventListener('click', pick);
    return b;
  }

  private applyAppearance() {
    this.renderSwatches();
    void this.preview.setAppearance(this.appearance);
  }

  private randomize() {
    const { colors, faces } = this.counts();
    this.appearance = {
      color: Math.floor(Math.random() * colors),
      face: Math.floor(Math.random() * faces),
    };
    this.applyAppearance();
  }

  private enter() {
    const name =
      (this.root.querySelector('.cs-name') as HTMLInputElement).value.trim().slice(0, CONFIG.NAME_MAX_LEN) ||
      'ผู้เล่น';
    const characterId = CHARACTERS[this.selected].id;
    const appearance = this.appearance;
    this.destroy();
    this.opts.onEnter({ characterId, name, appearance });
  }

  destroy() {
    this.preview.dispose();
    this.root.remove();
  }
}

const LAYOUT = `
  <div class="cs-inner">
    <h1 class="cs-title">เลือกตัวละคร</h1>
    <div class="cs-strip"></div>
    <div class="cs-main">
      <div class="cs-preview"></div>
      <div class="cs-controls">
        <div class="cs-tribe"></div>
        <div class="cs-label">สี</div>
        <div class="cs-colors"></div>
        <div class="cs-label">หน้า</div>
        <div class="cs-faces"></div>
        <button class="btn cs-random">🎲 สุ่มรูปลักษณ์</button>
        <input class="cs-name" type="text" placeholder="ชื่อเล่น" />
        <button class="btn cs-enter">▶ เข้าเกม</button>
      </div>
    </div>
  </div>
`;
