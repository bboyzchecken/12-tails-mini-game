import { CONFIG } from '@12tails/shared/config';
import type { FishingResult, FishTier } from '@12tails/shared/events';
import { audio } from '../audio/AudioManager';
import { demoStore, fishPrice } from '../ui/store/demoState';
import { catchWord, fishName, fishSprite, tierStyle } from './fishingManifest';

const F = CONFIG.FISHING;

/**
 * FishingController — โมดูลตกปลา 2D แบบ self-contained (spec §4)
 *
 * เลเยอร์ 3D (World3D) รู้แค่ "ผู้เล่นอยู่ใกล้จุดตกปลาไหม" แล้วเรียก setNearbySpot()
 * ที่เหลือ — prompt, มินิเกม, comic FX, เสียง, เก็บปลา/ขาย — อยู่ในนี้ทั้งหมด
 * ไม่รู้ว่าข้างนอกเป็น 3D และไม่เอื้อมแตะ scene (คุยกลับผ่าน callback onCast เท่านั้น)
 *
 * ผลตัดสินมาจาก server (showResult) — client แค่เล่นอนิเมชันตามผล ห้ามสุ่มเอง
 */

type Phase = 'idle' | 'casting' | 'reveal';
type Spot = { id: string; name: string };

interface FishingOptions {
  onCast: (spotId: string) => void; // ยิง fishing:cast ผ่าน socket (World3D จัดการ)
  canInteract: () => boolean;       // false ระหว่างพิมพ์แชท ฯลฯ (World3D.inputEnabled)
}

export class FishingController {
  private prompt: HTMLDivElement;
  private stage: HTMLDivElement;
  private bagBtn: HTMLButtonElement;
  private bag: HTMLDivElement;

