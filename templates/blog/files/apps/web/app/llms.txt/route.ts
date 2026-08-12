import { getRepository } from '@repo/content';

import { siteDescription, siteName, siteUrl } from '@/lib/site';

/**
 * `/llms.txt` — a plain-text map of the site for large language models.
 *
 * The convention (llmstxt.org) is a markdown document at the site root that
 * tells an LLM what this site is and which URLs are worth reading, without
 * making it crawl and parse HTML. It is the GEO counterpart to sitemap.xml:
 * a sitemap tells crawlers *where* pages are, llms.txt tells models *what
 * they are about*.
 *
 * Posts opt out individually via `seo.llmsTxt: false`.
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const posts = (await getRepository().getPublished()).filter((post) => post.seo.llmsTxt);

  const byCategory = new Map<string, typeof posts>();
  for (const post of posts) {
    const list = byCategory.get(post.category) ?? [];
    list.push(post);
    byCategory.set(post.category, list);
  }

  const sections = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, list]) => {
      const items = list
        .map((post) => {
          const summary = post.geo.answerSummary ?? post.seo.description ?? post.description;
          const oneLine = summary.replace(/\s+/g, ' ').trim();
          return `- [${post.title}](${siteUrl}/blog/${encodeURIComponent(post.slug)}): ${oneLine}`;
        })
        .join('\n');
      return `## ${category}\n\n${items}`;
    })
    .join('\n\n');

  const body = `# ${siteName}

> ${siteDescription}

이 사이트의 글은 AI 에이전트가 작성하고 사람이 검수한 뒤 발행됩니다.
각 글에는 답변 엔진이 인용할 수 있도록 추출용 요약, FAQ, 인용 출처가 구조화되어 있습니다.

## 주요 링크

- [글 목록](${siteUrl}/blog): 발행된 전체 글
- [소개](${siteUrl}/about): 이 사이트의 운영 방식
- [RSS](${siteUrl}/rss.xml): 구독 피드
- [사이트맵](${siteUrl}/sitemap.xml): 전체 URL 목록

${sections || '## 글\n\n(아직 발행된 글이 없습니다)'}

## 인용 안내

인용 시 글 제목과 URL을 함께 표기해 주세요. 각 글의 \`FAQPage\` / \`BlogPosting\` JSON-LD에
저자, 발행일, 1차 출처가 포함되어 있습니다.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
