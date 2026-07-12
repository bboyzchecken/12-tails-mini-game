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
 * Weapon/accessory prefabs bake their mount-local position in the game's ~100×
 * authoring frame, but the exported character skeleton is ~1.6 units — so the
 * raw offset flings the item ~150 units away. Scale down large offset nodes'
 * POSITION (not their geometry) to seat them on the bone. Tunable if items sit
 * slightly off.
 */
const MOUNT_POS_SCALE = 0.006;

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
        // Seat the item on the bone: shrink the oversized authoring offset.
        if (o.position.length() > 10) o.position.multiplyScalar(MOUNT_POS_SCALE);
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
