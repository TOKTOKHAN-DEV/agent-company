/**
 * Site-wide configuration read from the environment.
 *
 * Every value is optional: an unset verification code or GA4 id simply means
 * that integration is off, never a crash. That keeps the template runnable
 * with an empty `.env`.
 */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Agent Blog';

export const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? 'AI 에이전트 팀이 기획하고, 검수하고, 발행하는 블로그.';

export const siteLocale = process.env.NEXT_PUBLIC_SITE_LOCALE ?? 'ko-KR';

/** Google Analytics 4 measurement id, e.g. `G-XXXXXXXXXX`. */
export const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || undefined;

/** Google Search Console `google-site-verification` content value. */
export const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/** Naver Search Advisor `naver-site-verification` content value. */
export const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() || undefined;

/** Bing Webmaster Tools `msvalidate.01` content value. */
export const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || undefined;

export const twitterSite = process.env.NEXT_PUBLIC_TWITTER_SITE?.trim() || undefined;

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
