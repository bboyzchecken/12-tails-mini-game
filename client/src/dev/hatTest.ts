import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Standalone hat-mount test harness (dev only). Loads a character glb + a hat
 * glb, attaches the hat to the head mount bone under a chosen correction mode,
 * and frames the head so we can SEE whether the hat sits on the crown.
 *
 *   /dev-hat-test.html?hero=chameleon&hat=fanKingHat&mode=baked
 *
 * Console API:
 *   setMode('baked'|'rz180'|'y180'|'x180'|'x90'|'xm90')  — swap correction
 *   setQuat(x,y,z,w)   — attach with an arbitrary wrapper quaternion
 *   capture()          — returns a 260px jpeg dataURL of the current view
 */

const params = new URLSearchParams(location.search);
const hero = params.get('hero') ?? 'chameleon';
const hatId = params.get('hat') ?? 'fanKingHat';
const hud = document.getElementById('hud')!;

// Fixed render size — the headless browser pane can report a 0×0 viewport, so
// never size to the window.
const RW = 300, RH = 340;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88aa66);
const camera = new THREE.PerspectiveCamera(35, RW / RH, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH);
renderer.domElement.style.cssText = 'position:fixed;top:0;right:0';
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.4));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(1, 2, 1.5);
scene.add(dir);

const loader = new GLTFLoader();
const load = (url: string) => loader.loadAsync(url);

let mountBone: THREE.Object3D | null = null;
let headBone: THREE.Object3D | null = null;
let hatTemplate: THREE.Object3D | null = null;
let hatNodeBaked = new THREE.Quaternion();
let current: THREE.Object3D | null = null;

const MOUNT_RE = [/^mount_?overhead$/i, /^mount_?head$/i, /^head$/i];
function findBone(re: RegExp[]): THREE.Object3D | null {
  for (const r of re) {
    let f: THREE.Object3D | null = null;
    charRoot!.traverse((o) => { if (!f && r.test(o.name)) f = o; });
    if (f) return f;
  }
  return null;
}

let charRoot: THREE.Object3D | null = null;

async function boot() {
  const [charGltf, hatGltf] = await Promise.all([
    load(`assets/models/${hero}.glb`),
    load(`assets/equipment/${hero}/hat/${hatId}.glb`),
  ]);
  charRoot = charGltf.scene;
  charRoot.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.frustumCulled = false;
      const m = o.material as THREE.MeshStandardMaterial;
      if (m) { m.roughness = 1; m.metalness = 0; m.side = THREE.DoubleSide; }
    }
  });
  scene.add(charRoot);
  charRoot.updateMatrixWorld(true);

  mountBone = findBone(MOUNT_RE);
  headBone = findBone([/^head$/i]);

  // Calibration markers: RED sphere = Head bone (head centre), BLUE = crown
  // mount. Lets us see where the bones sit relative to the visible head mesh.
  const mk = (bone: THREE.Object3D | null, color: number) => {
    if (!bone) return;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshBasicMaterial({ color, depthTest: false }));
    s.renderOrder = 999;
    bone.add(s);
  };
  mk(headBone, 0xff0000);
  mk(mountBone, 0x2244ff);

  // capture the hat node's baked local rotation, then normalise the template so
  // its mesh sits at identity (raw mesh-local) under our wrapper.
  hatTemplate = hatGltf.scene;
  hatTemplate.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.frustumCulled = false;
      const m = o.material as THREE.MeshStandardMaterial;
      if (m) { m.roughness = 1; m.metalness = 0; m.side = THREE.DoubleSide; }
    }
    if (o.position.length() > 10) o.position.set(0, 0, 0);
  });
  // the single hat node carries the baked rotation
  const node = hatTemplate.children[0] ?? hatTemplate;
  hatNodeBaked = node.quaternion.clone();

  charRoot.updateMatrixWorld(true);
  bodyTopY = new THREE.Box3().setFromObject(charRoot).max.y;
  frameHead();
  setMode(params.get('mode') ?? 'baked');
  animate();
}
let bodyTopY = 0;

