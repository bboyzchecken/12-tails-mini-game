import type { Appearance } from '@12tails/shared/events';

/**
 * The appearance surface World3D exposes to cosmetic UIs (customize panel,
 * store). `preview` applies a look locally only; `commit` applies AND
 * broadcasts it as the player's real appearance.
 */
export interface AppearanceControl {
  characterId: string;
  get(): Appearance;
  preview(a: Appearance): void;
  commit(a: Appearance): void;
}
