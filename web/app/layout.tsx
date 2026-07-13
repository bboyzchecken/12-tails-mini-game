import type { Metadata } from 'next';
import { Mitr, Sarabun } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

// Self-hosted via next/font (no runtime Google Fonts request → no visitor-IP
// leak to Google, and it works with the static export → Cloudflare Pages).
// Exposed as CSS variables consumed by tailwind.config.ts fontFamily.
const head = Mitr({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-head',
  display: 'swap',
});
const body = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://12tails.example'), // real domain set in Phase 6 (deploy)
  title: 'ลานชุมชน 12 หาง — เว็บแชทสำหรับแฟนเกม',
  description:
    'เลือกตัวละครจาก 12 เผ่า เดินเล่นในแมพ แชทลอยเหนือหัว และ emote พร้อมเสียง — พื้นที่ให้แฟนเกม 12 หางออนไลน์มาแฮงก์เอาต์ด้วยกัน (fan project)',
  applicationName: 'ลานชุมชน 12 หาง',
  openGraph: {
    title: 'ลานชุมชน 12 หาง — เว็บแชทสำหรับแฟนเกม',
    description: 'กลับมาเจอเพื่อนเก่าในลานชุมชน 12 หาง · fan project',
    type: 'website',
    locale: 'th_TH',
    images: [{ url: '/hero-key-art.jpg', width: 1280, height: 600, alt: 'อาร์ต 12 หางออนไลน์' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ลานชุมชน 12 หาง — เว็บแชทสำหรับแฟนเกม',
    description: 'กลับมาเจอเพื่อนเก่าในลานชุมชน 12 หาง · fan project',
    images: ['/hero-key-art.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${head.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
