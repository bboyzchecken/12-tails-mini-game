/**
 * Small top-center loading toast (DOM overlay): label + progress bar.
 * `progress(null)` shows an indeterminate pulse for loads with unknown size.
 */
export class LoadingBar {
  private root: HTMLDivElement;
  private label: HTMLDivElement;
  private track: HTMLDivElement;
  private fill: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:12;' +
      'display:none;min-width:240px;padding:10px 14px;border-radius:10px;' +
      'background:rgba(20,18,30,0.85);border:1px solid rgba(201,164,92,0.8);' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;pointer-events:none;';

    this.label = document.createElement('div');
    this.label.style.cssText = 'font-size:12px;color:#f0e6d2;margin-bottom:6px;text-align:center;';

    this.track = document.createElement('div');
    this.track.style.cssText =
      'height:8px;border-radius:4px;background:rgba(255,255,255,0.12);overflow:hidden;';

    this.fill = document.createElement('div');
    this.fill.style.cssText =
      'height:100%;width:0%;border-radius:4px;background:#c9a45c;transition:width .15s;';

    this.track.appendChild(this.fill);
    this.root.append(this.label, this.track);
    document.body.appendChild(this.root);
  }

  show(text: string) {
    this.label.textContent = text;
    this.progress(null);
    this.root.style.display = 'block';
  }

  /** 0..1, or null for indeterminate. */
  progress(f: number | null) {
    if (f === null) {
      this.fill.style.width = '35%';
      this.fill.style.animation = 'loadbar-slide 1s ease-in-out infinite alternate';
      if (!document.getElementById('loadbar-style')) {
        const st = document.createElement('style');
        st.id = 'loadbar-style';
        st.textContent =
          '@keyframes loadbar-slide{from{margin-left:0}to{margin-left:65%}}';
        document.head.appendChild(st);
      }
    } else {
      this.fill.style.animation = '';
      this.fill.style.marginLeft = '0';
      this.fill.style.width = `${Math.round(Math.min(1, Math.max(0, f)) * 100)}%`;
    }
  }

  hide() {
    this.root.style.display = 'none';
  }

  destroy() {
    this.root.remove();
  }
}
