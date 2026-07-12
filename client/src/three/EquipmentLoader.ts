import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Equipment slot -> the character bone it attaches to. */
export type EquipSlot = 'weapon' | 'hat';
export const MOUNT_BONE: Record<EquipSlot, string> = {
  weapon: 'mount_Hand_R',
  hat: 'mount_OverHead',
};

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Weapon/accessory prefabs carry a junk transform: their root was placed in a
 * showcase scene (C32_*Equipments grid), so position ≈ (±100, 55, 100) and a
 * 120° axis-swap rotation. The MESH itself is authored grip-at-origin (verified:
 * commonSword geometry spans z −0.12..+1.06 around 0). Correct hold = wipe the
 * showcase transform so the grip sits exactly on the mount bone.
 */
const SHOWCASE_OFFSET = 10; // any node farther than this carries showcase junk

function bust(url: string): string {
  return import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
}

export function equipmentUrl(hero: string, slot: EquipSlot, id: string): string {
  return `assets/equipment/${hero}/${slot}/${id}.glb`;
}

/**
 * Load an equipment glb (static mesh with its mount-local transform baked into
 * the root by UnityGLTF). Returns a fresh clone each call so multiple players
 * can wear the same item. Null if the file is missing.
 */
export async function loadEquipment(url: string): Promise<THREE.Group | null> {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      gltf.scene.traverse((o) => {
        // Seat the item on the bone: drop the showcase-scene placement entirely.
        if (o.position.length() > SHOWCASE_OFFSET) {
          o.position.set(0, 0, 0);
          o.quaternion.identity();
        }
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
