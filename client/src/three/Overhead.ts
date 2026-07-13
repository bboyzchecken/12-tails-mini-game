import * as THREE from 'three';
import { CONFIG } from '@12tails/shared/config';

const EMOTE_ICON = 48; // px, on-screen emote face size
const BUBBLE_BG = 'rgba(255,255,255,0.96)';

/** Inject the speech-bubble tail rule once. */
function ensureBubbleStyle() {
  if (document.getElementById('tt-bubble-style')) return;
  const st = document.createElement('style');
  st.id = 'tt-bubble-style';
  st.textContent =
    `.tt-bubble{position:relative}` +
    `.tt-bubble::after{content:'';position:absolute;left:50%;bottom:-8px;` +
    `transform:translateX(-50%);border:8px solid transparent;border-bottom:0;` +
    `border-top-color:${BUBBLE_BG};filter:drop-shadow(0 2px 1px rgba(0,0,0,0.18))}`;
  document.head.appendChild(st);
}

/**
 * DOM layer for per-player overheads (name tag, chat bubble, emote face),
 * projected from world positions every frame. Keeps the "UI is DOM, not
 * in-engine" rule from the 2D build: the 3D scene renders only the world.
 */
export class OverheadLayer {
  private root: HTMLDivElement;
  private items = new Map<string, Overhead>();
  private v = new THREE.Vector3();

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden;' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;';
    document.body.appendChild(this.root);
  }

  ensure(id: string, name: string, familyName?: string): Overhead {
    let item = this.items.get(id);
    if (!item) {
      item = new Overhead(name, familyName);
      this.root.appendChild(item.el);
      this.items.set(id, item);
    }
    return item;
  }

  remove(id: string) {
    this.items.get(id)?.el.remove();
    this.items.delete(id);
  }

  /** Project `worldPos` (head height already added) to screen and place the overhead. */
  place(id: string, worldPos: THREE.Vector3, camera: THREE.Camera) {
    const item = this.items.get(id);
    if (!item) return;
    this.v.copy(worldPos).project(camera);
    const behind = this.v.z > 1;
    item.el.style.display = behind ? 'none' : '';
    if (behind) return;
    const x = (this.v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this.v.y * 0.5 + 0.5) * window.innerHeight;
    item.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }

  destroy() {
    this.root.remove();
    this.items.clear();
  }
}

class Overhead {
  readonly el: HTMLDivElement;
  private bubble: HTMLDivElement;
  private emote: HTMLDivElement;
  private bubbleTimer: number | undefined;
  private emoteTimer: number | undefined;

  constructor(name: string, familyName?: string) {
    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:absolute;left:0;top:0;display:flex;flex-direction:column;' +
      'align-items:center;gap:3px;white-space:nowrap;will-change:transform;';

    this.emote = document.createElement('div');
    this.emote.style.cssText =
      `width:${EMOTE_ICON}px;height:${EMOTE_ICON}px;display:none;border-radius:50%;` +
      'background-color:rgba(255,255,255,0.95);border:2px solid rgba(185,185,198,0.9);' +
      'background-repeat:no-repeat;';

    ensureBubbleStyle();
    this.bubble = document.createElement('div');
    this.bubble.className = 'tt-bubble';
    this.bubble.style.cssText =
      'display:none;max-width:220px;margin-bottom:5px;padding:7px 13px;border-radius:14px;' +
      `background:${BUBBLE_BG};color:#2a2038;font-size:14px;line-height:1.35;font-weight:500;` +
      'white-space:pre-wrap;word-break:break-word;text-align:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.28);';

    // Nameplate: family name (top, accent) over the character name (bottom).
    // Guests have no family → a single centered line.
    const tag = document.createElement('div');
    tag.style.cssText =
      'display:flex;flex-direction:column;align-items:center;line-height:1.15;' +
      'background:rgba(0,0,0,0.42);padding:2px 8px;border-radius:7px;' +
      'text-shadow:1px 1px 0 rgba(0,0,0,0.8);';
    if (familyName) {
      const fam = document.createElement('div');
      fam.textContent = familyName;
      fam.style.cssText = 'font-size:9.5px;color:#ffcf9c;font-weight:600;letter-spacing:0.02em;';
      const nm = document.createElement('div');
      nm.textContent = name;
      nm.style.cssText = 'font-size:11px;color:#fff;';
      tag.append(fam, nm);
    } else {
      tag.textContent = name;
      tag.style.fontSize = '11px';
      tag.style.color = '#fff';
    }

    this.el.append(this.emote, this.bubble, tag);
  }

  showBubble(text: string) {
    this.bubble.textContent = text;
    this.bubble.style.display = 'block';
    window.clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => {
      this.bubble.style.display = 'none';
    }, CONFIG.BUBBLE_MS);
  }

  /** Show a mood bubble image (assets/ui/bubbles/<id>.png) above the head. */
  showEmote(url: string) {
    this.emote.style.backgroundImage = `url(${url})`;
    this.emote.style.backgroundSize = 'contain';
    this.emote.style.backgroundPosition = 'center';
    this.emote.style.display = 'block';
    window.clearTimeout(this.emoteTimer);
    this.emoteTimer = window.setTimeout(() => {
      this.emote.style.display = 'none';
    }, CONFIG.EMOTE_SHOW_MS);
  }
}
