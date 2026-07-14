import * as THREE from 'three';
import { CONFIG } from '@12tails/shared/config';
import type { Direction, PlayerState } from '@12tails/shared/events';
import { instantiateCharacter, type CharacterAsset, type CharacterInstance } from './CharacterAsset';
import { mountPatterns, type EquipSlot } from './EquipmentLoader';
import { applyOutfit, type OutfitBinding } from './CostumeLoader';

/** Server keeps 2D pixel coords (x right, y down). 3D maps px → tiles: x→x, y→z. */
export const PX_TO_UNIT = 1 / CONFIG.TILE;
/** Fallback bubble height when a skeleton can't be measured. */
const HEAD_UNITS_FALLBACK = 2.0;
/** Clearance above the top of the head for name/bubble anchors. */
const HEAD_MARGIN = 0.25;

const ANIM_FADE = 0.18;
const TURN_SPEED = 12; // rad/s toward target yaw

/**
 * HAT PLACEMENT — reproduces the Unity game's equip EXACTLY (reverse-engineered
 * from the rip, not tuned by eye). The game parents an accessory prefab to the
 * `mount_OverHead` empty, ZEROES its mount-local position, and KEEPS the prefab's
 * authored local rotation ({-0.5,-0.5,-0.5,0.5} on 54/59 wolf hats; identity on a
 * few novelty ones). The showcase-grid position the prefab also carries (e.g.
 * scorpionHelmet's {1,54,-76}) is discarded.
 *
 * That composes onto the exported glb with NO frame-bridging, because UnityGLTF
 * applies ONE conversion — conjugation by diag(-1,1,1) (negate-X) — identically
 * to skinned character bones AND standalone item meshes. Conjugation is a clean
 * homomorphism (conv(A·B) = conv(A)·conv(B)), so the glb's baked hat rotation IS
 * conv(prefab rotation): keeping it and parenting to a hero's mount bone yields
 *   hat_world = mount_world · conv(R_local) = conv(Unity hat-world)
 * i.e. the in-game seat, per-hero head shape included. Verified numerically
 * against the rig for all 12 heroes (see the mount-convention investigation).
 *
 * This SUPERSEDES the earlier "stand the mesh world-upright + auto-seat its bbox
 * bottom at the head-top" hack — that discarded the authored fit/tilt and looked
 * pasted-on (the bug the user kept hitting). The premise it rested on (skinned vs
 * standalone use different conversions) is simply false, per the glb data.
 */

/** Actions that end in a held pose; everything else loops until the player moves. */
const HOLD_END_ACTIONS = new Set(['sit', 'sleep', 'pose']);

/** Facing per protocol direction. down = toward the camera (+z). */
const DIR_YAW: Record<Direction, number> = {
  down: 0,
  up: Math.PI,
  left: -Math.PI / 2,
  right: Math.PI / 2,
};

abstract class PlayerBase {
  readonly group: THREE.Group;
  protected mixer: THREE.AnimationMixer;
  protected idle: THREE.AnimationAction | null;
  protected walk: THREE.AnimationAction | null;
  protected current: THREE.AnimationAction | null = null;
  protected clips: THREE.AnimationClip[];
  private materials: THREE.MeshStandardMaterial[];
  private equipped = new Map<EquipSlot, THREE.Object3D>();
  /** The base ("nude") body skinned mesh(es) from the character glb — the
   *  costume graft swaps geometry onto the first and hides any extras. */
  private bodyMeshes: THREE.SkinnedMesh[] = [];
  /** Active outfit graft (null = bare base body); `restore()` undoes it. */
  private outfitBinding: OutfitBinding | null = null;
  /** Currently-worn costume id, so a redundant re-apply is skipped. */
  private outfitId: string | null = null;
  /** Playing emote action (sit/dance/...); held until the player moves. */
  protected emoteAction: THREE.AnimationAction | null = null;
  /** Position in server pixel space. */
  readonly posPx = new THREE.Vector2();
  protected targetYaw = 0;
  moving = false;
  /** Terrain height under the feet (world units); smoothed toward each frame. */
  groundY = 0;
  /** Where the name/bubble anchors above the feet — measured per character. */
  private headUnits = HEAD_UNITS_FALLBACK;

