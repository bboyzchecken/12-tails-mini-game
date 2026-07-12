import * as THREE from 'three';
import { CONFIG } from '@12tails/shared/config';
import type { Direction, PlayerState } from '@12tails/shared/events';
import { instantiateCharacter, type CharacterAsset, type CharacterInstance } from './CharacterAsset';
import { MOUNT_BONE, type EquipSlot } from './EquipmentLoader';

/** Server keeps 2D pixel coords (x right, y down). 3D maps px → tiles: x→x, y→z. */
export const PX_TO_UNIT = 1 / CONFIG.TILE;
/** Fallback bubble height when a skeleton can't be measured. */
const HEAD_UNITS_FALLBACK = 2.0;
/** Clearance above the top of the head for name/bubble anchors. */
const HEAD_MARGIN = 0.25;

const ANIM_FADE = 0.18;
const TURN_SPEED = 12; // rad/s toward target yaw

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

  /** Swap the body texture (color + face composite) from CharacterAsset. */
  setBodyTexture(tex: THREE.Texture) {
    for (const m of this.materials) {
      m.map = tex;
      m.needsUpdate = true;
    }
  }

  /**
   * Attach (or clear) an equipment mesh on a mount bone. The mesh follows the
   * bone through animation because it's parented to it. Its own root carries
   * the mount-local transform from Unity.
   */
  setEquipment(slot: EquipSlot, obj: THREE.Object3D | null) {
    const prev = this.equipped.get(slot);
    if (prev) {
      prev.parent?.remove(prev);
      this.equipped.delete(slot);
    }
    if (!obj) return;
    const bone = this.findBone(MOUNT_BONE[slot]);
    if (!bone) {
      console.warn(`[player] mount bone '${MOUNT_BONE[slot]}' not found`);
      return;
    }
    bone.add(obj);
    this.equipped.set(slot, obj);
  }

  private findBone(name: string): THREE.Object3D | null {
    // Case-insensitive: rigs disagree on casing (mount_Overhead vs mount_OverHead).
    // First match wins — the grafted costume skeleton adds `_1` duplicates and the
    // primary (un-suffixed) bone comes first in traversal order.
    const want = name.toLowerCase();
    let found: THREE.Object3D | null = null;
    this.group.traverse((o) => {
      if (!found && o.name.toLowerCase() === want) found = o;
    });
    return found;
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
