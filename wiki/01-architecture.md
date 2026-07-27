# 01 — 아키텍처

## 모노레포 레이아웃

```
orca-ai-company/
├── apps/
│   ├── web/          @orca/web    :3000  공개 블로그
│   └── admin/        @orca/admin  :3001  운영 도구 (noindex)
├── packages/
│   ├── content/      @orca/content       스키마 · 저장소 드라이버 · 감사 · JSON-LD
│   └── supabase/     @orca/supabase      클라이언트 · 스토리지 · 마이그레이션
├── content/posts/    마크다운 글 (진실 공급원)
├── agents/           독립 실행 에이전트
│   ├── registry.yaml     런타임 · 모델 · 권한
│   ├── blog-writer/      AGENT.md + skills/  (claude · opus)
│   └── image-maker/      AGENT.md + skills/  (codex)
├── wiki/             프로젝트 지식 + memory/
├── .claude/          hooks · skills (슬래시 커맨드)
└── scripts/          결정적 셸 스크립트 (run-agent.sh 포함)
```

빌드 오케스트레이션은 Turborepo, 패키지 매니저는 pnpm workspaces입니다.

## 데이터 흐름

```
                  ┌──────────────────────┐
   에이전트 ─────▶ │  content/posts/*.md  │ ◀───── admin 편집기 (서버 액션)
   (파일 쓰기)     └──────────┬───────────┘
                             │ parsePost() + zod 검증
                  ┌──────────▼───────────┐
                  │   @orca/content      │
                  │  schema / posts /    │
                  │  audit / jsonld      │
                  └────┬────────────┬────┘
                       │            │
              published만│            │전체 + 감사 결과
                  ┌────▼────┐  ┌────▼──────┐
                  │  web    │  │  admin    │
                  │  :3000  │  │  :3001    │
                  └─────────┘  └───────────┘
```

핵심: **web과 admin은 같은 파일을 읽습니다.** 동기화 계층이 없으므로 불일치가 생길 수 없습니다.

## 경계 규칙

| 경계 | 규칙 |
| --- | --- |
| `web` → 콘텐츠 | 읽기 전용. `status: published` 이고 `noindex: false` 인 글만. |
| `admin` → 콘텐츠 | 읽기/쓰기. 모든 상태 접근 가능. |
| 에이전트 → 콘텐츠 | 쓰기 가능하지만 `status: published` 로는 **절대** 쓰지 않는다. |
| 앱 → 파일시스템 | 직접 `fs` 호출 금지. 반드시 `@orca/content` 를 경유. |

`@orca/content`가 유일한 파일 IO 지점인 이유: 검증·감사·경로 해석이 한 곳에 모여 있어야 에이전트가 우회로를
만들 수 없습니다.

## `@orca/content` 모듈

| 파일 | 책임 |
| --- | --- |
| `schema.ts` | zod 스키마. 프론트매터의 계약. `ImageSource`에 `claude`가 없다는 점이 이미지 정책의 코드 레벨 강제. |
| `repo/` | 저장소 드라이버. `file`(기본) / `supabase`(키가 있으면). 앱 코드는 인터페이스만 봅니다 → [07-supabase.md](./07-supabase.md) |
| `paths.ts` | `pnpm-workspace.yaml`을 찾아 레포 루트 기준으로 경로 해석. 앱이 어느 디렉터리에서 돌든 동일. |
| `posts.ts` | 읽기/쓰기/삭제, 슬러그 생성, 태그 집계. 잘못된 파일은 삼키지 않고 에러로 보고. |
| `audit.ts` | 결정적 발행 게이트. error 1개 = 발행 불가. |
| `jsonld.ts` | BlogPosting · FAQPage 구조화 데이터 생성. |

이 패키지는 빌드 스텝이 없습니다. 원시 TypeScript를 export하고 두 앱이 `transpilePackages`로 가져갑니다.

## 렌더링 전략

- **web** — 기본 정적. `generateStaticParams()`로 발행 글을 프리렌더. 콘텐츠가 파일이므로 빌드 타임에 전부 확정.
- **admin** — 전 페이지 `dynamic = 'force-dynamic'`. 파일 시스템 상태를 항상 최신으로 봐야 함.

## 확장 지점

| 하고 싶은 것 | 건드릴 곳 |
| --- | --- |
| 프론트매터 필드 추가 | `packages/content/src/schema.ts` → admin 폼 → audit 규칙 (jsonb 컬럼이라 마이그레이션 불필요) |
| 저장소를 DB 로 교체 | `.env` 에 Supabase 키 + 마이그레이션. 앱 코드 변경 없음 |
| 검수 규칙 추가 | `packages/content/src/audit.ts` (규칙만 추가, 모델 호출 금지) |
| 에이전트에 새 단계 추가 | `agents/<id>/skills/` 에 SKILL.md 추가 (등록 불필요, 런처가 스캔) |
| 새 에이전트 추가 | `/create-agent` — 런타임이 다르거나 진짜 병렬일 때만 |
| 도메인 교체 | `packages/content` 스키마 + `agents/` 페르소나 |
