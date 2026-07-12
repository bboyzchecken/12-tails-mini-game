import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

/** Clip names inside the exported glb (ripped ids — see memory/unity-rip-assets).
 *  Most heroes only have `run` (walk exists just on wolf/cat), so movement
 *  falls back to run. */
const CLIP_IDLE = /root/i;
const CLIP_MOVE = [/walk/i, /run/i];

/** The bits of a CharacterDef the 3D loader needs. */
export interface CharacterModelSource {
  model: string;
  overlay: string;
}

export interface CharacterAsset {
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
  const faceOverlay = await loadImage(bust(src.overlay)).catch(() => null);

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
    if (faceOverlay && mat.map) mat.map = compositeFace(mat.map, faceOverlay);
  });

  return { template: gltf.scene, clips: gltf.animations };
}

/**
 * The game ships bodies without faces; eyes/mouth live in separate 256×256
 * overlay textures (armors/overlay/) sharing the body's UV space. Bake the
 * overlay onto the body texture once so every clone gets a face for free.
 */
function compositeFace(map: THREE.Texture, overlay: HTMLImageElement): THREE.Texture {
  const img = map.image as { width: number; height: number } | undefined;
  if (!img?.width) return map;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return map;
  ctx.drawImage(map.image as CanvasImageSource, 0, 0);
  // The 256px overlay maps to the atlas's top-left quadrant (the face patch),
  // NOT the whole atlas — verified against the ripped 512px body textures.
  ctx.drawImage(overlay, 0, 0, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = map.flipY; // glb textures are not flipped — keep it that way
  tex.colorSpace = map.colorSpace;
  tex.wrapS = map.wrapS;
  tex.wrapT = map.wrapT;
  return tex;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Clone the template for one player (skinned meshes need SkeletonUtils). */
export function instantiateCharacter(asset: CharacterAsset): CharacterInstance {
  const group = cloneSkeleton(asset.template) as THREE.Group;
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
  };
}
