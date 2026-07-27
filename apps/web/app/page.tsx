import Link from 'next/link';
import { getRepository } from '@orca/content';

import { formatDate } from '@/lib/markdown';

export default async function HomePage() {
  const posts = await getRepository().getPublished();
  const [featured, ...rest] = posts;

  return (
    <div className="space-y-14">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AI 팀이 만드는 블로그</h1>
        <p className="text-lg leading-8 text-[var(--color-muted)]">
          기획 · 작성 · SEO/GEO 최적화 · 검수까지, 에이전트 팀이 파이프라인으로 굴립니다.
        </p>
      </section>

      {featured ? (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            최신 글
          </h2>
          <article className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
            <Link href={`/blog/${encodeURIComponent(featured.slug)}`} className="block space-y-3">
              <h3 className="text-2xl font-semibold tracking-tight">{featured.title}</h3>
              <p className="leading-7 text-[var(--color-muted)]">{featured.description}</p>
              <p className="text-sm text-[var(--color-muted)]">
                {formatDate(featured.publishedAt)} · {featured.readingTimeMinutes}분 읽기
              </p>
            </Link>
          </article>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="font-medium">아직 발행된 글이 없습니다.</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">pnpm dev:admin</code> 으로
            어드민을 열어 초안을 발행하거나,{' '}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">pnpm agent blog-writer</code> 를
            실행해 보세요.
          </p>
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">더 보기</h2>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {rest.map((post) => (
              <li key={post.slug} className="py-5">
                <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="group block space-y-1">
                  <h3 className="font-semibold group-hover:text-[var(--color-accent)]">{post.title}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">{post.description}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatDate(post.publishedAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
