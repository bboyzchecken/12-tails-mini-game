'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { login } from '@/lib/api/queries';
import { useAuth } from '@/lib/store/auth';

export default function AdminLogin() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await login(email.trim(), password);
      if (res.user.role !== 'admin') {
        setError('บัญชีนี้ไม่มีสิทธิ์แอดมิน');
        return;
      }
      setAuth(res.token, res.user.family_name);
      router.replace('/admin');
    } catch (err) {
      const msg = err instanceof AxiosError ? (err.response?.data?.error as string) : '';
      setError(msg || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={onSubmit} className="panel flex w-full max-w-sm flex-col gap-3 p-7">
        <h1 className="font-head text-2xl text-ink">12Tails · แอดมิน</h1>
        <p className="-mt-2 text-sm text-muted">แดชบอร์ดดีมานด์ (demo) — สำหรับทีมเท่านั้น</p>
        <input
          className="field"
          type="email"
          autoComplete="email"
          placeholder="อีเมลแอดมิน"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="min-h-[18px] text-sm text-danger" role="alert">
          {error}
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </main>
  );
}