  constructor(asset: CharacterAsset, x: number, y: number) {
    const inst: CharacterInstance = instantiateCharacter(asset);
    this.group = inst.group;
    this.mixer = inst.mixer;
    this.idle = inst.idle;
    this.walk = inst.walk;
    this.clips = inst.clips;
    this.materials = inst.materials;
    // The skinned body mesh(es); equipment (weapons/hats) are static meshes on
    // bones, so anything skinned here is body — safe to grab now, before equip.
    this.group.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) this.bodyMeshes.push(o as THREE.SkinnedMesh);
    });
    this.posPx.set(x, y);
    this.syncTransform(1);
    this.setAnim(false, true);
    this.measureHead();
  }

  /** Heroes range from tall wolves to squat pandas — anchor bubbles to the
   *  actual skeleton top instead of one fixed height. */
  private measureHead() {
    this.group.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    let maxY = 0;
    this.group.traverse((o) => {
      if (!(o as THREE.Bone).isBone) return;
      o.getWorldPosition(v);
      maxY = Math.max(maxY, v.y - this.group.position.y);
    });
    if (maxY > 0.5) this.headUnits = maxY + HEAD_MARGIN;
  }

  /**
   * Play an emote animation ('sit', 'dance', ... — 'chat' maps to the talk
   * clip). Plays once and freezes on the last frame (sitting stays seated,
   * sleeping stays down) until the player moves. Missing clips are ignored —
   * older exports don't carry every action yet.
   */
  playAction(emoteId: string) {
    const clipName = emoteId === 'chat' ? 'talk' : emoteId;
    const clip = this.clips.find((c) => c.name.toLowerCase().startsWith(clipName));
    if (!clip) return;

    const action = this.mixer.clipAction(clip);
    this.emoteAction?.stop();
    this.current?.fadeOut(ANIM_FADE);
    this.current = null;
    action.reset();
    if (HOLD_END_ACTIONS.has(emoteId)) {
      // sit/sleep/pose: play once, freeze on the final pose
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      // dance/cheer/talk/...: keep going like the idle loop does
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    action.fadeIn(ANIM_FADE).play();
    this.emoteAction = action;
  }

  /** ยกเลิกท่า emote ที่ค้างอยู่ (เช่นท่านั่งตกปลา) — เฟดกลับ idle ทันที
   *  โดยไม่ต้องรอผู้เล่นขยับ (setAnim ปกติปลดเฉพาะตอนเดิน) */
  stopAction() {
    if (!this.emoteAction) return;
    this.emoteAction.fadeOut(ANIM_FADE);
    this.emoteAction = null;
    const next = this.idle ?? this.walk;
    if (next) {
      next.reset().fadeIn(ANIM_FADE).play();
      this.current = next;
    }
  }

  /** Swap the *base body* texture (color + face composite from CharacterAsset).
   *  While a costume is worn the base body is hidden, but its material still
   *  gets the texture so it's correct the moment the costume comes off. */
  setBodyTexture(tex: THREE.Texture) {
    for (const m of this.materials) {
      m.map = tex;
      m.needsUpdate = true;
    }
  }

  /**
   * Wear a costume body (or clear it, restoring the nude base). `costume` is a
   * fresh SkinnedMesh from CostumeLoader; we graft it onto the base body mesh
   * so it deforms with the shared rig — the same whole-body swap the game does.
   * `id` lets a redundant re-apply of the same costume be skipped.
   */
  setOutfit(costume: THREE.SkinnedMesh | null, id: string | null = null) {
    if (this.outfitBinding && this.outfitId === id && costume) return; // already on
    // Drop any current graft first (back to the nude base body).
    if (this.outfitBinding) {
      this.outfitBinding.restore();
      this.outfitBinding = null;
      this.outfitId = null;
    }
    for (const m of this.bodyMeshes) m.visible = true;
    if (!costume) return;

    const base = this.bodyMeshes[0];
    if (!base) return;
    const binding = applyOutfit(base, costume);
    if (!binding) return; // graft failed — stay nude (logged in applyOutfit)
    // Multi-mesh rigs (rare): the costume is one full body, so hide extra base
    // meshes while it's worn.
    for (let i = 1; i < this.bodyMeshes.length; i++) this.bodyMeshes[i].visible = false;
    this.outfitBinding = binding;
    this.outfitId = id;
  }

  /** Overlay the player's chosen face onto the worn costume's atlas. No-op when
   *  no costume is on (the base body carries the face via setBodyTexture). */
  setOutfitTexture(tex: THREE.Texture) {
    if (!this.outfitBinding) return;
    for (const m of this.outfitBinding.materials) {
      m.map = tex;
      m.needsUpdate = true;
    }
  }

  /**
   * Attach (or clear) an equipment mesh on a mount bone. The mesh follows the
   * bone through animation because it's parented to it. Hats reproduce the game's
   * equip verbatim by keeping their baked rotation (see HAT PLACEMENT); weapons
   * are placed geometrically (see WEAPON PLACEMENT). `hero` selects the head bone
   * for hats.
   */
  setEquipment(slot: EquipSlot, obj: THREE.Object3D | null, hero = '', mirror = false) {
    const prev = this.equipped.get(slot);
    if (prev) {
      prev.parent?.remove(prev);
      this.equipped.delete(slot);
    }
    if (!obj) return;
    const bone = this.findBone(mountPatterns(hero, slot));
    if (!bone) {
      console.warn(`[player] mount bone for '${slot}' not found on this rig`);
      return;
    }
    if (slot === 'hat') {
      this.seatHat(obj, bone);
      this.equipped.set(slot, obj);
      return;
    }
    // Weapons: place geometrically (see WEAPON PLACEMENT note). `mirror` flips the
    // off-hand copy (scale −Y) so a dual-wielder's reused main-hand mesh sits
    // symmetrically on the mirrored left bone instead of pointing the wrong way.
    this.seatWeapon(obj, bone, mirror);
    this.equipped.set(slot, obj);
  }

  /**
   * WEAPON PLACEMENT. Like hats (see HAT PLACEMENT), equipment was exported from
   * Unity as a STANDALONE static mesh while the rig is SKINNED — the two go
   * through different coordinate conversions, so a weapon's baked rotation does
   * NOT compose onto the hand mount bone (the long-standing "grip wrong on every
   * hero" bug). So we strip the baked rotation and place the weapon
   * geometrically: point its long axis (blade, authored grip-at-origin extending
   * along one axis) down the forearm→hand line. That reproduces a relaxed grip —
   * e.g. wolf's novice swords hang blade-down — and self-adjusts per rig because
   * it reads each hero's actual arm direction. Compact items with no long axis
   * (fist-worn gauntlets) just seat at the hand.
   */
  private seatWeapon(obj: THREE.Object3D, bone: THREE.Object3D, mirror: boolean) {
    obj.traverse((o) => o.quaternion.identity()); // drop the mis-framed baked rot
    obj.scale.set(1, mirror ? -1 : 1, 1);
    obj.position.set(0, 0, 0);

    const axis = this.longAxis(obj); // null → compact/fist-worn, leave as-is
    bone.add(obj);
    if (!axis) return;

    bone.updateWorldMatrix(true, false);
    const dir = this.forearmDir(bone);
    if (!dir) return;
    const boneQ = bone.getWorldQuaternion(new THREE.Quaternion());
    const dirLocal = dir.applyQuaternion(boneQ.invert()).normalize();
    obj.quaternion.setFromUnitVectors(axis, dirLocal);
  }

  /** The item's dominant local axis (unit vector) pointing away from the grip at
   *  the origin, or null when the item is roughly compact (no clear long axis). */
  private longAxis(obj: THREE.Object3D): THREE.Vector3 | null {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    const size = box.getSize(new THREE.Vector3());
    const ax = ['x', 'y', 'z'] as const;
    let li = 0;
    for (let i = 1; i < 3; i++) if (size[ax[i]] > size[ax[li]]) li = i;
    const others = [0, 1, 2].filter((i) => i !== li).map((i) => size[ax[i]]);
    if (size[ax[li]] / Math.max(1e-4, Math.max(...others)) < 2) return null;
    const v = new THREE.Vector3();
    v[ax[li]] = Math.abs(box.max[ax[li]]) >= Math.abs(box.min[ax[li]]) ? 1 : -1;
    return v;
  }

  /** World-space direction the arm points toward the hand mount (grip line). */
  private forearmDir(handBone: THREE.Object3D): THREE.Vector3 | null {
    const parent = handBone.parent;
    if (!parent) return null;
    const hp = handBone.getWorldPosition(new THREE.Vector3());
    const pp = parent.getWorldPosition(new THREE.Vector3());
    const d = hp.sub(pp);
    return d.lengthSq() < 1e-8 ? null : d.normalize();
  }

  /**
   * Seat a hat on the head EXACTLY as the game does (see the HAT PLACEMENT note):
   * parent to the crown mount, zero the mount-local position, and KEEP the baked
   * rotation (= conv(prefab rotation)). The hat then rides the head through
   * animation because it's parented to the mount bone.
   */
  private seatHat(obj: THREE.Object3D, bone: THREE.Object3D) {
    // The game parents the prefab ROOT to the mount with localPosition = 0 and
    // keeps its authored rotation; scale is 1 on every hat prefab. Zero the
    // wrapper AND the prefab root node(s): loadEquipment strips big showcase
    // translations, but a few hats (halo, ligerMask) keep a small ~9u leftover
    // that would otherwise fling them off the head. Do NOT touch the rotations —
    // the glb's baked rotation already IS the correct mount-local rotation
    // (Unity→glTF conversion is a homomorphism, so it composes on the mount bone).
    obj.position.set(0, 0, 0);
    obj.scale.set(1, 1, 1);
    for (const root of obj.children) root.position.set(0, 0, 0);
    bone.add(obj);

    // Fallback: heroes with no crown empty (penguin/whale) mount on the `Head`
    // bone itself, which sits at head-CENTRE. Nudge the hat straight up to the
    // skull top so it rests on the crown; orientation is left untouched.
    if (/^head$/i.test(bone.name)) {
      bone.updateWorldMatrix(true, false);
      const boneY = bone.getWorldPosition(new THREE.Vector3()).y;
      const lift = this.bodyTopWorldY() - boneY;
      if (lift > 0) {
        const mountQ = bone.getWorldQuaternion(new THREE.Quaternion());
        const mountS = bone.getWorldScale(new THREE.Vector3());
        obj.position.copy(
          new THREE.Vector3(0, lift, 0).applyQuaternion(mountQ.invert()).divide(mountS),
        );
      }
    }
  }

  /** World-space Y of the top of the body mesh(es) — the head-top the hat seats
   *  onto. Uses bind-pose geometry bounds (character stands ~upright). */
  private bodyTopWorldY(): number {
    const box = new THREE.Box3();
    for (const m of this.bodyMeshes) box.expandByObject(m);
    return box.isEmpty() ? this.group.position.y + this.headUnits : box.max.y;
  }

  private findBone(patterns: RegExp[]): THREE.Object3D | null {
    // Patterns are tried in priority order; within a pattern, first match wins
    // (the `$` anchors already exclude the grafted `_1` duplicate bones).
    for (const re of patterns) {
      let found: THREE.Object3D | null = null;
      this.group.traverse((o) => {
        if (!found && re.test(o.name)) found = o;
      });
      if (found) return found;
    }
    return null;
  }

  get headPos(): THREE.Vector3 {
    return new THREE.Vector3(
      this.posPx.x * PX_TO_UNIT,
      this.group.position.y + this.headUnits,
      this.posPx.y * PX_TO_UNIT,
    );
  }

  protected setAnim(moving: boolean, instant = false) {
    if (this.emoteAction) {
      if (!moving) return; // hold the emote pose while standing still
      this.emoteAction.fadeOut(ANIM_FADE);
      this.emoteAction = null;
    }
    const next = moving ? (this.walk ?? this.idle) : (this.idle ?? this.walk);
    if (!next || next === this.current) return;
    if (instant || !this.current) {
      this.current?.stop();
      next.reset().play();
    } else {
      next.reset().fadeIn(ANIM_FADE).play();
      this.current.fadeOut(ANIM_FADE);
    }
    this.current = next;
  }

  protected syncTransform(dt: number) {
    // Ease vertically toward the sampled terrain height (no snapping pops).
    const y = this.group.position.y + (this.groundY - this.group.position.y) * Math.min(1, 14 * dt);
    this.group.position.set(this.posPx.x * PX_TO_UNIT, y, this.posPx.y * PX_TO_UNIT);
    // Shortest-arc turn toward targetYaw.
    let diff = this.targetYaw - this.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.group.rotation.y += diff * Math.min(1, TURN_SPEED * dt);
  }

  updateMixer(dt: number) {
    this.mixer.update(dt);
  }
}

