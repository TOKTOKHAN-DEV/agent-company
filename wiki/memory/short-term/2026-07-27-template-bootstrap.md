---
date: 2026-07-27
type: progress
topic: template-bootstrap
tags: [setup, monorepo, agents]
confidence: high
promoted: false
---

# 템플릿 초기 구축

## 무엇

Orca AI Company 템플릿의 뼈대를 세웠다. pnpm workspaces + Turborepo 모노레포에 `apps/web`(블로그),
`apps/admin`(콘텐츠·SEO/GEO·검수), `packages/content`(스키마·IO·감사·JSON-LD)를 구성했다. wiki, memory,
agents, .claude 훅/스킬, scripts를 함께 배치했다.

## 왜

- **콘텐츠를 파일로** — 에이전트에게 파일 IO가 가장 자연스럽고, git diff가 편집 히스토리가 된다 (ADR-0001).
- **감사를 규칙 함수로** — 모델이 자기 결과물을 평가하면 통과 쪽으로 기운다. `auditPost()`는 순수 함수다.
- **admin에 클라이언트 상태 없음** — 서버 액션 + 폼으로 충분하다고 판단. 운영 도구에 SPA 복잡도가 불필요.
- **파일 IO를 `@orca/content` 한 곳에 가둠** — 에이전트가 검증을 우회할 경로를 없애기 위해.

## 영향

- 프론트매터 필드를 추가하려면 `schema.ts` → admin 폼 → `audit.ts` 세 곳을 함께 고쳐야 한다.
- `packages/content`는 빌드 스텝이 없다. 원시 TS를 export하고 앱이 `transpilePackages`로 가져간다.
- 두 앱 모두 레포 루트의 `content/`를 읽는다. 경로 해석은 `paths.ts`의 `findRepoRoot()`가 담당.

## 이어서 할 일

- 콘텐츠 파이프라인을 실제 글 1편으로 끝까지 돌려보기
  (plan-post → write-draft → optimize-seo-geo → review-and-submit)
- 배포 대상 결정 (미정)

## 관련

- `packages/content/src/audit.ts`
- `wiki/decisions/ADR-0001-file-based-content.md`