let headWorld = new THREE.Vector3();
function frameHead() {
  (headBone ?? charRoot!).getWorldPosition(headWorld);
  const p = headWorld;
  camera.position.set(p.x + 0.7, p.y + 0.45, p.z + 1.35);
  camera.lookAt(p.x, p.y + 0.25, p.z);
}

function attach(wrapper: THREE.Quaternion, keepBaked: boolean) {
  if (current) { current.parent?.remove(current); current = null; }
  if (!mountBone || !hatTemplate) return;
  const obj = hatTemplate.clone(true);
  // strip the baked rotation on the inner node when we don't want it doubled
  const node = obj.children[0] ?? obj;
  if (!keepBaked) node.quaternion.identity();
  obj.position.set(0, 0, 0);
  obj.quaternion.copy(wrapper);
  mountBone.add(obj);
  current = obj;
}

// correction modes -------------------------------------------------------
const Z180 = new THREE.Quaternion(0, 0, 1, 0);
const Y180 = new THREE.Quaternion(0, 1, 0, 0);
const X180 = new THREE.Quaternion(1, 0, 0, 0);
const X90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const Xm90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

function setMode(mode: string) {
  if (mode === 'none') {
    if (current) { current.parent?.remove(current); current = null; }
    hud.textContent = `${hero} / no hat\nmount=${mountBone?.name}`;
    return;
  }
  if (mode.startsWith('up_')) {
    const [, spin, drop] = mode.split('_');
    upright(Number(spin), Number(drop));
    return;
  }
  if (mode.startsWith('seat_')) {
    const [, spin, fudge] = mode.split('_');
    seat(Number(spin), Number(fudge));
    return;
  }
  let wrapper = new THREE.Quaternion();
  let keepBaked = true;
  const b = hatNodeBaked;
  switch (mode) {
    case 'baked': wrapper.identity(); break; // current buggy behaviour
    case 'c2': // frame fix: baked with z,w negated (C1→C2), mesh raw
      wrapper.set(b.x, b.y, -b.z, -b.w); keepBaked = false; break;
    case 'c2b': // alt sign convention
      wrapper.set(-b.x, -b.y, b.z, b.w); keepBaked = false; break;
    case 'c2xy': // baked with x,y negated
      wrapper.set(-b.x, -b.y, b.z, b.w); keepBaked = false; break;
    case 'game': { // exact frame round-trip: item(C1) → Unity → char(C2)
      const Qu = new THREE.Quaternion(b.x, -b.y, -b.z, b.w); // C1⁻¹(baked)
      mountBone!.updateWorldMatrix(true, false);
      const mg = mountBone!.getWorldQuaternion(new THREE.Quaternion());
      const uMount = new THREE.Quaternion(mg.x, -mg.y, mg.z, -mg.w); // C2⁻¹
      const uHat = uMount.multiply(Qu);
      const target = new THREE.Quaternion(uHat.x, -uHat.y, uHat.z, -uHat.w); // C2
      wrapper.copy(mg.clone().invert().multiply(target));
      keepBaked = false; break;
    }
    case 'rz180': // Rz180 * baked * Rz180^-1  (negate x,y) as replacement
      wrapper.copy(Z180).multiply(hatNodeBaked).multiply(Z180.clone().invert());
      keepBaked = false; break;
    case 'y180': wrapper.copy(Y180); break;       // baked, then +180 about Y (world side)
    case 'x180': wrapper.copy(X180); break;
    case 'x90': wrapper.copy(X90); break;
    case 'xm90': wrapper.copy(Xm90); break;
    default: wrapper.identity();
  }
  attach(wrapper, keepBaked);
  hud.textContent = `${hero} / ${hatId}\nmode=${mode}\nmount=${mountBone?.name}`;
  (window as any).__mode = mode;
}

function setQuat(x: number, y: number, z: number, w: number) {
  attach(new THREE.Quaternion(x, y, z, w).normalize(), false);
  hud.textContent = `${hero} / ${hatId}\nquat=(${x},${y},${z},${w})`;
}

/**
 * Place the hat in WORLD-upright orientation: the mesh's long axis (local +Z =
 * ring→star) points world-up, spun `spinDeg` about world-Y to face front, then
 * dropped `dropY` world-units so the ring sits on the head. Computed in world
 * space and converted into the mount bone's local frame.
 */
