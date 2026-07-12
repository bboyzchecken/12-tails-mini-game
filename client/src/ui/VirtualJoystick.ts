/**
 * On-screen movement stick for touch devices (bottom-left). Exposes a live
 * `vector` (x right, y down, magnitude 0..1) that World3D reads each frame —
 * same screen convention as the WASD keys. Hidden on non-touch devices.
 */
export class VirtualJoystick {
  /** Normalized move vector; x right, y down. */
  readonly vector = { x: 0, y: 0 };
  private base: HTMLDivElement;
  private thumb: HTMLDivElement;
  private radius = 52;
  private pointerId = -1;

  constructor() {
    this.base = document.createElement('div');
    this.base.className = 'vjoy';
    this.thumb = document.createElement('div');
    this.thumb.className = 'vjoy-thumb';
    this.base.appendChild(this.thumb);
    document.body.appendChild(this.base);

    this.base.addEventListener('pointerdown', this.onDown);
    this.base.addEventListener('pointermove', this.onMove);
    this.base.addEventListener('pointerup', this.onUp);
    this.base.addEventListener('pointercancel', this.onUp);
  }

  private center(): { x: number; y: number } {
    const r = this.base.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  private onDown = (e: PointerEvent) => {
    this.pointerId = e.pointerId;
    this.base.setPointerCapture(e.pointerId);
    this.onMove(e);
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    const c = this.center();
    let dx = e.clientX - c.x;
    let dy = e.clientY - c.y;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, this.radius);
    dx = (dx / len) * clamped;
    dy = (dy / len) * clamped;
    this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    this.vector.x = dx / this.radius;
    this.vector.y = dy / this.radius;
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    this.vector.x = 0;
    this.vector.y = 0;
    this.thumb.style.transform = 'translate(0,0)';
  };

  destroy() {
    this.base.remove();
  }
}
