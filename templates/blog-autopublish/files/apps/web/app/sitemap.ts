import type { MetadataRoute } from 'next';
import { getRepository } from '@repo/content';

import { siteUrl } from '@/lib/site';

/**
 * Sitemap driven by per-post frontmatter.
 *
 * `changefreq` and `priority` are editorial decisions (set in the admin
 * technical SEO panel), not constants — cornerstone content should outrank
 * an archive note in the crawl budget.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getRepository().getPublished();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: post.seo.changefreq,
    priority: post.seo.priority,
    ...(post.seo.alternates.length > 0
      ? {
          alternates: {
            languages: Object.fromEntries(
              post.seo.alternates.map((alternate) => [alternate.hreflang, alternate.href]),
            ),
          },
        }
      : {}),
  }));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    ...postEntries,
  ];
}
