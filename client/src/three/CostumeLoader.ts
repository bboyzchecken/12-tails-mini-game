import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Body-costume (outfit) loading + skeleton graft — the web analogue of how 12
 * Tails swaps costumes in-engine.
 *
 * In the game a costume is a *whole-body skinned mesh* (`<hero>_<costume>.asset`)
 * that shares the character's rig; equipping it instantiates the costume prefab
 * and rebinds its SkinnedMeshRenderer's bones onto the live rig BY NAME, then
 * drops the previous body renderer (this is exactly what the Unity exporter's
 * `GraftCostumeIfNeeded` reproduces for cat/rabbit). It is NOT a bone-attached
 * prop like a weapon/hat — so it can never mis-seat the way a hat can.
 *
 * We do the same at runtime: the base character glb carries the "nude" body +
 * the rig + all the animation clips; each costume glb carries only that
 * costume's skinned body on a bone hierarchy with the SAME bone names. To wear
 * a costume we take its mesh's geometry/material/bind-inverses and re-point its
 * skin binding at the character's *live* bones (matched by name). The mesh then
 * deforms with the shared animation just like the base body did.
 *
 * Exported by the Unity menu `12Tails → Export All Costumes To GLB` to
 * `assets/costumes/<hero>/<costume>.glb` (+ `costume-index.json`). The default
 * color-1 atlas is baked into the glb, and the same atlas is copied alongside
 * as `<costume>.png` so the client can re-composite the player's chosen face.
 */

export function costumeUrl(hero: string, id: string): string {
  return `assets/costumes/${hero}/${id}.glb`;
}

/** The costume's flat color-1 atlas PNG (for re-compositing the face overlay). */
export function costumeTextureUrl(hero: string, id: string): string {
  return `assets/costumes/${hero}/${id}.png`;
}

function bust(url: string): string {
  return import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
}

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Load a costume glb and return a fresh SkinnedMesh clone (its own skeleton,
 * cloned per wearer so several players can wear the same costume). The returned
 * mesh is NOT yet bound to any character — pass it to `applyOutfit`. Null if the
 * file is missing (the caller keeps the bare base body).
 */
export async function loadCostume(url: string): Promise<THREE.SkinnedMesh | null> {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(bust(url)).then((gltf) => {
      gltf.scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        // Ripped skinned bounds are unreliable — never cull the body away.
        o.frustumCulled = false;
        const mat = o.material as THREE.MeshStandardMaterial;
        if (!mat) return;
        // Flat-toon like the base body + map (kill Unity PBR gloss, show both
        // faces so no strip-flipped segment gets backface-culled).
        mat.roughness = 1;
        mat.metalness = 0;
        mat.side = THREE.DoubleSide;
      });
      return gltf.scene;
    });
    cache.set(url, p);
  }
  try {
    const scene = await p;
    const fresh = cloneSkeleton(scene) as THREE.Group;
    let mesh: THREE.SkinnedMesh | null = null;
    fresh.traverse((o) => {
      if (!mesh && (o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.SkinnedMesh;
    });
    return mesh;
  } catch {
    cache.delete(url);
    return null;
  }
}

/** Undo an `applyOutfit` — restores the body mesh's original nude geometry. */
export interface OutfitBinding {
  /** The equipped costume's material(s) — retextured to overlay the player's face. */
  materials: THREE.MeshStandardMaterial[];
  restore(): void;
}

/**
 * Graft `costume`'s body onto `bodyMesh` in place: swap in the costume's
 * geometry + material, and rebind the skin to `bodyMesh`'s OWN live bones,
 * re-ordered to the costume's bone names (same rig, same rest pose → the
 * costume's bind-inverses stay valid). Keeping the existing body-mesh node (not
 * re-parenting an extracted mesh) preserves its tree position + bind transform,
 * so the graft can't drift. Returns a binding whose `restore()` puts the nude
 * body back, or null if too many bones fail to match (leaves the body as-is).
 */
export function applyOutfit(
  bodyMesh: THREE.SkinnedMesh,
  costume: THREE.SkinnedMesh,
): OutfitBinding | null {
  const live = new Map<string, THREE.Bone>();
  for (const b of bodyMesh.skeleton.bones) live.set(b.name, b);

  const src = costume.skeleton.bones;
  let missing = 0;
  const bones = src.map((b) => {
    const t = live.get(b.name);
    if (!t) missing++;
    return t ?? b; // unmatched → keep the costume's own bone (harmless)
  });
  if (missing > src.length * 0.5) {
    console.warn(`[costume] ${missing}/${src.length} bones unmatched — outfit skipped`);
    return null;
  }

  const orig = {
    geometry: bodyMesh.geometry,
    material: bodyMesh.material,
    skeleton: bodyMesh.skeleton,
    bindMatrix: bodyMesh.bindMatrix.clone(),
  };

  const srcMat = Array.isArray(costume.material) ? costume.material[0] : costume.material;
  const mat = (srcMat as THREE.MeshStandardMaterial).clone();
  const skeleton = new THREE.Skeleton(bones, costume.skeleton.boneInverses);
  bodyMesh.geometry = costume.geometry;
  bodyMesh.material = mat;
  // costume.geometry + costume.boneInverses + costume.bindMatrix are a
  // mutually-consistent set from the costume glb; only the bones are swapped to
  // the live rig (matched by name), which is what the game's graft does.
  bodyMesh.bind(skeleton, costume.bindMatrix);

  return {
    materials: [mat],
    restore() {
      bodyMesh.geometry = orig.geometry;
      bodyMesh.material = orig.material;
      bodyMesh.bind(orig.skeleton, orig.bindMatrix);
    },
  };
}