function upright(spinDeg: number, dropY: number) {
  if (current) { current.parent?.remove(current); current = null; }
  if (!mountBone || !hatTemplate) return;
  const obj = hatTemplate.clone(true);
  const node = obj.children[0] ?? obj;
  node.quaternion.identity(); // drop baked rotation → raw mesh-local

  mountBone.updateWorldMatrix(true, false);
  const mountQ = mountBone.getWorldQuaternion(new THREE.Quaternion());
  const mountS = mountBone.getWorldScale(new THREE.Vector3());
  // world target: +Z(star) → +Y(up) via Rx(-90), then spin about world Y
  const targetW = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), (spinDeg * Math.PI) / 180)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
  obj.quaternion.copy(mountQ.clone().invert().multiply(targetW));
  // world drop → mount-local
  obj.position.copy(new THREE.Vector3(0, -dropY, 0).applyQuaternion(mountQ.clone().invert()).divide(mountS));
  mountBone.add(obj);
  current = obj;
  hud.textContent = `${hero}/${hatId} upright spin=${spinDeg} drop=${dropY}`;
}

/**
 * Upright orientation + auto-seat: place the hat world-upright, then translate
 * it so the BOTTOM of its bounding box sits at the mount height (+fudge). This
 * cancels per-hat size differences with no manual drop.
 */
function seat(spinDeg: number, fudgeY: number) {
  upright(spinDeg, 0);
  if (!current || !mountBone) return;
  current.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(current);
  const dy = box.min.y - (bodyTopY + fudgeY); // >0 means bottom is above target
  const mountS = mountBone.getWorldScale(new THREE.Vector3());
  const mountQ = mountBone.getWorldQuaternion(new THREE.Quaternion());
  // subtract dy in world-Y, expressed in mount-local, added to existing local pos
  const delta = new THREE.Vector3(0, -dy, 0).applyQuaternion(mountQ.clone().invert()).divide(mountS);
  current.position.add(delta);
  hud.textContent = `${hero}/${hatId} seat spin=${spinDeg} fudge=${fudgeY}`;
}

function capture(): string {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/jpeg', 0.7);
}

/** Render several correction modes side-by-side into one labelled image. */
function captureMontage(modes: string[]): string {
  const cw = 260, ch = 300;
  const c = document.createElement('canvas');
  c.width = cw * modes.length; c.height = ch;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, c.width, c.height);
  modes.forEach((m, i) => {
    setMode(m);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, i * cw, 0, cw, ch);
    ctx.fillStyle = '#000'; ctx.fillRect(i * cw, 0, 70, 16);
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    ctx.fillText(m, i * cw + 3, 11);
  });
  return c.toDataURL('image/jpeg', 0.5);
}

let running = true;
function animate() {
  if (!running) return;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/** Freeze the WebGL loop, render the montage into a plain <img> that fills the
 *  page, and hide the live canvas — so the normal screenshot tool (which only
 *  times out on a live WebGL context) can capture it. */
function showMontage(modes: string[]) {
  const url = captureMontage(modes);
  running = false;
  renderer.domElement.style.display = 'none';
  let img = document.getElementById('shot') as HTMLImageElement | null;
  if (!img) {
    img = document.createElement('img');
    img.id = 'shot';
    img.style.cssText = 'position:fixed;inset:0;width:100%;height:auto;image-rendering:pixelated;background:#333';
    document.body.appendChild(img);
  }
  img.src = url;
  hud.textContent = 'montage: ' + modes.join('  ');
}

(window as any).setMode = setMode;
(window as any).setQuat = setQuat;
(window as any).capture = capture;
(window as any).captureMontage = captureMontage;
(window as any).showMontage = showMontage;
(window as any).saveShot = async (name: string, modes: string[]) => {
  const data = captureMontage(modes);
  const r = await fetch('/__shot', { method: 'POST', body: JSON.stringify({ name, data }) });
  return r.ok ? 'saved ' + name : 'FAIL ' + (await r.text());
};
boot().catch((e) => { hud.textContent = 'ERROR: ' + e.message; console.error(e); });
