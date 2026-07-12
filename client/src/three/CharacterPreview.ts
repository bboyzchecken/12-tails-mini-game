import * as THREE from 'three';
import type { Appearance } from '@12tails/shared/events';
import type { CharacterDef } from '../manifest';
import {
  loadCharacterAsset,
  instantiateCharacter,
  buildAppearanceTexture,
  type CharacterInstance,
} from './CharacterAsset';

/**
 * A small self-contained 3D viewer for the character-select screen: shows one
 * hero slowly turning, with the chosen color/face applied live. Its own tiny
 * renderer — disposed before the world's renderer starts so we don't leak GL
 * contexts.
 */
export class CharacterPreview {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private mixer: THREE.AnimationMixer | null = null;
  private current: CharacterInstance | null = null;
  private currentId = '';
  private loadSeq = 0;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.resize();
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, this.aspect(), 0.1, 100);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9099b0, 2.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.3);
    dir.position.set(2, 5, 3);
    this.scene.add(dir);

    this.renderer.setAnimationLoop(() => this.tick());
    window.addEventListener('resize', this.onResize);
  }

  private aspect() {
    const r = this.container.getBoundingClientRect();
    return Math.max(0.1, r.width) / Math.max(0.1, r.height);
  }

  private resize() {
    const r = this.container.getBoundingClientRect();
    this.renderer.setSize(r.width, r.height, false);
  }

  private onResize = () => {
    this.resize();
    this.camera.aspect = this.aspect();
    this.camera.updateProjectionMatrix();
  };

  /** Swap the shown character (loads its glb, plays idle, frames the camera). */
  async setCharacter(def: CharacterDef, appearance: Appearance) {
    const seq = ++this.loadSeq;
    const asset = await loadCharacterAsset(def);
    if (seq !== this.loadSeq) return; // a newer selection won the race

    if (this.current) this.scene.remove(this.current.group);
    this.current = instantiateCharacter(asset);
    this.currentId = def.id;
    this.scene.add(this.current.group);

    this.mixer = this.current.mixer;
    (this.current.idle ?? this.current.walk)?.play();

    this.frame(this.current.group);
    await this.setAppearance(appearance);
  }

  /** Apply color/face to the shown character. */
  async setAppearance(appearance: Appearance) {
    if (!this.current) return;
    const inst = this.current;
    const tex = await buildAppearanceTexture(this.currentId, appearance);
    if (tex && this.current === inst) {
      for (const m of inst.materials) {
        m.map = tex;
        m.needsUpdate = true;
      }
    }
  }

  private frame(obj: THREE.Object3D) {
    obj.position.set(0, 0, 0);
    obj.rotation.y = 0;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const h = Math.max(size.y, 1);
    this.camera.position.set(0, center.y + h * 0.1, h * 2.4);
    this.camera.lookAt(0, center.y, 0);
  }

  private tick() {
    const dt = this.clock.getDelta();
    if (this.current) this.current.group.rotation.y += dt * 0.6;
    this.mixer?.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
