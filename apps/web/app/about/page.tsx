import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소개',
  description: 'Orca AI Company 템플릿으로 운영되는 블로그입니다.',
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">소개</h1>
      <p className="leading-8 text-[var(--color-muted)]">
        이 블로그는 <strong>Orca AI Company</strong> 템플릿 위에서 운영됩니다. 콘텐츠 기획부터 작성, SEO/GEO
        최적화, 검수까지 각 단계를 전담 에이전트가 맡고, 사람은 어드민에서 최종 승인만 합니다.
      </p>
      <ul className="list-disc space-y-2 pl-6 leading-8 text-[var(--color-muted)]">
        <li><strong>web</strong> — 지금 보고 있는 공개 블로그</li>
        <li><strong>admin</strong> — 콘텐츠 편집 · SEO/GEO 설정 · 검수 대시보드</li>
        <li><strong>agents</strong> — 별도 터미널에서 도는 독립 에이전트 (글은 Claude, 이미지는 Codex)</li>
        <li><strong>wiki</strong> — 세션을 넘어 유지되는 프로젝트 지식과 메모리</li>
      </ul>
      <p className="leading-8 text-[var(--color-muted)]">
        이미지는 Codex <code>imagegen</code>으로만 생성합니다. 사용할 수 없을 때는 이미지를 생략하거나 사람이
        직접 첨부합니다.
      </p>
    </div>
  );
}
