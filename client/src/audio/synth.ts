/**
 * Procedural placeholder sounds — สังเคราะห์ด้วย WebAudio ล้วน ไม่ต้องมีไฟล์เสียงสักไฟล์
 *
 * ทำหน้าที่เดียวกับ "PLACEHOLDER sprite" ของฝั่งภาพ (context-brief §2): ให้ลูปตกปลา
 * "มีเสียงจริง" ตั้งแต่ยังไม่มี asset — พอมีไฟล์เสียงจริง ก็สลับที่ soundManifest เป็น
 * kind:'file' โดยโค้ดเกมไม่ต้องแก้ (AudioManager เรียก play(key) เหมือนเดิม)
 *
 * ทุกฟังก์ชันรับ (ctx, dest, when) แล้ว "schedule" เสียงลงบน dest ที่เวลา when
 * (หน่วยวินาทีของ AudioContext) — ไม่แตะ master/mute เอง นั่นเป็นงานของ AudioManager
 */

/** ความถี่ของโน้ต (เซมิโทนเทียบ A4=440Hz) — ใช้สร้างอาร์เพจจิโอแบบดนตรีจริง */
export function noteHz(semitonesFromA4: number): number {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// สเกลเมเจอร์ (โน้ตที่ฟังแล้ว "สดใส/มีชัย") เทียบจาก A4 = 0
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 19, 24];

/** โทนเดี่ยว (oscillator + envelope) — อิฐก้อนเดียวที่เสียงอื่นๆ ประกอบขึ้นมา */
function tone(
  ctx: AudioContext,
  dest: AudioNode,
  when: number,
  opts: {
    freq: number;
    dur: number;
    type?: OscillatorType;
    gain?: number;
    attack?: number;
    glideTo?: number; // เลื่อนความถี่ไปค่านี้ตลอดโน้ต (เสียงหวูด/สไลด์)
  },
) {
  const { freq, dur, type = 'triangle', gain = 0.25, attack = 0.006, glideTo } = opts;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (glideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), when + dur);
  // envelope: attack เร็ว → decay แบบ exponential (ฟังเป็นธรรมชาติกว่า linear)
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g).connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

/** บัฟเฟอร์ noise ขาว (สร้างครั้งเดียว cache ไว้) — ใช้ทำเสียงน้ำ/สาดคันเบ็ด */
let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 1.2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

/** noise ผ่าน band-pass + envelope — ก้อนพื้นฐานของเสียง "สาดน้ำ/หวีดคันเบ็ด" */
function noiseHit(
  ctx: AudioContext,
  dest: AudioNode,
  when: number,
  opts: { dur: number; freq: number; q?: number; gain?: number; sweepTo?: number },
) {
  const { dur, freq, q = 1, gain = 0.25, sweepTo } = opts;
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq, when);
  bp.Q.value = q;
  if (sweepTo != null) bp.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), when + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(bp).connect(g).connect(dest);
  src.start(when);
  src.stop(when + dur + 0.02);
}

// ---------------------------------------------------------------- SFX ตกปลา

/** เหวี่ยงคันเบ็ด — หวีดสั้นๆ กวาดความถี่ขึ้น */
export function swish(ctx: AudioContext, dest: AudioNode, when: number) {
  noiseHit(ctx, dest, when, { dur: 0.28, freq: 600, sweepTo: 2600, q: 0.7, gain: 0.18 });
}

/** เบ็ดตกน้ำ — สาดน้ำ (noise ต่ำ) + หยดน้ำ (blip สั้น) */
export function splash(ctx: AudioContext, dest: AudioNode, when: number) {
  noiseHit(ctx, dest, when, { dur: 0.35, freq: 900, sweepTo: 300, q: 0.5, gain: 0.22 });
  tone(ctx, dest, when + 0.04, { freq: noteHz(12), dur: 0.14, type: 'sine', gain: 0.12 });
}

