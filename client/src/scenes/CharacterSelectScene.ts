import Phaser from 'phaser';
import { CharacterSelect } from '../ui/CharacterSelect';
import { AuthPanel } from '../ui/AuthPanel';
import { CharacterSlots } from '../ui/CharacterSlots';
import * as api from '../net/api';
import type { MeResponse } from '../net/api';
import { trackPlayStart } from '../net/track';
import type { WorldInit } from '../three/World3D';
import { consumeEntryIntent } from '../boot';

/**
 * Entry flow host (DOM overlays over a Phaser scene). Orchestrates the Phase P
 * ladder: auth gate → character-slot picker → world; or guest → create → world.
 * On confirm it hands a WorldInit to World3D and tears this Phaser game down.
 */
export class CharacterSelectScene extends Phaser.Scene {
  private select?: CharacterSelect;
  private auth?: AuthPanel;
  private slots?: CharacterSlots;

  constructor() {
    super('CharacterSelect');
  }

  create() {
    this.cameras.main.setBackgroundColor('#15152b');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    // A guest hitting "change character" lands straight on the picker; everyone
    // else goes through the gate (resume session → slots, or login).
    if (consumeEntryIntent() === 'guest-create') this.showGuestCreate();
    else void this.showGate();
  }

  /** Resume a saved session if the token is still valid, else show the auth gate. */
  private async showGate() {
    if (api.getToken()) {
      try {
        const me = await api.getMe();
        this.showSlots(me);
        return;
      } catch {
        api.logout(); // stale/invalid token — fall through to auth
      }
    }
    this.showAuth();
  }

  private showAuth() {
    this.teardown();
    this.auth = new AuthPanel({
      onAuthed: () => void this.enterAccount(),
      onGuest: () => this.showGuestCreate(),
    });
  }

  private async enterAccount() {
    this.teardown();
    try {
      this.showSlots(await api.getMe());
    } catch {
      this.showAuth();
    }
  }

  private showSlots(me: MeResponse) {
    this.teardown();
    this.slots = new CharacterSlots({
      me,
      onPlay: (c) =>
        this.launch({
          characterId: c.character_id,
          name: c.name,
          familyName: me.user.family_name,
          appearance: c.appearance,
        }),
      onCreate: (slot) => this.showAccountCreate(me, slot),
      onLogout: () => {
        api.logout();
        this.showAuth();
      },
    });
  }

  private showAccountCreate(me: MeResponse, slot: number) {
    this.teardown();
    this.select = new CharacterSelect({
      title: 'สร้างตัวละคร',
      confirmLabel: '▶ สร้าง & เข้าเกม',
      onBack: () => void this.enterAccount(),
      onEnter: async ({ characterId, name, appearance }) => {
        try {
          const ch = await api.createCharacter({
            name,
            character_id: characterId,
            appearance,
            slot_index: slot,
          });
          this.launch({
            characterId: ch.character_id,
            name: ch.name,
            familyName: me.user.family_name,
            appearance: ch.appearance,
          });
        } catch (err) {
          alert((err as Error).message || 'สร้างตัวละครไม่สำเร็จ');
          void this.enterAccount();
        }
      },
    });
  }

  private showGuestCreate() {
    this.teardown();
    this.select = new CharacterSelect({
      title: 'เล่นแบบ guest',
      onBack: () => this.showAuth(), // guests can step back to the login screen
      onEnter: ({ characterId, name, appearance }) => this.launch({ characterId, name, appearance }),
    });
  }

  private launch(init: WorldInit) {
    this.teardown();
    // A guest has no account family name yet; account players enter the world
    // with the JWT already stored, so track() attaches account_id too.
    trackPlayStart(init.characterId, { guest: !init.familyName });
    // Dynamic import keeps three.js out of the boot bundle; launchWorld3D
    // destroys this Phaser game and takes over the #game container.
    void import('../three/World3D').then(({ launchWorld3D }) => launchWorld3D(init, this.game));
  }

  private teardown() {
    this.auth?.destroy();
    this.auth = undefined;
    this.slots?.destroy();
    this.slots = undefined;
    this.select?.destroy();
    this.select = undefined;
  }
}
