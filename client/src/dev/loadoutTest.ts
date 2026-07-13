import * as THREE from 'three';
import { CONFIG } from '@12tails/shared/config';
import type { Appearance } from '@12tails/shared/events';
import {
  loadCharacterAsset,
  buildAppearanceTexture,
  buildOutfitTexture,
} from '../three/CharacterAsset';
import { LocalPlayer3D } from '../three/Player3D';
import { loadEquipment, equipmentUrl } from '../three/EquipmentLoader';
import { loadCostume, costumeUrl } from '../three/CostumeLoader';
import { dualWieldHands, defaultWeapon } from '../ui/equipmentIndex';

/**
 * Standalone loadout test harness (dev only). Loads each hero with the starter
 * kit — 'scout' body costume + its novice weapon — using the REAL Player3D /
 * EquipmentLoader / CostumeLoader code paths, so what shows here is exactly what
 * the game does. Renders a 12-hero montage into a static <img> so the screenshot
 * tool can capture it (the live WebGL context otherwise times out).
 *
 *   /dev-loadout-test.html                 → montage of all 12 (auto)
 *   /dev-loadout-test.html?hero=panda      → single hero, rotating, close-up
 *
 * Console API: shoot() · montage() · setYaw(r)
 */

const HEROES = [
  'bat', 'bison', 'cat', 'chameleon', 'mole', 'monkey',
  'panda', 'penguin', 'rabbit', 'sheep', 'whale', 'wolf',
];

const params = new URLSearchParams(location.search);
const soloHero = params.get('hero');
const hud = document.getElementById('hud')!;

const RW = 300, RH = 360;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88aa66);
const camera = new THREE.PerspectiveCamera(32, RW / RH, 0.01, 100);
camera.position.set(0, 1.05, 4.4);
camera.lookAt(0, 0.95, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH);
renderer.domElement.style.cssText = 'position:fixed;top:0;right:0';
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.5));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(1, 2, 1.5);
scene.add(dir);

const NO_OUTFIT = params.has('noOutfit');
const NO_WEAPON = params.has('noWeapon');

/** Build one hero wearing the starter kit, using the real game code. */
async function buildHero(hero: string): Promise<{ player: LocalPlayer3D; weapon: string | null }> {
  const asset = await loadCharacterAsset({ id: hero, model: `assets/models/${hero}.glb` });
  const weapon = NO_WEAPON ? null : await defaultWeapon(hero);
  const outfit = NO_OUTFIT ? null : CONFIG.DEFAULT_OUTFIT;
  const color = Number(params.get('color') ?? 0) || 0;
  const app: Appearance = { color, face: 0, outfit, weapon };
  const player = new LocalPlayer3D(asset, 0, 0);
  player.groundY = 0;

  // Outfit (whole-body costume graft) — same as World3D.applyAppearance.
  if (outfit) {
    const costume = await loadCostume(costumeUrl(hero, outfit));
    player.setOutfit(costume, outfit);
    const otex = await buildOutfitTexture(hero, outfit, app);
    if (otex) player.setOutfitTexture(otex);
  }
  const btex = await buildAppearanceTexture(hero, app);
  if (btex) player.setBodyTexture(btex);

  // Weapon — replicate World3D.applyEquipment (incl. wolf dual-wield).
  if (weapon) {
    const { right, left } = await dualWieldHands(hero, weapon);
    player.setEquipment('weapon', await loadEquipment(equipmentUrl(hero, 'weapon', right)), hero);
    const mirrorOff = left != null && left === right;
    player.setEquipment(
      'weaponL',
      left ? await loadEquipment(equipmentUrl(hero, 'weapon', left)) : null,
      hero,
      mirrorOff,
    );
  }
  return { player, weapon };
}

/** Advance the idle animation to a stable pose (bones settle off bind pose). */
function settle(player: LocalPlayer3D) {
  for (let k = 0; k < 12; k++) player.updateMixer(1 / 30);
  player.group.updateMatrixWorld(true);
}

let solo: LocalPlayer3D | null = null;
let yaw = -0.6;

async function bootSolo(hero: string) {
  const { player, weapon } = await buildHero(hero);
  solo = player;
  scene.add(player.group);
  hud.textContent = `${hero}  ·  scout  ·  ${weapon ?? '(no weapon)'}`;
  animate();
}

async function montage() {
  const cols = 4, cw = 200, ch = 250;
  const rows = Math.ceil(HEROES.length / cols);
  const out = document.createElement('canvas');
  out.width = cols * cw; out.height = rows * ch;
  const octx = out.getContext('2d')!;
  octx.fillStyle = '#2a2f26'; octx.fillRect(0, 0, out.width, out.height);

  for (let i = 0; i < HEROES.length; i++) {
    const hero = HEROES[i];
    hud.textContent = `montage… ${hero} (${i + 1}/${HEROES.length})`;
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    let label = `${hero}  ?`;
    try {
      const { player, weapon } = await buildHero(hero);
      label = `${hero}  ${weapon ?? '-'}`;
      player.group.rotation.y = yaw;
      scene.add(player.group);
      settle(player);
      renderer.render(scene, camera);
      octx.drawImage(renderer.domElement, x, y, cw, ch);
      scene.remove(player.group);
    } catch (e) {
      console.error(`[loadout] ${hero} FAILED`, e);
      label = `${hero}  ERR: ${(e as Error).message?.slice(0, 22)}`;
    }
    octx.fillStyle = 'rgba(0,0,0,0.6)'; octx.fillRect(x, y, cw, 16);
    octx.fillStyle = '#fff'; octx.font = '11px monospace';
    octx.fillText(label, x + 4, y + 12);
  }
  showImg(out.toDataURL('image/jpeg', 0.6));
  hud.textContent = 'montage ready';
}

let running = false;
function animate() {
  if (!running) running = true; else { /* already looping */ }
  const loop = () => {
    if (!running) return;
    requestAnimationFrame(loop);
    if (solo) { settle(solo); }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
}

/** Freeze WebGL + show the capture as a plain <img> so screenshots work. */
function showImg(url: string) {
  running = false;
  renderer.domElement.style.display = 'none';
  let img = document.getElementById('shot') as HTMLImageElement | null;
  if (!img) {
    img = document.createElement('img');
    img.id = 'shot';
    img.style.cssText = 'position:fixed;inset:0;width:100%;height:auto;background:#333';
    document.body.appendChild(img);
  }
  img.src = url;
}

function shoot(): void {
  renderer.render(scene, camera);
  showImg(renderer.domElement.toDataURL('image/jpeg', 0.7));
}

function setYaw(r: number) {
  yaw = r;
  if (solo) solo.group.rotation.y = r;
}

(window as unknown as Record<string, unknown>).montage = montage;
(window as unknown as Record<string, unknown>).shoot = shoot;
(window as unknown as Record<string, unknown>).setYaw = setYaw;

if (soloHero) void bootSolo(soloHero);
else void montage();
