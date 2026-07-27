import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auditPost, getRepository } from '@orca/content';

import { deletePostAction, savePostAction } from '@/app/actions';
import { Editor } from '@/components/Editor';
import { Select } from '@/components/Select';
import { ScoreBadge, StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

const EXTRA_ROWS = 2; // blank rows so repeatable fields can grow without client JS

const STATUS_OPTIONS = [
  { value: 'draft', label: '초안', description: '작성 중' },
  { value: 'in_review', label: '검수 중', description: '사람 검토 대기' },
  { value: 'scheduled', label: '예약', description: '발행일 이후 공개' },
  { value: 'published', label: '발행', description: '공개 사이트에 노출' },
  { value: 'archived', label: '보관', description: '목록에서 제외' },
];

const CHANGEFREQ_OPTIONS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(
  (value) => ({ value, label: value }),
);

const PRIORITY_OPTIONS = [
  { value: '1', label: '1.0', description: '홈 · 최상위 랜딩' },
  { value: '0.9', label: '0.9', description: '핵심 코너스톤 글' },
  { value: '0.7', label: '0.7', description: '일반 글 (기본값)' },
  { value: '0.5', label: '0.5', description: '보조 · 아카이브' },
  { value: '0.3', label: '0.3', description: '낮은 우선순위' },
];

export default async function PostEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getRepository().getBySlug(decodeURIComponent(slug));
  if (!post) notFound();

  const audit = auditPost(post);
  const faqRows = [...post.geo.faq, ...Array.from({ length: EXTRA_ROWS }, () => ({ question: '', answer: '' }))];
  const citationRows = [
    ...post.geo.citations,
    ...Array.from({ length: EXTRA_ROWS }, () => ({ title: '', url: '' })),
  ];
  const alternateRows = [
    ...post.seo.alternates,
    ...Array.from({ length: EXTRA_ROWS }, () => ({ hreflang: '', href: '' })),
  ];

  return (
    <form action={savePostAction} className="space-y-8">
      <input type="hidden" name="slug" value={post.slug} />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 목록
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{post.title}</h1>
          <StatusBadge status={post.status} />
          <ScoreBadge score={audit.score} />
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/review/${encodeURIComponent(post.slug)}`} className="btn-secondary">
            검수 화면
          </Link>
          <button type="submit" className="btn-primary">
            저장
          </button>
        </div>
      </header>

      {/* `min-w-0` keeps a wide child (tiptap code blocks, long URLs) from
          stretching the 1fr track past the page container — grid items
          default to `min-width: auto`. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Body ────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">본문</h2>
            <div>
              <label className="label" htmlFor="title">제목</label>
              <input id="title" name="title" className="field" defaultValue={post.title} />
            </div>
            <div>
              <label className="label" htmlFor="description">설명</label>
              <textarea id="description" name="description" rows={2} className="field" defaultValue={post.description} />
            </div>
            <div>
              <span className="label">에디터</span>
              <Editor name="body" defaultValue={post.body} slug={post.slug} />
            </div>
          </section>

          {/* ── GEO ───────────────────────────────────────── */}
          <section className="card space-y-4">
            <div>
              <h2 className="font-semibold">GEO — 생성형 엔진 최적화</h2>
              <p className="mt-1 text-xs text-neutral-500">
                답변 엔진이 이 글을 인용할 때 추출하는 구조화 데이터입니다. FAQ는 JSON-LD로 렌더링됩니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="geoLocale">로케일</label>
                <input id="geoLocale" name="geoLocale" className="field" defaultValue={post.geo.locale} />
              </div>
              <div>
                <label className="label" htmlFor="geoTargetMarkets">타깃 마켓 (쉼표 구분)</label>
                <input
                  id="geoTargetMarkets"
                  name="geoTargetMarkets"
                  className="field"
                  defaultValue={post.geo.targetMarkets.join(', ')}
                  placeholder="KR, US"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="geoAnswerSummary">추출용 요약</label>
              <textarea
                id="geoAnswerSummary"
                name="geoAnswerSummary"
                rows={3}
                className="field"
                defaultValue={post.geo.answerSummary ?? ''}
                placeholder="답변 엔진이 그대로 인용할 수 있는 2~3문장. 결론부터 쓰세요."
              />
            </div>
            <div>
              <label className="label" htmlFor="geoEntities">엔티티 (쉼표 구분)</label>
              <input
                id="geoEntities"
                name="geoEntities"
                className="field"
                defaultValue={post.geo.entities.join(', ')}
                placeholder="Next.js, Vercel, App Router"
              />
            </div>

            <div className="space-y-3">
              <p className="label mb-0">FAQ</p>
              {faqRows.map((row, index) => (
                <div key={`faq-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                  <input name="faqQuestion" className="field" defaultValue={row.question} placeholder="질문" />
                  <input name="faqAnswer" className="field" defaultValue={row.answer} placeholder="답변" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="label mb-0">인용 출처</p>
              {citationRows.map((row, index) => (
                <div key={`cite-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                  <input name="citationTitle" className="field" defaultValue={row.title} placeholder="자료 제목" />
                  <input name="citationUrl" className="field" defaultValue={row.url} placeholder="https://" />
                </div>
              ))}
            </div>
          </section>

          {/* ── Technical SEO ─────────────────────────────── */}
          <section className="card space-y-4">
            <div>
              <h2 className="font-semibold">테크니컬 SEO</h2>
              <p className="mt-1 text-xs text-neutral-500">
                모두 크롤러가 실제로 읽는 값입니다 — 메타 태그, link rel, 사이트맵 필드, robots 지시어.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="seoCanonical">Canonical URL</label>
              <input
                id="seoCanonical"
                name="seoCanonical"
                className="field"
                defaultValue={post.seo.canonical ?? ''}
                placeholder="비우면 자동 생성 · 다른 곳에도 실렸다면 원본 절대 URL"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
                <input type="checkbox" name="seoNoindex" defaultChecked={post.seo.noindex} className="mt-0.5 size-4" />
                <span>
                  <span className="font-medium">noindex</span>
                  <span className="block text-xs text-neutral-500">색인에서 제외</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
                <input type="checkbox" name="seoNofollow" defaultChecked={post.seo.nofollow} className="mt-0.5 size-4" />
                <span>
                  <span className="font-medium">nofollow</span>
                  <span className="block text-xs text-neutral-500">링크를 따라가지 않음</span>
                </span>
              </label>
            </div>

            <div>
              <label className="label" htmlFor="seoRobotsDirectives">robots 추가 지시어 (쉼표 구분)</label>
              <input
                id="seoRobotsDirectives"
                name="seoRobotsDirectives"
                className="field"
                defaultValue={post.seo.robotsDirectives.join(', ')}
                placeholder="max-snippet:-1, max-image-preview:large, max-video-preview:-1"
              />
              <p className="mt-1 text-xs text-neutral-500">
                답변 엔진이 인용할 수 있는 분량을 제어합니다. GEO에 직접 영향을 줍니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="seoOgType">og:type</label>
                <Select
                  id="seoOgType"
                  name="seoOgType"
                  defaultValue={post.seo.ogType}
                  options={[
                    { value: 'article', label: 'article', description: '블로그 글' },
                    { value: 'website', label: 'website', description: '랜딩 · 목록' },
                  ]}
                />
              </div>
              <div>
                <label className="label" htmlFor="seoTwitterCard">twitter:card</label>
                <Select
                  id="seoTwitterCard"
                  name="seoTwitterCard"
                  defaultValue={post.seo.twitterCard}
                  options={[
                    { value: 'summary_large_image', label: 'summary_large_image', description: '큰 이미지' },
                    { value: 'summary', label: 'summary', description: '작은 썸네일' },
                  ]}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="seoOgTitle">og:title</label>
                <input id="seoOgTitle" name="seoOgTitle" className="field" defaultValue={post.seo.ogTitle ?? ''} placeholder="비우면 SEO 타이틀 사용" />
              </div>
              <div>
                <label className="label" htmlFor="seoOgImage">og:image</label>
                <input id="seoOgImage" name="seoOgImage" className="field" defaultValue={post.seo.ogImage ?? ''} placeholder="비우면 커버 이미지 사용" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="seoOgDescription">og:description</label>
              <textarea id="seoOgDescription" name="seoOgDescription" rows={2} className="field" defaultValue={post.seo.ogDescription ?? ''} placeholder="비우면 메타 설명 사용" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="seoTwitterSite">twitter:site</label>
                <input id="seoTwitterSite" name="seoTwitterSite" className="field" defaultValue={post.seo.twitterSite ?? ''} placeholder="@사이트계정" />
              </div>
              <div>
                <label className="label" htmlFor="seoTwitterCreator">twitter:creator</label>
                <input id="seoTwitterCreator" name="seoTwitterCreator" className="field" defaultValue={post.seo.twitterCreator ?? ''} placeholder="@작성자계정" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="seoChangefreq">사이트맵 changefreq</label>
                <Select id="seoChangefreq" name="seoChangefreq" defaultValue={post.seo.changefreq} options={CHANGEFREQ_OPTIONS} />
              </div>
              <div>
                <label className="label" htmlFor="seoPriority">사이트맵 priority</label>
                <Select id="seoPriority" name="seoPriority" defaultValue={String(post.seo.priority)} options={PRIORITY_OPTIONS} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="label mb-0">hreflang 대체 URL</p>
              {alternateRows.map((row, index) => (
                <div key={`alt-${index}`} className="grid gap-2 sm:grid-cols-[200px_1fr]">
                  <input name="altHreflang" className="field" defaultValue={row.hreflang} placeholder="en · ko-KR · x-default" />
                  <input name="altHref" className="field" defaultValue={row.href} placeholder="https://example.com/en/post" />
                </div>
              ))}
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
              <input type="checkbox" name="seoLlmsTxt" defaultChecked={post.seo.llmsTxt} className="mt-0.5 size-4" />
              <span>
                <span className="font-medium">llms.txt 에 포함</span>
                <span className="block text-xs text-neutral-500">
                  LLM이 사이트를 이해할 때 읽는 목록에 이 글을 넣습니다.
                </span>
              </span>
            </label>
          </section>
        </div>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">발행</h2>
            <div>
              <label className="label" htmlFor="status">상태</label>
              <Select id="status" name="status" defaultValue={post.status} options={STATUS_OPTIONS} />
            </div>
            <div>
              <label className="label" htmlFor="author">작성자</label>
              <input id="author" name="author" className="field" defaultValue={post.author} />
            </div>
            <div>
              <label className="label" htmlFor="category">카테고리</label>
              <input id="category" name="category" className="field" defaultValue={post.category} />
            </div>
            <div>
              <label className="label" htmlFor="tags">태그 (쉼표 구분)</label>
              <input id="tags" name="tags" className="field" defaultValue={post.tags.join(', ')} />
            </div>
            <div>
              <span className="label">슬러그</span>
              <p className="rounded-lg bg-neutral-50 px-3 py-2 font-mono text-xs break-all">{post.slug}</p>
              <p className="mt-1 text-xs text-neutral-500">
                URL에 키워드가 남도록 자연어 슬러그를 권장합니다. 변경하려면 새 글로 만드세요 —
                기존 URL이 깨집니다.
              </p>
            </div>
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold">검색 결과 표시</h2>
            <div>
              <label className="label" htmlFor="seoTitle">
                타이틀 <span className="normal-case text-neutral-400">≤60자</span>
              </label>
              <input id="seoTitle" name="seoTitle" className="field" defaultValue={post.seo.title ?? ''} />
            </div>
            <div>
              <label className="label" htmlFor="seoDescription">
                메타 설명 <span className="normal-case text-neutral-400">≤160자</span>
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                rows={3}
                className="field"
                defaultValue={post.seo.description ?? ''}
              />
            </div>
            <div>
              <label className="label" htmlFor="seoKeywords">키워드 (쉼표 구분)</label>
              <input id="seoKeywords" name="seoKeywords" className="field" defaultValue={post.seo.keywords.join(', ')} />
            </div>
          </section>

          <section className="card space-y-4">
            <div>
              <h2 className="font-semibold">커버 이미지</h2>
              <p className="mt-1 text-xs text-neutral-500">
                생성은 Codex <code className="font-mono">imagegen</code> 전용입니다.{' '}
                <code className="font-mono">pnpm imagegen</code> 실행 후 경로가 자동으로 채워집니다.
                본문 이미지는 에디터에서 직접 업로드하세요.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="coverSrc">경로</label>
              <input
                id="coverSrc"
                name="coverSrc"
                className="field"
                defaultValue={post.cover?.src ?? ''}
                placeholder="/images/posts/my-post.png"
              />
            </div>
            <div>
              <label className="label" htmlFor="coverAlt">대체 텍스트</label>
              <input id="coverAlt" name="coverAlt" className="field" defaultValue={post.cover?.alt ?? ''} />
            </div>
            <div>
              <label className="label" htmlFor="coverSource">출처</label>
              <Select
                id="coverSource"
                name="coverSource"
                defaultValue={post.cover?.source ?? 'user-upload'}
                options={[
                  { value: 'codex-imagegen', label: 'Codex imagegen', description: '유일하게 허용된 생성 경로' },
                  { value: 'user-upload', label: '사용자 업로드', description: '사람이 첨부' },
                  { value: 'web-search', label: '웹 검색', description: '라이선스 기록 필수' },
                  { value: 'none', label: '없음', description: '발행 차단됨' },
                ]}
              />
            </div>
            <div>
              <label className="label" htmlFor="coverOrigin">프롬프트 / 원본 URL</label>
              <input id="coverOrigin" name="coverOrigin" className="field" defaultValue={post.cover?.origin ?? ''} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="coverCredit">크레딧</label>
                <input id="coverCredit" name="coverCredit" className="field" defaultValue={post.cover?.credit ?? ''} />
              </div>
              <div>
                <label className="label" htmlFor="coverLicense">라이선스</label>
                <input id="coverLicense" name="coverLicense" className="field" defaultValue={post.cover?.license ?? ''} />
              </div>
            </div>
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold text-red-700">위험 구역</h2>
            <button
              type="submit"
              formAction={deletePostAction}
              className="btn w-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            >
              이 글 삭제
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
