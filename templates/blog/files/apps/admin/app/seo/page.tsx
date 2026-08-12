import Link from 'next/link';
import { auditPost, getRepository } from '@repo/content';

import { ScoreBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

const LANE_LABEL = {
  seo: 'SEO',
  geo: 'GEO',
  images: '이미지',
  editorial: '에디토리얼',
} as const;

export default async function SeoOverviewPage() {
  const { posts } = await getRepository().getAll();
  const audits = posts.map((post) => ({ post, audit: auditPost(post) }));

  const byLane = new Map<string, number>();
  for (const { audit } of audits) {
    for (const issue of audit.issues) {
      if (issue.severity === 'info') continue;
      byLane.set(issue.lane, (byLane.get(issue.lane) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">SEO / GEO 상태</h1>
        <p className="mt-1 text-sm text-neutral-500">
          GEO는 Generative Engine Optimization — 답변 엔진이 인용할 수 있는 구조화 신호를 뜻합니다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        {(Object.keys(LANE_LABEL) as (keyof typeof LANE_LABEL)[]).map((lane) => (
          <div key={lane} className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{LANE_LABEL[lane]}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{byLane.get(lane) ?? 0}</p>
            <p className="mt-1 text-xs text-neutral-500">해결해야 할 항목</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {audits.map(({ post, audit }) => (
          <div key={post.slug} className="card space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="font-semibold hover:text-[var(--color-accent)]">
                {post.title}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">
                  FAQ {post.geo.faq.length} · 인용 {post.geo.citations.length} · 키워드 {post.seo.keywords.length}
                </span>
                <ScoreBadge score={audit.score} />
              </div>
            </div>
            {audit.issues.length === 0 ? (
              <p className="text-sm text-emerald-700">문제 없음.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {audit.issues.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`} className="flex gap-2">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        issue.severity === 'error'
                          ? 'bg-red-100 text-red-700'
                          : issue.severity === 'warn'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {LANE_LABEL[issue.lane]}
                    </span>
                    <span className="text-neutral-700">
                      <code className="font-mono text-xs text-neutral-500">{issue.field}</code> — {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {audits.length === 0 && <p className="text-neutral-500">분석할 글이 없습니다.</p>}
      </div>
    </div>
  );
}