/** ปลามากินเบ็ด! — จุด "!" เตือนให้ดึง สองพยางค์กระตุก */
export function bite(ctx: AudioContext, dest: AudioNode, when: number) {
  tone(ctx, dest, when, { freq: noteHz(16), dur: 0.09, type: 'square', gain: 0.16 });
  tone(ctx, dest, when + 0.12, { freq: noteHz(19), dur: 0.12, type: 'square', gain: 0.18 });
}

/** ดึงรอก (ระหว่างสู้ปลา) — ติ๊กสั้นถี่ */
export function reelTick(ctx: AudioContext, dest: AudioNode, when: number) {
  tone(ctx, dest, when, { freq: noteHz(7), dur: 0.05, type: 'sawtooth', gain: 0.07, attack: 0.002 });
}

/** ปลาหลุด — โทนตกลง เศร้าๆ */
export function miss(ctx: AudioContext, dest: AudioNode, when: number) {
  tone(ctx, dest, when, { freq: noteHz(7), dur: 0.5, type: 'triangle', gain: 0.22, glideTo: noteHz(-5) });
  tone(ctx, dest, when + 0.06, { freq: noteHz(3), dur: 0.5, type: 'sine', gain: 0.12, glideTo: noteHz(-9) });
}

/** ขายปลา — เสียงเหรียญ "ชิง!" (สองโน้ตเมเจอร์เธิร์ด) */
export function ching(ctx: AudioContext, dest: AudioNode, when: number) {
  tone(ctx, dest, when, { freq: noteHz(19), dur: 0.16, type: 'triangle', gain: 0.16 });
  tone(ctx, dest, when + 0.03, { freq: noteHz(23), dur: 0.2, type: 'sine', gain: 0.14 });
}

/** UI คลิก/prompt เด้ง — บลิปเบาๆ */
export function uiBlip(ctx: AudioContext, dest: AudioNode, when: number) {
  tone(ctx, dest, when, { freq: noteHz(12), dur: 0.07, type: 'sine', gain: 0.1 });
}

/**
 * แฟนแฟร์ตอนตกได้ปลา — ความอลังเพิ่มตาม tier
 * legendary = "โมเมนต์คนหันมามอง": อาร์เพจจิโอไล่ขึ้นยาว + ชิมเมอร์ + ซับบูม
 * (AudioManager เป็นคน duck BGM ให้เสียงนี้เด้ง — ดู play('catch.*'))
 */
export function fanfare(
  ctx: AudioContext,
  dest: AudioNode,
  when: number,
  tier: 'common' | 'rare' | 'epic' | 'legendary',
) {
  // จำนวนโน้ต + ความยาว + ปริมาณ "ประกาย" ไล่ตามความหายาก
  const spec = {
    common: { notes: [7, 12], step: 0.1, gain: 0.2, type: 'triangle' as OscillatorType },
    rare: { notes: [4, 7, 12], step: 0.1, gain: 0.24, type: 'triangle' as OscillatorType },
    epic: { notes: [0, 4, 7, 12, 16], step: 0.09, gain: 0.26, type: 'sawtooth' as OscillatorType },
    legendary: { notes: [0, 4, 7, 12, 16, 19, 24], step: 0.085, gain: 0.28, type: 'sawtooth' as OscillatorType },
  }[tier];

  // อาร์เพจจิโอไล่ขึ้น (โครงหลักของแฟนแฟร์)
  spec.notes.forEach((n, i) => {
    tone(ctx, dest, when + i * spec.step, {
      freq: noteHz(MAJOR[n] ?? n),
      dur: 0.5,
      type: spec.type,
      gain: spec.gain,
      attack: 0.004,
    });
  });
  const end = when + spec.notes.length * spec.step;

  // คอร์ดค้างท้าย (ตอกย้ำว่า "ได้แล้ว!")
  if (tier !== 'common') {
    for (const n of [0, 4, 7]) {
      tone(ctx, dest, end, { freq: noteHz(MAJOR[n] + 12), dur: 0.9, type: 'triangle', gain: 0.12 });
    }
  }

  // epic/legendary: ประกายชิมเมอร์ (โน้ตสูงกระจาย) + legendary เพิ่มซับบูม
  if (tier === 'epic' || tier === 'legendary') {
    const sparkles = tier === 'legendary' ? 8 : 4;
    for (let i = 0; i < sparkles; i++) {
      tone(ctx, dest, end + 0.05 + i * 0.06, {
        freq: noteHz(MAJOR[8 + (i % 4)] + 12),
        dur: 0.35,
        type: 'sine',
        gain: 0.08,
      });
    }
  }
  if (tier === 'legendary') {
    // ซับบูมต่ำ — แรงกระแทกที่ทำให้คน "หันมามอง"
    tone(ctx, dest, when, { freq: noteHz(-24), dur: 1.1, type: 'sine', gain: 0.3, glideTo: noteHz(-29) });
    tone(ctx, dest, when + 0.02, { freq: noteHz(-12), dur: 0.9, type: 'triangle', gain: 0.14 });
  }
}

