import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auditPost, blogPostingJsonLd, faqJsonLd, getRepository } from '@repo/content';

import { saveReviewAction } from '@/app/actions';
import { Select } from '@/components/Select';
import { ScoreBadge, StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

const CHECKLIST = [
  { name: 'checkFactual', label: '사실 확인 — 수치·인용·주장이 출처와 일치' },
  { name: 'checkTone', label: '톤앤매너 — wiki/03-content-guidelines.md 준수' },
  { name: 'checkSeo', label: 'SEO — 타이틀/메타/키워드/canonical 확인' },
  { name: 'checkGeo', label: 'GEO — 요약·FAQ·엔티티·인용 확인' },
  { name: 'checkImages', label: '이미지 — 출처가 codex-imagegen 또는 사람이 명시한 값' },
  { name: 'checkLinks', label: '링크 — 내부/외부 링크 동작 확인' },
] as const;

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getRepository().getBySlug(decodeURIComponent(slug));
  if (!post) notFound();

  const audit = auditPost(post);
  const checks = post.review.checks;
  const faq = faqJsonLd(post);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 목록
          </Link>
          <h1 className="text-xl font-bold tracking-tight">검수: {post.title}</h1>
          <StatusBadge status={post.status} />
          <ScoreBadge score={audit.score} />
        </div>
        <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="btn-secondary">
          편집으로
        </Link>
      </header>

      {/* `min-w-0` is load-bearing: a grid item defaults to `min-width: auto`,
          so the JSON-LD <pre> below (single lines of 200+ chars) would stretch
          the 1fr track past the page container instead of scrolling itself. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <section className="card space-y-3">
            <h2 className="font-semibold">자동 검사</h2>
            <p className="text-xs text-neutral-500">
              결정적 규칙 기반입니다. 사람과 <code className="font-mono">content-reviewer</code> 에이전트가 동일한
              결과를 봅니다.
            </p>
            {audit.issues.length === 0 ? (
              <p className="text-sm text-emerald-700">통과 — 발견된 문제 없음.</p>
            ) : (
              <ul className="space-y-2 text-sm">
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
                      {issue.severity}
                    </span>
                    <span className="text-neutral-700">
                      <code className="font-mono text-xs text-neutral-500">{issue.field}</code> — {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className={`text-sm font-medium ${audit.publishable ? 'text-emerald-700' : 'text-red-700'}`}>
              {audit.publishable ? '발행 가능 (error 없음)' : '발행 불가 — error를 먼저 해결하세요.'}
            </p>
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">구조화 데이터 미리보기</h2>
            <pre className="max-h-72 max-w-full overflow-auto rounded-lg bg-neutral-900 p-4 text-xs text-neutral-100">
              {JSON.stringify(blogPostingJsonLd(post), null, 2)}
            </pre>
            {faq && (
              <pre className="max-h-72 max-w-full overflow-auto rounded-lg bg-neutral-900 p-4 text-xs text-neutral-100">
                {JSON.stringify(faq, null, 2)}
              </pre>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">본문 미리보기</h2>
            <pre className="max-h-96 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-neutral-50 p-4 text-sm leading-6">
              {post.body}
            </pre>
          </section>
        </div>

        <form action={saveReviewAction} className="card h-fit min-w-0 space-y-5">
          <input type="hidden" name="slug" value={post.slug} />
          <h2 className="font-semibold">사람 검수</h2>

          <div className="space-y-2.5">
            {CHECKLIST.map((item) => (
              <label key={item.name} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name={item.name}
                  defaultChecked={checks[item.name.replace('check', '').toLowerCase() as keyof typeof checks]}
                  className="mt-0.5 size-4 shrink-0"
                />
                <span className="text-neutral-700">{item.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="reviewer">검수자</label>
            <input id="reviewer" name="reviewer" className="field" defaultValue={post.review.reviewer ?? ''} />
          </div>

          <div>
            <label className="label" htmlFor="notes">메모</label>
            <textarea id="notes" name="notes" rows={4} className="field" defaultValue={post.review.notes ?? ''} />
          </div>

          <div>
            <label className="label" htmlFor="status">상태 변경</label>
            <Select
              id="status"
              name="status"
              defaultValue={post.status}
              options={[
                { value: 'draft', label: '초안으로 되돌리기' },
                { value: 'in_review', label: '검수 중' },
                { value: 'scheduled', label: '예약' },
                {
                  value: 'published',
                  label: '발행',
                  description: audit.publishable ? '공개 사이트에 노출' : 'error 해결 필요',
                  disabled: !audit.publishable,
                },
                { value: 'archived', label: '보관' },
              ]}
            />
          </div>

          {post.review.reviewedAt && (
            <p className="text-xs text-neutral-500">마지막 검수: {post.review.reviewedAt.slice(0, 16).replace('T', ' ')}</p>
          )}

          <button type="submit" className="btn-primary w-full">
            검수 저장
          </button>
        </form>
      </div>
    </div>
  );
}
