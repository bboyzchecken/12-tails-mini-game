import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Equipment slot -> the character bone it attaches to. */
export type EquipSlot = 'weapon' | 'weaponL' | 'hat';

/**
 * Mount-bone name patterns per slot. Rigs disagree wildly across heroes:
 *   right hand: mount_Hand_R (most), HandMount_R (bison), mount_Arm_R (panda),
 *               mountHand_R (rabbit)
 *   left hand:  the _L twins of those
 *   head:       mount_OverHead / mount_Overhead (most), mount_Head (chameleon,
 *               rabbit); bison/penguin/whale have none.
 * Grafted costume rigs (cat/rabbit) add `_1`-suffixed duplicates — the `$`
 * anchors exclude those so the primary bone wins.
 */
export const MOUNT_PATTERNS: Record<EquipSlot, RegExp[]> = {
  weapon: [/^(mount_?hand|hand_?mount|mount_?arm)_r$/i],
  weaponL: [/^(mount_?hand|hand_?mount|mount_?arm)_l$/i],
  hat: [/^mount_?over_?head$/i, /^mount_?head$/i],
};

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Seating rule (derived by measuring the ripped rigs, not the prefabs):
 *
 *  - The prefab's LOCAL POSITION is a showcase-table placement (y≈54, x/z up to
 *    ~250u) unrelated to the ~0.4u bone rig → zeroed.
 *  - The prefab's LOCAL ROTATION is a per-item showcase DISPLAY angle and is NOT
 *    a consistent hold pose (commonKnife resolves to +Y, pirateKnife to +Z,
 *    partyHat to −Z…). Keeping it pointed blades at the floor. → zeroed to the
 *    raw mesh.
 *  - Every raw mesh IS authored consistently: its bulk sits along +Z from the
 *    origin (knife blade +Z, hat crown +Z). So the real hold = align that raw
 *    +Z to a target direction at the mount bone. That alignment happens in
 *    Player3D.setEquipment (it needs the live bone orientation, which differs
 *    per rig — hand +Z is forward, head +X is up, etc.).
 */
const SHOWCASE_OFFSET = 10; // a node farther than this carries the table placement

/** Raw mesh +Z, the axis every item's bulk is authored along. */
export const ITEM_OUT_AXIS = new THREE.Vector3(0, 0, 1);

function bust(url: string): string {
  return import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
}

export function equipmentUrl(hero: string, slot: EquipSlot, id: string): string {
  return `assets/equipment/${hero}/${slot}/${id}.glb`;
}

/**
 * Load an equipment glb as a RAW mesh (showcase placement stripped). Returns a
 * fresh clone each call so multiple players can wear the same item. Null if the
 * file is missing. Orientation is applied later, at the mount bone.
 */
export async function loadEquipment(url: string): Promise<THREE.Group | null> {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      // Strip the showcase transform off the top-level item nodes -> raw mesh.
      for (const child of gltf.scene.children) {
        child.position.set(0, 0, 0);
        child.quaternion.identity();
      }
      gltf.scene.traverse((o) => {
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
