/**
 * AudioManager — ระบบเสียงกลางของเกม (จุดเดียวที่เล่นเสียงทุกอย่าง)
 *
 * โครงกราฟเสียง:
 *
 *     [SFX one-shots] → sfxBus ─┐
 *                               ├─→ master → destination (ลำโพง)
 *     [SynthMusic loop] → bgmBus┘
 *
 * - bgmBus กับ sfxBus แยกกัน → เพลงฉากกับเสียงตกปลา "ดังพร้อมกัน" ได้เต็มที่
 * - ducking: ตอนเล่น SFX ใหญ่ (legendary) จะหรี่ bgmBus ลงชั่วครู่ให้เสียงเด้ง แล้วคืน
 * - autoplay policy: AudioContext เริ่มแบบ suspended จนกว่าจะมี user gesture แรก
 *   (unlock ผูกกับ pointerdown/keydown อัตโนมัติ) — เรียก play() ก่อน unlock ได้
 *   ไม่พัง แค่ยังไม่มีเสียงจนกว่าจะแตะจอ/กดปุ่ม
 *
 * โค้ดเกมคุยกับที่นี่ผ่าน key ใน soundManifest เท่านั้น: audio.play('catch.legendary')
 */

import {
  bite,
  ching,
  fanfare,
  miss,
  reelTick,
  splash,
  swish,
  uiBlip,
  SynthMusic,
  type BgmMood,
} from './synth';
import { BGM, SFX, type BgmDef, type BgmKey, type SfxDef, type SfxKey } from './soundManifest';

