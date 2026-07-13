import { CONFIG } from '@12tails/shared/config';
import * as api from '../net/api';
import type { Account } from '../net/api';

interface AuthPanelOptions {
  onAuthed: (account: Account) => void; // login/register succeeded (token stored)
  onGuest: () => void;                  // skip auth, play with an ephemeral name
}

/**
 * Entry gate (DOM overlay): standalone login/register, or "play as guest".
 * First rung of the identity ladder — accounts unlock a permanent family name
 * and saved characters; guests just get in. See Phase P in the build plan.
 */
export class AuthPanel {
  private root: HTMLDivElement;
  private mode: 'login' | 'register' = 'login';
  private busy = false;

  constructor(private opts: AuthPanelOptions) {
    this.root = document.createElement('div');
    this.root.className = 'authgate';
    this.root.innerHTML = LAYOUT;
    document.body.appendChild(this.root);

    this.q<HTMLFormElement>('.auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      void this.submit();
    });
    this.root.querySelectorAll<HTMLButtonElement>('.auth-tab').forEach((tab) =>
      tab.addEventListener('click', () => this.setMode(tab.dataset.tab as 'login' | 'register')),
    );
    this.q<HTMLButtonElement>('.auth-guest').addEventListener('click', () => {
      this.destroy();
      this.opts.onGuest();
    });

    this.setMode('login');
    setTimeout(() => this.q<HTMLInputElement>('.auth-email').focus(), 60);
  }

  private q<T extends HTMLElement>(sel: string): T {
    return this.root.querySelector(sel) as T;
  }

  private setMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.root.querySelectorAll<HTMLButtonElement>('.auth-tab').forEach((t) =>
      t.classList.toggle('on', t.dataset.tab === mode),
    );
    this.q<HTMLElement>('.auth-family').style.display = mode === 'register' ? '' : 'none';
    this.q<HTMLButtonElement>('.auth-submit').textContent =
      mode === 'register' ? 'สมัคร & เข้าเล่น' : 'เข้าสู่ระบบ';
    this.setError('');
  }

  private setError(msg: string) {
    this.q<HTMLElement>('.auth-err').textContent = msg;
  }

  private async submit() {
    if (this.busy) return;
    const email = this.q<HTMLInputElement>('.auth-email').value.trim();
    const password = this.q<HTMLInputElement>('.auth-pass').value;
    const family = this.q<HTMLInputElement>('.auth-family').value.trim();

    if (!email || !password) return this.setError('กรอกอีเมลและรหัสผ่าน');
    if (this.mode === 'register') {
      if (family.length < 2) return this.setError('ตั้งชื่อ family อย่างน้อย 2 ตัวอักษร');
      if (password.length < 6) return this.setError('รหัสผ่านอย่างน้อย 6 ตัวอักษร');
    }

    this.busy = true;
    const btn = this.q<HTMLButtonElement>('.auth-submit');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'กำลังดำเนินการ…';
    this.setError('');
    try {
      const account =
        this.mode === 'register'
          ? await api.register(email, password, family)
          : await api.login(email, password);
      this.destroy();
      this.opts.onAuthed(account);
    } catch (err) {
      this.setError((err as Error).message || 'ไม่สำเร็จ');
      btn.disabled = false;
      btn.textContent = label;
      this.busy = false;
    }
  }

  destroy() {
    this.root.remove();
  }
}

const LAYOUT = `
  <div class="auth-card panel">
    <h1 class="auth-title">ลานชุมชน 12 หาง</h1>
    <div class="auth-tabs">
      <button class="auth-tab" data-tab="login" type="button">เข้าสู่ระบบ</button>
      <button class="auth-tab" data-tab="register" type="button">สมัคร</button>
    </div>
    <form class="auth-form">
      <input class="auth-email" type="email" autocomplete="email" placeholder="อีเมล" />
      <input class="auth-family" type="text" maxlength="${CONFIG.NAME_MAX_LEN}" placeholder="ชื่อ family เช่น CHXQ (ถาวร)" />
      <input class="auth-pass" type="password" autocomplete="current-password" placeholder="รหัสผ่าน" />
      <div class="auth-err" role="alert"></div>
      <button class="btn btn-primary auth-submit" type="submit">เข้าสู่ระบบ</button>
    </form>
    <button class="btn btn-ghost auth-guest" type="button">เล่นแบบ guest (ไม่บันทึกชื่อ)</button>
    <p class="auth-note">guest เดิน/คุยได้เลย · สมัครเพื่อจองชื่อ family ถาวร + เก็บตัวละคร + ประวัติ</p>
  </div>
`;
