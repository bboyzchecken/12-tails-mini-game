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
/** 120° axis-swap quaternions (all components ±0.5) are showcase-scene junk. */
function isShowcaseQuat(q: THREE.Quaternion): boolean {
  return (
    Math.abs(Math.abs(q.x) - 0.5) < 0.02 &&
    Math.abs(Math.abs(q.y) - 0.5) < 0.02 &&
    Math.abs(Math.abs(q.z) - 0.5) < 0.02 &&
    Math.abs(Math.abs(q.w) - 0.5) < 0.02
  );
}

export interface LoadEquipmentOptions {
  /** Weapons: rotate so the long axis (blade/shaft) points +z, tip forward. */
  alignLongAxis?: boolean;
}

export async function loadEquipment(
  url: string,
  opts: LoadEquipmentOptions = {},
): Promise<THREE.Group | null> {
  const key = url + (opts.alignLongAxis ? '#z' : '');
  let p = cache.get(key);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      gltf.scene.traverse((o) => {
        // Seat the item on the bone: drop the showcase-scene placement entirely.
        if (o.position.length() > SHOWCASE_OFFSET) {
          o.position.set(0, 0, 0);
          o.quaternion.identity();
        } else if (isShowcaseQuat(o.quaternion)) {
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

      if (opts.alignLongAxis) {
        // Most weapons are authored grip-at-origin along +z; normalize the
        // stragglers so every blade/shaft points the same way in the hand.
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const max = Math.max(size.x, size.y, size.z);
        if (max > 0) {
          if (size.y === max && size.y > size.z * 1.2) gltf.scene.rotateX(Math.PI / 2);
          else if (size.x === max && size.x > size.z * 1.2) gltf.scene.rotateY(-Math.PI / 2);
          const after = new THREE.Box3().setFromObject(gltf.scene);
          if (Math.abs(after.min.z) > Math.abs(after.max.z)) gltf.scene.rotateY(Math.PI);
        }
      }
      return gltf.scene;
    });
    cache.set(key, p);
  }
  try {
    const scene = await p;
    return scene.clone(true);
  } catch {
    cache.delete(key);
    return null;
  }
}
