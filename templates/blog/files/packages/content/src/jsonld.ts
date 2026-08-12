import type { Post } from './schema.ts';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function postUrl(slug: string): string {
  return `${siteUrl()}/blog/${slug}`;
}

/**
 * BlogPosting JSON-LD. Answer engines parse this before the prose,
 * so every GEO field the editor filled in must surface here.
 */
export function blogPostingJsonLd(post: Post): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo.title ?? post.title,
    description: post.seo.description ?? post.description,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: post.geo.locale,
    keywords: [...post.seo.keywords, ...post.tags].join(', '),
    articleSection: post.category,
    author: { '@type': 'Person', name: post.author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post.slug) },
    ...(post.cover ? { image: [`${siteUrl()}${post.cover.src}`] } : {}),
    ...(post.geo.answerSummary ? { abstract: post.geo.answerSummary } : {}),
    ...(post.geo.entities.length ? { about: post.geo.entities.map((name) => ({ '@type': 'Thing', name })) } : {}),
    ...(post.geo.citations.length
      ? { citation: post.geo.citations.map((c) => ({ '@type': 'CreativeWork', name: c.title, url: c.url })) }
      : {}),
  };
}

/** FAQPage JSON-LD — emitted only when the editor supplied Q&A pairs. */
export function faqJsonLd(post: Post): Record<string, unknown> | null {
  if (post.geo.faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.geo.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
