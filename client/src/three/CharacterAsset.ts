import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Appearance } from '@12tails/shared/events';

/** Clip names inside the exported glb (ripped ids — see memory/unity-rip-assets).
 *  Most heroes only have `run` (walk exists just on wolf/cat), so movement
 *  falls back to run. */
const CLIP_IDLE = /root/i;
const CLIP_MOVE = [/walk/i, /run/i];

/** The bits of a CharacterDef the 3D loader needs. */
export interface CharacterModelSource {
  id: string;
  model: string;
}

export interface CharacterAsset {
  id: string;
  template: THREE.Group;
  clips: THREE.AnimationClip[];
}

export interface CharacterInstance {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  idle: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  /** Every clip in the model — emote actions (sit/dance/...) look themselves up here. */
  clips: THREE.AnimationClip[];
  /** Per-instance body materials, retextured to apply color/face appearance. */
  materials: THREE.MeshStandardMaterial[];
}

const cache = new Map<string, Promise<CharacterAsset>>();

export function loadCharacterAsset(src: CharacterModelSource): Promise<CharacterAsset> {
  let p = cache.get(src.model);
  if (!p) {
    p = load(src);
    cache.set(src.model, p);
  }
  return p;
}

/** In dev, force-fresh fetches — re-exported glbs must never come from cache. */
function bust(url: string): string {
  return import.meta.env.DEV ? `${url}?t=${Date.now()}` : url;
}

/**
 * Some ripped clips carry the ABSOLUTE world position of wherever they were
 * captured (bison's root_74 teleports the model ~90 units away — invisible in
 * game). Rebase any position track whose average offset is implausibly far
 * from the rig so the motion stays but the offset goes.
 */
const MAX_TRACK_OFFSET = 10; // world units — bone locals are all well below this

function sanitizeClips(clips: THREE.AnimationClip[]) {
  for (const clip of clips) {
    for (const track of clip.tracks) {
      if (!track.name.endsWith('.position')) continue;
      const v = track.values;
      let mx = 0, my = 0, mz = 0;
      const n = v.length / 3;
      for (let i = 0; i < v.length; i += 3) {
        mx += v[i]; my += v[i + 1]; mz += v[i + 2];
      }
      if (Math.hypot(mx / n, my / n, mz / n) < MAX_TRACK_OFFSET) continue;
      const bx = v[0], by = v[1], bz = v[2];
      for (let i = 0; i < v.length; i += 3) {
        v[i] -= bx; v[i + 1] -= by; v[i + 2] -= bz;
      }
      console.log(`[asset] rebased runaway position track in clip '${clip.name}'`);
    }
  }
}

async function load(src: CharacterModelSource): Promise<CharacterAsset> {
  const gltf = await new GLTFLoader().loadAsync(bust(src.model));
  sanitizeClips(gltf.animations);
  // Some prefab roots were ripped where they stood in a scene (Bison sat ~90
  // units away and rendered far from its nameplate) — recentre at the origin.
  for (const child of gltf.scene.children) {
    if (child.position.length() > 10) {
      console.log(`[asset] recentred root '${child.name}' (was ${child.position.toArray().map((n) => n.toFixed(1))})`);
      child.position.set(0, 0, 0);
    }
  }

  gltf.scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    // Skinned bounds from the rip are unreliable — never let culling hide the body.
    obj.frustumCulled = false;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if (!mat) return;
    // The game's look is flat toon — kill PBR gloss from the Unity export.
    mat.roughness = 1;
    mat.metalness = 0;
    // Ripped strip meshes can carry flipped winding on some segments (bison was
    // fully inverted, cat/rabbit partially) — render both faces so no body part
    // gets backface-culled away.
    mat.side = THREE.DoubleSide;
  });

  return { id: src.id, template: gltf.scene, clips: gltf.animations };
}

// -------------------------------------------------------- appearance textures

const texCache = new Map<string, Promise<THREE.Texture | null>>();
const imgCache = new Map<string, Promise<HTMLImageElement>>();

function cosmeticUrl(id: string, kind: 'color' | 'face', n: number): string {
  return `assets/cosmetics/${id}/${kind}/${n}.png`;
}

/**
 * Composite a body texture for one appearance: the chosen color variant with
 * the chosen face overlay baked into the atlas's top-left quadrant (verified
 * against the ripped 512px body textures). Cached per id:color:face.
 */
export function buildAppearanceTexture(id: string, a: Appearance): Promise<THREE.Texture | null> {
  const key = `${id}:${a.color}:${a.face}`;
  let p = texCache.get(key);
  if (!p) {
    p = composeAppearance(id, a);
    texCache.set(key, p);
  }
  return p;
}

async function composeAppearance(id: string, a: Appearance): Promise<THREE.Texture | null> {
  try {
    const [color, face] = await Promise.all([
      loadImage(cosmeticUrl(id, 'color', a.color)),
      loadImage(cosmeticUrl(id, 'face', a.face)).catch(() => null),
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = color.width;
    canvas.height = color.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(color, 0, 0);
    if (face) ctx.drawImage(face, 0, 0, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false; // glb UVs are not flipped
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  } catch (err) {
    console.warn(`[asset] appearance texture failed for ${id}`, err);
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  let p = imgCache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = bust(url);
    });
    imgCache.set(url, p);
  }
  return p;
}

// ------------------------------------------------------------- instantiation

/** Clone the template for one player (skinned meshes need SkeletonUtils). */
export function instantiateCharacter(asset: CharacterAsset): CharacterInstance {
  const group = cloneSkeleton(asset.template) as THREE.Group;
  const materials: THREE.MeshStandardMaterial[] = [];
  // Clone materials so each player can carry its own appearance texture.
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return;
    const mat = (obj.material as THREE.MeshStandardMaterial).clone();
    obj.material = mat;
    materials.push(mat);
  });

  const mixer = new THREE.AnimationMixer(group);
  const idleClip = asset.clips.find((c) => CLIP_IDLE.test(c.name)) ?? asset.clips[0] ?? null;
  let walkClip: THREE.AnimationClip | null = null;
  for (const re of CLIP_MOVE) {
    walkClip = asset.clips.find((c) => re.test(c.name)) ?? null;
    if (walkClip) break;
  }
  return {
    group,
    mixer,
    idle: idleClip ? mixer.clipAction(idleClip) : null,
    walk: walkClip ? mixer.clipAction(walkClip) : null,
    clips: asset.clips,
    materials,
  };
}
