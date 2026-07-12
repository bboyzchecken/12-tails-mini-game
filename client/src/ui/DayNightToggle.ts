export type MapVariant = 'day' | 'night';

interface DayNightToggleOptions {
  initial: MapVariant;
  onChange: (v: MapVariant) => void;
}

/**
 * Small round day/night switch (DOM overlay, same pattern as EmoteWheel).
 * The world swaps map glb + lighting when it fires.
 */
export class DayNightToggle {
  private btn: HTMLButtonElement;
  private variant: MapVariant;

  constructor(private opts: DayNightToggleOptions) {
    this.variant = opts.initial;
    this.btn = document.createElement('button');
    this.btn.className = 'btn';
    this.btn.title = 'สลับกลางวัน/กลางคืน';
    this.btn.style.cssText =
      'position:fixed;top:52px;right:12px;z-index:11;pointer-events:auto;' +
      'width:44px;height:44px;border-radius:50%;font-size:20px;cursor:pointer;' +
      'border:2px solid rgba(201,164,92,0.9);background:rgba(20,18,30,0.6);' +
      'display:flex;align-items:center;justify-content:center;padding:0;';
    this.paint();
    this.btn.addEventListener('click', () => {
      this.variant = this.variant === 'night' ? 'day' : 'night';
      this.paint();
      this.opts.onChange(this.variant);
    });
    document.body.appendChild(this.btn);
  }

  private paint() {
    this.btn.textContent = this.variant === 'night' ? '🌙' : '☀️';
  }

  destroy() {
    this.btn.remove();
  }
}
