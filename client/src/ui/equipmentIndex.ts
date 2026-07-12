/**
 * Loads the equipment manifest the Unity exporter writes (which weapons/hats
 * each hero has). Cached. Slot lists are the glb basenames = the ids stored in
 * Appearance.weapon / Appearance.hat.
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

export async function getHeroEquipment(hero: string): Promise<HeroEquipment> {
  const idx = await load();
  return idx[hero] ?? { weapon: [], hat: [] };
}
