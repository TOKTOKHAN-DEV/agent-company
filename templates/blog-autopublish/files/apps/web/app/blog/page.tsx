import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTags, getRepository } from '@repo/content';

import { formatDate } from '@/lib/markdown';

export const metadata: Metadata = {
  title: '글 목록',
  description: '발행된 모든 글.',
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const published = await getRepository().getPublished();
  const posts = published.filter((post) => !tag || post.tags.includes(tag));
  // Tag counts come from published posts so drafts never leak a tag name.
  const tags = getAllTags(published);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">글 목록</h1>
        <p className="text-[var(--color-muted)]">
          {tag ? `#${tag} · ` : ''}
          {posts.length}개의 글
        </p>
      </header>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full border px-3 py-1 text-sm ${
              tag ? 'border-neutral-200 dark:border-neutral-800' : 'border-[var(--color-accent)] text-[var(--color-accent)]'
            }`}
          >
            전체
          </Link>
          {tags.map(({ tag: name, count }) => (
            <Link
              key={name}
              href={`/blog?tag=${encodeURIComponent(name)}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                tag === name
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              #{name} <span className="text-[var(--color-muted)]">{count}</span>
            </Link>
          ))}
        </div>
      )}

      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="group block space-y-2">
              <h2 className="text-xl font-semibold tracking-tight group-hover:text-[var(--color-accent)]">
                {post.title}
              </h2>
              <p className="leading-7 text-[var(--color-muted)]">{post.description}</p>
              <p className="text-sm text-[var(--color-muted)]">
                {formatDate(post.publishedAt)} · {post.readingTimeMinutes}분 읽기
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && <p className="text-[var(--color-muted)]">조건에 맞는 글이 없습니다.</p>}
    </div>
  );
}