  private phase: Phase = 'idle';
  private nearby: Spot | null = null;
  private timers: number[] = [];
  /** ผลจาก server ที่มาถึงระหว่างเล่นอนิเมชัน suspense (buffer ไว้ค่อย reveal) */
  private serverResult: FishingResult | null = null;
  private awaitingReveal = false;
  private bagOpen = false;
  private offStore: () => void;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.code === F.PROMPT_KEY) this.tryCast();
    else if (e.code === 'Escape' && this.bagOpen) this.toggleBag(false);
  };

  constructor(private opts: FishingOptions) {
    this.prompt = document.createElement('div');
    this.prompt.className = 'fishing-prompt';
    this.prompt.innerHTML =
      '<span>🎣</span><kbd>F</kbd><span class="fishing-prompt-label">ตกปลา</span>';

    this.stage = document.createElement('div');
    this.stage.className = 'fishing-stage';

    // ปุ่มถุงปลา (side-btn s6) + แผงขายปลา
    this.bagBtn = document.createElement('button');
    this.bagBtn.className = 'side-btn s6';
    this.bagBtn.title = 'ถุงปลา';
    this.bagBtn.textContent = '🐟';
    this.bagBtn.addEventListener('click', () => this.toggleBag());

    this.bag = document.createElement('div');
    this.bag.className = 'panel side-panel fishing-bag';

    document.body.append(this.prompt, this.stage, this.bagBtn, this.bag);
    window.addEventListener('keydown', this.onKeyDown);
    // อัปเดตแผงถุงปลาเมื่อกระเป๋าเปลี่ยน (ตกได้/ขาย)
    this.offStore = demoStore.subscribe(() => {
      if (this.bagOpen) this.renderBag();
    });
  }

  // ------------------------------------------------- ใกล้จุด (จาก World3D)

  /** World3D เรียกทุกเฟรม: spot ที่อยู่ใกล้ (null = ไม่มี) */
  setNearbySpot(spot: Spot | null) {
    // เทียบด้วย id เพื่อลด DOM churn
    if (spot?.id === this.nearby?.id) return;
    this.nearby = spot;
    this.refreshPrompt();
  }

  private refreshPrompt() {
    const show = this.phase === 'idle' && this.nearby != null;
    this.prompt.classList.toggle('show', show);
    if (show && this.nearby) {
      const label = this.prompt.querySelector('.fishing-prompt-label');
      if (label) label.textContent = `ตกปลา · ${this.nearby.name}`;
    }
  }

  // ------------------------------------------------------ minigame flow

  private tryCast() {
    if (this.phase !== 'idle' || !this.nearby || !this.opts.canInteract()) return;
    const spot = this.nearby;
    this.phase = 'casting';
    this.serverResult = null;
    this.awaitingReveal = false;
    this.refreshPrompt();

    this.opts.onCast(spot.id); // → server สุ่มผล แล้วตอบกลับ fishing:result
    audio.play('fishing.cast');

    // อนิเมชัน suspense (แค่ presentation — ผลจริงมาจาก server)
    this.showStage('เหวี่ยงเบ็ด~', '', '<div class="fishing-bobber">🎣</div>');
    this.after(F.CAST_MS, () => {
      audio.play('fishing.splash');
      this.showStage('รอปลากิน…', 'จับตาดูทุ่น', '<div class="fishing-bobber">🎣</div>');
      const wait = F.WAIT_MIN_MS + Math.random() * (F.WAIT_MAX_MS - F.WAIT_MIN_MS);
      this.after(wait, () => this.onBite());
    });
  }

  private onBite() {
    audio.play('fishing.bite');
    this.showStage('❗ ปลากินเบ็ด!', 'กำลังสู้ปลา…', '<div class="fishing-bobber bite">🎣</div>');
    // ให้จังหวะ "ตื่นเต้น" สั้นๆ ก่อนเฉลย
    this.after(650, () => {
      if (this.serverResult) this.reveal(this.serverResult);
      else this.awaitingReveal = true; // ผล server ยังไม่มา — reveal ทันทีที่มาถึง
    });
  }

  /** World3D ส่งต่อ fishing:result จาก socket มาที่นี่ */
  showResult(r: FishingResult) {
    // ไม่ได้อยู่ในรอบ cast (เช่นมาช้าหลังปิด) — ทิ้ง
    if (this.phase === 'idle') return;
    this.serverResult = r;
    if (this.awaitingReveal) {
      this.awaitingReveal = false;
      this.reveal(r);
    }
  }

  private reveal(r: FishingResult) {
    this.phase = 'reveal';
    const pct = Math.round(r.chance * 100);
    if (r.caught) this.revealCaught(r, pct);
    else this.revealMiss(r, pct);
  }

  private revealCaught(r: FishingResult, pct: number) {
    demoStore.addFish(r.fishId); // เก็บเข้าถุง (ได้เกล็ดตอนขาย)
    audio.play(`catch.${r.tier}` as const);

    const { color, label } = tierStyle(r.tier);
    const word = catchWord(r.tier);
    this.stage.style.setProperty('--tier', color);
    this.stage.innerHTML =
      `<div class="fishing-word">${word}</div>` +
      `<div class="fish-frame">${this.spriteHtml(r.fishId)}</div>` +
      `<span class="tier-badge">${label.toUpperCase()}</span>` +
      `<div class="fish-name">${fishName(r.fishId)}</div>` +
      `<div class="fish-note">โอกาสจับ ${pct}% · ขายได้ ${r.price} เกล็ด · เก็บเข้าถุงแล้ว</div>`;
    this.stage.classList.add('show');
    if (r.tier === 'epic' || r.tier === 'legendary') this.confetti(color, r.tier === 'legendary');

    this.after(r.tier === 'legendary' ? 2800 : 2200, () => this.endRound());
  }

  private revealMiss(r: FishingResult, pct: number) {
    audio.play('fishing.miss');
    this.stage.style.removeProperty('--tier');
    this.stage.innerHTML =
      `<div class="fishing-word miss">ปลาหลุด!</div>` +
      `<div class="fishing-bobber">💨</div>` +
      `<div class="fish-note">โอกาสจับ ${pct}% — คราวนี้ไม่ติด ลองใหม่!</div>`;
    this.stage.classList.add('show');
    this.after(1700, () => this.endRound());
  }

  private endRound() {
    this.clearTimers();
    this.stage.classList.remove('show');
    this.stage.innerHTML = '';
    this.serverResult = null;
    this.awaitingReveal = false;
    this.phase = 'idle';
    this.refreshPrompt();
  }

  private showStage(msg: string, sub: string, extraHtml = '') {
    this.stage.style.removeProperty('--tier');
    this.stage.innerHTML =
      extraHtml +
      `<div class="stage-msg">${msg}</div>` +
      (sub ? `<div class="stage-sub">${sub}</div>` : '');
    this.stage.classList.add('show');
  }

  private spriteHtml(fishId: string): string {
    const s = fishSprite(fishId);
    return s.kind === 'image'
      ? `<img src="${s.url}" alt="">`
      : `<span class="fish-emoji">${s.emoji}</span>`;
  }

  private confetti(color: string, big: boolean) {
    const colors = [color, '#f5c542', '#1eb4cf', '#f2894a', '#fff'];
    const n = big ? 22 : 12;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = `${10 + Math.random() * 80}%`;
      c.style.animationDelay = `${Math.random() * 0.3}s`;
      this.stage.appendChild(c);
    }
  }

  // ------------------------------------------------------ hype (คนอื่นตกได้)

  /** World3D ส่งต่อ fishing:announce — โชว์ toast + เสียงเบาๆ ("คนหันมามอง") */
  hype(name: string, fishId: string, tier: FishTier) {
    const { color, label } = tierStyle(tier);
    const toast = document.createElement('div');
    toast.className = 'fishing-hype';
    toast.style.setProperty('--tier', color);
    const sprite = fishSprite(fishId);
    const icon = sprite.kind === 'image' ? '🐟' : sprite.emoji;
    toast.innerHTML = `<span>${icon}</span><span><b>${escapeHtml(name)}</b> ตกได้ ${fishName(fishId)} (${label})!</span>`;
    document.body.appendChild(toast);
    audio.play('ui.blip');
    window.setTimeout(() => toast.remove(), 4200);
  }

  // ------------------------------------------------------------ ถุงปลา

  private toggleBag(force?: boolean) {
    this.bagOpen = force ?? !this.bagOpen;
    this.bag.style.display = this.bagOpen ? 'block' : 'none';
    this.bagBtn.classList.toggle('on', this.bagOpen);
    if (this.bagOpen) this.renderBag();
  }

  private renderBag() {
    const items = demoStore.inventory();
    let html = '<div class="bag-title">🎣 ถุงปลา · ขายเอาเกล็ด</div>';
    if (items.length === 0) {
      html += '<div class="bag-empty">ยังไม่มีปลา — ไปตกที่แม่น้ำสิ!</div>';
      this.bag.innerHTML = html;
      return;
    }
    for (const { fishId, count } of items) {
      const s = fishSprite(fishId);
      const icon = s.kind === 'image' ? `<img src="${s.url}" alt="" width="24" height="24">` : s.emoji;
      html +=
        `<div class="bag-row" data-fish="${fishId}">` +
        `<span class="bag-emoji">${icon}</span>` +
        `<span class="bag-info"><div class="bag-fish">${fishName(fishId)} ×${count}</div>` +
        `<div class="bag-price">${fishPrice(fishId)} เกล็ด/ตัว</div></span>` +
        `<button class="btn btn-secondary bag-sell" data-fish="${fishId}">ขาย</button></div>`;
    }
    html += '<button class="btn btn-primary bag-sell-all">ขายทั้งหมด</button>';
    this.bag.innerHTML = html;

    this.bag.querySelectorAll<HTMLButtonElement>('.bag-sell').forEach((b) =>
      b.addEventListener('click', () => {
        const gain = demoStore.sellFish(b.dataset.fish!);
        if (gain > 0) audio.play('fishing.sell');
      }),
    );
    this.bag.querySelector<HTMLButtonElement>('.bag-sell-all')?.addEventListener('click', () => {
      const gain = demoStore.sellAll();
      if (gain > 0) audio.play('fishing.sell');
    });
  }

  // --------------------------------------------------------------- timers

  private after(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private clearTimers() {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }

  destroy() {
    this.clearTimers();
    window.removeEventListener('keydown', this.onKeyDown);
    this.offStore();
    this.prompt.remove();
    this.stage.remove();
    this.bagBtn.remove();
    this.bag.remove();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
}
