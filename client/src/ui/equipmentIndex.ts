/**
 * Loads the equipment manifest the Unity exporter writes (which weapons/hats
 * each hero has). Slot lists are the glb basenames = the ids stored in
 * Appearance.weapon / Appearance.hat.
 *
 * UI lists are CLEANED here so every surface agrees:
 *  - off-hand halves of dual-wield pairs (nameR / name_r) are hidden — they
 *    equip automatically with their base weapon. Hats keep their R/V suffixes:
 *    those are color variants (partyHatB/partyHatR), not off-hands.
 */
export interface HeroEquipment {
  weapon: string[];
  hat: string[];
}

type EquipmentIndex = Record<string, HeroEquipment>;

let cache: Promise<EquipmentIndex> | null = null;

function load(): Promise<EquipmentIndex> {
  cache ??= fetch('assets/equipment/equipment-index.json')
    .then((r) => r.json())
    .catch(() => ({}) as EquipmentIndex);
  return cache;
}

function isOffhand(name: string, list: string[]): boolean {
  if (name.endsWith('_r') && list.includes(`${name.slice(0, -2)}_l`)) return true;
  if (/R$/.test(name) && list.includes(name.slice(0, -1))) return true;
  return false;
}

/** Cleaned lists for UI (shop/customize). */
export async function getHeroEquipment(hero: string): Promise<HeroEquipment> {
  const raw = (await load())[hero] ?? { weapon: [], hat: [] };
  return {
    weapon: raw.weapon.filter((w) => !isOffhand(w, raw.weapon)),
    hat: raw.hat,
  };
}

/** The off-hand counterpart of a weapon (dual-wield pair), if the hero has one. */
export async function weaponPartner(hero: string, id: string): Promise<string | null> {
  const raw = (await load())[hero] ?? { weapon: [], hat: [] };
  const list = raw.weapon;
  if (list.includes(`${id}R`)) return `${id}R`;
  if (list.includes(`${id}_r`)) return `${id}_r`;
  if (id.endsWith('_l')) {
    const p = `${id.slice(0, -2)}_r`;
    if (list.includes(p)) return p;
  }
  return null;
}
