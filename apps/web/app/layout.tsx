import type { Metadata } from 'next';
import Link from 'next/link';

import { Analytics } from '@/components/Analytics';
import {
  bingVerification,
  googleVerification,
  naverVerification,
  siteDescription,
  siteLocale,
  siteName,
  siteUrl,
  twitterSite,
} from '@/lib/site';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: 'website',
    siteName,
    locale: siteLocale.replace('-', '_'),
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    ...(twitterSite ? { site: twitterSite } : {}),
  },
  // Search Console / Search Advisor ownership. Each is emitted only when the
  // corresponding env var is set, so an empty .env ships no stray meta tags.
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
  },
  alternates: {
    canonical: siteUrl,
    types: { 'application/rss+xml': `${siteUrl}/rss.xml` },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteLocale.split('-')[0]}>
      <head>
        {/* Naver Search Advisor has no first-class slot in Next's metadata API. */}
        {naverVerification && <meta name="naver-site-verification" content={naverVerification} />}
        {/* Points LLM crawlers at the machine-readable site summary. */}
        <link rel="llms" href={`${siteUrl}/llms.txt`} />
      </head>
      <body className="min-h-dvh">
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {siteName}
            </Link>
            <div className="flex gap-6 text-sm text-[var(--color-muted)]">
              <Link href="/blog" className="hover:text-[var(--color-accent)]">
                글
              </Link>
              <Link href="/about" className="hover:text-[var(--color-accent)]">
                소개
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>

        <footer className="border-t border-neutral-200 py-10 text-center text-sm text-[var(--color-muted)] dark:border-neutral-800">
          Built with Orca AI Company · 콘텐츠는 에이전트가 작성하고 사람이 검수합니다.
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
