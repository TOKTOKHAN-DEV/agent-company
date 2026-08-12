import type { Metadata } from 'next';
import Link from 'next/link';
import { describeBackend } from '@repo/content';

import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Admin',
  description: '콘텐츠 · SEO/GEO · 검수 대시보드',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const backend = describeBackend();

  return (
    <html lang="ko">
      <body className="min-h-dvh">
        {/* The demo state is a supported state, not a warning — but it must be
            visible so nobody assumes writes are hitting a database. */}
        <div
          className={`px-6 py-2 text-center text-xs ${
            backend.driver === 'supabase'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-amber-50 text-amber-900'
          }`}
        >
          <strong>{backend.driver === 'supabase' ? 'Supabase' : '파일 기반'}</strong> · {backend.message}
        </div>
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Agent <span className="text-neutral-400">Admin</span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-neutral-600 hover:text-neutral-900">
                콘텐츠
              </Link>
              <Link href="/seo" className="text-neutral-600 hover:text-neutral-900">
                SEO/GEO
              </Link>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900"
              >
                사이트 보기 ↗
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
