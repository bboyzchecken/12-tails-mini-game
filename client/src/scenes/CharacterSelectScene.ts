import Phaser from 'phaser';
import { CharacterSelect } from '../ui/CharacterSelect';

/**
 * Thin Phaser host for the DOM character-select overlay (ui/CharacterSelect).
 * The overlay owns the picker + live 3D preview; on confirm it hands the
 * chosen { characterId, name, appearance } to World3D and tears itself down.
 */
export class CharacterSelectScene extends Phaser.Scene {
  private select?: CharacterSelect;

  constructor() {
    super('CharacterSelect');
  }

  create() {
    this.cameras.main.setBackgroundColor('#15152b');
    this.select = new CharacterSelect({
      onEnter: ({ characterId, name, appearance }) => {
        // Dynamic import keeps three.js out of the boot bundle. The overlay has
        // already removed itself; launchWorld3D destroys this Phaser game.
        void import('../three/World3D').then(({ launchWorld3D }) =>
          launchWorld3D({ characterId, name, appearance }, this.game),
        );
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.select?.destroy());
  }
}
