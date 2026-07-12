import * as THREE from 'three';
import { loadEquipment, equipmentUrl, type EquipSlot } from '../three/EquipmentLoader';

/**
 * Runtime 3D thumbnails for equipment: render each weapon/hat glb once into a
 * tiny offscreen canvas and hand back a data-URL. Cached per item for the
 * session; only items actually shown get rendered. (The rip has no 2D item
 * icons, and live renders look better anyway.)
 */
const SIZE = 96;

let renderer: THREE.WebGLRenderer | null = null;
const memo = new Map<string, Promise<string | null>>();

function getRenderer(): THREE.WebGLRenderer {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // needed for toDataURL
    });
    renderer.setSize(SIZE, SIZE);
  }
  return renderer;
}

export function getEquipThumb(hero: string, slot: EquipSlot, id: string): Promise<string | null> {
  const key = `${hero}/${slot}/${id}`;
  let p = memo.get(key);
  if (!p) {
    p = make(hero, slot, id);
    memo.set(key, p);
  }
  return p;
}

async function make(hero: string, slot: EquipSlot, id: string): Promise<string | null> {
  try {
    const obj = await loadEquipment(equipmentUrl(hero, slot, id));
    if (!obj) return null;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b8b9e, 2.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 3, 4);
    scene.add(dir);
    scene.add(obj);

    // Frame by bounding box (equipment transforms are cleaned by the loader).
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const d = Math.max(size.x, size.y, size.z) || 1;
    const cam = new THREE.PerspectiveCamera(35, 1, d / 100, d * 10);
    cam.position.set(center.x + d * 0.9, center.y + d * 0.7, center.z + d * 1.35);
    cam.lookAt(center);

    const r = getRenderer();
    r.render(scene, cam);
    return r.domElement.toDataURL();
  } catch {
    return null;
  }
}
