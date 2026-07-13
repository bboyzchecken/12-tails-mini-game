import { CHARACTERS } from '../manifest';
import type { Character, MeResponse } from '../net/api';

interface CharacterSlotsOptions {
  me: MeResponse;
  onPlay: (character: Character) => void; // enter with an existing character
  onCreate: (slotIndex: number) => void; // create in an empty slot
  onLogout: () => void;
}

/**
 * Character-slot picker (DOM overlay) shown after login. Header = the account's
 * permanent family name; a row of slots (filled → play, empty → create).
 */
export class CharacterSlots {
  private root: HTMLDivElement;

  constructor(private opts: CharacterSlotsOptions) {
    this.root = document.createElement('div');
    this.root.className = 'authgate';
    this.root.appendChild(this.build());
    document.body.appendChild(this.root);
  }

  private build(): HTMLElement {
    const { me } = this.opts;
    const wrap = document.createElement('div');
    wrap.className = 'slots-wrap';

    const head = document.createElement('div');
    head.className = 'slots-head';
    head.innerHTML =
      `<div class="slots-fam">👪 <b>${escapeHtml(me.user.family_name)}</b></div>`;
    const logout = document.createElement('button');
    logout.className = 'btn btn-ghost slots-logout';
    logout.textContent = 'ออกจากระบบ';
    logout.addEventListener('click', () => {
      this.destroy();
      this.opts.onLogout();
    });
    head.appendChild(logout);

    const title = document.createElement('h1');
    title.className = 'slots-title';
    title.textContent = 'เลือกตัวละคร';

    const grid = document.createElement('div');
    grid.className = 'slots-grid';
    for (let i = 0; i < me.max_slots; i++) {
      const ch = me.characters.find((c) => c.slot_index === i);
      grid.appendChild(ch ? this.filledCard(ch) : this.emptyCard(i));
    }

    wrap.append(head, title, grid);
    return wrap;
  }

  private filledCard(ch: Character): HTMLElement {
    const def = CHARACTERS.find((d) => d.id === ch.character_id);
    const card = document.createElement('button');
    card.className = 'slot-card filled';
    card.innerHTML =
      `<img class="slot-thumb" src="${def?.thumb ?? ''}" alt="${escapeHtml(ch.character_id)}" draggable="false"/>` +
      `<span class="slot-name">${escapeHtml(ch.name)}</span>` +
      `<span class="slot-tribe">${escapeHtml(def?.tribe ?? ch.character_id)}</span>` +
      `<span class="slot-play">▶ เข้าเกม</span>`;
    card.addEventListener('click', () => {
      this.destroy();
      this.opts.onPlay(ch);
    });
    return card;
  }

  private emptyCard(slot: number): HTMLElement {
    const card = document.createElement('button');
    card.className = 'slot-card empty';
    card.innerHTML = `<span class="slot-plus">＋</span><span class="slot-add">สร้างตัวละคร</span>`;
    card.addEventListener('click', () => {
      this.destroy();
      this.opts.onCreate(slot);
    });
    return card;
  }

  destroy() {
    this.root.remove();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
