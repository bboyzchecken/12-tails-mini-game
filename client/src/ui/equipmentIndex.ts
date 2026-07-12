/**
 * Loads the equipment manifest the Unity exporter writes (which weapons/hats
 * each hero has). Slot lists are the glb basenames = the ids stored in
 * Appearance.weapon / Appearance.hat.
 *
 * Suffix meaning (verified against the ripped meshes):
 *  - `_l` / `_r` = a genuine left/right dual-wield PAIR (identical vert counts,
 *    e.g. hallowSaw_l/hallowSaw_r). The `_r` half is hidden from lists; it
 *    equips automatically on the off-hand of a dual-wield hero.
 *  - `R` / `V` (capital) = recolor/tier variants of the SAME mesh (heroSword,
 *    heroSwordR, heroSwordV are byte-identical geometry). These are distinct
 *    skins the player can pick — they are NOT off-hands and stay in the list.
 */
export interface HeroEquipment {
  weapon: string[];
  hat: string[];
}

type EquipmentIndex = Record<string, HeroEquipment>;

/** Heroes that hold a weapon in both hands. Everyone else is single-wield. */
export const DUAL_WIELD = new Set(['wolf']);

let cache: Promise<EquipmentIndex> | null = null;

function load(): Promise<EquipmentIndex> {
  cache ??= fetch('assets/equipment/equipment-index.json')
    .then((r) => r.json())
    .catch(() => ({}) as EquipmentIndex);
  return cache;
}

/** The `_r` half of an explicit `_l`/`_r` dual-wield pair. */
function isOffhandHalf(name: string, list: string[]): boolean {
  return name.endsWith('_r') && list.includes(`${name.slice(0, -2)}_l`);
}

/** Cleaned lists for UI (shop/customize). */
export async function getHeroEquipment(hero: string): Promise<HeroEquipment> {
  const raw = (await load())[hero] ?? { weapon: [], hat: [] };
  return {
    weapon: raw.weapon.filter((w) => !isOffhandHalf(w, raw.weapon)),
    hat: raw.hat,
  };
}

/**
 * For a dual-wield hero, resolve which mesh goes in each hand for the chosen
 * weapon id. Explicit `_l`/`_r` pairs split across the hands; anything else is
 * held in duplicate (the left mount bone is already mirrored, so one mesh does).
 */
export async function dualWieldHands(
  hero: string,
  id: string,
): Promise<{ right: string; left: string | null }> {
  if (!DUAL_WIELD.has(hero)) return { right: id, left: null };
  const list = ((await load())[hero] ?? { weapon: [] }).weapon;
  if (id.endsWith('_l') && list.includes(`${id.slice(0, -2)}_r`)) {
    return { right: `${id.slice(0, -2)}_r`, left: id };
  }
  if (id.endsWith('_r') && list.includes(`${id.slice(0, -2)}_l`)) {
    return { right: id, left: `${id.slice(0, -2)}_l` };
  }
  return { right: id, left: id };
}