/** Keyboard-driven local player; movement in px/s to stay protocol-compatible. */
export class LocalPlayer3D extends PlayerBase {
  direction: Direction = 'down';

  /**
   * `input` is the desired move vector in screen terms (x right, y down),
   * unnormalized. `canWalk` gates each axis separately so hitting a wall
   * diagonally still slides along it (walkmask collision).
   */
  update(
    dt: number,
    input: THREE.Vector2,
    canWalk: (pxX: number, pxY: number) => boolean = () => true,
  ) {
    const len = input.length();
    let moved = false;
    if (len > 0) {
      const v = input.clone().divideScalar(len).multiplyScalar(CONFIG.PLAYER_SPEED * dt);
      const nx = this.posPx.x + v.x;
      if (v.x !== 0 && canWalk(nx, this.posPx.y)) {
        this.posPx.x = nx;
        moved = true;
      }
      const ny = this.posPx.y + v.y;
      if (v.y !== 0 && canWalk(this.posPx.x, ny)) {
        this.posPx.y = ny;
        moved = true;
      }
      // Face the intended direction even when blocked.
      this.targetYaw = Math.atan2(input.x, input.y);
      this.direction =
        Math.abs(input.x) >= Math.abs(input.y)
          ? input.x < 0 ? 'left' : 'right'
          : input.y < 0 ? 'up' : 'down';
    }
    this.moving = moved;
    this.setAnim(this.moving);
    this.syncTransform(dt);
    this.updateMixer(dt);
  }
}

/** Remote players lerp toward the last reported position (10 Hz updates). */
export class RemotePlayer3D extends PlayerBase {
  private targetPx = new THREE.Vector2();

  constructor(
    asset: CharacterAsset,
    state: PlayerState,
    /** The speaker's character def — used for emote faces etc. */
    readonly characterId: string,
  ) {
    super(asset, state.x, state.y);
    this.targetPx.set(state.x, state.y);
    this.targetYaw = DIR_YAW[state.dir];
  }

  applyMove(p: { x: number; y: number; dir: Direction; moving: boolean }) {
    this.targetPx.set(p.x, p.y);
    this.targetYaw = DIR_YAW[p.dir];
    this.moving = p.moving;
  }

  update(dt: number) {
    this.posPx.lerp(this.targetPx, CONFIG.LERP);
    this.setAnim(this.moving);
    this.syncTransform(dt);
    this.updateMixer(dt);
  }
}
