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
    this.btn.className = 'side-btn s1';
    this.btn.title = 'สลับกลางวัน/กลางคืน';
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
