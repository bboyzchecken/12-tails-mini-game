import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Equipment slot -> the character bone it attaches to. */
export type EquipSlot = 'weapon' | 'weaponL' | 'hat';

/**
 * Mount-bone name patterns. Rigs disagree on spelling across heroes:
 *   right hand: mount_Hand_R (most), HandMount_R (bison), mount_Arm_R (panda),
 *               mountHand_R (rabbit)
 *   left hand:  the _L twins of those.
 * The `$` anchors exclude the grafted `_1` duplicate bones on cat/rabbit rigs.
 */
const MOUNT_PATTERNS: Record<'weapon' | 'weaponL', RegExp[]> = {
  weapon: [/^(mount_?hand|hand_?mount|mount_?arm)_r$/i],
  weaponL: [/^(mount_?hand|hand_?mount|mount_?arm)_l$/i],
};

/**
 * Hats/accessories seat on the head *crown* mount — the empty the game parents
 * the mAcc slot to. In every rig it hangs off the `Head` bone, identity-rotated
 * and offset ~0.4u up at the crown; the hat prefab's authored pose (local pos 0)
 * is built to sit there. Seating on the `Head` bone itself (head-centre) instead
 * drops every hat ~0.4u into the skull — the "sunk into the head" look.
 *
 * Spellings vary across the ripped rigs (`mount_OverHead` / `mount_Overhead` /
 * `Mount_OverHead` on most, `mount_Head` on chameleon+rabbit) and mole ships
 * both a crown `mount_OverHead` and a lower `mount_Head`, so prefer OverHead,
 * then Head-mount. bison/penguin/whale ship no crown mount at all → fall back to
 * the `Head` bone, and Player3D lifts the hat to the crown there.
 */
const HAT_BONE_DEFAULT: RegExp[] = [/^mount_?overhead$/i, /^mount_?head$/i, /^head$/i];

/** Bone-name patterns to try (in priority order) for a hero's equipment slot. */
export function mountPatterns(_hero: string, slot: EquipSlot): RegExp[] {
  if (slot === 'hat') return HAT_BONE_DEFAULT;
  return MOUNT_PATTERNS[slot];
}

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Seating rule (recovered from the ripped rigs — see the mount-convention
 * investigation): the exported glb ALREADY carries the correct per-item hold
 * pose as the baked rotation on its mesh node, because the item and the
 * character rig went through the same Unity→glTF exporter (a negate-X basis
 * change), so the item's rotation is the exact Unity prefab-local rotation in
 * the same frame as the bone. Local-attaching with that rotation reproduces the
 * game's grip verbatim — knives, reverse-grip daggers, claws-on-paw, bows,
 * shields and full-head hats each ride in on their own baked rotation.
 *
 * The ONLY thing to strip is the showcase-table translation (legacy roots sit
 * ~100u out); small real child offsets (modern two-level prefabs, ~0.1–0.34u)
 * are kept. Never touch the rotation.
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
 * wear the same item. Null if the file is missing. Only the showcase translation
 * is stripped; the baked hold rotation is preserved.
 */
export async function loadEquipment(url: string): Promise<THREE.Group | null> {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      gltf.scene.traverse((o) => {
        // Strip the showcase-table placement; KEEP the authored hold rotation.
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
