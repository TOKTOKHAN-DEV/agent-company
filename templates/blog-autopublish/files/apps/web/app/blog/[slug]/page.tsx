import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPostingJsonLd, faqJsonLd, getRepository, postUrl } from '@repo/content';

import { formatDate, renderMarkdown } from '@/lib/markdown';
import { absoluteUrl, twitterSite } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getRepository().getPublished();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getRepository().getBySlug(decodeURIComponent(slug));
  if (!post) return {};

  const { seo, geo } = post;
  const title = seo.title ?? post.title;
  const description = seo.description ?? post.description;
  const image = seo.ogImage ?? post.cover?.src;
  const absoluteImage = image ? absoluteUrl(image) : undefined;

  // Extra robots directives (max-snippet, max-image-preview, …) control how
  // much an answer engine may quote — a direct GEO lever.
  const extraDirectives = Object.fromEntries(
    seo.robotsDirectives
      .map((directive) => directive.split(':'))
      .filter((parts): parts is [string, string] => parts.length === 2)
      .map(([key, value]) => [key.trim(), value.trim()]),
  );

  return {
    title,
    description,
    keywords: seo.keywords,
    authors: [{ name: post.author }],
    category: post.category,
    alternates: {
      canonical: seo.canonical ?? postUrl(post.slug),
      ...(seo.alternates.length > 0
        ? {
            languages: Object.fromEntries(
              seo.alternates.map((alternate) => [alternate.hreflang, alternate.href]),
            ),
          }
        : {}),
    },
    robots: {
      index: !seo.noindex,
      follow: !seo.nofollow,
      googleBot: {
        index: !seo.noindex,
        follow: !seo.nofollow,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        ...extraDirectives,
      },
    },
    openGraph: {
      type: seo.ogType,
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      url: postUrl(post.slug),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      section: post.category,
      locale: geo.locale.replace('-', '_'),
      ...(absoluteImage ? { images: [{ url: absoluteImage, alt: post.cover?.alt ?? title }] } : {}),
    },
    twitter: {
      card: seo.twitterCard,
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      ...(seo.twitterSite ?? twitterSite ? { site: seo.twitterSite ?? twitterSite } : {}),
      ...(seo.twitterCreator ? { creator: seo.twitterCreator } : {}),
      ...(absoluteImage ? { images: [absoluteImage] } : {}),
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getRepository().getBySlug(decodeURIComponent(slug));

  // Drafts and in-review posts are invisible to the public site.
  if (!post || post.status !== 'published') notFound();

  const faq = faqJsonLd(post);

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        // JSON-LD is generated from validated frontmatter, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd(post)) }}
      />
      {faq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      )}

      <header className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">
          <time dateTime={post.publishedAt ?? post.createdAt}>
            {formatDate(post.publishedAt, post.geo.locale)}
          </time>{' '}
          · {post.readingTimeMinutes}분 읽기 · {post.author}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight">{post.title}</h1>
        <p className="text-lg leading-8 text-[var(--color-muted)]">{post.description}</p>
      </header>

      {post.cover && (
        <figure className="space-y-2">
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            width={post.cover.width ?? 1200}
            height={post.cover.height ?? 630}
            className="w-full rounded-2xl object-cover"
            priority
          />
          {post.cover.credit && (
            <figcaption className="text-xs text-[var(--color-muted)]">{post.cover.credit}</figcaption>
          )}
        </figure>
      )}

      {post.geo.answerSummary && (
        <aside className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            요약
          </p>
          <p className="leading-7">{post.geo.answerSummary}</p>
        </aside>
      )}

      <div
        className="prose-body"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
      />

      {post.geo.faq.length > 0 && (
        <section className="space-y-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold tracking-tight">자주 묻는 질문</h2>
          <dl className="space-y-5">
            {post.geo.faq.map((item) => (
              <div key={item.question} className="space-y-1">
                <dt className="font-semibold">{item.question}</dt>
                <dd className="leading-7 text-[var(--color-muted)]">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {post.geo.citations.length > 0 && (
        <section className="space-y-3 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">참고 자료</h2>
          <ul className="space-y-1 text-sm">
            {post.geo.citations.map((citation) => (
              <li key={citation.url}>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline underline-offset-4"
                >
                  {citation.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {post.tags.length > 0 && (
        <footer className="flex flex-wrap gap-2 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded-full border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800"
            >
              #{tag}
            </Link>
          ))}
        </footer>
      )}
    </article>
  );
}