const MUTE_STORAGE_KEY = '12tails-audio-muted-v1';
const BGM_VOLUME = 0.55;
const SFX_VOLUME = 0.9;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bgmBus!: GainNode;
  private sfxBus!: GainNode;

  private music: SynthMusic | null = null;
  private currentBgm: BgmKey | null = null;
  private fileBuffers = new Map<string, AudioBuffer>(); // cache สำหรับ kind:'file'
  private muted = false;
  private unlocked = false;
  private started = false;
  private duckTimer: number | undefined;

  constructor() {
    this.muted = this.loadMuted();
  }

  // ------------------------------------------------------------- lifecycle

  /** สร้าง AudioContext + กราฟ + ผูก gesture ให้ปลดล็อกเสียง เรียกได้หลายครั้ง (idempotent) */
  init() {
    if (this.started) return;
    this.started = true;

    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      console.warn('[audio] WebAudio ไม่รองรับ — เกมทำงานต่อได้แบบเงียบ');
      return;
    }
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);

    this.bgmBus = this.ctx.createGain();
    this.bgmBus.gain.value = BGM_VOLUME;
    this.bgmBus.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = SFX_VOLUME;
    this.sfxBus.connect(this.master);

    // ปลดล็อกเมื่อผู้ใช้แตะจอ/กดปุ่มครั้งแรก (นโยบาย autoplay ของเบราว์เซอร์)
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    // เก็บไว้ถอดตอน dispose
    this.unlockHandler = unlock;
  }

  private unlockHandler?: () => void;

  /** resume context (ต้องเรียกใน user gesture) แล้วสตาร์ทเพลงถ้าค้างรออยู่ */
  unlock() {
    if (!this.ctx || this.unlocked) return;
    void this.ctx.resume().then(() => {
      this.unlocked = true;
      // ถ้าตั้งเพลงไว้ก่อนปลดล็อก ให้เริ่มเล่นตอนนี้
      if (this.currentBgm && !this.muted) this.music?.start();
    });
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.saveMuted(muted);
    if (!this.ctx) return;
    // ramp เพื่อไม่ให้เกิดเสียง "ป๊อป" ตอนตัด
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.02);
    if (muted) this.music?.stop();
    else if (this.currentBgm && this.unlocked) this.music?.start();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ------------------------------------------------------------------ SFX

  /** เล่นเสียง one-shot จาก key ใน manifest (ไม่รู้จัก key = เงียบ ไม่พัง) */
  play(key: SfxKey) {
    const def = SFX[key];
    if (!def || !this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    const when = this.ctx.currentTime + 0.01;
    if (def.duck != null) this.duck(def.duck);
    if (def.kind === 'file') {
      void this.playFile(def, when);
      return;
    }
    this.playSynth(def, when);
  }

  private playSynth(def: Extract<SfxDef, { kind: 'synth' }>, when: number) {
    const ctx = this.ctx!;
    const bus = this.sfxBus;
    switch (def.synth) {
      case 'cast': return swish(ctx, bus, when);
      case 'splash': return splash(ctx, bus, when);
      case 'bite': return bite(ctx, bus, when);
      case 'reel': return reelTick(ctx, bus, when);
      case 'miss': return miss(ctx, bus, when);
      case 'sell': return ching(ctx, bus, when);
      case 'blip': return uiBlip(ctx, bus, when);
      case 'fanfare': return fanfare(ctx, bus, when, def.tier ?? 'common');
    }
  }

  /** เล่นไฟล์เสียง (kind:'file') — โหลด+ถอดรหัส cache ไว้ครั้งแรก */
  private async playFile(def: Extract<SfxDef, { kind: 'file' }>, when: number) {
    const ctx = this.ctx!;
    const buf = await this.loadBuffer(def.url);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (def.gain != null) {
      const g = ctx.createGain();
      g.gain.value = def.gain;
      src.connect(g).connect(this.sfxBus);
    } else {
      src.connect(this.sfxBus);
    }
    src.start(Math.max(when, ctx.currentTime));
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    const cached = this.fileBuffers.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx!.decodeAudioData(arr);
      this.fileBuffers.set(url, buf);
      return buf;
    } catch (err) {
      console.warn('[audio] โหลดไฟล์เสียงไม่สำเร็จ:', url, err);
      return null;
    }
  }

  /** หรี่ BGM ลงเหลือ `amount` (0..1) แล้วค่อยๆ คืนกลับ — ให้ SFX ใหญ่เด้ง */
  private duck(amount: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(now);
    this.bgmBus.gain.setTargetAtTime(BGM_VOLUME * amount, now, 0.03);
    window.clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.bgmBus.gain.setTargetAtTime(BGM_VOLUME, t, 0.4);
    }, 700);
  }

  // ------------------------------------------------------------------ BGM

  /**
   * ตั้งเพลงพื้นหลังตาม key ใน manifest — crossfade จากเพลงเดิม (ถ้ามี)
   * เรียกซ้ำ key เดิม = ไม่ทำอะไร (เช่นตอน re-emit สถานะ)
   */
  playBgm(key: BgmKey) {
    if (this.currentBgm === key || !this.ctx) {
      this.currentBgm = key;
      return;
    }
    this.currentBgm = key;
    const def = BGM[key];
    if (!def) return;

    if (def.kind === 'synth') {
      // ตอนนี้รองรับเฉพาะ synth BGM (placeholder) — สลับ mood ของ engine ตัวเดิม
      if (!this.music) this.music = new SynthMusic(this.ctx, this.bgmBus, def.mood as BgmMood);
      else this.music.setMood(def.mood as BgmMood);
      if (!this.muted && this.unlocked) this.music.start();
    } else {
      this.playBgmFile(def);
    }
  }

  /** เพลงพื้นหลังจากไฟล์ (kind:'file') — ลูปต่อเนื่อง (เปิดใช้เมื่อมี asset จริง) */
  private bgmFileSrc: AudioBufferSourceNode | null = null;
  private async playBgmFile(def: Extract<BgmDef, { kind: 'file' }>) {
    const ctx = this.ctx!;
    const buf = await this.loadBuffer(def.url);
    if (!buf || this.currentBgm == null) return;
    this.bgmFileSrc?.stop();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.bgmBus);
    if (!this.muted && this.unlocked) src.start();
    this.bgmFileSrc = src;
  }

  stopBgm() {
    this.currentBgm = null;
    this.music?.stop();
    this.bgmFileSrc?.stop();
    this.bgmFileSrc = null;
  }

  // -------------------------------------------------------------- teardown

  dispose() {
    this.stopBgm();
    window.clearTimeout(this.duckTimer);
    if (this.unlockHandler) {
      window.removeEventListener('pointerdown', this.unlockHandler);
      window.removeEventListener('keydown', this.unlockHandler);
    }
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
    this.unlocked = false;
  }

  // -------------------------------------------------------------- storage

  private loadMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private saveMuted(muted: boolean) {
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
    } catch {
      /* private mode — mute ยังทำงานใน-memory */
    }
  }
}

/** ตัวเดียวใช้ทั้งเกม (เหมือน demoStore) */
export const audio = new AudioManager();