// ------------------------------------------------------------------- BGM

export type BgmMood = 'day' | 'night';

/**
 * เพลงพื้นหลังแบบสังเคราะห์ (placeholder) — pad คอร์ดนุ่มๆ + อาร์เพจจิโอเบาๆ วนลูป
 * ใช้ lookahead scheduler (setInterval จองโน้ตล่วงหน้าเป็นช่วงๆ) เพื่อให้จังหวะนิ่ง
 * ไม่สะดุดตาม main thread — pattern มาตรฐานของ WebAudio ("two clocks")
 *
 * เล่นพร้อม SFX ได้เต็มที่ (คนละ bus) — นี่คือสิ่งที่ทำให้ "BGM ฉาก + เสียงตกปลา"
 * ดังพร้อมกันได้ตามที่ต้องการ
 */
export class SynthMusic {
  private timer: number | undefined;
  private nextNoteTime = 0;
  private step = 0;
  private readonly lookahead = 0.1; // จองล่วงหน้ากี่วินาที
  private readonly interval = 25; // เช็คทุกกี่ ms

  // day = สดใสเทมโปกลาง / night = ช้า มืด ใช้ไมเนอร์
  private readonly patterns: Record<BgmMood, { beat: number; root: number[]; arp: number[]; wave: OscillatorType }> = {
    day: { beat: 0.42, root: [0, 5, -3, 4], arp: [0, 4, 7, 11, 7, 4], wave: 'triangle' },
    night: { beat: 0.6, root: [-3, -5, -8, -3], arp: [-3, 0, 3, 7, 3, 0], wave: 'sine' },
  };

  constructor(
    private ctx: AudioContext,
    private dest: AudioNode,
    private mood: BgmMood,
  ) {}

  setMood(mood: BgmMood) {
    this.mood = mood;
  }

  start() {
    if (this.timer != null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.step = 0;
    this.timer = window.setInterval(() => this.scheduler(), this.interval);
  }

  stop() {
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  private scheduler() {
    const p = this.patterns[this.mood];
    while (this.nextNoteTime < this.ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.step, this.nextNoteTime, p);
      this.nextNoteTime += p.beat;
      this.step++;
    }
  }

  private scheduleStep(
    step: number,
    when: number,
    p: { beat: number; root: number[]; arp: number[]; wave: OscillatorType },
  ) {
    const bar = Math.floor(step / p.arp.length) % p.root.length;
    const root = p.root[bar];

    // ทุกต้นห้อง: pad คอร์ด (root + fifth) ค้างยาว นุ่มๆ เป็นพื้น
    if (step % p.arp.length === 0) {
      for (const iv of [0, 7, 12]) {
        tone(this.ctx, this.dest, when, {
          freq: noteHz(root + iv - 12),
          dur: p.beat * p.arp.length * 0.95,
          type: 'sine',
          gain: 0.05,
          attack: 0.15,
        });
      }
    }
    // อาร์เพจจิโอเมโลดี้เบาๆ เดินบนคอร์ด
    const arpNote = p.arp[step % p.arp.length];
    tone(this.ctx, this.dest, when, {
      freq: noteHz(root + arpNote),
      dur: p.beat * 0.9,
      type: p.wave,
      gain: 0.06,
      attack: 0.02,
    });
  }
}
