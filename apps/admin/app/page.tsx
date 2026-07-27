import Link from 'next/link';
import { auditPost, getRepository } from '@orca/content';

import { createPostAction } from './actions';
import { ScoreBadge, StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { posts, errors } = await getRepository().getAll();
  const audits = new Map(posts.map((post) => [post.slug, auditPost(post)]));

  const counts = {
    total: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    inReview: posts.filter((p) => p.status === 'in_review').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">콘텐츠</h1>
          <p className="mt-1 text-sm text-neutral-500">
            전체 {counts.total} · 초안 {counts.draft} · 검수 중 {counts.inReview} · 발행 {counts.published}
          </p>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">프론트매터 오류가 있는 파일이 있습니다:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error} className="whitespace-pre-wrap font-mono text-xs">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={createPostAction} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label className="label" htmlFor="title">
            새 글 제목
          </label>
          <input id="title" name="title" className="field" placeholder="예: Next.js 16 캐시 컴포넌트 완전 정복" required />
        </div>
        <div className="w-48">
          <label className="label" htmlFor="slug">
            슬러그 (선택)
          </label>
          <input id="slug" name="slug" className="field" placeholder="자동 생성" />
        </div>
        <div className="w-48">
          <label className="label" htmlFor="author">
            작성자
          </label>
          <input id="author" name="author" className="field" defaultValue="blog-writer" />
        </div>
        <button type="submit" className="btn-primary">
          초안 만들기
        </button>
      </form>

      {/* `overflow-x-auto`, not `overflow-hidden`: a wide table should scroll
          inside its container rather than have columns silently clipped. */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-semibold">제목</th>
              <th className="px-5 py-3 font-semibold">상태</th>
              <th className="px-5 py-3 font-semibold">점수</th>
              <th className="px-5 py-3 font-semibold">작성자</th>
              <th className="px-5 py-3 font-semibold">수정일</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {posts.map((post) => {
              const audit = audits.get(post.slug)!;
              return (
                <tr key={post.slug} className="hover:bg-neutral-50">
                  <td className="px-5 py-4">
                    <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="font-medium hover:text-[var(--color-accent)]">
                      {post.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-neutral-400">{post.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-5 py-4">
                    <ScoreBadge score={audit.score} />
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{post.author}</td>
                  <td className="px-5 py-4 text-neutral-500 tabular-nums">{post.updatedAt.slice(0, 10)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/review/${encodeURIComponent(post.slug)}`} className="text-[var(--color-accent)] hover:underline">
                      검수
                    </Link>
                  </td>
                </tr>
              );
            })}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-neutral-500">
                  아직 글이 없습니다. 위에서 초안을 만들어 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
