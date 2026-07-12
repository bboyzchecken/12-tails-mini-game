import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Equipment slot -> the character bone it attaches to. */
export type EquipSlot = 'weapon' | 'weaponL' | 'hat';
export const MOUNT_BONE: Record<EquipSlot, string> = {
  weapon: 'mount_Hand_R',
  weaponL: 'mount_Hand_L', // off-hand of a dual-wield pair (R/_r variants)
  hat: 'mount_OverHead',
};

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * How the game seats an item on its mount bone (verified against the ripped
 * prefabs + EquipmentControl):
 *
 *  - The prefab's LOCAL ROTATION is the correct hold/wear orientation and
 *    differs per item — the artist authored each mesh in its own space and set
 *    the root rotation to bring it into the canonical pose. commonKnife and
 *    standardKnife share rot (-0.5,0.5,0.5,0.5) but sit at different showcase
 *    spots; pirateKnife is identity; hallowClaw is (0.5,0.5,0.5,-0.5). We KEEP
 *    whatever rotation the prefab carries.
 *  - The prefab's LOCAL POSITION is a showcase-scene table placement (y≈54,
 *    x/z anywhere from 0 to ~250 units — a space unrelated to the ~0.4-unit
 *    bone rig). The game zeroes it so the grip/crown sits on the mount bone.
 *
 * So: zero the showcase offset, keep the rotation, attach at localPosition 0.
 * (Earlier code wiped the rotation as "junk" and re-guessed the blade axis —
 * that broke every item whose authored rotation wasn't identity.)
 */
const SHOWCASE_OFFSET = 10; // a node farther than this carries the table placement

function bust(url: string): string {
  return import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
}

export function equipmentUrl(hero: string, slot: EquipSlot, id: string): string {
  return `assets/equipment/${hero}/${slot}/${id}.glb`;
}

/**
 * Load an equipment glb. Returns a fresh clone each call so multiple players can
 * wear the same item. Null if the file is missing.
 */
export async function loadEquipment(url: string): Promise<THREE.Group | null> {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      gltf.scene.traverse((o) => {
        // Drop the showcase-table placement; keep the authored hold rotation.
        if (o.position.length() > SHOWCASE_OFFSET) o.position.set(0, 0, 0);
        if (!(o instanceof THREE.Mesh)) return;
        o.frustumCulled = false;
        const mat = o.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.roughness = 1;
          mat.metalness = 0;
          mat.side = THREE.DoubleSide;
        }
      });
      return gltf.scene;
    });
    cache.set(url, p);
  }
  try {
    const scene = await p;
    return scene.clone(true);
  } catch {
    cache.delete(url);
    return null;
  }
}
