import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Answer-engine crawlers are explicitly allowed — GEO depends on them being
 * able to read the page they might cite. Blocking them while chasing
 * "AI citations" is the most common self-inflicted GEO failure.
 *
 * Naver (Yeti) and Daum are listed explicitly because the Korean market is a
 * primary target; they respect robots.txt but are conservative by default.
 */
const ANSWER_ENGINE_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
];

const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'Yeti', 'Daumoa', 'NaverBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The admin app is a separate origin, but block the path defensively
        // in case both are ever served from one domain.
        disallow: ['/api/', '/admin/'],
      },
      { userAgent: SEARCH_BOTS, allow: '/' },
      { userAgent: ANSWER_ENGINE_BOTS, allow: '/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
